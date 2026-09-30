'use client'

import { useEffect, useMemo, useRef, type MutableRefObject, type Ref } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import {
  ACHIEVEMENT_COUNT,
  DIVE,
  PORTAL_OPEN,
  PORTAL_Z,
  activeIndex,
  pullAt,
  cameraZ,
  range,
  stageZ,
} from './portalTimeline'

interface PortalSceneProps {
  progress: MotionValue<number>
  active: boolean
  gateColors: string[]
}

type Speed = MutableRefObject<number>

const PORTAL_R = 1.6
const RED = '#FF3B3B'

const smooth = (t: number) => t * t * (3 - 2 * t)
// Tunnel pieces stay hidden until the dive, or they'd show around the closed portal
const tunnelFade = (p: number) => range(p, DIVE[0] + 0.02, DIVE[1])

/* ── Shaders ── */
const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Spiral vortex; uOpen dissolves it from the centre out so the tunnel shows through
const vortexFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float r = length(uv);
    if (r > 1.0) discard;
    float a = atan(uv.y, uv.x);
    float swirl = a + 2.2 / (r + 0.15) - uTime * 1.2;
    float arms = sin(swirl * 4.0) * 0.5 + 0.5;
    float fine = sin(swirl * 11.0 + r * 20.0 - uTime * 3.0) * 0.5 + 0.5;
    float v = arms * 0.75 + fine * 0.25;
    vec3 col = mix(vec3(0.04, 0.0, 0.01), vec3(0.48, 0.0, 0.0), v);
    col = mix(col, vec3(1.0, 0.23, 0.23), pow(v, 3.0) * smoothstep(1.0, 0.2, r));
    col += vec3(1.0, 0.7, 0.48) * pow(smoothstep(0.5, 0.0, r), 2.0) * 0.9;
    float edge = smoothstep(1.0, 0.9, r);
    float hole = smoothstep(uOpen * 1.1 - 0.15, uOpen * 1.1, r);
    gl_FragColor = vec4(col, edge * hole);
  }
`

// Soft additive glow band around a ring — fakes bloom without a post-processing pass
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uRadius;
  uniform float uWidth;
  varying vec2 vUv;
  void main() {
    float r = length(vUv * 2.0 - 1.0);
    float g = exp(-pow((r - uRadius) / uWidth, 2.0));
    gl_FragColor = vec4(uColor * g * uIntensity, g);
  }
`

function Halo({
  size,
  radius,
  width,
  color,
  materialRef,
}: {
  size: number
  radius: number
  width: number
  color: string
  materialRef?: Ref<THREE.ShaderMaterial>
}) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 1 },
      uRadius: { value: radius },
      uWidth: { value: width },
    }),
    [color, radius, width]
  )
  return (
    <mesh>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={quadVertex}
        fragmentShader={haloFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/* ── Camera: flies down the tunnel, brakes at each card, rolls and widens its lens at speed ── */
function CameraRig({ progress, speedRef }: { progress: MotionValue<number>; speedRef: Speed }) {
  const z = useRef(cameraZ(progress.get()))
  const pointer = useRef({ x: 0, y: 0 })
  const eased = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state, dt) => {
    const camera = state.camera as THREE.PerspectiveCamera
    const delta = Math.min(dt, 0.05)
    const prev = z.current
    z.current = THREE.MathUtils.damp(z.current, cameraZ(progress.get()), 7, delta)
    const v = (prev - z.current) / Math.max(delta, 1e-3)
    speedRef.current = THREE.MathUtils.damp(speedRef.current, Math.abs(v), 6, delta)

    eased.current.x = THREE.MathUtils.damp(eased.current.x, pointer.current.x, 3, delta)
    eased.current.y = THREE.MathUtils.damp(eased.current.y, pointer.current.y, 3, delta)

    camera.position.set(eased.current.x * 0.35, eased.current.y * 0.25, z.current)
    camera.lookAt(eased.current.x * 0.1, eased.current.y * 0.08, z.current - 10)
    camera.rotateZ(THREE.MathUtils.clamp(v * 0.004, -0.25, 0.25))

    const fov = 55 + Math.min(speedRef.current, 45) * 0.45
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}

/* ── The portal: a slit that tears open into a spinning vortex ring ── */

// Random seeds live at module level so renders stay pure
const SPARKS = 220
const SPARK_SEED = Array.from({ length: SPARKS }, () => ({
  a: Math.random() * Math.PI * 2,
  r: PORTAL_R * (1.02 + Math.random() * 0.35),
  s: 0.4 + Math.random() * 1.4,
  z: (Math.random() - 0.5) * 0.3,
}))

// Accretion debris: streams in from the edges of the screen and spirals into the hole.
// Mutable module state — there is only ever one portal on the page
const DEBRIS = 900
const DEBRIS_MAX_R = 11
const DEBRIS_SEED = Array.from({ length: DEBRIS }, () => ({
  a: Math.random() * Math.PI * 2,
  r: PORTAL_R + Math.random() * (DEBRIS_MAX_R - PORTAL_R),
  z: (Math.random() - 0.5) * 0.6,
}))

function Debris({ progress }: { progress: MotionValue<number> }) {
  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.PointsMaterial>(null)
  const positions = useMemo(() => new Float32Array(DEBRIS * 3), [])

  useFrame((_, dt) => {
    const pull = pullAt(progress.get())
    if (material.current) material.current.opacity = Math.min(1, pull * 1.6)
    if (!points.current) return
    points.current.visible = pull > 0.001
    if (!points.current.visible) return
    const delta = Math.min(dt, 0.05)
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < DEBRIS; i++) {
      const d = DEBRIS_SEED[i]
      // Kepler-ish: faster and tighter the closer it gets
      d.a += delta * (3.2 / d.r) * (0.5 + pull)
      d.r -= delta * (0.4 + 2.4 / d.r) * (0.4 + pull * 2.2)
      if (d.r < PORTAL_R * 0.9) {
        d.r = DEBRIS_MAX_R * (0.7 + Math.random() * 0.3)
        d.a = Math.random() * Math.PI * 2
      }
      attr.setXYZ(i, Math.cos(d.a) * d.r, Math.sin(d.a) * d.r * 0.82, d.z)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        color="#FF6A4D"
        size={0.06}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

function Portal({ progress }: { progress: MotionValue<number> }) {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const vortex = useRef<THREE.ShaderMaterial>(null)
  const halo = useRef<THREE.ShaderMaterial | null>(null)
  const sparks = useRef<THREE.Points>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpen: { value: 0 } }), [])
  const sparkPositions = useMemo(() => new Float32Array(SPARKS * 3), [])

  useFrame((state) => {
    const p = progress.get()
    const t = state.clock.elapsedTime
    if (vortex.current) {
      vortex.current.uniforms.uTime.value = t
      vortex.current.uniforms.uOpen.value = smooth(range(p, DIVE[0] + 0.02, DIVE[1] - 0.01))
    }

    // Tear open: a thin horizontal slit first, then it widens into the full ring
    const [o0, o1] = PORTAL_OPEN
    const sx = smooth(range(p, o0, o0 + (o1 - o0) * 0.45))
    const sy = smooth(range(p, o0 + (o1 - o0) * 0.3, o1))
    if (group.current) {
      group.current.scale.set(Math.max(sx, 0.001), Math.max(0.015 + sy * 0.985, 0.001) * Math.max(sx, 0.001), 1)
      group.current.visible = sx > 0.001
    }
    if (ring.current) ring.current.rotation.z = -t * 0.6
    if (halo.current) halo.current.uniforms.uIntensity.value = 0.9 + Math.sin(t * 2.2) * 0.25 + sy * 0.6

    if (!sparks.current) return
    const attr = sparks.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < SPARKS; i++) {
      const s = SPARK_SEED[i]
      const a = s.a + t * s.s * 0.6
      const wobble = Math.sin(t * 3 + i) * 0.04
      attr.setXYZ(i, Math.cos(a) * (s.r + wobble), Math.sin(a) * (s.r + wobble), s.z)
    }
    attr.needsUpdate = true
  })

  return (
    <group position={[0, 0, PORTAL_Z]}>
      <group ref={group}>
        <mesh>
          <planeGeometry args={[PORTAL_R * 2, PORTAL_R * 2]} />
          <shaderMaterial
            ref={vortex}
            vertexShader={quadVertex}
            fragmentShader={vortexFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={ring}>
          <torusGeometry args={[PORTAL_R, 0.045, 16, 160]} />
          <meshBasicMaterial color="#FF6A4D" toneMapped={false} />
        </mesh>
        <Halo size={PORTAL_R * 3.2} radius={PORTAL_R / (PORTAL_R * 1.6)} width={0.09} color={RED} materialRef={halo} />
        <points ref={sparks}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color="#FFB27A"
            size={0.045}
            sizeAttenuation
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  )
}

/* ── Tunnel of thin rings + one gate per achievement in its tier colour ── */
const TUNNEL_RINGS = 26
const TUNNEL_R = 3.4

function Tunnel({ progress, gateColors }: { progress: MotionValue<number>; gateColors: string[] }) {
  const rings = useRef<THREE.InstancedMesh>(null)
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const gates = useRef<(THREE.Group | null)[]>([])
  // One material per gate, shared by its six segments
  const gateMaterials = useMemo(
    () => gateColors.map((color) => new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false })),
    [gateColors]
  )
  useEffect(() => () => gateMaterials.forEach((m) => m.dispose()), [gateMaterials])
  const gateHalos = useRef<(THREE.ShaderMaterial | null)[]>([])

  useEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < TUNNEL_RINGS; i++) {
      m.makeTranslation(0, 0, -3 - i * 3.3)
      rings.current?.setMatrixAt(i, m)
    }
    if (rings.current) rings.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((state) => {
    const p = progress.get()
    const fade = tunnelFade(p)
    const current = activeIndex(p)
    const t = state.clock.elapsedTime

    if (rings.current) {
      rings.current.visible = fade > 0
      rings.current.rotation.z = t * 0.05
    }
    if (ringMaterial.current) ringMaterial.current.opacity = 0.28 * fade

    for (let i = 0; i < ACHIEVEMENT_COUNT; i++) {
      const lit = i === current ? 1 : 0.3
      const g = gates.current[i]
      if (g) {
        g.visible = fade > 0
        g.rotation.z = t * (i % 2 ? 0.35 : -0.35)
        // The segments share one material, so setting it through the first one lights the whole gate
        const segment = g.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
        segment.material.opacity = fade * (0.4 + lit * 0.6)
      }
      const halo = gateHalos.current[i]
      if (halo) halo.uniforms.uIntensity.value = fade * lit * (1.1 + Math.sin(t * 2 + i) * 0.2)
    }
  })

  return (
    <>
      <instancedMesh ref={rings} args={[undefined, undefined, TUNNEL_RINGS]}>
        <torusGeometry args={[TUNNEL_R, 0.012, 8, 120]} />
        <meshBasicMaterial ref={ringMaterial} color={RED} transparent toneMapped={false} depthWrite={false} />
      </instancedMesh>

      {gateColors.map((color, i) => (
        <group
          key={i}
          ref={(el) => {
            gates.current[i] = el
          }}
          position={[0, 0, stageZ(i)]}
        >
          {/* Segmented gate: a dashed ring reads as machinery rather than another plain hoop */}
          {Array.from({ length: 6 }, (_, k) => (
            <mesh key={k} rotation={[0, 0, (k / 6) * Math.PI * 2]} material={gateMaterials[i]}>
              <torusGeometry args={[2.6, 0.03, 8, 40, (Math.PI * 2) / 6 - 0.18]} />
            </mesh>
          ))}
          <Halo size={7} radius={2.6 / 3.5} width={0.06}             color={color}
            materialRef={(el) => {
              gateHalos.current[i] = el
            }}
          />
        </group>
      ))}
    </>
  )
}

/* ── Light streaks whose tails stretch with camera speed (warp) ── */
const STREAKS = 700

const STREAK_SEED = (() => {
  const heads = new Float32Array(STREAKS * 3)
  const colors = new Float32Array(STREAKS * 6)
  const hot = new THREE.Color('#FFB27A')
  const red = new THREE.Color(RED)
  for (let i = 0; i < STREAKS; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 1.9 + Math.random() * 4
    heads.set([Math.cos(a) * r, Math.sin(a) * r, -2 - Math.random() * 100], i * 3)
    const c = Math.random() < 0.25 ? hot : red
    colors.set([c.r, c.g, c.b, 0, 0, 0], i * 6) // black tail fades out under additive blending
  }
  return { heads, colors }
})()

function Streaks({ progress, speedRef }: { progress: MotionValue<number>; speedRef: Speed }) {
  const lines = useRef<THREE.LineSegments>(null)
  const material = useRef<THREE.LineBasicMaterial>(null)
  const positions = useMemo(() => new Float32Array(STREAKS * 6), [])
  const colors = useMemo(() => STREAK_SEED.colors.slice(), [])

  useFrame(() => {
    const fade = tunnelFade(progress.get())
    if (material.current) material.current.opacity = fade
    if (!lines.current) return
    lines.current.visible = fade > 0
    const attr = lines.current.geometry.attributes.position as THREE.BufferAttribute
    const { heads } = STREAK_SEED
    const len = 0.25 + Math.min(speedRef.current, 60) * 0.12
    for (let i = 0; i < STREAKS; i++) {
      const x = heads[i * 3]
      const y = heads[i * 3 + 1]
      const z = heads[i * 3 + 2]
      attr.setXYZ(i * 2, x, y, z)
      attr.setXYZ(i * 2 + 1, x, y, z - len)
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments ref={lines} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={material}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  )
}

export default function PortalScene({ progress, active, gateColors }: PortalSceneProps) {
  const speed = useRef(0)
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 14], fov: 55, near: 0.05, far: 120 }}
      frameloop={active ? 'always' : 'never'}
    >
      {/* Black fog: additive glows fade to nothing with distance instead of greying out */}
      <fog attach="fog" args={['#000000', 10, 42]} />
      <CameraRig progress={progress} speedRef={speed} />
      <Portal progress={progress} />
      <Debris progress={progress} />
      <Tunnel progress={progress} gateColors={gateColors} />
      <Streaks progress={progress} speedRef={speed} />
    </Canvas>
  )
}

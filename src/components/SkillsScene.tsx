'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { grotesk } from './fonts'
import { INTRO_END, shotAt, skillIndexAt } from './skillsTimeline'

interface SkillsSceneProps {
  progress: MotionValue<number>
  active: boolean
  categories: { tags: string[] }[]
}

const RED = '#FF3B3B'
const RING_R = 2.4

// Each category's orbit gets its own tilt, like electron shells round a nucleus
const TILTS: [number, number, number][] = [
  [0, 0, 0],
  [1.1, 0.4, 0.3],
  [-1.0, 0.65, -0.2],
  [0.5, 1.25, 0.6],
  [-0.55, -1.2, 0.1],
  [1.25, -0.85, -0.4],
]
// Direction the camera looks down to face each ring head-on
const NORMALS = TILTS.map((t) => new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...t)))
const LIT_COLOR = new THREE.Color(RED)
const DIM_COLOR = new THREE.Color('#D7E2EA')

/* ── Shaders ── */
const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Soft additive glow around the core — fakes bloom without a post-processing pass
const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv * 2.0 - 1.0);
    float g = pow(max(0.0, 1.0 - r), 2.4);
    gl_FragColor = vec4(uColor * g * uIntensity, g);
  }
`

/* ── Camera: swings round the atom to face each ring, with a dolly out-and-in on the turn ── */
const scratchDir = new THREE.Vector3()
const scratchTarget = new THREE.Vector3()

function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state, dt) => {
    const { from, to, t, intro, outro } = shotAt(progress.get())
    scratchDir.copy(NORMALS[from]).lerp(NORMALS[to], t).normalize()
    const dist = 8.6 + Math.sin(Math.PI * t) * 2.4 + (1 - intro) * 14 + outro * 7
    scratchTarget.copy(scratchDir).multiplyScalar(dist)
    scratchTarget.y += (1 - intro) * 5
    scratchTarget.x += pointer.current.x * 0.5
    scratchTarget.y += pointer.current.y * 0.35
    state.camera.position.lerp(scratchTarget, 1 - Math.exp(-5 * Math.min(dt, 0.05)))
    state.camera.lookAt(0, 0, 0)
  })

  return null
}

/* ── Nucleus: hot core, a slowly turning wire shell and a soft glow ── */
function Core() {
  const shell = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(RED) }, uIntensity: { value: 1.4 } }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (shell.current) shell.current.rotation.set(t * 0.15, t * 0.22, 0)
    if (glow.current) glow.current.uniforms.uIntensity.value = 1.3 + Math.sin(t * 2) * 0.25
  })

  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.42, 3]} />
        <meshBasicMaterial color="#FF6A4D" toneMapped={false} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial color={RED} wireframe transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {/* Billboard glow: always faces the camera */}
      <Billboard>
        <mesh>
          <planeGeometry args={[4.2, 4.2]} />
          <shaderMaterial
            ref={glow}
            vertexShader={quadVertex}
            fragmentShader={glowFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
    </group>
  )
}

function Billboard({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => group.current?.quaternion.copy(state.camera.quaternion))
  return <group ref={group}>{children}</group>
}

/* ── One orbit per category; the lit one spins and shows its skills ── */
function Orbit({ index, tags, lit }: { index: number; tags: string[]; lit: boolean }) {
  const spin = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (!spin.current) return
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.05))
    spin.current.rotation.z += dt * (lit ? 0.12 : 0.04) * (index % 2 ? -1 : 1)
    // Ease the ring and its nodes between lit red and a faint trace
    const goal = lit ? LIT_COLOR : DIM_COLOR
    spin.current.traverse((obj) => {
      const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
      if (!mat || !(mat instanceof THREE.MeshBasicMaterial)) return
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, lit ? 0.95 : 0.14, k)
      mat.color.lerp(goal, k)
    })
  })

  return (
    <group rotation={TILTS[index]}>
      <group ref={spin}>
        <mesh>
          <torusGeometry args={[RING_R, lit ? 0.014 : 0.008, 8, 220]} />
          <meshBasicMaterial color="#D7E2EA" transparent opacity={0.14} toneMapped={false} depthWrite={false} />
        </mesh>
        {tags.map((tag, k) => {
          const a = (k / tags.length) * Math.PI * 2 + Math.PI / 2
          const x = Math.cos(a) * RING_R
          const y = Math.sin(a) * RING_R
          return (
            <group key={tag} position={[x, y, 0]}>
              <mesh>
                <sphereGeometry args={[lit ? 0.085 : 0.05, 16, 16]} />
                <meshBasicMaterial color="#D7E2EA" transparent opacity={0.14} toneMapped={false} />
              </mesh>
              {lit && (
                <Html
                  center
                  position={[x * 0.16, y * 0.16, 0]}
                  zIndexRange={[20, 0]}
                  style={{ pointerEvents: 'none' }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.08 + k * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className={`${grotesk.className} block whitespace-nowrap rounded-full border border-[#FF3B3B]/35 bg-[#141416]/80 px-3 py-1 text-xs text-[#D7E2EA] shadow-[0_0_20px_rgba(255,59,59,0.25)] backdrop-blur-sm sm:text-sm`}
                  >
                    {tag}
                  </motion.span>
                </Html>
              )}
            </group>
          )
        })}
      </group>
    </group>
  )
}

/* ── Faint dust for depth ── */
const DUST = 500
const DUST_POSITIONS = (() => {
  const arr = new Float32Array(DUST * 3)
  for (let i = 0; i < DUST; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(13 + Math.random() * 12)
    arr.set([v.x, v.y, v.z], i * 3)
  }
  return arr
})()

function Dust() {
  const points = useRef<THREE.Points>(null)
  useFrame((_, dt) => {
    if (points.current) points.current.rotation.y += dt * 0.01
  })
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[DUST_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#D7E2EA" size={0.05} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
    </points>
  )
}

function Atom({ progress, categories }: { progress: MotionValue<number>; categories: { tags: string[] }[] }) {
  // Only changes six times over the whole section, so React state is fine here
  // Nothing lit until the camera has swooped in, so labels don't crowd the title
  const litAt = (v: number) => (v < INTRO_END * 0.85 ? -1 : skillIndexAt(v))
  const [lit, setLit] = useState(() => litAt(progress.get()))
  useMotionValueEvent(progress, 'change', (v) => {
    const next = litAt(v)
    setLit((cur) => (cur === next ? cur : next))
  })

  return (
    <>
      <Core />
      {categories.map((c, i) => (
        <Orbit key={i} index={i} tags={c.tags} lit={i === lit} />
      ))}
    </>
  )
}

export default function SkillsScene({ progress, active, categories }: SkillsSceneProps) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 5, 22], fov: 45, near: 0.1, far: 80 }}
      frameloop={active ? 'always' : 'never'}
    >
      <fog attach="fog" args={['#000000', 12, 30]} />
      <CameraRig progress={progress} />
      <Dust />
      <Atom progress={progress} categories={categories} />
    </Canvas>
  )
}

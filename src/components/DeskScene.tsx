'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { MotionValue } from 'framer-motion'
import {
  CARD_H,
  CARD_W,
  FOCUS_CARDS,
  SCREEN_H,
  SCREEN_W,
  BADGE_SIZE,
  SPRITE_SIZE,
  drawFocusCard,
  drawLaptopUi,
  drawLidBadge,
  drawSprite,
  screenBeatAt,
} from './deskScreens'

interface DeskSceneProps {
  progress: MotionValue<number>
  active: boolean
  reduceMotion: boolean
}

type SceneProps = Omit<DeskSceneProps, 'active'>

// Where a reduced-motion visitor's static camera sits on the path: the opening wide shot, lid open
const STATIC_PROGRESS = 0.2

/* ── Camera path, keyed to scroll progress through the pinned section ── */
const SHOTS: { at: number; pos: [number, number, number]; target: [number, number, number] }[] = [
  { at: 0, pos: [0, 3.6, 7.6], target: [0, 1.45, 0] }, // looking down on the closed laptop and its lid badge
  { at: 0.2, pos: [0.9, 2.4, 7.4], target: [0, 1.05, 0] }, // dolly in while the lid opens
  // Aimed above the laptop so it sits in the lower part of the frame, clear of the captions
  { at: 0.38, pos: [0.6, 2.0, 5.9], target: [0, 1.35, -0.2] }, // square onto the screen
  { at: 0.58, pos: [0, 2.2, 6.9], target: [0, 1.6, 0.2] }, // step back as the cards fly out
  { at: 0.8, pos: [-2.4, 1.9, 6.1], target: [0, 1.3, 0] }, // orbit round to the side
  { at: 1, pos: [0, 3.6, 7.6], target: [0, 1.2, 0] }, // back above as the lid shuts, badge up
]

function sampleShot(p: number, outPos: THREE.Vector3, outTarget: THREE.Vector3, scratch: THREE.Vector3) {
  let i = 0
  while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i++
  const a = SHOTS[i]
  const b = SHOTS[i + 1]
  const t = THREE.MathUtils.smootherstep(p, a.at, b.at)
  outPos.set(...a.pos).lerp(scratch.set(...b.pos), t)
  outTarget.set(...a.target).lerp(scratch.set(...b.target), t)
}

function CameraRig({ progress, reduceMotion }: Pick<SceneProps, 'progress' | 'reduceMotion'>) {
  const lookAt = useRef(new THREE.Vector3(...SHOTS[0].target))
  const goalRef = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), scratch: new THREE.Vector3() })
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state, delta) => {
    const goal = goalRef.current
    const p = reduceMotion ? STATIC_PROGRESS : progress.get()
    sampleShot(p, goal.pos, goal.target, goal.scratch)

    // Portrait screens: wider lens and a step back so the desk still fits across
    const aspect = state.size.width / state.size.height
    if (aspect < 1) goal.pos.sub(goal.target).multiplyScalar(1 + (1 - aspect) * 1.4).add(goal.target)
    const camera = state.camera as THREE.PerspectiveCamera
    const fov = aspect < 1 ? 50 : 35
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    if (!reduceMotion) {
      // Handheld drift + a slight lean toward the pointer
      const t = state.clock.elapsedTime
      goal.pos.x += pointer.current.x * 0.25 + Math.sin(t * 0.4) * 0.05
      goal.pos.y += pointer.current.y * 0.15 + Math.cos(t * 0.3) * 0.04
    }

    const ease = 1 - Math.exp(-5 * delta)
    state.camera.position.lerp(goal.pos, ease)
    lookAt.current.lerp(goal.target, ease)
    state.camera.lookAt(lookAt.current)
  })

  return null
}

/* ── Static canvas texture, drawn once ── */
function useDrawnTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) draw(ctx)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/* ── Canvas texture that is redrawn later (through the material ref) ── */
function useCanvasTexture(width: number, height: number) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    return c
  }, [width, height])
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }, [canvas])
  useEffect(() => () => texture.dispose(), [texture])
  return { canvas, texture }
}

function loadImage(src: string, onLoad: (image: HTMLImageElement) => void) {
  const image = new Image()
  image.onload = () => onLoad(image)
  image.src = src
}

function KeyGrid({ cols, rows, pitchX, pitchZ, keySize }: { cols: number; rows: number; pitchX: number; pitchZ: number; keySize: [number, number, number] }) {
  const keys = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!keys.current) return
    const dummy = new THREE.Object3D()
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dummy.position.set((col - (cols - 1) / 2) * pitchX, 0, (row - (rows - 1) / 2) * pitchZ)
        dummy.updateMatrix()
        keys.current.setMatrixAt(row * cols + col, dummy.matrix)
      }
    }
    keys.current.instanceMatrix.needsUpdate = true
  }, [cols, rows, pitchX, pitchZ])

  return (
    <instancedMesh ref={keys} args={[undefined, undefined, cols * rows]}>
      <boxGeometry args={keySize} />
      <meshStandardMaterial color="#1f1f23" metalness={0.4} roughness={0.5} />
    </instancedMesh>
  )
}

/* ── Floating laptop: lid opens on scroll, focus cards break out of its screen ── */
const CARD_FLIGHTS: { to: [number, number, number]; rotY: number }[] = [
  { to: [-1.45, 0.9, 0.9], rotY: 0.3 },
  { to: [0.05, 1.2, 1.35], rotY: 0 },
  { to: [1.45, 0.5, 0.9], rotY: -0.3 },
]

function FocusCard({ index, progress, reduceMotion }: { index: number; progress: MotionValue<number>; reduceMotion: boolean }) {
  const card = FOCUS_CARDS[index]
  const flight = CARD_FLIGHTS[index]
  const texture = useDrawnTexture(CARD_W, CARD_H, (ctx) => drawFocusCard(ctx, card))
  const mesh = useRef<THREE.Mesh>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (!mesh.current || !material.current) return
    const p = reduceMotion ? 0 : progress.get()
    const out = THREE.MathUtils.smootherstep(p, 0.4 + index * 0.035, 0.5 + index * 0.035)
    const back = THREE.MathUtils.smootherstep(p, 0.6, 0.67)
    const k = out * (1 - back)
    const bob = Math.sin(clock.elapsedTime * 1.2 + index * 2) * 0.03 * k

    mesh.current.visible = k > 0.001
    mesh.current.position.set(flight.to[0] * k, 0.75 + (flight.to[1] - 0.75) * k + bob, 0.03 + flight.to[2] * k)
    mesh.current.rotation.y = flight.rotY * k
    mesh.current.scale.setScalar(0.25 + 0.75 * k)
    material.current.opacity = k
  })

  return (
    <mesh ref={mesh} visible={false}>
      <planeGeometry args={[1.2, 0.75]} />
      <meshBasicMaterial ref={material} map={texture} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

/* ── Third caption: embers rise round the laptop ── */
const EMBER_COUNT = 70
const EMBER_HEIGHT = 2.6

function Embers({ progress, reduceMotion }: { progress: MotionValue<number>; reduceMotion: boolean }) {
  const points = useRef<THREE.Points>(null)
  const material = useRef<THREE.PointsMaterial>(null)
  const sprite = useDrawnTexture(SPRITE_SIZE, SPRITE_SIZE, drawSprite)
  // Fixed scatter per ember: spot on the laptop footprint, climb speed, phase, sideways drift
  const seeds = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin((i + 1) * 127.1 + n * 311.7) * 43758.5453
          return x - Math.floor(x)
        }
        return { x: (r(1) - 0.5) * 2.8, z: (r(2) - 0.5) * 1.8, speed: 0.12 + r(3) * 0.2, phase: r(4), drift: (r(5) - 0.5) * 0.6 }
      }),
    []
  )
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(EMBER_COUNT * 3), 3))
    const colors = new Float32Array(EMBER_COUNT * 3)
    const hot = new THREE.Color('#FFB27A')
    const red = new THREE.Color('#FF3B3B')
    for (let i = 0; i < EMBER_COUNT; i++) (i % 3 === 0 ? hot : red).toArray(colors, i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    if (!material.current) return
    const p = reduceMotion ? 0 : progress.get()
    const on = THREE.MathUtils.smoothstep(p, 0.64, 0.7) * (1 - THREE.MathUtils.smoothstep(p, 0.9, 0.98))
    material.current.opacity = on
    if (on <= 0 || !points.current) return
    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute
    const t = clock.elapsedTime
    seeds.forEach((s, i) => {
      const climb = (t * s.speed + s.phase) % 1
      pos.setXYZ(i, s.x + Math.sin(t * 0.8 + i) * 0.08 + s.drift * climb, -0.1 + climb * EMBER_HEIGHT, s.z)
    })
    pos.needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={material}
        map={sprite}
        size={0.09}
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

function Laptop({ progress, reduceMotion }: Pick<SceneProps, 'progress' | 'reduceMotion'>) {
  const body = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Group>(null)
  const { canvas, texture: screen } = useCanvasTexture(SCREEN_W, SCREEN_H)
  const badge = useDrawnTexture(BADGE_SIZE, BADGE_SIZE, drawLidBadge)
  const screenMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const avatar = useRef<HTMLImageElement | null>(null)
  const lastScreen = useRef('')

  useEffect(() => {
    loadImage('/head-removebg-preview.png', (image) => {
      avatar.current = image
      lastScreen.current = '' // repaint with the avatar in
    })
  }, [])

  useFrame(({ clock }) => {
    if (!lid.current || !body.current) return
    const p = reduceMotion ? 1 : progress.get()

    // Screen: repaint only when the headline or its swap moves on
    const { index, mix } = screenBeatAt(p)
    const key = `${index}-${mix.toFixed(2)}-${avatar.current ? 1 : 0}`
    if (key !== lastScreen.current) {
      lastScreen.current = key
      const ctx = canvas.getContext('2d')
      if (ctx) {
        drawLaptopUi(ctx, avatar.current, p)
        if (screenMaterial.current?.map) screenMaterial.current.map.needsUpdate = true
      }
    }

    // Opens as the section starts, shuts again as it ends
    const open = THREE.MathUtils.smootherstep(p, 0.04, 0.26) * (1 - THREE.MathUtils.smootherstep(p, 0.87, 0.98))
    // Closed (+1.5 rad, flat over the keys) → open and tilted back
    lid.current.rotation.x = THREE.MathUtils.lerp(1.5, -0.3, open)

    // Hovers and sways. Closed, it's tipped toward the camera so the lid badge shows; it
    // levels out and turns to face the camera as it opens, and tips back as it shuts
    const t = reduceMotion ? 0 : clock.elapsedTime
    body.current.position.y = 0.2 + Math.sin(t * 0.9) * 0.07
    body.current.rotation.y = THREE.MathUtils.lerp(-0.55, -0.1, open) + Math.sin(t * 0.35) * 0.05
    body.current.rotation.x = THREE.MathUtils.lerp(0.42, 0.06, open) + Math.sin(t * 0.7 + 1) * 0.025
    body.current.rotation.z = Math.sin(t * 0.5) * 0.02
  })

  return (
    <group ref={body} position={[0, 0.2, 0]}>
      {/* Base */}
      <RoundedBox args={[2.3, 0.07, 1.6]} radius={0.03} smoothness={4} position={[0, 0.035, 0]}>
        <meshStandardMaterial color="#1a1a1d" metalness={0.85} roughness={0.22} />
      </RoundedBox>
      {/* Red light strip along the front edge */}
      <mesh position={[0, 0.035, 0.801]}>
        <planeGeometry args={[2.0, 0.014]} />
        <meshBasicMaterial color="#FF3B3B" toneMapped={false} />
      </mesh>
      <group position={[0, 0.08, -0.3]}>
        <KeyGrid cols={14} rows={5} pitchX={0.15} pitchZ={0.135} keySize={[0.125, 0.018, 0.11]} />
      </group>
      <mesh position={[0, 0.071, 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.45]} />
        <meshStandardMaterial color="#232327" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Lid, hinged at the back edge */}
      <group ref={lid} position={[0, 0.07, -0.78]}>
        <RoundedBox args={[2.3, 1.5, 0.04]} radius={0.02} smoothness={4} position={[0, 0.75, 0]}>
          <meshStandardMaterial color="#1a1a1d" metalness={0.85} roughness={0.22} />
        </RoundedBox>
        {/* Glowing logo on the back of the lid — faces up while the laptop is closed */}
        <mesh position={[0, 0.75, -0.022]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial map={badge} transparent toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.76, 0.021]}>
          <planeGeometry args={[2.16, 1.35]} />
          <meshBasicMaterial ref={screenMaterial} map={screen} toneMapped={false} />
        </mesh>
        {FOCUS_CARDS.map((card, i) => (
          <FocusCard key={card.index} index={i} progress={progress} reduceMotion={reduceMotion} />
        ))}
      </group>

      <Embers progress={progress} reduceMotion={reduceMotion} />
    </group>
  )
}

/* ── Stage + lighting ── */
export default function DeskScene({ progress, active, reduceMotion }: DeskSceneProps) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: SHOTS[0].pos, fov: 35 }}
      frameloop={active ? 'always' : 'never'}
    >
      {/* Studio reflections for the glossy, near-monochrome look — built locally, no HDR download */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={3} color="#FF3B3B" position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[7, 2, 2]} rotation-y={-Math.PI / 2} scale={[4, 1, 1]} />
        <Lightformer form="ring" intensity={1.5} position={[0, 2, 8]} scale={3} />
      </Environment>

      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 6, 4]} intensity={1.2} />
      <pointLight position={[-2.6, 1.6, -1.2]} intensity={10} distance={7} color="#FF3B3B" />
      <pointLight position={[0, 1.8, -2.2]} intensity={6} distance={5} color="#FF3B3B" />
      <pointLight position={[0.6, 1.4, 2]} intensity={2} distance={4} color="#FFD6D6" />

      <CameraRig progress={progress} reduceMotion={reduceMotion} />

      {/* Soft shadow far below, so the laptop reads as floating */}
      <ContactShadows position={[0, -1.1, 0]} scale={5} opacity={0.45} blur={3} far={2.5} resolution={256} />

      <Laptop progress={progress} reduceMotion={reduceMotion} />
    </Canvas>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl'

/* The hero portrait, alive: the head turns toward the cursor and the eyes follow it, with blinks
   and small idle glances.

   The portrait is a flat PNG, so the turn is faked with parallax: a hand-built depth map (skull
   as a dome, face and nose nearer, shoulders further back) shifts near parts more than far ones,
   which reads as the head rotating rather than the picture sliding. The eyes are redrawn in the
   same shader, in the image's own pixel space, so they stay locked to the face as it turns.
   The plain <img> stays underneath: it's what shows before WebGL is ready, without WebGL, and
   for reduced motion. */

const IMG_W = 528
const IMG_H = 472

const MAX_HEAD: [number, number] = [11, 6] // px shift of the nearest point (nose tip) at full turn
const MAX_IRIS: [number, number] = [3.6, 2] // px travel of the iris inside the eye
const REACH = 380 // cursor distance (screen px) for a half-strength look
const IDLE_AFTER = 2.2 // seconds without pointer movement before the idle glances start

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uHead;   // parallax shift of the nearest point, image px
  uniform vec2 uGaze;   // iris offset, image px
  uniform float uBlink; // 0 open → 1 shut
  varying vec2 vUv;

  const vec2 SIZE = vec2(${IMG_W}.0, ${IMG_H}.0);

  float dome(vec2 p, vec2 c, vec2 r) {
    vec2 d = (p - c) / r;
    return sqrt(max(0.0, 1.0 - dot(d, d)));
  }

  // 0 = far (background), ~1 = nose tip
  float depth(vec2 p) {
    float head = dome(p, vec2(270.0, 170.0), vec2(150.0, 175.0));
    float face = dome(p, vec2(270.0, 215.0), vec2(85.0, 105.0));
    float nose = dome(p, vec2(270.0, 238.0), vec2(22.0, 36.0));
    float d = 0.25 * step(0.001, head) + head * 0.45 + face * 0.2 + nose * 0.15;
    float body = 0.12 * smoothstep(300.0, 360.0, p.y);
    return max(d, body);
  }

  vec4 tex(vec2 p) {
    return texture2D(tMap, vec2(p.x / SIZE.x, 1.0 - p.y / SIZE.y));
  }

  // Quadratic lid curve from (x0,y0) to (x1,y1) bowed by control height c; x is ~linear in t
  float lid(float t, float y0, float c, float y1) {
    float u = 1.0 - t;
    return u * u * y0 + 2.0 * t * u * c + t * t * y1;
  }

  // One eye, painted over colour 'col' at source position s. e = x0, x1, centre x, centre y;
  // l = y at x0, y at x1, upper control, lower control
  vec3 eye(vec3 col, vec2 s, vec4 e, vec4 l) {
    float t = (s.x - e.x) / (e.y - e.x);
    if (t <= 0.0 || t >= 1.0) return col;
    float yU = lid(t, l.x, l.z, l.y);
    float yL = lid(t, l.x, l.w, l.y);
    if (s.y < yU - 1.5 || s.y > yL + 1.5) return col;

    float yLid = mix(yU, yL, uBlink * 0.96); // upper lid edge, lowered while blinking
    float aa = 0.7;
    float open = smoothstep(yLid - aa, yLid + aa, s.y) * (1.0 - smoothstep(yL - aa, yL + aa, s.y));
    float covered = smoothstep(yU - aa, yU + aa, s.y) * (1.0 - smoothstep(yL - aa, yL + aa, s.y));

    // Eyeball: warm white with the painting's shading — darker into the corners and under the lid
    vec2 c = vec2(e.z, e.w);
    float edge = abs(s.x - c.x) / ((e.y - e.x) * 0.5);
    vec3 white = mix(vec3(0.91, 0.80, 0.77), vec3(0.55, 0.43, 0.44), pow(edge, 2.2) * 0.8);
    white *= mix(0.55, 1.0, smoothstep(yLid, yLid + 8.0, s.y));

    // Iris and pupil
    vec2 q = s - (c + uGaze);
    float r = length(q);
    vec3 iris = mix(vec3(0.39, 0.29, 0.27), vec3(0.24, 0.11, 0.09), smoothstep(5.0, 10.0, r));
    iris = mix(vec3(0.016, 0.02, 0.027), iris, smoothstep(4.2, 5.2, r)); // pupil
    iris *= mix(0.6, 1.0, smoothstep(yLid, yLid + 7.0, s.y));           // lid shadow
    vec3 ball = mix(iris, white, smoothstep(10.1, 10.9, r));
    ball = mix(ball, vec3(0.06, 0.02, 0.02), smoothstep(9.2, 10.2, r) * (1.0 - smoothstep(10.3, 11.0, r)) * 0.8);

    // Catch-light, riding a little behind the iris like a reflection on the cornea
    vec2 h = s - (c + uGaze * 0.7 + vec2(3.8, -4.6));
    ball = mix(ball, vec3(1.0), (1.0 - smoothstep(1.2, 2.3, length(h))) * 0.95);

    // Lash line along the (moving) upper lid
    ball = mix(ball, vec3(0.08, 0.0, 0.0), 1.0 - smoothstep(0.0, 1.8, s.y - yLid));

    // Closed part of the lid: skin, darkening toward its edge
    vec3 skin = mix(vec3(0.62, 0.36, 0.29), vec3(0.3, 0.12, 0.1), smoothstep(yLid - 5.0, yLid, s.y));

    vec3 inner = mix(skin, ball, open);
    return mix(col, inner, covered);
  }

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * SIZE;
    vec2 s = p - uHead * depth(p);
    vec4 base = tex(s);
    vec3 col = base.rgb;
    col = eye(col, s, vec4(210.0, 250.0, 232.5, 183.0), vec4(186.5, 188.0, 154.0, 204.0));
    col = eye(col, s, vec4(291.0, 331.0, 308.0, 183.0), vec4(187.5, 187.5, 154.0, 205.0));
    gl_FragColor = vec4(col, base.a);
  }
`

export default function PortraitHead({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const container = box.current
    const still = img.current
    if (!container || reduceMotion) return

    let renderer: Renderer
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: Math.min(2, window.devicePixelRatio) })
    } catch {
      return // no WebGL: the plain image stays
    }
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    const canvas = gl.canvas as HTMLCanvasElement
    canvas.setAttribute('aria-hidden', 'true')
    canvas.className = 'absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500'
    container.appendChild(canvas)

    const texture = new Texture(gl, { generateMipmaps: false })
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        tMap: { value: texture },
        uHead: { value: [0, 0] },
        uGaze: { value: [0, 0] },
        uBlink: { value: 0 },
      },
    })
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

    const resize = () => renderer.setSize(container.clientWidth, container.clientHeight)
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    let ready = false
    const image = new Image()
    image.onload = () => {
      texture.image = image
      ready = true
    }
    image.src = src

    /* Motion: a shared look target; the eyes chase it fast, the head follows slowly */
    const target = { x: 0, y: 0 }
    const gaze = { x: 0, y: 0 }
    const head = { x: 0, y: 0 }
    let lastMove = -Infinity
    let nextGlance = 0
    let nextBlink = 1.5
    let blinkStart = -1

    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect()
      const dx = e.clientX - (r.left + (270 / IMG_W) * r.width)
      const dy = e.clientY - (r.top + (200 / IMG_H) * r.height)
      const dist = Math.hypot(dx, dy) || 1
      const k = dist / (dist + REACH) // soft saturation: never snaps to the extreme
      target.x = (dx / dist) * k * 1.5
      target.y = (dy / dist) * k * 1.5
      lastMove = performance.now() / 1000
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(container)

    let raf = 0
    let prev = performance.now() / 1000
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now() / 1000
      const dt = Math.min(0.05, now - prev)
      prev = now
      if (!visible || !ready || document.hidden) return

      // Idle: small glances around, the way people look about when nothing's happening
      if (now - lastMove > IDLE_AFTER && now > nextGlance) {
        target.x = (Math.random() - 0.5) * 0.7
        target.y = (Math.random() - 0.5) * 0.4
        nextGlance = now + 1.4 + Math.random() * 2.2
      }

      const ease = (rate: number) => 1 - Math.exp(-dt * rate)
      gaze.x += (target.x - gaze.x) * ease(16)
      gaze.y += (target.y - gaze.y) * ease(16)
      head.x += (target.x - head.x) * ease(3.2)
      head.y += (target.y - head.y) * ease(3.2)

      // Blinks every few seconds, now and then a double
      if (now > nextBlink) {
        blinkStart = now
        nextBlink = now + (Math.random() < 0.15 ? 0.32 : 2.4 + Math.random() * 3.6)
      }
      const b = now - blinkStart
      const blink = b < 0.07 ? b / 0.07 : b < 0.18 ? 1 - (b - 0.07) / 0.11 : 0

      const breathe = Math.sin(now * 1.2) * 0.6
      const clamp = (v: number) => Math.max(-1, Math.min(1, v))
      program.uniforms.uHead.value = [clamp(head.x) * MAX_HEAD[0], clamp(head.y) * MAX_HEAD[1] + breathe]
      // Eyes lead the head: they carry the part of the look the head hasn't turned through yet
      program.uniforms.uGaze.value = [
        clamp(gaze.x - head.x * 0.45) * MAX_IRIS[0],
        clamp(gaze.y - head.y * 0.45) * MAX_IRIS[1],
      ]
      program.uniforms.uBlink.value = blink

      renderer.render({ scene: mesh })
      if (canvas.style.opacity !== '1') {
        canvas.style.opacity = '1'
        if (still) still.style.opacity = '0'
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      io.disconnect()
      canvas.remove()
      if (still) still.style.opacity = ''
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [src, reduceMotion])

  return (
    <div ref={box} className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-500"
      />
    </div>
  )
}

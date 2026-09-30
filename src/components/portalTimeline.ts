// Shared scroll timeline for the achievements portal: the 3D camera (PortalScene) and the
// DOM cards (AchievementsSection) both read from here so they stay in lockstep.

import { RELEASE_TWIST } from './blackHole'

export const ACHIEVEMENT_COUNT = 5

// Scroll progress 0 → INTRO_END: the portal opens and the camera dives through it
export const PORTAL_OPEN: [number, number] = [0.03, 0.11]
export const DIVE: [number, number] = [0.12, 0.2]
export const INTRO_END = 0.2
// OUTRO_START → 1: the tunnel fades out and hands back to the page
export const OUTRO_START = 0.94

const SLOT = (OUTRO_START - INTRO_END) / ACHIEVEMENT_COUNT

export interface Slot {
  start: number // card starts rushing in from the depth
  arrive: number // card lands, readable
  leave: number // card starts flying past the camera
  end: number // card is gone
}

export function slotOf(i: number): Slot {
  const start = INTRO_END + i * SLOT
  return { start, arrive: start + SLOT * 0.3, leave: start + SLOT * 0.8, end: start + SLOT }
}

// Each achievement's gate ring sits deeper in the tunnel
export const stageZ = (i: number) => -12 - i * 12

export const PORTAL_Z = 0

// Camera z keyframes; `ease` segments accelerate/decelerate, the rest are linear drifts
const KEYS: { at: number; z: number; ease: boolean }[] = (() => {
  const keys = [
    { at: 0, z: 14, ease: false },
    { at: DIVE[0], z: 4.5, ease: true },
    { at: INTRO_END, z: -3, ease: true },
  ]
  for (let i = 0; i < ACHIEVEMENT_COUNT; i++) {
    const s = slotOf(i)
    keys.push({ at: s.arrive, z: stageZ(i) + 7, ease: true }) // warp in, brake at the card
    keys.push({ at: s.leave, z: stageZ(i) + 5.5, ease: false }) // slow drift while reading
  }
  keys.push({ at: 1, z: stageZ(ACHIEVEMENT_COUNT - 1) - 14, ease: true })
  return keys
})()

const smooth = (t: number) => t * t * (3 - 2 * t)
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a))

export function cameraZ(p: number) {
  let i = 0
  while (i < KEYS.length - 2 && p > KEYS[i + 1].at) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = range(p, a.at, b.at)
  return a.z + (b.z - a.z) * (b.ease ? smooth(t) : t)
}

// Black-hole pull on the page: builds while the portal opens, released once the tunnel covers the screen.
// In the outro it goes negative — the page comes back out twisted as the tunnel fades, and the
// contact section unwinds it from the same twist.
export function pullAt(p: number) {
  const intro = smooth(range(p, 0.015, DIVE[0] + 0.03)) * (1 - range(p, INTRO_END, INTRO_END + 0.02))
  const release = smooth(range(p, OUTRO_START - 0.02, 1)) * RELEASE_TWIST
  return intro + release
}

// Which achievement is on stage (for tinting the tunnel); -1 before the dive
export function activeIndex(p: number) {
  if (p < INTRO_END) return -1
  return Math.min(ACHIEVEMENT_COUNT - 1, Math.floor((p - INTRO_END) / SLOT))
}

// Shared scroll timeline for the skills atom: the 3D camera (SkillsScene) and the DOM captions
// (ServicesSection) both read from here so they stay in lockstep.

export const SKILL_COUNT = 6

// 0 → INTRO_END: the camera swoops in onto the first ring
export const INTRO_END = 0.12
// OUTRO_START → 1: pull back out of the atom
export const OUTRO_START = 0.95

export const SKILL_SLOT = (OUTRO_START - INTRO_END) / SKILL_COUNT
// Last part of each slot is the camera swinging round to the next ring
const TURN_START = 0.72

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a))
const smooth = (t: number) => t * t * (3 - 2 * t)

export function skillSlot(i: number) {
  const start = INTRO_END + i * SKILL_SLOT
  return { start, end: start + SKILL_SLOT, turn: start + SKILL_SLOT * TURN_START }
}

// Camera shot: blend from ring `from` to ring `to` by `t`, plus intro/outro amounts
export function shotAt(p: number) {
  const intro = smooth(range(p, 0, INTRO_END))
  const outro = smooth(range(p, OUTRO_START, 1))
  if (p < INTRO_END) return { from: 0, to: 0, t: 0, intro, outro }
  const local = Math.min((p - INTRO_END) / SKILL_SLOT, SKILL_COUNT - 1e-6)
  const i = Math.floor(local)
  const to = Math.min(i + 1, SKILL_COUNT - 1)
  const t = to === i ? 0 : smooth(range(local - i, TURN_START, 1))
  return { from: i, to, t, intro, outro }
}

// The ring that's lit: switches halfway through the camera's turn
export function skillIndexAt(p: number) {
  if (p < INTRO_END) return 0
  const local = (p - INTRO_END) / SKILL_SLOT
  return Math.min(SKILL_COUNT - 1, Math.max(0, Math.floor(local + (1 - TURN_START) / 2)))
}

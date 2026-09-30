// 2D canvas drawings used as textures on the floating laptop: its screen, the badge on
// its lid, the focus cards that fly out of it and the ember sprite.

export const FOCUS_CARDS = [
  { index: '01', title: 'Web & Mobile', detail: 'Apps that actually ship' },
  { index: '02', title: 'AI Integration', detail: 'Smarter products' },
  { index: '03', title: 'Cybersecurity', detail: 'Secure by design' },
]

export const SCREEN_W = 1024
export const SCREEN_H = 640
export const CARD_W = 512
export const CARD_H = 320

// Kanit is loaded by next/font under a generated family name — reuse whatever the page resolved
function pageFont() {
  return getComputedStyle(document.body).fontFamily || 'sans-serif'
}

/* ── Laptop screen: the avatar plus one headline per About caption ──
   Switches at the same scroll points as BIO_BEATS, so the screen and the captions move together. */

export const SCREEN_BEATS: { from: number; eyebrow: string; title: [string, string]; sub: string }[] = [
  { from: -1, eyebrow: 'About', title: ['HELLO,', "I'M RAYEN"], sub: 'Software engineering student' },
  { from: 0.2, eyebrow: '01 — Study', title: ['SOFTWARE', 'ENGINEER'], sub: 'ISIMA · Mahdia, Tunisia' },
  { from: 0.4, eyebrow: '02 — Focus', title: ['WEB · AI', 'SECURITY'], sub: 'Apps, smarter products, secure by design' },
  { from: 0.62, eyebrow: '03 — Drive', title: ['SHIP', 'IT.'], sub: 'From hackathon idea to production' },
]
const BEAT_FADE = 0.025 // scroll progress either side of a switch

// Which headline is up at `p`, the next one, and how far the swap between them has got
export function screenBeatAt(p: number) {
  let i = 0
  while (i < SCREEN_BEATS.length - 1 && p >= SCREEN_BEATS[i + 1].from - BEAT_FADE) i++
  const from = SCREEN_BEATS[i].from
  const mix = i === 0 ? 1 : Math.min(1, Math.max(0, (p - (from - BEAT_FADE)) / (BEAT_FADE * 2)))
  return { index: i, mix }
}

function drawCopy(ctx: CanvasRenderingContext2D, font: string, beat: (typeof SCREEN_BEATS)[number], alpha: number, dy: number) {
  if (alpha <= 0.001) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.textBaseline = 'alphabetic'
  ctx.font = `600 16px ${font}`
  ctx.letterSpacing = '5px'
  ctx.fillStyle = '#FF3B3B'
  ctx.fillText(beat.eyebrow.toUpperCase(), 56, 190 + dy)
  ctx.letterSpacing = '0px'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 84px ${font}`
  ctx.fillText(beat.title[0], 50, 275 + dy)
  ctx.fillText(beat.title[1], 50, 358 + dy)
  ctx.fillStyle = '#9a9aa3'
  ctx.font = `400 21px ${font}`
  ctx.fillText(beat.sub, 56, 410 + dy)
  ctx.restore()
}

export function drawLaptopUi(ctx: CanvasRenderingContext2D, avatar: HTMLImageElement | null, p: number) {
  const font = pageFont()
  const { index, mix } = screenBeatAt(p)

  ctx.fillStyle = '#0d0d0f'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
  const glow = ctx.createRadialGradient(760, 300, 0, 760, 300, 460)
  glow.addColorStop(0, 'rgba(255, 32, 32, 0.35)')
  glow.addColorStop(1, 'rgba(255, 32, 32, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  // Slanted logo mark
  ctx.save()
  ctx.translate(56, 60)
  ctx.rotate(0.23)
  ctx.fillStyle = '#FF3B3B'
  ctx.fillRect(-5, -15, 10, 30)
  ctx.restore()

  // Headline: the previous one lifts away as the next rises in
  if (index > 0 && mix < 1) drawCopy(ctx, font, SCREEN_BEATS[index - 1], 1 - mix, -24 * mix)
  drawCopy(ctx, font, SCREEN_BEATS[index], mix, 24 * (1 - mix))

  // Progress through the three captions
  for (let i = 1; i < SCREEN_BEATS.length; i++) {
    const on = i <= index
    ctx.fillStyle = on ? '#FF3B3B' : 'rgba(255,255,255,0.14)'
    ctx.beginPath()
    ctx.roundRect(56 + (i - 1) * 54, 540, 42, 5, 3)
    ctx.fill()
  }

  // Portrait disc with halo ring and the hero avatar
  const cx = 770
  const cy = 350
  const r = 175
  const disc = ctx.createRadialGradient(cx, cy - 60, 0, cx, cy, r)
  disc.addColorStop(0, '#FF2020')
  disc.addColorStop(0.6, '#B00000')
  disc.addColorStop(1, '#3D0000')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, r + 25, 0, Math.PI * 2)
  ctx.stroke()

  if (avatar) {
    // Same break-out as the hero: clipped to the circle below its middle, free above it
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx - r, cy)
    ctx.lineTo(cx - r, 0)
    ctx.lineTo(cx + r, 0)
    ctx.lineTo(cx + r, cy)
    ctx.arc(cx, cy, r, 0, Math.PI)
    ctx.closePath()
    ctx.clip()
    const h = r * 2 * 1.196
    const w = (h * avatar.naturalWidth) / avatar.naturalHeight
    ctx.drawImage(avatar, cx - w / 2, cy + r - h, w, h)
    ctx.restore()
  }
}

/* ── Lid badge: the slanted logo mark with a red glow, on the back of the lid ── */
export const BADGE_SIZE = 256
export function drawLidBadge(ctx: CanvasRenderingContext2D) {
  const c = BADGE_SIZE / 2
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c)
  glow.addColorStop(0, 'rgba(255, 59, 59, 0.55)')
  glow.addColorStop(0.35, 'rgba(255, 40, 40, 0.18)')
  glow.addColorStop(1, 'rgba(255, 40, 40, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, BADGE_SIZE, BADGE_SIZE)
  ctx.save()
  ctx.translate(c, c)
  ctx.rotate(0.23)
  ctx.fillStyle = '#FF6B6B'
  ctx.shadowColor = '#FF3B3B'
  ctx.shadowBlur = 24
  ctx.fillRect(-9, -34, 18, 68)
  ctx.restore()
}

/* ── Soft round sprite for the ember particles ── */
export const SPRITE_SIZE = 64
export function drawSprite(ctx: CanvasRenderingContext2D) {
  const c = SPRITE_SIZE / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
}

/* ── Focus card: dark glass tile with a red accent ── */
export function drawFocusCard(ctx: CanvasRenderingContext2D, card: (typeof FOCUS_CARDS)[number]) {
  const font = pageFont()
  ctx.clearRect(0, 0, CARD_W, CARD_H)

  ctx.beginPath()
  ctx.roundRect(2, 2, CARD_W - 4, CARD_H - 4, 28)
  ctx.fillStyle = 'rgba(16, 16, 18, 0.94)'
  ctx.fill()
  ctx.save()
  ctx.clip()
  const glow = ctx.createRadialGradient(CARD_W - 60, 40, 0, CARD_W - 60, 40, 300)
  glow.addColorStop(0, 'rgba(255, 32, 32, 0.4)')
  glow.addColorStop(1, 'rgba(255, 32, 32, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.restore()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#FF3B3B'
  ctx.font = `700 26px ${font}`
  ctx.fillText(card.index, 36, 66)
  ctx.beginPath()
  ctx.arc(CARD_W - 68, 60, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(CARD_W - 68, 60, 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 44px ${font}`
  ctx.fillText(card.title.toUpperCase(), 36, 222)
  ctx.fillStyle = '#9a9aa3'
  ctx.font = `400 24px ${font}`
  ctx.fillText(card.detail, 36, 266)
}

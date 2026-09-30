'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  motion,
  useInView,
  useMotionValueEvent,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { Award, MapPin, Medal, Trophy, type LucideIcon } from 'lucide-react'
import RevealHeading from './RevealHeading'
import {
  ACHIEVEMENT_COUNT,
  DIVE,
  INTRO_END,
  OUTRO_START,
  activeIndex,
  pullAt,
  range,
  slotOf,
} from './portalTimeline'
import { blackHole } from './blackHole'
import { display, grotesk } from './fonts'
import Sparkle from './Sparkle'

// WebGL only runs in the browser
const PortalScene = dynamic(() => import('./PortalScene'), { ssr: false })

type Tier = 'gold' | 'silver' | 'bronze' | 'neutral'

const ACHIEVEMENTS: {
  title: string
  location: string
  result: string
  mark: string
  year: string
  project: string
  tier: Tier
}[] = [
  {
    title: 'IEEE ISIMA CS SBC – OPSYNC Hackathon',
    location: 'Mahdia, Tunisia',
    result: '1st Prize',
    mark: '1st',
    year: '2026',
    project: 'VeritasLearn',
    tier: 'gold',
  },
  {
    title: 'DevHeist – ISIMa DevOps Club Hackathon',
    location: 'Mahdia, Tunisia',
    result: '1st Prize',
    mark: '1st',
    year: '2026',
    project: 'LifePass',
    tier: 'gold',
  },
  {
    title: 'HACK4UCAR 2025',
    location: 'Tunisia',
    result: 'Top 5 / 30 Teams',
    mark: 'Top 5',
    year: '2026',
    project: 'UCAR-Pulse',
    tier: 'silver',
  },
  {
    title: 'Unmasking Cyber Threats CTF',
    location: 'Mahdia, Tunisia',
    result: '4th Place',
    mark: '4th',
    year: '2025',
    project: 'Cybersecurity / CTF',
    tier: 'bronze',
  },
  {
    title: 'Vecna Algorithm 2.0',
    location: 'Sousse, Tunisia',
    result: 'Participant',
    mark: '2026',
    year: '2026',
    project: 'ScoutSmart',
    tier: 'neutral',
  },
]

const TIER_STYLE: Record<Tier, { color: string; icon: LucideIcon }> = {
  gold: { color: '#F5C451', icon: Trophy },
  silver: { color: '#C9D3DD', icon: Medal },
  bronze: { color: '#D08A4E', icon: Medal },
  neutral: { color: '#9a9aa3', icon: Award },
}

/* ── One milestone: node on the line + card sliding in from its side ── */
function Milestone({ item, index }: { item: (typeof ACHIEVEMENTS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { color, icon: Icon } = TIER_STYLE[item.tier]
  const fromLeft = index % 2 === 0

  // The node lights up once the drawing line reaches it, and stays lit
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 62%', 'start 52%'] })
  const nodeLit = useTransform(scrollYProgress, (v) => (reduceMotion ? 1 : v))

  // Cursor spotlight — written straight to CSS variables, no re-render per mouse move
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div ref={ref} className="relative grid grid-cols-1 lg:grid-cols-2 lg:gap-20">
      {/* Node */}
      <div className="absolute left-4 top-8 z-10 -translate-x-1/2 lg:left-1/2">
        <span className="block h-4 w-4 rounded-full border border-[#D7E2EA]/25 bg-[#1A1A1A]" />
        <motion.span
          style={{ opacity: nodeLit, scale: nodeLit }}
          className="absolute inset-0 rounded-full"
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: color, boxShadow: `0 0 0 4px ${color}33, 0 0 24px ${color}` }}
          />
        </motion.span>
      </div>

      <motion.article
        onPointerMove={onPointerMove}
        initial={reduceMotion ? false : { opacity: 0, x: fromLeft ? -60 : 60, rotateY: fromLeft ? 12 : -12 }}
        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`group relative ml-12 overflow-hidden rounded-[28px] border border-[#D7E2EA]/15 bg-[#161618]/85 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-[#FF3B3B]/40 sm:p-8 lg:ml-0 ${
          fromLeft ? 'lg:col-start-1' : 'lg:col-start-2'
        }`}
        style={{ transformPerspective: 1200 }}
      >
        {/* Cursor spotlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,59,59,0.14), transparent 60%)',
          }}
        />
        {/* Tier light along the top edge */}
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.7 }}
        />
        {/* Backdrop rank, like the about section's backdrop type */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-3 right-5 hidden select-none font-black uppercase leading-none sm:block"
          style={{
            fontSize: 'clamp(4rem, 7vw, 6.5rem)',
            backgroundImage: 'linear-gradient(180deg, rgba(215,226,234,0.13) 0%, rgba(215,226,234,0) 90%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {item.mark}
        </span>

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ color, borderColor: `${color}55`, background: `${color}14` }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              {item.result}
            </span>
          </div>

          <h3 className="max-w-[22ch] text-xl font-bold uppercase leading-tight text-[#D7E2EA] sm:text-2xl">
            {item.title}
          </h3>

          <p className="flex items-center gap-1.5 text-sm text-[#D7E2EA]/55">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
            {item.location}
            <span className="text-[#D7E2EA]/25">·</span>
            <span className="font-mono text-xs">{item.year}</span>
          </p>

          <div className="mt-2 flex items-center justify-between border-t border-[#D7E2EA]/10 pt-4">
            <span className="text-xs uppercase tracking-[0.18em] text-[#D7E2EA]/45">Project</span>
            <span className="flex items-center gap-2 text-sm font-semibold text-[#D7E2EA]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B3B] shadow-[0_0_8px_rgba(255,59,59,0.9)]" />
              {item.project}
            </span>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

/* ── Reduced-motion fallback: the static timeline ── */
function AchievementsTimeline() {
  const timeline = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // The glowing line draws itself down the timeline as you scroll
  const { scrollYProgress } = useScroll({ target: timeline, offset: ['start 60%', 'end 60%'] })
  const lineScale = useTransform(scrollYProgress, (v) => (reduceMotion ? 1 : v))

  return (
    <section
      id="achievements"
      className="relative z-10 w-full scroll-mt-10 px-5 py-20 text-[#D7E2EA] sm:px-8 sm:py-24 md:px-10 md:py-32"
    >
      <RevealHeading
        eyebrow="Milestones"
        title="Achievements"
        fontSize="clamp(2.25rem, 7vw, 90px)"
        className="mb-16 sm:mb-20 md:mb-28"
      />

      <div ref={timeline} className="relative mx-auto flex max-w-5xl flex-col gap-10 sm:gap-14">
        {/* Track + drawn line */}
        <div className="absolute bottom-0 left-4 top-0 w-px -translate-x-1/2 bg-[#D7E2EA]/10 lg:left-1/2" />
        <motion.div
          style={{ scaleY: lineScale }}
          className="absolute bottom-0 left-4 top-0 w-[2px] origin-top -translate-x-1/2 bg-gradient-to-b from-[#FF3B3B] via-[#FF3B3B] to-[#7A0000] shadow-[0_0_14px_rgba(255,59,59,0.8)] lg:left-1/2"
        />

        {ACHIEVEMENTS.map((item, i) => (
          <Milestone key={item.title} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}

/* ── Portal showcase ── */

// Stable reference: PortalScene builds one gate material per colour
const GATE_COLORS = ACHIEVEMENTS.map((a) => TIER_STYLE[a.tier].color)

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t

/* Swallowed text: every letter spirals into the black hole, nearest to the centre first */

// Letter centre relative to the pinned stage's centre; offsets ignore transforms, so this
// stays correct mid-animation
function measureFromCentre(el: HTMLElement, stage: HTMLElement) {
  let x = el.offsetWidth / 2
  let y = el.offsetHeight / 2
  let node: HTMLElement | null = el
  while (node && node !== stage) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  const dx = x - stage.clientWidth / 2
  const dy = y - stage.clientHeight / 2
  return { dx, dy, d: Math.hypot(dx, dy) / Math.hypot(stage.clientWidth / 2, stage.clientHeight / 2) }
}

function SwallowLetter({
  char,
  progress,
  stageRef,
  delay,
  style,
}: {
  char: string
  progress: MotionValue<number>
  stageRef: React.RefObject<HTMLDivElement | null>
  delay: number
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const offset = useRef({ dx: 0, dy: 0, d: 0 })

  // A passive effect, not a layout effect: the stage's ref (a parent) isn't attached yet when
  // children's layout effects run. Re-measure once the web font has swapped in.
  useEffect(() => {
    const measure = () => {
      if (ref.current && stageRef.current) offset.current = measureFromCentre(ref.current, stageRef.current)
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [stageRef])

  // t: 0 = resting, 1 = gone into the hole
  const swirl = (v: number) => {
    const { dx, dy, d } = offset.current
    const start = 0.02 + delay + d * 0.03
    const r = range(v, start, start + 0.1)
    const t = r * r
    const theta = t * 2.6 // orbits while it falls in
    const k = 1 - t
    const nx = (dx * Math.cos(theta) - dy * Math.sin(theta)) * k
    const ny = (dx * Math.sin(theta) + dy * Math.cos(theta)) * k
    return { t, theta, x: nx - dx, y: ny - dy }
  }
  const x = useTransform(progress, (v) => swirl(v).x)
  const y = useTransform(progress, (v) => swirl(v).y)
  const rotate = useTransform(progress, (v) => ((swirl(v).theta * 180) / Math.PI) * 1.2)
  const scale = useTransform(progress, (v) => 1 - swirl(v).t * 0.85)
  const opacity = useTransform(progress, (v) => 1 - range(swirl(v).t, 0.8, 1))
  const blur = useTransform(progress, (v) => swirl(v).t * 6)
  const filter = useMotionTemplate`blur(${blur}px)`

  return (
    <motion.span ref={ref} aria-hidden className="inline-block" style={{ ...style, x, y, rotate, scale, opacity, filter }}>
      {char === ' ' ? ' ' : char}
    </motion.span>
  )
}

function SwallowText({
  text,
  as: Tag = 'span',
  progress,
  stageRef,
  delay = 0,
  className,
  style,
  letterStyle,
}: {
  text: string
  as?: 'span' | 'h2'
  progress: MotionValue<number>
  stageRef: React.RefObject<HTMLDivElement | null>
  delay?: number
  className?: string
  style?: React.CSSProperties
  letterStyle?: React.CSSProperties
}) {
  return (
    <Tag aria-label={text} className={className} style={style}>
      {Array.from(text).map((char, i) => (
        <SwallowLetter key={i} char={char} progress={progress} stageRef={stageRef} delay={delay} style={letterStyle} />
      ))}
    </Tag>
  )
}

/* Achievement as floating type, after dungyov.com: no card — an outlined rank stacked on a solid
   title, a bracketed label, and a sparkle list.
   Each piece sits at its own depth, so they separate as the camera flies up to and through them. */

// One line of the sparkle list, landing a beat after the one above it
function DetailItem({
  progress,
  at,
  children,
}: {
  progress: MotionValue<number>
  at: number
  children: React.ReactNode
}) {
  const opacity = useTransform(progress, (v) => range(v, at, at + 0.012))
  const x = useTransform(progress, (v) => (1 - easeOut(range(v, at, at + 0.012))) * -24)
  const rotate = useTransform(progress, (v) => range(v, at, at + 0.03) * 180)
  return (
    <motion.li style={{ opacity, x }} className="flex items-center gap-3">
      <motion.span style={{ rotate }} className="inline-flex">
        <Sparkle className="h-3.5 w-3.5 text-[#FF3B3B] sm:h-4 sm:w-4" />
      </motion.span>
      {children}
    </motion.li>
  )
}

// One achievement: rushes in from the depth of the tunnel, holds, then flies past the camera
function PortalCard({
  item,
  index,
  progress,
}: {
  item: (typeof ACHIEVEMENTS)[number]
  index: number
  progress: MotionValue<number>
}) {
  const s = slotOf(index)
  const { color } = TIER_STYLE[item.tier]
  const inT = (v: number) => easeOut(range(v, s.start, s.arrive))
  const outT = (v: number) => easeIn(range(v, s.leave, s.end))
  // Far pieces grow less than near ones, like objects at different depths
  const layer = (from: number, to: number) => (v: number) =>
    v < s.leave ? from + (1 - from) * inT(v) : 1 + (to - 1) * outT(v)

  // Function transforms throughout: see the note in AboutSection about the native ScrollTimeline
  const opacity = useTransform(
    progress,
    (v) => range(v, s.start, s.arrive) * (1 - range(v, s.leave + (s.end - s.leave) * 0.35, s.end))
  )
  const visibility = useTransform(opacity, (o) => (o > 0.001 ? 'visible' : 'hidden'))
  const blur = useTransform(progress, (v) => (1 - range(v, s.start, s.arrive)) * 10 + range(v, s.leave, s.end) * 8)
  const filter = useMotionTemplate`blur(${blur}px)`
  // Resting in a slight perspective tilt, swinging in from further round
  const rotateY = useTransform(progress, (v) => -8 - (1 - inT(v)) * 22 + outT(v) * 14)
  const rotateX = useTransform(progress, (v) => 4 + (1 - inT(v)) * 16)

  const markScale = useTransform(progress, layer(0.4, 2))
  const titleScale = useTransform(progress, layer(0.25, 2.7))
  const nearScale = useTransform(progress, layer(0.12, 3.6))

  const n = String(index + 1).padStart(2, '0')
  const total = String(ACHIEVEMENTS.length).padStart(2, '0')

  return (
    <motion.article
      style={{ opacity, visibility, filter, rotateX, rotateY }}
      className="absolute w-[min(60rem,calc(100vw-2rem))]"
    >
      <div className="relative flex flex-col items-start px-2 sm:pl-[10%]">
        <motion.p
          style={{ scale: nearScale }}
          className={`${grotesk.className} mb-3 origin-left text-[10px] uppercase tracking-[0.45em] text-[#D7E2EA]/50 sm:mb-5 sm:text-xs`}
        >
          Achievement — {n} / {total}
        </motion.p>

        <motion.span
          aria-hidden
          style={{
            scale: markScale,
            fontSize: 'clamp(3.25rem, 12vw, 9.5rem)',
            WebkitTextStroke: '1.5px rgba(215,226,234,0.9)',
          }}
          className={`${display.className} origin-left font-black uppercase leading-[0.88] text-transparent`}
        >
          {item.mark}
        </motion.span>

        <motion.h3
          style={{ scale: titleScale, fontSize: 'clamp(1.3rem, 3.4vw, 2.9rem)', textShadow: '0 6px 40px rgba(0,0,0,0.7)' }}
          className={`${display.className} max-w-[19ch] origin-left font-bold uppercase leading-[1.05] text-[#D7E2EA]`}
        >
          {item.title}
        </motion.h3>

        <motion.span
          style={{ scale: nearScale, color }}
          className={`${display.className} mt-3 origin-left text-xs uppercase tracking-[0.35em] sm:mt-4 sm:text-sm`}
        >
          ( {item.result} )
        </motion.span>

        <motion.ul
          style={{ scale: nearScale }}
          className={`${grotesk.className} mt-5 flex origin-left flex-col gap-2 text-base font-light text-[#D7E2EA]/85 sm:mt-7 sm:text-xl`}
        >
          <DetailItem progress={progress} at={s.arrive - 0.004}>
            {item.location}
          </DetailItem>
          <DetailItem progress={progress} at={s.arrive + 0.002}>
            {item.year}
          </DetailItem>
          <DetailItem progress={progress} at={s.arrive + 0.008}>
            Project — {item.project}
          </DetailItem>
        </motion.ul>
      </div>
    </motion.article>
  )
}

// One tick of the progress rail, lit in its tier colour while its card is on stage
function RailTick({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const { color } = TIER_STYLE[ACHIEVEMENTS[index].tier]
  const opacity = useTransform(progress, (v) => (activeIndex(v) === index ? 1 : 0.25))
  const scaleX = useTransform(progress, (v) => (activeIndex(v) === index ? 1.8 : 1))
  return (
    <motion.span
      style={{ opacity, scaleX, background: color, boxShadow: `0 0 10px ${color}` }}
      className="block h-[3px] w-6 origin-right rounded-full"
    />
  )
}

const TITLE_GRADIENT: React.CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, rgba(215,226,234,0.95) 0%, rgba(215,226,234,0.08) 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

function PortalStory() {
  const ref = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const active = useInView(ref, { margin: '200px' })

  // 0 when the stage pins, 1 when it releases
  const { scrollYProgress: progress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Drive the page background's black-hole warp
  useMotionValueEvent(progress, 'change', (v) => {
    blackHole.pull = pullAt(v)
  })
  useEffect(
    () => () => {
      blackHole.pull = 0
    },
    []
  )

  // The page goes dark once we're through the portal, and comes back at the end
  const darkness = useTransform(progress, (v) => range(v, DIVE[0] + 0.03, DIVE[1]) * (1 - range(v, OUTRO_START, 1)))
  const flashAt = DIVE[1] - 0.012
  const flash = useTransform(progress, (v) => Math.max(0, 1 - Math.abs(v - flashAt) / 0.022) * 0.9)
  const sceneOpacity = useTransform(progress, (v) => 1 - range(v, OUTRO_START + 0.02, 1))
  const hudOpacity = useTransform(
    progress,
    (v) => range(v, INTRO_END - 0.01, INTRO_END + 0.02) * (1 - range(v, OUTRO_START, OUTRO_START + 0.03))
  )
  const counter = useTransform(progress, (v) => String(Math.max(0, activeIndex(v)) + 1).padStart(2, '0'))

  return (
    <div ref={ref} className="relative w-full" style={{ height: `${(ACHIEVEMENT_COUNT + 2) * 100}dvh` }}>
      <div ref={stage} className="sticky top-0 h-dvh w-full overflow-hidden">
        {/* Inside the tunnel — matches the scene fog */}
        <motion.div style={{ opacity: darkness }} className="absolute inset-0 bg-[#0b0b0c]" />

        {/* Huge title the black hole tears open in front of, then swallows letter by letter */}
        <div className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col items-center gap-2 sm:gap-4">
          <SwallowText text="Milestones" progress={progress} stageRef={stage} className="eyebrow-label" />
          <SwallowText
            as="h2"
            text="Achievements"
            progress={progress}
            stageRef={stage}
            className="whitespace-nowrap text-center font-black uppercase leading-[0.85] tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 11vw, 190px)' }}
            letterStyle={TITLE_GRADIENT}
          />
        </div>

        <motion.div style={{ opacity: sceneOpacity }} className="absolute inset-0">
          <PortalScene progress={progress} active={active} gateColors={GATE_COLORS} />
        </motion.div>

        {/* Flash as we break through */}
        <motion.div
          style={{
            opacity: flash,
            background:
              'radial-gradient(circle at center, #FFD2B8 0%, #FF3B3B 35%, rgba(122,0,0,0.6) 65%, transparent 90%)',
          }}
          className="pointer-events-none absolute inset-0 mix-blend-screen"
        />

        {/* Cards */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center [perspective:1200px]">
          {ACHIEVEMENTS.map((item, i) => (
            <PortalCard key={item.title} item={item} index={i} progress={progress} />
          ))}
        </div>

        {/* HUD */}
        <motion.div
          style={{ opacity: hudOpacity }}
          className="pointer-events-none absolute inset-x-5 bottom-6 flex items-end justify-between sm:inset-x-10 sm:bottom-10"
        >
          <p className="font-mono text-xs tracking-[0.2em] text-[#D7E2EA]/50">
            <motion.span className="text-2xl font-bold text-[#D7E2EA] sm:text-3xl">{counter}</motion.span>
            {' / '}
            {String(ACHIEVEMENT_COUNT).padStart(2, '0')}
          </p>
          <div className="flex flex-col items-end gap-2">
            {ACHIEVEMENTS.map((item, i) => (
              <RailTick key={item.title} index={i} progress={progress} />
            ))}
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center">
          <SwallowText text="Scroll to enter" progress={progress} stageRef={stage} delay={-0.012} className="eyebrow-label" />
        </div>
      </div>
    </div>
  )
}

export default function AchievementsSection() {
  const reduceMotion = useReducedMotion()
  return reduceMotion ? (
    <AchievementsTimeline />
  ) : (
    <section id="achievements" className="relative z-10 w-full scroll-mt-10 text-[#D7E2EA]">
      <PortalStory />
    </section>
  )
}

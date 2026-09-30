'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowUpRight, Award, CodeXml, Medal, Play, Trophy, X, type LucideIcon } from 'lucide-react'
import FadeIn from './FadeIn'
import { range } from './portalTimeline'
import { display, grotesk } from './fonts'

type Tier = 'gold' | 'silver' | 'neutral'

// Logos are stored as white shape masks (public/projects/masks) so they carry no colors of
// their own: they sit etched into the stage and get lit by the site's red, like embers.
const PROJECTS: {
  name: string
  description: string
  stack: string[]
  award: string
  tier: Tier
  mask: string
  repo: string
  demo?: string // YouTube video id
}[] = [
  {
    name: 'VeritasLearn',
    description:
      'Gamified AI study assistant that turns any question into a lesson, quiz and flashcards, with guardrails against hallucinations.',
    stack: ['React Native', 'Supabase', 'Groq'],
    award: '1st Prize',
    tier: 'gold',
    mask: '/projects/masks/veritaslearn.png',
    repo: 'https://github.com/rayenchatti/veritaslearn',
  },
  {
    name: 'LifePass',
    description:
      'Centralized medical records for patients, instantly accessible to doctors through a personal QR code.',
    stack: ['React', 'Tailwind', 'Framer Motion'],
    award: '1st Prize',
    tier: 'gold',
    mask: '/projects/masks/lifepass.png',
    repo: 'https://github.com/rayenchatti/LifePass',
  },
  {
    name: 'UCAR Pulse',
    description:
      'AI operating system centralizing 30+ University of Carthage institutions with RAG-powered intelligence.',
    stack: ['Next.js', 'FastAPI', 'Qdrant'],
    award: 'Top 5 / 30',
    tier: 'silver',
    mask: '/projects/masks/ucar-pulse.png',
    repo: 'https://github.com/rayenchatti/UCAR-Pulse',
    demo: '9EJ-nj2VHU0',
  },
  {
    name: 'ITGate AI Assistant',
    description:
      'Company-grounded knowledge assistant: a local LLM with a RAG pipeline that answers only from ITGate’s own documents.',
    stack: ['Spring Boot', 'FastAPI', 'Ollama'],
    award: 'Internship',
    tier: 'neutral',
    mask: '/projects/masks/itgate.png',
    repo: 'https://github.com/rayenchatti/ITGate-internship',
    demo: 'Bno94I8VTko',
  },
]

type Project = (typeof PROJECTS)[number]

// Same tier palette as the achievements timeline
const TIER_STYLE: Record<Tier, { color: string; icon: LucideIcon }> = {
  gold: { color: '#F5C451', icon: Trophy },
  silver: { color: '#C9D3DD', icon: Medal },
  neutral: { color: '#9a9aa3', icon: Award },
}

const maskStyle = (url: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${url})`,
  maskImage: `url(${url})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
})

// Red "torch" that follows the cursor — only visible where the logo mask lets it through
const EMBER =
  'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), #FFB27A 0%, #FF3B3B 22%, rgba(122,0,0,0.9) 42%, transparent 62%)'

const SWEEP =
  'linear-gradient(105deg, transparent 38%, rgba(255,59,59,0.85) 48%, #FFB27A 50%, rgba(255,59,59,0.85) 52%, transparent 62%)'

const TITLE_GRADIENT: React.CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, rgba(215,226,234,0.95) 0%, rgba(215,226,234,0.08) 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

/* ── Forge timeline ──
   0 → INTRO: the backdrop title fades. Then each project gets one slot:
   ignite (logo forms at the centre and a hot band sweeps it) → place (logo moves to its column,
   details land one by one) → hold (buttons live) → burn (logo breaks into rising embers).
   The last project never burns: it holds until the section releases. */

const COUNT = PROJECTS.length
const INTRO = 0.1
const SLOT = (1 - INTRO) / COUNT

function slotOf(i: number) {
  const s = INTRO + i * SLOT
  const at = (f: number) => s + SLOT * f
  const last = i === COUNT - 1
  return {
    start: s,
    at,
    last,
    live: [at(0.55), last ? 1.01 : at(0.8)] as const, // buttons clickable
    burn: [at(0.8), at(1)] as const,
    end: last ? 1.01 : at(1),
  }
}

// Which project is on stage; -1 during the intro
const activeIndex = (p: number) => (p < INTRO ? -1 : Math.min(COUNT - 1, Math.floor((p - INTRO) / SLOT)))

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/* ── Shared pieces ── */

function ProjectActions({ project, onDemo }: { project: Project; onDemo: (p: Project) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={project.repo}
        target="_blank"
        rel="noopener noreferrer"
        className="group/btn inline-flex items-center gap-2 rounded-full border border-[#D7E2EA]/25 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#D7E2EA] transition-colors duration-300 hover:border-[#FF3B3B]/60 hover:bg-[#FF3B3B]/10"
      >
        <CodeXml className="h-4 w-4" strokeWidth={2.25} />
        View code
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
          strokeWidth={2.5}
        />
      </a>
      {project.demo && (
        <button
          type="button"
          onClick={() => onDemo(project)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#FF3B3B] to-[#7A0000] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(255,59,59,0.35)] transition-[transform,box-shadow] duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(255,59,59,0.6)]"
        >
          <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2.25} />
          Watch demo
        </button>
      )}
    </div>
  )
}

function AwardBadge({ project }: { project: Project }) {
  const { color, icon: Icon } = TIER_STYLE[project.tier]
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs"
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {project.award}
    </span>
  )
}

function StackList({ stack }: { stack: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {stack.map((tech) => (
        <li
          key={tech}
          className="rounded-full border border-[#D7E2EA]/12 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#D7E2EA]/60"
        >
          {tech}
        </li>
      ))}
    </ul>
  )
}

// Cursor → CSS variables for the logo torch; no re-render per mouse move
function trackTorch(e: React.PointerEvent, logo: HTMLElement | null) {
  if (!logo) return
  const r = logo.getBoundingClientRect()
  logo.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
  logo.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
}

/* ── Demo lightbox: the video plays on the page, so closing it drops you back where you were ── */
function DemoModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!project) return
    const opener = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      opener?.focus({ preventScroll: true })
    }
  }, [project, onClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {project?.demo && (
        <motion.div
          key="demo"
          role="dialog"
          aria-modal="true"
          aria-label={`${project.name} demo video`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0b0c]/90 p-4 backdrop-blur-md sm:p-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            // Width capped by the viewport height too, so a 16:9 player plus the header always fits
            className="relative w-full max-w-[min(64rem,calc((100dvh-9rem)*16/9))]"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="eyebrow-label">Prototype demo</span>
                <h3 className={`${display.className} text-lg font-bold uppercase text-[#D7E2EA] sm:text-2xl`}>
                  {project.name}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close video"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D7E2EA]/25 text-[#D7E2EA] transition-colors duration-300 hover:border-[#FF3B3B]/60 hover:bg-[#FF3B3B]/10"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-[20px] border border-[#FF3B3B]/30 bg-black shadow-[0_0_80px_rgba(255,59,59,0.25)] sm:rounded-[28px]">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${project.demo}?autoplay=1&rel=0&modestbranding=1`}
                title={`${project.name} demo`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ── Burn-out: sparks lift off the logo as it dissolves ── */

// Deterministic scatter so server and client agree (rounded: SSR and the browser print
// long floats differently)
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return Math.round((x - Math.floor(x)) * 1000) / 1000
}
const SPARK_COUNT = 18

function Spark({ burn, seed }: { burn: MotionValue<number>; seed: number }) {
  const left = Math.round(15 + rand(seed) * 70)
  const top = Math.round(25 + rand(seed + 1) * 55)
  const rise = 90 + rand(seed + 2) * 180
  const drift = (rand(seed + 3) - 0.5) * 90
  const delay = rand(seed + 4) * 0.35
  const size = Math.round(2 + rand(seed + 5) * 4)
  const hot = rand(seed + 6) > 0.5

  const t = (v: number) => range(v, delay, delay + 0.6)
  const y = useTransform(burn, (v) => -rise * easeOut(t(v)))
  const x = useTransform(burn, (v) => drift * t(v))
  const opacity = useTransform(burn, (v) => {
    const k = t(v)
    return k === 0 ? 0 : k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85
  })
  const scale = useTransform(burn, (v) => 1 - t(v) * 0.6)

  return (
    <motion.span
      className="absolute rounded-full"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        x,
        y,
        opacity,
        scale,
        background: hot ? '#FFB27A' : '#FF3B3B',
        boxShadow: `0 0 ${size * 3}px ${hot ? '#FF8A4C' : '#FF3B3B'}`,
      }}
    />
  )
}

/* ── One project on the forge stage ── */

// A detail line that blurs up into place, then lifts away as the project burns out
function Reveal({
  progress,
  at,
  out,
  className,
  children,
}: {
  progress: MotionValue<number>
  at: number
  out: readonly [number, number] | null
  className?: string
  children: React.ReactNode
}) {
  const inT = (v: number) => range(v, at, at + SLOT * 0.1)
  const outT = (v: number) => (out ? range(v, out[0], out[0] + (out[1] - out[0]) * 0.6) : 0)
  const opacity = useTransform(progress, (v) => inT(v) * (1 - outT(v)))
  const y = useTransform(progress, (v) => (1 - easeOut(inT(v))) * 24 - outT(v) * 30)
  const blur = useTransform(progress, (v) => (1 - inT(v)) * 8 + outT(v) * 6)
  const filter = useMotionTemplate`blur(${blur}px)`
  return (
    <motion.div style={{ opacity, y, filter }} className={className}>
      {children}
    </motion.div>
  )
}

function ForgeProject({
  project,
  index,
  progress,
  stageRef,
  onDemo,
}: {
  project: Project
  index: number
  progress: MotionValue<number>
  stageRef: React.RefObject<HTMLDivElement | null>
  onDemo: (p: Project) => void
}) {
  const slotRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const s = slotOf(index)
  const { color } = TIER_STYLE[project.tier]
  const mask = maskStyle(project.mask)

  // Offset from the logo's resting spot to the stage centre, where it first forms
  const dx = useMotionValue(0)
  const dy = useMotionValue(0)
  useEffect(() => {
    const measure = () => {
      const slot = slotRef.current?.getBoundingClientRect()
      const stage = stageRef.current?.getBoundingClientRect()
      if (!slot || !stage) return
      dx.set(stage.left + stage.width / 2 - (slot.left + slot.width / 2))
      dy.set(stage.top + stage.height / 2 - (slot.top + slot.height / 2))
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [dx, dy, stageRef])

  const burnT = (v: number) => (s.last ? 0 : range(v, s.burn[0], s.burn[1]))
  const placeT = (v: number) => easeInOut(range(v, s.at(0.18), s.at(0.4)))

  // Function transforms throughout: see the note in AboutSection about the native ScrollTimeline
  const visibility = useTransform(progress, (v) => (v >= s.start && v < s.end ? 'visible' : 'hidden'))
  const pointerEvents = useTransform(progress, (v) => (v >= s.live[0] && v < s.live[1] ? 'auto' : 'none'))

  const logoX = useTransform([progress, dx], ([v, x]: number[]) => (1 - placeT(v)) * x)
  const logoY = useTransform([progress, dy], ([v, y]: number[]) => (1 - placeT(v)) * y - burnT(v) * 20)
  const logoScale = useTransform(progress, (v) => (1.3 - 0.3 * placeT(v)) * (1 + burnT(v) * 0.15))
  const logoOpacity = useTransform(progress, (v) => range(v, s.start, s.at(0.1)) * (1 - range(burnT(v), 0.2, 0.85)))
  const logoBlur = useTransform(progress, (v) => (1 - range(v, s.start, s.at(0.12))) * 10 + burnT(v) * 14)
  const logoFilter = useMotionTemplate`blur(${logoBlur}px)`

  const sweepPos = useTransform(progress, (v) => `${100 - range(v, s.at(0.02), s.at(0.3)) * 100}% 0%`)
  const sweepOpacity = useTransform(progress, (v) => 0.9 * (1 - range(v, s.at(0.26), s.at(0.34))))
  const lit = useTransform(progress, (v) => range(v, s.at(0.24), s.at(0.36)) + burnT(v) * 0.4)
  const bloom = useTransform(lit, (l) => Math.min(l, 1) * 0.55)
  const burn = useTransform(progress, burnT)
  const markOpacity = useTransform(progress, (v) => range(v, s.at(0.3), s.at(0.45)) * (1 - range(burnT(v), 0, 0.5)))

  const out = s.last ? null : s.burn
  const detail = (k: number) => s.at(0.3) + SLOT * 0.035 * k
  const n = String(index + 1).padStart(2, '0')

  return (
    <motion.article
      style={{ visibility }}
      onPointerMove={(e) => trackTorch(e, logoRef.current)}
      className="absolute inset-0 flex items-center justify-center px-5 sm:px-10"
    >
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-6 sm:gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        {/* Logo column */}
        <div ref={slotRef} className="relative mx-auto aspect-square w-[min(48vw,30vh,16rem)] lg:w-[min(30vw,26rem)]">
          {/* Outlined index behind the logo, like the achievements rank */}
          <motion.span
            aria-hidden
            style={{ opacity: markOpacity, WebkitTextStroke: '1.5px rgba(215,226,234,0.18)' }}
            className={`${display.className} pointer-events-none absolute -left-[18%] -top-[22%] select-none font-black leading-none text-transparent`}
          >
            <span style={{ fontSize: 'clamp(4rem, 11vw, 10rem)' }}>{n}</span>
          </motion.span>

          <motion.div
            ref={logoRef}
            role="img"
            aria-label={`${project.name} logo`}
            style={{ x: logoX, y: logoY, scale: logoScale, opacity: logoOpacity, filter: logoFilter }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-[#D7E2EA]/[0.17]" style={mask} />
            <motion.div
              className="absolute inset-0"
              style={{ ...mask, backgroundImage: SWEEP, backgroundSize: '300% 100%', backgroundPosition: sweepPos, opacity: sweepOpacity }}
            />
            {/* Bloom (blur applies after the inner mask, so the glow spills outside the shape) */}
            <motion.div style={{ opacity: bloom }} className="absolute inset-0 blur-xl">
              <div className="absolute inset-0" style={{ ...mask, background: EMBER }} />
            </motion.div>
            <motion.div className="absolute inset-0" style={{ ...mask, background: EMBER, opacity: lit }} />
          </motion.div>

          {!s.last && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {Array.from({ length: SPARK_COUNT }, (_, k) => (
                <Spark key={k} burn={burn} seed={index * 97 + k * 7} />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col items-center gap-3 text-center sm:gap-4 lg:items-start lg:text-left">
          <Reveal progress={progress} at={detail(0)} out={out}>
            <p className={`${grotesk.className} text-[10px] uppercase tracking-[0.45em] text-[#D7E2EA]/50 sm:text-xs`}>
              Project — {n} / {String(COUNT).padStart(2, '0')}
            </p>
          </Reveal>
          <Reveal progress={progress} at={detail(1)} out={out}>
            <AwardBadge project={project} />
          </Reveal>
          <Reveal progress={progress} at={detail(2)} out={out}>
            <h3
              className={`${display.className} font-bold uppercase leading-[1.02] text-[#D7E2EA]`}
              style={{ fontSize: 'clamp(1.6rem, 4.4vw, 3.8rem)', textShadow: '0 6px 40px rgba(0,0,0,0.7)' }}
            >
              {project.name}
            </h3>
          </Reveal>
          <Reveal progress={progress} at={detail(3)} out={out}>
            <p className="max-w-[46ch] text-sm leading-relaxed text-[#D7E2EA]/65 sm:text-base">{project.description}</p>
          </Reveal>
          <Reveal progress={progress} at={detail(4)} out={out}>
            <StackList stack={project.stack} />
          </Reveal>
          <Reveal progress={progress} at={detail(5)} out={out} className="mt-2">
            <motion.div style={{ pointerEvents }}>
              <ProjectActions project={project} onDemo={onDemo} />
            </motion.div>
          </Reveal>
        </div>
      </div>

      {/* Tier light across the stage floor while this project is up */}
      <motion.div
        aria-hidden
        style={{ opacity: markOpacity, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        className="pointer-events-none absolute inset-x-[20%] bottom-[14%] h-px"
      />
    </motion.article>
  )
}

// One tick of the progress rail; click to jump to that project
function RailTick({
  index,
  progress,
  onJump,
}: {
  index: number
  progress: MotionValue<number>
  onJump: (i: number) => void
}) {
  const { color } = TIER_STYLE[PROJECTS[index].tier]
  const opacity = useTransform(progress, (v) => (activeIndex(v) === index ? 1 : 0.3))
  const scaleX = useTransform(progress, (v) => (activeIndex(v) === index ? 1.8 : 1))
  return (
    <button
      type="button"
      onClick={() => onJump(index)}
      aria-label={`Go to ${PROJECTS[index].name}`}
      className="flex h-4 w-12 items-center justify-end"
    >
      <motion.span
        style={{ opacity, scaleX, background: color, boxShadow: `0 0 10px ${color}` }}
        className="block h-[3px] w-6 origin-right rounded-full"
      />
    </button>
  )
}

function ForgeStory({ onDemo }: { onDemo: (p: Project) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  // 0 when the stage pins, 1 when it releases
  const { scrollYProgress: progress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const titleOpacity = useTransform(progress, (v) => 1 - range(v, 0, INTRO))
  const titleScale = useTransform(progress, (v) => 1 + range(v, 0, INTRO) * 0.12)
  const hintOpacity = useTransform(progress, (v) => 1 - range(v, 0, 0.03))
  const hudOpacity = useTransform(progress, (v) => range(v, INTRO - 0.02, INTRO + 0.02))
  const counter = useTransform(progress, (v) => String(Math.max(0, activeIndex(v)) + 1).padStart(2, '0'))

  // Scroll to the middle of a project's hold, when it's fully formed and its buttons are live
  const jumpTo = (i: number) => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const s = slotOf(i)
    const target = (s.live[0] + Math.min(s.live[1], 1)) / 2
    window.scrollTo({ top: top + target * (el.offsetHeight - window.innerHeight), behavior: 'smooth' })
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height: `${(COUNT + 1.5) * 100}dvh` }}>
      <div ref={stage} className="sticky top-0 h-dvh w-full overflow-hidden">
        {/* Huge faded title, like the about section's backdrop type */}
        <motion.div
          style={{ opacity: titleOpacity, scale: titleScale }}
          className="pointer-events-none absolute inset-x-0 top-[14%] flex flex-col items-center gap-2 sm:gap-4"
        >
          <span className="eyebrow-label">Selected Work</span>
          <h2
            className="text-center font-black uppercase leading-[0.85] tracking-tight"
            style={{ fontSize: 'clamp(3.5rem, 17vw, 270px)', ...TITLE_GRADIENT }}
          >
            Projects
          </h2>
        </motion.div>

        {PROJECTS.map((project, i) => (
          <ForgeProject
            key={project.name}
            project={project}
            index={i}
            progress={progress}
            stageRef={stage}
            onDemo={onDemo}
          />
        ))}

        {/* HUD */}
        <motion.div
          style={{ opacity: hudOpacity }}
          className="pointer-events-none absolute inset-x-5 bottom-6 flex items-end justify-between sm:inset-x-10 sm:bottom-10"
        >
          <p className="font-mono text-xs tracking-[0.2em] text-[#D7E2EA]/50">
            <motion.span className="text-2xl font-bold text-[#D7E2EA] sm:text-3xl">{counter}</motion.span>
            {' / '}
            {String(COUNT).padStart(2, '0')}
          </p>
          <div className="pointer-events-auto flex flex-col items-end gap-1">
            {PROJECTS.map((project, i) => (
              <RailTick key={project.name} index={i} progress={progress} onJump={jumpTo} />
            ))}
          </div>
        </motion.div>

        <motion.span
          style={{ opacity: hintOpacity }}
          className="eyebrow-label pointer-events-none absolute inset-x-0 bottom-8 text-center"
        >
          Scroll to ignite
        </motion.span>
      </div>
    </div>
  )
}

/* ── Reduced-motion fallback: the static grid ── */
function ProjectCard({ project, index, onDemo }: { project: Project; index: number; onDemo: (p: Project) => void }) {
  const logoRef = useRef<HTMLDivElement>(null)
  const { color } = TIER_STYLE[project.tier]
  const mask = maskStyle(project.mask)

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const card = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - card.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - card.top}px`)
    trackTorch(e, logoRef.current)
  }

  return (
    <article
      onPointerMove={onPointerMove}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#D7E2EA]/15 bg-[#161618]/85 backdrop-blur-sm transition-colors duration-300 hover:border-[#FF3B3B]/40"
    >
      {/* Card spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,59,59,0.12), transparent 60%)',
        }}
      />
      {/* Tier light along the top edge */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }}
      />

      <div className="relative aspect-[16/10] w-full">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 right-5 select-none font-black leading-none"
          style={{
            fontSize: 'clamp(3.5rem, 7vw, 6rem)',
            backgroundImage: 'linear-gradient(180deg, rgba(215,226,234,0.12) 0%, rgba(215,226,234,0) 90%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="absolute left-5 top-5">
          <AwardBadge project={project} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pt-6">
          <div ref={logoRef} role="img" aria-label={`${project.name} logo`} className="relative aspect-square w-[42%]">
            <div className="absolute inset-0 bg-[#D7E2EA]/[0.17]" style={mask} />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ ...mask, background: EMBER }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-3 border-t border-[#D7E2EA]/10 p-5 sm:p-6">
        <h3 className="text-lg font-bold uppercase leading-tight text-[#D7E2EA] sm:text-xl">{project.name}</h3>
        <p className="text-sm leading-relaxed text-[#D7E2EA]/55">{project.description}</p>
        <div className="pt-1">
          <StackList stack={project.stack} />
        </div>
        <div className="mt-auto pt-3">
          <ProjectActions project={project} onDemo={onDemo} />
        </div>
      </div>
    </article>
  )
}

function ProjectsGrid({ onDemo }: { onDemo: (p: Project) => void }) {
  return (
    <div className="flex w-full flex-col items-center px-4 py-20 sm:px-8 sm:py-24 md:px-10 md:py-32">
      <FadeIn delay={0} y={20} className="mb-16 flex w-full flex-col items-center gap-3 sm:mb-20 md:mb-24">
        <span className="eyebrow-label">Selected Work</span>
        <h2
          className="hero-heading text-center font-black uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.25rem, 8vw, 100px)' }}
        >
          Projects
        </h2>
      </FadeIn>
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.name} project={project} index={i} onDemo={onDemo} />
        ))}
      </div>
    </div>
  )
}

export default function ProjectsSection() {
  const reduceMotion = useReducedMotion()
  const [demo, setDemo] = useState<Project | null>(null)
  const [closeDemo] = useState(() => () => setDemo(null))

  return (
    <section id="projects" className="relative z-10 w-full scroll-mt-10 text-[#D7E2EA]">
      {reduceMotion ? <ProjectsGrid onDemo={setDemo} /> : <ForgeStory onDemo={setDemo} />}
      <DemoModal project={demo} onClose={closeDemo} />
    </section>
  )
}

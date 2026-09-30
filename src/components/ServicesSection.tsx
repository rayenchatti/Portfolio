'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  motion,
  useInView,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import RevealHeading from './RevealHeading'
import Sparkle from './Sparkle'
import { display, grotesk } from './fonts'
import { SKILL_COUNT, SKILL_SLOT, range, skillIndexAt, skillSlot } from './skillsTimeline'

// WebGL only runs in the browser
const SkillsScene = dynamic(() => import('./SkillsScene'), { ssr: false })

const SKILL_CATEGORIES: { num: string; name: string; tags: string[] }[] = [
  { num: '01', name: 'Languages', tags: ['JavaScript', 'Python', 'Java', 'C', 'PL/SQL'] },
  { num: '02', name: 'Frontend / Mobile', tags: ['React Native', 'TypeScript', 'Next.js', 'Tailwind CSS', 'HTML5/CSS3'] },
  { num: '03', name: 'Backend / BaaS', tags: ['Supabase', 'PostgreSQL', 'REST APIs', 'Node.js'] },
  { num: '04', name: 'AI / Data', tags: ['Python (ML)', 'RAG Pipelines', 'Groq API', 'LLM Integration'] },
  { num: '05', name: 'Cybersecurity', tags: ['CTF', 'Forensics', 'Web Exploitation', 'Kali Linux', 'Linux System Admin'] },
  { num: '06', name: 'Tools & DevOps', tags: ['Git', 'GitHub', 'Docker', 'VS Code', 'CI/CD Basics'] },
]

type SkillCategory = (typeof SKILL_CATEGORIES)[number]

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/* ── Floating typography for one category, same language as the achievements ── */
function CategoryType({ category, children }: { category: SkillCategory; children?: React.ReactNode }) {
  return (
    <>
      <p className={`${grotesk.className} mb-3 text-[10px] uppercase tracking-[0.45em] text-[#D7E2EA]/50 sm:mb-4 sm:text-xs`}>
        Skillset — {category.num} / {String(SKILL_COUNT).padStart(2, '0')}
      </p>
      <span
        aria-hidden
        className={`${display.className} block font-black leading-[0.88] text-transparent`}
        style={{ fontSize: 'clamp(3rem, 9vw, 7.5rem)', WebkitTextStroke: '1.5px rgba(215,226,234,0.9)' }}
      >
        {category.num}
      </span>
      <h3
        className={`${display.className} max-w-[16ch] font-bold uppercase leading-[1.05] text-[#D7E2EA]`}
        style={{ fontSize: 'clamp(1.3rem, 2.6vw, 2.3rem)', textShadow: '0 6px 40px rgba(0,0,0,0.7)' }}
      >
        {category.name}
      </h3>
      <span className={`${display.className} mt-3 block text-xs uppercase tracking-[0.35em] text-[#FF3B3B] sm:mt-4 sm:text-sm`}>
        ( {category.tags.length} skills )
      </span>
      {children}
    </>
  )
}

// One line of the sparkle list, landing a beat after the one above it
function SkillItem({ progress, at, children }: { progress: MotionValue<number>; at: number; children: React.ReactNode }) {
  const opacity = useTransform(progress, (v) => range(v, at, at + 0.008))
  const x = useTransform(progress, (v) => (1 - easeOut(range(v, at, at + 0.008))) * -20)
  const rotate = useTransform(progress, (v) => range(v, at, at + 0.02) * 180)
  return (
    <motion.li style={{ opacity, x }} className="flex items-center gap-3">
      <motion.span style={{ rotate }} className="inline-flex">
        <Sparkle className="h-3 w-3 text-[#FF3B3B] sm:h-3.5 sm:w-3.5" />
      </motion.span>
      {children}
    </motion.li>
  )
}

// Blurs in as the camera settles on its ring, blurs out as it swings away — like the About captions
function CategoryCaption({ category, index, progress }: { category: SkillCategory; index: number; progress: MotionValue<number> }) {
  const s = skillSlot(index)
  const first = index === 0
  const last = index === SKILL_COUNT - 1
  const inAt = first ? s.start - 0.04 : s.start - SKILL_SLOT * 0.1
  const inEnd = s.start + SKILL_SLOT * 0.12
  const outAt = last ? s.end + 0.02 : s.turn + SKILL_SLOT * 0.02
  const outEnd = last ? 1 : s.turn + SKILL_SLOT * 0.16

  // Function transforms throughout: see the note in AboutSection about the native ScrollTimeline
  const opacity = useTransform(progress, (v) => range(v, inAt, inEnd) * (1 - range(v, outAt, outEnd)))
  const visibility = useTransform(opacity, (o) => (o > 0.001 ? 'visible' : 'hidden'))
  const y = useTransform(progress, (v) => (1 - easeOut(range(v, inAt, inEnd))) * 40 - range(v, outAt, outEnd) * 40)
  const blur = useTransform(progress, (v) => (1 - range(v, inAt, inEnd)) * 10 + range(v, outAt, outEnd) * 10)
  const filter = useMotionTemplate`blur(${blur}px)`
  const listStart = inEnd - SKILL_SLOT * 0.04

  return (
    <motion.div style={{ opacity, visibility, y, filter }} className="absolute inset-x-0 top-1/2 -translate-y-1/2">
      <CategoryType category={category}>
        <ul
          className={`${grotesk.className} mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-light text-[#D7E2EA]/85 sm:mt-7 sm:text-lg`}
        >
          {category.tags.map((tag, k) => (
            <SkillItem key={tag} progress={progress} at={listStart + k * SKILL_SLOT * 0.05}>
              {tag}
            </SkillItem>
          ))}
        </ul>
      </CategoryType>
    </motion.div>
  )
}

// One tick of the progress rail, lit while its category is on stage
function RailTick({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => (skillIndexAt(v) === index ? 1 : 0.25))
  const scaleX = useTransform(progress, (v) => (skillIndexAt(v) === index ? 1.8 : 1))
  return (
    <motion.span
      style={{ opacity, scaleX }}
      className="block h-[3px] w-6 origin-right rounded-full bg-[#FF3B3B] shadow-[0_0_10px_#FF3B3B]"
    />
  )
}

function SkillsStory() {
  const ref = useRef<HTMLDivElement>(null)
  const active = useInView(ref, { margin: '200px' })

  // 0 when the stage pins, 1 when it releases
  const { scrollYProgress: progress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const titleOpacity = useTransform(progress, (v) => 1 - range(v, 0.02, 0.1))
  const titleScale = useTransform(progress, (v) => 1 + range(v, 0, 0.12) * 0.15)
  // The atom stays hidden on the idle title screen and fades in as the title fades out
  const sceneOpacity = useTransform(progress, (v) => range(v, 0.03, 0.09))
  const hintOpacity = useTransform(progress, (v) => 1 - range(v, 0, 0.03))
  const hudOpacity = useTransform(progress, (v) => range(v, 0.08, 0.12) * (1 - range(v, 0.95, 1)))
  const counter = useTransform(progress, (v) => String(skillIndexAt(v) + 1).padStart(2, '0'))

  return (
    <div ref={ref} className="relative w-full" style={{ height: '560dvh' }}>
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        {/* Huge faded title behind the atom, like the about section's backdrop type */}
        <motion.div
          style={{ opacity: titleOpacity, scale: titleScale }}
          className="pointer-events-none absolute inset-x-0 top-[11%] flex flex-col items-center gap-2 sm:gap-4"
        >
          <span className="eyebrow-label">What I Do</span>
          <h2
            className="text-center font-black uppercase leading-[0.85] tracking-tight"
            style={{
              fontSize: 'clamp(4rem, 19vw, 300px)',
              backgroundImage: 'linear-gradient(180deg, rgba(215,226,234,0.95) 0%, rgba(215,226,234,0.08) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Skills
          </h2>
        </motion.div>

        {/* The atom sits right of the captions on desktop, above them on phones */}
        <motion.div
          style={{ opacity: sceneOpacity }}
          className="absolute inset-x-0 top-0 h-[58%] lg:inset-y-0 lg:left-[40%] lg:right-0 lg:h-full"
        >
          <SkillsScene progress={progress} active={active} categories={SKILL_CATEGORIES} />
        </motion.div>

        {/* Captions */}
        <div className="pointer-events-none absolute inset-x-5 bottom-[6%] top-[52%] sm:inset-x-10 lg:inset-y-0 lg:left-[7%] lg:right-auto lg:w-[40%]">
          {SKILL_CATEGORIES.map((category, i) => (
            <CategoryCaption key={category.num} category={category} index={i} progress={progress} />
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
            {String(SKILL_COUNT).padStart(2, '0')}
          </p>
          <div className="flex flex-col items-end gap-2">
            {SKILL_CATEGORIES.map((category, i) => (
              <RailTick key={category.num} index={i} progress={progress} />
            ))}
          </div>
        </motion.div>

        <motion.span
          style={{ opacity: hintOpacity }}
          className="eyebrow-label pointer-events-none absolute inset-x-0 bottom-8 text-center"
        >
          Scroll
        </motion.span>
      </div>
    </div>
  )
}

/* ── Reduced-motion fallback: the same typography, laid out statically ── */
function SkillsList() {
  return (
    <div className="px-5 py-16 sm:px-8 sm:py-24 md:px-10 md:py-32">
      <RevealHeading eyebrow="What I Do" title="Skills" className="mb-12 sm:mb-16" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 md:grid-cols-2">
        {SKILL_CATEGORIES.map((category) => (
          <div key={category.num}>
            <CategoryType category={category}>
              <ul
                className={`${grotesk.className} mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-light text-[#D7E2EA]/85 sm:text-lg`}
              >
                {category.tags.map((tag) => (
                  <li key={tag} className="flex items-center gap-3">
                    <Sparkle className="h-3 w-3 text-[#FF3B3B] sm:h-3.5 sm:w-3.5" />
                    {tag}
                  </li>
                ))}
              </ul>
            </CategoryType>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ServicesSection() {
  const reduceMotion = useReducedMotion()
  return (
    <section id="skills" className="relative w-full scroll-mt-10 text-[#D7E2EA]">
      {reduceMotion ? <SkillsList /> : <SkillsStory />}
    </section>
  )
}

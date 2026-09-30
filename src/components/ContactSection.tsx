'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowUp, ArrowUpRight, Check, Copy, Download, FileText, Mail, MapPin, Phone } from 'lucide-react'
import CvDialog from './CvDialog'
import ContactForm from './ContactForm'
import GlowRing from './GlowRing'
import Magnet from './Magnet'
import Sparkle from './Sparkle'
import { RELEASE_TWIST, blackHole } from './blackHole'
import { grotesk } from './fonts'

const EMAIL = 'rayen.chatti2005@gmail.com'


const HEADLINE = ["Let's", 'build', 'something', 'together.']

/* ── Live local time in Mahdia ── */
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' })
const subscribeToClock = (onChange: () => void) => {
  const id = setInterval(onChange, 10_000)
  return () => clearInterval(id)
}

function useMahdiaTime() {
  // Empty on the server so the markup never mismatches; fills in on the client
  return useSyncExternalStore(subscribeToClock, () => timeFormat.format(new Date()), () => '')
}

/* ── Headline: each word fills in from an outline as you scroll ── */
function HeadlineWord({ word, progress, range, accent }: { word: string; progress: MotionValue<number>; range: [number, number]; accent: boolean }) {
  const reduceMotion = useReducedMotion()
  const fill = useTransform(progress, (v) =>
    reduceMotion ? 1 : Math.min(Math.max((v - range[0]) / (range[1] - range[0]), 0), 1)
  )

  return (
    <span className="relative inline-block">
      <span
        className={`text-transparent ${accent ? 'italic' : ''}`}
        style={{ WebkitTextStroke: '1px rgba(215, 226, 234, 0.25)' }}
      >
        {word}
      </span>
      <motion.span
        aria-hidden
        style={{ opacity: fill }}
        className={`absolute inset-0 ${accent ? 'italic text-[#FF3B3B]' : 'text-[#D7E2EA]'}`}
      >
        {word}
      </motion.span>
    </span>
  )
}

function ScrubHeadline() {
  const ref = useRef<HTMLHeadingElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })

  return (
    <h2
      ref={ref}
      aria-label={HEADLINE.join(' ')}
      className="font-black uppercase leading-[0.92] tracking-tight"
      style={{ fontSize: 'clamp(2.6rem, 8.5vw, 136px)' }}
    >
      {HEADLINE.map((word, i) => (
        <span key={word}>
          <HeadlineWord
            word={word}
            progress={scrollYProgress}
            range={[i / HEADLINE.length, (i + 1) / HEADLINE.length]}
            accent={i === HEADLINE.length - 1}
          />{' '}
        </span>
      ))}
    </h2>
  )
}

/* ── Magnetic "Let's connect" orb inside the hero's glowing ring — opens the contact form ── */
function RingCta({ onOpen }: { onOpen: () => void }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative mx-auto aspect-square w-[min(19rem,72vw)] shrink-0">
      <div
        className="absolute inset-[6%] rounded-full opacity-50 blur-[60px]"
        style={{ background: 'radial-gradient(circle, #FF2020 0%, #A00000 45%, rgba(160,0,0,0) 75%)' }}
      />
      <GlowRing className="absolute inset-0" spinDuration={24} />
      {/* Accent dot orbiting the ring — the same gesture as the hero portrait, so the page opens and closes on it */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ rotate: 45 }}
        animate={reduceMotion ? undefined : { rotate: 45 + 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-85 mix-blend-screen sm:h-10 sm:w-10"
          style={{ background: 'radial-gradient(circle, #FF3B3B 0%, #7A0000 70%, transparent 100%)' }}
        />
      </motion.div>
      <Magnet padding={80} strength={4} className="absolute inset-[14%]">
        <motion.button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 190, damping: 26 }}
          className="group flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-white"
          style={{
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #FF3B3B 0%, #B00000 45%, #3D0000 100%)',
            boxShadow: '0 20px 60px rgba(255, 32, 32, 0.35), inset 0 0 40px rgba(0, 0, 0, 0.35)',
          }}
        >
          <ArrowUpRight
            className="h-9 w-9 transition-transform duration-500 group-hover:rotate-45"
            strokeWidth={1.75}
          />
          <span className="text-sm font-bold uppercase tracking-[0.2em]">Let&apos;s connect</span>
        </motion.button>
      </Magnet>
    </div>
  )
}

/* ── Contact cards ── */

// Brand marks (Simple Icons, CC0) — lucide dropped its brand icons
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

type CardIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>

// Spaced label with a sparkle — the same typography as the skills and achievements scenes
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${grotesk.className} flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#D7E2EA]/45 sm:text-[11px]`}>
      <Sparkle className="h-2.5 w-2.5 text-[#FF3B3B]" />
      {children}
    </span>
  )
}

// Icon badge: red-tinted glass tile that fills red when its card is hovered
function Badge({ icon: Icon }: { icon: CardIcon }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#FF3B3B]/30 bg-gradient-to-br from-[#FF3B3B]/20 to-[#FF3B3B]/[0.03] text-[#FF6B6B] transition-all duration-300 group-hover:border-[#FF3B3B] group-hover:bg-[#FF3B3B] group-hover:from-[#FF3B3B] group-hover:to-[#B00000] group-hover:text-white sm:h-12 sm:w-12">
      <Icon className="h-5 w-5" strokeWidth={2} />
    </span>
  )
}

// Round arrow in the corner, turning on hover like the old rows
function CornerArrow({ icon: Icon = ArrowUpRight }: { icon?: CardIcon }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D7E2EA]/15 transition-all duration-500 group-hover:rotate-45 group-hover:border-[#FF3B3B]/60">
      <Icon className="h-4 w-4 text-[#D7E2EA]/70 transition-colors group-hover:text-white" strokeWidth={2} />
    </span>
  )
}

// Shell shared by every card: dark glass, cursor spotlight, red light along the top edge
function Card({
  index,
  className = '',
  children,
}: {
  index: number
  className?: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
  }

  return (
    <motion.div
      onPointerMove={onPointerMove}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-[22px] border border-[#D7E2EA]/12 bg-[#161618]/85 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-[#FF3B3B]/40 sm:p-6 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,59,59,0.12), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px opacity-40 transition-opacity duration-300 group-hover:opacity-90"
        style={{ background: 'linear-gradient(90deg, transparent, #FF3B3B, transparent)' }}
      />
      <div className="relative h-full">{children}</div>
    </motion.div>
  )
}

// A clickable card: badge + corner arrow on top, label and value below; the link stretches over it
function LinkCard({
  index,
  icon,
  label,
  value,
  href,
  external,
  className,
  extra,
  long,
}: {
  index: number
  icon: CardIcon
  label: string
  value: string
  href: string
  external?: boolean
  className?: string
  extra?: React.ReactNode
  long?: boolean // long values (the email) drop a size on phones so they fit
}) {
  return (
    <Card index={index} className={className}>
      <div className="flex h-full items-center gap-4 sm:flex-col sm:items-stretch sm:gap-5">
        <div className="flex items-start justify-between gap-3">
          <Badge icon={icon} />
          <div className="hidden items-center gap-2 sm:flex">
            {extra}
            <CornerArrow />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:mt-auto sm:flex-none">
          <CardLabel>{label}</CardLabel>
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`truncate font-semibold text-[#D7E2EA] transition-colors duration-300 after:absolute after:inset-0 group-hover:text-white sm:text-lg ${long ? 'text-[13.5px]' : 'text-[15px]'}`}
          >
            {value}
          </a>
        </div>
        <div className="flex items-center gap-2 sm:hidden">{extra ?? <CornerArrow />}</div>
      </div>
    </Card>
  )
}

function CopyEmailButton() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context or denied) — the mailto link still works
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Email copied' : 'Copy email address'}
      className="relative z-10 flex h-9 items-center gap-1.5 rounded-full border border-[#D7E2EA]/15 px-3 text-xs font-semibold uppercase tracking-wider text-[#D7E2EA]/70 transition-colors duration-300 hover:border-[#FF3B3B]/50 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#FF3B3B]" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function ContactCards({ onOpenCv, time }: { onOpenCv: () => void; time: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <LinkCard
        index={0}
        icon={Mail}
        label="Email"
        value={EMAIL}
        href={`mailto:${EMAIL}`}
        className="sm:col-span-2"
        extra={<CopyEmailButton />}
        long
      />
      <LinkCard
        index={1}
        icon={LinkedInIcon}
        label="LinkedIn"
        value="in/chatti-rayen"
        href="https://linkedin.com/in/chatti-rayen"
        external
      />
      <LinkCard
        index={2}
        icon={GitHubIcon}
        label="GitHub"
        value="@rayenchatti"
        href="https://github.com/rayenchatti"
        external
      />
      <LinkCard index={3} icon={Phone} label="Phone" value="+216 28 887 398" href="tel:+21628887398" />

      {/* Résumé opens the language pop-out */}
      <Card index={4}>
        <div className="flex h-full items-center gap-4 sm:flex-col sm:items-stretch sm:gap-5">
          <div className="flex items-start justify-between gap-3">
            <Badge icon={FileText} />
            <span className="hidden sm:flex">
              <CornerArrow icon={Download} />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:mt-auto sm:flex-none">
            <CardLabel>Résumé</CardLabel>
            <button
              type="button"
              onClick={onOpenCv}
              aria-haspopup="dialog"
              className="cursor-pointer truncate text-left text-[15px] font-semibold text-[#D7E2EA] transition-colors duration-300 after:absolute after:inset-0 group-hover:text-white sm:text-lg"
            >
              CV — EN · FR
            </button>
          </div>
          <span className="sm:hidden">
            <CornerArrow icon={Download} />
          </span>
        </div>
      </Card>

      {/* Location: not a link, just where and what time it is */}
      <Card index={5} className="sm:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Badge icon={MapPin} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <CardLabel>Location</CardLabel>
              <span className="truncate text-[15px] font-semibold text-[#D7E2EA] sm:text-lg">Mahdia, Tunisia</span>
              {time && (
                <span className={`${grotesk.className} text-[10px] uppercase tracking-[0.3em] text-[#D7E2EA]/50 sm:hidden`}>
                  {time} local
                </span>
              )}
            </div>
          </div>
          {time && (
            <span
              className={`${grotesk.className} hidden shrink-0 items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/60 sm:flex sm:text-sm`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF3B3B] opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF3B3B]" />
              </span>
              {time} local
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function ContactSection() {
  const footerRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const time = useMahdiaTime()

  // Wordmark rises into place as the page bottoms out
  const { scrollYProgress } = useScroll({ target: footerRef, offset: ['start end', 'end end'] })
  const wordmarkY = useTransform(scrollYProgress, [0.5, 1], ['35%', '0%'])

  // Closing of the black hole: the achievements outro hands the page over twisted, and it
  // unwinds back to calm as this section scrolls in
  const { scrollYProgress: entry } = useScroll({ target: footerRef, offset: ['start end', 'start 25%'] })
  useMotionValueEvent(entry, 'change', (t) => {
    if (reduceMotion) return
    const eased = t * t * (3 - 2 * t)
    blackHole.pull = t >= 1 ? 0 : RELEASE_TWIST * (1 - eased)
  })
  useEffect(
    () => () => {
      blackHole.pull = 0
    },
    []
  )

  const [formOpen, setFormOpen] = useState(false)
  const openForm = useCallback(() => setFormOpen(true), [])
  const closeForm = useCallback(() => setFormOpen(false), [])
  const [cvOpen, setCvOpen] = useState(false)
  const openCv = useCallback(() => setCvOpen(true), [])
  const closeCv = useCallback(() => setCvOpen(false), [])

  return (
    <footer
      ref={footerRef}
      id="contact"
      className="relative z-10 w-full scroll-mt-10 overflow-hidden px-5 pt-20 text-[#D7E2EA] sm:px-8 sm:pt-24 md:px-10 md:pt-32"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 sm:gap-20">
        <div className="flex flex-col gap-6">
          <span className="eyebrow-label">Get In Touch</span>
          <ScrubHeadline />
          <p className="max-w-xl text-base leading-relaxed text-[#9a9aa3] sm:text-lg">
            Open for software engineering opportunities, AI integrations, cybersecurity challenges, and innovative
            projects. Feel free to reach out directly!
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[auto_1fr] lg:gap-20">
          <RingCta onOpen={openForm} />
          <ContactForm open={formOpen} onClose={closeForm} email={EMAIL} />
          <CvDialog open={cvOpen} onClose={closeCv} />

          <ContactCards onOpenCv={openCv} time={time} />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className={`${grotesk.className} mx-auto mt-10 flex w-full max-w-6xl items-center justify-between gap-4 border-t border-[#D7E2EA]/10 pt-6 text-xs text-[#D7E2EA]/45 sm:mt-14`}
      >
        <span>© {new Date().getFullYear()} Rayen Chatti. All rights reserved.</span>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap uppercase tracking-wider transition-colors hover:text-white"
        >
          Back to top
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D7E2EA]/15 transition-colors group-hover:border-[#FF3B3B] group-hover:bg-[#FF3B3B]">
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" strokeWidth={2.25} />
          </span>
        </button>
      </div>

      {/* Giant wordmark, cropped by the page edge — outlined first name over a solid surname,
          the same outline-and-solid pairing as the achievements typography */}
      <motion.div
        aria-hidden
        style={reduceMotion ? undefined : { y: wordmarkY }}
        className="pointer-events-none mt-6 select-none whitespace-nowrap text-center font-black uppercase leading-[0.78] tracking-tight"
      >
        <span style={{ fontSize: 'clamp(2.5rem, 13vw, 220px)' }}>
          <span className="text-transparent" style={{ WebkitTextStroke: '1.5px rgba(215,226,234,0.55)' }}>
            Rayen
          </span>{' '}
          <span
            style={{
              backgroundImage: 'linear-gradient(180deg, rgba(215,226,234,0.9) 0%, rgba(215,226,234,0.05) 90%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Chatti
          </span>
        </span>
      </motion.div>
    </footer>
  )
}

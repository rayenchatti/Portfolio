'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Download } from 'lucide-react'
import CvDialog from './CvDialog'
import FadeIn from './FadeIn'
import GlowRing from './GlowRing'
import PortraitHead from './PortraitHead'

const NAV_ITEMS = [
  { label: 'ABOUT', href: '#about' },
  { label: 'SKILLS', href: '#skills' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'CONTACT', href: '#contact' },
]

const HEADING_LINES = ["Hi, I'm", 'Rayen']

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const [cvOpen, setCvOpen] = useState(false)

  // Scroll-out "camera push": 0 while the hero fills the screen, 1 once it has scrolled away
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, -80])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const ringScale = useTransform(scrollYProgress, [0, 0.7], [1, 1.35])
  const ringRotate = useTransform(scrollYProgress, [0, 0.7], [0, 90])
  const ringOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={sectionRef} className="relative flex min-h-dvh w-full flex-col overflow-hidden">

      {/* Top bar: logo + plain nav links */}
      <div className="relative z-30 flex w-full items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8 md:px-14 md:pt-10 lg:px-20 xl:px-28">
        <FadeIn delay={0} y={0}>
          <div className="h-8 w-3 rotate-[13deg] rounded-[1px] bg-gradient-to-b from-[#FF3B3B] to-[#8A0000] sm:h-9" />
        </FadeIn>
        <FadeIn delay={0.05} y={0}>
          <nav className="flex items-center gap-6 sm:gap-9 md:gap-8 lg:gap-12">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b8b93] transition-colors duration-300 hover:text-white sm:text-xs md:text-sm"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#FF3B3B] to-[#8A0000] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
        </FadeIn>
      </div>

      {/* Main content: copy left, circular red-framed portrait right */}
      <div className="relative z-10 flex w-full flex-1 flex-col-reverse items-center justify-center gap-10 px-5 pb-12 pt-20 sm:px-10 md:flex-row md:justify-between md:gap-6 md:px-14 md:pb-8 md:pt-16 lg:px-20 xl:px-28">

        {/* Left column — copy */}
        <motion.div
          className="flex w-full max-w-lg flex-col items-start gap-4 sm:gap-5 md:w-1/2"
          style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <FadeIn delay={0.1} y={20}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b8b93] sm:text-sm">
              Portfolio
            </span>
          </FadeIn>

          {/* Letters rise out of a mask one by one */}
          <h1
            aria-label={HEADING_LINES.join(' ')}
            className="font-black uppercase leading-[0.9] text-white"
            style={{ fontSize: 'clamp(2.5rem, 7.5vw, 120px)' }}
          >
            {HEADING_LINES.map((line, lineIndex) => (
              <span key={line} aria-hidden className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                {Array.from(line).map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    className="inline-block"
                    initial={reduceMotion ? false : { y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.25 + lineIndex * 0.15 + charIndex * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {char === ' ' ? ' ' : char}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <FadeIn delay={0.3} y={20}>
            <p className="max-w-md text-sm leading-relaxed text-[#9a9aa3] sm:text-base md:text-lg">
              A software engineering student driven by AI, security, and building products that actually ship.
            </p>
          </FadeIn>

          <FadeIn delay={0.4} y={20} className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4 sm:mt-3">
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex cursor-pointer items-center gap-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#333338] bg-[#141416] transition-all duration-300 group-hover:border-[#555560] sm:h-14 sm:w-14">
                <ArrowRight
                  className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-0.5 sm:h-5 sm:w-5"
                  strokeWidth={2}
                />
              </span>
              <span className="text-sm font-bold text-white sm:text-base">
                Contact Me
              </span>
            </button>
            <button type="button" onClick={() => setCvOpen(true)} aria-haspopup="dialog" className="group flex cursor-pointer items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#FF3B3B]/45 bg-[#FF3B3B]/10 transition-all duration-300 group-hover:border-[#FF3B3B] group-hover:bg-[#FF3B3B] sm:h-14 sm:w-14">
                <Download
                  className="h-4 w-4 text-[#FF6B6B] transition-all duration-300 group-hover:translate-y-0.5 group-hover:text-white sm:h-5 sm:w-5"
                  strokeWidth={2}
                />
              </span>
              <span className="text-sm font-bold text-white sm:text-base">Download CV</span>
            </button>
          </FadeIn>
        </motion.div>

        {/* Right column — circular red-framed portrait */}
        <div className="relative flex w-full items-center justify-center md:w-1/2">
          <FadeIn delay={0.15} y={0} className="relative flex items-center justify-center">
            {/* Ambient halo blending into the animated background behind it */}
            <div
              className="absolute h-[min(44vh,92vw)] w-[min(44vh,92vw)] rounded-full md:h-[min(70vh,40rem)] md:w-[min(70vh,40rem)] opacity-60 blur-[70px] mix-blend-screen"
              style={{
                background: 'radial-gradient(circle, #FF2020 0%, #A00000 45%, rgba(160,0,0,0) 75%)',
              }}
            />
            <motion.div
              className="relative z-10 h-[min(34vh,72vw)] w-[min(34vh,72vw)] md:h-[min(56vh,32rem)] md:w-[min(56vh,32rem)]"
              style={reduceMotion ? undefined : { scale: portraitScale, y: portraitY }}
            >
              {/* Small accent circle orbiting along the glowing ring — starts bottom-left, passes behind the portrait */}
              <motion.div
                className="pointer-events-none absolute -inset-[7%]"
                initial={{ rotate: 225 }}
                animate={reduceMotion ? undefined : { rotate: 225 + 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 mix-blend-screen sm:h-20 sm:w-20"
                  style={{
                    background: 'radial-gradient(circle, #FF3B3B 0%, #7A0000 70%, transparent 100%)',
                  }}
                />
              </motion.div>

              {/* Circular frame — tinted window so it keeps its own presence while the animated background still shows through */}
              <div className="absolute inset-0 overflow-hidden rounded-full border border-[#FF3B3B]/30 shadow-[inset_0_0_60px_rgba(255,32,32,0.25)]">
                <div
                  className="absolute inset-0 opacity-55"
                  style={{
                    background: 'radial-gradient(circle at 50% 32%, #FF2020 0%, #B00000 55%, #3D0000 100%)',
                  }}
                />
              </div>

              {/* Glowing halo ring — sits behind the portrait, which breaks over it */}
              <motion.div
                className="pointer-events-none absolute -inset-[7%]"
                style={reduceMotion ? undefined : { scale: ringScale, rotate: ringRotate, opacity: ringOpacity }}
              >
                <GlowRing className="h-full w-full" />
              </motion.div>

              {/* Portrait — clipped to the circle below its equator, free to rise above it */}
              <div
                className="absolute inset-x-0 bottom-0 z-10 h-[130%] overflow-hidden"
                style={{ borderRadius: '0 0 50% 50% / 0 0 38.46% 38.46%' }}
              >
                {/* Box locked to the image's aspect ratio, so the WebGL portrait lines up with it */}
                <div className="absolute bottom-0 left-1/2 aspect-[528/472] h-[92%] -translate-x-1/2">
                  <PortraitHead src="/head-removebg-preview.png" alt="Rayen Chatti portrait" />
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </div>
      <CvDialog open={cvOpen} onClose={() => setCvOpen(false)} />
    </section>
  )
}

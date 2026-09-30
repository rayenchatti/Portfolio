'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'

interface RevealHeadingProps {
  eyebrow: string
  title: string
  className?: string
  fontSize?: string
}

const lineVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.035 } },
}

const letterVariants: Variants = {
  hidden: { y: '110%' },
  shown: { y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

// Section heading whose letters rise out of a mask — the hero's entrance, triggered on scroll.
// The trigger sits on the heading itself: the hidden letters are clipped, so they can't observe the viewport.
export default function RevealHeading({
  eyebrow,
  title,
  className,
  fontSize = 'clamp(2.25rem, 8vw, 100px)',
}: RevealHeadingProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`flex flex-col items-center gap-3 ${className ?? ''}`}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
    >
      <motion.span
        className="eyebrow-label"
        variants={{ hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
      >
        {eyebrow}
      </motion.span>
      <h2
        aria-label={title}
        className="hero-heading text-center font-black uppercase leading-none tracking-tight"
        style={{ fontSize }}
      >
        <motion.span aria-hidden className="-mb-[0.12em] block overflow-hidden pb-[0.12em]" variants={lineVariants}>
          {Array.from(title).map((char, i) => (
            <motion.span key={i} className="inline-block" variants={letterVariants}>
              {char === ' ' ? ' ' : char}
            </motion.span>
          ))}
        </motion.span>
      </h2>
    </motion.div>
  )
}

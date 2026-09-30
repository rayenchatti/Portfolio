'use client'

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface GlowRingProps {
  className?: string
  spinDuration?: number
}

// Thin white-to-red glowing ring that slowly spins — shared halo behind the hero portrait and the about PC
export default function GlowRing({ className, spinDuration = 30 }: GlowRingProps) {
  const gradientId = `glow-ring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const reduceMotion = useReducedMotion()

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      style={{
        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.7)) drop-shadow(0 0 18px rgba(255,59,59,0.8))',
      }}
      animate={reduceMotion ? undefined : { rotate: 360 }}
      transition={{ duration: spinDuration, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#FFD6D6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF3B3B" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="none" stroke={`url(#${gradientId})`} strokeWidth="0.8" />
    </motion.svg>
  )
}

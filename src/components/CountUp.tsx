'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  value: string
  duration?: number
  className?: string
}

export default function CountUp({ value, duration = 1.6, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const match = useMemo(() => value.match(/^(\D*)(\d+)(\D*)$/), [value])
  const [display, setDisplay] = useState(() => (match ? `${match[1]}0${match[3]}` : value))

  useEffect(() => {
    if (!isInView || !match) return

    const [, prefix, digits, suffix] = match
    const target = parseInt(digits, 10)
    const start = performance.now()

    let frame: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      setDisplay(`${prefix}${current}${suffix}`)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, match, duration])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

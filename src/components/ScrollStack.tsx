'use client'

import React, { useLayoutEffect, useRef, useCallback, useEffect } from 'react'
import './ScrollStack.css'

export const ScrollStackItem = ({ children, itemClassName = '' }: { children: React.ReactNode; itemClassName?: string }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
)

interface ScrollStackProps {
  children: React.ReactNode
  className?: string
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string
  scaleEndPosition?: string
  baseScale?: number
  scaleDuration?: number
  rotationAmount?: number
  blurAmount?: number
  useWindowScroll?: boolean
  onStackComplete?: () => void
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}: ScrollStackProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const stackCompletedRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)
  const cardsRef = useRef<HTMLElement[]>([])
  const lastTransformsRef = useRef(new Map<number, { translateY: number; scale: number; rotation: number; blur: number }>())
  const isUpdatingRef = useRef(false)
  const cardOffsetsRef = useRef<number[]>([])
  const endOffsetRef = useRef<number>(0)

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (end <= start) return 0
    if (scrollTop < start) return 0
    if (scrollTop > end) return 1
    return (scrollTop - start) / (end - start)
  }, [])

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight
    }
    return parseFloat(value as string)
  }, [])

  // Recalculate cached offsets (call on mount & resize, not every frame)
  const recalcOffsets = useCallback(() => {
    const cards = cardsRef.current
    if (!cards.length) return

    if (useWindowScroll) {
      cardOffsetsRef.current = cards.map(card => {
        const rect = card.getBoundingClientRect()
        return rect.top + window.scrollY
      })
      const endEl = document.querySelector('.scroll-stack-end') as HTMLElement | null
      if (endEl) {
        const rect = endEl.getBoundingClientRect()
        endOffsetRef.current = rect.top + window.scrollY
      }
    } else {
      const scroller = scrollerRef.current
      if (!scroller) return
      cardOffsetsRef.current = cards.map(card => card.offsetTop)
      const endEl = scroller.querySelector('.scroll-stack-end') as HTMLElement | null
      endOffsetRef.current = endEl ? endEl.offsetTop : 0
    }
  }, [useWindowScroll])

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return

    isUpdatingRef.current = true

    let scrollTop: number
    let containerHeight: number

    if (useWindowScroll) {
      scrollTop = window.scrollY
      containerHeight = window.innerHeight
    } else {
      const scroller = scrollerRef.current
      scrollTop = scroller ? scroller.scrollTop : 0
      containerHeight = scroller ? scroller.clientHeight : window.innerHeight
    }

    const stackPositionPx = parsePercentage(stackPosition, containerHeight)
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight)
    const endElementTop = endOffsetRef.current

    const cards = cardsRef.current
    const offsets = cardOffsetsRef.current

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      if (!card || offsets[i] === undefined) continue

      const cardTop = offsets[i]
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i
      const triggerEnd = cardTop - scaleEndPositionPx
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i
      const pinEnd = endElementTop - containerHeight / 2

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
      const targetScale = baseScale + i * itemScale
      const scale = 1 - scaleProgress * (1 - targetScale)
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0

      let blur = 0
      if (blurAmount) {
        let topCardIndex = 0
        for (let j = 0; j < cards.length; j++) {
          if (offsets[j] === undefined) continue
          const jTriggerStart = offsets[j] - stackPositionPx - itemStackDistance * j
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j
          }
        }
        if (i < topCardIndex) {
          blur = Math.max(0, (topCardIndex - i) * blurAmount)
        }
      }

      let translateY = 0
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i
      }

      const newTransform = { translateY, scale, rotation, blur }

      const lastTransform = lastTransformsRef.current.get(i)
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - translateY) > 0.05 ||
        Math.abs(lastTransform.scale - scale) > 0.0005 ||
        Math.abs(lastTransform.rotation - rotation) > 0.05 ||
        Math.abs(lastTransform.blur - blur) > 0.05

      if (hasChanged) {
        card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`
        card.style.filter = blur > 0 ? `blur(${blur}px)` : 'none'
        lastTransformsRef.current.set(i, newTransform)
      }

      // Stack-complete callback on last card
      if (i === cards.length - 1) {
        if (isPinned && !stackCompletedRef.current) {
          stackCompletedRef.current = true
          onStackComplete?.()
        } else if (!isPinned && stackCompletedRef.current) {
          stackCompletedRef.current = false
        }
      }
    }

    isUpdatingRef.current = false
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    calculateProgress,
    parsePercentage
  ])

  // RAF-based scroll handler to avoid stacking multiple updates per frame
  const rafIdRef = useRef<number | null>(null)

  const handleScroll = useCallback(() => {
    if (rafIdRef.current !== null) return
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      updateCardTransforms()
    })
  }, [updateCardTransforms])

  // Set up the scroll listener & card initialization
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card')
        : scroller.querySelectorAll('.scroll-stack-card')
    ) as HTMLElement[]

    cardsRef.current = cards
    const transformsCache = lastTransformsRef.current

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`
      }
      card.style.willChange = 'transform, filter'
      card.style.transformOrigin = 'top center'
      card.style.backfaceVisibility = 'hidden'
      card.style.transform = 'translateZ(0)'
    })

    // Calculate initial offsets
    recalcOffsets()
    updateCardTransforms()

    // Bind scroll events — use the native scroll event for reliability
    const scrollTarget = useWindowScroll ? window : scroller
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true })

    // Recalculate offsets on resize (debounced)
    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        recalcOffsets()
        updateCardTransforms()
      }, 150)
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      stackCompletedRef.current = false
      cardsRef.current = []
      cardOffsetsRef.current = []
      transformsCache.clear()
      isUpdatingRef.current = false
    }
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    handleScroll,
    recalcOffsets,
    updateCardTransforms
  ])

  // Re-calc offsets after images/fonts finish loading (avoids wrong positions)
  useEffect(() => {
    const reCalc = () => {
      recalcOffsets()
      updateCardTransforms()
    }
    if (typeof window !== 'undefined' && document.readyState !== 'complete') {
      window.addEventListener('load', reCalc, { once: true })
      return () => window.removeEventListener('load', reCalc)
    } else {
      // Already loaded — schedule a recalc after a short delay to let layout settle
      const id = setTimeout(reCalc, 100)
      return () => clearTimeout(id)
    }
  }, [recalcOffsets, updateCardTransforms])

  const containerClass = useWindowScroll
    ? `scroll-stack-scroller ${className}`.trim()
    : `scroll-stack-scroller scroll-stack-scroller--container ${className}`.trim()

  return (
    <div className={containerClass} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end" />
      </div>
    </div>
  )
}

export default ScrollStack

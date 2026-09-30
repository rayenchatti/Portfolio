'use client'

import React, { useRef, useEffect, useState } from 'react'
import './GooeyNav.css'

export interface GooeyNavItem {
  label: string
  href: string
}

interface GooeyNavProps {
  items: GooeyNavItem[]
  animationTime?: number
  particleCount?: number
  particleDistances?: [number, number]
  particleR?: number
  timeVariance?: number
  colors?: number[]
  initialActiveIndex?: number
}

export default function GooeyNav({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = -1
}: GooeyNavProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLUListElement>(null)
  const filterRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [activeIndex, setActiveIndex] = useState<number>(initialActiveIndex)

  const noise = (n = 1) => n / 2 - Math.random() * n

  const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180)
    return [distance * Math.cos(angle), distance * Math.sin(angle)]
  }

  const createParticle = (i: number, t: number, d: [number, number], r: number) => {
    const rotate = noise(r / 10)
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    }
  }

  const makeParticles = (element: HTMLElement) => {
    const d = particleDistances
    const r = particleR
    const bubbleTime = animationTime * 2 + timeVariance
    element.style.setProperty('--time', `${bubbleTime}ms`)

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2)
      const p = createParticle(i, t, d, r)
      element.classList.remove('active')

      setTimeout(() => {
        const particle = document.createElement('span')
        const point = document.createElement('span')
        particle.classList.add('particle')
        particle.style.setProperty('--start-x', `${p.start[0]}px`)
        particle.style.setProperty('--start-y', `${p.start[1]}px`)
        particle.style.setProperty('--end-x', `${p.end[0]}px`)
        particle.style.setProperty('--end-y', `${p.end[1]}px`)
        particle.style.setProperty('--time', `${p.time}ms`)
        particle.style.setProperty('--scale', `${p.scale}`)
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`)
        particle.style.setProperty('--rotate', `${p.rotate}deg`)

        point.classList.add('point')
        particle.appendChild(point)
        element.appendChild(particle)
        requestAnimationFrame(() => {
          element.classList.add('active')
        })
        setTimeout(() => {
          try {
            element.removeChild(particle)
          } catch {
            // Do nothing
          }
        }, t)
      }, 30)
    }
  }

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const pos = element.getBoundingClientRect()

    const styles = {
      left: `${Math.round(pos.x - containerRect.x)}px`,
      top: `${Math.round(pos.y - containerRect.y)}px`,
      width: `${Math.round(pos.width)}px`,
      height: `${Math.round(pos.height)}px`
    }
    Object.assign(filterRef.current.style, styles)
    Object.assign(textRef.current.style, styles)
    textRef.current.innerText = element.innerText
  }

  const handleHover = (liEl: HTMLElement, index: number) => {
    if (activeIndex === index) return

    setActiveIndex(index)
    updateEffectPosition(liEl)

    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll('.particle')
      particles.forEach(p => filterRef.current?.removeChild(p))
    }

    if (textRef.current) {
      textRef.current.classList.remove('active')
      void textRef.current.offsetWidth
      textRef.current.classList.add('active')
    }

    if (filterRef.current) {
      makeParticles(filterRef.current)
    }
  }

  const handleMouseLeaveNav = () => {
    setActiveIndex(-1)
    if (textRef.current) {
      textRef.current.classList.remove('active')
      textRef.current.innerText = ''
    }
    if (filterRef.current) {
      filterRef.current.classList.remove('active')
      const particles = filterRef.current.querySelectorAll('.particle')
      particles.forEach(p => filterRef.current?.removeChild(p))
    }
  }

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return
    if (activeIndex >= 0) {
      const activeLi = navRef.current.querySelectorAll('li')[activeIndex]
      if (activeLi) {
        updateEffectPosition(activeLi)
        textRef.current?.classList.add('active')
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      if (activeIndex >= 0) {
        const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex]
        if (currentActiveLi) {
          updateEffectPosition(currentActiveLi)
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [activeIndex])

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <nav onMouseLeave={handleMouseLeaveNav}>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li
              key={index}
              className={activeIndex === index ? 'active' : ''}
              onMouseEnter={(e) => handleHover(e.currentTarget, index)}
            >
              <a href={item.href}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <span className={`effect filter ${activeIndex >= 0 ? 'opacity-100' : 'opacity-0'}`} ref={filterRef} />
      <span className={`effect text ${activeIndex >= 0 ? 'opacity-100' : 'opacity-0'}`} ref={textRef} />
    </div>
  )
}

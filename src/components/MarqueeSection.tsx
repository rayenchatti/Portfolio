'use client'

import { useRef, useEffect } from 'react'

const IMAGES = [
  'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
  'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
  'https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
  'https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif',
  'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
  'https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif',
  'https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif',
  'https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif',
  'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
  'https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif',
  'https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif',
  'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
  'https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif',
  'https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif',
  'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
  'https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif',
  'https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif',
  'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
  'https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif',
]

const ROW1 = IMAGES.slice(0, 11)
const ROW2 = IMAGES.slice(11)

// Triple for seamless loop
const ROW1_TRIPLED = [...ROW1, ...ROW1, ...ROW1]
const ROW2_TRIPLED = [...ROW2, ...ROW2, ...ROW2]

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const row1Ref = useRef<HTMLDivElement>(null)
  const row2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frameId: number | null = null

    const updateRows = () => {
      frameId = null
      if (!sectionRef.current || !row1Ref.current || !row2Ref.current) return

      const sectionTop = sectionRef.current.offsetTop
      const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3

      row1Ref.current.style.transform = `translate3d(${offset - 200}px, 0, 0)`
      row2Ref.current.style.transform = `translate3d(${-(offset - 200)}px, 0, 0)`
    }

    const handleScroll = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(updateRows)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateRows()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[#1A1A1A]/70 pt-24 sm:pt-32 md:pt-40 pb-10 overflow-hidden w-full"
    >
      {/* Row 1 - moves right */}
      <div className="overflow-hidden mb-3 w-full" style={{ willChange: 'transform' }}>
        <div
          ref={row1Ref}
          className="flex gap-3 w-max"
          style={{
            transform: 'translate3d(-200px, 0, 0)',
            willChange: 'transform',
          }}
        >
          {ROW1_TRIPLED.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`r1-${i}`}
              src={src}
              alt=""
              loading="lazy"
              className="w-[260px] h-[170px] sm:w-[340px] sm:h-[220px] md:w-[420px] md:h-[270px] rounded-2xl object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Row 2 - moves left */}
      <div className="overflow-hidden w-full" style={{ willChange: 'transform' }}>
        <div
          ref={row2Ref}
          className="flex gap-3 w-max"
          style={{
            transform: 'translate3d(200px, 0, 0)',
            willChange: 'transform',
          }}
        >
          {ROW2_TRIPLED.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`r2-${i}`}
              src={src}
              alt=""
              loading="lazy"
              className="w-[260px] h-[170px] sm:w-[340px] sm:h-[220px] md:w-[420px] md:h-[270px] rounded-2xl object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

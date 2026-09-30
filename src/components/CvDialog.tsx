'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Download, Eye, X } from 'lucide-react'
import { CV, CV_UPDATED, type CvLang } from './cv'
import { grotesk } from './fonts'

/* Pop-out to pick which CV to view or download: one card per language, each with a preview
   of the first page. Rendered into <body> so no transformed section can clip or offset it. */
export default function CvDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
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
  }, [open, onClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="cv-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-dialog-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0b0b0c]/85 p-4 backdrop-blur-md sm:p-8"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#D7E2EA]/15 bg-[#141416]/95 p-6 shadow-[0_30px_120px_rgba(255,32,32,0.18)] sm:p-9"
          >
            {/* Red glow behind the header, like the site's section halos */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-[80px]"
              style={{ background: 'radial-gradient(circle, #FF2020 0%, rgba(160,0,0,0) 70%)' }}
            />

            <div className="relative mb-7 flex items-start justify-between gap-4 sm:mb-9">
              <div className="flex flex-col gap-2">
                <span className="eyebrow-label">Résumé · Updated {CV_UPDATED}</span>
                <h2
                  id="cv-dialog-title"
                  className="font-black uppercase leading-none tracking-tight text-[#D7E2EA]"
                  style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
                >
                  Choose a <span className="italic text-[#FF3B3B]">language</span>
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D7E2EA]/20 text-[#D7E2EA] transition-colors duration-300 hover:border-[#FF3B3B] hover:bg-[#FF3B3B] hover:text-white"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>

            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {(Object.keys(CV) as CvLang[]).map((lang, i) => (
                <CvOption key={lang} lang={lang} index={i} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function CvOption({ lang, index }: { lang: CvLang; index: number }) {
  const cv = CV[lang]
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-[#D7E2EA]/12 bg-[#1A1A1C] transition-colors duration-300 hover:border-[#FF3B3B]/50"
    >
      {/* Preview: top of the first page, fading into the card */}
      <a
        href={cv.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View the ${cv.language} CV`}
        className="relative block h-40 overflow-hidden bg-white sm:h-52"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cv.preview}
          alt=""
          className="w-full origin-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1A1A1C] to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-[#141416] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          {lang}
        </span>
      </a>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xl font-bold text-[#D7E2EA]">{cv.language}</span>
          <span className={`${grotesk.className} text-[10px] uppercase tracking-[0.25em] text-[#D7E2EA]/40`}>PDF</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={cv.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#D7E2EA]/20 text-xs font-bold uppercase tracking-wider text-[#D7E2EA] transition-colors duration-300 hover:border-[#D7E2EA]/60 hover:text-white"
          >
            <Eye className="h-4 w-4" strokeWidth={2.25} />
            View
          </a>
          <a
            href={cv.url}
            download={cv.filename}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#FF3B3B] to-[#7A0000] text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(255,59,59,0.3)] transition-[transform,box-shadow] duration-300 hover:scale-[1.03] hover:shadow-[0_0_36px_rgba(255,59,59,0.55)]"
          >
            <Download className="h-4 w-4" strokeWidth={2.25} />
            Download
          </a>
        </div>
      </div>
    </motion.div>
  )
}

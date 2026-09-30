'use client'

import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Loader2, Send, X } from 'lucide-react'
import Sparkle from './Sparkle'
import { grotesk } from './fonts'

const TOPICS = ['Opportunity', 'Project', 'Collaboration', 'Just saying hi']

// With a Web3Forms access key (free, https://web3forms.com) messages are delivered straight to the inbox.
// Without one, the form hands the message to the visitor's email app, pre-filled.
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY

type Status = 'idle' | 'sending' | 'sent' | 'handoff' | 'error'

const noopSubscribe = () => () => {}

const fieldClass = `${grotesk.className} w-full border-b border-[#D7E2EA]/15 bg-transparent py-2.5 text-base text-[#D7E2EA] outline-none transition-colors placeholder:text-[#D7E2EA]/25 focus:border-[#FF3B3B] sm:text-lg`

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`${grotesk.className} flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#D7E2EA]/45 sm:text-[11px]`}
    >
      <Sparkle className="h-2.5 w-2.5 text-[#FF3B3B]" />
      {children}
    </label>
  )
}

export default function ContactForm({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const reduceMotion = useReducedMotion()
  // Portals need the document; false during server render
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const id = useId()
  const [topic, setTopic] = useState(TOPICS[0])
  const [status, setStatus] = useState<Status>('idle')
  const [sender, setSender] = useState({ name: '', email: '' })

  // Escape closes; the page behind stays put while the card is open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])


  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('botcheck')) return // honeypot: only bots tick the hidden box
    const name = String(data.get('name') ?? '').trim()
    const from = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    const subject = `Portfolio — ${topic}`
    setSender({ name, email: from })

    if (!WEB3FORMS_KEY) {
      const body = `${message}\n\n— ${name} (${from})`
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setStatus('handoff')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: name, name, email: from, topic, message }),
      })
      const json = await res.json()
      setStatus(json.success ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const done = status === 'sent' || status === 'handoff'

  if (!mounted) return null

  return createPortal(
    // Back to a fresh form once the dialog has closed
    <AnimatePresence onExitComplete={() => setStatus('idle')}>
      {open && (
        <motion.div
          key="contact-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0b0b0c]/85 p-4 backdrop-blur-md sm:p-8"
        >
          {/* Same frame as the CV picker: dark glass, a red halo in the corner, a lit top edge */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#D7E2EA]/15 bg-[#141416]/95 p-6 shadow-[0_30px_120px_rgba(255,32,32,0.18)] sm:p-9"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-[80px]"
              style={{ background: 'radial-gradient(circle, #FF2020 0%, rgba(160,0,0,0) 70%)' }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px opacity-70"
              style={{ background: 'linear-gradient(90deg, transparent, #FF3B3B, transparent)' }}
            />

            <div className="relative">
              <div className="mb-7 flex items-start justify-between gap-4 sm:mb-8">
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="eyebrow-label">Get In Touch</span>
                  <h2
                    id={`${id}-title`}
                    className="font-black uppercase leading-none tracking-tight text-[#D7E2EA]"
                    style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
                  >
                    {status === 'sent' ? (
                      <>
                        Message <span className="italic text-[#FF3B3B]">sent</span>
                      </>
                    ) : status === 'handoff' ? (
                      <>
                        Almost <span className="italic text-[#FF3B3B]">there</span>
                      </>
                    ) : (
                      <>
                        Let&apos;s <span className="italic text-[#FF3B3B]">connect</span>
                      </>
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D7E2EA]/20 text-[#D7E2EA] transition-colors duration-300 hover:border-[#FF3B3B] hover:bg-[#FF3B3B] hover:text-white"
                >
                  <X className="h-5 w-5" strokeWidth={2.25} />
                </button>
              </div>

              {done ? (
                <div className="flex flex-col items-start gap-6">
                  <p className="max-w-md text-base leading-relaxed text-[#9a9aa3] sm:text-lg">
                    {status === 'sent'
                      ? `Thanks${sender.name ? `, ${sender.name}` : ''} — I'll reply to ${sender.email} soon.`
                      : 'Your email app should have opened with the message ready — just hit send.'}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 items-center gap-2 rounded-full border border-[#D7E2EA]/20 px-6 text-xs font-bold uppercase tracking-wider text-[#D7E2EA] transition-colors duration-300 hover:border-[#FF3B3B] hover:bg-[#FF3B3B] hover:text-white"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.25} />
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-7">
                  <p className="-mt-3 max-w-md text-sm leading-relaxed text-[#9a9aa3] sm:text-base">
                    Tell me what you have in mind — an opportunity, a project or just an idea.
                  </p>

                  {/* Topic — the same chips as the project tech tags */}
                  <fieldset className="flex flex-col gap-3">
                    <legend className={`${grotesk.className} mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#D7E2EA]/45 sm:text-[11px]`}>
                      <Sparkle className="h-2.5 w-2.5 text-[#FF3B3B]" />
                      What is it about?
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={topic === t}
                          onClick={() => setTopic(t)}
                          className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors duration-300 ${
                            topic === t
                              ? 'border-[#FF3B3B] bg-[#FF3B3B] text-white'
                              : 'border-[#D7E2EA]/15 text-[#D7E2EA]/60 hover:border-[#FF3B3B]/50 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
                      <input
                        id={`${id}-name`}
                        name="name"
                        required
                        autoComplete="name"
                        autoFocus
                        placeholder="Your name"
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
                      <input
                        id={`${id}-email`}
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor={`${id}-message`}>Message</FieldLabel>
                    <textarea
                      id={`${id}-message`}
                      name="message"
                      required
                      minLength={10}
                      rows={4}
                      placeholder="Hi Rayen, I'd love to talk about…"
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  {/* Honeypot — hidden from people, filled in by bots */}
                  <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" />

                  {status === 'error' && (
                    <p role="alert" className="text-sm text-[#FF6A6A]">
                      Couldn&apos;t send that — please try again, or email me directly.
                    </p>
                  )}

                  <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[#D7E2EA]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <a
                      href={`mailto:${email}`}
                      className="text-center text-sm text-[#9a9aa3] underline-offset-4 transition-colors hover:text-white hover:underline sm:text-left"
                    >
                      or email me directly
                    </a>
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#FF3B3B] to-[#7A0000] px-7 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(255,59,59,0.35)] transition-[transform,box-shadow] duration-300 hover:scale-[1.03] hover:shadow-[0_0_36px_rgba(255,59,59,0.6)] disabled:opacity-70"
                    >
                      {status === 'sending' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" strokeWidth={2.25} />
                      )}
                      {status === 'sending' ? 'Sending' : 'Send message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

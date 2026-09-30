'use client'

export default function ContactButton() {
  return (
    <button
      onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
      className="min-h-11 min-w-[9.5rem] shrink-0 rounded-full px-7 py-3 text-sm font-medium uppercase text-white cursor-pointer sm:min-w-[11rem] sm:px-9 sm:py-3.5 md:min-w-[12.5rem] md:px-11 md:py-4 md:text-base"
      style={{
        background:
          'linear-gradient(123deg, #1F0000 7%, #B00000 37%, #7A0000 72%, #FF3B3B 100%)',
        boxShadow:
          '0px 4px 4px rgba(255, 59, 59, 0.25), 4px 4px 12px #7A0000 inset',
        outline: '2px solid white',
        outlineOffset: '-3px',
      }}
    >
      Contact Me
    </button>
  )
}


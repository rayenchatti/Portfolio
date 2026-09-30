const SPARKLE_PATH = 'M12 0C12.6 7.8 16.2 11.4 24 12 16.2 12.6 12.6 16.2 12 24 11.4 16.2 7.8 12.6 0 12 7.8 11.4 11.4 7.8 12 0Z'

// Four-point star used as the list bullet in the floating typography
export default function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d={SPARKLE_PATH} fill="currentColor" />
    </svg>
  )
}

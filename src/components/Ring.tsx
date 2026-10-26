import type { ReactNode } from 'react'

/**
 * The Tarn ring: progress drawn as ripples on still water. Faint outer ripples are decoration;
 * the forest arc is the real value, and the label inside carries it for screen readers.
 */
export function Ring({ progress, children, label, size = 232 }: { progress: number; children: ReactNode; label: string; size?: number }) {
  const p = Math.max(0, Math.min(1, progress))
  const r = 88
  const c = 2 * Math.PI * r
  const angle = p * 2 * Math.PI - Math.PI / 2
  const dot = { x: 120 + r * Math.cos(angle), y: 120 + r * Math.sin(angle) }
  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size, maxWidth: '100%', aspectRatio: '1' }} role="img" aria-label={label}>
      <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
        <circle cx="120" cy="120" r="116" fill="none" strokeOpacity="0.4" strokeWidth="1" style={{ stroke: 'var(--color-sage)' }} />
        <circle cx="120" cy="120" r="104" fill="none" strokeOpacity="0.6" strokeWidth="1" style={{ stroke: 'var(--color-sage)' }} />
        <circle cx="120" cy="120" r={r} strokeWidth="8" style={{ fill: 'var(--color-cream)', stroke: 'var(--color-sage-soft)' }} />
        {p > 0 && (
          <circle
            cx="120"
            cy="120"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${c * p} ${c}`}
            transform="rotate(-90 120 120)"
            style={{ stroke: 'var(--color-forest)', transition: 'stroke-dasharray 0.8s cubic-bezier(0.2, 0.7, 0.2, 1)' }}
          />
        )}
        {p > 0 && p < 1 && <circle cx={dot.x} cy={dot.y} r="6.5" strokeWidth="2.5" style={{ fill: 'var(--color-gold)', stroke: 'var(--color-cream)' }} />}
      </svg>
      <div className="relative text-center" aria-hidden>
        {children}
      </div>
    </div>
  )
}

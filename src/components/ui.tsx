import { Check, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Tone = 'primary' | 'quiet' | 'ghost' | 'danger'

const TONES: Record<Tone, string> = {
  primary: 'bg-forest text-cream hover:bg-forest-deep',
  quiet: 'bg-cream text-ink border border-stone hover:border-moss',
  ghost: 'text-forest hover:bg-sage-soft',
  danger: 'bg-cream text-clay border border-clay/40 hover:bg-clay hover:text-cream',
}

export function Button({ tone = 'primary', size = 'md', className = '', ...rest }: { tone?: Tone; size?: 'sm' | 'md' | 'lg' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { sm: 'min-h-11 px-4 text-sm', md: 'min-h-11 px-5 text-[0.95rem]', lg: 'min-h-14 px-6 text-base' }
  return (
    <button
      type="button"
      className={`press inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${TONES[tone]} ${className}`}
      {...rest}
    />
  )
}

export function Card({ children, className = '', as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' } & Record<string, unknown>) {
  return (
    <As className={`rounded-3xl border border-stone/80 bg-cream p-5 shadow-soft sm:p-6 ${className}`} {...rest}>
      {children}
    </As>
  )
}

export function H1({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 className={`serif text-[2rem] leading-[1.1] font-normal tracking-[-0.01em] text-balance text-ink sm:text-[2.5rem] ${className}`}>{children}</h1>
}

export function H2({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={`serif text-[1.35rem] leading-tight font-normal text-ink ${className}`}>
      {children}
    </h2>
  )
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[0.95rem] leading-relaxed text-ink-soft ${className}`}>{children}</p>
}

/** A selectable row. Used for single and multiple choice lists. */
export function Choice({
  selected,
  onClick,
  title,
  detail,
  role = 'radio',
  icon,
}: {
  selected: boolean
  onClick: () => void
  title: string
  detail?: string
  role?: 'radio' | 'checkbox'
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={`press flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left ${selected ? 'border-forest bg-sage-soft' : 'border-stone bg-cream hover:border-moss'}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 grid size-5 shrink-0 place-items-center border ${role === 'radio' ? 'rounded-full' : 'rounded-md'} ${selected ? 'border-forest bg-forest' : 'border-moss bg-cream'}`}
      >
        {selected && (role === 'radio' ? <span className="size-2 rounded-full bg-cream" /> : <Check size={14} strokeWidth={3} className="text-cream" />)}
      </span>
      {icon && <span className="mt-0.5 shrink-0 text-forest">{icon}</span>}
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{title}</span>
        {detail && <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{detail}</span>}
      </span>
    </button>
  )
}

/** Small toggle pill for multi select chips. */
export function Chip({ selected, onClick, children, role }: { selected: boolean; onClick: () => void; children: ReactNode; role?: 'radio' | 'checkbox' }) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role ? selected : undefined}
      onClick={onClick}
      className={`press min-h-10 rounded-full border px-4 text-sm font-medium ${selected ? 'border-forest bg-forest text-cream' : 'border-stone bg-cream text-ink hover:border-moss'}`}
    >
      {children}
    </button>
  )
}

/** One to five scale as a radio group with words at the ends. */
export function Scale({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (v: number | null) => void; low: string; high: string }) {
  const id = useId()
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={id} className="text-sm font-semibold text-ink">
          {label}
        </p>
        {value !== null && (
          <button type="button" className="text-xs font-medium text-moss underline-offset-2 hover:underline" onClick={() => onChange(null)}>
            Clear
          </button>
        )}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ''}`}
            onClick={() => onChange(n)}
            className={`press h-10 rounded-xl border text-sm font-semibold ${value === n ? 'border-forest bg-forest text-cream' : 'border-stone bg-cream text-ink hover:border-moss'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-soft">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows = 3, max = 1000 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; max?: number }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        maxLength={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full resize-y rounded-2xl border border-stone bg-cream px-4 py-3 text-[0.95rem] leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-forest focus:outline-none"
      />
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  max = 120,
  hint,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  max?: number
  hint?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        maxLength={max}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block h-12 w-full rounded-2xl border border-stone bg-cream px-4 text-[0.95rem] text-ink placeholder:text-ink-soft/60 focus:border-forest focus:outline-none"
      />
    </div>
  )
}

/** Accessible modal sheet: bottom sheet on phones, centered panel on larger screens. */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const returnTo = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'))
        if (!items.length) return
        const first = items[0]!
        const last = items[items.length - 1]!
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      returnTo?.focus()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-xl animate-rise flex-col overflow-hidden rounded-t-[1.75rem] bg-parchment shadow-soft sm:rounded-[1.75rem]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 pb-2 sm:px-6">
          <h2 id={titleId} className="serif text-2xl leading-tight text-ink">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className="press rounded-full p-2 text-ink-soft hover:bg-stone-soft hover:text-ink" aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-stone bg-parchment px-5 py-3 pb-safe sm:px-6">{footer}</div>}
      </div>
    </div>
  )
}

/** Short lived confirmation message, announced politely. */
export function useToast(): [ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(null), 3200)
    return () => window.clearTimeout(t)
  }, [msg])
  const node = (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8">
      {msg && <p className="animate-rise rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream shadow-soft">{msg}</p>}
    </div>
  )
  return [node, setMsg]
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="serif text-[1.75rem] leading-none text-ink tabular-nums">{value}</p>
      <p className="mt-1.5 text-sm font-medium text-ink">{label}</p>
      {hint && <p className="text-xs leading-snug text-ink-soft">{hint}</p>}
    </div>
  )
}

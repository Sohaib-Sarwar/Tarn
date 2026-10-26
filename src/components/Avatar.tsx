import { User } from 'lucide-react'
import { initials } from '../lib/photo'
import { useStore } from '../store'

/** The person's photo, or their initials, or a quiet placeholder. Never leaves the device. */
export function Avatar({ size = 40, className = '' }: { size?: number; className?: string }) {
  const { data } = useStore()
  const { photo, name } = data.profile
  const style = { width: size, height: size }
  if (photo) return <img src={photo} alt="" style={style} className={`shrink-0 rounded-full object-cover ring-2 ring-cream ${className}`} />
  const text = initials(name)
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full bg-sage-soft font-semibold text-forest ring-2 ring-cream ${className}`} aria-hidden>
      {text ? <span style={{ fontSize: size * 0.38 }}>{text}</span> : <User size={size * 0.5} strokeWidth={1.8} />}
    </span>
  )
}

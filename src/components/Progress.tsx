import { MILESTONES, milestoneImage } from '../lib/badges'
import { BadgeEmblem } from './Art'

/**
 * The stretch track: a soft bar from day 0 to the end of the current stretch (the person's own
 * planning target, or the next milestone when there is no target), with milestone stones along it
 * and the badge that waits at the end. It shows consistency only, never a health claim.
 */
export function StretchTrack({ streak, target, label }: { streak: number; target: number | null; label: string }) {
  const nextMilestone = MILESTONES.find((m) => m.days > streak) ?? MILESTONES[MILESTONES.length - 1]!
  const end = Math.max(1, target ?? nextMilestone.days)
  const p = Math.min(1, streak / end)
  const markers = MILESTONES.filter((m) => m.days > 0 && m.days < end)
  const endBadge = [...MILESTONES].reverse().find((m) => m.days <= end && m.days > 0) ?? nextMilestone
  const left = Math.max(0, end - streak)
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-moss">{label}</p>
          <p className="serif mt-0.5 text-lg leading-tight text-ink">
            {streak >= end ? 'Stretch complete' : `${left} ${left === 1 ? 'day' : 'days'} to go`}
          </p>
        </div>
        <BadgeEmblem glyph={endBadge.glyph} image={milestoneImage(endBadge.id)} earned={streak >= endBadge.days} progress={Math.min(1, streak / endBadge.days)} size={44} />
      </div>
      <div
        className="relative mt-3 h-3 rounded-full bg-sage-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={end}
        aria-valuenow={Math.min(streak, end)}
        aria-label={`${Math.min(streak, end)} of ${end} days`}
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-moss to-forest transition-[width] duration-700" style={{ width: `${p * 100}%` }} />
        {markers.map((m) => (
          <span
            key={m.id}
            title={m.name}
            className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${streak >= m.days ? 'border-cream bg-gold' : 'border-cream bg-stone'}`}
            style={{ left: `${(m.days / end) * 100}%` }}
            aria-hidden
          />
        ))}
        {p > 0 && p < 1 && <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-cream bg-forest shadow-soft" style={{ left: `${p * 100}%` }} aria-hidden />}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-soft tabular-nums" aria-hidden>
        <span>Day 0</span>
        <span>{endBadge.days === end ? endBadge.name : `Day ${end}`}</span>
      </div>
    </div>
  )
}

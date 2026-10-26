import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { milestoneStates } from '../lib/badges'
import { CHECKIN_CHOICES } from '../lib/catalog'
import { addDays, addMonths, daysInMonth, longDate, monthKey, monthLabel, startOfWeek, weekday, weekdayLetter } from '../lib/dates'
import { setbackDays, workedThrough } from '../lib/progress'
import type { DayKey, TarnData } from '../lib/types'

export interface DayMarks {
  checkedIn: boolean
  status: string | null
  urges: number
  urgesWorked: number
  setback: boolean
  milestone: string | null
  inRange: boolean
}

/** What happened on each day. Missing data stays empty: it is never shown as a setback. */
export function useDayMarks(data: TarnData, today: DayKey) {
  return useMemo(() => {
    const setbacks = new Set<DayKey>()
    for (const g of data.goals) for (const d of setbackDays(g, data.events, today)) setbacks.add(d)
    const milestones = new Map<DayKey, string>()
    for (const m of milestoneStates(data, today)) if (m.earnedOn && m.id !== 'first-step') milestones.set(m.earnedOn, m.name)
    const first = data.goals.reduce<DayKey | null>((min, g) => (!min || g.startDate < min ? g.startDate : min), null)
    return (day: DayKey): DayMarks => {
      const c = data.checkins.find((x) => x.date === day)
      const urges = data.urges.filter((u) => u.date === day)
      return {
        checkedIn: !!c && c.status !== 'skip',
        status: c ? CHECKIN_CHOICES.find((x) => x.id === c.status)!.label : null,
        urges: urges.length,
        urgesWorked: urges.filter(workedThrough).length,
        setback: setbacks.has(day),
        milestone: milestones.get(day) ?? null,
        inRange: !!first && day >= first && day <= today,
      }
    }
  }, [data, today])
}

function describe(day: DayKey, m: DayMarks, today: DayKey): string {
  const parts = [day === today ? `Today, ${longDate(day)}` : longDate(day)]
  if (!m.inRange) parts.push('outside your goal dates')
  if (m.setback) parts.push('setback recorded')
  else if (m.checkedIn) parts.push(`checked in: ${m.status}`)
  else if (m.inRange) parts.push('not logged, counted as aligned')
  if (m.urges) parts.push(`${m.urges} ${m.urges === 1 ? 'urge' : 'urges'} logged, ${m.urgesWorked} worked through`)
  if (m.milestone) parts.push(`milestone: ${m.milestone}`)
  return parts.join(', ')
}

/**
 * One day: a green tick for a day checked in as aligned, a soft clay cross for a logged setback,
 * a faint outline for a day that counted without a log, and nothing for days outside the goal.
 * The date sits under the mark so the grid stays readable.
 */
function Cell({ day, m, today, onPick, size = 'md' }: { day: DayKey; m: DayMarks; today: DayKey; onPick?: (d: DayKey) => void; size?: 'sm' | 'md' }) {
  const future = day > today
  const isToday = day === today
  const mark = m.setback ? (
    <span className="grid size-full place-items-center rounded-full bg-clay-soft text-clay">
      <X size={size === 'sm' ? 15 : 16} strokeWidth={2.75} aria-hidden />
    </span>
  ) : m.checkedIn ? (
    <span className="grid size-full place-items-center rounded-full bg-forest text-cream shadow-[0_2px_6px_-2px_rgb(0_0_0/0.3)]">
      <Check size={size === 'sm' ? 15 : 16} strokeWidth={3} aria-hidden />
    </span>
  ) : m.inRange ? (
    <span className="grid size-full place-items-center rounded-full border-2 border-dashed border-sage text-forest/70">
      <Check size={13} strokeWidth={2.5} aria-hidden />
    </span>
  ) : (
    <span className="grid size-full place-items-center rounded-full bg-stone-soft/60" />
  )
  return (
    <button
      type="button"
      disabled={future || !onPick}
      onClick={() => onPick?.(day)}
      aria-label={describe(day, m, today)}
      className={`press group flex w-full flex-col items-center gap-1 rounded-2xl py-1 disabled:cursor-default ${future ? 'opacity-35' : ''}`}
    >
      <span className={`relative block ${size === 'sm' ? 'size-8' : 'size-9'} ${isToday ? 'rounded-full ring-2 ring-gold ring-offset-2 ring-offset-cream' : ''}`}>
        {future ? <span className="grid size-full place-items-center rounded-full border border-stone" /> : mark}
        {(m.urges > 0 || m.milestone) && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 flex gap-0.5">
            {m.milestone && <span className="size-2.5 rounded-full bg-gold ring-2 ring-cream" />}
            {m.urges > 0 && <span className="size-2.5 rounded-full bg-moss ring-2 ring-cream" />}
          </span>
        )}
      </span>
      <span aria-hidden className={`text-[0.7rem] tabular-nums ${isToday ? 'font-bold text-ink' : 'text-ink-soft'}`}>
        {Number(day.slice(8))}
      </span>
    </button>
  )
}

export function WeekStrip({ data, today, onPick }: { data: TarnData; today: DayKey; onPick?: (d: DayKey) => void }) {
  const marks = useDayMarks(data, today)
  const monday = startOfWeek(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="This week">
      {days.map((d) => (
        <li key={d} className="flex flex-col items-center">
          <span className="mb-1 text-[0.7rem] font-semibold text-ink-soft" aria-hidden>
            {weekdayLetter(d)}
          </span>
          <Cell day={d} m={marks(d)} today={today} onPick={onPick} size="sm" />
        </li>
      ))}
    </ol>
  )
}

export function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft" aria-label="Calendar key">
      <li className="flex items-center gap-1.5">
        <span className="grid size-4 place-items-center rounded-full bg-forest text-cream" aria-hidden>
          <Check size={10} strokeWidth={3.5} />
        </span>
        Checked in
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-4 rounded-full border-2 border-dashed border-sage" aria-hidden /> Counted, not logged
      </li>
      <li className="flex items-center gap-1.5">
        <span className="grid size-4 place-items-center rounded-full bg-clay-soft text-clay" aria-hidden>
          <X size={10} strokeWidth={3.5} />
        </span>
        Setback
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-moss" aria-hidden /> Urge logged
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-gold" aria-hidden /> Milestone
      </li>
    </ul>
  )
}

export function MonthCalendar({ data, today, onPick }: { data: TarnData; today: DayKey; onPick: (d: DayKey) => void }) {
  const marks = useDayMarks(data, today)
  const [month, setMonth] = useState(monthKey(today))
  const first = `${month}-01`
  const lead = (weekday(first) + 6) % 7
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
  const earliest = data.goals.reduce((m, g) => (g.startDate < m ? g.startDate : m), today)
  const aligned = days.filter((d) => d <= today && marks(d).inRange && !marks(d).setback).length
  const setbacks = days.filter((d) => marks(d).setback).length
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="serif text-xl text-ink" aria-live="polite">
            {monthLabel(month)}
          </p>
          <p className="text-xs text-ink-soft">
            {aligned} aligned {aligned === 1 ? 'day' : 'days'}
            {setbacks ? `, ${setbacks} ${setbacks === 1 ? 'setback' : 'setbacks'}` : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" disabled={month <= monthKey(earliest)} onClick={() => setMonth((m) => addMonths(m, -1))} className="press grid size-11 place-items-center rounded-full text-forest hover:bg-sage-soft disabled:opacity-30">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button type="button" aria-label="Next month" disabled={month >= monthKey(today)} onClick={() => setMonth((m) => addMonths(m, 1))} className="press grid size-11 place-items-center rounded-full text-forest hover:bg-sage-soft disabled:opacity-30">
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-semibold text-ink-soft" aria-hidden>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <ol className="mt-1 grid grid-cols-7 gap-x-1 gap-y-1" aria-label={monthLabel(month)}>
        {Array.from({ length: lead }, (_, i) => (
          <li key={`pad${i}`} aria-hidden />
        ))}
        {days.map((d) => (
          <li key={d} className="flex justify-center">
            <Cell day={d} m={marks(d)} today={today} onPick={onPick} />
          </li>
        ))}
      </ol>
      <Legend />
    </div>
  )
}

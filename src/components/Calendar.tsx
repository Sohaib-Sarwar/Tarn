import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  if (m.status) parts.push(`check in: ${m.status}`)
  else if (m.inRange) parts.push('no check in')
  if (m.urges) parts.push(`${m.urges} ${m.urges === 1 ? 'urge' : 'urges'} logged, ${m.urgesWorked} worked through`)
  if (m.setback) parts.push('setback recorded')
  if (m.milestone) parts.push(`milestone: ${m.milestone}`)
  return parts.join(', ')
}

function Cell({ day, m, today, onPick, big = false }: { day: DayKey; m: DayMarks; today: DayKey; onPick?: (d: DayKey) => void; big?: boolean }) {
  const future = day > today
  const isToday = day === today
  const base = m.setback
    ? 'bg-stone-soft text-ink border-stone border-dashed'
    : m.checkedIn
      ? 'bg-forest text-cream border-forest'
      : m.inRange
        ? 'bg-sage-soft/70 text-ink border-transparent'
        : 'bg-transparent text-ink-soft/70 border-transparent'
  return (
    <button
      type="button"
      disabled={future || !onPick}
      onClick={() => onPick?.(day)}
      aria-label={describe(day, m, today)}
      className={`press relative grid aspect-square w-full place-items-center rounded-full border text-sm tabular-nums disabled:cursor-default ${base} ${isToday ? 'ring-2 ring-gold ring-offset-2 ring-offset-cream' : ''} ${future ? 'opacity-40' : ''} ${big ? 'max-w-12' : 'max-w-11'}`}
    >
      <span aria-hidden>{Number(day.slice(8))}</span>
      <span aria-hidden className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
        {m.urges > 0 && <span className="size-1.5 rounded-full bg-moss" />}
        {m.milestone && <span className="size-1.5 rounded-full bg-gold" />}
      </span>
    </button>
  )
}

export function WeekStrip({ data, today, onPick }: { data: TarnData; today: DayKey; onPick?: (d: DayKey) => void }) {
  const marks = useDayMarks(data, today)
  const monday = startOfWeek(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  return (
    <div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="This week">
        {days.map((d) => (
          <li key={d} className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-ink-soft" aria-hidden>
              {weekdayLetter(d)}
            </span>
            <Cell day={d} m={marks(d)} today={today} onPick={onPick} />
          </li>
        ))}
      </ol>
      <Legend />
    </div>
  )
}

export function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft" aria-label="Calendar key">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-forest" aria-hidden /> Checked in
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-sage-soft" aria-hidden /> Counted, not logged
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-moss" aria-hidden /> Urge logged
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-gold" aria-hidden /> Milestone
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full border border-dashed border-stone bg-stone-soft" aria-hidden /> Setback
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
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="serif text-xl text-ink" aria-live="polite">
          {monthLabel(month)}
        </p>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" disabled={month <= monthKey(earliest)} onClick={() => setMonth((m) => addMonths(m, -1))} className="press grid size-10 place-items-center rounded-full text-forest hover:bg-sage-soft disabled:opacity-30">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button type="button" aria-label="Next month" disabled={month >= monthKey(today)} onClick={() => setMonth((m) => addMonths(m, 1))} className="press grid size-10 place-items-center rounded-full text-forest hover:bg-sage-soft disabled:opacity-30">
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-ink-soft" aria-hidden>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <ol className="mt-2 grid grid-cols-7 gap-x-1.5 gap-y-2.5" aria-label={monthLabel(month)}>
        {Array.from({ length: lead }, (_, i) => (
          <li key={`pad${i}`} aria-hidden />
        ))}
        {days.map((d) => (
          <li key={d} className="flex justify-center">
            <Cell day={d} m={marks(d)} today={today} onPick={onPick} big />
          </li>
        ))}
      </ol>
      <Legend />
    </div>
  )
}

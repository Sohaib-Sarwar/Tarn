import { addDays } from './dates'
import type { DayKey, JournalEntry, TarnData, Trigger, UrgeTool } from './types'
import { TOOL_LABELS, TRIGGER_LABELS } from './catalog'
import { workedThrough } from './progress'

/**
 * Personal patterns from the user's own entries. Each insight needs a minimum amount of data and
 * states its counts, so nothing is shown that the entries do not support. These are associations
 * in self reported data, never causes or diagnoses.
 */
export interface Insight {
  id: string
  text: string
  /** The numbers behind it, shown under the sentence. */
  basis: string
}

export const MIN_URGES = 5
export const MIN_TOOL_USES = 3
export const MIN_DAYS_PER_GROUP = 4
export const MIN_DIFFERENCE = 0.5

type TimeBand = 'late' | 'morning' | 'afternoon' | 'evening'
const BAND_TEXT: Record<TimeBand, string> = {
  late: 'late at night',
  morning: 'in the morning',
  afternoon: 'in the afternoon',
  evening: 'in the evening',
}

export function timeBand(hour: number): TimeBand {
  if (hour >= 22 || hour < 5) return 'late'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function top<T extends string>(items: T[]): { key: T; count: number } | null {
  const counts = new Map<T, number>()
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1)
  let best: { key: T; count: number } | null = null
  for (const [key, count] of counts) if (!best || count > best.count) best = { key, count }
  // A tie for first place is not a pattern.
  if (best && [...counts.values()].filter((c) => c === best!.count).length > 1) return null
  return best
}

export function urgeTimingInsight(data: TarnData): Insight | null {
  if (data.urges.length < MIN_URGES) return null
  const t = top(data.urges.map((u) => timeBand(u.hour)))
  if (!t || t.count / data.urges.length < 0.4) return null
  return { id: 'timing', text: `You logged most urges ${BAND_TEXT[t.key]}.`, basis: `${t.count} of ${data.urges.length} logged urges.` }
}

export function triggerInsight(data: TarnData): Insight | null {
  const withTriggers = data.urges.filter((u) => u.triggers.some((t) => t !== 'private'))
  if (withTriggers.length < MIN_URGES) return null
  const t = top(withTriggers.flatMap((u) => u.triggers.filter((x): x is Exclude<Trigger, 'private'> => x !== 'private')))
  if (!t || t.count / withTriggers.length < 0.3) return null
  return {
    id: 'trigger',
    text: `${TRIGGER_LABELS[t.key]} was your most common selected trigger.`,
    basis: `Chosen in ${t.count} of ${withTriggers.length} urge logs that named a trigger.`,
  }
}

const TOOL_PHRASE: Record<UrgeTool, string> = {
  breathe: 'a breathing exercise',
  delay: 'the ten minute delay',
  leave: 'changing rooms',
  walk: 'a walk',
  device: 'putting the phone away',
  move: 'a movement break',
  reason: 'reading your reason',
  focus: 'a focus task',
  write: 'writing it down',
  contact: 'reaching out to someone',
}

export function toolInsight(data: TarnData): Insight | null {
  const used = data.urges.filter((u) => u.tool !== null)
  if (used.length < MIN_TOOL_USES) return null
  const t = top(used.map((u) => u.tool!))
  if (!t || t.count < 2) return null
  const worked = used.filter((u) => u.tool === t.key && workedThrough(u)).length
  return {
    id: 'tool',
    text: `You often choose ${TOOL_PHRASE[t.key]} when an urge hits.`,
    basis: `${TOOL_LABELS[t.key]}: ${t.count} of ${used.length} times. It helped (passed, eased, calmer or a little better) ${worked} of those ${t.count} times.`,
  }
}

type Metric = 'sleep' | 'mood' | 'focus' | 'stress'
const METRIC_TEXT: Record<Metric, string> = { sleep: 'sleep', mood: 'mood', focus: 'focus', stress: 'stress' }

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/** Latest rating per day for a metric. */
function dailyRatings(journal: JournalEntry[], metric: Metric): Map<DayKey, number> {
  const out = new Map<DayKey, number>()
  for (const j of [...journal].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const v = j[metric]
    if (typeof v === 'number') out.set(j.date, v)
  }
  return out
}

/** Compares a self rating on days with and without a routine. Association only. */
export function routineAssociations(data: TarnData): Insight[] {
  const out: Insight[] = []
  for (const metric of ['sleep', 'mood', 'focus'] as Metric[]) {
    const ratings = dailyRatings(data.journal, metric)
    if (ratings.size < MIN_DAYS_PER_GROUP * 2) continue
    for (const r of data.profile.routines) {
      const doneDays = new Set(data.routineLogs.filter((l) => l.routineId === r.id).map((l) => l.date))
      const withR: number[] = []
      const without: number[] = []
      for (const [day, v] of ratings) (doneDays.has(day) ? withR : without).push(v)
      if (withR.length < MIN_DAYS_PER_GROUP || without.length < MIN_DAYS_PER_GROUP) continue
      const a = average(withR)
      const b = average(without)
      if (Math.abs(a - b) < MIN_DIFFERENCE) continue
      out.push({
        id: `assoc-${metric}-${r.id}`,
        text: `Your reported ${METRIC_TEXT[metric]} was ${a > b ? 'higher' : 'lower'} on days you did "${r.label}".`,
        basis: `Average ${a.toFixed(1)} on ${withR.length} days with it, ${b.toFixed(1)} on ${without.length} days without. An association in your own entries, not proof of cause.`,
      })
    }
  }
  return out.slice(0, 3)
}

/** Mood this week vs the week before, only when both weeks have at least three ratings. */
export function moodTrend(data: TarnData, today: DayKey): Insight | null {
  const ratings = dailyRatings(data.journal, 'mood')
  const week = (from: DayKey, to: DayKey) => [...ratings].filter(([d]) => d >= from && d <= to).map(([, v]) => v)
  const thisWeek = week(addDays(today, -6), today)
  const lastWeek = week(addDays(today, -13), addDays(today, -7))
  if (thisWeek.length < 3 || lastWeek.length < 3) return null
  const a = average(thisWeek)
  const b = average(lastWeek)
  const same = Math.abs(a - b) < MIN_DIFFERENCE
  return {
    id: 'mood-trend',
    text: same ? 'Your reported mood was about the same as last week.' : `Your reported mood was ${a > b ? 'higher' : 'lower'} this week than last week.`,
    basis: `Average ${a.toFixed(1)} from ${thisWeek.length} ratings this week, ${b.toFixed(1)} from ${lastWeek.length} last week.`,
  }
}

export function personalInsights(data: TarnData, today: DayKey): Insight[] {
  return [urgeTimingInsight(data), triggerInsight(data), toolInsight(data), moodTrend(data, today), ...routineAssociations(data)].filter((x): x is Insight => x !== null)
}

export interface WeekSummary {
  checkins: number
  urgesWorkedThrough: number
  urgesLogged: number
  routinesDone: number
  focusMinutes: number
  mindfulMinutes: number
}

/** Plain counts for the last 7 days, always factual. */
export function weekSummary(data: TarnData, today: DayKey): WeekSummary {
  const from = addDays(today, -6)
  const inWeek = (d: DayKey) => d >= from && d <= today
  const urges = data.urges.filter((u) => inWeek(u.date))
  return {
    checkins: data.checkins.filter((c) => c.status !== 'skip' && inWeek(c.date)).length,
    urgesLogged: urges.length,
    urgesWorkedThrough: urges.filter(workedThrough).length,
    routinesDone: data.routineLogs.filter((l) => inWeek(l.date)).length,
    focusMinutes: data.focus.filter((f) => f.completed && inWeek(f.date)).reduce((a, f) => a + f.minutes, 0),
    mindfulMinutes: Math.round(data.mindful.filter((m) => inWeek(m.date)).reduce((a, m) => a + m.seconds, 0) / 60),
  }
}

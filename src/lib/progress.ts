import { addDays, daysBetween } from './dates'
import type { CheckIn, DayKey, Goal, GoalEvent, RoutineLog, Urge } from './types'

/** An urge counts as worked through when the user said it passed or eased, or felt calmer or a little better. */
export function workedThrough(u: Urge): boolean {
  return u.outcome === 'passed' || u.outcome === 'eased' || u.feeling === 'calmer' || u.feeling === 'better'
}

/**
 * Days that count as setbacks for a goal.
 *
 * Stop goals: any day the behavior happened.
 * Reduce goals: the day the behavior happened more times than the weekly limit allows within the
 * 7 days ending that day (the user's own rule). Times within the limit are not setbacks.
 */
export function setbackDays(goal: Goal, events: GoalEvent[], today: DayKey): Set<DayKey> {
  const own = events
    .filter((e) => e.goalId === goal.id && e.date >= goal.startDate && e.date <= today)
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)))
  const out = new Set<DayKey>()
  if (goal.mode === 'stop' || goal.weeklyLimit <= 0) {
    for (const e of own) out.add(e.date)
    return out
  }
  own.forEach((e, i) => {
    const from = addDays(e.date, -6)
    let count = 0
    for (let j = 0; j <= i; j++) if (own[j]!.date >= from) count++
    if (count > goal.weeklyLimit) out.add(e.date)
  })
  return out
}

/** Times the behavior was logged in the 7 days ending today (reduce goals show this against the limit). */
export function usedThisWeek(goal: Goal, events: GoalEvent[], today: DayKey): number {
  const from = addDays(today, -6)
  return events.filter((e) => e.goalId === goal.id && e.date >= from && e.date <= today).length
}

export interface GoalStats {
  /** Day of the current run, counting today: "Day 7". 0 when today is a setback day. */
  runDay: number
  /**
   * Completed days without a setback since the start or the last setback. A day counts once it is
   * over, or as soon as the user checks in for it. A setback today makes it 0.
   */
  currentStreak: number
  longestStreak: number
  /** Counted days since the start that were not setback days. Unlogged past days count as aligned. */
  alignedDays: number
  setbackCount: number
  lastSetback: DayKey | null
  /** Share of the planning target reached by the current streak, or null without a target. */
  targetProgress: number | null
}

/** Days that count toward streaks: every past day since the start, plus today once checked in. */
function countedDays(goal: Goal, today: DayKey, todayConfirmed: boolean): DayKey[] {
  const last = todayConfirmed ? today : addDays(today, -1)
  return last < goal.startDate ? [] : daysBetween(goal.startDate, last)
}

export function goalStats(goal: Goal, events: GoalEvent[], today: DayKey, todayConfirmed = false): GoalStats {
  if (today < goal.startDate) return { runDay: 0, currentStreak: 0, longestStreak: 0, alignedDays: 0, setbackCount: 0, lastSetback: null, targetProgress: goal.targetDays ? 0 : null }
  const setbacks = setbackDays(goal, events, today)
  let run = 0
  let longest = 0
  let aligned = 0
  let last: DayKey | null = null
  for (const d of countedDays(goal, today, todayConfirmed)) {
    if (setbacks.has(d)) {
      run = 0
      last = d
    } else {
      run++
      aligned++
      longest = Math.max(longest, run)
    }
  }
  const setbackToday = setbacks.has(today)
  if (setbackToday) {
    run = 0
    last = today
  }
  return {
    runDay: setbackToday ? 0 : todayConfirmed ? run : run + 1,
    currentStreak: run,
    longestStreak: longest,
    alignedDays: aligned,
    setbackCount: setbacks.size,
    lastSetback: last,
    targetProgress: goal.targetDays ? Math.min(1, run / goal.targetDays) : null,
  }
}

/** The day each streak length was first reached, for dating milestones. */
export function firstReached(goal: Goal, events: GoalEvent[], today: DayKey, length: number, todayConfirmed = false): DayKey | null {
  if (today < goal.startDate) return null
  if (length <= 0) return goal.startDate
  const setbacks = setbackDays(goal, events, today)
  let run = 0
  for (const d of countedDays(goal, today, todayConfirmed)) {
    run = setbacks.has(d) ? 0 : run + 1
    if (run >= length) return d
  }
  return null
}

export interface Consistency {
  done: number
  days: number
  /** 0 to 100, rounded. */
  pct: number
}

/** Window of up to `n` days ending today, never reaching back before `since`. */
function window(today: DayKey, n: number, since: DayKey): DayKey[] {
  const from = addDays(today, -(n - 1))
  return daysBetween(from > since ? from : since, today)
}

const ratio = (done: number, days: number): Consistency => ({ done, days, pct: days ? Math.round((done / days) * 100) : 0 })

/** Check ins in the window. "Not ready to log" is respected but does not count as a check in. */
export function checkInConsistency(checkins: CheckIn[], today: DayKey, n: number, since: DayKey): Consistency {
  const days = window(today, n, since)
  const set = new Set(checkins.filter((c) => c.status !== 'skip').map((c) => c.date))
  return ratio(days.filter((d) => set.has(d)).length, days.length)
}

/** Days in the window with at least one routine done. */
export function routineConsistency(logs: RoutineLog[], today: DayKey, n: number, since: DayKey): Consistency {
  const days = window(today, n, since)
  const set = new Set(logs.map((l) => l.date))
  return ratio(days.filter((d) => set.has(d)).length, days.length)
}

/** Consecutive days with at least one routine done, ending today, or yesterday if today is still open. */
export function routineStreak(logs: RoutineLog[], today: DayKey): number {
  const set = new Set(logs.map((l) => l.date))
  let d = set.has(today) ? today : addDays(today, -1)
  let n = 0
  while (set.has(d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export function checkInCount(checkins: CheckIn[]): number {
  return checkins.filter((c) => c.status !== 'skip').length
}

export function earliestStart(goals: Goal[], fallback: DayKey): DayKey {
  return goals.reduce((min, g) => (g.startDate < min ? g.startDate : min), fallback)
}

/** A check in today that says the day went to plan lets today count straight away. */
export function confirmsToday(checkins: CheckIn[], today: DayKey): boolean {
  const c = checkins.find((x) => x.date === today)
  return !!c && (c.status === 'aligned' || c.status === 'urge' || c.status === 'hard')
}

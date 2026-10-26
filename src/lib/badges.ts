import { addDays, diffDays } from './dates'
import { confirmsToday, firstReached, goalStats } from './progress'
import type { DayKey, TarnData } from './types'

export type Glyph = 'step' | 'sun' | 'anchor' | 'root' | 'stones' | 'ripple' | 'peak' | 'path' | 'tree' | 'mountain' | 'wave' | 'lantern' | 'leaf' | 'return' | 'breath' | 'flame'

export interface Milestone {
  id: string
  days: number
  name: string
  line: string
  glyph: Glyph
}

/**
 * Streak milestones. They mark consistency only: no length is claimed to produce any health effect.
 * "First Step" is earned by starting a goal.
 */
export const MILESTONES: Milestone[] = [
  { id: 'first-step', days: 0, name: 'First Step', line: 'You chose a goal and began.', glyph: 'step' },
  { id: 'one-day', days: 1, name: 'One Day Present', line: 'One full day lived the way you chose.', glyph: 'sun' },
  { id: 'three-day', days: 3, name: 'Three Day Anchor', line: 'Three days in a row. A pattern is forming.', glyph: 'anchor' },
  { id: 'one-week', days: 7, name: 'One Week Rooted', line: 'A full week of steady choices.', glyph: 'root' },
  { id: 'two-weeks', days: 14, name: 'Two Weeks Steady', line: 'Two weeks. Steady wins.', glyph: 'stones' },
  { id: 'thirty-days', days: 30, name: 'Thirty Day Stillness', line: 'A month of showing up for yourself.', glyph: 'ripple' },
  { id: 'sixty-days', days: 60, name: 'Sixty Day Resolve', line: 'Sixty days of quiet resolve.', glyph: 'peak' },
  { id: 'ninety-days', days: 90, name: 'Ninety Day Journey', line: 'Ninety days on your own path.', glyph: 'path' },
  { id: 'half-year', days: 182, name: 'Half Year Grounded', line: 'Half a year, grounded in your intention.', glyph: 'tree' },
  { id: 'one-year', days: 365, name: 'One Year of Intention', line: 'A year of choosing on purpose.', glyph: 'mountain' },
]

export interface BadgeState {
  id: string
  name: string
  line: string
  glyph: Glyph
  kind: 'milestone' | 'practice'
  earned: boolean
  /** Day it was earned, when known. */
  earnedOn: DayKey | null
  /** 0 to 1 toward earning it. */
  progress: number
  /** Plain words for what is left, e.g. "4 of 7 days". */
  progressLabel: string
  /** Generated badge art for milestones (public/art/badges). */
  image?: string
}

/** The best streak across all goals keeps milestones earned even after a reset. */
export function milestoneStates(data: TarnData, today: DayKey): BadgeState[] {
  const confirmed = confirmsToday(data.checkins, today)
  const goals = data.goals.filter((g) => g.startDate <= today)
  const best = goals.reduce((m, g) => Math.max(m, goalStats(g, data.events, today, confirmed).longestStreak), 0)
  const current = goals.reduce((m, g) => Math.max(m, goalStats(g, data.events, today, confirmed).currentStreak), 0)
  return MILESTONES.map((m) => {
    const earned = goals.length > 0 && best >= m.days
    let earnedOn: DayKey | null = null
    if (earned) {
      for (const g of goals) {
        const d = firstReached(g, data.events, today, m.days, confirmed)
        if (d && (!earnedOn || d < earnedOn)) earnedOn = d
      }
    }
    const progress = earned ? 1 : m.days ? Math.min(1, current / m.days) : 0
    return {
      id: m.id,
      name: m.name,
      line: m.line,
      glyph: m.glyph,
      image: milestoneImage(m.id),
      kind: 'milestone',
      earned,
      earnedOn,
      progress,
      progressLabel: earned ? 'Earned' : `${current} of ${m.days} days`,
    }
  })
}

export const milestoneImage = (id: string) => `/art/badges/${id}.webp`

/** The next streak milestone for one goal's current streak. */
export function nextMilestone(currentStreak: number): Milestone | null {
  return MILESTONES.find((m) => m.days > currentStreak) ?? null
}

const PRACTICE_DAYS = 5

/** Badges for behaviors that help, not for time passing. */
export function practiceStates(data: TarnData): BadgeState[] {
  const surfed = data.urges.filter((u) => u.tool && (u.outcome || u.feeling))
  const surfedOn = surfed.map((u) => u.date).sort()[0] ?? null

  const honest = data.events.filter((e) => e.reflection.trim().length > 0)
  const honestOn = honest.map((e) => e.date).sort()[0] ?? null

  const routineDays = [...new Set(data.routineLogs.map((l) => l.date))].sort()
  const practiceOn = routineDays.length >= PRACTICE_DAYS ? routineDays[PRACTICE_DAYS - 1]! : null

  // Showed Up Again: a check in after a gap of three or more days without one, or after a setback.
  const days = [...new Set(data.checkins.filter((c) => c.status !== 'skip').map((c) => c.date))].sort()
  let returnedOn: DayKey | null = null
  for (let i = 1; i < days.length && !returnedOn; i++) {
    if (diffDays(days[i - 1]!, days[i]!) >= 4) returnedOn = days[i]!
  }
  if (!returnedOn) {
    for (const e of [...data.events].sort((a, b) => a.date.localeCompare(b.date))) {
      const back = days.find((d) => d > e.date && d <= addDays(e.date, 7))
      if (back) {
        returnedOn = back
        break
      }
    }
  }

  const mindful = data.mindful.filter((m) => m.seconds >= 30)
  const mindfulOn = mindful.map((m) => m.date).sort()[0] ?? null

  const focus = data.focus.filter((f) => f.completed)
  const focusOn = focus.map((f) => f.date).sort()[0] ?? null

  const one = (n: number) => (n > 0 ? 1 : 0)
  const list: Omit<BadgeState, 'kind' | 'earned'>[] = [
    { id: 'urge-surfer', name: 'Urge Surfer', line: 'Used a tool when an urge hit and noted how it went.', glyph: 'wave', earnedOn: surfedOn, progress: one(surfed.length), progressLabel: 'Use the urge toolkit once' },
    { id: 'honest-reset', name: 'Honest Reset', line: 'Logged a setback and wrote what you learned.', glyph: 'lantern', earnedOn: honestOn, progress: one(honest.length), progressLabel: 'Add a reflection to a reset' },
    { id: 'daily-practice', name: 'Daily Practice', line: `Did a routine on ${PRACTICE_DAYS} different days.`, glyph: 'leaf', earnedOn: practiceOn, progress: Math.min(1, routineDays.length / PRACTICE_DAYS), progressLabel: `${Math.min(routineDays.length, PRACTICE_DAYS)} of ${PRACTICE_DAYS} days` },
    { id: 'showed-up-again', name: 'Showed Up Again', line: 'Came back and checked in after a break or a reset.', glyph: 'return', earnedOn: returnedOn, progress: returnedOn ? 1 : 0, progressLabel: 'Check in after a pause' },
    { id: 'mindful-moment', name: 'Mindful Moment', line: 'Finished a breathing or reflection exercise.', glyph: 'breath', earnedOn: mindfulOn, progress: one(mindful.length), progressLabel: 'Breathe for 30 seconds' },
    { id: 'lock-in', name: 'Lock In', line: 'Finished a focus session you chose.', glyph: 'flame', earnedOn: focusOn, progress: one(focus.length), progressLabel: 'Finish one focus session' },
  ]
  return list.map((b) => ({ ...b, kind: 'practice' as const, earned: b.earnedOn !== null }))
}

export function allBadges(data: TarnData, today: DayKey): BadgeState[] {
  return [...milestoneStates(data, today), ...practiceStates(data)]
}

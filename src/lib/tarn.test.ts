import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { addDays, dayKey, daysBetween, diffDays, isDayKey, startOfWeek } from './dates'
import { checkInConsistency, confirmsToday, goalStats, routineConsistency, routineStreak, setbackDays, usedThisWeek } from './progress'
import { MILESTONES, milestoneStates, nextMilestone, practiceStates } from './badges'
import { MIN_URGES, personalInsights, routineAssociations, toolInsight, triggerInsight, urgeTimingInsight, weekSummary } from './insights'
import {
  addEvent,
  addFocus,
  addJournal,
  addMindful,
  completeOnboarding,
  deleteGoal,
  draftsFor,
  logUrge,
  removeCheckIn,
  removeEvent,
  setCheckIn,
  setRoutines,
  toggleRoutine,
  updateEvent,
  updateGoal,
} from './actions'
import { exportJson, parseImport } from './backup'
import { sanitizeData } from './validate'
import { DB_NAME, diffCollection, indexedDbStorage, memoryStorage, openDb } from './storage'
import { reminderIcs } from './reminders'
import { emptyData, type Goal, type TarnData } from './types'
import { workedThrough } from './progress'
import { ageToRange, clearHandoff, readHandoff, writeHandoff } from '../handoff'
import { parseRoute, pathFor } from '../router'
import { detectPlatform } from '../install'

const T = '2026-03-10'

function onboard(choice: Parameters<typeof draftsFor>[0], start = '2026-03-01', target: number | null = 30, tweak?: (d: ReturnType<typeof draftsFor>) => void): TarnData {
  const drafts = draftsFor(choice)
  tweak?.(drafts)
  return completeOnboarding(emptyData(new Date('2026-03-01T09:00:00')), { drafts, startDate: start, targetDays: target, wants: ['focus'], reason: 'For me.' }, new Date('2026-03-01T09:00:00'))
}

const goalOf = (d: TarnData, i = 0) => d.goals[i]!

describe('dates', () => {
  it('uses the local calendar day at midnight boundaries', () => {
    expect(dayKey(new Date(2026, 0, 1, 23, 59, 59))).toBe('2026-01-01')
    expect(dayKey(new Date(2026, 0, 2, 0, 0, 0))).toBe('2026-01-02')
  })
  it('does day arithmetic in UTC so daylight saving never shifts a day', () => {
    // US daylight saving starts 2026-03-08 and ends 2026-11-01.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
    expect(diffDays('2026-10-31', '2026-11-02')).toBe(2)
    expect(daysBetween('2026-02-27', '2026-03-02')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'])
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
  it('validates day keys and finds Monday', () => {
    expect(isDayKey('2026-02-29')).toBe(false)
    expect(isDayKey('2028-02-29')).toBe(true)
    expect(isDayKey('2026-3-1')).toBe(false)
    expect(startOfWeek('2026-03-12')).toBe('2026-03-09')
  })
})

describe('onboarding goals', () => {
  it('creates one goal per single choice with the right kind and mode', () => {
    for (const [choice, kind, mode] of [
      ['reduce-porn', 'porn', 'reduce'],
      ['stop-porn', 'porn', 'stop'],
      ['reduce-m', 'masturbation', 'reduce'],
      ['stop-m', 'masturbation', 'stop'],
    ] as const) {
      const d = onboard(choice)
      expect(d.goals).toHaveLength(1)
      expect(goalOf(d)).toMatchObject({ kind, mode, startDate: '2026-03-01', targetDays: 30 })
      expect(d.profile.onboarded).toBe(true)
      expect(d.profile.primaryGoalId).toBe(goalOf(d).id)
    }
  })
  it('never combines porn and masturbation: "both" makes two independent goals', () => {
    const d = onboard('both')
    expect(d.goals.map((g) => g.kind)).toEqual(['porn', 'masturbation'])
    expect(d.goals[0]!.id).not.toBe(d.goals[1]!.id)
  })
  it('custom goals keep the user label and meaning', () => {
    const d = onboard('custom', '2026-03-01', null, (dr) => {
      dr[0]!.label = 'No doomscrolling after 11'
      dr[0]!.meaning = 'Phone stays out of the bedroom'
    })
    expect(goalOf(d)).toMatchObject({ kind: 'custom', label: 'No doomscrolling after 11', meaning: 'Phone stays out of the bedroom', targetDays: null })
  })
})

describe('streaks', () => {
  it('counts past days automatically and today once checked in', () => {
    const d = onboard('stop-porn')
    const s = goalStats(goalOf(d), d.events, T)
    expect(s).toMatchObject({ currentStreak: 9, runDay: 10, longestStreak: 9, alignedDays: 9, setbackCount: 0 })
    const withCheckIn = setCheckIn(d, T, { status: 'aligned', mood: null, note: '' })
    expect(confirmsToday(withCheckIn.checkins, T)).toBe(true)
    expect(goalStats(goalOf(d), d.events, T, true)).toMatchObject({ currentStreak: 10, runDay: 10, alignedDays: 10 })
  })
  it('starts at day 1 on the start date and is empty before it', () => {
    const d = onboard('stop-porn', T)
    expect(goalStats(goalOf(d), [], T)).toMatchObject({ currentStreak: 0, runDay: 1 })
    expect(goalStats(goalOf(d), [], '2026-03-09')).toMatchObject({ currentStreak: 0, runDay: 0, alignedDays: 0 })
  })
  it('a setback restarts the current streak but keeps longest streak and history', () => {
    let d = onboard('stop-porn')
    d = addEvent(d, goalOf(d).id, '2026-03-06', '', 'Phone in bed again')
    const s = goalStats(goalOf(d), d.events, T)
    expect(s.currentStreak).toBe(3) // Mar 7, 8, 9
    expect(s.longestStreak).toBe(5) // Mar 1 to 5
    expect(s.alignedDays).toBe(8)
    expect(s.lastSetback).toBe('2026-03-06')
    expect(d.events).toHaveLength(1)
  })
  it('a setback today makes today day 0 and checking in does not override it', () => {
    let d = onboard('stop-porn')
    d = addEvent(d, goalOf(d).id, T)
    expect(goalStats(goalOf(d), d.events, T, true)).toMatchObject({ currentStreak: 0, runDay: 0, longestStreak: 9 })
  })
  it('editing or removing a mistaken setback restores the streak', () => {
    let d = onboard('stop-porn')
    d = addEvent(d, goalOf(d).id, '2026-03-06')
    const id = d.events[0]!.id
    expect(goalStats(goalOf(d), updateEvent(d, id, { date: '2026-03-02' }).events, T).currentStreak).toBe(7)
    expect(goalStats(goalOf(d), removeEvent(d, id).events, T).currentStreak).toBe(9)
  })
  it('separate goals keep separate counters', () => {
    let d = onboard('both')
    const [porn, m] = d.goals as [Goal, Goal]
    d = addEvent(d, m.id, '2026-03-08')
    expect(goalStats(porn, d.events, T).currentStreak).toBe(9)
    expect(goalStats(m, d.events, T).currentStreak).toBe(1)
  })
  it('reduce goals only count a setback when the weekly limit is exceeded', () => {
    let d = onboard('reduce-m', '2026-03-01', 30, (dr) => (dr[0]!.weeklyLimit = 2))
    const g = goalOf(d)
    d = addEvent(d, g.id, '2026-03-03')
    d = addEvent(d, g.id, '2026-03-05')
    expect(setbackDays(g, d.events, T).size).toBe(0)
    expect(goalStats(g, d.events, T).currentStreak).toBe(9)
    d = addEvent(d, g.id, '2026-03-07')
    expect([...setbackDays(g, d.events, T)]).toEqual(['2026-03-07'])
    expect(goalStats(g, d.events, T).currentStreak).toBe(2)
    expect(usedThisWeek(g, d.events, T)).toBe(2) // Mar 4 to 10 window holds Mar 5 and 7
  })
  it('custom rules: a custom reduce goal with a limit of 1', () => {
    let d = onboard('custom', '2026-03-01', null, (dr) => {
      dr[0]!.label = 'Late night gaming'
      dr[0]!.mode = 'reduce'
      dr[0]!.weeklyLimit = 1
    })
    const g = goalOf(d)
    expect(g.weeklyLimit).toBe(1)
    d = addEvent(d, g.id, '2026-03-02')
    d = addEvent(d, g.id, '2026-03-09')
    expect(setbackDays(g, d.events, T).size).toBe(0)
    d = addEvent(d, g.id, '2026-03-04')
    expect([...setbackDays(g, d.events, T)]).toEqual(['2026-03-04', '2026-03-09'])
  })
  it('switching a goal to stop clears its limit', () => {
    const d = onboard('reduce-porn')
    const next = updateGoal(d, goalOf(d).id, { mode: 'stop' })
    expect(goalOf(next).weeklyLimit).toBe(0)
  })
  it('ignores events from other goals, before the start, and in the future', () => {
    let d = onboard('stop-porn', '2026-03-05')
    d = addEvent(d, goalOf(d).id, '2026-03-02')
    d = addEvent(d, goalOf(d).id, '2026-03-12')
    d = addEvent(d, 'missing', '2026-03-06')
    expect(d.events).toHaveLength(2)
    expect(goalStats(goalOf(d), d.events, T).currentStreak).toBe(5)
  })
  it('reports target progress and the next milestone', () => {
    const d = onboard('stop-porn', '2026-03-01', 14)
    const s = goalStats(goalOf(d), [], T)
    expect(s.targetProgress).toBeCloseTo(9 / 14)
    expect(nextMilestone(9)!.name).toBe('Two Weeks Steady')
    expect(nextMilestone(365)).toBeNull()
  })
  it('deleting a goal removes only its events', () => {
    let d = onboard('both')
    d = addEvent(d, d.goals[0]!.id, '2026-03-02')
    d = addEvent(d, d.goals[1]!.id, '2026-03-03')
    const after = deleteGoal(d, d.goals[0]!.id)
    expect(after.goals).toHaveLength(1)
    expect(after.events.map((e) => e.goalId)).toEqual([d.goals[1]!.id])
    expect(after.profile.primaryGoalId).toBe(d.goals[1]!.id)
  })
})

describe('check ins and consistency', () => {
  it('one check in per day, editable and removable', () => {
    let d = onboard('stop-porn')
    d = setCheckIn(d, T, { status: 'hard', mood: 2, note: ' rough ' })
    d = setCheckIn(d, T, { status: 'aligned', mood: 4, note: '' })
    expect(d.checkins).toHaveLength(1)
    expect(d.checkins[0]).toMatchObject({ status: 'aligned', mood: 4 })
    expect(removeCheckIn(d, T).checkins).toHaveLength(0)
  })
  it('"not ready to log" never counts as a check in or a failure', () => {
    let d = onboard('stop-porn')
    d = setCheckIn(d, T, { status: 'skip', mood: null, note: '' })
    expect(confirmsToday(d.checkins, T)).toBe(false)
    expect(checkInConsistency(d.checkins, T, 7, '2026-03-01')).toEqual({ done: 0, days: 7, pct: 0 })
    expect(goalStats(goalOf(d), d.events, T).currentStreak).toBe(9)
  })
  it('consistency uses the last N days but not before the start', () => {
    let d = onboard('stop-porn', '2026-03-08')
    for (const day of ['2026-03-08', '2026-03-10']) d = setCheckIn(d, day, { status: 'aligned', mood: null, note: '' })
    expect(checkInConsistency(d.checkins, T, 7, '2026-03-08')).toEqual({ done: 2, days: 3, pct: 67 })
    expect(checkInConsistency(d.checkins, T, 30, '2026-03-08').days).toBe(3)
  })
  it('routine consistency and routine streak', () => {
    let d = setRoutines(onboard('stop-porn'), [{ id: 'r1', category: 'reading', label: 'Read 10 pages' }])
    for (const day of ['2026-03-07', '2026-03-08', '2026-03-09']) d = toggleRoutine(d, day, 'r1')
    expect(routineStreak(d.routineLogs, T)).toBe(3)
    d = toggleRoutine(d, T, 'r1')
    expect(routineStreak(d.routineLogs, T)).toBe(4)
    d = toggleRoutine(d, T, 'r1')
    expect(d.routineLogs).toHaveLength(3)
    expect(routineConsistency(d.routineLogs, T, 7, '2026-03-01')).toEqual({ done: 3, days: 7, pct: 43 })
  })
})

describe('badges', () => {
  it('milestones are earned from the best streak and survive a reset', () => {
    let d = onboard('stop-porn')
    const before = milestoneStates(d, T)
    expect(before.filter((b) => b.earned).map((b) => b.name)).toEqual(['First Step', 'One Day Present', 'Three Day Anchor', 'One Week Rooted'])
    expect(before.find((b) => b.id === 'one-week')!.earnedOn).toBe('2026-03-07')
    d = addEvent(d, goalOf(d).id, T)
    const after = milestoneStates(d, T)
    expect(after.filter((b) => b.earned).map((b) => b.id)).toEqual(['first-step', 'one-day', 'three-day', 'one-week'])
    expect(after.find((b) => b.id === 'two-weeks')!.progressLabel).toBe('0 of 14 days')
  })
  it('no goal means no milestone, and milestones never claim health effects', () => {
    expect(milestoneStates(emptyData(), T).some((b) => b.earned)).toBe(false)
    expect(MILESTONES.map((m) => m.line).join(' ')).not.toMatch(/testosterone|dopamine|brain|rewir|energy|fertil/i)
  })
  it('practice badges follow behavior', () => {
    let d = onboard('stop-porn')
    expect(practiceStates(d).filter((b) => b.earned)).toHaveLength(0)
    d = logUrge(d, { tool: 'breathe', triggers: ['stress'], intensity: 3, outcome: 'passed' }, new Date('2026-03-09T23:10:00')).data
    d = addEvent(d, goalOf(d).id, '2026-03-09', '', 'Next time phone stays outside')
    d = addMindful(d, { date: '2026-03-09', kind: 'breath', seconds: 60 })
    d = addFocus(d, { date: '2026-03-09', minutes: 25, task: 'Essay', completed: true })
    d = setRoutines(d, [{ id: 'r1', category: 'reading', label: 'Read' }])
    for (const day of daysBetween('2026-03-02', '2026-03-06')) d = toggleRoutine(d, day, 'r1')
    d = setCheckIn(d, '2026-03-01', { status: 'aligned', mood: null, note: '' })
    d = setCheckIn(d, '2026-03-10', { status: 'aligned', mood: null, note: '' })
    const earned = practiceStates(d).filter((b) => b.earned).map((b) => b.id)
    expect(earned).toEqual(['urge-surfer', 'honest-reset', 'daily-practice', 'showed-up-again', 'mindful-moment', 'lock-in'])
  })
  it('a setback without reflection does not earn Honest Reset; short breathing does not earn Mindful Moment', () => {
    let d = onboard('stop-porn')
    d = addEvent(d, goalOf(d).id, '2026-03-09')
    d = addMindful(d, { date: '2026-03-09', kind: 'breath', seconds: 10 })
    const b = practiceStates(d)
    expect(b.find((x) => x.id === 'honest-reset')!.earned).toBe(false)
    expect(b.find((x) => x.id === 'mindful-moment')!.earned).toBe(false)
  })
})

describe('urges and insights', () => {
  const at = (h: number, day = 9) => new Date(2026, 2, day, h, 15)
  it('logs urges with local date and hour', () => {
    const r = logUrge(emptyData(), { tool: 'walk', triggers: ['boredom', 'boredom' as never], intensity: null, outcome: null }, at(23))
    expect(r.data.urges[0]).toMatchObject({ date: '2026-03-09', hour: 23, tool: 'walk' })
  })
  it('shows no insights without enough data', () => {
    let d = onboard('stop-porn')
    for (let i = 0; i < MIN_URGES - 1; i++) d = logUrge(d, { tool: 'walk', triggers: ['late'], intensity: 3, outcome: 'passed' }, at(23, 2 + i)).data
    expect(urgeTimingInsight(d)).toBeNull()
    expect(triggerInsight(d)).toBeNull()
    expect(personalInsights(d, T).map((i) => i.id)).toEqual(['tool'])
  })
  it('finds timing, trigger and tool patterns with their counts', () => {
    let d = onboard('stop-porn')
    const hours = [23, 0, 1, 23, 14]
    hours.forEach((h, i) => {
      d = logUrge(d, { tool: i < 3 ? 'walk' : 'breathe', triggers: i < 3 ? ['late'] : ['stress'], intensity: 3, outcome: i === 0 ? 'acted' : 'passed' }, at(h, 2 + i)).data
    })
    expect(urgeTimingInsight(d)).toMatchObject({ text: 'You logged most urges late at night.', basis: '4 of 5 logged urges.' })
    expect(triggerInsight(d)!.text).toBe('Late night scrolling was your most common selected trigger.')
    expect(toolInsight(d)!.basis).toContain('2 of those 3 times')
  })
  it('a tie is not a pattern', () => {
    let d = onboard('stop-porn')
    ;[23, 23, 9, 9, 15, 15].forEach((h, i) => (d = logUrge(d, { tool: null, triggers: [], intensity: null, outcome: null }, at(h, 1 + i)).data))
    expect(urgeTimingInsight(d)).toBeNull()
  })
  it('routine associations need enough days on both sides and say they are not causes', () => {
    let d = setRoutines(onboard('stop-porn'), [{ id: 'wind', category: 'sleep', label: 'Wind down by 11' }])
    const days = daysBetween('2026-03-01', '2026-03-08')
    days.forEach((day, i) => {
      if (i < 4) d = toggleRoutine(d, day, 'wind')
      d = addJournal(d, { date: day, kind: 'entry', mood: null, stress: null, sleep: i < 4 ? 4 : 2, focus: null, urge: null, text: '', helped: '' }, new Date(`${day}T21:00:00`))
    })
    const found = routineAssociations(d)
    expect(found).toHaveLength(1)
    expect(found[0]!.text).toBe('Your reported sleep was higher on days you did "Wind down by 11".')
    expect(found[0]!.basis).toContain('not proof of cause')
    const fewer = { ...d, journal: d.journal.slice(0, 7) }
    expect(routineAssociations(fewer)).toHaveLength(0)
  })
  it('week summary counts only the last 7 days', () => {
    let d = onboard('stop-porn')
    d = logUrge(d, { tool: 'walk', triggers: [], intensity: null, outcome: 'eased' }, at(10, 2)).data
    d = logUrge(d, { tool: 'walk', triggers: [], intensity: null, outcome: 'eased' }, at(10, 9)).data
    d = addFocus(d, { date: '2026-03-09', minutes: 25, task: '', completed: true })
    expect(weekSummary(d, T)).toMatchObject({ urgesLogged: 1, urgesWorkedThrough: 1, focusMinutes: 25 })
  })
})

describe('export, import and corrupt data', () => {
  it('round trips everything through the export format', () => {
    let d = onboard('both')
    d = addEvent(d, d.goals[1]!.id, '2026-03-04', 'note', 'lesson')
    d = setCheckIn(d, T, { status: 'urge', mood: 3, note: 'ok' })
    d = logUrge(d, { tool: 'breathe', triggers: ['stress'], intensity: 4, outcome: 'passed' }, new Date(2026, 2, 9, 22)).data
    const back = parseImport(exportJson(d))
    expect(back.ok).toBe(true)
    if (back.ok) {
      expect(back.skipped).toBe(0)
      expect(back.data).toEqual(d)
    }
  })
  it('rejects files that are not Tarn exports', () => {
    expect(parseImport('not json')).toMatchObject({ ok: false })
    expect(parseImport('{"hello":1}')).toMatchObject({ ok: false, error: 'This file was not exported from Tarn.' })
    expect(parseImport('{"format":"stillpoint-export","version":99,"data":{}}')).toMatchObject({ ok: false })
  })
  it('skips corrupt records instead of failing', () => {
    const d = onboard('stop-porn')
    const raw = JSON.parse(exportJson(d)).data
    raw.goals.push({ id: 'bad', kind: 'porn', mode: 'stop', startDate: '2026-02-30' })
    raw.events = [{ id: 'e1', goalId: 'ghost', date: '2026-03-02' }, { id: 'e2', goalId: d.goals[0]!.id, date: '2026-03-02', note: 5 }, 'junk']
    raw.checkins = [{ date: '2026-03-02', status: 'aligned', mood: 9 }, { date: 'nope', status: 'aligned' }]
    raw.urges = { not: 'an array' }
    const { data, skipped } = sanitizeData(raw)
    expect(data.goals).toHaveLength(1)
    expect(data.events.map((e) => e.id)).toEqual(['e2'])
    expect(data.events[0]!.note).toBe('')
    expect(data.checkins[0]!.mood).toBeNull()
    expect(data.urges).toEqual([])
    expect(skipped).toBe(5)
  })
  it('a missing or garbage profile falls back to a fresh one', () => {
    expect(sanitizeData(null).data.profile.onboarded).toBe(false)
    expect(sanitizeData({ profile: { appTitle: '   ', contact: { address: 3 } } }).data.profile).toMatchObject({ appTitle: 'Tarn', contact: null, name: '', ageRange: null, goiNote: null })
  })
})

describe('storage', () => {
  it('diffs collections by identity', () => {
    const a = { id: 'a' }
    const b = { id: 'b' }
    const b2 = { id: 'b' }
    expect(diffCollection([a, b], [a, b2, { id: 'c' }])).toEqual({ put: [b2, { id: 'c' }], remove: [] })
    expect(diffCollection([a, b], [b])).toEqual({ put: [], remove: ['a'] })
  })
  it('saves, reloads and clears records in IndexedDB', async () => {
    const db = await openDb()
    const store = indexedDbStorage(db)
    const empty = (await store.load()).data
    expect(empty.profile.onboarded).toBe(false)
    let d = onboard('both')
    await store.save(empty, d)
    const prev = d
    d = addEvent(d, d.goals[0]!.id, '2026-03-03')
    d = deleteGoal(d, d.goals[1]!.id)
    await store.save(prev, d)
    const loaded = await store.load()
    expect(loaded.skipped).toBe(0)
    expect(loaded.data.goals).toEqual(d.goals)
    expect(loaded.data.events).toEqual(d.events)
    expect(loaded.data.profile).toEqual(d.profile)
    await store.clear()
    expect((await store.load()).data.goals).toEqual([])
    db.close()
    await new Promise<void>((r) => {
      const del = indexedDB.deleteDatabase(DB_NAME)
      del.onsuccess = () => r()
    })
  })
  it('memory storage works when IndexedDB is unavailable', async () => {
    const s = memoryStorage()
    const d = onboard('stop-porn')
    await s.save(emptyData(), d)
    expect((await s.load()).data.goals).toHaveLength(1)
    await s.clear()
    expect((await s.load()).data.goals).toHaveLength(0)
  })
})

describe('reminders', () => {
  it('builds a discreet daily calendar event', () => {
    const ics = reminderIcs('21:30', 'https://example.test/today', new Date(2026, 2, 10, 12))
    expect(ics).toContain('DTSTART:20260310T213000')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('SUMMARY:Check in')
    expect(ics).not.toMatch(/porn|mastur|urge|relapse|setback/i)
  })
})

describe('V1.1: calm feelings, profile, handoff, routes, install', () => {
  it('a calm session counts as worked through when the person felt calmer or a little better', () => {
    const base = logUrge(emptyData(), { tool: 'breathe' }).data.urges[0]!
    expect(base).toMatchObject({ feeling: null, spots: [], outcome: null })
    expect(workedThrough({ ...base, feeling: 'calmer' })).toBe(true)
    expect(workedThrough({ ...base, feeling: 'better' })).toBe(true)
    expect(workedThrough({ ...base, feeling: 'difficult' })).toBe(false)
    expect(workedThrough({ ...base, feeling: 'private' })).toBe(false)
    expect(practiceStates({ ...emptyData(), urges: [{ ...base, feeling: 'difficult' }] }).find((b) => b.id === 'urge-surfer')!.earned).toBe(true)
  })
  it('validates the new profile and urge fields', () => {
    const { data } = sanitizeData({
      profile: { name: '  Alex  ', ageRange: '25-34', goiNote: 640 },
      urges: [{ id: 'u', at: '2026-03-01T22:00:00.000Z', date: '2026-03-01', hour: 22, feeling: 'calmer', spots: ['chest', 'nope', 'chest'] }],
    })
    expect(data.profile).toMatchObject({ name: 'Alex', ageRange: '25-34', goiNote: 640 })
    expect(data.urges[0]).toMatchObject({ feeling: 'calmer', spots: ['chest'] })
    const bad = sanitizeData({ profile: { ageRange: '17', goiNote: 9999 }, urges: [{ id: 'u', at: '2026-03-01T22:00:00.000Z', date: '2026-03-01', feeling: 'ecstatic' }] })
    expect(bad.data.profile).toMatchObject({ ageRange: null, goiNote: null })
    expect(bad.data.urges[0]!.feeling).toBeNull()
  })
  it('a V1.0 profile with the old default title moves to the new brand, custom titles stay', () => {
    expect(sanitizeData({ profile: { appTitle: 'Stillpoint' } }).data.profile.appTitle).toBe('Tarn')
    expect(sanitizeData({ profile: { appTitle: 'Notes' } }).data.profile.appTitle).toBe('Notes')
  })
  it('V1.0 records without the new fields still load', () => {
    const old = { id: 'u', at: '2026-03-01T22:00:00.000Z', date: '2026-03-01', hour: 22, tool: 'walk', triggers: ['late'], intensity: 3, outcome: 'passed' }
    expect(sanitizeData({ urges: [old] }).data.urges[0]).toMatchObject({ tool: 'walk', outcome: 'passed', feeling: null, spots: [] })
  })
  it('onboarding stores the optional name, age range, GOI note and first intention', () => {
    const d = completeOnboarding(emptyData(), {
      name: ' Sam ',
      ageRange: '35-44',
      goiNote: 512,
      routines: [{ id: 'r', category: 'custom', label: 'Plan tomorrow' }],
      drafts: draftsFor('stop-porn'),
      startDate: T,
      targetDays: null,
      wants: [],
      reason: '',
    })
    expect(d.profile).toMatchObject({ name: 'Sam', ageRange: '35-44', goiNote: 512, routines: [{ label: 'Plan tomorrow' }] })
  })
  it('the GOONOMICS handoff carries only an age range and the GOI, and only when written', () => {
    expect(ageToRange(17)).toBeNull()
    expect(ageToRange(18)).toBe('18-24')
    expect(ageToRange(34)).toBe('25-34')
    expect(ageToRange(70)).toBe('55+')
    clearHandoff()
    expect(readHandoff()).toBeNull()
    writeHandoff({ ageRange: '25-34', goi: 700 })
    expect(readHandoff()).toEqual({ ageRange: '25-34', goi: 700 })
    sessionStorage.setItem('tarn-handoff', JSON.stringify({ ageRange: 'x', goi: 5, extra: 'secret' }))
    expect(readHandoff()).toEqual({ ageRange: null, goi: null })
    clearHandoff()
  })
  it('old V1.0 paths open the screen that now holds the feature', () => {
    expect(parseRoute('/urge')).toBe('calm')
    expect(parseRoute('/settings')).toBe('profile')
    expect(parseRoute('/routines')).toBe('profile')
    expect(parseRoute('/insights')).toBe('journey')
    expect(parseRoute('/')).toBe('welcome')
    expect(parseRoute('/nope')).toBe('welcome')
    expect(pathFor('calm')).toBe('/calm')
  })
  it('detects the install path per platform', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    const iphoneChrome = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'
    const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
    const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
    const firefox = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0'
    expect(detectPlatform(iphone, 5)).toBe('ios-safari')
    expect(detectPlatform(iphoneChrome, 5)).toBe('ios-other')
    expect(detectPlatform(ipad, 5)).toBe('ios-safari')
    expect(detectPlatform(ipad, 0)).toBe('mac-safari')
    expect(detectPlatform(android, 5)).toBe('chromium')
    expect(detectPlatform(firefox, 0)).toBe('firefox')
  })
})

describe('V1.2: photo, theme and terms in the profile', () => {
  it('keeps a small image data URL and rejects anything else', () => {
    const ok = 'data:image/jpeg;base64,' + 'A'.repeat(200)
    expect(sanitizeData({ profile: { photo: ok } }).data.profile.photo).toBe(ok)
    expect(sanitizeData({ profile: { photo: 'https://example.com/me.jpg' } }).data.profile.photo).toBeNull()
    expect(sanitizeData({ profile: { photo: 'data:text/html;base64,PHNjcmlwdD4=' } }).data.profile.photo).toBeNull()
    expect(sanitizeData({ profile: { photo: 'data:image/png;base64,' + 'A'.repeat(500_000) } }).data.profile.photo).toBeNull()
  })
  it('defaults the theme to light and keeps valid choices', () => {
    expect(sanitizeData({ profile: {} }).data.profile.theme).toBe('light')
    expect(sanitizeData({ profile: { theme: 'dark' } }).data.profile.theme).toBe('dark')
    expect(sanitizeData({ profile: { theme: 'neon' } }).data.profile.theme).toBe('light')
  })
  it('records when the terms were accepted at onboarding', () => {
    const d = completeOnboarding(emptyData(), { drafts: draftsFor('stop-porn'), startDate: T, targetDays: null, wants: [], reason: '', termsAcceptedAt: '2026-03-10T09:00:00.000Z' })
    expect(d.profile.termsAcceptedAt).toBe('2026-03-10T09:00:00.000Z')
  })
})

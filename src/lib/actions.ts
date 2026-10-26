import { dayKey } from './dates'
import { KIND_DEFAULT_LABEL, type GoalChoice } from './catalog'
import type { CheckIn, CheckInStatus, FocusSession, Goal, GoalEvent, GoalKind, GoalMode, JournalEntry, MindfulSession, TarnData, Profile, Routine, Urge } from './types'

/**
 * Pure state transitions. Each returns a new TarnData and never mutates the old one, so storage can
 * diff by identity and tests can check results directly.
 */
export function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  }
}

export interface GoalDraft {
  kind: GoalKind
  mode: GoalMode
  label: string
  meaning: string
  weeklyLimit: number
}

/** Turns the onboarding choice into one or two separate goal drafts. */
export function draftsFor(choice: GoalChoice['id']): GoalDraft[] {
  const make = (kind: 'porn' | 'masturbation', mode: GoalMode): GoalDraft => ({ kind, mode, label: KIND_DEFAULT_LABEL[kind][mode], meaning: '', weeklyLimit: mode === 'reduce' ? 2 : 0 })
  switch (choice) {
    case 'reduce-porn':
      return [make('porn', 'reduce')]
    case 'stop-porn':
      return [make('porn', 'stop')]
    case 'reduce-m':
      return [make('masturbation', 'reduce')]
    case 'stop-m':
      return [make('masturbation', 'stop')]
    case 'both':
      return [make('porn', 'stop'), make('masturbation', 'stop')]
    case 'custom':
      return [{ kind: 'custom', mode: 'stop', label: '', meaning: '', weeklyLimit: 0 }]
  }
}

export function makeGoal(d: GoalDraft, startDate: string, targetDays: number | null, now = new Date()): Goal {
  return {
    id: newId(),
    kind: d.kind,
    mode: d.mode,
    label: d.label.trim().slice(0, 60) || 'My goal',
    meaning: d.meaning.trim().slice(0, 280),
    weeklyLimit: d.mode === 'reduce' ? Math.max(1, Math.min(21, Math.round(d.weeklyLimit))) : 0,
    startDate,
    targetDays,
    createdAt: now.toISOString(),
    archived: false,
  }
}

export interface OnboardingResult {
  name?: string
  ageRange?: Profile['ageRange']
  goiNote?: number | null
  routines?: Profile['routines']
  termsAcceptedAt?: string | null
  drafts: GoalDraft[]
  startDate: string
  targetDays: number | null
  wants: Profile['wants']
  reason: string
}

export function completeOnboarding(data: TarnData, r: OnboardingResult, now = new Date()): TarnData {
  const goals = r.drafts.map((d) => makeGoal(d, r.startDate, r.targetDays, now))
  return {
    ...data,
    goals: [...data.goals, ...goals],
    profile: {
      ...data.profile,
      onboarded: true,
      name: (r.name ?? data.profile.name).trim().slice(0, 40),
      ageRange: r.ageRange ?? data.profile.ageRange,
      goiNote: r.goiNote ?? data.profile.goiNote,
      routines: r.routines ?? data.profile.routines,
      termsAcceptedAt: r.termsAcceptedAt ?? data.profile.termsAcceptedAt ?? now.toISOString(),
      wants: r.wants,
      reason: r.reason.trim().slice(0, 500),
      primaryGoalId: data.profile.primaryGoalId ?? goals[0]?.id ?? null,
    },
  }
}

export function addGoal(data: TarnData, d: GoalDraft, startDate: string, targetDays: number | null, now = new Date()): TarnData {
  const g = makeGoal(d, startDate, targetDays, now)
  return { ...data, goals: [...data.goals, g], profile: data.profile.primaryGoalId ? data.profile : { ...data.profile, primaryGoalId: g.id } }
}

export function updateGoal(data: TarnData, id: string, patch: Partial<Pick<Goal, 'label' | 'meaning' | 'weeklyLimit' | 'targetDays' | 'startDate' | 'mode' | 'archived'>>): TarnData {
  return {
    ...data,
    goals: data.goals.map((g) => {
      if (g.id !== id) return g
      const next = { ...g, ...patch }
      next.weeklyLimit = next.mode === 'reduce' ? Math.max(1, Math.min(21, Math.round(next.weeklyLimit || 1))) : 0
      next.label = next.label.trim().slice(0, 60) || g.label
      return next
    }),
  }
}

/** Deletes a goal and its logged events. Check ins and other records are not tied to a goal and stay. */
export function deleteGoal(data: TarnData, id: string): TarnData {
  const goals = data.goals.filter((g) => g.id !== id)
  return {
    ...data,
    goals,
    events: data.events.filter((e) => e.goalId !== id),
    profile: data.profile.primaryGoalId === id ? { ...data.profile, primaryGoalId: goals[0]?.id ?? null } : data.profile,
  }
}

export function setCheckIn(data: TarnData, date: string, entry: { status: CheckInStatus; mood: number | null; note: string }, now = new Date()): TarnData {
  const c: CheckIn = { id: date, date, status: entry.status, mood: entry.mood, note: entry.note.trim().slice(0, 1000), updatedAt: now.toISOString() }
  return { ...data, checkins: [...data.checkins.filter((x) => x.date !== date), c] }
}

export function removeCheckIn(data: TarnData, date: string): TarnData {
  return { ...data, checkins: data.checkins.filter((c) => c.date !== date) }
}

/** Logs one time the behavior happened for a single goal. Never applied to other goals. */
export function addEvent(data: TarnData, goalId: string, date: string, note = '', reflection = '', now = new Date()): TarnData {
  if (!data.goals.some((g) => g.id === goalId)) return data
  const e: GoalEvent = { id: newId(), goalId, date, note: note.trim().slice(0, 1000), reflection: reflection.trim().slice(0, 1000), createdAt: now.toISOString() }
  return { ...data, events: [...data.events, e] }
}

export function updateEvent(data: TarnData, id: string, patch: Partial<Pick<GoalEvent, 'date' | 'note' | 'reflection'>>): TarnData {
  return { ...data, events: data.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }
}

export function removeEvent(data: TarnData, id: string): TarnData {
  return { ...data, events: data.events.filter((e) => e.id !== id) }
}

export function logUrge(data: TarnData, input: Partial<Omit<Urge, 'id' | 'at' | 'date' | 'hour'>>, now = new Date()): { data: TarnData; id: string } {
  const urge: Urge = { tool: null, triggers: [], intensity: null, outcome: null, feeling: null, spots: [], ...input, id: newId(), at: now.toISOString(), date: dayKey(now), hour: now.getHours() }
  return { data: { ...data, urges: [...data.urges, urge] }, id: urge.id }
}

export function updateUrge(data: TarnData, id: string, patch: Partial<Omit<Urge, 'id'>>): TarnData {
  return { ...data, urges: data.urges.map((u) => (u.id === id ? { ...u, ...patch } : u)) }
}

export function removeUrge(data: TarnData, id: string): TarnData {
  return { ...data, urges: data.urges.filter((u) => u.id !== id) }
}

export function toggleRoutine(data: TarnData, date: string, routineId: string): TarnData {
  const id = `${date}|${routineId}`
  const has = data.routineLogs.some((l) => l.id === id)
  return { ...data, routineLogs: has ? data.routineLogs.filter((l) => l.id !== id) : [...data.routineLogs, { id, date, routineId }] }
}

export function setRoutines(data: TarnData, routines: Routine[]): TarnData {
  return { ...data, profile: { ...data.profile, routines } }
}

export function addFocus(data: TarnData, f: Omit<FocusSession, 'id'>): TarnData {
  return { ...data, focus: [...data.focus, { ...f, id: newId() }] }
}

export function addMindful(data: TarnData, m: Omit<MindfulSession, 'id'>): TarnData {
  if (m.seconds <= 0) return data
  return { ...data, mindful: [...data.mindful, { ...m, id: newId() }] }
}

export function addJournal(data: TarnData, j: Omit<JournalEntry, 'id' | 'createdAt'>, now = new Date()): TarnData {
  return { ...data, journal: [...data.journal, { ...j, id: newId(), createdAt: now.toISOString() }] }
}

export function updateJournal(data: TarnData, id: string, patch: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>): TarnData {
  return { ...data, journal: data.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)) }
}

export function removeJournal(data: TarnData, id: string): TarnData {
  return { ...data, journal: data.journal.filter((j) => j.id !== id) }
}

export function updateProfile(data: TarnData, patch: Partial<Omit<Profile, 'id'>>): TarnData {
  return { ...data, profile: { ...data.profile, ...patch } }
}

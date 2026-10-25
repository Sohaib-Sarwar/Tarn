import { isDayKey } from './dates'
import {
  COLLECTIONS,
  emptyProfile,
  type CheckIn,
  type CheckInStatus,
  type Collection,
  type FocusSession,
  type Goal,
  type GoalEvent,
  type JournalEntry,
  type MindfulSession,
  type TarnData,
  type Profile,
  type Routine,
  type RoutineCategory,
  type RoutineLog,
  type AgeRange,
  type BodySpot,
  type Feeling,
  type Trigger,
  type Urge,
  type UrgeOutcome,
  type UrgeTool,
  type Want,
} from './types'

/**
 * Every record read from storage or an import file passes through these checks. Anything that does
 * not match the expected shape is dropped and counted, so one bad record never breaks the app.
 */
type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max = 2000): string | null => (typeof v === 'string' ? v.slice(0, max) : null)
const text = (v: unknown, max = 2000): string => str(v, max) ?? ''
const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === 'string' && (list as readonly string[]).includes(v)
const rating = (v: unknown, lo = 1, hi = 5): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null)
const iso = (v: unknown): string | null => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null)

const KINDS = ['porn', 'masturbation', 'custom'] as const
const MODES = ['stop', 'reduce'] as const
const STATUSES: readonly CheckInStatus[] = ['aligned', 'urge', 'hard', 'reset', 'skip']
const TOOLS: readonly UrgeTool[] = ['breathe', 'delay', 'leave', 'walk', 'device', 'move', 'reason', 'focus', 'write', 'contact']
const TRIGGERS: readonly Trigger[] = ['boredom', 'stress', 'loneliness', 'late', 'social', 'alone', 'emotions', 'habit', 'other', 'private']
const OUTCOMES: readonly UrgeOutcome[] = ['passed', 'eased', 'acted', 'unsure']
const CATEGORIES: readonly RoutineCategory[] = ['sleep', 'movement', 'reading', 'focus', 'quiet', 'learning', 'outdoors', 'screenfree', 'social', 'practice', 'planning', 'custom']
const FEELINGS: readonly Feeling[] = ['calmer', 'better', 'difficult', 'private']
const SPOTS: readonly BodySpot[] = ['chest', 'stomach', 'head', 'hands', 'whole', 'unsure']
const AGES: readonly AgeRange[] = ['18-24', '25-34', '35-44', '45-54', '55+']
const WANT_IDS: readonly Want[] = ['focus', 'time', 'routines', 'control', 'offline', 'sleep', 'presence', 'alignment', 'other']

function goal(v: unknown): Goal | null {
  if (!isObj(v) || !str(v.id) || !oneOf(v.kind, KINDS) || !oneOf(v.mode, MODES) || !isDayKey(v.startDate)) return null
  const limit = typeof v.weeklyLimit === 'number' && Number.isInteger(v.weeklyLimit) && v.weeklyLimit >= 0 && v.weeklyLimit <= 21 ? v.weeklyLimit : 0
  const target = typeof v.targetDays === 'number' && Number.isInteger(v.targetDays) && v.targetDays > 0 && v.targetDays <= 3650 ? v.targetDays : null
  return {
    id: v.id as string,
    kind: v.kind,
    mode: v.mode,
    label: text(v.label, 60) || 'My goal',
    meaning: text(v.meaning, 280),
    weeklyLimit: v.mode === 'stop' ? 0 : limit,
    startDate: v.startDate,
    targetDays: target,
    createdAt: iso(v.createdAt) ?? new Date(0).toISOString(),
    archived: v.archived === true,
  }
}

function event(v: unknown): GoalEvent | null {
  if (!isObj(v) || !str(v.id) || !str(v.goalId) || !isDayKey(v.date)) return null
  return { id: v.id as string, goalId: v.goalId as string, date: v.date, note: text(v.note, 1000), reflection: text(v.reflection, 1000), createdAt: iso(v.createdAt) ?? new Date(0).toISOString() }
}

function checkin(v: unknown): CheckIn | null {
  if (!isObj(v) || !isDayKey(v.date) || !oneOf(v.status, STATUSES)) return null
  return { id: v.date, date: v.date, status: v.status, mood: rating(v.mood), note: text(v.note, 1000), updatedAt: iso(v.updatedAt) ?? new Date(0).toISOString() }
}

function urge(v: unknown): Urge | null {
  if (!isObj(v) || !str(v.id) || !isDayKey(v.date) || !iso(v.at)) return null
  const hour = typeof v.hour === 'number' && Number.isInteger(v.hour) && v.hour >= 0 && v.hour <= 23 ? v.hour : new Date(v.at as string).getHours()
  return {
    id: v.id as string,
    at: v.at as string,
    date: v.date,
    hour,
    tool: oneOf(v.tool, TOOLS) ? v.tool : null,
    triggers: Array.isArray(v.triggers) ? [...new Set(v.triggers.filter((t): t is Trigger => oneOf(t, TRIGGERS)))] : [],
    intensity: rating(v.intensity),
    outcome: oneOf(v.outcome, OUTCOMES) ? v.outcome : null,
    feeling: oneOf(v.feeling, FEELINGS) ? v.feeling : null,
    spots: Array.isArray(v.spots) ? [...new Set(v.spots.filter((s): s is BodySpot => oneOf(s, SPOTS)))] : [],
  }
}

function routineLog(v: unknown): RoutineLog | null {
  if (!isObj(v) || !isDayKey(v.date) || !str(v.routineId)) return null
  return { id: `${v.date}|${v.routineId}`, date: v.date, routineId: v.routineId as string }
}

function focus(v: unknown): FocusSession | null {
  if (!isObj(v) || !str(v.id) || !isDayKey(v.date) || typeof v.minutes !== 'number' || !(v.minutes > 0 && v.minutes <= 600)) return null
  return { id: v.id as string, date: v.date, minutes: Math.round(v.minutes), task: text(v.task, 140), completed: v.completed === true }
}

function mindful(v: unknown): MindfulSession | null {
  if (!isObj(v) || !str(v.id) || !isDayKey(v.date) || !oneOf(v.kind, ['breath', 'reflection'] as const) || typeof v.seconds !== 'number' || !(v.seconds >= 0 && v.seconds <= 7200)) return null
  return { id: v.id as string, date: v.date, kind: v.kind, seconds: Math.round(v.seconds) }
}

function journal(v: unknown): JournalEntry | null {
  if (!isObj(v) || !str(v.id) || !isDayKey(v.date) || !oneOf(v.kind, ['entry', 'morning', 'evening', 'weekly'] as const)) return null
  return {
    id: v.id as string,
    date: v.date,
    kind: v.kind,
    mood: rating(v.mood),
    stress: rating(v.stress),
    sleep: rating(v.sleep),
    focus: rating(v.focus),
    urge: rating(v.urge),
    text: text(v.text, 4000),
    helped: text(v.helped, 280),
    createdAt: iso(v.createdAt) ?? new Date(0).toISOString(),
  }
}

function routine(v: unknown): Routine | null {
  if (!isObj(v) || !str(v.id) || !oneOf(v.category, CATEGORIES)) return null
  const label = text(v.label, 60).trim()
  return label ? { id: v.id as string, category: v.category, label } : null
}

export function sanitizeProfile(v: unknown): Profile {
  const base = emptyProfile()
  if (!isObj(v)) return base
  const contact = isObj(v.contact) && str(v.contact.address) ? { name: text(v.contact.name, 60), address: text(v.contact.address, 120) } : null
  return {
    id: 'profile',
    onboarded: v.onboarded === true,
    createdAt: iso(v.createdAt) ?? base.createdAt,
    name: text(v.name, 40).trim(),
    ageRange: oneOf(v.ageRange, AGES) ? v.ageRange : null,
    goiNote: typeof v.goiNote === 'number' && Number.isInteger(v.goiNote) && v.goiNote >= 300 && v.goiNote <= 850 ? v.goiNote : null,
    wants: Array.isArray(v.wants) ? [...new Set(v.wants.filter((w): w is Want => oneOf(w, WANT_IDS)))] : [],
    reason: text(v.reason, 500),
    routines: Array.isArray(v.routines) ? v.routines.map(routine).filter((r): r is Routine => r !== null).slice(0, 8) : [],
    contact,
    // V1.0 saved its old default name; anyone who never changed it gets the new brand.
    appTitle: ((t) => (!t || t === 'Stillpoint' ? base.appTitle : t))(text(v.appTitle, 40).trim()),
    reminderTime: typeof v.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(v.reminderTime) ? v.reminderTime : null,
    primaryGoalId: str(v.primaryGoalId, 80),
  }
}

const VALIDATORS: { [K in Collection]: (v: unknown) => TarnData[K][number] | null } = {
  goals: goal,
  events: event,
  checkins: checkin,
  urges: urge,
  routineLogs: routineLog,
  focus,
  mindful,
  journal,
}

export function sanitizeRecords<K extends Collection>(collection: K, items: unknown): { records: TarnData[K]; skipped: number } {
  if (!Array.isArray(items)) return { records: [] as unknown as TarnData[K], skipped: items === undefined ? 0 : 1 }
  const seen = new Set<string>()
  const out: unknown[] = []
  let skipped = 0
  for (const item of items) {
    const r = VALIDATORS[collection](item)
    if (!r || seen.has(r.id)) {
      skipped++
      continue
    }
    seen.add(r.id)
    out.push(r)
  }
  return { records: out as TarnData[K], skipped }
}

/** Cleans a whole data object; events pointing at goals that no longer exist are dropped too. */
export function sanitizeData(raw: unknown): { data: TarnData; skipped: number } {
  const src = isObj(raw) ? raw : {}
  let skipped = 0
  const data = { profile: sanitizeProfile(src.profile) } as TarnData
  for (const c of COLLECTIONS) {
    const r = sanitizeRecords(c, src[c])
    ;(data as unknown as Record<Collection, unknown>)[c] = r.records
    skipped += r.skipped
  }
  // IndexedDB returns records by key, not by creation; keep goals in the order the user made them.
  const KIND_ORDER = { porn: 0, masturbation: 1, custom: 2 }
  data.goals.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.label.localeCompare(b.label))
  const goalIds = new Set(data.goals.map((g) => g.id))
  const before = data.events.length
  data.events = data.events.filter((e) => goalIds.has(e.goalId))
  skipped += before - data.events.length
  if (data.profile.primaryGoalId && !goalIds.has(data.profile.primaryGoalId)) data.profile.primaryGoalId = data.goals[0]?.id ?? null
  return { data, skipped }
}

/** Local calendar day, `YYYY-MM-DD`, taken from the device clock when the entry was made. */
export type DayKey = string

export type GoalKind = 'porn' | 'masturbation' | 'custom'
export type GoalMode = 'stop' | 'reduce'

export interface Goal {
  id: string
  kind: GoalKind
  mode: GoalMode
  /** What the user calls it, e.g. "No porn". Shown only inside the app, never on share cards. */
  label: string
  /** Optional plain words for what counts, written by the user. */
  meaning: string
  /** Reduce goals only: how many times in any 7 days still fits the plan. Stop goals use 0. */
  weeklyLimit: number
  startDate: DayKey
  /** Planning target in days, or null for no end date. Not a recovery period. */
  targetDays: number | null
  createdAt: string
  archived: boolean
}

/** One time the tracked behavior happened. Whether it counts as a setback depends on the goal's rule. */
export interface GoalEvent {
  id: string
  goalId: string
  date: DayKey
  note: string
  /** Optional "what would I do differently" reflection, used by the Honest Reset badge. */
  reflection: string
  createdAt: string
}

export type CheckInStatus = 'aligned' | 'urge' | 'hard' | 'reset' | 'skip'

export interface CheckIn {
  /** Same as the date: one check in per day, editable. */
  id: DayKey
  date: DayKey
  status: CheckInStatus
  mood: number | null
  note: string
  updatedAt: string
}

export type UrgeTool = 'breathe' | 'delay' | 'leave' | 'walk' | 'device' | 'move' | 'reason' | 'focus' | 'write' | 'contact'
export type Trigger = 'boredom' | 'stress' | 'loneliness' | 'late' | 'social' | 'alone' | 'emotions' | 'habit' | 'other' | 'private'
export type UrgeOutcome = 'passed' | 'eased' | 'acted' | 'unsure'
/** Answer to "Feeling any different?" after a calm session. */
export type Feeling = 'calmer' | 'better' | 'difficult' | 'private'
/** Where the urge was noticed in the body, if the user chose to say. */
export type BodySpot = 'chest' | 'stomach' | 'head' | 'hands' | 'whole' | 'unsure'

export interface Urge {
  id: string
  /** ISO time the urge was logged. */
  at: string
  date: DayKey
  /** Local hour 0 to 23, kept so patterns do not depend on the viewer's time zone later. */
  hour: number
  tool: UrgeTool | null
  triggers: Trigger[]
  intensity: number | null
  outcome: UrgeOutcome | null
  feeling: Feeling | null
  spots: BodySpot[]
}

export type RoutineCategory =
  | 'sleep'
  | 'movement'
  | 'reading'
  | 'focus'
  | 'quiet'
  | 'learning'
  | 'outdoors'
  | 'screenfree'
  | 'social'
  | 'practice'
  | 'planning'
  | 'custom'

export interface Routine {
  id: string
  category: RoutineCategory
  label: string
}

export interface RoutineLog {
  /** `${date}|${routineId}` */
  id: string
  date: DayKey
  routineId: string
}

export interface FocusSession {
  id: string
  date: DayKey
  minutes: number
  task: string
  completed: boolean
}

export interface MindfulSession {
  id: string
  date: DayKey
  kind: 'breath' | 'reflection'
  seconds: number
}

export type JournalKind = 'entry' | 'morning' | 'evening' | 'weekly'

export interface JournalEntry {
  id: string
  date: DayKey
  kind: JournalKind
  /** 1 to 5 self ratings; null when skipped. */
  mood: number | null
  stress: number | null
  sleep: number | null
  focus: number | null
  urge: number | null
  text: string
  helped: string
  createdAt: string
}

export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55+'

export type Want = 'focus' | 'time' | 'routines' | 'control' | 'offline' | 'sleep' | 'presence' | 'alignment' | 'other'

export interface TrustedContact {
  name: string
  /** Phone number or email the user typed. Only used to open their own messaging app. */
  address: string
}

export interface Profile {
  id: 'profile'
  onboarded: boolean
  createdAt: string
  /** Optional first name or nickname for the greeting. Never leaves the device. */
  name: string
  ageRange: AgeRange | null
  /** GOI brought over from GOONOMICS with consent. Entertainment only, shown as a note. */
  goiNote: number | null
  wants: Want[]
  /** The user's own reason, shown in the urge toolkit. */
  reason: string
  routines: Routine[]
  contact: TrustedContact | null
  /** Window title shown in the browser tab, for discretion. */
  appTitle: string
  reminderTime: string | null
  /** The goal shown first on Today. */
  primaryGoalId: string | null
}

export interface TarnData {
  profile: Profile
  goals: Goal[]
  events: GoalEvent[]
  checkins: CheckIn[]
  urges: Urge[]
  routineLogs: RoutineLog[]
  focus: FocusSession[]
  mindful: MindfulSession[]
  journal: JournalEntry[]
}

export type Collection = Exclude<keyof TarnData, 'profile'>

export const COLLECTIONS: Collection[] = ['goals', 'events', 'checkins', 'urges', 'routineLogs', 'focus', 'mindful', 'journal']

export function emptyProfile(now = new Date()): Profile {
  return {
    id: 'profile',
    onboarded: false,
    createdAt: now.toISOString(),
    name: '',
    ageRange: null,
    goiNote: null,
    wants: [],
    reason: '',
    routines: [],
    contact: null,
    appTitle: 'Tarn',
    reminderTime: null,
    primaryGoalId: null,
  }
}

export function emptyData(now = new Date()): TarnData {
  return { profile: emptyProfile(now), goals: [], events: [], checkins: [], urges: [], routineLogs: [], focus: [], mindful: [], journal: [] }
}

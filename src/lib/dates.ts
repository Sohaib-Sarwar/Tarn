import type { DayKey } from './types'

/**
 * Day keys are plain local calendar dates. Arithmetic runs in UTC on those dates, so daylight
 * saving changes and the viewer's time zone never shift a day.
 */
const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(d: Date = new Date()): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isDayKey(v: unknown): v is DayKey {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number) as [number, number, number]
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

function toUtc(k: DayKey): number {
  const [y, m, d] = k.split('-').map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d)
}

function fromUtc(t: number): DayKey {
  const d = new Date(t)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

const DAY = 86_400_000

export function addDays(k: DayKey, n: number): DayKey {
  return fromUtc(toUtc(k) + n * DAY)
}

/** Whole days from a to b (b minus a). */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY)
}

/** Every day from a to b inclusive; empty when b is before a. */
export function daysBetween(a: DayKey, b: DayKey): DayKey[] {
  const n = diffDays(a, b)
  const out: DayKey[] = []
  for (let i = 0; i <= n; i++) out.push(addDays(a, i))
  return out
}

/** 0 Sunday to 6 Saturday. */
export function weekday(k: DayKey): number {
  return new Date(toUtc(k)).getUTCDay()
}

/** Monday of the week containing k. */
export function startOfWeek(k: DayKey): DayKey {
  return addDays(k, -((weekday(k) + 6) % 7))
}

export function monthKey(k: DayKey): string {
  return k.slice(0, 7)
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number) as [number, number]
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  return `${MONTHS[m - 1]} ${y}`
}

export function longDate(k: DayKey): string {
  const [y, m, d] = k.split('-').map(Number) as [number, number, number]
  return `${WEEKDAYS[weekday(k)]}, ${MONTHS[m - 1]} ${d}, ${y}`
}

export function shortDate(k: DayKey): string {
  const [, m, d] = k.split('-').map(Number) as [number, number, number]
  return `${MONTHS[m - 1]!.slice(0, 3)} ${d}`
}

export function weekdayLetter(k: DayKey): string {
  return WEEKDAYS[weekday(k)]!.slice(0, 1)
}

export function weekdayName(k: DayKey): string {
  return WEEKDAYS[weekday(k)]!
}

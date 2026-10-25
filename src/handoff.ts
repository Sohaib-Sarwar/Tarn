import type { AgeRange } from './lib/types'

/**
 * The opt in bridge from GOONOMICS. Only an age range and the GOI travel, only after the user
 * agrees on the results screen, and only through this tab's sessionStorage (same site, same
 * browser). The GOI is an entertainment number and is never used to set a goal or a severity.
 */
const KEY = 'tarn-handoff'

export interface Handoff {
  ageRange: AgeRange | null
  goi: number | null
}

export function ageToRange(age: number): AgeRange | null {
  if (!Number.isFinite(age) || age < 18) return null
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  return '55+'
}

export function writeHandoff(h: Handoff) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(h))
  } catch {
    // Storage blocked: onboarding simply starts empty.
  }
}

export function readHandoff(): Handoff | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Partial<Handoff> | null
    if (!v || typeof v !== 'object') return null
    const ages: AgeRange[] = ['18-24', '25-34', '35-44', '45-54', '55+']
    const ageRange = ages.includes(v.ageRange as AgeRange) ? (v.ageRange as AgeRange) : null
    const goi = typeof v.goi === 'number' && Number.isInteger(v.goi) && v.goi >= 300 && v.goi <= 850 ? v.goi : null
    return ageRange || goi !== null ? { ageRange, goi } : null
  } catch {
    return null
  }
}

export function clearHandoff() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}

import { dayKey } from './dates'
import { sanitizeData } from './validate'
import type { TarnData } from './types'

/**
 * Export format, documented in docs/stillpoint.md:
 * { "format": "stillpoint-export", "version": 1, "exportedAt": ISO time, "data": TarnData }
 * The file is plain, unencrypted JSON. Users are told to store it somewhere private.
 */
export const EXPORT_FORMAT = 'stillpoint-export'
export const EXPORT_VERSION = 1

export function exportJson(data: TarnData, now = new Date()): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now.toISOString(), data }, null, 2)
}

export function exportFilename(now = new Date()): string {
  return `tarn-${dayKey(now)}.json`
}

export type ImportResult = { ok: true; data: TarnData; skipped: number } | { ok: false; error: string }

export function parseImport(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON. Choose a file exported from Tarn.' }
  }
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== EXPORT_FORMAT) {
    return { ok: false, error: 'This file was not exported from Tarn.' }
  }
  const version = (raw as { version?: unknown }).version
  if (typeof version !== 'number' || version > EXPORT_VERSION) {
    return { ok: false, error: 'This export comes from a newer version of Tarn. Update the app and try again.' }
  }
  const { data, skipped } = sanitizeData((raw as { data?: unknown }).data)
  return { ok: true, data, skipped }
}

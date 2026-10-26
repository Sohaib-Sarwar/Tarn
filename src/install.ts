import { useEffect, useState } from 'react'

/**
 * App installation. Chromium browsers fire `beforeinstallprompt` (experimental, non standard), which
 * we keep and only use from a button the user presses. Safari on iPhone and iPad never fires it, so
 * those users get Add to Home Screen steps instead. Nothing here can force an install prompt.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' } | undefined>
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
let installedNow = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const KEY = 'tarn.install'

/** Remembered per browser only: whether the invitation was dismissed or the app was installed. */
function readState(): { dismissedAt?: string; installed?: boolean } {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
function writeState(patch: { dismissedAt?: string; installed?: boolean }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readState(), ...patch }))
  } catch {
    // Storage blocked: the invitation may show again next visit, which is acceptable.
  }
}

export function initInstall() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installedNow = true
    deferred = null
    writeState({ installed: true })
    emit()
  })
}

export function isStandalone(): boolean {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

export type Platform = 'ios-safari' | 'ios-other' | 'mac-safari' | 'chromium' | 'firefox' | 'other'

export function detectPlatform(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints ?? 0): Platform {
  const iPadDesktopUa = /Macintosh/.test(ua) && touchPoints > 1
  if (/iPhone|iPad|iPod/.test(ua) || iPadDesktopUa) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? 'ios-other' : 'ios-safari'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return 'chromium'
  if (/Macintosh/.test(ua) && /Safari\//.test(ua)) return 'mac-safari'
  return 'other'
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const e = deferred
  if (!e) return 'unavailable'
  deferred = null
  emit()
  try {
    const result = (await e.prompt()) ?? (await e.userChoice)
    if (result?.outcome === 'accepted') writeState({ installed: true })
    return result?.outcome ?? 'dismissed'
  } catch {
    return 'unavailable'
  }
}

export function dismissInvite() {
  writeState({ dismissedAt: new Date().toISOString() })
  emit()
}

export interface InstallState {
  standalone: boolean
  installed: boolean
  canPrompt: boolean
  platform: Platform
  dismissed: boolean
  /** True when this browser has a real way to install: a captured prompt, or Add to Home Screen. */
  supported: boolean
}

function snapshot(): InstallState {
  const platform = typeof navigator === 'undefined' ? 'other' : detectPlatform()
  const standalone = isStandalone()
  const s = readState()
  const canPrompt = !!deferred
  return {
    standalone,
    installed: standalone || installedNow || !!s.installed,
    canPrompt,
    platform,
    dismissed: !!s.dismissedAt,
    supported: canPrompt || platform === 'ios-safari' || platform === 'ios-other' || platform === 'mac-safari',
  }
}

export function useInstall(): InstallState {
  const [state, setState] = useState(snapshot)
  useEffect(() => {
    const update = () => setState(snapshot())
    listeners.add(update)
    const mq = window.matchMedia?.('(display-mode: standalone)')
    mq?.addEventListener?.('change', update)
    return () => {
      listeners.delete(update)
      mq?.removeEventListener?.('change', update)
    }
  }, [])
  return state
}

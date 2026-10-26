import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { dayKey } from './lib/dates'
import { openStorage, type Storage } from './lib/storage'
import { emptyData, type TarnData } from './lib/types'

interface Store {
  status: 'loading' | 'ready'
  data: TarnData
  /** Today's local date; updates after midnight while the app is open. */
  today: string
  storageKind: Storage['kind'] | null
  /** Records skipped on load because they could not be read. */
  skipped: number
  saveError: boolean
  apply: (change: (d: TarnData) => TarnData) => void
  replaceAll: (next: TarnData) => Promise<void>
  deleteEverything: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside TarnProvider')
  return s
}

function useToday(): string {
  const [today, setToday] = useState(() => dayKey())
  useEffect(() => {
    const tick = () => setToday((t) => (t === dayKey() ? t : dayKey()))
    const id = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}

export function TarnProvider({ children, storage: given }: { children: ReactNode; storage?: Storage }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [data, setData] = useState<TarnData>(() => emptyData())
  const [skipped, setSkipped] = useState(0)
  const [saveError, setSaveError] = useState(false)
  const storage = useRef<Storage | null>(null)
  const current = useRef(data)
  // Writes run one after another so a fast series of changes lands in order.
  const queue = useRef<Promise<void>>(Promise.resolve())
  const today = useToday()

  useEffect(() => {
    let alive = true
    ;(async () => {
      const s = given ?? (await openStorage())
      let loaded = { data: emptyData(), skipped: 0 }
      try {
        loaded = await s.load()
      } catch {
        setSaveError(true)
      }
      if (!alive) return
      storage.current = s
      current.current = loaded.data
      setData(loaded.data)
      setSkipped(loaded.skipped)
      setStatus('ready')
    })()
    return () => {
      alive = false
    }
  }, [given])

  const persist = useCallback((prev: TarnData, next: TarnData) => {
    const s = storage.current
    if (!s) return
    queue.current = queue.current
      .then(() => s.save(prev, next))
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true))
  }, [])

  const apply = useCallback(
    (change: (d: TarnData) => TarnData) => {
      const prev = current.current
      const next = change(prev)
      if (next === prev) return
      current.current = next
      setData(next)
      persist(prev, next)
    },
    [persist],
  )

  const replaceAll = useCallback(async (next: TarnData) => {
    const s = storage.current
    if (s) {
      await queue.current
      await s.clear()
      await s.save(emptyData(), next)
    }
    current.current = next
    setData(next)
  }, [])

  const deleteEverything = useCallback(async () => {
    const s = storage.current
    if (s) {
      await queue.current
      await s.clear()
    }
    const fresh = emptyData()
    current.current = fresh
    setData(fresh)
    setSkipped(0)
  }, [])

  useEffect(() => {
    document.title = data.profile.appTitle || 'Tarn'
  }, [data.profile.appTitle])

  // Theme: System follows the device live; the choice is mirrored for public/theme.js so the next
  // load paints the right colors before the app starts.
  const theme = data.profile.theme
  useEffect(() => {
    if (status !== 'ready') return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && !!mq?.matches)
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    }
    apply()
    try {
      localStorage.setItem('tarn.theme', theme)
    } catch {
      // Storage blocked: the theme still applies for this visit.
    }
    if (theme !== 'system') return
    mq?.addEventListener?.('change', apply)
    return () => mq?.removeEventListener?.('change', apply)
  }, [theme, status])

  const value = useMemo<Store>(
    () => ({ status, data, today, storageKind: storage.current?.kind ?? null, skipped, saveError, apply, replaceAll, deleteEverything }),
    [status, data, today, skipped, saveError, apply, replaceAll, deleteEverything],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

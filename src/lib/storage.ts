import { sanitizeData, sanitizeProfile, sanitizeRecords } from './validate'
import { COLLECTIONS, emptyData, type Collection, type TarnData } from './types'

/**
 * Local first storage. Records live in IndexedDB on this device, one object store per collection.
 * Nothing here talks to a network. When IndexedDB is unavailable (some private windows, blocked
 * storage) the app keeps working in memory for the session and says so.
 */
export interface Storage {
  kind: 'indexeddb' | 'memory'
  load(): Promise<{ data: TarnData; skipped: number }>
  /** Writes only what changed between two states. */
  save(prev: TarnData, next: TarnData): Promise<void>
  clear(): Promise<void>
}

export const DB_NAME = 'stillpoint'
const DB_VERSION = 1
const META = 'meta'

/** Records whose object identity changed are written; ids that disappeared are deleted. */
export function diffCollection<T extends { id: string }>(prev: T[], next: T[]): { put: T[]; remove: string[] } {
  const before = new Map(prev.map((r) => [r.id, r]))
  const after = new Set(next.map((r) => r.id))
  return {
    put: next.filter((r) => before.get(r.id) !== r),
    remove: prev.filter((r) => !after.has(r.id)).map((r) => r.id),
  }
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
  })
}

export function openDb(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(DB_NAME, DB_VERSION)
    r.onupgradeneeded = () => {
      const db = r.result
      for (const name of [META, ...COLLECTIONS]) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' })
    }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.onblocked = () => reject(new Error('Storage is blocked by another tab'))
  })
}

export function indexedDbStorage(db: IDBDatabase): Storage {
  const stores = [META, ...COLLECTIONS]
  return {
    kind: 'indexeddb',
    async load() {
      const tx = db.transaction(stores, 'readonly')
      const raw: Record<string, unknown> = {}
      const profile = await req(tx.objectStore(META).get('profile'))
      for (const c of COLLECTIONS) raw[c] = await req(tx.objectStore(c).getAll())
      let skipped = 0
      const data = { profile: sanitizeProfile(profile) } as TarnData
      for (const c of COLLECTIONS) {
        const r = sanitizeRecords(c, raw[c])
        ;(data as unknown as Record<Collection, unknown>)[c] = r.records
        skipped += r.skipped
      }
      // Cross record checks (events for deleted goals) reuse the full sanitizer.
      const full = sanitizeData(data)
      return { data: full.data, skipped: skipped + full.skipped }
    },
    async save(prev, next) {
      const tx = db.transaction(stores, 'readwrite')
      if (prev.profile !== next.profile) tx.objectStore(META).put(next.profile)
      for (const c of COLLECTIONS) {
        const d = diffCollection(prev[c] as { id: string }[], next[c] as { id: string }[])
        const store = tx.objectStore(c)
        for (const r of d.put) store.put(r)
        for (const id of d.remove) store.delete(id)
      }
      await done(tx)
    },
    async clear() {
      const tx = db.transaction(stores, 'readwrite')
      for (const s of stores) tx.objectStore(s).clear()
      await done(tx)
    },
  }
}

export function memoryStorage(initial?: TarnData): Storage {
  let snapshot = initial ?? emptyData()
  return {
    kind: 'memory',
    async load() {
      return sanitizeData(snapshot)
    },
    async save(_prev, next) {
      snapshot = next
    },
    async clear() {
      snapshot = emptyData()
    },
  }
}

/** Opens IndexedDB, falling back to memory if it is missing or refuses to open. */
export async function openStorage(): Promise<Storage> {
  try {
    if (typeof indexedDB === 'undefined') return memoryStorage()
    return indexedDbStorage(await openDb())
  } catch {
    return memoryStorage()
  }
}

/** Asks the browser to keep this site's storage under pressure. Returns the resulting state. */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null
    return await navigator.storage.persist()
  } catch {
    return null
  }
}

export async function isPersisted(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null
    return await navigator.storage.persisted()
  } catch {
    return null
  }
}

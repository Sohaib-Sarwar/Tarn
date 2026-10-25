import { useEffect, useState } from 'react'
import { Shell } from './components/Shell'
import { TarnMark } from './components/Art'
import type { Storage } from './lib/storage'
import { Onboarding } from './pages/Onboarding'
import { Today } from './pages/Today'
import { Journey } from './pages/Journey'
import { Calm } from './pages/Calm'
import { Profile } from './pages/Profile'
import { navigate, useRoute } from './router'
import { TarnProvider, useStore } from './store'

/** Shown when a new version of the app has downloaded; it waits for the user instead of reloading on its own. */
function UpdateBanner() {
  const [worker, setWorker] = useState<ServiceWorker | null>(null)
  const route = useRoute()
  useEffect(() => {
    const on = (e: Event) => setWorker((e as CustomEvent<ServiceWorker>).detail)
    window.addEventListener('tarn:update', on)
    return () => window.removeEventListener('tarn:update', on)
  }, [])
  // Never interrupt the Calm screen; the update waits until the person is back.
  if (!worker || route === 'calm') return null
  return (
    <div role="status" className="pt-safe fixed inset-x-0 top-3 z-[70] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-5 text-sm text-cream shadow-soft">
        A new version of Tarn is ready.
        <button
          type="button"
          className="press min-h-10 rounded-full bg-cream px-4 font-semibold text-ink"
          onClick={() => {
            window.dispatchEvent(new Event('tarn:apply-update'))
            worker.postMessage({ type: 'SKIP_WAITING' })
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}

function Screens() {
  const { status, data, storageKind, skipped, saveError } = useStore()
  const route = useRoute()
  const onboarded = data.profile.onboarded

  useEffect(() => {
    if (status !== 'ready') return
    // Calm is always reachable, even before onboarding: help first, setup later.
    if (!onboarded && route !== 'welcome' && route !== 'calm' && route !== 'profile') navigate('welcome', { replace: true })
    if (onboarded && route === 'welcome') navigate('today', { replace: true })
  }, [status, onboarded, route])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-parchment" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <TarnMark size={44} className="animate-pulse" />
          <p className="text-sm text-ink-soft">Opening your records on this device</p>
        </div>
      </div>
    )
  }

  if (route === 'calm') return <Calm />
  if (!onboarded && route !== 'profile') return <Onboarding />

  return (
    <Shell route={route}>
      {storageKind === 'memory' && (
        <p role="alert" className="mt-3 rounded-2xl border border-gold/60 bg-gold-soft px-4 py-3 text-sm text-ink">
          This browser is not letting Tarn save. Everything works, but it will be gone when you close this tab. A normal (not private) window usually fixes it.
        </p>
      )}
      {skipped > 0 && (
        <p role="status" className="mt-3 rounded-2xl border border-stone bg-cream px-4 py-3 text-sm text-ink">
          {skipped} saved {skipped === 1 ? 'record' : 'records'} could not be read and {skipped === 1 ? 'was' : 'were'} skipped. Everything else loaded normally.
        </p>
      )}
      {saveError && (
        <p role="alert" className="mt-3 rounded-2xl border border-clay/40 bg-cream px-4 py-3 text-sm text-clay">
          The last change could not be saved on this device. Storage may be full. Export your data from Profile to keep a copy.
        </p>
      )}
      {route === 'today' && <Today />}
      {route === 'journey' && <Journey />}
      {route === 'profile' && <Profile />}
    </Shell>
  )
}

export default function App({ storage }: { storage?: Storage }) {
  return (
    <TarnProvider storage={storage}>
      <UpdateBanner />
      <Screens />
    </TarnProvider>
  )
}

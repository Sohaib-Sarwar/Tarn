import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App'
import { initInstall } from './install'
import { captureHandoff } from './handoff'

// Listen early: Chromium can fire the install event before React mounts.
initInstall()
// A GOONOMICS link may carry an opt in age range and GOI in the fragment; read it once, then drop it.
captureHandoff()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Offline support and updates. The worker caches the app's own files only; records stay in
 * IndexedDB. A new version waits until the user taps "Refresh", so a running page never mixes old
 * and new files.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let requested = false
  window.addEventListener('tarn:apply-update', () => (requested = true))
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (requested) window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        const announce = (worker: ServiceWorker) => window.dispatchEvent(new CustomEvent('tarn:update', { detail: worker }))
        if (reg.waiting && navigator.serviceWorker.controller) announce(reg.waiting)
        reg.addEventListener('updatefound', () => {
          const w = reg.installing
          w?.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) announce(w)
          })
        })
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update().catch(() => undefined))
      })
      .catch(() => undefined)
  })
}

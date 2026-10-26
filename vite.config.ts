/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Social scrapers want absolute URLs. Set SITE_URL at build time for the real domain. */
function siteOrigin(): Plugin {
  const host = (process.env.SITE_URL ?? 'https://tarn-rehab.vercel.app').replace(/\/$/, '')
  return { name: 'site-origin', transformIndexHtml: (html) => html.replaceAll('%OG_ORIGIN%', host) }
}

/** Preloads the two faces the first screen needs, using their hashed build names. */
function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html, ctx) => {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => /(newsreader|hanken-grotesk)-latin-wght-normal-.*\.woff2$/.test(f))
        const tags = files.map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ')
        return html.replace('</title>', `</title>\n    ${tags}`)
      },
    },
  }
}

/**
 * Writes /sw.js with the exact list of hashed app files, so the installed app opens offline.
 * It caches app files only; records live in IndexedDB and never pass through it.
 */
function serviceWorker(): Plugin {
  return {
    name: 'tarn-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => f.startsWith('_app/') && /\.(js|css|woff2|webp|png|jpg)$/.test(f))
        .sort()
      const precache = ['/index.html', '/manifest.webmanifest', '/favicon.png', '/theme.js', '/icons/icon-192.png', '/icons/icon-512.png', ...ART, ...files.map((f) => `/${f}`)]
      const version = files
        .join('|')
        .split('')
        .reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7)
        .toString(36)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: swSource(`tarn-${version}`, precache) })
    },
  }
}

/** Public art the calm screens need offline. Kept in step with scripts/process-art.mjs. */
const ART = ['/art/calm-dusk-portrait.webp', '/art/calm-dusk-wide.webp', '/art/dawn-wide.webp', '/art/dawn-portrait.webp']

function swSource(cache: string, precache: string[]): string {
  return `// Tarn offline worker. Generated at build time by vite.config.ts. Caches app files only.
const CACHE = ${JSON.stringify(cache)}
const PRECACHE = ${JSON.stringify(precache)}
const SHELL = '/index.html'

self.addEventListener('install', (e) => {
  // No skipWaiting here: an update waits until the page asks for it, so open pages keep consistent files.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
})

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tarn-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(SHELL, copy))
          }
          return res
        })
        .catch(() => caches.match(SHELL)),
    )
    return
  }
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.startsWith('/_app/') || url.pathname.startsWith('/art/') || url.pathname.startsWith('/icons/'))) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
`
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteOrigin(), preloadFonts(), serviceWorker()],
  build: {
    target: 'es2022',
    cssMinify: true,
    // Hashed bundles live apart from public files so those are never cached forever.
    assetsDir: '_app',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})

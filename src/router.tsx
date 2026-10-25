import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

/** A tiny path router. Tarn is a single page app served from the site root. */
export const BASE = ''

export type Route = 'welcome' | 'today' | 'journey' | 'calm' | 'profile'

/** V1.0 paths keep working: they open the screen that now holds the same feature. */
const ALIASES: Record<string, Route> = {
  today: 'today',
  journey: 'journey',
  calm: 'calm',
  profile: 'profile',
  urge: 'calm',
  insights: 'journey',
  routines: 'profile',
  settings: 'profile',
}

export function parseRoute(pathname: string): Route {
  const rest = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
  const seg = rest.replace(/^\/+|\/+$/g, '').split('/')[0] ?? ''
  return ALIASES[seg] ?? 'welcome'
}

export function pathFor(route: Route): string {
  return route === 'welcome' ? `${BASE}/` : `${BASE}/${route}`
}

const listeners = new Set<() => void>()

export function navigate(route: Route, opts: { replace?: boolean } = {}) {
  const path = pathFor(route)
  if (window.location.pathname !== path) {
    if (opts.replace) window.history.replaceState(null, '', path)
    else window.history.pushState(null, '', path)
  }
  listeners.forEach((l) => l())
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname))
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.pathname))
    listeners.add(update)
    window.addEventListener('popstate', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('popstate', update)
    }
  }, [])
  return route
}

/** An anchor that navigates in place, so links still work with middle click and keyboard. */
export function Link({ to, onClick, ...rest }: { to: Route } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={pathFor(to)}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    />
  )
}

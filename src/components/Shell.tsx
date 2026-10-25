import { CalendarDays, CircleUserRound, Sun, Waves } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, type Route } from '../router'
import { Wordmark } from './Art'

const NAV: { to: Route; label: string; icon: typeof Sun }[] = [
  { to: 'today', label: 'Today', icon: Sun },
  { to: 'journey', label: 'Journey', icon: CalendarDays },
  { to: 'calm', label: 'Calm', icon: Waves },
  { to: 'profile', label: 'Profile', icon: CircleUserRound },
]

/**
 * Phones: a floating, translucent tab bar with four labeled destinations. Calm sits in a forest
 * circle so it is easy to find without shouting. From 1024 px the tabs become a slim sidebar.
 */
export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-parchment lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <a href="#content" className="sr-only z-50 rounded-full bg-forest px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-stone/60 px-3 pt-7 pb-6 lg:flex">
        <Link to="today" className="mb-8 inline-flex min-h-11 items-center px-3" aria-label="Tarn, today">
          <Wordmark />
        </Link>
        <nav aria-label="Main">
          <ul className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = route === to
              return (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`press flex min-h-11 items-center gap-3 rounded-full px-4 text-[0.95rem] font-medium ${active ? 'bg-forest text-cream' : 'text-ink hover:bg-sage-soft'}`}
                  >
                    <Icon size={18} aria-hidden strokeWidth={1.8} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <p className="mt-auto px-3 text-xs leading-relaxed text-ink-soft">Private by design. Your records stay on this device.</p>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="pt-safe lg:hidden">
          <div className="mx-auto flex h-14 max-w-xl items-center px-5">
            <Link to="today" className="inline-flex min-h-11 items-center" aria-label="Tarn, today">
              <Wordmark size={24} />
            </Link>
          </div>
        </header>

        <main id="content" className="pad-nav mx-auto w-full max-w-xl flex-1 px-5 pt-2 sm:px-6 lg:max-w-4xl lg:px-12 lg:pt-12 lg:pb-16">
          {children}
        </main>

        <nav aria-label="Main" className="bottom-safe fixed inset-x-0 z-40 flex justify-center px-3 lg:hidden">
          <ul className="glass grid w-full max-w-[24rem] grid-cols-4 rounded-[1.75rem] p-1.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = route === to
              const calm = to === 'calm'
              return (
                <li key={to} className="min-w-0">
                  <Link
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[1.4rem] text-[0.72rem] font-semibold ${active ? 'bg-forest/10 text-forest' : 'text-ink-soft hover:text-ink'}`}
                  >
                    <span className={`grid size-8 place-items-center rounded-full ${calm ? 'bg-forest text-cream' : ''}`}>
                      <Icon size={calm ? 17 : 20} aria-hidden strokeWidth={active || calm ? 2.1 : 1.8} />
                    </span>
                    <span className="max-w-full truncate">{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

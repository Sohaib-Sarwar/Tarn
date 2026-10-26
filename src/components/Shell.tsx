import { BookOpen, CalendarDays, CircleUserRound, Sun, Waves } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, type Route } from '../router'
import { useStore } from '../store'
import { Wordmark } from './Art'
import { Avatar } from './Avatar'

const NAV: { to: Route; label: string; icon: typeof Sun }[] = [
  { to: 'today', label: 'Today', icon: Sun },
  { to: 'journey', label: 'Journey', icon: CalendarDays },
  { to: 'calm', label: 'Calm', icon: Waves },
  { to: 'journal', label: 'Journal', icon: BookOpen },
  { to: 'profile', label: 'Profile', icon: CircleUserRound },
]

/**
 * Phones: one floating glass capsule holding all five tabs (after the iOS 26.4 tab bar in
 * docs/nav-inspiration.jpg), each with an icon and a label, the active one on a soft pill. Calm is
 * tinted so it is easy to find. From 1024 px the same tabs become a slim sidebar.
 */
export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { data } = useStore()
  return (
    <div className="min-h-dvh bg-parchment lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <a href="#content" className="sr-only z-50 rounded-full bg-forest px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-stone/70 px-3 pt-7 pb-6 lg:flex">
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
                    <Icon size={18} aria-hidden strokeWidth={1.8} className={!active && to === 'calm' ? 'text-forest' : ''} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <Link to="profile" className="press mt-auto flex min-h-12 items-center gap-3 rounded-2xl px-3 hover:bg-sage-soft">
          <Avatar size={34} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{data.profile.name || 'Your profile'}</span>
            <span className="block text-xs text-ink-soft">Private to this device</span>
          </span>
        </Link>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="pt-safe lg:hidden">
          <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
            <Link to="today" className="inline-flex min-h-11 items-center" aria-label="Tarn, today">
              <Wordmark size={24} />
            </Link>
            <Link to="profile" className="press grid size-11 place-items-center rounded-full" aria-label="Profile">
              <Avatar size={32} />
            </Link>
          </div>
        </header>

        <main id="content" className="pad-nav mx-auto w-full max-w-xl flex-1 px-5 pt-2 sm:px-6 lg:max-w-4xl lg:px-12 lg:pt-12 lg:pb-16">
          {children}
        </main>

        <nav aria-label="Main" className="bottom-safe fixed inset-x-0 z-40 flex justify-center px-3 lg:hidden">
          <ul className="glass grid w-full max-w-[26rem] grid-cols-5 gap-0.5 rounded-full p-1.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = route === to
              return (
                <li key={to} className="min-w-0">
                  <Link
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`press flex min-h-[3.4rem] flex-col items-center justify-center gap-0.5 rounded-full text-[0.68rem] font-semibold ${
                      active ? 'bg-ink/[0.08] text-ink' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    <Icon size={21} aria-hidden strokeWidth={active ? 2.2 : 1.8} className={to === 'calm' ? 'text-forest' : ''} />
                    <span className="max-w-full truncate px-0.5">{label}</span>
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

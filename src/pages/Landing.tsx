import { ArrowRight, BookOpen, CalendarDays, Check, Download, Leaf, Lock, ShieldCheck, Sparkles, Sun, Waves, WifiOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BadgeEmblem, Scenery, Wordmark } from '../components/Art'
import { InstallSteps } from '../components/Install'
import { Sheet } from '../components/ui'
import { milestoneImage } from '../lib/badges'
import { promptInstall, useInstall } from '../install'
import { readHandoff } from '../handoff'
import { Link, navigate } from '../router'

/**
 * The public front door for people who have not started yet. Returning people go straight to Today.
 * Every claim on this page is one the app keeps: local storage, no account, no promises of cures.
 */
export function Landing() {
  const install = useInstall()
  const [installOpen, setInstallOpen] = useState(false)
  const [handoff] = useState(readHandoff)
  const begin = () => navigate('start')
  const installCta = async () => {
    if (install.canPrompt) await promptInstall()
    else setInstallOpen(true)
  }

  return (
    <div className="min-h-dvh bg-parchment text-ink">
      <header className="pt-safe fixed inset-x-0 top-0 z-40">
        <div className="glass mx-auto mt-3 flex h-14 w-[calc(100%-1.5rem)] max-w-6xl items-center justify-between rounded-full pr-2 pl-4">
          <a href="#top" className="inline-flex min-h-11 items-center" aria-label="Tarn, top of page">
            <Wordmark size={26} />
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {[
              ['#how', 'How it works'],
              ['#features', 'Features'],
              ['#privacy', 'Privacy'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="press rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-sage-soft hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            {!install.installed && (
              <button type="button" onClick={installCta} className="press hidden min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-forest hover:bg-sage-soft sm:inline-flex">
                <Download size={16} aria-hidden /> Install
              </button>
            )}
            <button type="button" onClick={begin} className="press inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-cream hover:bg-forest-deep">
              Get started
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pt-24 pb-14 sm:items-center sm:pb-20">
          <Scenery variant="dawn" eager className="absolute inset-0 -z-20 dark:hidden" />
          <Scenery variant="dusk" eager className="absolute inset-0 -z-20 hidden dark:block" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-parchment via-parchment/70 to-transparent sm:bg-gradient-to-r sm:from-parchment sm:via-parchment/75 sm:to-transparent" aria-hidden />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="max-w-xl animate-rise">
              {handoff && <p className="mb-4 inline-flex rounded-full bg-cream/80 px-3 py-1 text-sm font-medium text-forest">Welcome from GOONOMICS</p>}
              <p className="text-sm font-semibold tracking-[0.16em] text-moss">MONK MODE, WITHOUT THE SHAME</p>
              <h1 className="serif mt-3 text-[2.9rem] leading-[1.02] tracking-[-0.015em] text-balance sm:text-[4.2rem]">Come back to yourself.</h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
                A calm, private companion for the habits you want to change. One minute of calm when an urge hits, a ten second check in, and progress that never shames you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={begin} className="press inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-forest px-7 font-semibold tracking-wide text-cream shadow-soft hover:bg-forest-deep">
                  BEGIN MY JOURNEY <ArrowRight size={18} aria-hidden />
                </button>
                {!install.installed && (
                  <button type="button" onClick={installCta} className="press inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-stone bg-cream/80 px-7 font-semibold text-ink hover:border-moss">
                    <Download size={18} aria-hidden /> Install the app
                  </button>
                )}
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                {['No account', 'Free', 'Works offline', 'Stays on your device'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check size={15} className="text-forest" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden justify-center lg:flex">
              <PhoneToday />
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
          <SectionTitle kicker="HOW IT WORKS" title="Three small things, every day" />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Leaf, title: 'Choose your intention', body: 'Pick what you want to change, porn or masturbation tracked separately, and one small daily intention.' },
              { icon: Check, title: 'Check in in ten seconds', body: 'Tell Tarn how today went. Ticks fill your calendar. Unlogged days are never counted against you.' },
              { icon: Waves, title: 'Take a moment when it is hard', body: 'One tap opens a quiet screen: a minute of slow breathing, noticing the urge, then one next step.' },
            ].map((s, i) => (
              <li key={s.title} className="rounded-[1.75rem] border border-stone/80 bg-cream p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-sage-soft text-forest">
                    <s.icon size={20} aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-moss">Step {i + 1}</span>
                </div>
                <h3 className="serif mt-4 text-2xl text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="relative isolate overflow-hidden py-20 text-snow">
          <Scenery variant="dusk" className="absolute inset-0 -z-20" />
          <div className="absolute inset-0 -z-10 bg-dusk/55" aria-hidden />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-[#a7c4ae]">FIND YOUR CALM</p>
              <h2 className="serif mt-3 text-4xl leading-tight sm:text-5xl">Pause. You do not have to act on every urge.</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-snow/80">
                The calm screen dims everything else. Breathe in, breathe out a little longer, notice where you feel it, then choose one thing: a walk, a change of room, the phone in another room, or a few honest words.
              </p>
              <p className="mt-4 text-sm text-snow/60">Breathing is offered as a way to slow down. It is not promised to remove an urge.</p>
            </div>
            <div className="flex justify-center">
              <PhoneCalm />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
          <SectionTitle kicker="FEATURES" title="Built for steady days, kind to the hard ones" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={CalendarDays} title="A calendar of ticks" body="Green ticks for days you checked in, a soft cross only for a setback you chose to log. Your history always stays." />
            <Feature icon={Sparkles} title="Milestones worth keeping" body="From First Step to One Year of Intention. A reset restarts a counter, never your longest streak or your badges." />
            <Feature icon={BookOpen} title="A private journal" body="Morning intentions, evening reflections, weekly reviews. Search them later. Never read by anyone else." />
            <Feature icon={Sun} title="Your intentions" body="Up to five small things that replace autopilot: a walk after dinner, ten pages, the phone out of the bedroom." />
            <Feature icon={Leaf} title="Honest insights" body="Patterns from your own entries, with the numbers behind them, and sourced notes on what the science does and does not say." />
            <Feature icon={WifiOff} title="Works offline" body="Install it to your Home Screen and it opens without a connection, right when you need it." />
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {['first-step', 'one-week', 'thirty-days', 'ninety-days', 'one-year'].map((id) => (
              <BadgeEmblem key={id} glyph="ripple" image={milestoneImage(id)} earned size={72} />
            ))}
          </div>
        </section>

        <section id="privacy" className="scroll-mt-24 bg-cream py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <SectionTitle kicker="PRIVACY" title="Your records never leave this device" align="left" />
              <p className="mt-4 max-w-lg leading-relaxed text-ink-soft">
                No account, no server copy, no analytics, no AI reading your journal. You can export your data as a file and delete everything in two taps.
              </p>
              <Link to="terms" className="press mt-5 inline-flex min-h-11 items-center gap-1.5 font-semibold text-forest">
                Read the terms and privacy <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                [Lock, 'Stored in your browser only'],
                [ShieldCheck, 'No trackers or cookies'],
                [Download, 'Export and import any time'],
                [WifiOff, 'Usable with no connection'],
              ].map(([Icon, text]) => {
                const I = Icon as typeof Lock
                return (
                  <li key={text as string} className="flex items-center gap-3 rounded-2xl bg-parchment p-4">
                    <I size={20} className="shrink-0 text-forest" aria-hidden />
                    <span className="font-medium text-ink">{text as string}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-20 sm:px-8">
          <SectionTitle kicker="FAQ" title="Questions people ask" />
          <div className="mt-8 divide-y divide-stone rounded-[1.75rem] border border-stone/80 bg-cream">
            {[
              ['Is Tarn free?', 'Yes. There is no subscription and no paywall.'],
              ['Do I need an account?', 'No. You can start in under a minute. Nothing asks for an email address.'],
              ['Where is my data?', 'Only in this browser on this device. Clearing browser data or losing the device deletes it, so export a copy if it matters to you.'],
              ['Is this medical treatment?', 'No. Tarn is a self directed habit companion for adults. If a habit keeps interfering with your life, a professional can help.'],
              ['What happens after a slip?', 'You can log it privately. That goal’s current streak restarts; your longest streak, total days and badges stay.'],
              ['Can I install it like an app?', 'Yes, on most phones and computers. Use the Install button, or on iPhone use Share, then Add to Home Screen in Safari.'],
            ].map(([q, a]) => (
              <details key={q} className="group px-5">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {q}
                  <span className="text-xl text-forest transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="pb-5 leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8">
          <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12">
            <Scenery variant="dawn" className="absolute inset-0 -z-20" />
            <div className="absolute inset-0 -z-10 bg-parchment/70" aria-hidden />
            <h2 className="serif text-4xl leading-tight text-ink sm:text-5xl">Start with one quiet minute.</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-soft">Small steps. More intention. One day at a time.</p>
            <button type="button" onClick={begin} className="press mt-7 inline-flex min-h-14 items-center gap-2 rounded-full bg-forest px-7 font-semibold tracking-wide text-cream hover:bg-forest-deep">
              BEGIN MY JOURNEY <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone/80 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Wordmark size={24} />
            <p className="mt-2 text-sm text-ink-soft">For adults 18+. A companion, not medical care. In crisis in the US, call or text 988.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link to="terms" className="inline-flex min-h-11 items-center font-medium text-ink-soft hover:text-ink">
              Terms and privacy
            </Link>
            <a href="#faq" className="inline-flex min-h-11 items-center font-medium text-ink-soft hover:text-ink">
              FAQ
            </a>
            <span className="inline-flex min-h-11 items-center text-ink-soft">© 2026 Tarn</span>
          </div>
        </div>
      </footer>

      <Sheet open={installOpen} onClose={() => setInstallOpen(false)} title="Install Tarn">
        <p className="mb-4 text-ink-soft">Open your daily practice from your Home Screen. It works offline and keeps the same privacy.</p>
        <InstallSteps state={install} />
      </Sheet>
    </div>
  )
}

function SectionTitle({ kicker, title, align = 'center' }: { kicker: string; title: string; align?: 'center' | 'left' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <p className="text-sm font-semibold tracking-[0.16em] text-moss">{kicker}</p>
      <h2 className="serif mt-3 text-[2.2rem] leading-tight text-balance text-ink sm:text-5xl">{title}</h2>
    </div>
  )
}

function Feature({ icon: Icon, title, body }: { icon: typeof Lock; title: string; body: string }) {
  return (
    <div className="rounded-[1.75rem] border border-stone/80 bg-cream p-6">
      <span className="grid size-11 place-items-center rounded-2xl bg-sage-soft text-forest">
        <Icon size={20} aria-hidden />
      </span>
      <h3 className="serif mt-4 text-xl text-ink">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}

function Phone({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={`relative w-[17.5rem] rounded-[2.6rem] border-[10px] p-0 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)] ${dark ? 'border-[#0d1311] bg-dusk' : 'border-[#1d2420] bg-parchment'}`} aria-hidden>
      <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0d1311]" />
      <div className="h-[34rem] overflow-hidden rounded-[2rem]">{children}</div>
    </div>
  )
}

/** A static preview of Today, drawn with the app's own tokens. */
function PhoneToday() {
  return (
    <Phone>
      <div className="flex h-full flex-col px-4 pt-10">
        <p className="serif text-xl text-ink">Good evening, Sam.</p>
        <p className="text-xs text-ink-soft">One day at a time.</p>
        <div className="mt-3 flex flex-col items-center rounded-3xl bg-cream py-4 shadow-soft">
          <div className="relative grid size-32 place-items-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0">
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="7" style={{ stroke: 'var(--color-sage-soft)' }} />
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray="230 400" transform="rotate(-90 60 60)" style={{ stroke: 'var(--color-forest)' }} />
            </svg>
            <div className="text-center">
              <p className="text-[0.6rem] text-moss">Day</p>
              <p className="serif text-4xl leading-none text-ink">24</p>
            </div>
          </div>
          <p className="serif mt-1 text-xs text-ink-soft italic">Your path, your pace.</p>
        </div>
        <div className="mt-3 rounded-2xl bg-cream p-3">
          <p className="text-[0.55rem] font-semibold tracking-[0.12em] text-moss">TODAY’S INTENTION</p>
          <p className="serif mt-1 flex items-center gap-2 text-sm text-ink">
            <span className="size-4 rounded-full border-2 border-moss" /> Walk after dinner
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-forest p-3 text-cream">
          <Waves size={16} />
          <span className="text-xs font-semibold tracking-wide">NEED A RESET?</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 rounded-2xl bg-cream p-2">
          {[1, 1, 1, 0, 1, 1, 2].map((v, i) => (
            <span key={i} className={`grid aspect-square place-items-center rounded-full ${v === 1 ? 'bg-forest text-cream' : v === 2 ? 'border-2 border-gold' : 'border-2 border-dashed border-sage'}`}>
              {v === 1 && <Check size={10} strokeWidth={3} />}
            </span>
          ))}
        </div>
        <div className="glass mt-auto mb-3 grid grid-cols-5 rounded-full p-1 text-[0.5rem] text-ink-soft">
          {[Sun, CalendarDays, Waves, BookOpen, Lock].map((I, i) => (
            <span key={i} className={`flex flex-col items-center rounded-full py-1.5 ${i === 0 ? 'bg-ink/[0.08] text-ink' : ''}`}>
              <I size={13} className={i === 2 ? 'text-forest' : ''} />
            </span>
          ))}
        </div>
      </div>
    </Phone>
  )
}

/** A static preview of the Calm screen. */
function PhoneCalm() {
  return (
    <Phone dark>
      <div className="relative h-full">
        <Scenery variant="dusk" className="absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-snow">
          <div className="grid size-36 place-items-center rounded-full bg-gradient-to-br from-[#9cb49b]/70 to-[#6e8a6a]/50 shadow-[0_0_60px_-10px_rgba(156,180,155,0.6)]" />
          <p className="serif mt-6 text-2xl">Breathe out</p>
          <p className="mt-1 text-xs text-snow/70">48 seconds left</p>
          <span className="mt-6 rounded-full bg-snow/15 px-5 py-2.5 text-xs font-semibold ring-1 ring-snow/30">End breathing</span>
        </div>
      </div>
    </Phone>
  )
}

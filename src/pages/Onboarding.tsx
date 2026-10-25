import { ArrowLeft, Lock, Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Landscape, Wordmark } from '../components/Art'
import { Button, Chip, Choice, TextField } from '../components/ui'
import { completeOnboarding, draftsFor, newId, type GoalDraft } from '../lib/actions'
import { AGE_RANGES, GOAL_CHOICES, ROUTINE_CATALOG, SUGGESTED_INTENTIONS, type GoalChoice } from '../lib/catalog'
import type { AgeRange } from '../lib/types'
import { navigate } from '../router'
import { useStore } from '../store'
import { clearHandoff, readHandoff } from '../handoff'

const STEPS = ['about', 'goal', 'intention'] as const
type Step = 'welcome' | (typeof STEPS)[number]

const LENGTHS: { days: number | null; label: string }[] = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: null, label: 'Open ended' },
]

export function Onboarding() {
  const { apply, today } = useStore()
  const [handoff] = useState(readHandoff)
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [age, setAge] = useState<AgeRange | null>(handoff?.ageRange ?? null)
  const [keepGoi, setKeepGoi] = useState(handoff?.goi != null)
  const [choice, setChoice] = useState<GoalChoice['id'] | null>(null)
  const [drafts, setDrafts] = useState<GoalDraft[]>([])
  const [length, setLength] = useState<number | null | 'custom'>(30)
  const [customDays, setCustomDays] = useState('21')
  const [intention, setIntention] = useState<string | null>(null)

  const index = STEPS.indexOf(step as (typeof STEPS)[number])
  const go = (s: Step) => {
    setStep(s)
    window.scrollTo(0, 0)
  }
  const pick = (id: GoalChoice['id']) => {
    setChoice(id)
    const d = draftsFor(id)
    setDrafts(d)
    setIntention(SUGGESTED_INTENTIONS[d[0]!.kind][0]!)
  }
  const patch = (i: number, p: Partial<GoalDraft>) => setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...p } : d)))

  const customValid = /^\d{1,4}$/.test(customDays) && Number(customDays) >= 1 && Number(customDays) <= 3650
  const targetDays = length === 'custom' ? (customValid ? Number(customDays) : null) : length
  const goalValid = drafts.length > 0 && drafts.every((d) => d.label.trim().length > 0)
  const suggestions = drafts[0] ? SUGGESTED_INTENTIONS[drafts[0].kind] : []

  const finish = () => {
    const match = ROUTINE_CATALOG.find((r) => r.label === intention)
    apply((d) =>
      completeOnboarding(d, {
        name,
        ageRange: age,
        goiNote: keepGoi ? (handoff?.goi ?? null) : null,
        routines: intention ? [{ id: newId(), category: match?.category ?? 'custom', label: intention }] : [],
        drafts,
        startDate: today,
        targetDays,
        wants: [],
        reason: '',
      }),
    )
    clearHandoff()
    navigate('today', { replace: true })
  }

  if (step === 'welcome') {
    return (
      <div className="relative min-h-dvh overflow-hidden bg-parchment">
        <Landscape className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-parchment via-parchment/92 to-transparent lg:hidden" aria-hidden />
        <div className="pt-safe relative px-6 pt-6 lg:px-12 lg:pt-10">
          <Wordmark />
        </div>
        <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] max-w-xl flex-col justify-end px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:mx-12 lg:max-w-md lg:justify-center lg:pb-24">
          <div className="lg:rounded-[2rem] lg:bg-parchment/92 lg:p-10 lg:shadow-soft">
            {handoff && <p className="mb-3 text-sm font-medium text-moss">Continuing from GOONOMICS</p>}
            <h1 className="serif text-[2.6rem] leading-[1.05] tracking-[-0.01em] text-balance text-ink sm:text-5xl">Come back to yourself.</h1>
            <p className="mt-4 text-lg leading-snug text-ink-soft">Small steps. More intention. One day at a time.</p>
            <Button size="lg" className="mt-8 w-full tracking-wide sm:w-auto" onClick={() => go('about')}>
              BEGIN MY JOURNEY
            </Button>
            <p className="mt-5 text-sm text-ink-soft">
              For adults 18+. No account. Stays on this device.{' '}
              <a href="/" className="font-medium text-forest underline underline-offset-2">
                Back to GOONOMICS
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const next =
    step === 'about' ? (
      <Button onClick={() => go('goal')}>{name.trim() || age ? 'Continue' : 'Skip for now'}</Button>
    ) : step === 'goal' ? (
      <Button disabled={!goalValid} onClick={() => go('intention')}>
        Continue
      </Button>
    ) : (
      <Button disabled={length === 'custom' && !customValid} onClick={finish}>
        Enter Tarn
      </Button>
    )

  return (
    <div className="min-h-dvh bg-parchment">
      <div className="pt-safe mx-auto max-w-xl px-5 pt-4 pb-36 sm:px-6 lg:pt-12">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => go(index === 0 ? 'welcome' : STEPS[index - 1]!)} className="press -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-forest hover:bg-sage-soft">
            <ArrowLeft size={18} aria-hidden /> Back
          </button>
          <ol className="flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <li key={s} className={`h-1.5 w-8 rounded-full ${i <= index ? 'bg-forest' : 'bg-stone'}`} aria-hidden />
            ))}
          </ol>
        </div>

        {step === 'about' && (
          <section className="mt-8 animate-rise" aria-labelledby="ob-about">
            <h1 id="ob-about" className="serif text-[2rem] leading-tight text-ink">
              What should we call you?
            </h1>
            <div className="mt-6 space-y-6">
              <TextField label="Name or nickname (optional)" value={name} onChange={setName} max={40} placeholder="Only shown to you" />
              <div>
                <p id="ob-age" className="text-sm font-semibold text-ink">
                  Age range <span className="font-normal text-ink-soft">(optional)</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="ob-age">
                  {AGE_RANGES.map((a) => (
                    <Chip key={a.id} role="radio" selected={age === a.id} onClick={() => setAge(age === a.id ? null : a.id)}>
                      {a.label}
                    </Chip>
                  ))}
                </div>
                {handoff?.ageRange && <p className="mt-2 text-xs text-ink-soft">Filled in from GOONOMICS, as you asked. Change it or clear it.</p>}
              </div>
              {handoff?.goi != null && (
                <label className="flex items-start gap-3 rounded-2xl border border-stone bg-cream p-4 text-sm text-ink">
                  <input type="checkbox" checked={keepGoi} onChange={(e) => setKeepGoi(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-forest" />
                  <span>
                    Keep my GOONOMICS GOI ({handoff.goi}) as a note. <span className="text-ink-soft">It is an entertainment number, not a measure of anything.</span>
                  </span>
                </label>
              )}
              <p className="flex gap-3 rounded-2xl bg-sage-soft/70 p-4 text-sm leading-relaxed text-ink">
                <Lock size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden />
                <span>What you enter stays in this browser on this device. Nothing is uploaded, and there is no account. You can export or delete it in Profile.</span>
              </p>
            </div>
          </section>
        )}

        {step === 'goal' && (
          <section className="mt-8 animate-rise" aria-labelledby="ob-goal">
            <h1 id="ob-goal" className="serif text-[2rem] leading-tight text-ink">
              What would you like to change?
            </h1>
            <p className="mt-2 text-ink-soft">Choose what fits. Porn and masturbation are tracked separately.</p>
            <div role="radiogroup" aria-labelledby="ob-goal" className="mt-6 grid gap-2">
              {GOAL_CHOICES.map((c) => (
                <Choice key={c.id} selected={choice === c.id} onClick={() => pick(c.id)} title={c.title} />
              ))}
            </div>
            {drafts.length > 0 && (
              <div className="mt-5 space-y-4">
                {drafts.map((d, i) => (
                  <div key={i} className="space-y-4">
                    {d.kind === 'custom' && (
                      <>
                        <TextField label="Name your goal" value={d.label} onChange={(v) => patch(i, { label: v })} placeholder="For example: no scrolling in bed" max={60} />
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of goal">
                          <Chip role="radio" selected={d.mode === 'stop'} onClick={() => patch(i, { mode: 'stop', weeklyLimit: 0 })}>
                            Stop it
                          </Chip>
                          <Chip role="radio" selected={d.mode === 'reduce'} onClick={() => patch(i, { mode: 'reduce', weeklyLimit: Math.max(1, d.weeklyLimit || 2) })}>
                            Do it less
                          </Chip>
                        </div>
                      </>
                    )}
                    {d.mode === 'reduce' && <LimitStepper value={d.weeklyLimit} onChange={(v) => patch(i, { weeklyLimit: v })} />}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 'intention' && (
          <section className="mt-8 animate-rise" aria-labelledby="ob-intent">
            <h1 id="ob-intent" className="serif text-[2rem] leading-tight text-ink">
              Set an achievable intention
            </h1>
            <p id="ob-len" className="mt-6 text-sm font-semibold text-ink">
              First stretch
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="ob-len">
              {LENGTHS.map((o) => (
                <Chip key={o.label} role="radio" selected={length === o.days} onClick={() => setLength(o.days)}>
                  {o.label}
                </Chip>
              ))}
              <Chip role="radio" selected={length === 'custom'} onClick={() => setLength('custom')}>
                Custom
              </Chip>
            </div>
            {length === 'custom' && (
              <div className="mt-3 max-w-[12rem]">
                <TextField label="Days" value={customDays} onChange={(v) => setCustomDays(v.replace(/\D/g, ''))} inputMode="numeric" max={4} hint={customValid ? undefined : 'Enter 1 to 3650.'} />
              </div>
            )}
            <p className="mt-2 text-sm text-ink-soft">A personal planning period, not a medical timeline. You can extend it any time.</p>

            <p id="ob-daily" className="mt-8 text-sm font-semibold text-ink">
              One small thing for each day
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="ob-daily">
              {suggestions.map((s) => (
                <Chip key={s} role="radio" selected={intention === s} onClick={() => setIntention(s)}>
                  {s}
                </Chip>
              ))}
              <Chip role="radio" selected={intention === null} onClick={() => setIntention(null)}>
                Choose later
              </Chip>
            </div>
          </section>
        )}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone/70 bg-parchment/95">
        <div className="mx-auto flex max-w-xl justify-end px-5 pt-3 sm:px-6">{next}</div>
      </div>
    </div>
  )
}

export function LimitStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const v = Math.max(1, value)
  const id = useId()
  return (
    <div className="rounded-2xl border border-stone bg-cream p-4">
      <p id={id} className="text-sm font-semibold text-ink">
        Times in any 7 days that still fit your plan
      </p>
      <div className="mt-2 flex items-center gap-3" role="group" aria-labelledby={id}>
        <button type="button" aria-label="Fewer" disabled={v <= 1} onClick={() => onChange(v - 1)} className="press grid size-11 place-items-center rounded-full border border-stone bg-parchment text-forest disabled:opacity-40">
          <Minus size={18} aria-hidden />
        </button>
        <output className="serif w-10 text-center text-3xl text-ink tabular-nums" aria-live="polite">
          {v}
        </output>
        <button type="button" aria-label="More" disabled={v >= 14} onClick={() => onChange(v + 1)} className="press grid size-11 place-items-center rounded-full border border-stone bg-parchment text-forest disabled:opacity-40">
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </div>
  )
}

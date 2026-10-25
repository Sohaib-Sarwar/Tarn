import { ArrowLeft, Check, MessageCircle, Volume2, VolumeX, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Landscape, Wordmark } from '../components/Art'
import { SetbackSheet } from '../components/CheckIn'
import { useReducedMotion, useToast } from '../components/ui'
import { addFocus, addJournal, addMindful, logUrge, updateUrge } from '../lib/actions'
import { BODY_SPOTS, CALM_LINES, FEELINGS, NEXT_STEPS, TRIGGER_LABELS, TRIGGER_ORDER } from '../lib/catalog'
import type { BodySpot, Feeling, Trigger, UrgeTool } from '../lib/types'
import { navigate } from '../router'
import { useStore } from '../store'

type Stage = 'open' | 'breathe' | 'notice' | 'next' | 'step' | 'after' | 'done'
type StepId = UrgeTool | 'finish'

/**
 * Take a moment: a full screen, low light space for a difficult moment. It offers something useful
 * first (one minute of slow breathing), then one small next step, then an optional "how do you feel".
 * Nothing is required, every screen can be left, and nothing here promises an urge will vanish.
 */
export function Calm() {
  const { data, apply, today } = useStore()
  const [stage, setStage] = useState<Stage>('open')
  const [urgeId, setUrgeId] = useState<string | null>(null)
  const [spots, setSpots] = useState<BodySpot[]>([])
  const [step, setStep] = useState<StepId | null>(null)
  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [sound, setSound] = useState(false)
  const [setbackOpen, setSetbackOpen] = useState(false)
  const [toast, say] = useToast()
  const line = CALM_LINES[Number(today.slice(-1)) % CALM_LINES.length]!

  useAmbient(sound)

  /** One urge record per visit, created when the person starts doing something. */
  const ensureUrge = useCallback(
    (tool: UrgeTool) => {
      let id = urgeId
      apply((d) => {
        if (id) return updateUrge(d, id, { tool })
        const r = logUrge(d, { tool })
        id = r.id
        return r.data
      })
      setUrgeId(id)
      return id!
    },
    [apply, urgeId],
  )

  const exit = () => navigate(data.profile.onboarded ? 'today' : 'welcome')

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-dusk text-cream">
      {toast}
      <Landscape variant="dusk" className="pointer-events-none fixed inset-0 h-full w-full opacity-90" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-dusk/30 via-dusk/10 to-dusk/70" aria-hidden />

      <header className="pt-safe relative z-10 flex items-center justify-between px-4 pt-3 sm:px-6">
        <Wordmark tone="dark" size={22} />
        <div className="flex items-center gap-1">
          {(stage === 'breathe' || stage === 'open') && (
            <button
              type="button"
              onClick={() => setSound((s) => !s)}
              aria-pressed={sound}
              aria-label={sound ? 'Turn ambient sound off' : 'Turn ambient sound on'}
              className="press grid size-11 place-items-center rounded-full text-cream/80 hover:bg-cream/10 hover:text-cream"
            >
              {sound ? <Volume2 size={20} aria-hidden /> : <VolumeX size={20} aria-hidden />}
            </button>
          )}
          <button type="button" onClick={exit} className="press inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-cream/90 hover:bg-cream/10">
            <X size={18} aria-hidden /> Close
          </button>
        </div>
      </header>

      <main id="content" className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {stage === 'open' && (
          <Centered>
            <h1 className="serif text-[2.4rem] leading-[1.1] text-balance sm:text-5xl">{line}</h1>
            <p className="mt-4 text-lg text-cream/75">Start with one minute of slow breathing. Stop whenever you like.</p>
            <div className="mt-10 flex flex-col gap-3">
              <LightButton
                onClick={() => {
                  ensureUrge('breathe')
                  setStage('breathe')
                }}
              >
                START A ONE MINUTE RESET
              </LightButton>
              <GhostButton onClick={() => setStage('next')}>Other ways to reset</GhostButton>
            </div>
          </Centered>
        )}

        {stage === 'breathe' && (
          <Breathe
            onEnd={(seconds) => {
              if (seconds > 0) apply((d) => addMindful(d, { date: today, kind: 'breath', seconds }))
              setStage('notice')
            }}
          />
        )}

        {stage === 'notice' && (
          <Centered>
            <h1 className="serif text-4xl leading-tight">Notice the urge.</h1>
            <p className="mt-3 text-lg text-cream/80">Where do you feel it right now?</p>
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Where you feel it">
              {BODY_SPOTS.map((s) => (
                <DarkChip key={s.id} selected={spots.includes(s.id)} onClick={() => setSpots((xs) => (xs.includes(s.id) ? xs.filter((x) => x !== s.id) : [...xs, s.id]))}>
                  {s.label}
                </DarkChip>
              ))}
            </div>
            <p className="mt-6 text-cream/70">It can rise and fall without you acting on it. Just notice it for a few breaths.</p>
            <div className="mt-10 flex flex-col gap-3">
              <LightButton
                onClick={() => {
                  if (urgeId) apply((d) => updateUrge(d, urgeId, { spots }))
                  setStage('next')
                }}
              >
                Continue
              </LightButton>
            </div>
          </Centered>
        )}

        {stage === 'next' && (
          <div className="my-auto py-6">
            <h1 className="serif text-4xl leading-tight">What would help next?</h1>
            <p className="mt-2 text-cream/75">Pick one. You can stop at any time.</p>
            <ul className="mt-6 space-y-2">
              {NEXT_STEPS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id === 'finish') {
                        if (!urgeId) ensureUrge('breathe')
                        setStage('after')
                        return
                      }
                      ensureUrge(s.id)
                      setStep(s.id)
                      setStage('step')
                    }}
                    className={`press flex min-h-14 w-full items-center rounded-2xl px-5 text-left text-[1.02rem] font-medium ${s.id === 'finish' ? 'text-cream/80 hover:bg-cream/10' : 'bg-cream/10 text-cream ring-1 ring-cream/15 hover:bg-cream/15'}`}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === 'step' && step && step !== 'finish' && (
          <StepPanel step={step} onBack={() => setStage('next')} onDone={() => setStage('after')} urgeId={urgeId} />
        )}

        {stage === 'after' && (
          <Centered>
            <h1 className="serif text-4xl leading-tight">Feeling any different?</h1>
            <div className="mt-6 grid gap-2" role="radiogroup" aria-label="How you feel now">
              {FEELINGS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={feeling === f.id}
                  onClick={() => setFeeling(f.id)}
                  className={`press flex min-h-14 items-center justify-between rounded-2xl px-5 text-left text-[1.02rem] font-medium ${feeling === f.id ? 'bg-cream text-forest' : 'bg-cream/10 text-cream ring-1 ring-cream/15 hover:bg-cream/15'}`}
                >
                  {f.label}
                  {feeling === f.id && <Check size={18} aria-hidden />}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-cream/60">Optional. Saved only on this device, so you can see what helps you.</p>
            <div className="mt-8 flex flex-col gap-3">
              <LightButton
                onClick={() => {
                  if (urgeId && feeling) apply((d) => updateUrge(d, urgeId, { feeling }))
                  setStage('done')
                }}
              >
                {feeling ? 'Save' : 'Skip'}
              </LightButton>
            </div>
          </Centered>
        )}

        {stage === 'done' && (
          <Centered>
            {feeling === 'difficult' ? (
              <>
                <h1 className="serif text-4xl leading-tight">That is okay.</h1>
                <p className="mt-3 text-lg text-cream/80">Some moments take longer. Still feeling it does not mean anything went wrong.</p>
                <div className="mt-8 flex flex-col gap-3">
                  <LightButton onClick={() => setStage('breathe')}>Another minute of breathing</LightButton>
                  {data.profile.contact && <ContactLink />}
                  <GhostButton onClick={() => setStage('next')}>Try something else</GhostButton>
                  {data.goals.length > 0 && <GhostButton onClick={() => setSetbackOpen(true)}>Log something privately</GhostButton>}
                  <GhostButton onClick={exit}>Back to today</GhostButton>
                </div>
              </>
            ) : (
              <>
                <h1 className="serif text-4xl leading-tight">Showing up counts.</h1>
                <p className="mt-3 text-lg text-cream/80">You paused instead of running on autopilot. That is the practice.</p>
                <div className="mt-8 flex flex-col gap-3">
                  <LightButton onClick={exit}>Back to today</LightButton>
                </div>
              </>
            )}
          </Centered>
        )}
      </main>
      <SetbackSheet open={setbackOpen} onClose={() => setSetbackOpen(false)} date={today} onSaved={say} />
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="my-auto animate-rise py-8">{children}</div>
}

function LightButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press min-h-14 rounded-full bg-cream px-6 text-[0.98rem] font-semibold tracking-wide text-forest hover:bg-white">
      {children}
    </button>
  )
}

function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press min-h-12 rounded-full px-6 text-[0.95rem] font-medium text-cream/85 hover:bg-cream/10">
      {children}
    </button>
  )
}

function DarkChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`press min-h-11 rounded-full px-4 text-sm font-medium ${selected ? 'bg-cream text-forest' : 'bg-cream/10 text-cream ring-1 ring-cream/20 hover:bg-cream/15'}`}
    >
      {children}
    </button>
  )
}

const PACES = {
  slower: { label: 'Slower', inhale: 5, exhale: 7 },
  steady: { label: 'Steady', inhale: 4, exhale: 6 },
  quicker: { label: 'Quicker', inhale: 3, exhale: 5 },
} as const
type Pace = keyof typeof PACES
const LENGTHS = [
  { s: 30, label: '30 sec' },
  { s: 60, label: '1 min' },
  { s: 120, label: '2 min' },
]

/** In and out only, with a longer out breath. No holds. Pace and length change at any time. */
function Breathe({ onEnd }: { onEnd: (seconds: number) => void }) {
  const [pace, setPace] = useState<Pace>('steady')
  const [length, setLength] = useState(60)
  const [now, setNow] = useState(() => Date.now())
  const startedAt = useRef(Date.now())
  const ended = useRef(false)
  const reduced = useReducedMotion()
  const elapsed = (now - startedAt.current) / 1000

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  const finish = useCallback(
    (seconds: number) => {
      if (ended.current) return
      ended.current = true
      onEnd(Math.round(seconds))
    },
    [onEnd],
  )

  useEffect(() => {
    if (elapsed >= length) finish(length)
  }, [elapsed, length, finish])

  const p = PACES[pace]
  const cycle = p.inhale + p.exhale
  const t = elapsed % cycle
  const inhaling = t < p.inhale
  const phaseLeft = Math.ceil(inhaling ? p.inhale - t : cycle - t)
  const left = Math.max(0, Math.ceil(length - elapsed))

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
      <div className="relative grid size-[min(72vw,18rem)] place-items-center" aria-hidden>
        <div className="absolute inset-0 rounded-full ring-1 ring-cream/15" />
        <div className="absolute inset-[12%] rounded-full ring-1 ring-cream/10" />
        <div
          className="size-full rounded-full bg-gradient-to-br from-sage/70 to-moss/50 shadow-[0_0_80px_-10px_rgba(167,185,154,0.55)]"
          style={
            reduced
              ? { transform: 'scale(0.8)', opacity: inhaling ? 0.95 : 0.55, transition: `opacity ${inhaling ? p.inhale : p.exhale}s ease-in-out` }
              : { transform: `scale(${inhaling ? 1 : 0.55})`, transition: `transform ${inhaling ? p.inhale : p.exhale}s ease-in-out` }
          }
        />
      </div>
      <p className="serif mt-8 text-4xl" aria-live="polite">
        {inhaling ? 'Breathe in' : 'Breathe out'}
      </p>
      <p className="mt-1 text-cream/70 tabular-nums" aria-hidden>
        {phaseLeft}
      </p>
      <p className="mt-4 text-sm text-cream/60 tabular-nums">{left} seconds left. Breathe comfortably; skip a cue whenever you need to.</p>

      <div className="mt-6 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Pace">
        {(Object.keys(PACES) as Pace[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={pace === k} onClick={() => setPace(k)} className={`press min-h-11 rounded-full px-4 text-sm font-medium ${pace === k ? 'bg-cream/90 text-forest' : 'text-cream/75 ring-1 ring-cream/20 hover:bg-cream/10'}`}>
            {PACES[k].label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Length">
        {LENGTHS.map((l) => (
          <button key={l.s} type="button" role="radio" aria-checked={length === l.s} onClick={() => setLength(l.s)} className={`press min-h-11 rounded-full px-4 text-sm font-medium ${length === l.s ? 'bg-cream/90 text-forest' : 'text-cream/75 ring-1 ring-cream/20 hover:bg-cream/10'}`}>
            {l.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => finish(elapsed)} className="press mt-8 min-h-14 w-full max-w-xs rounded-full bg-cream/15 px-6 font-semibold text-cream ring-1 ring-cream/30 hover:bg-cream/25">
        End breathing
      </button>
    </div>
  )
}

function StepPanel({ step, onBack, onDone, urgeId }: { step: UrgeTool; onBack: () => void; onDone: () => void; urgeId: string | null }) {
  const { data, apply, today } = useStore()
  const meta = NEXT_STEPS.find((s) => s.id === step)!
  const [task, setTask] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (startedAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const minutes = startedAt ? Math.floor((now - startedAt) / 60000) : 0
  const seconds = startedAt ? Math.floor(((now - startedAt) / 1000) % 60) : 0

  const done = () => {
    if (step === 'focus' && startedAt) apply((d) => addFocus(d, { date: today, minutes: Math.max(1, Math.ceil((Date.now() - startedAt) / 60000)), task, completed: true }))
    if (step === 'write') {
      if (urgeId && triggers.length) apply((d) => updateUrge(d, urgeId, { triggers }))
      if (note.trim()) apply((d) => addJournal(d, { date: today, kind: 'entry', mood: null, stress: null, sleep: null, focus: null, urge: null, text: note, helped: '' }))
    }
    onDone()
  }

  const intention = data.profile.routines[0]?.label
  return (
    <div className="my-auto animate-rise py-6">
      <button type="button" onClick={onBack} className="press -ml-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-cream/80 hover:bg-cream/10">
        <ArrowLeft size={18} aria-hidden /> Other options
      </button>
      <h1 className="serif mt-2 text-4xl leading-tight">{meta.title}</h1>

      {meta.guide.length > 0 && (
        <ol className="mt-6 space-y-4">
          {meta.guide.map((g, i) => (
            <li key={i} className="flex gap-4 text-lg leading-snug text-cream/90">
              <span className="serif grid size-9 shrink-0 place-items-center rounded-full bg-cream/12 ring-1 ring-cream/20">{i + 1}</span>
              <span className="pt-1">{g}</span>
            </li>
          ))}
        </ol>
      )}

      {step === 'focus' && (
        <div className="mt-6">
          {startedAt === null ? (
            <>
              <label htmlFor="calm-task" className="text-sm font-semibold text-cream/85">
                One small task
              </label>
              <input
                id="calm-task"
                value={task}
                maxLength={140}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Tidy the desk, reply to one message"
                className="mt-2 block h-12 w-full rounded-2xl bg-cream/10 px-4 text-cream ring-1 ring-cream/20 placeholder:text-cream/45 focus:ring-cream/60 focus:outline-none"
              />
              <div className="mt-4">
                <LightButton onClick={() => setStartedAt(Date.now())}>Start</LightButton>
              </div>
            </>
          ) : (
            <p className="text-lg text-cream/85" role="timer">
              {task ? `${task}. ` : ''}You have been at it {minutes}:{String(seconds).padStart(2, '0')}.
            </p>
          )}
        </div>
      )}

      {step === 'write' && (
        <div className="mt-6">
          <p className="text-cream/80">What was happening just before? Optional.</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="What was happening">
            {TRIGGER_ORDER.map((t) => (
              <DarkChip
                key={t}
                selected={triggers.includes(t)}
                onClick={() => setTriggers((ts) => (t === 'private' ? (ts.includes('private') ? [] : ['private']) : ts.includes(t) ? ts.filter((x) => x !== t) : [...ts.filter((x) => x !== 'private'), t]))}
              >
                {TRIGGER_LABELS[t]}
              </DarkChip>
            ))}
          </div>
          <label htmlFor="calm-note" className="mt-5 block text-sm font-semibold text-cream/85">
            A few words (optional)
          </label>
          <textarea
            id="calm-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 block w-full rounded-2xl bg-cream/10 px-4 py-3 text-cream ring-1 ring-cream/20 focus:ring-cream/60 focus:outline-none"
          />
        </div>
      )}

      {step === 'reason' && (
        <div className="mt-6 space-y-4">
          {data.profile.reason && <blockquote className="serif rounded-3xl bg-cream/10 px-6 py-6 text-2xl leading-snug italic ring-1 ring-cream/15">“{data.profile.reason}”</blockquote>}
          {intention && (
            <p className="text-lg text-cream/85">
              Today’s intention: <span className="serif text-xl text-cream">{intention}</span>
            </p>
          )}
          {!data.profile.reason && !intention && <p className="text-lg text-cream/80">Think of one reason this matters to you. You can save it in Profile so it is here next time.</p>}
        </div>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <LightButton onClick={done}>{step === 'write' ? 'Save and continue' : 'Done'}</LightButton>
      </div>
    </div>
  )
}

function ContactLink() {
  const { data } = useStore()
  const c = data.profile.contact!
  const message = 'Hey, are you free to talk for a few minutes?'
  const isEmail = c.address.includes('@')
  const href = isEmail ? `mailto:${encodeURIComponent(c.address)}?body=${encodeURIComponent(message)}` : `sms:${c.address.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(message)}`
  return (
    <a href={href} className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-medium text-cream ring-1 ring-cream/30 hover:bg-cream/10">
      <MessageCircle size={18} aria-hidden /> Message {c.name || 'someone you trust'}
    </a>
  )
}

/** Optional soft brown noise, made in the browser. Off by default, never autoplayed. */
function useAmbient(on: boolean) {
  useEffect(() => {
    if (!on) return
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    let ctx: AudioContext
    try {
      ctx = new Ctx()
    } catch {
      return
    }
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
    const ch = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < ch.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      ch[i] = last * 3.2
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 700
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2)
    src.connect(filter).connect(gain).connect(ctx.destination)
    src.start()
    return () => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
        window.setTimeout(() => ctx.close().catch(() => undefined), 400)
      } catch {
        ctx.close().catch(() => undefined)
      }
    }
  }, [on])
}

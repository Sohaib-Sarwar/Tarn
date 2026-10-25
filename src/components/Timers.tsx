import { useEffect, useRef, useState } from 'react'
import { Button, Chip, useReducedMotion } from './ui'

/** Elapsed seconds while running, based on timestamps so a backgrounded tab stays accurate. */
function useElapsed(running: boolean): number {
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(null)
  const carried = useRef(0)
  useEffect(() => {
    if (!running) {
      if (startedAt.current !== null) carried.current += (Date.now() - startedAt.current) / 1000
      startedAt.current = null
      return
    }
    startedAt.current = Date.now()
    const id = window.setInterval(() => setElapsed(carried.current + (Date.now() - startedAt.current!) / 1000), 200)
    return () => window.clearInterval(id)
  }, [running])
  return elapsed
}

const fmt = (s: number) => {
  const v = Math.max(0, Math.ceil(s))
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`
}

const LENGTHS: Record<number, string> = { 30: '30 seconds', 60: '1 minute', 90: '90 seconds', 120: '2 minutes' }

const PATTERNS = {
  calm: { label: 'Calm: in 4, out 6', phases: [['Breathe in', 4], ['Breathe out', 6]] as [string, number][] },
  box: { label: 'Box: 4 in, 4 hold, 4 out, 4 hold', phases: [['Breathe in', 4], ['Hold', 4], ['Breathe out', 4], ['Hold', 4]] as [string, number][] },
}

/**
 * Optional guided breathing, 30 to 120 seconds. It can be stopped at any time. It is offered as a
 * way to slow down, not as a treatment.
 */
export function BreathingTimer({ onFinish }: { onFinish: (seconds: number, completed: boolean) => void }) {
  const [duration, setDuration] = useState(60)
  const [pattern, setPattern] = useState<keyof typeof PATTERNS>('calm')
  const [running, setRunning] = useState(false)
  const elapsed = useElapsed(running)
  const reduced = useReducedMotion()
  const finished = useRef(false)

  useEffect(() => {
    if (running && elapsed >= duration && !finished.current) {
      finished.current = true
      setRunning(false)
      onFinish(duration, true)
    }
  }, [running, elapsed, duration, onFinish])

  const phases = PATTERNS[pattern].phases
  const cycle = phases.reduce((a, [, s]) => a + s, 0)
  let t = elapsed % cycle
  let phase = phases[0]!
  for (const p of phases) {
    if (t < p[1]) {
      phase = p
      break
    }
    t -= p[1]
  }
  const within = Math.min(1, t / phase[1])
  const [name] = phase
  const scale = !running ? 0.7 : name === 'Breathe in' ? 0.6 + 0.4 * within : name === 'Breathe out' ? 1 - 0.4 * within : phase === phases[1] ? 1 : 0.6

  if (!running && elapsed === 0) {
    return (
      <div>
        <p id="br-len" className="text-sm font-semibold text-ink">
          How long?
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="br-len">
          {[30, 60, 90, 120].map((s) => (
            <Chip key={s} selected={duration === s} onClick={() => setDuration(s)}>
              {LENGTHS[s]}
            </Chip>
          ))}
        </div>
        <p id="br-pat" className="mt-4 text-sm font-semibold text-ink">
          Rhythm
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="br-pat">
          {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((k) => (
            <Chip key={k} selected={pattern === k} onClick={() => setPattern(k)}>
              {PATTERNS[k].label}
            </Chip>
          ))}
        </div>
        <Button size="lg" className="mt-6" onClick={() => setRunning(true)}>
          Start breathing
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative grid size-64 max-w-full place-items-center sm:size-72" aria-hidden>
        <div className="absolute inset-0 rounded-full border border-sage/50" />
        <div className="absolute inset-6 rounded-full border border-sage/40" />
        <div
          className="size-full rounded-full bg-sage-soft"
          style={{ transform: `scale(${reduced ? 0.8 : scale})`, transition: reduced ? 'none' : 'transform 0.2s linear', opacity: reduced ? 0.6 + 0.4 * (name === 'Breathe in' ? within : 1 - within) : 1 }}
        />
        <div className="absolute grid place-items-center">
          <div className="size-10 rounded-full bg-forest/85" />
        </div>
      </div>
      <p className="serif mt-6 text-3xl text-ink" aria-live="polite">
        {name}
      </p>
      <p className="mt-1 text-sm text-ink-soft tabular-nums">{fmt(duration - elapsed)} left</p>
      <div className="mt-6 flex gap-2">
        <Button tone="quiet" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            finished.current = true
            setRunning(false)
            onFinish(Math.round(elapsed), false)
          }}
        >
          Stop
        </Button>
      </div>
    </div>
  )
}

/** A plain countdown with a quiet progress ring. */
export function Countdown({ seconds, title, onDone, onStop, autoStart = true }: { seconds: number; title: string; onDone: () => void; onStop: (elapsed: number) => void; autoStart?: boolean }) {
  const [running, setRunning] = useState(autoStart)
  const elapsed = useElapsed(running)
  const done = useRef(false)
  useEffect(() => {
    if (running && elapsed >= seconds && !done.current) {
      done.current = true
      setRunning(false)
      onDone()
    }
  }, [running, elapsed, seconds, onDone])
  const p = Math.min(1, elapsed / seconds)
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative grid size-56 place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="#faf8f2" stroke="#e3e9dc" strokeWidth="5" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="#244b3a" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 60 60)" />
        </svg>
        <div className="relative">
          <p className="serif text-5xl text-ink tabular-nums" role="timer" aria-label={`${title}, ${fmt(seconds - elapsed)} left`}>
            {fmt(seconds - elapsed)}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{title}</p>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Button tone="quiet" onClick={() => setRunning((x) => !x)}>
          {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
        </Button>
        <Button
          tone="ghost"
          onClick={() => {
            done.current = true
            setRunning(false)
            onStop(Math.round(elapsed))
          }}
        >
          Stop
        </Button>
      </div>
    </div>
  )
}

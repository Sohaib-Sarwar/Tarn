import { Check, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addEvent, removeCheckIn, setCheckIn } from '../lib/actions'
import { CHECKIN_CHOICES, MOODS, RESET_LINES } from '../lib/catalog'
import { isDayKey, longDate } from '../lib/dates'
import type { CheckInStatus, DayKey } from '../lib/types'
import { useStore } from '../store'
import { Button, Choice, H2, Muted, Sheet, TextArea, TextField } from './ui'

/** The ten second daily check in. Editing replaces the day's entry; nothing is ever inferred. */
export function CheckInCard({ date, onSaved, compact = false }: { date: DayKey; onSaved?: (msg: string) => void; compact?: boolean }) {
  const { data, apply, today } = useStore()
  const existing = data.checkins.find((c) => c.date === date)
  const [editing, setEditing] = useState(!existing)
  const [status, setStatus] = useState<CheckInStatus | null>(existing?.status ?? null)
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null)
  const [note, setNote] = useState(existing?.note ?? '')
  const [showNote, setShowNote] = useState(!!existing?.note)
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    setEditing(!existing)
    setStatus(existing?.status ?? null)
    setMood(existing?.mood ?? null)
    setNote(existing?.note ?? '')
  }, [existing, date])

  const save = () => {
    if (!status) return
    apply((d) => setCheckIn(d, date, { status, mood, note }))
    setEditing(false)
    if (status === 'reset') setResetOpen(true)
    else onSaved?.(status === 'skip' ? 'Noted. Nothing is marked for today.' : 'Checked in. Today counts.')
  }

  const label = date === today ? 'How did today go?' : `How did ${longDate(date)} go?`

  if (!editing && existing) {
    const choice = CHECKIN_CHOICES.find((c) => c.id === existing.status)!
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-moss">{date === today ? 'Today’s check in' : longDate(date)}</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-ink">
              <Check size={18} className="shrink-0 text-forest" aria-hidden />
              {choice.label}
            </p>
            {existing.mood !== null && <p className="mt-1 text-sm text-ink-soft">Mood: {MOODS[existing.mood - 1]}</p>}
            {existing.note && <p className="mt-1 text-sm text-ink-soft">“{existing.note}”</p>}
          </div>
          <Button tone="quiet" size="sm" onClick={() => setEditing(true)} aria-label="Edit check in">
            <Pencil size={14} aria-hidden /> Edit
          </Button>
        </div>
        {existing.status === 'reset' && (
          <Button tone="ghost" size="sm" className="mt-3 -ml-3" onClick={() => setResetOpen(true)}>
            Log which goal had a setback
          </Button>
        )}
        <SetbackSheet open={resetOpen} onClose={() => setResetOpen(false)} date={date} onSaved={onSaved} />
      </div>
    )
  }

  return (
    <div>
      {!compact && <H2 id={`ci-${date}`}>{label}</H2>}
      <div role="radiogroup" aria-label={label} className="mt-4 grid gap-2">
        {CHECKIN_CHOICES.map((c) => (
          <Choice key={c.id} selected={status === c.id} onClick={() => setStatus(c.id)} title={c.label} detail={status === c.id ? c.detail : undefined} />
        ))}
      </div>
      {status && status !== 'skip' && (
        <div className="mt-4">
          <p id={`mood-${date}`} className="text-sm font-semibold text-ink">
            Mood <span className="font-normal text-ink-soft">(optional)</span>
          </p>
          <div role="radiogroup" aria-labelledby={`mood-${date}`} className="mt-2 grid grid-cols-5 gap-1.5">
            {MOODS.map((m, i) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mood === i + 1}
                onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                className={`press min-h-10 rounded-xl border px-1 text-xs font-medium sm:text-sm ${mood === i + 1 ? 'border-forest bg-forest text-cream' : 'border-stone bg-cream text-ink hover:border-moss'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
      {status && (showNote ? (
        <div className="mt-4">
          <TextArea label="Note (optional)" value={note} onChange={setNote} rows={2} />
        </div>
      ) : (
        <button type="button" className="mt-3 text-sm font-semibold text-forest underline-offset-2 hover:underline" onClick={() => setShowNote(true)}>
          Add a note
        </button>
      ))}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button disabled={!status} onClick={save}>
          Save check in
        </Button>
        {existing && (
          <>
            <Button tone="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              tone="ghost"
              onClick={() => {
                apply((d) => removeCheckIn(d, date))
                onSaved?.('Check in removed.')
              }}
            >
              Remove
            </Button>
          </>
        )}
      </div>
      <SetbackSheet open={resetOpen} onClose={() => setResetOpen(false)} date={date} onSaved={onSaved} />
    </div>
  )
}

/** Logs a setback for the goals the user picks. Nothing is selected for them when there is more than one goal. */
export function SetbackSheet({ open, onClose, date, onSaved }: { open: boolean; onClose: () => void; date: DayKey; onSaved?: (msg: string) => void }) {
  const { data, apply, today } = useStore()
  const goals = data.goals.filter((g) => !g.archived)
  const [picked, setPicked] = useState<string[]>([])
  const [day, setDay] = useState(date)
  const [note, setNote] = useState('')
  const [reflection, setReflection] = useState('')

  useEffect(() => {
    if (open) {
      setPicked(goals.length === 1 ? [goals[0]!.id] : [])
      setDay(date)
      setNote('')
      setReflection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date])

  const valid = picked.length > 0 && isDayKey(day) && day <= today
  const save = () => {
    if (!valid) return
    apply((d) => picked.reduce((acc, id) => addEvent(acc, id, day, note, reflection), d))
    onClose()
    onSaved?.(RESET_LINES[(data.events.length + 1) % RESET_LINES.length]!)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a setback"
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button disabled={!valid} onClick={save}>
            Save
          </Button>
        </div>
      }
    >
      <Muted>That was one difficult moment. Your progress is still here: longest streak, total days and badges all stay.</Muted>
      <p id="sb-goals" className="mt-5 text-sm font-semibold text-ink">
        Which goal?
      </p>
      <div role="group" aria-labelledby="sb-goals" className="mt-2 grid gap-2">
        {goals.map((g) => (
          <Choice
            key={g.id}
            role="checkbox"
            selected={picked.includes(g.id)}
            onClick={() => setPicked((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))}
            title={g.label}
            detail={g.mode === 'reduce' ? `Counts as one time. Over ${g.weeklyLimit} in 7 days restarts the counter.` : 'Restarts this counter only.'}
          />
        ))}
      </div>
      <div className="mt-5 max-w-xs">
        <TextField label="Day" type="date" value={day} onChange={setDay} hint={isDayKey(day) && day <= today ? longDate(day) : 'Pick a day that is not in the future.'} />
      </div>
      <div className="mt-5 space-y-4">
        <TextArea label="What was going on? (optional)" value={note} onChange={setNote} rows={2} />
        <TextArea label="What would you try differently next time? (optional)" value={reflection} onChange={setReflection} rows={2} placeholder="Reset the counter. Keep the lesson." />
      </div>
    </Sheet>
  )
}

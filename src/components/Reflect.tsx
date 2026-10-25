import { ExternalLink, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Sprig } from './Art'
import { Button, Card, H2, Muted, Scale, Sheet, Stat, TextArea, TextField, useToast } from './ui'
import { addJournal, removeJournal } from '../lib/actions'
import { CRISIS, PROMPTS, REAL_TALK, TRIGGER_LABELS } from '../lib/catalog'
import { addDays, shortDate } from '../lib/dates'
import { MIN_URGES, personalInsights, weekSummary } from '../lib/insights'
import type { JournalEntry, Trigger } from '../lib/types'
import { useStore } from '../store'

function average(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

export function Patterns() {
  const { data, today } = useStore()
  const insights = useMemo(() => personalInsights(data, today), [data, today])
  const w = weekSummary(data, today)
  const triggerCounts = useMemo(() => {
    const m = new Map<Trigger, number>()
    for (const u of data.urges) for (const t of u.triggers) if (t !== 'private') m.set(t, (m.get(t) ?? 0) + 1)
    return [...m].sort((a, b) => b[1] - a[1])
  }, [data.urges])

  const trends = (['mood', 'sleep', 'focus', 'stress'] as const)
    .map((k) => {
      const inRange = (from: string) => data.journal.filter((j) => j.date >= from && j.date <= today && typeof j[k] === 'number').map((j) => j[k] as number)
      const w7 = inRange(addDays(today, -6))
      const w30 = inRange(addDays(today, -29))
      return { k, w7: w7.length >= 3 ? average(w7) : null, n7: w7.length, w30: w30.length >= 5 ? average(w30) : null, n30: w30.length }
    })
    .filter((t) => t.w7 !== null || t.w30 !== null)

  return (
    <div className="space-y-6">
      <Card>
        <H2>The last 7 days</H2>
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          <Stat value={w.checkins} label="Check ins" />
          <Stat value={w.urgesLogged} label="Urges logged" />
          <Stat value={w.urgesWorkedThrough} label="Worked through" />
          <Stat value={w.routinesDone} label="Routines done" />
          <Stat value={w.focusMinutes} label="Focus minutes" />
          <Stat value={w.mindfulMinutes} label="Mindful minutes" />
        </div>
      </Card>

      <Card>
        <H2>Your patterns</H2>
        {insights.length === 0 ? (
          <div className="mt-3 flex gap-5">
            <div className="min-w-0">
              <Muted>Not enough entries yet to say anything honest. Patterns appear after about {MIN_URGES} logged urges, or a week or two of journal ratings.</Muted>
              <Muted className="mt-2 text-sm">Nothing here is guessed. Every pattern shows the numbers behind it.</Muted>
            </div>
            <Sprig className="hidden h-28 w-20 shrink-0 text-sage sm:block" />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {insights.map((i) => (
              <li key={i.id} className="rounded-2xl bg-sage-soft/60 px-4 py-3.5">
                <p className="serif text-lg leading-snug text-ink">{i.text}</p>
                <p className="mt-1 text-sm text-ink-soft">{i.basis}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          These are patterns in what you reported, not proof that one thing causes another, and not a diagnosis of anything.
        </p>
      </Card>

      {(trends.length > 0 || triggerCounts.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {trends.length > 0 && (
            <Card>
              <H2>Self ratings</H2>
              <Muted className="mt-1 text-sm">Averages of your journal ratings, 1 to 5. Shown once there are enough.</Muted>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="text-ink-soft">
                    <th className="py-1.5 font-medium">Rating</th>
                    <th className="py-1.5 font-medium">7 days</th>
                    <th className="py-1.5 font-medium">30 days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone">
                  {trends.map((t) => (
                    <tr key={t.k}>
                      <td className="py-2 font-medium text-ink capitalize">{t.k}</td>
                      <td className="py-2 tabular-nums">{t.w7 !== null ? `${t.w7.toFixed(1)} (${t.n7})` : 'Not enough yet'}</td>
                      <td className="py-2 tabular-nums">{t.w30 !== null ? `${t.w30.toFixed(1)} (${t.n30})` : 'Not enough yet'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {triggerCounts.length > 0 && (
            <Card>
              <H2>Triggers you named</H2>
              <ul className="mt-4 space-y-2.5">
                {triggerCounts.map(([t, n]) => (
                  <li key={t}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink">{TRIGGER_LABELS[t]}</span>
                      <span className="text-ink-soft tabular-nums">{n}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-soft" aria-hidden>
                      <div className="h-full rounded-full bg-moss" style={{ width: `${(n / triggerCounts[0]![1]) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

const KIND_TITLE: Record<JournalEntry['kind'], string> = { entry: 'Journal', morning: PROMPTS.morning.title, evening: PROMPTS.evening.title, weekly: PROMPTS.weekly.title }

export function Journal() {
  const { data, apply, today } = useStore()
  const [toast, say] = useToast()
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const entries = [...data.journal].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  return (
    <div className="space-y-6">
      {toast}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <H2>Private journal</H2>
            <Muted className="mt-1 text-sm">Stays on this device. Never sent to any service, including AI.</Muted>
          </div>
          <Button onClick={() => setOpen(true)}>New entry</Button>
        </div>
      </Card>
      {entries.length === 0 ? (
        <Muted className="px-1">No entries yet. A few words about sleep, stress or what helped is plenty.</Muted>
      ) : (
        <ul className="space-y-3">
          {entries.map((j) => (
            <li key={j.id}>
              <Card as="article" className="!p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-moss">
                      {shortDate(j.date)} · {KIND_TITLE[j.kind]}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {(['mood', 'stress', 'sleep', 'focus', 'urge'] as const)
                        .filter((k) => j[k] !== null)
                        .map((k) => `${k[0]!.toUpperCase()}${k.slice(1)} ${j[k]}/5`)
                        .join(', ')}
                    </p>
                  </div>
                  <Button tone="ghost" size="sm" aria-label={`Delete entry from ${shortDate(j.date)}`} onClick={() => setConfirmId(j.id)}>
                    <Trash2 size={15} aria-hidden />
                  </Button>
                </div>
                {j.text && <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink">{j.text}</p>}
                {j.helped && <p className="mt-2 text-sm text-forest">What helped: {j.helped}</p>}
              </Card>
            </li>
          ))}
        </ul>
      )}
      <JournalSheet
        open={open}
        onClose={() => setOpen(false)}
        onSave={(e) => {
          apply((d) => addJournal(d, { ...e, date: today, kind: 'entry' }))
          say('Saved.')
        }}
      />
      <Sheet
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete this entry?"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ghost" onClick={() => setConfirmId(null)}>
              Keep it
            </Button>
            <Button tone="danger" onClick={() => (apply((d) => removeJournal(d, confirmId!)), setConfirmId(null), say('Deleted.'))}>
              Delete
            </Button>
          </div>
        }
      >
        <Muted>It is removed from this device. This cannot be undone unless you have an export.</Muted>
      </Sheet>
    </div>
  )
}

type Ratings = Pick<JournalEntry, 'mood' | 'stress' | 'sleep' | 'focus' | 'urge' | 'text' | 'helped'>

function JournalSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (e: Ratings) => void }) {
  const blank: Ratings = { mood: null, stress: null, sleep: null, focus: null, urge: null, text: '', helped: '' }
  const [e, setE] = useState<Ratings>(blank)
  const set = (p: Partial<Ratings>) => setE((x) => ({ ...x, ...p }))
  const empty = Object.values(e).every((v) => v === null || v === '')
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New entry"
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={empty} onClick={() => (onSave(e), setE(blank), onClose())}>
            Save entry
          </Button>
        </div>
      }
    >
      <Muted className="text-sm">Every field is optional.</Muted>
      <div className="mt-4 space-y-5">
        <Scale label="Mood" value={e.mood} onChange={(v) => set({ mood: v })} low="Heavy" high="Bright" />
        <Scale label="Stress" value={e.stress} onChange={(v) => set({ stress: v })} low="Calm" high="Very stressed" />
        <Scale label="Sleep quality" value={e.sleep} onChange={(v) => set({ sleep: v })} low="Poor" high="Great" />
        <Scale label="Focus" value={e.focus} onChange={(v) => set({ focus: v })} low="Scattered" high="Clear" />
        <Scale label="Urge intensity today" value={e.urge} onChange={(v) => set({ urge: v })} low="None" high="Very strong" />
        <TextArea label="Notes" value={e.text} onChange={(v) => set({ text: v })} rows={4} max={4000} placeholder="Progress, triggers, a setback, anything." />
        <TextField label="What helped?" value={e.helped} onChange={(v) => set({ helped: v })} max={280} />
      </div>
    </Sheet>
  )
}

export function RealTalk() {
  return (
    <div className="space-y-8">
      {REAL_TALK.map((section) => (
        <section key={section.id} aria-labelledby={`rt-${section.id}`}>
          <H2 id={`rt-${section.id}`} className="!text-2xl">
            {section.title}
          </H2>
          <Muted className="mt-1 text-sm">{section.intro}</Muted>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {section.cards.map((c) => (
              <li key={c.id}>
                <Card as="article" className={`h-full !p-5 ${section.id === 'beliefs' ? '!bg-stone-soft/60' : ''}`}>
                  <h3 className="serif text-lg leading-snug text-ink">{c.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{c.body}</p>
                  {c.sources.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {c.sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-forest underline-offset-2 hover:underline">
                            {s.label} <ExternalLink size={13} aria-hidden />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Card className="!border-clay/30">
        <H2>{CRISIS.title}</H2>
        <Muted className="mt-2">{CRISIS.body}</Muted>
        <a href={CRISIS.source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-forest underline">
          {CRISIS.source.label} <ExternalLink size={13} aria-hidden />
        </a>
      </Card>
    </div>
  )
}

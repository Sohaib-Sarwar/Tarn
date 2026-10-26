import { Lock, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Sprig } from '../components/Art'
import { Button, Chip, Muted, Scale, Sheet, TextArea, TextField, useToast } from '../components/ui'
import { addJournal, addMindful, removeJournal } from '../lib/actions'
import { MOODS, PROMPTS } from '../lib/catalog'
import { longDate, monthLabel } from '../lib/dates'
import type { JournalEntry, JournalKind } from '../lib/types'
import { useStore } from '../store'

const KINDS: { id: JournalKind; title: string; question: string }[] = [
  { id: 'entry', title: 'Free write', question: 'What is on your mind?' },
  { id: 'morning', title: PROMPTS.morning.title, question: PROMPTS.morning.question },
  { id: 'evening', title: PROMPTS.evening.title, question: PROMPTS.evening.question },
  { id: 'weekly', title: PROMPTS.weekly.title, question: PROMPTS.weekly.question },
]

type Ratings = Pick<JournalEntry, 'stress' | 'sleep' | 'focus' | 'urge'>
const NO_RATINGS: Ratings = { stress: null, sleep: null, focus: null, urge: null }

/** A private journal. Entries live only in this browser and are never sent to any service, including AI. */
export function Journal() {
  const { data, apply, today } = useStore()
  const [toast, say] = useToast()
  const [kind, setKind] = useState<JournalKind>(() => (new Date().getHours() < 12 ? 'morning' : 'evening'))
  const [text, setText] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [helped, setHelped] = useState('')
  const [ratings, setRatings] = useState<Ratings>(NO_RATINGS)
  const [openedAt] = useState(() => Date.now())
  const [query, setQuery] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const prompt = KINDS.find((k) => k.id === kind)!

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...data.journal]
      .filter((j) => !q || j.text.toLowerCase().includes(q) || j.helped.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [data.journal, query])
  const groups = useMemo(() => {
    const m = new Map<string, JournalEntry[]>()
    for (const e of entries) m.set(e.date.slice(0, 7), [...(m.get(e.date.slice(0, 7)) ?? []), e])
    return [...m]
  }, [entries])

  const canSave = text.trim().length > 0 || mood !== null || Object.values(ratings).some((v) => v !== null)
  const save = () => {
    apply((d) => {
      let next = addJournal(d, { date: today, kind, mood, ...ratings, text: text.trim(), helped: helped.trim() })
      if (kind !== 'entry') next = addMindful(next, { date: today, kind: 'reflection', seconds: Math.round((Date.now() - openedAt) / 1000) })
      return next
    })
    setText('')
    setMood(null)
    setHelped('')
    setRatings(NO_RATINGS)
    say('Saved to your journal.')
  }

  return (
    <div className="space-y-5">
      {toast}
      <div className="pt-2 lg:pt-0">
        <h1 className="serif text-[1.9rem] leading-tight text-ink sm:text-[2.2rem]">Journal</h1>
        <p className="mt-1 flex items-center gap-1.5 text-ink-soft">
          <Lock size={14} aria-hidden /> Private. Stays on this device.
        </p>
      </div>

      <section aria-label="New entry" className="rounded-[1.75rem] border border-stone/80 bg-cream p-5">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kind of entry">
          {KINDS.map((k) => (
            <Chip key={k.id} role="radio" selected={kind === k.id} onClick={() => setKind(k.id)}>
              {k.title}
            </Chip>
          ))}
        </div>
        <p className="serif mt-5 text-xl leading-snug text-ink">{prompt.question}</p>
        <div className="mt-3">
          <TextArea label="Your words" value={text} onChange={setText} rows={5} max={4000} placeholder="A sentence is enough." />
        </div>
        <p id="j-mood" className="mt-4 text-sm font-semibold text-ink">
          Mood <span className="font-normal text-ink-soft">(optional)</span>
        </p>
        <div role="radiogroup" aria-labelledby="j-mood" className="mt-2 grid grid-cols-5 gap-1.5">
          {MOODS.map((m, i) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mood === i + 1}
              onClick={() => setMood(mood === i + 1 ? null : i + 1)}
              className={`press min-h-11 rounded-xl border px-1 text-xs font-medium sm:text-sm ${mood === i + 1 ? 'border-forest bg-forest text-cream' : 'border-stone bg-parchment text-ink hover:border-moss'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <details className="mt-4 border-t border-stone pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-forest">Add ratings and what helped</summary>
          <div className="mt-2 space-y-5">
            <Scale label="Sleep quality" value={ratings.sleep} onChange={(v) => setRatings((r) => ({ ...r, sleep: v }))} low="Poor" high="Great" />
            <Scale label="Stress" value={ratings.stress} onChange={(v) => setRatings((r) => ({ ...r, stress: v }))} low="Calm" high="Very stressed" />
            <Scale label="Focus" value={ratings.focus} onChange={(v) => setRatings((r) => ({ ...r, focus: v }))} low="Scattered" high="Clear" />
            <Scale label="Urge intensity" value={ratings.urge} onChange={(v) => setRatings((r) => ({ ...r, urge: v }))} low="None" high="Very strong" />
            <TextField label="What helped?" value={helped} onChange={setHelped} max={280} />
          </div>
        </details>
        <Button className="mt-4 w-full sm:w-auto" disabled={!canSave} onClick={save}>
          Save entry
        </Button>
      </section>

      {data.journal.length === 0 ? (
        <div className="flex items-center gap-4 rounded-[1.75rem] border border-dashed border-stone p-5">
          <Sprig className="h-20 w-14 shrink-0 text-sage" />
          <Muted>Your entries will appear here. Sleep, stress, a win, a hard moment: anything you want to remember.</Muted>
        </div>
      ) : (
        <section aria-labelledby="j-past" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="j-past" className="serif text-[1.35rem] text-ink">
              Past entries
            </h2>
            {data.journal.length > 4 && (
              <label className="relative w-full sm:w-64">
                <span className="sr-only">Search entries</span>
                <Search size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft" aria-hidden />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-11 w-full rounded-full border border-stone bg-cream pr-4 pl-10 text-sm text-ink placeholder:text-ink-soft/70 focus:border-forest focus:outline-none" />
              </label>
            )}
          </div>
          {groups.length === 0 && <Muted>No entries match.</Muted>}
          {groups.map(([month, list]) => (
            <div key={month}>
              <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-moss">{monthLabel(month).toUpperCase()}</p>
              <ul className="space-y-2.5">
                {list.map((j) => (
                  <li key={j.id} className="rounded-[1.5rem] border border-stone/80 bg-cream p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{longDate(j.date)}</p>
                        <p className="text-xs text-ink-soft">
                          {KINDS.find((k) => k.id === j.kind)?.title}
                          {j.mood ? ` · ${MOODS[j.mood - 1]}` : ''}
                          {(['sleep', 'stress', 'focus', 'urge'] as const)
                            .filter((k) => j[k] !== null)
                            .map((k) => ` · ${k[0]!.toUpperCase()}${k.slice(1)} ${j[k]}/5`)
                            .join('')}
                        </p>
                      </div>
                      <Button tone="ghost" size="sm" aria-label={`Delete entry from ${longDate(j.date)}`} onClick={() => setConfirmId(j.id)} className="-mt-1 -mr-2">
                        <Trash2 size={15} aria-hidden />
                      </Button>
                    </div>
                    {j.text && <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink">{j.text}</p>}
                    {j.helped && <p className="mt-2 text-sm text-forest">What helped: {j.helped}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

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

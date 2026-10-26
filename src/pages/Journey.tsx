import { ArrowRight, Pencil, Share2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BadgeEmblem } from '../components/Art'
import { MonthCalendar } from '../components/Calendar'
import { CheckInCard, SetbackSheet } from '../components/CheckIn'
import { GoalTabs, useSelectedGoal } from '../components/GoalPicker'
import { Patterns, RealTalk } from '../components/Reflect'
import { Link } from '../router'
import { ShareSheet } from '../components/ShareCard'
import { Button, Card, H2, Muted, Sheet, Stat, TextArea, TextField, useToast } from '../components/ui'
import { removeEvent, updateEvent } from '../lib/actions'
import { milestoneStates, practiceStates, type BadgeState } from '../lib/badges'
import { isDayKey, longDate, shortDate } from '../lib/dates'
import { checkInConsistency, checkInCount, confirmsToday, earliestStart, goalStats, routineConsistency, setbackDays, workedThrough } from '../lib/progress'
import type { DayKey, GoalEvent } from '../lib/types'
import { useStore } from '../store'

type Segment = 'progress' | 'insights' | 'learn'
const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'progress', label: 'Progress' },
  { id: 'insights', label: 'Insights' },
  { id: 'learn', label: 'Learn' },
]

export function Journey() {
  const [segment, setSegment] = useState<Segment>('progress')
  return (
    <div className="space-y-5">
      <div className="pt-2 lg:pt-0">
        <h1 className="serif text-[1.9rem] leading-tight text-ink sm:text-[2.2rem]">Your journey</h1>
        <p className="mt-1 text-ink-soft">Everything you have built stays here, resets included.</p>
      </div>
      <div role="tablist" aria-label="Journey sections" className="grid grid-cols-3 gap-1 rounded-full border border-stone bg-cream p-1 sm:max-w-sm">
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`seg-${s.id}`}
            aria-selected={segment === s.id}
            aria-controls={`panel-${s.id}`}
            onClick={() => setSegment(s.id)}
            className={`press min-h-11 rounded-full text-sm font-semibold ${segment === s.id ? 'bg-forest text-cream' : 'text-ink hover:bg-sage-soft'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${segment}`} aria-labelledby={`seg-${segment}`}>
        {segment === 'progress' && <Progress />}
        {segment === 'insights' && <Insights />}
        {segment === 'learn' && <RealTalk />}
      </div>
    </div>
  )
}

function Progress() {
  const { data, apply, today } = useStore()
  const [goal, setGoal, goals] = useSelectedGoal()
  const [toast, say] = useToast()
  const [day, setDay] = useState<DayKey | null>(null)
  const [editing, setEditing] = useState<GoalEvent | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const confirmed = confirmsToday(data.checkins, today)
  const since = earliestStart(data.goals, today)
  const milestones = useMemo(() => milestoneStates(data, today), [data, today])
  const practice = useMemo(() => practiceStates(data), [data])

  if (!goal) return <Muted>Add a goal in Profile to see progress here.</Muted>
  const s = goalStats(goal, data.events, today, confirmed)
  const c7 = checkInConsistency(data.checkins, today, 7, since)
  const c30 = checkInConsistency(data.checkins, today, 30, since)
  const r7 = routineConsistency(data.routineLogs, today, 7, since)
  const worked = data.urges.filter(workedThrough).length
  const setbacks = setbackDays(goal, data.events, today)
  const history = data.events.filter((e) => e.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const earned = [...milestones, ...practice].filter((b) => b.earned)

  return (
    <div className="space-y-5">
      {toast}
      <GoalTabs goals={goals} value={goal.id} onChange={setGoal} />
      <Card>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          <Stat value={s.currentStreak} label="Current streak" />
          <Stat value={s.longestStreak} label="Longest streak" />
          <Stat value={s.alignedDays} label="Days aligned" />
          <Stat value={s.setbackCount} label="Resets" />
        </div>
        <details className="group mt-5 border-t border-stone pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-forest">More numbers and how they are counted</summary>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Stat value={checkInCount(data.checkins)} label="Check ins" />
            <Stat value={`${c7.pct}%`} label="Check ins, 7 days" hint={`${c7.done} of ${c7.days} days`} />
            <Stat value={`${c30.pct}%`} label="Check ins, 30 days" hint={`${c30.done} of ${c30.days} days`} />
            <Stat value={`${r7.pct}%`} label="Intentions, 7 days" hint={`${r7.done} of ${r7.days} days`} />
            <Stat value={worked} label="Urges worked through" hint="Passed, eased, calmer or better" />
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
            <li>A day counts once it is over, or as soon as you check in that it went to plan.</li>
            <li>Days you did not log count as aligned. They are never shown as setbacks.</li>
            <li>A reset restarts that goal’s current streak only. Longest streak, totals and badges stay.</li>
          </ul>
        </details>
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <H2>Milestones</H2>
          <Button tone="quiet" size="sm" disabled={earned.length === 0} onClick={() => setShareOpen(true)}>
            <Share2 size={16} aria-hidden /> Share
          </Button>
        </div>
        <BadgeGrid badges={milestones} />
        <details className="mt-4 border-t border-stone pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-forest">Practice badges ({practice.filter((b) => b.earned).length} of {practice.length})</summary>
          <BadgeGrid badges={practice} />
        </details>
      </Card>

      <Card>
        <H2>Calendar</H2>
        <Muted className="mt-1 text-sm">Tap a past day to check in late or fix an entry.</Muted>
        <div className="mt-4">
          <MonthCalendar data={data} today={today} onPick={setDay} />
        </div>
      </Card>

      <Card>
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
            <span className="serif text-[1.35rem] text-ink">Resets for {goal.label}</span>
            <span className="text-sm text-ink-soft">{history.length}</span>
          </summary>
          {history.length === 0 ? (
            <Muted className="mt-2">None logged.</Muted>
          ) : (
            <ul className="mt-2 divide-y divide-stone">
              {history.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {shortDate(e.date)}
                      {goal.mode === 'reduce' && <span className="ml-2 text-sm font-normal text-ink-soft">{setbacks.has(e.date) ? 'over the weekly limit' : 'within the plan'}</span>}
                    </p>
                    {e.note && <p className="text-sm text-ink-soft">{e.note}</p>}
                    {e.reflection && <p className="text-sm text-forest">Lesson: {e.reflection}</p>}
                  </div>
                  <Button tone="ghost" size="sm" aria-label={`Edit entry for ${longDate(e.date)}`} onClick={() => setEditing(e)}>
                    <Pencil size={14} aria-hidden /> Edit
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button tone="ghost" size="sm" className="mt-2 -ml-3" onClick={() => setLogOpen(true)}>
            Log a reset
          </Button>
        </details>
      </Card>

      <Sheet open={!!day} onClose={() => setDay(null)} title={day ? longDate(day) : ''}>
        {day && (
          <>
            <CheckInCard date={day} onSaved={(m) => (say(m), setDay(null))} compact />
            {data.events.some((e) => e.date === day) && (
              <div className="mt-6 border-t border-stone pt-4">
                <p className="text-sm font-semibold text-ink">Logged that day</p>
                <ul className="mt-2 space-y-2">
                  {data.events
                    .filter((e) => e.date === day)
                    .map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                        <span>{data.goals.find((g) => g.id === e.goalId)?.label}</span>
                        <Button tone="ghost" size="sm" onClick={() => (setDay(null), setEditing(e))}>
                          Edit
                        </Button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Sheet>
      <EditEventSheet
        event={editing}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => (apply((d) => updateEvent(d, id, patch)), say('Updated.'))}
        onDelete={(id) => (apply((d) => removeEvent(d, id)), say('Removed. Your counter now reflects it.'))}
      />
      <SetbackSheet open={logOpen} onClose={() => setLogOpen(false)} date={today} onSaved={say} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} say={say} />
    </div>
  )
}

function Insights() {
  return (
    <div className="space-y-5">
      <Patterns />
      <Link to="journal" className="press flex min-h-14 items-center justify-between gap-3 rounded-[1.75rem] border border-stone/80 bg-cream px-5 font-semibold text-forest">
        Write in your journal <ArrowRight size={18} aria-hidden />
      </Link>
    </div>
  )
}

function BadgeGrid({ badges }: { badges: BadgeState[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {badges.map((b) => (
        <li key={b.id} className={`flex flex-col items-center rounded-2xl px-2 py-4 text-center ${b.earned ? 'bg-gold-soft/45' : 'bg-parchment'}`}>
          <BadgeEmblem glyph={b.glyph} image={b.image} earned={b.earned} progress={b.progress} size={64} />
          <p className={`mt-2 text-sm font-semibold ${b.earned ? 'text-ink' : 'text-ink-soft'}`}>{b.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-ink-soft">{b.earned ? (b.earnedOn ? `Earned ${shortDate(b.earnedOn)}` : 'Earned') : b.progressLabel}</p>
          <p className="sr-only">{b.line}</p>
        </li>
      ))}
    </ul>
  )
}

function EditEventSheet({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: GoalEvent | null
  onClose: () => void
  onSave: (id: string, patch: Partial<Pick<GoalEvent, 'date' | 'note' | 'reflection'>>) => void
  onDelete: (id: string) => void
}) {
  const { today } = useStore()
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [reflection, setReflection] = useState('')
  const [key, setKey] = useState<string | null>(null)
  if (event && key !== event.id) {
    setKey(event.id)
    setDate(event.date)
    setNote(event.note)
    setReflection(event.reflection)
  }
  const valid = isDayKey(date) && date <= today
  const close = () => (setKey(null), onClose())
  return (
    <Sheet
      open={!!event}
      onClose={close}
      title="Edit entry"
      footer={
        event && (
          <div className="flex flex-wrap justify-between gap-2">
            <Button tone="danger" onClick={() => (onDelete(event.id), close())}>
              <Trash2 size={16} aria-hidden /> Remove, it was a mistake
            </Button>
            <Button disabled={!valid} onClick={() => (onSave(event.id, { date, note: note.trim(), reflection: reflection.trim() }), close())}>
              Save
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="max-w-xs">
          <TextField label="Day" type="date" value={date} onChange={setDate} hint={valid ? longDate(date) : 'Pick a day that is not in the future.'} />
        </div>
        <TextArea label="Note" value={note} onChange={setNote} rows={2} />
        <TextArea label="Lesson" value={reflection} onChange={setReflection} rows={2} />
      </div>
    </Sheet>
  )
}

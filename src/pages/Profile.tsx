import { CalendarPlus, Check, Download, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Chip, H2, Muted, Sheet, TextArea, TextField, useToast } from '../components/ui'
import { LimitStepper } from './Onboarding'
import { InstallPanel } from '../components/Install'
import { RoutineBuilder } from '../components/Routines'
import { addGoal, deleteGoal, setRoutines, toggleRoutine, updateGoal, updateProfile, type GoalDraft } from '../lib/actions'
import { exportFilename, exportJson, parseImport } from '../lib/backup'
import { AGE_RANGES, KIND_DEFAULT_LABEL, KIND_NAME, MAX_ROUTINES, WANTS } from '../lib/catalog'
import { isDayKey, longDate } from '../lib/dates'
import { reminderIcs } from '../lib/reminders'
import { downloadBlob } from '../lib/share'
import { isPersisted, requestPersistence } from '../lib/storage'
import type { Goal, GoalKind, TarnData } from '../lib/types'
import { navigate } from '../router'
import { useStore } from '../store'

const TITLES = ['Tarn', 'Daily', 'Notes', 'Focus']

export function Profile() {
  const { data, apply, today, storageKind, replaceAll, deleteEverything } = useStore()
  const [toast, say] = useToast()
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState<{ data: TarnData; skipped: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const p = data.profile
  const [reason, setReason] = useState(p.reason)
  const [contactName, setContactName] = useState(p.contact?.name ?? '')
  const [contactAddress, setContactAddress] = useState(p.contact?.address ?? '')
  const [customTitle, setCustomTitle] = useState(TITLES.includes(p.appTitle) ? '' : p.appTitle)
  const [time, setTime] = useState(p.reminderTime ?? '21:00')
  const [name, setName] = useState(p.name)
  const [building, setBuilding] = useState(false)
  const doneToday = new Set(data.routineLogs.filter((l) => l.date === today).map((l) => l.routineId))

  useEffect(() => {
    isPersisted().then(setPersisted)
  }, [])

  const exportData = () => {
    downloadBlob(new Blob([exportJson(data)], { type: 'application/json' }), exportFilename())
    say('Export downloaded. Keep the file somewhere private.')
  }

  const onFile = async (file: File | undefined) => {
    setImportError(null)
    if (!file) return
    if (file.size > 5_000_000) return setImportError('That file is too large to be a Tarn export.')
    const r = parseImport(await file.text())
    if (!r.ok) return setImportError(r.error)
    setImporting({ data: r.data, skipped: r.skipped })
  }

  return (
    <div className="space-y-6">
      {toast}
      <div>
        <h1 className="serif pt-2 text-[1.9rem] leading-tight text-ink sm:text-[2.2rem] lg:pt-0">Profile</h1>
        <Muted className="mt-1">You, your goals, and your data.</Muted>
      </div>

      <Card>
        <H2>About you</H2>
        <div className="mt-4 space-y-4">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField label="Name or nickname" value={name} onChange={setName} max={40} placeholder="Optional" />
            </div>
            <Button tone="quiet" disabled={name.trim() === p.name} onClick={() => (apply((d) => updateProfile(d, { name: name.trim() })), say('Saved.'))}>
              Save
            </Button>
          </div>
          <div>
            <p id="pf-age" className="text-sm font-semibold text-ink">
              Age range
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="pf-age">
              {AGE_RANGES.map((a) => (
                <Chip key={a.id} role="radio" selected={p.ageRange === a.id} onClick={() => apply((d) => updateProfile(d, { ageRange: p.ageRange === a.id ? null : a.id }))}>
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>
          {p.goiNote !== null && (
            <p className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-parchment px-4 py-3 text-sm text-ink">
              <span>GOONOMICS note: GOI {p.goiNote}. Entertainment only, not used for anything.</span>
              <Button tone="ghost" size="sm" onClick={() => apply((d) => updateProfile(d, { goiNote: null }))}>
                Remove
              </Button>
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <H2>Daily intentions</H2>
          <Button tone="quiet" size="sm" onClick={() => setBuilding(true)} aria-label={p.routines.length ? 'Edit daily intentions' : 'Choose daily intentions'}>
            {p.routines.length ? 'Edit' : 'Choose'}
          </Button>
        </div>
        <Muted className="mt-1 text-sm">The first one shows on Today. Up to {MAX_ROUTINES}, fewer is fine.</Muted>
        {p.routines.length > 0 && (
          <ul className="mt-3 space-y-2">
            {p.routines.map((r) => {
              const done = doneToday.has(r.id)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => apply((d) => toggleRoutine(d, today, r.id))}
                    className={`press flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left ${done ? 'border-forest/40 bg-sage-soft' : 'border-stone bg-parchment hover:border-moss'}`}
                  >
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${done ? 'border-forest bg-forest text-cream' : 'border-moss'}`} aria-hidden>
                      {done && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="font-medium text-ink">{r.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <H2>Goals</H2>
          <Button tone="quiet" size="sm" onClick={() => setAdding(true)}>
            Add a goal
          </Button>
        </div>
        {data.goals.length === 0 ? (
          <Muted className="mt-3">No goals yet.</Muted>
        ) : (
          <ul className="mt-4 divide-y divide-stone">
            {data.goals.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {g.label}
                    {p.primaryGoalId === g.id && data.goals.length > 1 && <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-xs font-medium text-forest">Shown first</span>}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {KIND_NAME[g.kind]}, {g.mode === 'stop' ? 'stop' : `reduce, up to ${g.weeklyLimit} in 7 days`}. Since {longDate(g.startDate)}. {g.targetDays ? `${g.targetDays} day stretch.` : 'No end date.'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {p.primaryGoalId !== g.id && data.goals.length > 1 && (
                    <Button tone="ghost" size="sm" onClick={() => apply((d) => updateProfile(d, { primaryGoalId: g.id }))}>
                      Show first
                    </Button>
                  )}
                  <Button tone="quiet" size="sm" onClick={() => setEditGoal(g)}>
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <H2>Your reason and support</H2>
          <div className="mt-4 space-y-4">
            <div>
              <p id="st-wants" className="text-sm font-semibold text-ink">
                What you want more of
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="st-wants">
                {WANTS.map((w) => (
                  <Chip key={w.id} selected={p.wants.includes(w.id)} onClick={() => apply((d) => updateProfile(d, { wants: p.wants.includes(w.id) ? p.wants.filter((x) => x !== w.id) : [...p.wants, w.id] }))}>
                    {w.label}
                  </Chip>
                ))}
              </div>
            </div>
            <TextArea label="Your reason" value={reason} onChange={setReason} rows={2} max={500} placeholder="Shown in the urge toolkit." />
            <div className="rounded-2xl border border-stone p-4">
              <p className="text-sm font-semibold text-ink">Trusted person (optional)</p>
              <p className="text-xs leading-relaxed text-ink-soft">Used only to open your own messaging app with a short, general message. Tarn never contacts anyone.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextField label="Name" value={contactName} onChange={setContactName} max={60} />
                <TextField label="Phone or email" value={contactAddress} onChange={setContactAddress} max={120} inputMode="email" />
              </div>
            </div>
            <Button
              onClick={() => {
                apply((d) => updateProfile(d, { reason: reason.trim(), contact: contactAddress.trim() ? { name: contactName.trim(), address: contactAddress.trim() } : null }))
                say('Saved.')
              }}
            >
              Save
            </Button>
          </div>
        </Card>

        <Card>
          <H2>Discretion and reminders</H2>
          <div className="mt-4 space-y-5">
            <div>
              <p id="st-title" className="text-sm font-semibold text-ink">
                Name in the browser tab
              </p>
              <p className="text-xs text-ink-soft">The installed app is always called Tarn, with a plain stone icon.</p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="st-title">
                {TITLES.map((t) => (
                  <Chip key={t} selected={p.appTitle === t} onClick={() => (apply((d) => updateProfile(d, { appTitle: t })), setCustomTitle(''))}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <TextField label="Or your own" value={customTitle} onChange={setCustomTitle} max={40} />
                </div>
                <Button tone="quiet" disabled={!customTitle.trim()} onClick={() => apply((d) => updateProfile(d, { appTitle: customTitle.trim() }))}>
                  Use
                </Button>
              </div>
            </div>
            <div className="border-t border-stone pt-5">
              <p className="text-sm font-semibold text-ink">Daily check in reminder</p>
              <p className="text-xs leading-relaxed text-ink-soft">Off unless you add it. Downloads a calendar event titled “Check in” that repeats daily in your own calendar app. Nothing is scheduled on a server.</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="w-36">
                  <TextField label="Time" type="time" value={time} onChange={setTime} />
                </div>
                <Button
                  tone="quiet"
                  disabled={!/^\d{2}:\d{2}$/.test(time)}
                  onClick={() => {
                    apply((d) => updateProfile(d, { reminderTime: time }))
                    downloadBlob(new Blob([reminderIcs(time, `${window.location.origin}/today`)], { type: 'text/calendar' }), 'check-in.ics')
                    say('Open the file to add it to your calendar.')
                  }}
                >
                  <CalendarPlus size={16} aria-hidden /> Add to calendar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <H2>Install Tarn</H2>
        <Muted className="mt-1 mb-4 text-sm">Open your daily practice from your Home Screen. Optional; everything also works in the browser.</Muted>
        <InstallPanel />
      </Card>

      <Card>
        <H2>Your data</H2>
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-sage-soft/60 p-4">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-forest" aria-hidden />
          <div className="text-sm leading-relaxed text-ink">
            <p>
              {storageKind === 'memory'
                ? 'This browser is not allowing storage, so records only last until this tab closes.'
                : 'Records are stored in this browser on this device (IndexedDB). There is no account and no copy on any server.'}
            </p>
            <p className="mt-1 text-ink-soft">
              Tarn does not encrypt them itself; they are protected by your device lock. Clearing this site’s browser data deletes them, and they do not move to other devices on their own. Export to keep a copy.
            </p>
            {storageKind === 'indexeddb' && persisted !== null && (
              <p className="mt-2">
                {persisted ? (
                  'This browser has agreed to keep your records even when space runs low.'
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center font-semibold text-forest underline"
                    onClick={async () => {
                      const r = await requestPersistence()
                      setPersisted(r)
                      say(r ? 'The browser will keep your records.' : 'The browser did not agree. Installing the app or exporting regularly helps.')
                    }}
                  >
                    Ask the browser to keep my records
                  </button>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Button tone="quiet" onClick={exportData}>
            <Download size={16} aria-hidden /> Export (JSON)
          </Button>
          <Button tone="quiet" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden /> Import an export
          </Button>
          <Button tone="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={16} aria-hidden /> Delete everything
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
        {importError && (
          <p role="alert" className="mt-3 text-sm font-medium text-clay">
            {importError}
          </p>
        )}
        <details className="mt-5 text-sm text-ink-soft">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-forest">What Tarn never does</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>No analytics, ads, trackers or cookies.</li>
            <li>No uploads of your goals, check ins, urges, journal or history, to us or to any AI service.</li>
            <li>No public profile, streaks or leaderboards. Sharing only happens when you choose, and never includes your habit or setbacks.</li>
            <li>No identity documents, no account, no email address.</li>
            <li>The app files are cached so it works offline. Your records are not part of that cache.</li>
          </ul>
        </details>
      </Card>

      <p className="px-1 text-sm text-ink-soft">
        Tarn is a self directed habit tool, not medical care. If a habit keeps interfering with your life, a qualified professional can help.{' '}
        <a href="/" className="font-semibold text-forest underline">
          Back to GOONOMICS
        </a>
      </p>

      <RoutineBuilder
        open={building}
        onClose={() => setBuilding(false)}
        initial={p.routines}
        onSave={(rs) => (apply((d) => setRoutines(d, rs)), say('Intentions saved.'))}
      />
      <GoalSheet goal={editGoal} onClose={() => setEditGoal(null)} say={say} />
      <AddGoalSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(d, target) => {
          apply((x) => addGoal(x, d, today, target))
          say('Goal added. It starts today.')
        }}
      />

      <Sheet
        open={!!importing}
        onClose={() => setImporting(null)}
        title="Replace with this export?"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ghost" onClick={() => setImporting(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!importing) return
                await replaceAll(importing.data)
                setImporting(null)
                say('Import complete.')
                navigate(importing.data.profile.onboarded ? 'today' : 'welcome')
              }}
            >
              Replace my data
            </Button>
          </div>
        }
      >
        {importing && (
          <div className="space-y-2 text-ink">
            <p>
              The file has {importing.data.goals.length} {importing.data.goals.length === 1 ? 'goal' : 'goals'}, {importing.data.checkins.length} check ins, {importing.data.urges.length} urge logs and {importing.data.journal.length} journal entries.
            </p>
            {importing.skipped > 0 && <p className="text-sm text-ink-soft">{importing.skipped} unreadable records in the file will be skipped.</p>}
            <p className="text-sm text-ink-soft">Everything currently on this device will be replaced. Export first if you want to keep it.</p>
          </div>
        )}
      </Sheet>

      <DeleteSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={async () => {
          await deleteEverything()
          setDeleteOpen(false)
          navigate('welcome', { replace: true })
        }}
      />
    </div>
  )
}

function GoalSheet({ goal, onClose, say }: { goal: Goal | null; onClose: () => void; say: (m: string) => void }) {
  const { apply, today } = useStore()
  const [g, setG] = useState<Goal | null>(goal)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [target, setTarget] = useState('')
  if (goal && g?.id !== goal.id) {
    setG(goal)
    setTarget(goal.targetDays ? String(goal.targetDays) : '')
    setConfirmDelete(false)
  }
  if (!goal || !g) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>
  const targetValid = target === '' || (/^\d{1,4}$/.test(target) && Number(target) >= 1 && Number(target) <= 3650)
  const startValid = isDayKey(g.startDate) && g.startDate <= today
  const close = () => (setG(null), onClose())
  return (
    <Sheet
      open
      onClose={close}
      title="Edit goal"
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          {confirmDelete ? (
            <Button tone="danger" onClick={() => (apply((d) => deleteGoal(d, g.id)), say('Goal deleted.'), close())}>
              Yes, delete goal and its resets
            </Button>
          ) : (
            <Button tone="ghost" onClick={() => setConfirmDelete(true)}>
              Delete goal
            </Button>
          )}
          <Button
            disabled={!g.label.trim() || !targetValid || !startValid}
            onClick={() => {
              apply((d) => updateGoal(d, g.id, { label: g.label, meaning: g.meaning, mode: g.mode, weeklyLimit: g.weeklyLimit, startDate: g.startDate, targetDays: target ? Number(target) : null }))
              say('Goal updated.')
              close()
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextField label="Goal name" value={g.label} onChange={(v) => setG({ ...g, label: v })} max={60} />
        <TextArea label="What counts, in your words" value={g.meaning} onChange={(v) => setG({ ...g, meaning: v })} rows={2} max={280} />
        <div>
          <p className="text-sm font-semibold text-ink">Rule</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip selected={g.mode === 'stop'} onClick={() => setG({ ...g, mode: 'stop', weeklyLimit: 0 })}>
              Stop: any time restarts the counter
            </Chip>
            <Chip selected={g.mode === 'reduce'} onClick={() => setG({ ...g, mode: 'reduce', weeklyLimit: Math.max(1, g.weeklyLimit || 2) })}>
              Reduce: a weekly limit
            </Chip>
          </div>
        </div>
        {g.mode === 'reduce' && <LimitStepper value={g.weeklyLimit} onChange={(v) => setG({ ...g, weeklyLimit: v })} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Start date" type="date" value={g.startDate} onChange={(v) => setG({ ...g, startDate: v })} hint={startValid ? undefined : 'Pick a date that is not in the future.'} />
          <TextField label="Stretch length in days" value={target} onChange={(v) => setTarget(v.replace(/\D/g, ''))} inputMode="numeric" max={4} hint={targetValid ? 'Leave empty for no end date.' : 'Enter 1 to 3650, or leave empty.'} />
        </div>
        {confirmDelete && <p className="text-sm text-clay">This removes the goal and the resets logged for it. Check ins, urges and journal entries stay.</p>}
      </div>
    </Sheet>
  )
}

function AddGoalSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (d: GoalDraft, target: number | null) => void }) {
  const [kind, setKind] = useState<GoalKind>('porn')
  const [mode, setMode] = useState<'stop' | 'reduce'>('stop')
  const [label, setLabel] = useState('')
  const [limit, setLimit] = useState(2)
  const name = label.trim() || (kind === 'custom' ? '' : KIND_DEFAULT_LABEL[kind][mode])
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a goal"
      footer={
        <div className="flex justify-end">
          <Button disabled={!name} onClick={() => (onAdd({ kind, mode, label: name, meaning: '', weeklyLimit: mode === 'reduce' ? limit : 0 }, null), setLabel(''), onClose())}>
            Add goal
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink">Habit</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['porn', 'masturbation', 'custom'] as GoalKind[]).map((k) => (
              <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
                {KIND_NAME[k]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Rule</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip selected={mode === 'stop'} onClick={() => setMode('stop')}>
              Stop
            </Chip>
            <Chip selected={mode === 'reduce'} onClick={() => setMode('reduce')}>
              Reduce
            </Chip>
          </div>
        </div>
        {mode === 'reduce' && <LimitStepper value={limit} onChange={setLimit} />}
        <TextField label="Goal name" value={label} onChange={setLabel} placeholder={kind === 'custom' ? 'Name your goal' : KIND_DEFAULT_LABEL[kind][mode]} max={60} />
        <Muted className="text-sm">It starts today with no fixed end. You can change that after adding it.</Muted>
      </div>
    </Sheet>
  )
}

function DeleteSheet({ open, onClose, onDelete }: { open: boolean; onClose: () => void; onDelete: () => Promise<void> }) {
  const [sure, setSure] = useState(false)
  useEffect(() => {
    if (!open) setSure(false)
  }, [open])
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Delete everything?"
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="danger" disabled={!sure} onClick={onDelete}>
            Delete all my data
          </Button>
        </div>
      }
    >
      <Muted>This removes every goal, check in, urge log, routine, journal entry and badge from this device. It cannot be undone. Export first if you might want it later.</Muted>
      <label className="mt-4 flex items-start gap-3 text-ink">
        <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-1 size-5 accent-forest" />
        <span>I understand this cannot be undone.</span>
      </label>
    </Sheet>
  )
}

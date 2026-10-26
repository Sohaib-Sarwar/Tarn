import { Bell, Camera, ChevronRight, Download, FileText, Heart, Leaf, Lock, Moon, Pencil, ShieldCheck, Smartphone, Target, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { InstallPanel } from '../components/Install'
import { RoutineBuilder } from '../components/Routines'
import { Button, Chip, Muted, Sheet, TextArea, TextField, useToast } from '../components/ui'
import { LimitStepper } from './Onboarding'
import { addGoal, deleteGoal, setRoutines, updateGoal, updateProfile, type GoalDraft } from '../lib/actions'
import { exportFilename, exportJson, parseImport } from '../lib/backup'
import { AGE_RANGES, KIND_DEFAULT_LABEL, KIND_NAME } from '../lib/catalog'
import { isDayKey, longDate } from '../lib/dates'
import { resizePhoto } from '../lib/photo'
import { reminderIcs } from '../lib/reminders'
import { downloadBlob } from '../lib/share'
import { isPersisted, requestPersistence } from '../lib/storage'
import type { AgeRange, Goal, GoalKind, TarnData, Theme } from '../lib/types'
import { useInstall } from '../install'
import { navigate } from '../router'
import { useStore } from '../store'

const TITLES = ['Tarn', 'Daily', 'Notes', 'Focus']
type Panel = 'edit' | 'goals' | 'intentions' | 'appearance' | 'install' | 'reminders' | 'support' | 'data' | null

/**
 * Profile is just you: photo, name and an Edit button. Everything else sits in quiet rows that each
 * open one focused sheet, so nothing competes for attention on the page itself.
 */
export function Profile() {
  const { data, apply } = useStore()
  const [toast, say] = useToast()
  const [panel, setPanel] = useState<Panel>(null)
  const p = data.profile
  const install = useInstall()
  const close = () => setPanel(null)
  const age = AGE_RANGES.find((a) => a.id === p.ageRange)?.label

  const rows: { id: Exclude<Panel, 'edit' | null> | 'terms'; icon: typeof Target; title: string; value: string }[] = [
    { id: 'goals', icon: Target, title: 'Goals', value: data.goals.map((g) => g.label).join(', ') || 'None yet' },
    { id: 'intentions', icon: Leaf, title: 'Daily intentions', value: p.routines[0]?.label ?? 'Choose one' },
    { id: 'appearance', icon: Moon, title: 'Appearance', value: p.theme === 'system' ? 'Match device' : p.theme === 'dark' ? 'Dark' : 'Light' },
    { id: 'install', icon: Smartphone, title: 'Install Tarn', value: install.installed ? 'Installed' : 'Add to Home Screen' },
    { id: 'reminders', icon: Bell, title: 'Reminders', value: p.reminderTime ? `Daily at ${p.reminderTime}` : 'Off' },
    { id: 'support', icon: Heart, title: 'Reason and support', value: p.contact ? `Trusted: ${p.contact.name || p.contact.address}` : 'Your reason, a trusted person' },
    { id: 'data', icon: ShieldCheck, title: 'Privacy and data', value: 'Export, import, delete' },
    { id: 'terms', icon: FileText, title: 'Terms and privacy', value: 'What Tarn stores and why' },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {toast}
      <h1 className="sr-only">Profile</h1>
      <section aria-label="You" className="relative overflow-hidden rounded-[2rem] bg-cream px-5 pt-6 pb-5 text-center shadow-soft sm:pt-8 sm:pb-6">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sage-soft to-transparent" aria-hidden />
        <div className="relative mx-auto w-fit">
          <Avatar size={88} />
          <button type="button" onClick={() => setPanel('edit')} aria-label="Change photo" className="press absolute -right-1 -bottom-1 grid size-11 place-items-center rounded-full bg-forest text-cream shadow-soft">
            <Camera size={18} aria-hidden />
          </button>
        </div>
        <p className="serif mt-4 text-2xl leading-tight break-words text-ink">{p.name || 'Add your name'}</p>
        <p className="mt-1 text-sm text-ink-soft">{age ? `${age} · ` : ''}Private to this device</p>
        <Button tone="quiet" className="mt-4" onClick={() => setPanel('edit')}>
          <Pencil size={15} aria-hidden /> Edit profile
        </Button>
      </section>

      <nav aria-label="Profile settings" className="overflow-hidden rounded-[1.75rem] border border-stone/80 bg-cream">
        <ul className="divide-y divide-stone/80">
          {rows.map(({ id, icon: Icon, title, value }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => (id === 'terms' ? navigate('terms') : setPanel(id))}
                className="press flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left hover:bg-sage-soft/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sage-soft text-forest">
                  <Icon size={19} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block truncate text-sm text-ink-soft">{value}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className="flex items-start gap-2 px-1 text-sm text-ink-soft">
        <Lock size={15} className="mt-0.5 shrink-0" aria-hidden />
        Tarn is a self directed habit tool, not medical care. Everything here stays on this device.
      </p>

      <EditProfileSheet open={panel === 'edit'} onClose={close} say={say} />
      <GoalsSheet open={panel === 'goals'} onClose={close} say={say} />
      <RoutineBuilder open={panel === 'intentions'} onClose={close} initial={p.routines} onSave={(rs) => (apply((d) => setRoutines(d, rs)), say('Intentions saved.'))} />
      <AppearanceSheet open={panel === 'appearance'} onClose={close} />
      <Sheet open={panel === 'install'} onClose={close} title="Install Tarn">
        <Muted className="mb-4 text-sm">Open your daily practice from your Home Screen. It works offline and keeps the same privacy.</Muted>
        <InstallPanel />
      </Sheet>
      <RemindersSheet open={panel === 'reminders'} onClose={close} say={say} />
      <SupportSheet open={panel === 'support'} onClose={close} say={say} />
      <DataSheet open={panel === 'data'} onClose={close} say={say} />
    </div>
  )
}

function EditProfileSheet({ open, onClose, say }: { open: boolean; onClose: () => void; say: (m: string) => void }) {
  const { data, apply } = useStore()
  const p = data.profile
  const [name, setName] = useState(p.name)
  const [age, setAge] = useState<AgeRange | null>(p.ageRange)
  const [photo, setPhoto] = useState<string | null>(p.photo)
  const [title, setTitle] = useState(p.appTitle)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!open) return
    setName(p.name)
    setAge(p.ageRange)
    setPhoto(p.photo)
    setTitle(p.appTitle)
    setError(null)
  }, [open, p.name, p.ageRange, p.photo, p.appTitle])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit profile"
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              apply((d) => updateProfile(d, { name: name.trim().slice(0, 40), ageRange: age, photo, appTitle: title.trim() || 'Tarn' }))
              onClose()
              say('Profile saved.')
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        {photo ? <img src={photo} alt="Your profile photo" className="size-20 shrink-0 rounded-full object-cover" /> : <Avatar size={80} />}
        <div className="flex flex-wrap gap-2">
          <Button tone="quiet" size="sm" onClick={() => fileRef.current?.click()}>
            <Camera size={15} aria-hidden /> {photo ? 'Change photo' : 'Add photo'}
          </Button>
          {photo && (
            <Button tone="ghost" size="sm" onClick={() => setPhoto(null)}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              setError(null)
              setPhoto(await resizePhoto(f))
            } catch (err) {
              setError((err as Error).message)
            }
          }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-soft">Resized to a small copy on this device. Never uploaded.</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-clay">
          {error}
        </p>
      )}
      <div className="mt-5 space-y-5">
        <TextField label="Name or nickname" value={name} onChange={setName} max={40} placeholder="Optional" />
        <div>
          <p id="ep-age" className="text-sm font-semibold text-ink">
            Age range
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="ep-age">
            {AGE_RANGES.map((a) => (
              <Chip key={a.id} role="radio" selected={age === a.id} onClick={() => setAge(age === a.id ? null : a.id)}>
                {a.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p id="ep-title" className="text-sm font-semibold text-ink">
            Name in the browser tab
          </p>
          <p className="text-xs text-ink-soft">For discretion. The installed app is always called Tarn.</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="ep-title">
            {TITLES.map((t) => (
              <Chip key={t} role="radio" selected={title === t} onClick={() => setTitle(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        {p.goiNote !== null && (
          <p className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-parchment px-4 py-3 text-sm text-ink">
            <span>GOONOMICS note: GOI {p.goiNote}. Entertainment only.</span>
            <Button tone="ghost" size="sm" onClick={() => apply((d) => updateProfile(d, { goiNote: null }))}>
              Remove
            </Button>
          </p>
        )}
      </div>
    </Sheet>
  )
}

function GoalsSheet({ open, onClose, say }: { open: boolean; onClose: () => void; say: (m: string) => void }) {
  const { data, apply, today } = useStore()
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [adding, setAdding] = useState(false)
  const p = data.profile
  return (
    <>
      <Sheet
        open={open && !editGoal && !adding}
        onClose={onClose}
        title="Goals"
        footer={
          <div className="flex justify-end">
            <Button tone="quiet" onClick={() => setAdding(true)}>
              Add a goal
            </Button>
          </div>
        }
      >
        {data.goals.length === 0 ? (
          <Muted>No goals yet.</Muted>
        ) : (
          <ul className="divide-y divide-stone">
            {data.goals.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {g.label}
                    {p.primaryGoalId === g.id && data.goals.length > 1 && <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-xs font-medium text-forest">Shown first</span>}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {KIND_NAME[g.kind]}, {g.mode === 'stop' ? 'stop' : `reduce, up to ${g.weeklyLimit} in 7 days`}. Since {longDate(g.startDate)}. {g.targetDays ? `${g.targetDays} day stretch.` : 'Open ended.'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {p.primaryGoalId !== g.id && data.goals.length > 1 && (
                    <Button tone="ghost" size="sm" onClick={() => apply((d) => updateProfile(d, { primaryGoalId: g.id }))}>
                      Show first
                    </Button>
                  )}
                  <Button tone="quiet" size="sm" onClick={() => setEditGoal(g)} aria-label={`Edit ${g.label}`}>
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      <GoalSheet goal={editGoal} onClose={() => setEditGoal(null)} say={say} />
      <AddGoalSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(d, target) => {
          apply((x) => addGoal(x, d, today, target))
          say('Goal added. It starts today.')
        }}
      />
    </>
  )
}

function AppearanceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, apply } = useStore()
  const options: { id: Theme; title: string; detail: string }[] = [
    { id: 'system', title: 'Match device', detail: 'Light by day, dark by night if your device switches.' },
    { id: 'light', title: 'Light', detail: 'Soft oatmeal and sage, low glare.' },
    { id: 'dark', title: 'Dark', detail: 'Deep forest tones, gentle on the eyes at night.' },
  ]
  return (
    <Sheet open={open} onClose={onClose} title="Appearance">
      <div role="radiogroup" aria-label="Theme" className="grid gap-2">
        {options.map((o) => {
          const on = data.profile.theme === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => apply((d) => updateProfile(d, { theme: o.id }))}
              className={`press flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left ${on ? 'border-forest bg-sage-soft' : 'border-stone bg-cream hover:border-moss'}`}
            >
              <span className={`grid size-12 shrink-0 overflow-hidden rounded-xl border border-stone ${o.id === 'dark' ? 'bg-[#121916]' : o.id === 'light' ? 'bg-[#e7e5dd]' : 'bg-gradient-to-br from-[#e7e5dd] from-50% to-[#121916] to-50%'}`} aria-hidden />
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{o.title}</span>
                <span className="block text-sm text-ink-soft">{o.detail}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

function RemindersSheet({ open, onClose, say }: { open: boolean; onClose: () => void; say: (m: string) => void }) {
  const { data, apply } = useStore()
  const [time, setTime] = useState(data.profile.reminderTime ?? '21:00')
  return (
    <Sheet open={open} onClose={onClose} title="Reminders">
      <Muted className="text-sm">Off unless you add it. This downloads a calendar event titled “Check in” that repeats daily in your own calendar app. Nothing is scheduled on a server.</Muted>
      <div className="mt-4 flex flex-wrap items-end gap-2">
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
          <Bell size={16} aria-hidden /> Add to calendar
        </Button>
        {data.profile.reminderTime && (
          <Button tone="ghost" onClick={() => apply((d) => updateProfile(d, { reminderTime: null }))}>
            Forget time
          </Button>
        )}
      </div>
    </Sheet>
  )
}

function SupportSheet({ open, onClose, say }: { open: boolean; onClose: () => void; say: (m: string) => void }) {
  const { data, apply } = useStore()
  const p = data.profile
  const [reason, setReason] = useState(p.reason)
  const [contactName, setContactName] = useState(p.contact?.name ?? '')
  const [contactAddress, setContactAddress] = useState(p.contact?.address ?? '')
  useEffect(() => {
    if (!open) return
    setReason(p.reason)
    setContactName(p.contact?.name ?? '')
    setContactAddress(p.contact?.address ?? '')
  }, [open, p.reason, p.contact])
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Reason and support"
      footer={
        <div className="flex justify-end">
          <Button
            onClick={() => {
              apply((d) => updateProfile(d, { reason: reason.trim(), contact: contactAddress.trim() ? { name: contactName.trim(), address: contactAddress.trim() } : null }))
              onClose()
              say('Saved.')
            }}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <TextArea label="Your reason" value={reason} onChange={setReason} rows={2} max={500} placeholder="Shown in Calm when you need it." />
        <div className="rounded-2xl border border-stone p-4">
          <p className="text-sm font-semibold text-ink">Trusted person (optional)</p>
          <p className="text-xs leading-relaxed text-ink-soft">Used only to open your own messaging app with a short, general message. Tarn never contacts anyone.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextField label="Name" value={contactName} onChange={setContactName} max={60} />
            <TextField label="Phone or email" value={contactAddress} onChange={setContactAddress} max={120} inputMode="email" />
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function DataSheet({ open, onClose, say }: { open: boolean; onClose: () => void; say: (m: string) => void }) {
  const { data, storageKind, replaceAll, deleteEverything } = useStore()
  const [importing, setImporting] = useState<{ data: TarnData; skipped: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) isPersisted().then(setPersisted)
  }, [open])

  const onFile = async (file: File | undefined) => {
    setImportError(null)
    if (!file) return
    if (file.size > 5_000_000) return setImportError('That file is too large to be a Tarn export.')
    const r = parseImport(await file.text())
    if (!r.ok) return setImportError(r.error)
    setImporting({ data: r.data, skipped: r.skipped })
  }

  return (
    <>
      <Sheet open={open && !importing && !deleteOpen} onClose={onClose} title="Privacy and data">
        <div className="flex items-start gap-3 rounded-2xl bg-sage-soft/60 p-4">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-forest" aria-hidden />
          <div className="text-sm leading-relaxed text-ink">
            <p>
              {storageKind === 'memory'
                ? 'This browser is not allowing storage, so records only last until this tab closes.'
                : 'Records are stored in this browser on this device (IndexedDB). There is no account and no copy on any server.'}
            </p>
            <p className="mt-1 text-ink-soft">Tarn does not encrypt them itself; your device lock protects them. Clearing this site’s browser data deletes them, and they do not move to other devices on their own. Export to keep a copy.</p>
            {storageKind === 'indexeddb' && persisted === false && (
              <button
                type="button"
                className="mt-1 inline-flex min-h-11 items-center font-semibold text-forest underline"
                onClick={async () => {
                  const r = await requestPersistence()
                  setPersisted(r)
                  say(r ? 'The browser will keep your records.' : 'The browser did not agree. Installing the app or exporting regularly helps.')
                }}
              >
                Ask the browser to keep my records
              </button>
            )}
            {persisted && <p className="mt-2">This browser has agreed to keep your records even when space runs low.</p>}
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          <Button
            tone="quiet"
            onClick={() => {
              downloadBlob(new Blob([exportJson(data)], { type: 'application/json' }), exportFilename())
              say('Export downloaded. Keep the file somewhere private.')
            }}
          >
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
      </Sheet>

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
                onClose()
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
          onClose()
          navigate('welcome', { replace: true })
        }}
      />
    </>
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

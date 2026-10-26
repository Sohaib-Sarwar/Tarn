import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Chip, Muted, Sheet, TextArea, TextField } from './ui'
import { newId } from '../lib/actions'
import { MAX_ROUTINES, PROMPTS, ROUTINE_CATALOG } from '../lib/catalog'
import type { Routine } from '../lib/types'

export function RoutineBuilder({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial: Routine[]; onSave: (r: Routine[]) => void }) {
  const [picked, setPicked] = useState<Routine[]>(initial)
  const [custom, setCustom] = useState('')
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setPicked(initial)
  }
  if (!open && wasOpen) setWasOpen(false)
  const full = picked.length >= MAX_ROUTINES
  const has = (label: string) => picked.some((p) => p.label === label)
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Daily intentions"
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-ink-soft">
            {picked.length} of {MAX_ROUTINES}
          </p>
          <Button onClick={() => (onSave(picked), onClose())}>Save</Button>
        </div>
      }
    >
      <Muted className="text-sm">Choose a small number. You can rename them to fit your day.</Muted>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Suggestions">
        {ROUTINE_CATALOG.map((r) => (
          <Chip
            key={r.label}
            selected={has(r.label)}
            onClick={() =>
              setPicked((ps) => (has(r.label) ? ps.filter((p) => p.label !== r.label) : full ? ps : [...ps, { id: newId(), category: r.category, label: r.label }]))
            }
          >
            {r.label}
          </Chip>
        ))}
      </div>
      {full && <p className="mt-3 text-sm text-ink-soft">That is five. Remove one to add another.</p>}
      <div className="mt-5 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField label="Your own" value={custom} onChange={setCustom} placeholder="For example: stretch before bed" max={60} />
        </div>
        <Button
          tone="quiet"
          aria-label="Add your own intention"
          disabled={!custom.trim() || full}
          onClick={() => {
            setPicked((ps) => [...ps, { id: newId(), category: 'custom', label: custom.trim() }])
            setCustom('')
          }}
        >
          <Plus size={18} aria-hidden />
        </Button>
      </div>
      {picked.length > 0 && (
        <ul className="mt-5 space-y-2">
          {picked.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-2xl border border-stone bg-cream px-3 py-2">
              <input
                aria-label={`Rename ${p.label}`}
                value={p.label}
                maxLength={60}
                onChange={(e) => setPicked((ps) => ps.map((x) => (x.id === p.id ? { ...x, label: e.target.value } : x)))}
                onBlur={(e) => !e.target.value.trim() && setPicked((ps) => ps.filter((x) => x.id !== p.id))}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-ink focus:outline-none"
              />
              <button type="button" aria-label={`Remove ${p.label}`} onClick={() => setPicked((ps) => ps.filter((x) => x.id !== p.id))} className="press grid size-9 place-items-center rounded-full text-ink-soft hover:bg-stone-soft">
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}

export function PromptSheet({ kind, onClose, onSave }: { kind: keyof typeof PROMPTS | null; onClose: () => void; onSave: (kind: keyof typeof PROMPTS, text: string, seconds: number) => void }) {
  const [text, setText] = useState('')
  const [openedAt, setOpenedAt] = useState<number | null>(null)
  if (kind && openedAt === null) setOpenedAt(Date.now())
  if (!kind && openedAt !== null) {
    setOpenedAt(null)
    setText('')
  }
  return (
    <Sheet
      open={!!kind}
      onClose={onClose}
      title={kind ? PROMPTS[kind].title : ''}
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!text.trim()} onClick={() => kind && (onSave(kind, text.trim(), Math.round((Date.now() - (openedAt ?? Date.now())) / 1000)), onClose())}>
            Save
          </Button>
        </div>
      }
    >
      {kind && (
        <>
          <p className="serif text-xl leading-snug text-ink">{PROMPTS[kind].question}</p>
          <div className="mt-4">
            <TextArea label="Your answer" value={text} onChange={setText} rows={4} />
          </div>
          <p className="mt-2 text-xs text-ink-soft">Saved only on this device.</p>
        </>
      )}
    </Sheet>
  )
}

import { Copy, Download, Share2, UserPlus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { allBadges, type BadgeState } from '../lib/badges'
import { confirmsToday, goalStats, routineStreak } from '../lib/progress'
import { copyText, downloadBlob, inviteText, nativeShare, renderPng } from '../lib/share'
import { useStore } from '../store'
import { BadgeEmblem, Landscape, Wordmark } from './Art'
import { Button, Chip, Muted, Sheet } from './ui'

const MESSAGES = ['Steady wins.', 'One day at a time.', 'Less autopilot. More intention.', 'Quiet progress is still progress.']

type Field = 'badge' | 'days' | 'routine' | 'message'

/**
 * Milestone card. By default it shows the badge and a message only. The habit, goal name, journal,
 * triggers and setbacks are never on the card, and the card has no web address on it.
 */
export function ShareSheet({ open, onClose, say }: { open: boolean; onClose: () => void; say: (m: string) => void }) {
  const { data, today } = useStore()
  const earned = useMemo(() => allBadges(data, today).filter((b) => b.earned), [data, today])
  const [badgeId, setBadgeId] = useState<string | null>(null)
  const [fields, setFields] = useState<Field[]>(['badge', 'message'])
  const [message, setMessage] = useState(MESSAGES[0]!)
  const [busy, setBusy] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const confirmed = confirmsToday(data.checkins, today)
  const best = data.goals.reduce((m, g) => Math.max(m, goalStats(g, data.events, today, confirmed).currentStreak), 0)
  const rStreak = routineStreak(data.routineLogs, today)
  const badge: BadgeState | undefined = earned.find((b) => b.id === badgeId) ?? [...earned].reverse().find((b) => b.kind === 'milestone') ?? earned[0]
  const on = (f: Field) => fields.includes(f)
  const toggle = (f: Field) => setFields((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]))

  const caption = [badge && on('badge') ? `Milestone: ${badge.name}.` : '', on('days') ? `${best} ${best === 1 ? 'day' : 'days'} steady.` : '', on('routine') && rStreak ? `${rStreak} day routine streak.` : '', on('message') ? message : '']
    .filter(Boolean)
    .join(' ')

  const png = async () => {
    if (!cardRef.current) return null
    setBusy(true)
    try {
      return await renderPng(cardRef.current, 2)
    } catch {
      say('Could not make the image in this browser. You can still copy the text.')
      return null
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Share a milestone">
      <Muted className="text-sm">Choose what to show. Your goal, habits, journal and setbacks are never included.</Muted>
      {earned.length > 1 && (
        <div className="mt-4">
          <p id="sh-badge" className="text-sm font-semibold text-ink">
            Badge
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="sh-badge">
            {earned.map((b) => (
              <Chip key={b.id} selected={badge?.id === b.id} onClick={() => setBadgeId(b.id)}>
                {b.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <p id="sh-fields" className="mt-4 text-sm font-semibold text-ink">
        On the card
      </p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="sh-fields">
        <Chip selected={on('badge')} onClick={() => toggle('badge')}>
          Milestone badge
        </Chip>
        <Chip selected={on('days')} onClick={() => toggle('days')}>
          Days steady
        </Chip>
        <Chip selected={on('routine')} onClick={() => toggle('routine')}>
          Routine streak
        </Chip>
        <Chip selected={on('message')} onClick={() => toggle('message')}>
          Message
        </Chip>
      </div>
      {on('message') && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Message">
          {MESSAGES.map((m) => (
            <Chip key={m} selected={message === m} onClick={() => setMessage(m)}>
              {m}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-center overflow-hidden rounded-3xl bg-stone-soft p-3">
        <div className="origin-top" style={{ width: 270, height: 337.5 }}>
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
            <div ref={cardRef} className="relative flex flex-col items-center overflow-hidden bg-parchment text-center" style={{ width: 540, height: 675 }}>
              <div className="pt-10">
                <Wordmark size={30} />
              </div>
              <div className="mt-12 flex flex-1 flex-col items-center px-10">
                {on('badge') && badge && (
                  <>
                    <BadgeEmblem glyph={badge.glyph} earned size={150} />
                    <p className="serif mt-6 text-[2.6rem] leading-tight text-ink">{badge.name}</p>
                  </>
                )}
                {on('days') && <p className="mt-4 text-xl font-semibold text-forest">{best} {best === 1 ? 'day' : 'days'} steady</p>}
                {on('routine') && rStreak > 0 && <p className="mt-2 text-lg text-ink-soft">{rStreak} day routine streak</p>}
                {on('message') && <p className="serif mt-6 text-2xl text-ink-soft italic">{message}</p>}
              </div>
              <Landscape className="h-44 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button
          disabled={busy}
          onClick={async () => {
            const b = await png()
            if (b) downloadBlob(b, 'tarn-milestone.png')
          }}
        >
          <Download size={18} aria-hidden /> Download image
        </Button>
        <Button
          tone="quiet"
          disabled={busy}
          onClick={async () => {
            const b = await png()
            const r = await nativeShare(caption, b)
            if (r === 'unsupported') say((await copyText(caption)) ? 'Sharing is not available here, so the text was copied.' : 'Sharing is not available in this browser.')
          }}
        >
          <Share2 size={18} aria-hidden /> Share
        </Button>
        <Button tone="quiet" onClick={async () => say((await copyText(caption)) ? 'Copied.' : 'Copy is not available in this browser.')}>
          <Copy size={18} aria-hidden /> Copy text
        </Button>
        <Button tone="quiet" onClick={async () => say((await copyText(inviteText(window.location.origin))) ? 'Invite copied. It says nothing about your records.' : 'Copy is not available in this browser.')}>
          <UserPlus size={18} aria-hidden /> Copy an invite
        </Button>
      </div>
    </Sheet>
  )
}

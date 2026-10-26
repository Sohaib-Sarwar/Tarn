import { ArrowRight, Check, Pencil, Waves } from 'lucide-react'
import { useState } from 'react'
import { Scenery } from '../components/Art'
import { WeekStrip } from '../components/Calendar'
import { CheckInCard } from '../components/CheckIn'
import { GoalTabs, useSelectedGoal } from '../components/GoalPicker'
import { InstallPopup } from '../components/Install'
import { StretchTrack } from '../components/Progress'
import { Ring } from '../components/Ring'
import { Button, Card, Sheet, useToast } from '../components/ui'
import { toggleRoutine } from '../lib/actions'
import { nextMilestone } from '../lib/badges'
import { CHECKIN_CHOICES, DAY_LINES, greeting } from '../lib/catalog'
import { longDate } from '../lib/dates'
import { checkInCount, confirmsToday, goalStats } from '../lib/progress'
import type { DayKey } from '../lib/types'
import { Link } from '../router'
import { useStore } from '../store'

export function Today() {
  const { data, apply, today } = useStore()
  const [goal, setGoal, goals] = useSelectedGoal()
  const [toast, say] = useToast()
  const [checkInDay, setCheckInDay] = useState<DayKey | null>(null)
  const confirmed = confirmsToday(data.checkins, today)
  const name = data.profile.name

  if (!goal) {
    return (
      <Card className="mt-6">
        <h1 className="serif text-2xl text-ink">No active goal</h1>
        <p className="mt-2 text-ink-soft">Add a goal in Profile to start counting.</p>
        <Link to="profile" className="mt-4 inline-flex min-h-11 items-center font-semibold text-forest underline">
          Open Profile
        </Link>
      </Card>
    )
  }

  const s = goalStats(goal, data.events, today, confirmed)
  const next = nextMilestone(s.currentStreak)
  const ringProgress = goal.targetDays ? (s.targetProgress ?? 0) : next ? s.currentStreak / next.days : 1
  const intention = data.profile.routines[0] ?? null
  const intentionDone = intention ? data.routineLogs.some((l) => l.date === today && l.routineId === intention.id) : false
  const checkin = data.checkins.find((c) => c.date === today)

  return (
    <div className="space-y-4 sm:space-y-5">
      {toast}
      <div className="pt-2 lg:pt-0">
        <h1 className="serif text-[1.9rem] leading-tight break-words text-ink sm:text-[2.2rem]">
          {greeting(new Date().getHours())}
          {name ? `, ${name}` : ''}.
        </h1>
        <p className="mt-1 text-ink-soft">One day at a time.</p>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-4 sm:space-y-5">
          <section aria-label="Progress" className="relative isolate flex flex-col items-center overflow-hidden rounded-[2rem] bg-cream px-5 pt-5 pb-14 shadow-soft sm:pt-6 sm:pb-20">
            <Scenery variant="dawn" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_70%)] sm:h-24 dark:hidden" />
            <Scenery variant="dusk" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-16 opacity-80 [mask-image:linear-gradient(to_bottom,transparent,black_70%)] sm:h-24 dark:block" />
            <GoalTabs goals={goals} value={goal.id} onChange={setGoal} />
            <div className={goals.length > 1 ? 'mt-4' : ''}>
              <Ring
                size={196}
                progress={ringProgress}
                label={`${goal.label}: day ${s.runDay}, current streak ${s.currentStreak} ${s.currentStreak === 1 ? 'day' : 'days'}${goal.targetDays ? `, ${Math.min(s.currentStreak, goal.targetDays)} of ${goal.targetDays} day stretch` : ''}`}
              >
                {s.runDay === 0 ? (
                  <>
                    <p className="serif px-6 text-2xl leading-tight text-ink">Fresh start</p>
                    <p className="mt-1 text-sm text-ink-soft">tomorrow is day 1</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-moss">Day</p>
                    <p className="serif text-[4.25rem] leading-none text-ink tabular-nums">{s.runDay}</p>
                  </>
                )}
              </Ring>
            </div>
            <p className="serif mt-3 text-lg text-ink-soft italic">{s.runDay === 0 ? 'Keep what you learned.' : DAY_LINES[s.runDay % DAY_LINES.length]}</p>
          </section>

          <section aria-label="Stretch progress" className="rounded-[1.75rem] border border-stone/80 bg-cream p-4 sm:p-5">
            <StretchTrack streak={s.currentStreak} target={goal.targetDays} label={goal.targetDays ? `YOUR ${goal.targetDays} DAY STRETCH` : 'NEXT MILESTONE'} />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone pt-4 text-center">
              <div>
                <p className="serif text-2xl leading-none text-ink tabular-nums">{s.longestStreak}</p>
                <p className="mt-1 text-xs text-ink-soft">Longest streak</p>
              </div>
              <div>
                <p className="serif text-2xl leading-none text-ink tabular-nums">{s.alignedDays}</p>
                <p className="mt-1 text-xs text-ink-soft">Days aligned</p>
              </div>
              <div>
                <p className="serif text-2xl leading-none text-ink tabular-nums">{checkInCount(data.checkins)}</p>
                <p className="mt-1 text-xs text-ink-soft">Check ins</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section aria-labelledby="t-intent" className="rounded-[1.75rem] border border-stone/80 bg-cream p-5">
            <div className="flex items-center justify-between gap-3">
              <p id="t-intent" className="text-xs font-semibold tracking-[0.12em] text-moss">
                TODAY’S INTENTION
              </p>
              <Link to="profile" className="-my-2 inline-flex min-h-11 items-center text-sm font-medium text-forest underline-offset-2 hover:underline">
                {intention ? 'Change' : 'Choose'}
              </Link>
            </div>
            {intention ? (
              <button
                type="button"
                role="checkbox"
                aria-checked={intentionDone}
                onClick={() => apply((d) => toggleRoutine(d, today, intention.id))}
                className="press mt-2 flex w-full items-center gap-3 rounded-2xl py-1 text-left"
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full border-2 ${intentionDone ? 'border-forest bg-forest text-cream' : 'border-moss'}`} aria-hidden>
                  {intentionDone && <Check size={16} strokeWidth={3} />}
                </span>
                <span className={`serif text-xl leading-snug ${intentionDone ? 'text-ink-soft line-through decoration-moss/50' : 'text-ink'}`}>{intention.label}</span>
              </button>
            ) : (
              <p className="serif mt-2 text-xl text-ink-soft">Pick one small thing to do today.</p>
            )}
          </section>

          <Link to="calm" className="press group flex min-h-[4.5rem] items-center gap-4 rounded-[1.75rem] bg-forest px-5 text-cream shadow-soft hover:bg-forest-deep">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream/12 ring-1 ring-cream/25">
              <Waves size={22} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold tracking-[0.06em]">NEED A RESET?</span>
              <span className="block text-sm opacity-80">Take a moment. One minute helps.</span>
            </span>
            <ArrowRight size={20} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>

          <section aria-labelledby="t-week" className="rounded-[1.75rem] border border-stone/80 bg-cream p-5">
            <div className="flex items-center justify-between gap-3">
              <p id="t-week" className="text-xs font-semibold tracking-[0.12em] text-moss">
                THIS WEEK
              </p>
              {checkin ? (
                <Button tone="ghost" size="sm" className="-my-2 -mr-3" onClick={() => setCheckInDay(today)} aria-label="Edit today’s check in">
                  <Pencil size={14} aria-hidden /> Edit today
                </Button>
              ) : null}
            </div>
            <div className="mt-3">
              <WeekStrip data={data} today={today} onPick={setCheckInDay} />
            </div>
            {checkin ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink">
                <Check size={16} className="shrink-0 text-forest" aria-hidden />
                <span className="truncate">Today: {CHECKIN_CHOICES.find((c) => c.id === checkin.status)!.label.toLowerCase()}</span>
              </p>
            ) : (
              <Button className="mt-4 w-full" onClick={() => setCheckInDay(today)} aria-label="Check in for today">
                How did today go? Check in
              </Button>
            )}
          </section>

          <Link to="journey" className="press hidden min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-forest lg:flex">
            See your journey <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>

      <Sheet open={!!checkInDay} onClose={() => setCheckInDay(null)} title={checkInDay === today ? 'How did today go?' : checkInDay ? longDate(checkInDay) : ''}>
        {checkInDay && (
          <CheckInCard
            date={checkInDay}
            compact
            onSaved={(m) => {
              setCheckInDay(null)
              say(m)
            }}
          />
        )}
      </Sheet>
      <InstallPopup />
    </div>
  )
}

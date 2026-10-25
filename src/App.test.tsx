import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { memoryStorage, type Storage } from './lib/storage'
import { exportJson } from './lib/backup'
import { addDays, dayKey } from './lib/dates'
import { completeOnboarding, draftsFor } from './lib/actions'
import { emptyData, type TarnData } from './lib/types'
import { writeHandoff } from './handoff'
import { initInstall } from './install'

type User = ReturnType<typeof userEvent.setup>

/** Any of these being called during a flow would mean data could leave the device. */
function networkSpies() {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'open')
  const beacon = vi.fn()
  Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true })
  return () => {
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrSpy).not.toHaveBeenCalled()
    expect(beacon).not.toHaveBeenCalled()
  }
}

const at = (path: string) => window.history.pushState(null, '', path)

async function boot(storage: Storage = memoryStorage()) {
  const user = userEvent.setup()
  render(<App storage={storage} />)
  return { user, storage }
}

function seeded(start = addDays(dayKey(), -9), choice: Parameters<typeof draftsFor>[0] = 'both', extra: Partial<TarnData['profile']> = {}): TarnData {
  const d = completeOnboarding(emptyData(), {
    name: 'Alex',
    routines: [{ id: 'r1', category: 'custom', label: 'Take a short walk after dinner' }],
    drafts: draftsFor(choice),
    startDate: start,
    targetDays: 30,
    wants: [],
    reason: 'Be present with people I love.',
  })
  return { ...d, profile: { ...d.profile, ...extra } }
}

async function welcomeToGoal(user: User) {
  await user.click(await screen.findByRole('button', { name: 'BEGIN MY JOURNEY' }))
}

beforeAll(() => initInstall())
beforeEach(() => {
  at('/')
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => vi.restoreAllMocks())

describe('Tarn onboarding', () => {
  it('reaches Today in four short screens with separate goals and a first intention', async () => {
    const offline = networkSpies()
    const { user, storage } = await boot()
    expect(await screen.findByRole('heading', { name: 'Come back to yourself.' })).toBeInTheDocument()
    await welcomeToGoal(user)
    await user.type(screen.getByLabelText('Name or nickname (optional)'), 'Alex')
    await user.click(screen.getByRole('radio', { name: '25 to 34' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: /Track porn and masturbation separately/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/not a medical timeline/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Phone out of the bedroom' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Enter Tarn' }))

    expect(await screen.findByRole('heading', { level: 1, name: /, Alex\.$/ })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/today')
    expect(screen.getByRole('img', { name: /No porn: day 1,/ })).toBeInTheDocument()
    expect(within(screen.getByRole('tablist', { name: 'Goals' })).getAllByRole('tab').map((t) => t.textContent)).toEqual(['No porn', 'No masturbation'])
    expect(screen.getByRole('checkbox', { name: 'Phone out of the bedroom' })).toBeInTheDocument()
    const saved = (await storage.load()).data
    expect(saved.profile).toMatchObject({ name: 'Alex', ageRange: '25-34', goiNote: null })
    expect(saved.goals.map((g) => [g.kind, g.mode])).toEqual([
      ['porn', 'stop'],
      ['masturbation', 'stop'],
    ])
    offline()
  })

  it('optional questions can be skipped, and a custom goal needs a name', async () => {
    const { user, storage } = await boot()
    await welcomeToGoal(user)
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    await user.click(screen.getByRole('radio', { name: 'Something else' }))
    const next = screen.getByRole('button', { name: 'Continue' })
    expect(next).toBeDisabled()
    await user.type(screen.getByLabelText('Name your goal'), 'No scrolling in bed')
    await user.click(screen.getByRole('radio', { name: 'Do it less' }))
    await user.click(screen.getByRole('button', { name: 'More' }))
    await user.click(next)
    await user.click(screen.getByRole('radio', { name: 'Open ended' }))
    await user.click(screen.getByRole('radio', { name: 'Choose later' }))
    await user.click(screen.getByRole('button', { name: 'Enter Tarn' }))
    await screen.findByText('Pick one small thing to do today.')
    const d = (await storage.load()).data
    expect(d.goals[0]).toMatchObject({ kind: 'custom', mode: 'reduce', weeklyLimit: 3, label: 'No scrolling in bed', targetDays: null })
    expect(d.profile.routines).toEqual([])
    expect(d.profile.name).toBe('')
  })

  it('brings only what the person agreed to from GOONOMICS', async () => {
    writeHandoff({ ageRange: '35-44', goi: 702 })
    const { user, storage } = await boot()
    expect(await screen.findByText('Continuing from GOONOMICS')).toBeInTheDocument()
    await welcomeToGoal(user)
    expect(screen.getByRole('radio', { name: '35 to 44' })).toHaveAttribute('aria-checked', 'true')
    const goi = screen.getByRole('checkbox', { name: /Keep my GOONOMICS GOI \(702\)/ })
    expect(goi).toBeChecked()
    await user.click(goi)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'Reduce porn use' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Enter Tarn' }))
    await screen.findByRole('heading', { level: 1, name: /\.$/ })
    const d = (await storage.load()).data
    expect(d.profile).toMatchObject({ ageRange: '35-44', goiNote: null })
    // The GOI never sets the goal: the person's own choice does.
    expect(d.goals[0]).toMatchObject({ kind: 'porn', mode: 'reduce', weeklyLimit: 2 })
    expect(sessionStorage.getItem('tarn-handoff')).toBeNull()
  })
})

describe('Tarn today', () => {
  it('shows a greeting, the day, today’s intention and one reset action', async () => {
    at('/today')
    const { user, storage } = await boot(memoryStorage(seeded(undefined, 'stop-porn')))
    expect(await screen.findByRole('img', { name: /day 10, current streak 9 days/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /NEED A RESET\?/ })).toHaveAttribute('href', '/calm')
    await user.click(screen.getByRole('checkbox', { name: 'Take a short walk after dinner' }))
    expect(screen.getByRole('checkbox', { name: 'Take a short walk after dinner' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Check in for today' }))
    const dialog = screen.getByRole('dialog', { name: 'How did today go?' })
    await user.click(within(dialog).getByRole('radio', { name: /Stayed aligned with my goal/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save check in' }))
    expect(await screen.findByText('Checked in. Today counts.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /current streak 10 days/ })).toBeInTheDocument()
    expect(screen.getByText(/Checked in: stayed aligned/)).toBeInTheDocument()
    const d = (await storage.load()).data
    expect(d.routineLogs).toHaveLength(1)
    expect(d.checkins).toMatchObject([{ status: 'aligned' }])
  })

  it('a reset only restarts the chosen goal and keeps history', async () => {
    at('/today')
    const { user, storage } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('button', { name: 'Check in for today' }))
    await user.click(screen.getByRole('radio', { name: /Need a reset/ }))
    await user.click(screen.getByRole('button', { name: 'Save check in' }))
    const dialog = await screen.findByRole('dialog', { name: 'Log a setback' })
    await user.click(within(dialog).getByRole('checkbox', { name: /No masturbation/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    const data = (await storage.load()).data
    expect(data.events).toHaveLength(1)
    expect(data.events[0]!.goalId).toBe(data.goals[1]!.id)
    expect(screen.getByRole('img', { name: /No porn: day 10/ })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'No masturbation' }))
    expect(screen.getByRole('img', { name: /No masturbation: day 0, current streak 0 days/ })).toBeInTheDocument()
    expect(screen.getByText('Fresh start')).toBeInTheDocument()
  })

  it('invites installing only after use, only where possible, and remembers a dismissal', async () => {
    at('/today')
    const prompt = vi.fn().mockResolvedValue({ outcome: 'dismissed' })
    const { user } = await boot(memoryStorage(seeded(undefined, 'stop-m')))
    await screen.findByRole('link', { name: /NEED A RESET\?/ })
    const evt = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt })
    window.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
    expect(screen.queryByText('Keep your space close.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check in for today' }))
    await user.click(screen.getByRole('radio', { name: /Stayed aligned/ }))
    await user.click(screen.getByRole('button', { name: 'Save check in' }))
    expect(await screen.findByText('Keep your space close.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ADD TO HOME SCREEN/ }))
    expect(prompt).toHaveBeenCalledTimes(1)
    // The browser's event can be used once; without a new one there is nothing to offer here.
    await waitFor(() => expect(screen.queryByText('Keep your space close.')).not.toBeInTheDocument())
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt }))
    expect(await screen.findByText('Keep your space close.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'NOT NOW' }))
    expect(screen.queryByText('Keep your space close.')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('tarn.install')!)).toHaveProperty('dismissedAt')
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt }))
    expect(screen.queryByText('Keep your space close.')).not.toBeInTheDocument()
  })
})

describe('Tarn calm', () => {
  it('breathe, notice, one next step, then how it feels, saved locally', async () => {
    const offline = networkSpies()
    at('/today')
    const { user, storage } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('link', { name: /NEED A RESET\?/ }))
    expect(await screen.findByRole('button', { name: 'START A ONE MINUTE RESET' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'START A ONE MINUTE RESET' }))
    expect(screen.getByText(/Breathe (in|out)/)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Slower' }))
    await user.click(screen.getByRole('button', { name: 'End breathing' }))
    await user.click(await screen.findByRole('button', { name: 'Chest' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Take a short walk' }))
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('radio', { name: 'Calmer' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'Showing up counts.' })).toBeInTheDocument()
    const u = (await storage.load()).data.urges
    expect(u).toHaveLength(1)
    expect(u[0]).toMatchObject({ tool: 'walk', spots: ['chest'], feeling: 'calmer' })
    await user.click(screen.getByRole('button', { name: 'Back to today' }))
    expect(await screen.findByRole('link', { name: /NEED A RESET\?/ })).toBeInTheDocument()
    offline()
  })

  it('“still difficult” is met with support, not failure', async () => {
    at('/calm')
    const { user, storage } = await boot(memoryStorage(seeded(undefined, 'stop-porn', { contact: { name: 'Sam', address: '+15555550100' } })))
    await user.click(await screen.findByRole('button', { name: 'Other ways to reset' }))
    await user.click(screen.getByRole('button', { name: 'Finish the exercise' }))
    await user.click(screen.getByRole('radio', { name: 'Still difficult' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'That is okay.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Another minute of breathing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Message Sam/ })).toHaveAttribute('href', expect.stringMatching(/^sms:\+15555550100/))
    expect(document.body.textContent).not.toMatch(/fail/i)
    expect((await storage.load()).data.urges[0]).toMatchObject({ feeling: 'difficult' })
  })

  it('is reachable before onboarding and can be closed at any time', async () => {
    at('/calm')
    const { user } = await boot()
    await user.click(await screen.findByRole('button', { name: 'START A ONE MINUTE RESET' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(await screen.findByRole('heading', { name: 'Come back to yourself.' })).toBeInTheDocument()
  })

  it('writing down the trigger saves the chosen triggers', async () => {
    at('/calm')
    const { user, storage } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('button', { name: 'Other ways to reset' }))
    await user.click(screen.getByRole('button', { name: 'Write down the trigger' }))
    await user.click(screen.getByRole('button', { name: 'Late night scrolling' }))
    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect((await storage.load()).data.urges[0]).toMatchObject({ tool: 'write', triggers: ['late'], feeling: null })
  })
})

describe('Tarn journey and profile', () => {
  it('Journey groups progress, reflection and learning behind three segments', async () => {
    at('/journey')
    const { user } = await boot(memoryStorage(seeded()))
    expect(await screen.findByText('One Week Rooted')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Reflect' }))
    expect(screen.getByText(/Not enough entries yet to say anything honest/)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Learn' }))
    expect(screen.getByRole('heading', { name: 'Masturbation is a normal behavior' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /WHO ICD 11, 6C72/ })).toHaveAttribute('href', expect.stringContaining('icd.who.int'))
  })

  it('old V1.0 links still work', async () => {
    at('/settings')
    await boot(memoryStorage(seeded()))
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument()
  })

  it('exports, imports and deletes local data from Profile', async () => {
    at('/profile')
    const { user, storage } = await boot(memoryStorage(seeded()))
    const created: Blob[] = []
    URL.createObjectURL = vi.fn((b: Blob) => (created.push(b), 'blob:x'))
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await user.click(await screen.findByRole('button', { name: /Export \(JSON\)/ }))
    expect(JSON.parse(await created[0]!.text())).toMatchObject({ format: 'stillpoint-export', version: 1 })

    const other = seeded(addDays(dayKey(), -2), 'reduce-porn')
    await user.upload(document.querySelector('input[type=file]') as HTMLInputElement, new File([exportJson(other)], 'tarn.json', { type: 'application/json' }))
    const dialog = await screen.findByRole('dialog', { name: 'Replace with this export?' })
    await user.click(within(dialog).getByRole('button', { name: 'Replace my data' }))
    await waitFor(async () => expect((await storage.load()).data.goals.map((g) => g.label)).toEqual(['Less porn']))

    at('/profile')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await user.click(await screen.findByRole('button', { name: /Delete everything/ }))
    const del = screen.getByRole('dialog', { name: 'Delete everything?' })
    await user.click(within(del).getByRole('checkbox'))
    await user.click(within(del).getByRole('button', { name: 'Delete all my data' }))
    expect(await screen.findByRole('heading', { name: 'Come back to yourself.' })).toBeInTheDocument()
    expect((await storage.load()).data.goals).toEqual([])
  })

  it('edits the name and daily intentions', async () => {
    at('/profile')
    const { user, storage } = await boot(memoryStorage(seeded()))
    const nameField = await screen.findByLabelText('Name or nickname')
    await user.clear(nameField)
    await user.type(nameField, 'A very long nickname that keeps going on')
    await user.click(screen.getAllByRole('button', { name: 'Save' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Edit daily intentions' }))
    const dialog = screen.getByRole('dialog', { name: 'Daily intentions' })
    await user.click(within(dialog).getByRole('button', { name: 'Read 10 pages' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    const d = (await storage.load()).data
    expect(d.profile.name).toBe('A very long nickname that keeps going on')
    expect(d.profile.routines.map((r) => r.label)).toEqual(['Take a short walk after dinner', 'Read 10 pages'])
  })

  it('has four labeled tabs, marks the current one, and sheets close with Escape', async () => {
    at('/journey')
    const { user } = await boot(memoryStorage(seeded()))
    const navs = await screen.findAllByRole('navigation', { name: 'Main' })
    for (const nav of navs) {
      expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['Today', 'Journey', 'Calm', 'Profile'])
      expect(within(nav).getByRole('link', { name: 'Journey' })).toHaveAttribute('aria-current', 'page')
    }
    await user.click(screen.getByRole('button', { name: /Share/ }))
    expect(screen.getByRole('dialog', { name: 'Share a milestone' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('the share card never includes the goal or habit', async () => {
    at('/journey')
    const { user } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('button', { name: /Share/ }))
    const dialog = screen.getByRole('dialog', { name: 'Share a milestone' })
    await user.click(within(dialog).getByRole('button', { name: 'Days steady' }))
    expect(dialog.textContent).not.toMatch(/porn|masturbation/i)
  })

  it('survives corrupt stored records and says how many were skipped', async () => {
    at('/today')
    const raw = JSON.parse(exportJson(seeded())).data
    raw.checkins = [{ date: 'garbage' }, { date: dayKey(), status: 'aligned' }]
    raw.urges = 'nope'
    await boot(memoryStorage(raw))
    expect(await screen.findByText(/2 saved records could not be read and were skipped/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /day 10/ })).toBeInTheDocument()
  })

  it('shows an empty state on Today when every goal is gone', async () => {
    at('/today')
    const d = seeded()
    await boot(memoryStorage({ ...d, goals: [], events: [] }))
    expect(await screen.findByRole('heading', { name: 'No active goal' })).toBeInTheDocument()
  })
})

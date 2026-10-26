import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { memoryStorage, type Storage } from './lib/storage'
import { exportJson } from './lib/backup'
import { addDays, dayKey } from './lib/dates'
import { addJournal, completeOnboarding, draftsFor, setCheckIn } from './lib/actions'
import { emptyData, type TarnData } from './lib/types'
import { captureHandoff, readHandoff, writeHandoff } from './handoff'
import { initInstall, promptInstall } from './install'

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

async function startOnboarding(user: User) {
  expect(await screen.findByRole('heading', { level: 1, name: 'Come back to yourself.' })).toBeInTheDocument()
  await user.click(screen.getAllByRole('button', { name: /BEGIN MY JOURNEY/ })[0]!)
}

beforeAll(() => initInstall())
beforeEach(() => {
  at('/')
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
afterEach(() => vi.restoreAllMocks())

describe('landing and onboarding', () => {
  it('the landing page leads into four short steps and Today, with the Terms accepted', async () => {
    const offline = networkSpies()
    const { user, storage } = await boot()
    await startOnboarding(user)
    expect(window.location.pathname).toBe('/start')
    await user.type(screen.getByLabelText('Name or nickname (optional)'), 'Alex')
    await user.click(screen.getByRole('radio', { name: '25 to 34' }))
    const next = screen.getByRole('button', { name: 'Continue' })
    expect(next).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Terms and privacy' }))
    const terms = screen.getByRole('dialog', { name: 'Terms and privacy' })
    expect(within(terms).getByText(/Everything stays on your device/)).toBeInTheDocument()
    await user.click(within(terms).getByRole('button', { name: 'I agree' }))
    expect(screen.getByRole('checkbox', { name: /I am 18 or older and I agree/ })).toBeChecked()
    await user.click(next)
    await user.click(screen.getByRole('radio', { name: /Track porn and masturbation separately/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/not a medical timeline/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enter Tarn' }))

    expect(await screen.findByRole('heading', { level: 1, name: /, Alex\.$/ })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/today')
    expect(screen.getByRole('img', { name: /No porn: day 1,/ })).toBeInTheDocument()
    const saved = (await storage.load()).data
    expect(saved.profile).toMatchObject({ name: 'Alex', ageRange: '25-34' })
    expect(saved.profile.termsAcceptedAt).toBeTruthy()
    expect(saved.goals.map((g) => [g.kind, g.mode])).toEqual([
      ['porn', 'stop'],
      ['masturbation', 'stop'],
    ])
    offline()
  })

  it('a custom goal needs a name and can use a weekly limit', async () => {
    const { user, storage } = await boot()
    await startOnboarding(user)
    await user.click(screen.getByRole('checkbox', { name: /I am 18 or older/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
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
  })

  it('a GOONOMICS link carries only what was agreed, through the fragment, and it is removed from the address bar', async () => {
    at('/#from=goonomics&age=35-44&goi=702')
    expect(captureHandoff()).toEqual({ ageRange: '35-44', goi: 702 })
    expect(window.location.hash).toBe('')
    const { user, storage } = await boot()
    expect(await screen.findByText('Welcome from GOONOMICS')).toBeInTheDocument()
    await startOnboarding(user)
    expect(screen.getByRole('radio', { name: '35 to 44' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('checkbox', { name: /Keep my GOONOMICS GOI \(702\)/ }))
    await user.click(screen.getByRole('checkbox', { name: /I am 18 or older/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'Reduce porn use' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Enter Tarn' }))
    await screen.findByRole('heading', { level: 1, name: /\.$/ })
    const d = (await storage.load()).data
    expect(d.profile).toMatchObject({ ageRange: '35-44', goiNote: null })
    expect(d.goals[0]).toMatchObject({ kind: 'porn', mode: 'reduce', weeklyLimit: 2 })
    expect(readHandoff()).toBeNull()
  })

  it('ignores junk in a GOONOMICS fragment', () => {
    at('/#from=goonomics&age=12&goi=99999')
    expect(captureHandoff()).toEqual({ ageRange: null, goi: null })
    at('/#something=else')
    expect(captureHandoff()).toBeNull()
    writeHandoff({ ageRange: null, goi: null })
  })

  it('the terms page is reachable before onboarding', async () => {
    at('/terms')
    await boot()
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms and privacy' })).toBeInTheDocument()
    expect(screen.getByText(/clearing this site’s browser data/i)).toBeInTheDocument()
  })
})

describe('today', () => {
  it('shows the day, the stretch track, the week of ticks and one reset action', async () => {
    at('/today')
    const { user, storage } = await boot(memoryStorage(seeded(undefined, 'stop-porn')))
    expect(await screen.findByRole('img', { name: /day 10, current streak 9 days/ })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '9 of 30 days' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /NEED A RESET\?/ })).toHaveAttribute('href', '/calm')
    expect(within(screen.getByRole('list', { name: 'This week' })).getAllByRole('button')).toHaveLength(7)
    await user.click(screen.getByRole('checkbox', { name: 'Take a short walk after dinner' }))
    await user.click(screen.getByRole('button', { name: 'Check in for today' }))
    const dialog = screen.getByRole('dialog', { name: 'How did today go?' })
    await user.click(within(dialog).getByRole('radio', { name: /Stayed aligned with my goal/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save check in' }))
    expect(await screen.findByText('Checked in. Today counts.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /current streak 10 days/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /checked in: Stayed aligned with my goal/ })).toBeInTheDocument()
    const d = (await storage.load()).data
    expect(d.routineLogs).toHaveLength(1)
    expect(d.checkins).toMatchObject([{ status: 'aligned' }])
  })

  it('a reset only restarts the chosen goal, shows a cross, and keeps history', async () => {
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
    expect(screen.getByRole('button', { name: /setback recorded/ })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'No masturbation' }))
    expect(screen.getByText('Fresh start')).toBeInTheDocument()
  })

  it('the install popup opens the browser dialog from a tap, and Not now is remembered', async () => {
    at('/today')
    const prompt = vi.fn().mockResolvedValue({ outcome: 'dismissed' })
    const { user } = await boot(memoryStorage(seeded(undefined, 'stop-m')))
    await screen.findByRole('link', { name: /NEED A RESET\?/ })
    const evt = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt })
    window.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
    const popup = await screen.findByRole('dialog', { name: 'Install Tarn' }, { timeout: 4000 })
    await user.click(within(popup).getByRole('button', { name: /Install app/ }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/No problem. You can install Tarn later/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByRole('dialog', { name: 'Install Tarn' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('tarn.install')!)).toHaveProperty('dismissedAt')
    // Leave no captured event behind for other tests.
    await promptInstall()
  })
})

describe('calm', () => {
  it('breathe, notice, one next step, then how it feels, saved locally', async () => {
    const offline = networkSpies()
    at('/today')
    const { user, storage } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('link', { name: /NEED A RESET\?/ }))
    await user.click(await screen.findByRole('button', { name: 'START A ONE MINUTE RESET' }))
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    expect(screen.getByText(/Breathe (in|out)/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'End breathing' }))
    await user.click(await screen.findByRole('button', { name: 'Chest' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Take a short walk' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('radio', { name: 'Calmer' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'Showing up counts.' })).toBeInTheDocument()
    expect((await storage.load()).data.urges[0]).toMatchObject({ tool: 'walk', spots: ['chest'], feeling: 'calmer' })
    offline()
  })

  it('“still difficult” is met with support, not failure', async () => {
    at('/calm')
    const { user } = await boot(memoryStorage(seeded(undefined, 'stop-porn', { contact: { name: 'Sam', address: '+15555550100' } })))
    await user.click(await screen.findByRole('button', { name: 'Other ways to reset' }))
    await user.click(screen.getByRole('button', { name: 'Finish the exercise' }))
    await user.click(screen.getByRole('radio', { name: 'Still difficult' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'That is okay.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Message Sam/ })).toHaveAttribute('href', expect.stringMatching(/^sms:\+15555550100/))
    expect(document.body.textContent).not.toMatch(/fail/i)
  })

  it('is reachable before onboarding and can be closed at any time', async () => {
    at('/calm')
    const { user } = await boot()
    await user.click(await screen.findByRole('button', { name: 'START A ONE MINUTE RESET' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Come back to yourself.' })).toBeInTheDocument()
  })
})

describe('journey, journal and profile', () => {
  it('Journey groups progress, insights and learning', async () => {
    at('/journey')
    const { user } = await boot(memoryStorage(seeded()))
    expect(await screen.findByText('One Week Rooted')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Insights' }))
    expect(screen.getByText(/Not enough entries yet to say anything honest/)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Learn' }))
    expect(screen.getByRole('link', { name: /WHO ICD 11, 6C72/ })).toHaveAttribute('href', expect.stringContaining('icd.who.int'))
  })

  it('the journal saves private entries and finds them again', async () => {
    at('/journal')
    let d = seeded()
    for (let i = 0; i < 5; i++) d = addJournal(d, { date: addDays(dayKey(), -i - 1), kind: 'entry', mood: 3, stress: null, sleep: null, focus: null, urge: null, text: `Old note ${i}`, helped: '' })
    const { user, storage } = await boot(memoryStorage(d))
    await user.click(await screen.findByRole('radio', { name: 'Free write' }))
    await user.type(screen.getByLabelText('Your words'), 'Walked by the lake. Felt lighter.')
    await user.click(screen.getByRole('radio', { name: 'Good' }))
    await user.click(screen.getByRole('button', { name: 'Save entry' }))
    expect(await screen.findByText('Walked by the lake. Felt lighter.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search entries' }), 'lake')
    expect(screen.queryByText('Old note 1')).not.toBeInTheDocument()
    expect((await storage.load()).data.journal.find((j) => j.text.includes('lake'))).toMatchObject({ kind: 'entry', mood: 4 })
  })

  it('Profile is just you, with Edit profile, and theme in Appearance', async () => {
    at('/profile')
    const { user, storage } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('button', { name: /Edit profile/ }))
    const edit = screen.getByRole('dialog', { name: 'Edit profile' })
    const name = within(edit).getByLabelText('Name or nickname')
    await user.clear(name)
    await user.type(name, 'Sam')
    await user.click(within(edit).getByRole('radio', { name: '35 to 44' }))
    await user.click(within(edit).getByRole('button', { name: 'Save' }))
    expect((await screen.findAllByText('Sam')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Appearance/ }))
    await user.click(screen.getByRole('radio', { name: /Dark/ }))
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('dark'))
    expect(localStorage.getItem('tarn.theme')).toBe('dark')
    expect((await storage.load()).data.profile).toMatchObject({ name: 'Sam', ageRange: '35-44', theme: 'dark' })
  })

  it('daily intentions are edited from their own row', async () => {
    at('/profile')
    const { user, storage } = await boot(memoryStorage(seeded()))
    await user.click(await screen.findByRole('button', { name: /Daily intentions/ }))
    const dialog = screen.getByRole('dialog', { name: 'Daily intentions' })
    await user.click(within(dialog).getByRole('button', { name: 'Read 10 pages' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect((await storage.load()).data.profile.routines.map((r) => r.label)).toEqual(['Take a short walk after dinner', 'Read 10 pages'])
  })

  it('exports, imports and deletes local data from Privacy and data', async () => {
    at('/profile')
    const { user, storage } = await boot(memoryStorage(seeded()))
    const created: Blob[] = []
    URL.createObjectURL = vi.fn((b: Blob) => (created.push(b), 'blob:x'))
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await user.click(await screen.findByRole('button', { name: /Privacy and data/ }))
    await user.click(screen.getByRole('button', { name: /Export \(JSON\)/ }))
    expect(JSON.parse(await created[0]!.text())).toMatchObject({ format: 'stillpoint-export', version: 1 })

    const other = seeded(addDays(dayKey(), -2), 'reduce-porn')
    await user.upload(document.querySelector('input[type=file][accept*=json]') as HTMLInputElement, new File([exportJson(other)], 'tarn.json', { type: 'application/json' }))
    const dialog = await screen.findByRole('dialog', { name: 'Replace with this export?' })
    await user.click(within(dialog).getByRole('button', { name: 'Replace my data' }))
    await waitFor(async () => expect((await storage.load()).data.goals.map((g) => g.label)).toEqual(['Less porn']))

    at('/profile')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await user.click(await screen.findByRole('button', { name: /Privacy and data/ }))
    await user.click(screen.getByRole('button', { name: /Delete everything/ }))
    const del = screen.getByRole('dialog', { name: 'Delete everything?' })
    await user.click(within(del).getByRole('checkbox'))
    await user.click(within(del).getByRole('button', { name: 'Delete all my data' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Come back to yourself.' })).toBeInTheDocument()
    expect((await storage.load()).data.goals).toEqual([])
  })

  it('has five labeled tabs, marks the current one, and sheets close with Escape', async () => {
    at('/journey')
    const { user } = await boot(memoryStorage(seeded()))
    const navs = await screen.findAllByRole('navigation', { name: 'Main' })
    for (const nav of navs) {
      expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['Today', 'Journey', 'Calm', 'Journal', 'Profile'])
      expect(within(nav).getByRole('link', { name: 'Journey' })).toHaveAttribute('aria-current', 'page')
    }
    await user.click(screen.getByRole('button', { name: /Share/ }))
    expect(screen.getByRole('dialog', { name: 'Share a milestone' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('the calendar uses ticks for check ins and never marks unlogged days as setbacks', async () => {
    at('/journey')
    const d = setCheckIn(seeded(), addDays(dayKey(), -1), { status: 'aligned', mood: null, note: '' })
    await boot(memoryStorage(d))
    expect(await screen.findByRole('button', { name: /checked in: Stayed aligned with my goal/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /not logged, counted as aligned/ }).length).toBeGreaterThan(3)
    expect(screen.queryByRole('button', { name: /setback recorded/ })).not.toBeInTheDocument()
  })

  it('survives corrupt stored records and says how many were skipped', async () => {
    at('/today')
    const raw = JSON.parse(exportJson(seeded())).data
    raw.checkins = [{ date: 'garbage' }, { date: dayKey(), status: 'aligned' }]
    raw.urges = 'nope'
    await boot(memoryStorage(raw))
    expect(await screen.findByText(/2 saved records could not be read and were skipped/)).toBeInTheDocument()
  })
})

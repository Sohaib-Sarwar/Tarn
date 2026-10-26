import { Check, Download, MoreHorizontal, Plus, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dismissInvite, promptInstall, useInstall, type InstallState } from '../install'
import { useStore } from '../store'
import { TarnMark } from './Art'
import { Button, Sheet } from './ui'

/** Platform specific steps. Only shown where they are accurate. */
export function InstallSteps({ state }: { state: InstallState }) {
  if (state.platform === 'ios-safari') {
    return (
      <ol className="space-y-2.5 text-sm text-ink">
        <li className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
            <Share size={16} aria-hidden />
          </span>
          Tap the Share button in Safari.
        </li>
        <li className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
            <Plus size={16} aria-hidden />
          </span>
          Choose “Add to Home Screen”. You may need to scroll the list.
        </li>
        <li className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
            <TarnMark size={16} />
          </span>
          Tap “Add”. Tarn opens from your Home Screen like an app.
        </li>
      </ol>
    )
  }
  if (state.platform === 'ios-other') {
    return (
      <ol className="space-y-2.5 text-sm text-ink">
        <li className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
            <Share size={16} aria-hidden />
          </span>
          Open your browser’s Share menu and look for “Add to Home Screen”.
        </li>
        <li className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
            <MoreHorizontal size={16} aria-hidden />
          </span>
          If it is not there, open this page in Safari and add it from Safari’s Share menu.
        </li>
      </ol>
    )
  }
  if (state.platform === 'mac-safari') {
    return <p className="text-sm text-ink">In Safari, choose File, then “Add to Dock”.</p>
  }
  if (state.platform === 'firefox') {
    return <p className="text-sm text-ink-soft">Firefox does not install web apps. Tarn works fully in the browser, or you can install it from Chrome, Edge or Safari.</p>
  }
  return <p className="text-sm text-ink-soft">Look for “Install app” or “Add to Home Screen” in your browser menu. Some browsers do not offer it.</p>
}

/**
 * The gentle invitation on Today. It appears only after the person has used the app (a check in or
 * a finished calm session), only when installing is actually possible, and never again once dismissed.
 */
export function InstallInvite() {
  const { data } = useStore()
  const state = useInstall()
  const [showSteps, setShowSteps] = useState(false)
  const engaged = data.checkins.some((c) => c.status !== 'skip') || data.urges.some((u) => u.feeling !== null)
  if (!engaged || state.installed || state.dismissed || !state.supported) return null
  return (
    <aside aria-labelledby="install-title" className="relative rounded-[1.75rem] border border-stone/80 bg-cream p-5">
      <button type="button" onClick={dismissInvite} aria-label="Not now" className="press absolute top-2 right-2 grid size-11 place-items-center rounded-full text-ink-soft hover:bg-stone-soft">
        <X size={18} aria-hidden />
      </button>
      <div className="flex items-center gap-3 pr-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest">
          <TarnMark size={26} tone="dark" />
        </span>
        <div>
          <p id="install-title" className="serif text-lg leading-tight text-ink">
            Keep your space close.
          </p>
          <p className="text-sm text-ink-soft">Open your daily practice like an app.</p>
        </div>
      </div>
      {showSteps && (
        <div className="mt-4">
          <InstallSteps state={state} />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {state.canPrompt ? (
          <Button size="sm" onClick={() => promptInstall()}>
            <Download size={16} aria-hidden /> ADD TO HOME SCREEN
          </Button>
        ) : (
          !showSteps && (
            <Button size="sm" onClick={() => setShowSteps(true)}>
              ADD TO HOME SCREEN
            </Button>
          )
        )}
        <Button size="sm" tone="ghost" onClick={dismissInvite}>
          NOT NOW
        </Button>
      </div>
    </aside>
  )
}

/** The permanent entry in Profile. */
export function InstallPanel() {
  const state = useInstall()
  const [result, setResult] = useState<string | null>(null)
  if (state.standalone) return <p className="text-sm text-ink">You are using the installed app.</p>
  if (state.installed) return <p className="text-sm text-ink">Tarn is installed on this device. Open it from your Home Screen or app list.</p>
  return (
    <div className="space-y-3">
      {state.canPrompt ? (
        <Button
          onClick={async () => {
            const r = await promptInstall()
            setResult(r === 'accepted' ? 'Installing. Look for Tarn on your Home Screen.' : r === 'dismissed' ? 'No problem. You can install it later.' : null)
          }}
        >
          <Download size={16} aria-hidden /> Add to Home Screen
        </Button>
      ) : (
        <InstallSteps state={state} />
      )}
      {result && (
        <p role="status" className="text-sm text-ink-soft">
          {result}
        </p>
      )}
    </div>
  )
}

/**
 * The install popup. It appears once per session on Today, a moment after the app opens, whenever
 * this browser can really install Tarn: Chromium has handed us its install event (the button then
 * opens the browser's own install dialog), or the device is an iPhone, iPad or Mac with Safari's Add
 * to Home Screen. It never appears inside the installed app, and "Not now" turns it off for good.
 */
export function InstallPopup() {
  const state = useInstall()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const eligible = !state.installed && !state.dismissed && state.supported

  useEffect(() => {
    if (!eligible) return
    let seen = false
    try {
      seen = sessionStorage.getItem('tarn.install.seen') === '1'
    } catch {
      // Storage blocked: show it, the dismissal still works for this page.
    }
    if (seen) return
    const t = window.setTimeout(() => {
      setOpen(true)
      try {
        sessionStorage.setItem('tarn.install.seen', '1')
      } catch {
        // Ignore.
      }
    }, 1800)
    return () => window.clearTimeout(t)
  }, [eligible])

  if (!open || state.installed) return null
  const close = () => setOpen(false)
  return (
    <Sheet
      open
      onClose={close}
      title="Install Tarn"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            tone="ghost"
            onClick={() => {
              dismissInvite()
              close()
            }}
          >
            Not now
          </Button>
          {state.canPrompt && (
            <Button
              onClick={async () => {
                const r = await promptInstall()
                if (r === 'accepted') close()
                else setResult(r === 'dismissed' ? 'No problem. You can install Tarn later from Profile.' : 'This browser did not open its install dialog. Try its menu, or Profile later.')
              }}
            >
              <Download size={16} aria-hidden /> Install app
            </Button>
          )}
        </div>
      }
    >
      <div className="flex items-center gap-4">
        <TarnMark size={64} />
        <div>
          <p className="serif text-2xl leading-tight text-ink">Keep your space close.</p>
          <p className="mt-1 text-ink-soft">Open your daily practice like an app.</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-ink">
        <li className="flex gap-2">
          <Check size={18} className="shrink-0 text-forest" aria-hidden /> Opens full screen from your Home Screen
        </li>
        <li className="flex gap-2">
          <Check size={18} className="shrink-0 text-forest" aria-hidden /> Works offline, even in a difficult moment
        </li>
        <li className="flex gap-2">
          <Check size={18} className="shrink-0 text-forest" aria-hidden /> Same privacy: everything stays on this device
        </li>
      </ul>
      {!state.canPrompt && (
        <div className="mt-5 rounded-2xl bg-parchment p-4">
          <InstallSteps state={state} />
        </div>
      )}
      {result && (
        <p role="status" className="mt-4 text-sm text-ink-soft">
          {result}
        </p>
      )}
    </Sheet>
  )
}

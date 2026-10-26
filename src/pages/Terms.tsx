import { ArrowLeft } from 'lucide-react'
import { Wordmark } from '../components/Art'
import { navigate } from '../router'
import { useStore } from '../store'

export const TERMS_UPDATED = '25 October 2026'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Everything stays on your device',
    body: [
      'Tarn has no account and no server that holds your records. Your goals, check ins, calm sessions, journal, photo and settings are saved only in this browser on this device (in its IndexedDB storage).',
      'Nothing you enter is sent to us, to analytics, to advertisers or to any AI service. There are no cookies and no trackers.',
      'A profile photo is resized to a small copy on your device before it is saved. The original file is never stored or uploaded.',
    ],
  },
  {
    title: 'You are in charge of your records',
    body: [
      'Because nothing is stored elsewhere, clearing this site’s browser data, uninstalling the app or losing the device deletes your records. We cannot recover them.',
      'You can export a copy at any time (Profile, Privacy and data) and import it on another device. The export is a plain file: keep it somewhere private.',
      'Tarn does not add its own encryption. Your records are protected by your device and browser, so use a screen lock, especially on a shared device.',
    ],
  },
  {
    title: 'For adults, and not medical care',
    body: [
      'Tarn is for adults 18 and over. It is a self directed habit companion. It does not diagnose anything, and it is not therapy or medical treatment.',
      'Breathing and grounding exercises are offered as ways to slow down. They are not promised to remove urges or to produce any health effect.',
      'If a habit keeps interfering with your life, a qualified health or mental health professional can help. If you are in crisis, call or text 988 in the US, or your local emergency number.',
    ],
  },
  {
    title: 'Coming from GOONOMICS',
    body: [
      'If you open Tarn from the GOONOMICS calculator and choose to bring something along, only an age range and your GOI as a note are passed, inside the link in your own browser. The GOI is an entertainment number and never sets a goal or a severity in Tarn.',
    ],
  },
  {
    title: 'Installing and working offline',
    body: [
      'You can add Tarn to your Home Screen. The app’s own files are cached so it opens offline. Your records are never part of that cache.',
    ],
  },
  {
    title: 'The usual fine print',
    body: [
      'Tarn is provided as is, without warranties. We may update the app and these terms; the date below shows the latest version. Continuing to use Tarn after a change means you accept the updated terms.',
    ],
  },
]

/** The terms, used as a page and inside the onboarding sheet. */
export function TermsContent() {
  return (
    <div className="space-y-6">
      {SECTIONS.map((s) => (
        <section key={s.title}>
          <h2 className="serif text-xl text-ink">{s.title}</h2>
          <div className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-ink-soft">
            {s.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </section>
      ))}
      <p className="text-sm text-ink-soft">Last updated {TERMS_UPDATED}.</p>
    </div>
  )
}

export function Terms() {
  const { data } = useStore()
  return (
    <div className="min-h-dvh bg-parchment">
      <div className="pt-safe mx-auto max-w-2xl px-5 pt-5 pb-16 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : navigate(data.profile.onboarded ? 'profile' : 'welcome'))}
            className="press -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-forest hover:bg-sage-soft"
          >
            <ArrowLeft size={18} aria-hidden /> Back
          </button>
          <Wordmark size={24} />
        </div>
        <h1 className="serif mt-8 text-[2.2rem] leading-tight text-ink">Terms and privacy</h1>
        <p className="mt-2 text-ink-soft">The short version: your records live on your device, and Tarn is a companion, not medical care.</p>
        <div className="mt-8">
          <TermsContent />
        </div>
      </div>
    </div>
  )
}

# Tarn

Live: **https://tarn-rehab.vercel.app**

**Come back to yourself.** A calm, private, local first habit companion for adults who want to
change their relationship with porn, masturbation or another habit, at their own pace.

A tarn is a still mountain lake. Tarn keeps that feeling: one quiet place to check in, take a
minute when an urge hits, and see progress that never shames you.

## What it does

- **Landing page** at `/`, always white and light, with install and onboarding calls to action and,
  on larger screens, a QR code to install Tarn on an iPhone or Android phone.
- **Four step onboarding** at `/start`: name and age range (optional), Terms acceptance, goal (porn
  and masturbation tracked separately, or a custom goal with a weekly limit), a planning stretch
  and one daily intention.
- **Today**: greeting, day ring, stretch progress bar with milestone markers, today's intention,
  **Need a reset?**, a week of green ticks and soft crosses, one tap check in, and an install popup.
- **Calm**: full screen dusk lake, one minute of slow breathing (adjustable pace and length, optional
  ambient sound), notice the urge, one next step, then "Feeling any different?".
- **Journey**: streaks, milestones with generated badge art, a tick and cross calendar, resets you
  can edit, insights from your own entries, and sourced education.
- **Journal**: free writing, morning intention, evening reflection, weekly review, mood and ratings,
  search.
- **Profile**: photo, name and Edit profile; goals, intentions, appearance (match device, light,
  dark), install, reminders, support, privacy and data, terms.

## Privacy

Everything is stored in the browser's IndexedDB on the device. No account, no backend, no analytics,
no AI processing. Export, import and delete are in Profile. Details: [`docs/research-v1.md`](docs/research-v1.md)
section 8 and the in app Terms (`/terms`).

## GOONOMICS link

GOONOMICS (a separate project) sends people here with an opt in link:
`https://tarn-rehab.vercel.app/#from=goonomics&age=25-34&goi=640`. The fragment never reaches a server;
Tarn reads it once at startup, keeps it for the tab and removes it from the address bar
(`src/handoff.ts`). Only an age range and the GOI (as a note) can travel, and the GOI never sets a
goal or a severity.

## Run it

Requires Node 22.12+ or 24.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and UI tests
npm run build      # typecheck + production build into dist/ (with dist/sw.js)
npm run preview    # serve dist/
npm run art        # rebuild public/art and icons from assets-source/higgsfield
npm run og         # rebuild the social preview
npm run qr         # rebuild and verify the install QR
```

Deploy on Vercel as a static Vite app; `vercel.json` sets the SPA rewrite, a strict CSP and caching.
`SITE_URL` defaults to `https://tarn-rehab.vercel.app` (Open Graph tags and the QR).

## Docs

| File | What |
|---|---|
| `docs/research-v1.md` | Competitor matrix, user needs, medical evidence, privacy decisions |
| `docs/uiux-research-v1.md` | Interaction patterns, Apple HIG and PWA install guidance, urge science |
| `docs/brand-decision-v1.md` | Why the name Tarn, collisions checked, limits of that check |
| `docs/assets-v1.md` | Higgsfield generations, real credit spend, processing |
| `docs/uiux-qa-v1.md` | Viewports, checks, fixes, limitations |
| `docs/roadmap.md` | What waits, and why |
| `docs/nav-inspiration.jpg` | The iOS 26.4 tab bar reference used for the navigation |
| `docs/screens/` | Screenshots from the final QA run |

Tarn is a self directed habit tool, not medical care. In a crisis in the US, call or text 988.

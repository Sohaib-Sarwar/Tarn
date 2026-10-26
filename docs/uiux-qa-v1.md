# Tarn QA report (V1.1 and V1.2)

Run on 2026-10-25 and 26, Windows 11, Node 24.12, Chrome (desktop) driven by browser automation
against production builds (`vite preview`). Viewports were tested with exact size iframes on the
real build. No physical iPhone or Android device was available.

## Automated

`npm test`: **70 / 70 passing** (`src/lib/tarn.test.ts` logic, `src/App.test.tsx` UI).
`npm run build`: clean, including both TypeScript projects.

Covered: streak rules (stop, reduce with weekly limit, custom), midnight and daylight saving,
separate porn and masturbation goals, setbacks keeping history, editing and removing entries,
badges, consistency, insights thresholds, export and import round trip, corrupt and V1.0 data,
IndexedDB storage, reminders file, landing to onboarding with Terms acceptance, GOONOMICS fragment
handoff (and junk in it), Today check in and reset, the install popup (browser dialog from a tap,
"Not now" remembered), the calm flow and its "still difficult" path, the journal and search,
Profile edit, theme switching to dark, intentions, privacy and data sheet, five tab navigation,
the tick and cross calendar, and no `fetch`, XHR or beacon during core flows.

## Layout measurements (V1.2 build)

Each page was loaded at every size and checked for page level horizontal scroll, elements outside
the viewport, clipped text and controls smaller than 40 by 24 px.

| Pages | Sizes | Theme | Result |
|---|---|---|---|
| Today, Journey, Calm, Journal, Profile, Terms | 320×700, 360×800, 390×844, 430×932 | Light | No issues |
| Same | 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080, 844×390 and 932×430 (phone landscape), 640×400 (1280×800 at 200% zoom) | Dark | No issues |
| Landing | 1568 wide desktop, light and dark, every section | Both | Visually reviewed, no defects |

Calendar day cells in the week strip and month grid are 32 to 36 px circles plus their date label;
the whole cell is the button. They pass WCAG 2.2 target size (24 px minimum) but are below Apple's
44 pt recommendation on the narrowest phones, which is normal for a 7 column date grid.

## Fixed during QA (V1.1 and V1.2)

- Goal tabs order was random after reload (IndexedDB key order): goals now sort by creation.
- A long goal name pushed the second tab out of view: tabs now truncate with the full name kept for
  screen readers, and use tighter padding below 640 px so normal names fit at 320 px.
- Small buttons were 36 px tall: raised to 44 px; logo links and disclosures given 44 px targets.
- Calm opening repeated its headline in the subtitle; the update banner overlapped Calm's Close
  button: both fixed (the banner never shows on Calm).
- V1.0 data kept the old window title "Stillpoint": migrated to "Tarn" unless the person chose
  their own.
- Phone welcome landscape ended in a hard edge: replaced by the full bleed generated scene.
- Badge art from Higgsfield kept textured backdrops: cut out as clean circles; two plain badges
  were regenerated. Logo paper texture removed by a saturation cut.
- Bundle split so screens other than Today load on demand (main script 417 KB to 289 KB).

## PWA and installation

| Check | Result | When |
|---|---|---|
| Manifest fields (name, short_name, start_url `/today`, scope `/`, standalone, theme and background colors) | Valid | V1.1 and V1.2 builds |
| Icons 192, 512, maskable 512, Apple touch 180 load with the declared sizes | Yes | V1.1 (regenerated in V1.2 from the new logo) |
| Chrome fired `beforeinstallprompt` and the invitation offered the browser dialog | Yes, desktop Chrome | V1.1 build |
| Service worker update waits for "Refresh", then reloads with the new version | Yes | V1.1 build |
| Offline: server stopped, navigation to a new screen loaded from cache with records intact, a calm session saved | Yes | V1.1 build |
| The same offline and install checks on the V1.2 build | **Not re-run**: the preview servers were stopped by the environment for low memory before this step | |
| iPhone and iPad Add to Home Screen | Not tested on a device; the steps follow Apple's Share flow and current reporting on iOS 26 | |

The V1.2 service worker uses the same strategy as V1.1 (precache of hashed files, network first
for pages, cache first for assets, waiting updates); only the scope moved from `/monk/` to `/`.

## Other checks

- Keyboard: tab order follows the layout; focus ring 2 px forest outline is visible on every
  control; sheets trap focus and close with Escape.
- Reduced motion: the breathing circle stops scaling and uses a gentle opacity cue instead.
- Reduced transparency or more contrast: the glass tab bar becomes solid.
- Missing images: every generated image has an SVG fallback underneath.
- Disabled storage: falls back to memory with a visible notice (unit tested).
- Network: no request leaves the origin during the flows tested (resource timing and tests).

## Known limitations

- No physical device testing (iOS Safari, Android Chrome).
- Slow network conditions were not throttled; the cache first service worker makes repeat visits
  independent of the network.
- Terms text is a plain language draft, not reviewed by a lawyer.
- The name Tarn has not had a professional trademark search (see `brand-decision-v1.md`).

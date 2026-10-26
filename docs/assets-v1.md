# Tarn assets and Higgsfield ledger

## Budget history (honest record)

- The original project rule (from the first GOONOMICS brief) was the lower of 10% of the starting
  balance or 60 credits, with at most three paid generations. Starting balance 10.00 credits, so
  the ceiling was 1.00 credit and 3 calls.
- GOONOMICS 1.0 to 2.1 stayed inside it: 0.45 credits, 3 paid calls.
- GOONOMICS 3.0 (rank badges, Instagram kit) went beyond it at the owner's explicit request:
  2.85 credits, 19 paid calls. Balance after: 6.70.
- The Tarn V1.0 and V1.1 briefs said not to reset that budget, so V1.0 and V1.1 generated nothing.
- **Tarn V1.2:** the owner explicitly asked in their own words to "generate natural calmness
  images or background in higgsfield" and "regenerate the logo of app from higgsfield and related
  badges and images". That later, direct instruction was followed with a self imposed cap of
  3.00 credits.

| Item | Value |
|---|---|
| Balance before V1.2 | 6.70 credits (free plan) |
| Balance after V1.2 | 4.15 credits |
| **Spent in V1.2** | **2.55 credits across 17 paid calls** (Z Image, 0.15 each) |
| Refused, not charged | 1 (GPT Image 2.5 needs a paid plan) |
| V1.3 logo (owner asked to redesign it with Higgsfield) | 0.45 credits, 3 calls (three leaf options, option A chosen) |
| Balance now | **3.70 credits** |
| Project total so far | 6.30 credits across 42 paid calls |

## Every V1.2 generation

| Asset | Model | Aspect | Outcome | Credits |
|---|---|---|---|---|
| Dawn lake, wide | Z Image | 16:9 | Used: landing hero, Today card, final call to action | 0.15 |
| Dawn lake, portrait | Z Image | 9:16 | Used: same, on tall screens | 0.15 |
| Dusk lake, wide | Z Image | 16:9 | Used: Calm screen, landing calm section, dark mode Today | 0.15 |
| Dusk lake, portrait | Z Image | 9:16 | Used: same, on tall screens | 0.15 |
| Logo | GPT Image 2.5 | 1:1 | Refused (paid plan required), not charged | 0 |
| Logo | Z Image | 1:1 | Used: app icon, favicon, header mark | 0.15 |
| Badge: First Step, One Day Present, Three Day Anchor, One Week Rooted, Sixty Day Resolve, Ninety Day Journey, Half Year Grounded, One Year of Intention | Z Image | 1:1 | Used | 8 × 0.15 = 1.20 |
| Badge: Two Weeks Steady, Thirty Day Stillness (first tries) | Z Image | 1:1 | Came out as plain discs; replaced | 2 × 0.15 = 0.30 |
| Badge: Two Weeks Steady, Thirty Day Stillness (retries) | Z Image | 1:1 | Used | 2 × 0.15 = 0.30 |

Prompts are in `scripts/generate-art.sh`. No videos, upscales or text in images. Generation is a
development step only: the app never calls Higgsfield, and no user data (names, ages, GOI, journal,
history) was ever part of a prompt.

## V1.3 logo

| Asset | Model | Outcome | Credits |
|---|---|---|---|
| Leaf on a still water ripple (option A) | Z Image 1:1 | **Used**: logo, app icons, favicon, QR centre | 0.15 |
| Two overlapping leaves (option B) | Z Image 1:1 | Not used | 0.15 |
| Leaf with a lake inside (option C) | Z Image 1:1 | Not used, too detailed at icon size | 0.15 |

Prompts are in `scripts/generate-logo.sh`. The V1.2 sun and peaks logo is kept as
`assets-source/higgsfield/logo-v12-original.webp`. Icons now sit on a white tile.

## Storage and processing

| Path | What |
|---|---|
| `assets-source/higgsfield/*-original.webp` | Every original, archived as visually lossless WebP (quality 92), so nothing depends on Higgsfield URLs |
| `scripts/process-art.mjs` (`npm run art`) | Builds everything below from the originals |
| `public/art/dawn-*.webp`, `public/art/calm-dusk-*.webp` | Backgrounds, 1920 px wide or 1080 px tall, quality 74, slightly desaturated for restful contrast |
| `public/art/logo-192.webp`, `public/favicon.png`, `public/icons/*` | Leaf emblem cut from its backdrop by colour saturation, placed on a white tile; 192, 512, maskable 512 (20% safe padding), Apple touch 180, favicon 64 |
| `public/art/badges/<milestone>.webp` | Ten milestone pins, cut out as clean circles (largest saturated region, circular mask), 192 px |
| `public/og.jpg` (`npm run og`) | Social preview from the dawn scene and the logo |
| `public/qr-install.png` (`npm run qr`) | Install QR for the desktop landing; opens `https://tarn-rehab.vercel.app/?install=1`; leaf in the centre; checked to decode with jsQR |

Practice badges (Urge Surfer, Honest Reset, and so on) stay as SVG line glyphs, and every image has
an SVG fallback drawn in `src/components/Art.tsx`, so a missing file never leaves a blank space.

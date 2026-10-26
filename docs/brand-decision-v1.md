# Brand decision: Tarn

Date: 2026-10-25. **Decision: rename the habit app from STILLPOINT to TARN.** GOONOMICS stays the
name of the calculator; "Monk Mode" stays the name of the experience and its URL (`/monk`).

A tarn is a small, still mountain lake held in a basin carved by ice. It brings together the whole
art direction in one word: still water, mountains, dawn light, a place you walk to.

## Candidates checked

| Candidate | Search collisions | Same category apps | Domains (RDAP, registration only) | Verdict |
|---|---|---|---|---|
| Stillpoint (working name) | High | At least five: "Stillpoint: Anxiety & Panic" (a private tracker), a breathing and sleep app, a Product Hunt habit tracker, a focus blocker, "StillPoint: Begin Within" ([search](https://www.hunted.space/product/stillpoint), [App Store](https://apps.apple.com/app/id6767035539)) | stillpoint.app registered | Too crowded, real risk of confusion with a direct competitor |
| Serein | Medium | "Serein: Mindful Breathing", "Serein Breath", French "SereinApp" ([Product Hunt](https://www.producthunt.com/products/serein-mindful-breathing), [App Store](https://apps.apple.com/app/id6800484507)) | serein.app registered | Direct conflict |
| Avara | High | No app found, but a large US women's clothing retailer, Inc. 5000 listed ([BusinessWire](https://www.businesswire.com/news/home/20230815009321/en/Avara-Named-1-E-Commerce-Business-in-Inc.-5000-List-of-Fastest-Growing-Private-Companies)) | avara.app registered | Confusing in the US market |
| Monora | Low | None found | monora.com and monora.app registered (not resolving) | Weak meaning; reads like "monorail" |
| Stillora | Low | None found | stillora.com, stillora.app and getstillora.com all registered; stillora.co not registered | Clear meaning but the three registrations suggest someone may be preparing a launch; "-ora" invented names also feel templated |
| **Tarn** | Medium (a French department and river, a surname) | **None found** in App Store, Product Hunt or wellness searches | tarn.app and tarnapp.com registered (not resolving); quietarn.com not registered | **Chosen**: real word, four letters, easy to say ("try Tarn"), distinctive in the category, and it gives the logo a concept |

Method: web searches for each name with app, wellness and trademark terms, and RDAP lookups through
[rdap.org](https://rdap.org) checked against a control domain. RDAP shows registration only, not
whether a domain is for sale.

**Not legal clearance.** No search here replaces a trademark search by counsel. The USPTO search
system could not be queried from this environment, and a quick search finding nothing does not
mean a name is free. Before any paid launch, search USPTO (classes 9, 42, 44), EUIPO and UK IPO, and
check the App Store and Google Play for exact matches.

## Identity

- **Symbol:** a sun rising over two peaks, mirrored in a still lake. Three shapes, readable at 16 px.
- **Wordmark:** "Tarn" set in Newsreader, a calm serif, with Hanken Grotesk for interface text.
- **Palette:** cream `#F5F1E8`, ivory `#FAF8F2`, forest `#244B3A`, sage `#A7B99A`, moss `#788B68`,
  stone `#D8D4C8`, ink `#202720`, gold `#C6A66B`, plus two dusk tones for the Calm screen
  (`#1C2B25`, `#2C3F36`).
- **Voice:** short, warm, plain. "Showing up counts." "Keep what you learned."

## What did not change

URLs (`/monk/...`), the IndexedDB database name (`stillpoint`) and the export file format id
(`stillpoint-export`) are kept so nobody's saved data or bookmarks break. Exports are now named
`tarn-YYYY-MM-DD.json`.

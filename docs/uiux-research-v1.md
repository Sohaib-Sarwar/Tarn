# Tarn (Monk Mode) V1.1: UI/UX research

Research date: 2026-10-25. This builds on the competitor and evidence review in
[`research-v1.md`](research-v1.md) (20 products, feature matrix, medical sources) and adds what the
redesign needed: interaction patterns, platform guidance, install support and the evidence behind
the calm flow. Reddit and other logged in communities could not be read from this environment, so
user sentiment comes from store listings, aggregators and published studies only.

## 1. Interaction patterns in comparable apps

| Product | Onboarding | Choices on the home screen | Urge or calm entry | Streak and milestones | Barriers reported |
|---|---|---|---|---|---|
| QUITTR | Quiz style personalization, then paywall | Streak counter, pledge, many tabs | Panic button with front camera and messages | 90 day program, gamified | Subscription after trial ([App Store](https://apps.apple.com/us/app/-/id6532588521), [RecurDash](https://recurdash.com/subscription-pricing/quittr)) |
| Brainbuddy | Program intro | Daily exercises, streak, quizzes | Not a single entry in sources reviewed | 100 day program | "Requires a PREMIUM subscription to access all features"; a reviewer reports lockout after changing purchase settings ([App Store](https://apps.apple.com/us/app/brainbuddy-quit-porn-now/id726780077), [JustUseApp reviews](https://justuseapp.com/en/app/726780077/brainbuddy-quit-porn-forever/reviews)) |
| IronWill | Short, then tracker | Streak calendar, mood, urges | 10 coping techniques | Rank progression | A review reports streaks lost on reinstall ([Canopy roundup](https://canopy.us/blog/best-nofap-apps/)) |
| Migiri | Anonymous sign up | Kanjo daily check in, blocker | Guided exercise when a block fires | Milestone challenges | Subscription after trial ([App Store](https://apps.apple.com/app/id1551848949)) |
| I Am Sober | Pick habit, sober date | One counter, morning pledge, evening review | Not a panic tool | Milestones | Paid tier for groups and Face ID lock ([App Store](https://apps.apple.com/app/id672904239)) |
| Quitzilla | Add habit, date, money | Counters per habit | None | Trophies | Free with in app purchases ([App Store](https://apps.apple.com/app/id1533076568)) |
| NoFap (site) | Forum account | Forum | Community posts | Not in site copy | Peer forum, "not medical advice" ([nofap.com](https://nofap.com/)) |
| Fortify | Account | Streak, journal, coach | Emergency panic button | Streak | $12 a month or $89.99 a year per [Adapty](https://adapty.io/paywall-library/fortify/) |
| Loop Habit Tracker | None, add a habit | One list of habits with checkmarks | None | Habit strength score | Free, open source, offline ([loophabits.org](https://loophabits.org)) |
| Fabulous | Long guided "journey" | Routine timeline | Not a crisis tool | Journeys | Premium about $39.99 a year ([Nibble review](https://nibble-app.com/blog/fabulous-app-review)) |
| Headspace | Goal question, then content | "Today" with one recommended session | SOS style sessions in the library | Run streak | Subscription, 14 day trial ([Headspace](https://www.headspace.com/subscriptions)) |
| Serein: Mindful Breathing, Serein Breath | Minimal | Single breathing circle | Breathing first | Session count | Serein+ after 10 sessions ([Product Hunt](https://www.producthunt.com/products/serein-mindful-breathing), [App Store](https://apps.apple.com/app/id6800484507)) |
| Stillpoint: Anxiety & Panic | Private tracker | Mood and panic log | Six breathing and grounding techniques | Not stated | Free with in app purchases ([App Store](https://apps.apple.com/app/id6767035539)) |

Industry benchmarks for quiz style onboarding (not specific to this category): flows with a
paywall average 17.2 steps versus 12.4 without, per a [Lazyweb benchmark](https://www.lazyweb.com/research/are-onboarding-flows-with-a-paywall-longer)
that notes this is correlation only.

**What works and what we can do better**

1. The calmest apps (Headspace, Serein Breath, I Am Sober) put **one** recommended action on the
   first screen. Category apps tend to show counters, pledges, programs and community at once.
2. Panic buttons are the most visible differentiator in the porn recovery category, but they mostly
   open a library or motivational content. A **breathing first** calm flow with one next step is
   rarer and better matched to the evidence below.
3. Long onboarding quizzes and paywalls are common friction. We can reach the home screen in four
   short screens, with no account and no paywall.
4. Data loss on reinstall (IronWill review) is a real risk for local first apps. Export and an
   honest storage notice stay prominent in Profile.

## 2. Platform guidance used

| Topic | Guidance | Applied |
|---|---|---|
| Liquid Glass | "Forms a distinct functional layer for controls and navigation elements" that floats above content; "Don’t use Liquid Glass in the content layer"; "Use Liquid Glass effects sparingly"; the regular variant "blurs and adjusts the luminosity of background content to maintain legibility" ([Apple HIG, Materials](https://developer.apple.com/design/human-interface-guidelines/materials)) | Only the floating tab bar uses a translucent material; cards stay opaque; a solid fallback when `backdrop-filter` is unsupported or the user prefers reduced transparency |
| Tab bars | "Use a tab bar to support navigation, not to provide actions"; "Include tab labels"; single word labels; keep it visible across sections except modal views ([Apple HIG, Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)) | Four labeled tabs: Today, Journey, Calm, Profile. Calm is a destination, not an action button. The full screen calm exercise is modal, so the bar steps aside there |
| Touch targets | "A button needs a hit region of at least 44x44 pt" ([Apple HIG, Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)); WCAG 2.2 SC 2.5.8 sets 24 by 24 CSS px as the AA minimum ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)) | Every primary control is at least 44 px tall |
| Install criteria (Chrome) | HTTPS, a manifest with `name` or `short_name`, 192 px and 512 px icons, `start_url`, standalone style `display`, plus engagement: one click and 30 seconds on the page ([web.dev install criteria](https://web.dev/articles/install-criteria)) | Manifest and icons meet this; the custom invitation only appears when the browser actually fires the event |
| `beforeinstallprompt` | Experimental and non standard, not Baseline; call `preventDefault()`, keep the event, call `prompt()` from a user gesture ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)); Chromium only in practice ([Frontend Masters](https://frontendmasters.com/courses/pwas/install-button/)) | Captured once at startup, used only from the "Add to Home Screen" button, cleared after use |
| iOS and iPadOS | No `beforeinstallprompt`. Share, then Add to Home Screen. Since iOS 26 Safari opens a site added this way as a web app by default ("Open as Web App") ([heise](https://heise.de/-10749652)). Third party browsers gained Add to Home Screen in iOS 16.4; current Chrome and Firefox behavior is reported inconsistently ([Gadget Hacks](https://ios.gadgethacks.com/how-to/these-browsers-let-you-add-web-apps-and-bookmarks-your-iphones-home-screen-0385351/)) | iOS gets a short visual guide; Safari is the recommended path; no claims about other iOS browsers beyond "use the Share menu if it offers Add to Home Screen, otherwise open in Safari" |
| Reduced motion and transparency | Respect user settings; Apple notes glass changes with "reduce transparency or increase contrast" settings | `prefers-reduced-motion` stops the breathing circle from scaling (opacity cue instead); `prefers-reduced-transparency` and missing `backdrop-filter` get a solid bar |

## 3. Evidence behind the calm flow

| Technique | Evidence | Limits | How it appears in the app |
|---|---|---|---|
| Slow breathing with a longer exhale | [Balban et al. 2023, Cell Reports Medicine](https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/): five minutes a day of cyclic sighing (long exhales) improved mood and lowered respiratory rate more than mindfulness meditation in a one month remote RCT | Healthy volunteers, daily practice, not urges specifically | Default rhythm: in 4 s, out 6 s, no breath holds; pace adjustable; stop any time |
| Breathwork in general | [Fincham et al. 2023, Scientific Reports](https://doaj.org/article/21a326834cdb4a7fbd35bc10ec8509f0): small to medium effects on stress, anxiety and depression across RCTs (785 participants), most at moderate risk of bias | Heterogeneous studies | Offered as a way to slow down, never as a treatment |
| Urge surfing | [Bowen and Marlatt 2009](https://pubmed.ncbi.nlm.nih.gov/20025372/): brief mindfulness instructions did not lower urge intensity but people smoked fewer cigarettes over 7 days | Smokers, single study | "Notice the urge" step asks where it is felt; no promise that it disappears |
| Mindfulness and craving | [Meta-analysis of 17 RCTs, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10583418/): effect favors mindfulness (−0.70) but I² = 92% and low GRADE quality | Mostly substance use | Short and optional, not a program |
| If then plans and replacement activities | [Gollwitzer and Sheeran 2006](https://stafforini.com/works/gollwitzer-2006-implementation-intentions-and/): implementation intentions improved goal attainment (d ≈ 0.65 across 94 tests) | Many goal types, mixed quality | "Today's intention" and "Return to my intention" in the calm flow |
| Self monitoring | [Harkin et al. 2016](https://eprints.whiterose.ac.uk/91437/): monitoring progress improves goal attainment (d = 0.40) | Mostly health goals | One tap check in, optional "Feeling any different?" after the exercise |
| Environment and delay | Relapse prevention and CBT use stimulus control and coping plans ([Antons et al. 2022](https://doi.org/10.1556/2006.2022.00061)); no trial isolates "change rooms" or a specific delay length for this behavior | Indirect evidence | "Change your environment", "Put the device aside", "Take a short walk" are offered without timers that imply an urge ends at a set minute |
| Setbacks | Abstinence violation effect: shame after a lapse predicts more lapses ([PMC3296289](https://pmc.ncbi.nlm.nih.gov/articles/PMC3296289)) | Theory with clinical support | "Still difficult" never reads as failure; logging a setback is optional and separate |

## 4. Recommended changes (all implemented)

1. Four step onboarding: welcome, about you (optional name and age range), goal, intention. Home in
   under a minute.
2. Today shows a greeting, the day count, today's intention, one "Need a reset?" action, a three
   item progress row and one link to Journey. Everything else moved.
3. A dedicated full screen Calm flow: breathe for a minute, notice the urge, choose one next step,
   say how you feel. No questionnaire first.
4. Four tab floating navigation with a translucent material and a solid fallback; a slim rail on
   desktop.
5. Install invitation only after a check in or a finished calm session, platform aware, dismissible,
   remembered, with a permanent entry in Profile.
6. Journey holds progress, reflection and learning behind three segments.
7. An opt in bridge from GOONOMICS results that carries only an age range and the GOI as a note.

## 5. Evidence limitations

No trial tests an app like this for problematic pornography use or masturbation goals; the closest
content analysis found no app with efficacy evidence ([Henry et al. 2022](https://formative.jmir.org/2022/10/e39869)).
Breathing and mindfulness findings come mostly from stress and substance use research. The app
presents these as practices people can try and judge for themselves.

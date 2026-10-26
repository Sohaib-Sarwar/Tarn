# Roadmap: later, carefully

Kept out of the current version on purpose. Each item needs its own privacy review first.

| Idea | Why it waits | What would make it acceptable |
|---|---|---|
| Accountability partner | Sharing sensitive progress with another person needs consent on both sides | Person to person invitation with a generic status only (checked in or not), never habit details, revocable at any time |
| Encrypted backup across devices | Needs a server or a cloud folder and real end to end encryption | Client side encryption with a passphrase the person keeps; the server only ever sees ciphertext |
| Content blocking | Requires browser extensions or native apps and broad permissions | A separate, optional companion the person installs, never bundled |
| Push reminders | Needs a push service and identifiers | Web Push with a minimal, rotating subscription, or keep the calendar file approach |
| Guided programs | No evidence for fixed recovery timelines | Short, optional, evidence informed modules (for example urge surfing practice) with sources shown |
| Native apps | The PWA covers install and offline today | Only if a platform feature (widgets, Focus filters) clearly helps |
| Localization | Copy and sources are English only | Translate with care for the sensitive wording, keep sources per language |
| A custom domain | Tarn should not share a domain with GOONOMICS | Register a neutral domain, then update `SITE_URL`, the GOONOMICS `VITE_TARN_URL` and the Open Graph tags |

Not planned: an AI therapist or chatbot reading entries, a public community or leaderboard, ads,
analytics on intimate behavior, or any paid gating of the calm tools.

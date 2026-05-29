# Landing Page — "See Lira Actually Work" Experience

> **Version:** 1.0 — 2026-05-20
> **Purpose:** Design and rationale for adding a "Listen to a real call" / live demo experience to the Lira landing page, inspired by ada.cx's hero pattern. Includes hero CTA rename, login/signup strategy, and modal UX spec.
> **Audience:** Founders, Marketing, Frontend eng.
> **Status:** Reference & decision doc — no implementation yet.

---

## Table of contents

- [1. Why this matters](#1-why-this-matters)
- [2. What Ada actually does (verified)](#2-what-ada-actually-does-verified)
- [3. Recommended Lira approach](#3-recommended-lira-approach)
- [4. Hero CTA rename — options to choose from](#4-hero-cta-rename--options-to-choose-from)
- [5. Login & signup strategy](#5-login--signup-strategy)
- [6. The demo modal — UX spec](#6-the-demo-modal--ux-spec)
- [7. Content production — what to record](#7-content-production--what-to-record)
- [8. Implementation sketch (no code)](#8-implementation-sketch-no-code)
- [9. Phasing — what to ship first](#9-phasing--what-to-ship-first)
- [10. Open questions to resolve before building](#10-open-questions-to-resolve-before-building)

---

## 1. Why this matters

**Buyers don't read landing page copy — they look for proof.** Every AI support vendor claims "natural conversations, human-quality answers." The claim is meaningless until a visitor _hears_ it.

Ada figured this out and put a real recorded call on the hero. So did Sierra. So did Decagon. The pattern is now category convention, and Lira not having it is a credibility gap — _especially_ given our spec's core claim is "voice-native, picks up the phone, follows up on WhatsApp." If a visitor can't hear that within 5 seconds of landing on the page, the claim doesn't register.

**The strategic principle:** _show the product working before asking for an email._ Every minute a visitor watches/listens to Lira working raises their willingness to engage. The demo is feature-zero of the landing page, just like pricing is feature-zero of the product (see [COMPETITIVE_GAP_ANALYSIS_AND_ROADMAP.md](./COMPETITIVE_GAP_ANALYSIS_AND_ROADMAP.md), Section 4).

What this doc does **not** propose:

- An interactive AI sandbox on the landing page (build later — fragile, expensive to run, easy to abuse)
- Auto-playing audio (terrible UX; mobile blocks it anyway)
- Synthetic / fake demos (the moment someone catches one, trust evaporates — it must be real)

---

## 2. What Ada actually does (verified)

Verified from [ada.cx](https://www.ada.cx/) homepage on 2026-05-20:

| Element                     | What Ada does                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Primary hero CTA**        | **"Speak to an expert"** — not "Book a demo," not "Get started"                                                  |
| **Top-nav login**           | A bare login icon (no text label) at top-right — link exists but is visually downplayed                          |
| **Public signup**           | **None.** Self-serve signup is not offered. The only path in for new customers is "Speak to an expert."          |
| **"Listen to a real call"** | A heading + associated media element in the hero area. Plays a real recorded customer interaction.               |
| **Secondary CTA**           | A second "Speak to an expert" link further down the page, paired with a tagline ("Accelerate your ACX strategy") |
| **Other interactive demos** | No chat playground, no in-page product tour. The page sells with proof + expert contact, not self-exploration.   |

The takeaway: **Ada's funnel is high-friction by design.** They sell $70K–$300K+ contracts to enterprises that expect a human conversation. Self-serve would dilute their ACV.

**Lira is different on this dimension.** We're selling $500–$5K/mo to SaaS founders. Self-serve onboarding _is_ the wedge (see Roadmap doc, Gap 3). So we copy Ada's _proof_ mechanic ("Listen to a real call") and reject their _funnel_ (expert-only entry). We need both:

1. The "hear it working" video — borrow from Ada
2. Self-serve signup — what Ada doesn't have, and we should

---

## 3. Recommended Lira approach

### Three changes to the landing page hero

1. **Add a "Hear Lira in action" element** below or beside the headline. Clicking it opens a modal with a real, scripted-but-authentic call recording.
2. **Add a second secondary CTA** in addition to today's "Book a demo." Suggested: keep "Book a demo" but add **"Hear a real call"** or **"See Lira work"** as the visually paired action. (Final wording: see Section 4.)
3. **Add a Login link to the top nav**, kept visually subtle (text-only, not button-styled). No public "Sign up" yet — we manage signup via "Book a demo" / "Speak to an expert" for now, the same way Ada and Sierra do.

### Why this combination

- Visitors who arrive cold get **proof in under 10 seconds** (the demo modal)
- Visitors who are already convinced get **the booking path** (Book a demo)
- Existing customers get **a login link they can find** without scrolling
- Engineering scope is small: a modal, a video, a copy change. No new pages, no auth changes.

### What we are explicitly NOT doing yet

- Public signup form (defer until self-serve onboarding from Track 1 of the roadmap is ready)
- An interactive in-page chat with the real product (defer to Track 3 — too risky for a public demo without rate-limits, abuse-protection, and content moderation)
- A library of dozens of demo recordings (one great recording > ten okay ones)

---

## 4. Hero CTA rename — options to choose from

Today the only hero CTA is **"Book a demo"** (see [Navbar.tsx](../../../src/components/marketing/Navbar.tsx)). Two questions to answer:

**Question A.** Do we keep "Book a demo" or rename it?
**Question B.** Whatever we call the booking CTA, what do we call the _demo-video_ CTA?

### Options for the booking CTA (Question A)

Listed best-to-weakest in my opinion, with the rationale:

| Option                        | Tone                           | Notes                                                                                                                                      |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **"Speak to an expert"**      | Consultative, premium          | Ada uses this. Premium feel, suggests a real human conversation, removes the "salesy demo" implication. Best if we want to move up-market. |
| **"Talk to founders"**        | Personal, startup-credible     | Strong for early stage — names the actual conversation partner. Trust-building. Doesn't scale past ~20 demos/week.                         |
| **"Book a demo"** _(current)_ | Standard SaaS                  | Most familiar. Lowest information content. Easy to deprioritize when buyer is scanning.                                                    |
| **"See Lira in your stack"**  | Technical, integration-focused | Strong for SaaS engineering buyers; signals "we'll show how it fits your tools."                                                           |
| **"Start with an expert"**    | Onboarding-flavored            | Suggests you'll have help, not a sales pitch. Less defensive than "demo."                                                                  |
| **"Get a guided tour"**       | Soft, low-commitment           | Reduces friction but undersells the conversation.                                                                                          |
| **"Talk to sales"**           | Honest, direct                 | Some buyers respect the directness. Others hate it. Polarizing.                                                                            |

**My recommendation:** **"Speak to an expert"** as the primary booking CTA. Rationale: it matches the category convention (Ada, Sierra), positions Lira as premium-adjacent rather than scrappy, and the word "expert" implicitly promises the conversation will be useful (not a script-reading SDR).

### Options for the demo-video CTA (Question B)

| Option                          | What it signals                                                                |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **"Hear a real call"**          | Audio-only emphasis; mirrors Ada's "Listen to a real call." Direct, evocative. |
| **"Listen to Lira"**            | Personal — treats Lira as an agent, not a tool. Shorter.                       |
| **"See Lira at work"**          | More general — works whether the demo is voice, chat, or both.                 |
| **"Watch a real conversation"** | Most descriptive. Slightly verbose.                                            |
| **"Play sample call"**          | Functional. Less emotional.                                                    |
| **"Hear Lira handle a case"**   | Implies competence + a real scenario. Strong.                                  |

**My recommendation:** **"Hear a real call"** if the asset is voice-only, **"See Lira at work"** if we plan to add a text-based version later (Section 6.2 below).

### Final recommended combo

```
Primary CTA (right-aligned, dark fill button):     [ Speak to an expert ↗ ]
Demo CTA  (left of primary, ghost / outline):      [ ▷ Hear a real call ]
Login (top-right, text-only, small):                  Log in
```

---

## 5. Login & signup strategy

### Today's state

- **No login link** anywhere on the marketing site nav.
- **No public signup form.**
- The only path for any user is "Book a demo."

This is fine for the first 50 customers (every signup is a hand-held conversation), but it gets in the way once we want to do self-serve. It also confuses existing customers who land on the marketing site and can't find how to get back into the app.

### Recommended state (today → 60 days)

| Phase        | Login                                            | Signup                                                                                        | Reasoning                                                                                             |
| ------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Now**      | Add `Log in` link in top-right nav (subtle text) | No public form; "Speak to an expert" only                                                     | Solves the existing-customer pain immediately. Keeps signup high-touch while we hand-hold early ones. |
| **+30 days** | Same                                             | Add `Start free trial` button alongside `Speak to an expert`, but keep behind a waitlist gate | Captures intent we're currently losing. Waitlist lets us throttle while onboarding is rough.          |
| **+60 days** | Same                                             | Convert the waitlist to instant signup once Track 1 (self-serve) is shippable                 | Matches the Roadmap doc's Track 1 timing.                                                             |

### Where the login points

- `/dashboard` if the user has a session cookie
- `/login` otherwise (an existing route — see [src/App.tsx](../../../src/App.tsx))

### Visual treatment

Login should be **understated** — text-only, sans-bg, sans-arrow, smaller than the primary CTA. The hierarchy in the nav must remain:

```
(Logo)   Home  Features  Resources  Careers  Blog        Log in   [ Speak to an expert ↗ ]
```

Login looks like a utility link; the booking CTA remains the visual anchor. This mirrors Ada exactly.

---

## 6. The demo modal — UX spec

### 6.1 Trigger

The "Hear a real call" element in the hero. Two visual treatments to consider:

**Option A — Pill button**

```
[ ▷ Hear a real call ]
```

Pros: minimal, doesn't disrupt hero layout. Cons: easy to miss.

**Option B — Inline card with thumbnail + waveform**

```
┌────────────────────────────────────────────────┐
│  ▷  Hear a real call                           │
│     ════════════╤═══════════  0:00 / 1:47     │
│     Ashley · Customer · Payment dispute        │
└────────────────────────────────────────────────┘
```

Pros: communicates "this is a real call" before the click; the waveform + duration + scenario create curiosity. Cons: more real estate, more design work.

**Recommendation:** Ship Option A in week 1 (pill button). Upgrade to Option B in week 3–4 once we have analytics on click-through and the recording is final.

### 6.2 Should the modal offer a choice (voice vs text)?

The user raised this directly. Two patterns:

**Pattern 1 — Direct play (recommended for v1)**

Click "Hear a real call" → modal opens → call starts playing immediately (or with a single play button if autoplay is blocked).

- Pros: zero friction, fast to ship, mirrors Ada
- Cons: visitor can't pick text vs voice; we serve one experience

**Pattern 2 — Selector first**

Click → modal opens with two cards: **"Listen to a voice call"** | **"Read a chat conversation"** → visitor picks → that media plays/displays.

- Pros: serves both buyer personas (a CX leader who'll listen vs an engineer who'll scan a transcript), demonstrates omnichannel
- Cons: every click adds a decision tax; some visitors bounce at the choice

**My recommendation:** Ship Pattern 1 with voice only for v1. If voice is the differentiator we claim it is, lead with it. **Always include a transcript directly below the audio player** in the modal — that solves the "engineer wants to scan" need without forcing a selector decision. In v2 (week 6+), add a "Watch a chat demo" toggle inside the same modal if data shows visitors want it.

### 6.3 Modal anatomy (v1)

```
┌─────────────────────────────────────────────────────────────┐
│                                                          ✕  │
│   Hear Lira handle a real payment dispute                   │
│   Conversation with Ashley · Recorded · 1:47                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  ▶  ────────────────────●─────────  1:23 / 1:47    │  │
│   │                                                      │  │
│   │  [Captions: ON]   [1x ▾]   [Download transcript]   │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Live transcript                                           │
│   ───────────────────────────────────────────────────       │
│   Lira:    Hi Ashley, this is Lira. How can I help you      │
│            today?                                           │
│   Ashley:  My transfer of $2,000 has been pending for       │
│            three days. Can you tell me what's going on?     │
│   Lira:    Of course — I'm pulling up your transaction      │
│            now. ... [highlighted as it plays]               │
│   ...                                                       │
│                                                             │
│   ─────────────────────────────────────────────────         │
│   Want to see Lira on your stack?  [ Speak to an expert ↗ ] │
└─────────────────────────────────────────────────────────────┘
```

Key UX details:

- **Click-to-play (no autoplay).** Mobile blocks autoplay; desktop autoplay annoys users.
- **Captions on by default.** Many visitors will be at work, no headphones.
- **Live-scrolling transcript** below the player, with each line highlighting as it's spoken. This is _the_ feature that separates a good demo from a great one — engineers reading it can scan while audio plays.
- **Download transcript** link → plain `.txt` or `.pdf`. Procurement & technical buyers love this.
- **CTA inside the modal** at the bottom — visitor who just heard a great call has highest intent in the entire funnel. Capture it.
- **Keyboard:** `Esc` closes, `Space` play/pause, `←` `→` seek 5s.
- **Focus trap** while modal is open (accessibility).
- **No backdrop scroll** while modal is open.

### 6.4 What the modal MUST NOT do

- Auto-play with sound
- Open a new tab
- Require an email gate to play
- Embed a generic YouTube player with the YouTube logo
- Force the visitor to download the file
- Play synthetic / regenerated audio without disclosing it

### 6.5 Mobile considerations

- Modal becomes a full-screen sheet on mobile
- Transcript is collapsible (defaults to collapsed; tap to expand)
- Audio waveform replaces with a simpler progress bar
- The bottom CTA is sticky so it's visible whatever the scroll position

---

## 7. Content production — what to record

This is the part that most teams underinvest in. **The recording is the asset.** Treat it like a TV ad, not a demo dump.

### 7.1 Who is "Ashley"

Ada's recording uses a customer character ("Ashley" in the user's example) to humanize the demo. Two options for Lira:

**Option A — Real customer.** Record a real call (with explicit, written consent) from a design partner. Pros: unimpeachable authenticity. Cons: needs design partner sign-off, harder to script, may include PII we have to redact.

**Option B — Actor-recorded scenario based on real call patterns.** Hire a voice actor for the customer side. Real Lira on the AI side. Pros: full control over scenario, no PII, can re-record cleanly. Cons: must be disclosed somewhere (`Recording recreated for clarity`) to avoid trust damage if a journalist or buyer asks.

**Recommendation:** Start with **Option B**. Move to **Option A** when we have 3+ design partners willing to be named publicly. Both options use the _real_ Lira AI on the assistant side — never script the AI side.

### 7.2 The scenario

The scenario must be **specific, emotionally legible, and finish in resolution**. Generic "what's your return policy" calls are forgettable.

Best-in-class scenarios for a SaaS support agent:

| Scenario                                            | Why it lands                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Payment failed for a trial → conversion at risk** | Hits the lifecycle pitch directly. Shows proactive context.                                 |
| **API error code customer can't decode**            | Shows technical depth without being dry.                                                    |
| **Frustrated customer demanding cancellation**      | Shows tone, de-escalation, retention attempt. Highest emotional payoff.                     |
| **WhatsApp followup after web chat**                | Shows the omnichannel claim concretely. Strongest geographic-wedge story.                   |
| **Voice + screenshot together**                     | Shows Visual Intelligence pillar — but we're not shipping that yet, so defer this scenario. |

**Recommended first scenario:** payment failed → trial conversion at risk. It is the SaaS lifecycle pitch in one clip.

### 7.3 Length

**90 to 120 seconds.** Long enough to demonstrate competence; short enough that visitors finish it. Anything over 2 minutes loses 80% of viewers by the end. Cut ruthlessly.

### 7.4 Scripting boundaries

Script:

- The customer's lines, the scenario, the system state the AI sees
- The intro card ("Recorded with Lira's actual production model")
- The end card ("Want to see this in your stack? Speak to an expert.")

Do not script:

- The AI's responses. **Let the real Lira respond live.** If she fumbles, re-record the customer line, not the AI line. The point is to show what she actually does. (If the model genuinely fumbles repeatedly, that's a quality signal we should fix in the product before publishing.)

---

## 8. Implementation sketch (no code)

A rough shape so engineering can scope. Files referenced below already exist in the repo.

### 8.1 Files to touch

| File                                                                                | Change                                                                                   |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [src/components/marketing/Navbar.tsx](../../../src/components/marketing/Navbar.tsx) | Add `Log in` link; rename CTA from "Book a demo" → "Speak to an expert" (after decision) |
| [src/pages/LandingPageV4.tsx](../../../src/pages/LandingPageV4.tsx)                 | Add the "Hear a real call" trigger in the hero area; add modal state                     |
| **NEW** `src/components/marketing/DemoCallModal.tsx`                                | The modal: audio player + transcript + CTA                                               |
| **NEW** `public/landing/demo-call-ashley.mp3`                                       | The recorded audio asset                                                                 |
| **NEW** `public/landing/demo-call-ashley.vtt`                                       | WebVTT captions for the audio (drives live transcript)                                   |

### 8.2 Component shape

```
DemoCallModal
├── Header (title, scenario, duration)
├── AudioPlayer
│   ├── <audio src="demo-call-ashley.mp3"> with <track> for captions
│   ├── Custom play/pause, scrub, speed, captions toggle
│   └── Emits `currentTime` to TranscriptScroller
├── TranscriptScroller
│   ├── Reads parsed VTT cues
│   ├── Highlights the active cue as audio plays
│   └── Click a line → seek audio to that cue
├── Disclosure footer ("Recreated for clarity, AI responses from production Lira")
└── CTAFooter (Speak to an expert button)
```

### 8.3 Data flow

- VTT file is the single source of truth for both captions and transcript
- Audio element drives `currentTime` → TranscriptScroller listens and highlights
- Clicking a transcript line sets `audio.currentTime = cue.startTime`
- No backend, no fetch, no auth — purely static assets

### 8.4 Analytics events to fire

- `demo_modal_opened` — triggered when modal opens
- `demo_audio_started` — first play
- `demo_audio_completed` — finished 100%
- `demo_audio_dropoff` — fired on close with `percentage` payload (where they left)
- `demo_cta_clicked` — fires when the in-modal "Speak to an expert" is clicked
- `demo_transcript_downloaded` — if we ship that

These tell us: how many open it, how many finish, where they drop off, conversion from modal-open to expert-booked.

### 8.5 Performance

- Audio file: target < 1.5 MB (96 kbps mono is enough for speech)
- Preload `metadata` only, not the audio body (saves bandwidth on every landing page hit)
- Lazy-mount the modal component (don't ship its code in the hero bundle)

---

## 9. Phasing — what to ship first

### Week 1 — Minimum viable demo

- [ ] Decide booking CTA name (Section 4). Update Navbar.
- [ ] Add `Log in` link to nav (text-only, top right).
- [ ] Record + edit the call asset (Section 7). 90–120s. WebVTT captions.
- [ ] Build `DemoCallModal` component.
- [ ] Add pill trigger ("Hear a real call") to the hero in `LandingPageV4`.
- [ ] Ship.

### Week 2 — Polish and analytics

- [ ] Add the analytics events (Section 8.4).
- [ ] A/B test trigger copy: "Hear a real call" vs "See Lira at work" vs "Listen to Lira."
- [ ] Add the transcript download link.
- [ ] Mobile sheet polish.

### Week 3–4 — Upgrade

- [ ] Replace pill trigger with Option B (waveform card, Section 6.1) once analytics show >5% click-through.
- [ ] Add a second scenario if the first has high engagement: e.g., WhatsApp follow-up flow.
- [ ] Add "Watch a chat demo" toggle inside the modal (Section 6.2 Pattern 2 evolution).

### Week 6+ — Real customer

- [ ] Replace the actor-recorded asset with a real customer recording (Section 7.1 Option A).
- [ ] Add the customer's logo and name to the modal.

---

## 10. Open questions to resolve before building

1. **Which booking CTA name do we ship?** (Section 4 — my recommendation: "Speak to an expert")
2. **Which scenario do we record first?** (Section 7.2 — my recommendation: payment-failed-trial-at-risk)
3. **Do we have a voice actor in mind, or should we use a real design partner?** (Section 7.1)
4. **Who owns producing the recording?** This is the hardest unspoken question — a great recording needs a director, not just an engineer. Identify the owner before scoping the modal work.
5. **Is "Lira" the name we want the AI to introduce herself as in the call?** (Branding consistency check.)
6. **Do we add the Login link only on marketing pages, or globally?** (Recommendation: only marketing — the app shell already has its own nav.)
7. **What page does "Speak to an expert" route to?** Options: (a) current `/book-demo` page kept, just renamed link; (b) build a new lighter-weight contact page with scheduler embed. Recommendation: keep `/book-demo` for now, rename later if conversion data demands it.

---

## 11. References

- [ada.cx](https://www.ada.cx/) — the inspiration source (verified 2026-05-20)
- [sierra.ai](https://sierra.ai/) — similar pattern, more enterprise-coded
- [COMPETITIVE_GAP_ANALYSIS_AND_ROADMAP.md](./COMPETITIVE_GAP_ANALYSIS_AND_ROADMAP.md) — strategic context; this doc operationalizes the "show, don't tell" principle inside the landing-page funnel
- [Navbar.tsx](../../../src/components/marketing/Navbar.tsx) — current nav implementation
- [LandingPageV4.tsx](../../../src/pages/LandingPageV4.tsx) — current hero implementation

_— End of document. Update when the recording is published, when the CTA name is finalized, or when analytics tell us to change the trigger treatment._

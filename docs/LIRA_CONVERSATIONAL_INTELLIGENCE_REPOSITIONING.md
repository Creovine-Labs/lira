# Lira — Repositioning as a Conversational Intelligence Platform

**Date:** April 21, 2026
**Status:** Strategy — pre‑implementation
**Author:** Engineering + Product
**Decision owner:** Founder / CEO

---

## 0. TL;DR

1. **Reposition Lira as a Conversational Intelligence (CI) platform** — one engine that hears, understands, and acts on every business conversation. Customer Support is the **go‑to‑market wedge** in the hero. Sales and Meetings are supporting pillars.
2. **Interviews are being spun out** into a separate product (own brand, own domain, own app) and must be **fully removed** from the main Lira surface — landing page, product nav, app shell, onboarding, SEO metadata, routes, API client code paths.
3. Landing page gets a new hero: a **hub‑and‑spoke animation** with **"Conversational Intelligence"** at the center, branches radiating to **Customer Support**, **Sales**, **Meetings**, **Knowledge** — explicitly **no interviews**.
4. Onboarding flow gets a new **"What are you here for?"** step (Support / Sales / Meetings) and defaults the rest of the flow accordingly. No questions assume meeting‑first anymore.
5. Homepage (signed‑in dashboard) gets a **module picker** on first load when no module is active, with Customer Support highlighted.
6. **Do not add Pro/pricing badges anywhere** until monetization is decided.

---

## 1. What is a Conversational Intelligence Platform?

### Definition (industry)

A Conversational Intelligence (CI) platform captures, transcribes, analyzes, and **acts on** business conversations — calls, meetings, chats, tickets, emails — to drive revenue, service, and operational outcomes. It combines:

- **Speech‑to‑text + diarization** (who said what, when)
- **NLU** (intent, entities, sentiment, topics)
- **LLM reasoning** (summarization, extraction, Q&A, next‑best‑action)
- **Action execution** (create tickets, update CRM, route escalations, send replies)
- **Memory / grounding** (org knowledge base, history, RAG)
- **Analytics** (trends, coaching, KPIs)

### Category landscape (2026)

| Company               | Core wedge             | Expanded into                                  | What Lira learns from them                                                            |
| --------------------- | ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Gong**              | Sales call recording   | Forecasting, coaching, AI agents for revenue   | Positioning "Revenue AI OS" — one platform, many personas. Strong thought leadership. |
| **Observe.AI**        | Contact‑center QA      | Real‑time agent assist, autonomous voice agent | Support‑first CI positioning — a direct analogue for what we're doing.                |
| **Cresta**            | Real‑time agent assist | Post‑call analytics, coaching                  | Proves the "real‑time + post‑call" pipeline is sellable.                              |
| **Intercom (Fin)**    | Customer messaging     | AI agent that resolves tickets autonomously    | Customer‑support‑first narrative with AI agent proof.                                 |
| **Ada / Forethought** | Support automation     | Workflow, knowledge grounding                  | Knowledge‑grounded AI agent playbook.                                                 |
| **Avoma / Fireflies** | Meeting notes          | Coaching, pipeline insights                    | Entry‑level CI; the market we're leapfrogging.                                        |
| **Dialpad Ai**        | Unified comms          | CI layered on calls, meetings, messaging       | "Communications + Intelligence" bundling.                                             |

### Relevant open‑source references (signals, not dependencies)

- **Pipecat / LiveKit Agents** — realtime voice agent patterns; pipelines for STT → LLM → TTS with tool use.
- **Rasa Pro (CALM)** — conversation‑driven NLU combined with LLM planning; useful reference for our agent state machines.
- **LangChain / LlamaIndex** — RAG patterns for grounding responses in org knowledge.
- **Vapi / Retell** — voice‑first agent frameworks; reinforce that voice AI + tool use is now the expected surface.
- **Chatwoot** (open‑source help desk) — reference for ticket data model and omnichannel inbox when building our support workspace.

**Insight:** The industry narrative has shifted from "we record conversations" to **"we operate your conversations."** Lira's architecture (Nova Sonic realtime + Nova Lite reasoning + org knowledge + tool use) is already aligned with this. The marketing has not caught up yet.

---

## 2. Lira's positioning statement (proposed)

> **Lira is the Conversational Intelligence platform for teams that live on conversations.**
>
> Deploy an AI employee across your customer support, sales calls, and meetings. One brain, one memory of your business — listening, responding, and taking action wherever your team talks.

**Customer Support leads the narrative** because:

- It is the most mature paid‑AI use case (25.8% CAGR, $47B by 2030)
- Fastest time‑to‑value — a customer can plug in a chat widget + portal and see resolutions in hours
- Easiest demo — no meeting to schedule, no sales cycle to observe
- Most defensible differentiator — most CI tools listen, Lira **responds and resolves**

**Sales + Meetings** are supporting pillars, shown after the hero, to signal platform breadth.

**Interviews** — removed from the platform narrative entirely.

---

## 3. Landing page redesign

### 3.1 Current state (problems)

- Hero headline: _"Your AI in every room. Nothing gets left behind."_ — meeting‑first.
- Hero widget: paste a Google Meet link — meeting‑first.
- `MidCTA` mentions "meetings, interviews, sales calls, customer support" — includes interviews.
- FAQ has a dedicated "How does the AI Interview feature work?" question.
- SEO meta `<title>`, description, keywords, structured data — all list interviews prominently.
- Nav mentions `/products/interviews`.

### 3.2 Target state

**Hero:**

- Headline (proposed): **"Every conversation. Intelligently handled."**
- Sub: "Lira is a Conversational Intelligence platform. Deploy an AI agent that answers your customers, coaches your sellers, and runs your meetings — grounded in your knowledge."
- Primary CTA: "See it handle support" (opens the demo portal at `demo.liraintelligence.com/support`)
- Secondary CTA: "Start free"
- **No meeting‑link input in hero** — move it down, under the Meetings pillar section

**Hero animation (hub‑and‑spoke):**

- Center node: pulsing **"Conversational Intelligence"** badge with Lira logo
- 4 branches radiating outward (animated as lines that draw in on scroll/load):
  1. **Customer Support** — icon of chat bubble / headset, pulsing dot at the end
  2. **Sales** — icon of rising chart
  3. **Meetings** — icon of camera / call
  4. **Knowledge** — icon of book / brain
- Each branch ends in a small card showing a one‑line micro‑demo (e.g. "Resolved ticket #2841 — customer's refund processed")
- CSS‑only (no heavy JS); use SVG + `stroke-dashoffset` animation + `prefers-reduced-motion` guard
- On mobile: branches collapse into a vertical stack

**Diagram (corrected — hub in the middle, spokes radiate outward):**

```
                     ┌────────────────────┐
                     │  Customer Support  │ ← primary, largest card
                     └──────────▲──────────┘
                                │
 ┌──────────┐                 ┌────┴─────────┐                 ┌─────────────┐
 │  Sales   │ ◀───────────┤ Conversational  ├───────────▶ Knowledge Base  │
 └──────────┘                 │ Intelligence    │                 └─────────────┘
                                │ (Lira hub)      │
                                └────┬─────────┘
                                     │
                              ┌─────▼──────┐
                              │  Meetings  │
                              └───────────┘
```

**Sections after hero (in order):**

1. **Hub‑and‑spoke animation** (described above) — visual anchor for "one platform"
2. **Customer Support pillar** (largest) — live demo (embed of `demo.liraintelligence.com/support` in an iframe preview), resolution stats, integrations (Slack, Linear, HubSpot, Salesforce, Microsoft 365)
3. **Sales pillar** — invisible overlay desktop app screenshots, CRM sync, objection coaching
4. **Meetings pillar** — Google Meet bot, paste‑link widget (relocated here), transcripts + action items
5. **How it works** — 3 steps: Connect your stack → Ground Lira in your knowledge → Lira handles conversations
6. **Integrations grid** — AWS (Nova Sonic), Slack, Google Workspace, Microsoft 365, HubSpot, Salesforce, Linear, Jira, Zendesk
7. **Security & trust** — encryption (TLS 1.2+, AES‑26), OAuth 2.0 PKCE, data ownership, GDPR, OWASP Top 10 alignment. **Do NOT list SOC2 until an audit is actively in progress with a dated timeline.** "Planned" certifications are a red flag for enterprise buyers — either omit entirely or wait for "SOC2 Type I audit in progress, completion Q# 20##."
8. **Testimonials** — (we can seed Nimbus as the first)
9. **FAQ** — drop interview Q&A, add support Q&A
10. **Final CTA** — "Start with Customer Support — free"

### 3.3 Files to change

| File                                        | Change                                                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/LandingPage.tsx`                 | New `Hero`, new `HubAndSpokeAnimation`, reordered sections, remove `MidCTA` interview mention, replace `MeetingDemo` placement, update `FAQ` items, remove `ProductInterviews` mentions |
| `src/pages/ProductInterviewsPage.tsx`       | **Delete** (spun out to separate product)                                                                                                                                               |
| `src/pages/MarketingLayout.tsx` / nav links | Remove `/products/interviews` link                                                                                                                                                      |
| `src/app/router/index.ts`                   | Remove `productInterviews` route constant                                                                                                                                               |
| `src/App.tsx`                               | Remove `ProductInterviewsPage` route                                                                                                                                                    |
| `index.html` (meta, structured data)        | Drop "interviews" from title/desc/keywords/featureList                                                                                                                                  |
| `seo-prerender.cjs`                         | Remove `/products/interviews` entry; update other pages' descriptions                                                                                                                   |
| `public/sitemap.xml`                        | Drop `/products/interviews` URL                                                                                                                                                         |
| `src/components/SEO.tsx` defaults           | Update description copy                                                                                                                                                                 |

---

## 4. Onboarding flow updates

### 4.1 Current state (`src/pages/OnboardingPage.tsx`)

- Copy is meeting‑centric ("One platform for every meeting, every decision, every team.")
- No "what do you want to do first?" step — assumes the user came for meetings
- New users land on the dashboard and see a Google Meet deploy card

### 4.2 Proposed new step: **"What brings you to Lira?"**

After org creation, before hitting the dashboard:

```
┌────────────────────────────────────────────────────────┐
│  What would you like to set up first?                  │
│                                                        │
│  ○ Customer Support    (default, highlighted)          │
│    Launch an AI support agent — chat, portal, email    │
│                                                        │
│  ○ Sales Coaching                                      │
│    Real-time objection handling + CRM auto-fill        │
│                                                        │
│  ○ Meeting Intelligence                                │
│    Transcribe, summarize, and act on meetings          │
│                                                        │
│  ○ Not sure yet — show me around                       │
│                                                        │
│     [ Continue ]                                       │
└────────────────────────────────────────────────────────┘
```

### 4.3 Routing after choice

| Choice               | Next route                                           |
| -------------------- | ---------------------------------------------------- |
| Customer Support     | `/support/activate` (the existing activation wizard) |
| Sales Coaching       | `/dashboard` with sales‑coaching card featured       |
| Meeting Intelligence | `/dashboard` with meeting deploy bar featured        |
| Not sure             | `/dashboard` with all three module tiles visible     |

**Where to store the choice — per user, not per org.** The preference is used to tailor _each individual's_ dashboard and routing; teammates joining an existing org may be there for a different reason than the org owner. Store on the user profile:

```ts
user.preferred_module: 'support' | 'sales' | 'meetings' | 'unsure' | undefined
```

Fallback order when deciding what to feature for a given user:

1. `user.preferred_module` (if set)
2. `org.onboarding_primary_module` (soft default for new members, who are still asked the question the first time they land)
3. Generic modules overview (no preference either way)

New members joining an existing org are prompted with the same "What brings you to Lira?" step the first time they hit the dashboard — their answer populates `user.preferred_module` without touching the org's default.

Used later to:

- Default the dashboard layout per user
- Route each user to the right first‑run experience
- Personalize in‑app messaging and email copy

### 4.4 Copy changes in onboarding

Replace meeting‑first phrasings:

| Old                                                                           | New                                                                     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| "One platform for every meeting, every decision, every team."                 | "One platform for every conversation your business has."                |
| "Your organization is ready. Connect your meetings and let Lira get to work." | "Your workspace is live. Let's set up your first module."               |
| "tasks, meeting notes, and notifications will flow to…"                       | "tasks, summaries, and notifications will flow to…"                     |
| "Lira uses this to understand your organization's context during meetings…"   | "Lira uses this to understand your business across every conversation…" |

---

## 5. Dashboard / Homepage updates

### 5.1 Current state

`DashboardPage.tsx` shows a `DeployHeroBar` (Google Meet deploy) at the top — meeting‑first UX.

### 5.2 Proposed

Replace with a **Modules Overview** section:

```
┌────────────────────────────────────────────────────────────┐
│  Your Lira workspace                                       │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Support     │  │    Sales     │  │  Meetings    │     │
│  │  ● Active    │  │  Not set up  │  │   Active     │     │
│  │  12 tickets  │  │              │  │  3 today     │     │
│  │  [ Open ]    │  │  [ Set up ]  │  │  [ Open ]    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

- Each tile shows: module name, status (Active / Not set up), a headline metric, and a CTA
- Below the tiles, dynamic content based on active modules (ticket queue for support, recent meetings, etc.)
- `DeployHeroBar` moves **inside** the Meetings tile (expanded view)

---

## 6. Interviews — full removal checklist

Because interviews are becoming their own product with their own codebase/domain, we must fully remove the concept from the main Lira frontend. **Backend endpoints can stay for now** (data preservation), but every frontend reference must go.

### 6.1 UI pages

| File                                           | Action |
| ---------------------------------------------- | ------ |
| `src/pages/ProductInterviewsPage.tsx`          | Delete |
| `src/pages/InterviewsPage*.tsx` (if any)       | Delete |
| `src/pages/OrgRolesPage.tsx` (interview roles) | Delete |
| `src/pages/OrgInterview*.tsx`                  | Delete |
| `src/features/interview/**`                    | Delete |

### 6.2 Routes & nav

| File                                | Action                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/router/index.ts`           | Remove `orgInterviews`, `orgInterviewRole`, `orgInterviewCreate`, `orgInterviewEdit`, `orgInterviewDetail`, `productInterviews` |
| `src/App.tsx`                       | Remove any `<Route>` elements for those paths                                                                                   |
| `src/components/shell/AppShell.tsx` | Remove interview nav links (if any)                                                                                             |

### 6.3 Store & API client

| File                        | Action                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/store/index.ts`    | Remove `InterviewSlice`, `useInterviewStore`, all interview state                                                                     |
| `src/services/api/index.ts` | Remove `Interview*` types, `listInterviews`, `createInterviewRecord`, etc. (keep backend endpoints untouched; just stop calling them) |

### 6.4 Landing / marketing copy

| File                                                                                                             | Action                                                                |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `index.html`                                                                                                     | Remove interview keywords from `<meta>`, structured data feature list |
| `public/sitemap.xml`                                                                                             | Drop `/products/interviews`                                           |
| `src/pages/LandingPage.tsx` FAQ                                                                                  | Remove AI interview question                                          |
| `src/pages/LandingPage.tsx` MidCTA                                                                               | Drop "interviews" from the list                                       |
| `src/pages/BlogPage.tsx`, `ResourcesPage.tsx`, `TutorialsPage.tsx`, `TermsOfServicePage.tsx`, `SecurityPage.tsx` | Remove any mention of interviews                                      |
| `seo-prerender.cjs`                                                                                              | Remove/update interview‑mentioning descriptions                       |
| `src/pages/DemoSitePage.tsx` (Nimbus site)                                                                       | Remove if it mentions interviews                                      |

### 6.5 Analytics / usage counters

| File                                              | Action                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/api/index.ts` `DashboardStats` etc. | Remove `interviews_total`, `interview_evaluations` keys from types that the frontend reads; or keep the types and stop rendering them |

### 6.6 Demo & launch pages

| File                                                                                                                  | Action                                             |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/pages/LaunchDemoPage.tsx`                                                                                        | Remove interview scene                             |
| `docs/LIRA_CINEMATIC_LAUNCH_SCRIPT.md`, `docs/LIRA_LAUNCH_VIDEO_SCRIPT.md`, `docs/INTERVIEW_PRODUCT_DOCUMENTATION.md` | Keep as archive; don't delete — they're historical |

### 6.7 Testing checklist after removal

- [ ] TypeScript compiles clean (`npx tsc --noEmit`)
- [ ] ESLint clean
- [ ] No dead imports
- [ ] 404 check: `/products/interviews`, `/org/roles`, `/org/interviews/:id` all redirect to `/404` or home
- [ ] Dashboard stats render without interview counters
- [ ] Landing page has no "interview" string anywhere (`grep -ri interview src/pages/LandingPage.tsx`)

---

## 7. Central custom domain (from previous discussion — recap)

A new **Domains** tab in `OrgSettingsPage` storing `custom_domain` once, used across:

- **Support Activation** portal step → auto‑switch toggle to Custom if org has a domain set
- **Org Email** → pre‑fill sending domain field
- **(Future) Sales portal, Knowledge site** → same source of truth

Shape:

```ts
org.profile.custom_domain: string | undefined
org.profile.custom_domain_verified: boolean
org.profile.custom_domain_verified_at: ISO string | undefined
```

This belongs in **Phase 1** of this repositioning effort — it's foundational for the "one platform, one brand" story.

---

## 8. Phased implementation plan

### Phase 0 — Clean up (this sprint)

1. Remove `Pro` badge from portal URL toggle ✅ (already done)
2. Graceful 404 empty state for `/org/email` ✅ (already done)

### Phase 1 — Interviews removal

1. Delete interview pages, routes, store slice, features (no feature‑flag — git history is the archive)
2. Update SEO metadata, sitemap, structured data
3. Delete `ProductInterviewsPage`
4. Update FAQ, MidCTA, all copy references
5. **Add explicit redirects** to avoid broken bookmarks and preserve SEO equity:
   - `/products/interviews` → `/` (301)
   - `/org/roles` and `/org/roles/*` → `/dashboard` (301)
   - `/org/interviews/*` → `/dashboard` (301)
   - Implement in `vercel.json` (`redirects` array) so Vercel serves them at the edge, before the SPA loads
6. Full TS / lint / visual pass — run `npx tsc --noEmit` to catch any lingering interview imports
7. Deploy

### Phase 2 — Landing page repositioning

**Prerequisite — working support demo.** The primary hero CTA ("See it handle support") opens `demo.liraintelligence.com/support`. If that demo is not live and stable by the time Phase 2 is ready to ship, the hero CTA temporarily becomes:

- Primary: **"Start free"** → signup
- Secondary: **"Watch demo"** → Loom video of the support portal

Do not ship the repositioned hero with a broken "See it handle support" button.

Steps:

1. Verify `demo.liraintelligence.com/support` is live, responsive, and resolves at least one ticket end‑to‑end
2. New `Hero` component with CI positioning copy
3. New `HubAndSpokeAnimation` SVG component (with `prefers-reduced-motion` guard, hub in the center)
4. Reorder sections (Support pillar first, Meetings demoted, meeting‑link widget relocated to Meetings pillar)
5. Update SEO/meta/structured data to "Conversational Intelligence platform"
6. Deploy

### Phase 3 — Onboarding update

1. Add "What brings you to Lira?" step (owners and new members see it the first time)
2. Persist `user.preferred_module` per user; optionally set `org.onboarding_primary_module` as a soft default
3. Update copy throughout onboarding to drop meeting‑first phrasing
4. Route each user to their chosen module's setup after the step
5. Deploy

### Phase 4 — Dashboard modules overview

1. Build `ModulesOverview` component with status tiles
2. Move `DeployHeroBar` into Meetings tile expanded view
3. Feature gating: inactive modules show "Set up" CTA
4. Deploy

### Phase 5 — Central custom domain

1. Add `custom_domain` to org profile (backend — coordinate with creovine‑api)
2. Add Domains tab to `OrgSettingsPage`
3. Wire Support Activation portal step to read from it
4. Wire Org Email to read from it
5. Deploy

---

## 9. Content / copy library

Reusable phrases for the new positioning — write once, use everywhere:

- **Category label:** "Conversational Intelligence" (not "Conversational AI" — CI is the industry term)
- **Platform tagline:** "Every conversation. Intelligently handled."
- **Hero sub:** "Lira is a Conversational Intelligence platform. One AI employee that answers your customers, coaches your sellers, and runs your meetings — grounded in your knowledge."
- **Module descriptors:**
  - Support: _"Resolve tickets in seconds — chat, portal, email, grounded in your knowledge base."_
  - Sales: _"An invisible coach on every call. Real‑time objection handling. CRM that fills itself."_
  - Meetings: _"Lira doesn't just record your meetings — she joins them, contributes, and handles the follow‑through."_
- **What NOT to say:** "AI note‑taker", "meeting bot", "meeting assistant", "transcribe and summarize" (these put us in the Otter/Fireflies commodity bucket). Always lead with the _live participation_ differentiator for Meetings.

---

## 10. Decisions (locked in)

1. **Tagline:** ✅ **"Every conversation. Intelligently handled."** — promise is about outcomes, not human equivalence; avoids the "AI employee" expectation trap.
2. **Primary hero CTA:** ✅ **"See it handle support"** → `demo.liraintelligence.com/support`, but **only once the demo is live and stable**. If not ready at Phase 2 ship time, use `Start free` as primary and a Loom `Watch demo` as secondary. Never launch a broken primary CTA.
3. **Meeting‑link widget:** ✅ **Remove from hero**, relocate to the Meetings pillar section. The hero is now Support‑first; a Google Meet input in the hero contradicts the reposition.
4. **Interview code:** ✅ **Delete it** — no feature flag. Git history is the archive. Run `npx tsc --noEmit` after deletion to catch lingering imports. Ship with explicit 301 redirects (see Phase 1 step 5).
5. **Central custom domain:** ✅ **Phase 5**, not Phase 1. Foundational but not blocking. Support activation can use `liraintelligence.com` subdomains until then. Ship the reposition first, clean up the domain story after.

---

## 11. Success criteria

- A visitor landing on `liraintelligence.com` understands within 5 seconds that Lira is a **Conversational Intelligence platform focused on Customer Support, with Sales and Meetings as pillars**.
- A new signup hitting `/onboarding` is asked **what they want to set up first** and is routed accordingly — no more guessing they came for meetings. Teammates joining an existing org are asked the same question individually.
- The string "interview" appears **zero times** in user‑facing copy and metadata on the main platform. Automated grep check in CI.
- **SEO (realistic, measurable):** reach **Top 10 on Google for at least 3 long‑tail target keywords within 90 days** of the reposition. Initial target set (refine with Ahrefs/SEMrush before launch):
  - "AI customer support agent for SaaS"
  - "real‑time sales coaching AI"
  - "AI meeting assistant with action items"
  - "conversational intelligence for customer support"
  - "AI agent grounded in knowledge base"

  Head term "conversational intelligence platform" is a multi‑year play against Gong/Observe.AI — track it, don't gate success on it.

- Beta users consistently describe Lira (in their own words) as a "customer support platform" or "conversational intelligence platform" — not an "AI notetaker." Measure via a single onboarding survey question at day 14.
- Demo engagement: **>40% of landing page visitors click the primary hero CTA** (demo or Start free, depending on which is live).

---

## Appendix A — Sources consulted

- Gong.io: "What is a Revenue Intelligence Platform" — Revenue AI OS positioning model
- Observe.AI: support‑first CI positioning; real‑time agent assist pattern
- Cresta, Intercom (Fin), Ada, Yellow.ai: AI customer support agent playbooks
- `docs/LIRA_MARKET_RESEARCH.md` (in‑repo): validates the $85B TAM across meetings + support (interviews excluded)
- `docs/LIRA_AGENTIC_AI_VISION.md` (in‑repo): "from observer to operator" thesis
- `docs/LIRA_AI_ARCHITECTURE.md` (in‑repo): shared audio + LLM pipeline underpins all modules
- Open‑source references: Pipecat, LiveKit Agents, Rasa Pro CALM, Vapi — for real‑time voice agent patterns

# Lira Customer Support — Competitive Gap Analysis & Optimization Roadmap

> **Version:** 1.0 — 2026-05-20
> **Purpose:** Single source of truth for how Lira beats Ada, Sierra, Decagon, Intercom Fin, and Gorgias. Read before any roadmap discussion.
> **Audience:** Founders, Eng leads, Product, anyone making build-or-buy decisions.

---

## Table of contents

- [0. How to use this document](#0-how-to-use-this-document)
- [1. Executive summary](#1-executive-summary)
- [2. Competitive landscape — pricing and business models](#2-competitive-landscape--pricing-and-business-models)
  - [2.1 Ada (ada.cx)](#21-ada-adacx)
  - [2.2 Decagon](#22-decagon)
  - [2.3 Sierra (sierra.ai — Bret Taylor's company)](#23-sierra-sierraai--bret-taylors-company)
  - [2.4 Intercom Fin](#24-intercom-fin)
  - [2.5 Gorgias](#25-gorgias)
  - [2.6 Forethought (acquired by Zendesk, March 2026)](#26-forethought-acquired-by-zendesk-march-2026)
  - [2.7 Zendesk AI (post-Forethought)](#27-zendesk-ai-post-forethought)
  - [2.8 Kustomer](#28-kustomer)
  - [2.9 The 2026 pricing-model debate](#29-the-2026-pricing-model-debate)
- [3. Strategic gap analysis — where Lira can actually win](#3-strategic-gap-analysis--where-lira-can-actually-win)
  - [Gap 1: Resolution-definition transparency](#gap-1-resolution-definition-transparency)
  - [Gap 2: SaaS-shaped mid-market](#gap-2-saas-shaped-mid-market)
  - [Gap 3: Implementation speed](#gap-3-implementation-speed)
  - [Gap 4: Pricing predictability](#gap-4-pricing-predictability)
  - [Gap 5: Customer-relationship layer](#gap-5-customer-relationship-layer)
  - [Gap 6: Voice-native + WhatsApp](#gap-6-voice-native--whatsapp)
  - [Gap 7: Auditable AI decisions](#gap-7-auditable-ai-decisions)
  - [Gap 8: Support-to-product loop](#gap-8-support-to-product-loop)
- [4. Optimization roadmap — what to build, in what order](#4-optimization-roadmap--what-to-build-in-what-order)
  - [Track 1 — Foundation (the next 8 weeks)](#track-1--foundation-the-next-8-weeks)
  - [Track 2 — Differentiation wedge (weeks 9–20)](#track-2--differentiation-wedge-weeks-920)
  - [Track 3 — Defensibility (weeks 21–32)](#track-3--defensibility-weeks-2132)
  - [Track 4 — Relationship Engine (weeks 33+)](#track-4--relationship-engine-weeks-33)
  - [What's explicitly NOT on this roadmap (and why)](#whats-explicitly-not-on-this-roadmap-and-why)
- [5. Technical building blocks — open-source projects per pillar](#5-technical-building-blocks--open-source-projects-per-pillar)
  - [5.1 Inbox shell + omnichannel router — Chatwoot](#51-inbox-shell--omnichannel-router--chatwoot-mit-)
  - [5.2 Action chains — LangGraph](#52-action-chains--langgraph-mit-)
  - [5.3 Lifetime customer memory — Mem0](#53-lifetime-customer-memory--mem0-apache-20-)
  - [5.4 Voice-native — LiveKit Agents](#54-voice-native--livekit-agents-apache-20-)
  - [5.5 Knowledge base + self-improvement — RAGFlow](#55-knowledge-base--self-improvement--ragflow-apache-20-)
  - [5.6 WhatsApp — official Cloud API + Baileys](#56-whatsapp--official-cloud-api--baileys-mit--as-fallback)
  - [5.7 Audit + observability — Langfuse](#57-audit--observability--langfuse-mit-)
  - [5.8 Vision / screenshot analysis](#58-vision--screenshot-analysis--build-it-study-screenshot-to-code)
  - [5.9 Licensing summary](#59-licensing-summary)
- [6. Pricing strategy recommendation](#6-pricing-strategy-recommendation)
  - [The core thesis](#the-core-thesis)
  - [Proposed structure](#proposed-structure)
  - [Why this beats every competitor](#why-this-beats-every-competitor)
  - [Critical pricing decisions explained](#critical-pricing-decisions-explained)
  - [What we don't promise](#what-we-dont-promise)
- [7. Risk register — what kills this plan](#7-risk-register--what-kills-this-plan)
- [8. Reference index](#8-reference-index)
- [9. The one-page version](#9-the-one-page-version)

---

## 0. How to use this document

This is a **reference document**, not a spec. It answers four questions:

1. What are competitors actually charging, and how do they make money? (Section 2)
2. Where are they weak — i.e. where can Lira win? (Section 3)
3. What should Lira build, in what order, to exploit those gaps? (Section 4)
4. What open-source projects already solve pieces of this, with code patterns we can study? (Section 5)

When you're tempted to add a feature, ask: *which gap in Section 3 does this exploit, and is it on the Section 4 roadmap?* If neither, defer it.

---

## 1. Executive summary

**The market.** AI customer support is the most competitive AI vertical in 2026. Sierra ($15.8B valuation, $150M ARR), Decagon ($4.5B valuation, $35M ARR, growing 3x YoY), Ada ($1.2B, ~$70K median ACV), Intercom Fin ($100M ARR at $0.99/resolution), Gorgias ($530M valuation for Shopify DTC). Zendesk acquired Forethought in March 2026 — consolidation has started.

**The single biggest insight from the research.** Every leading competitor uses **per-resolution or per-conversation usage billing with no caps**. Buyers report this is now the #1 procurement objection at renewal: *"the better your AI works, the more we pay."* Bessemer's 2026 AI Pricing Playbook confirms hybrid pricing is rising (27% → 41% adoption in 12 months) precisely because pure usage models are facing backlash.

**Where Lira wins.** Not on raw resolution quality — Decagon and Fin have a 2-year head start there. Lira wins on:

1. **SaaS-native lifecycle**, not just ticket resolution (Pillar 11 — no incumbent does this)
2. **Voice-native from day one** (Nova Sonic already built; competitors bolted voice on)
3. **WhatsApp as relationship layer**, critical in LatAm/SEA/Africa (every competitor ignores this)
4. **Predictable pricing with a cap** — exploit Bessemer's documented pricing backlash
5. **10-minute self-serve deployment** vs. Ada's 8–16 week professional services

**Where Lira loses today.** Track record, enterprise compliance (SOC 2 etc.), reasoning quality on edge cases, brand. These will close with time and customers — they should not be the wedge.

**The strategic bet.** Win SMB and mid-market SaaS ($500–$5K/mo ACVs) that incumbents either ignore (Sierra, Decagon) or punish with usage fees (Fin, Gorgias, Zendesk). Move upmarket later from a base they cannot match on pricing or deployment speed.

---

## 2. Competitive landscape — pricing and business models

All figures verified May 2026. Sources linked at bottom of each row.

### 2.1 Ada (ada.cx)

| Dimension | Detail |
|---|---|
| **Pricing** | Quote-only. Buyer reports: ~$30K/yr platform floor + $1.00–$3.50 per resolution. $10K–$50K+ integration fees. |
| **Vendr median ACV** | ~$70K/yr |
| **Enterprise contracts** | $200K–$300K+/yr |
| **Implementation** | 8–16 weeks with dedicated solutions team |
| **Funding** | $200M raised, $1.2B valuation (Series C, 2021) — no fresh primary round since |
| **Customers** | 350+ as of April 2024, ~705 employees |
| **Resolution definition** | Negotiated contractually — buyers report a "containment trap" where customer disengagement counts as resolution |
| **Sales motion** | 100% sales-led, demo-required, multi-month POV |
| **Killer weakness** | Stagnant since 2021; reviewers report bot "forgets context"; only ingests formal help-center docs (no Confluence/Notion/Drive); 1.9/5 Trustpilot from end-users vs. higher G2 scores from admins — classic "admins love it, customers hate it" pattern |

**Sample buyer math:** $30K platform + (5K resolutions/mo × $2 × 12) = **$150K/year all-in.**

Sources: [CorePiper](https://corepiper.com/blog/ada-ai-pricing-2026/), [Vendr](https://www.vendr.com/marketplace/ada), [Sacra](https://sacra.com/c/ada/)

### 2.2 Decagon

| Dimension | Detail |
|---|---|
| **Pricing** | Per-conversation (more common) OR per-resolution (higher unit price, only on AI-only closures). Custom contracts start ~$50K/yr; third-party estimates cite ~$95K entry point. Platform fee ~$50K + usage. |
| **ARR** | $35M (Oct 2025), up from $10M end-of-2024 — **>3x YoY** |
| **Funding** | $250M Series D at **$4.5B valuation** (Jan 2026, Coatue + Index). Prior: $131M Series C at $1.5B (June 2025, a16z + Accel). Total raised $481M. |
| **Customer logos** | Notion, Rippling, Duolingo, Chime, Hertz, Eventbrite, Substack, Riot, Classpass, Oura, Affirm, Dropbox, Avis, Mercado Libre, Deutsche Telekom |
| **Differentiation** | Multi-agent "ecosystem" with cross-reviewing sub-agents; OpenAI + Anthropic + Cohere foundation; heavy evals/benchmarking pitch |
| **Sales motion** | Enterprise-only, demo-led, NYC + London offices |
| **Killer weakness** | 129x ARR multiple — needs explosive 2026 growth; limited audit/compliance visibility; opaque pricing creates renewal friction |

Sources: [SiliconAngle](https://siliconangle.com/2026/01/28/decagon-ai-raises-250m-4-5b-valuation-scale-ai-concierge-platform/), [Sacra](https://sacra.com/c/decagon/)

### 2.3 Sierra (sierra.ai — Bret Taylor's company)

| Dimension | Detail |
|---|---|
| **Pricing** | Volume-based for routine + per-resolution / per-outcome for complex. Floors ~$150K/yr; reported year-one budget $200K–$350K+ |
| **ARR** | **$150M end of Jan 2026**, up from $26M end-of-2024 — fastest ramp in category |
| **Funding** | **$950M Series E at $15.8B post-money** (May 2026, GV + Tiger). ~$635M cash on hand. |
| **Customer base** | Claims **40% of Fortune 50**. Logos: WeightWatchers, SiriusXM, Sonos, ADT, Chime, Cigna, Nordstrom, Nubank, Ramp, Rivian, Rocket Mortgage, Sutter Health, Wayfair, Casper |
| **Pitch** | Pure outcome alignment: "we only get paid when we save you a cancellation or resolve a ticket." Voice-agent capability promoted as enterprise differentiator. |
| **Sales motion** | Top-down enterprise, founder-led on largest accounts, multi-year deals |
| **Killer weakness** | Cost prohibitive below mid-market; outcome billing becomes adversarial at renewal — buyers report needing finance teams to audit what counted as a resolution; not positioned for SaaS SMB/mid-market |

Sources: [TechCrunch](https://techcrunch.com/2026/05/04/sierra-raises-950m-as-the-race-to-own-enterprise-ai-gets-serious/), [Sacra](https://sacra.com/c/sierra/)

### 2.4 Intercom Fin

| Dimension | Detail |
|---|---|
| **Pricing** | **$0.99 per resolution**. **50-resolution / $49.50/mo minimum** when Fin runs standalone on Zendesk/Salesforce/HubSpot. **No volume discounts. No caps.** Stacks on Intercom seat fees ($29–$139/seat/mo) when inside Intercom suite. |
| **ARR** | Intercom total $400M (Apr 2026). **Fin ARR nearing $100M, growing 350% YoY.** ~8,000 Fin customers, >2M resolutions/week. |
| **Resolution definition** | The category reference: (1) "confirmed" = customer types affirmative confirmation; (2) "assumed" = customer goes silent for 24h. New "outcomes" framework adds procedure handoffs. **Public avg resolution rate: 67%.** |
| **Sales motion** | Hybrid PLG + sales-assisted. Self-serve trial available. |
| **Killer weakness** | "Assumed resolution = customer disengagement" is the most-criticized definition in the industry. Pricing penalizes success. Intercom seat fees underneath make Fin expensive once locked in. |

Sources: [Fin pricing](https://fin.ai/pricing), [Intercom on outcomes](https://www.intercom.com/blog/from-resolutions-to-outcomes-evolving-how-fin-delivers-value/)

### 2.5 Gorgias

| Dimension | Detail |
|---|---|
| **Pricing** | Helpdesk tiers $10–$900/mo by ticket volume + **AI Agent at $0.90 (annual) / $1.00 (monthly) per interaction**. Confirmed. **Double-billing:** an AI-resolved ticket counts as BOTH a ticket and an automated interaction unless customer reopens in 72h. |
| **ARR** | ~$60M (mid-2024), $530M valuation Series C (May 2024) |
| **Customers** | 15,000–17,000 merchants, **40% of Shopify's top 1,500** |
| **Average ACV** | ~$3,750 — confirms SMB ICP |
| **Sales motion** | PLG-dominant, sales-assisted for mid-market |
| **Killer weakness** | Double-billing perception poisons procurement; locked into Shopify ecosystem (limits TAM to e-commerce DTC); AI quality criticized as below Fin/Decagon |

Sources: [Gorgias billing docs](https://docs.gorgias.com/en-US/how-youre-billed-for-using-gorgias-199385), [Sacra](https://sacra.com/c/gorgias/)

### 2.6 Forethought (acquired by Zendesk, March 2026)

| Dimension | Detail |
|---|---|
| **Pricing** | Flat platform fee + usage. Required ~20K historical tickets to onboard — hard SMB floor. |
| **Status** | Acquired by Zendesk March 26, 2026. ~$115M raised pre-acquisition. |
| **Why they lost** | Heavy data requirement blocked SMB; vendor-led POVs took months; pricing penalized growth; no PLG path; positioned against Zendesk for years then absorbed |

**This is the cautionary tale.** Opaque pricing + heavy implementation + no self-serve = forced exit. Lira's roadmap must be the opposite.

### 2.7 Zendesk AI (post-Forethought)

| Dimension | Detail |
|---|---|
| **Pricing** | **$1.50/automated resolution (committed) or $2.00 PAYG**, plus **mandatory $50/agent/mo Advanced AI add-on**, plus base Suite plan ($19–$169/agent/mo). Free baseline: 5/10/15 resolutions per agent (Team/Pro/Enterprise) before per-resolution rates. |
| **Jan 2026 change** | Removed discounted overage rate — every overage resolution billed at full price. |
| **Targets** | $500M AI ARR by end of 2026; $1B agentic services by 2028. |
| **Killer weakness** | A 30-agent customer with Advanced AI + resolutions easily exceeds $100K/yr before any volume; stack-on pricing; "automated resolution" definition criticized as containment-trap-prone; suite-locked |

### 2.8 Kustomer

| Dimension | Detail |
|---|---|
| **Pricing** | Seats: $89/seat/mo Enterprise, $139/seat/mo Ultimate, **8-seat minimum** ($8,544–$13,344/yr floor). AI for Customers: **$0.60 per engaged conversation** (per-conversation, not per-resolution — paid even when AI fails). AI for Reps: $40/user/mo. |
| **History** | Founded 2015 → acquired by Meta 2020 → spun back out May 2023 |
| **Killer weakness** | Per-conversation billing = paid even when it fails. Brand baggage from Meta acquisition/divestiture. |

### 2.9 The 2026 pricing-model debate

From Bessemer's 2026 AI Pricing Playbook (200+ AI vendors tracked):

- **Hybrid pricing models: 27% → 41% adoption in 12 months**
- **Pure per-seat: 21% → 15%**
- **Agent gross margins: 50–60% vs. SaaS 80–90%** (real per-query compute is the structural reason flat pricing is hard)
- a16z (Dec 2024): "Winning companies will look less like SaaS and more like managed labor with measurable throughput"

**The 2026 renewal cliff.** 2025 pilots are hitting first real renewals in 2026. Vendors with vague resolution definitions face procurement pushback. Four conflicting resolution definitions in market:

1. Closed without handoff
2. Closed without handoff + positive CSAT
3. Closed with logged outcome action
4. Closed without escalation in 7-day window

Each produces materially different bills on the same volume. **This is Lira's pricing opening.**

---

## 3. Strategic gap analysis — where Lira can actually win

### Gap 1: Resolution-definition transparency

**The problem:** No incumbent publishes an unambiguous, auditable definition. Buyers can't predict bills. Renewals are adversarial.

**Lira's play:** Publish a single, conservative definition with auditable receipts:

> *A billable resolution is an interaction that is closed without escalation AND has no reopen within 7 days AND has a logged outcome action attached (CRM update, ticket creation, refund, etc.). Customers can audit every billable resolution via a downloadable receipt showing reasoning trace, retrieved KB chunks, action payload, and outcome confirmation.*

This turns Bessemer's documented "audit rights" demand into a sales weapon. Procurement loves auditable bills.

### Gap 2: SaaS-shaped mid-market

**The problem:** Sierra/Decagon start at $95K–$200K+. Ada median $70K. Fin scales linearly with no caps. Gorgias is Shopify-locked. Kustomer is seat-heavy with 8-seat minimum. **A SaaS company doing 5K–25K tickets/mo has no obvious right choice.**

**Lira's play:** Build pricing tiers explicitly for this gap — $500/mo, $2,000/mo, $5,000/mo — with a hard usage cap (over-the-cap interactions are free, not overage-billed). Self-serve activation. Section 6 below has the full pricing recommendation.

### Gap 3: Implementation speed

**The problem:** Ada 8–16 weeks. Forethought required 20K historical tickets. Decagon enterprise POVs run months.

**Lira's play:** 10-minute deployment via copy-paste script tag with no-code dashboard. **Time-to-first-resolved-conversation under 60 minutes** is a structural moat — competitors cannot retrofit this without dismantling their solutions orgs.

### Gap 4: Pricing predictability

**The problem:** Every incumbent uses uncapped usage billing. Bills go up as the product works better. Bessemer documents the backlash.

**Lira's play:** Flat tier + included interactions + **hard cap, no overage**. If you exceed your tier, you upgrade — you never get surprised by a bill. Predictability is the value, not the price.

### Gap 5: Customer-relationship layer

**The problem:** Every competitor sells "ticket resolution." None sell prospect → trial → paid → expansion → renewal as one continuous AI. Sierra includes "saved cancellation" outcomes but enterprise-only.

**Lira's play:** This is Pillar 11 from the spec. It is the long-term differentiator, but **defer it until pillars 1–4 ship**. Lead with "best AI support tool for SaaS, with relationship features coming" — not "the world's first AI Customer Relationship Engine." Buyers buy category leaders; they don't buy unknown new categories.

### Gap 6: Voice-native + WhatsApp

**The problem:** Voice is a bolt-on for every competitor. WhatsApp is treated as a channel, not a relationship layer. LatAm/SEA/Africa SaaS customers are underserved.

**Lira's play:** This is Lira's existing build. Nova Sonic + WhatsApp-as-relationship-thread is a **wedge into geographies competitors haven't prioritized**. Don't pretend it's a feature — make it the brand: *the AI support agent that picks up the phone and follows up on WhatsApp.*

### Gap 7: Auditable AI decisions

**The problem:** Decagon was explicitly called out for limited audit visibility. No vendor publishes reasoning traces by default. Enterprise compliance teams cannot rubber-stamp deployments.

**Lira's play:** Every action ships with a reasoning trace, retrieved KB chunks, confidence score, and an immutable audit log entry. Pillar 8 of the spec. This is also a sales weapon — *"our competitors' AIs are black boxes; ours has a glass box."*

### Gap 8: Support-to-product loop

**The problem:** Bug reports and feature requests die in support queues. Product teams never see the signal. Every competitor has this gap.

**Lira's play:** Pillar 9 — auto-extract bug/feature/UX-friction signals into Linear with conversation transcripts. **Close the loop:** when the Linear ticket resolves, the original reporter gets an automatic notification. This converts frustrated customers into advocates and is essentially free to build on top of existing integrations.

---

## 4. Optimization roadmap — what to build, in what order

> **The single biggest mistake in the original spec was scope.** Eleven pillars and twelve phases is five years of work — no startup ships this and survives. This roadmap collapses it into **four ordered tracks** with explicit "we will not do X yet" decisions.

### Guiding principle: ship the pricing-wedge before any feature

The first thing buyers compare is the bill. If Lira ships a 12-feature product with confusing pricing, it loses to a 4-feature product with auditable, capped, transparent pricing. **Pricing is feature zero.**

### Track 1 — Foundation (the next 8 weeks)

**Goal:** A self-serve, auditable, capped-pricing SaaS support agent that any company can deploy in under an hour.

| Workstream | Why this first |
|---|---|
| **Pricing engine + audit receipts** | Define billable resolution, instrument resolution detection, generate downloadable per-resolution receipts. Marketing weapon and procurement weapon. |
| **Self-serve onboarding** | Signup → upload KB / connect Notion / paste URL → install widget → first conversation, all in 60 minutes. No solutions team. Closes Gap 3. |
| **Hard cap, no overage billing** | Stripe metering. Tier limits enforced. Overage = upgrade prompt, never a bill. Closes Gap 4. |
| **Reasoning trace + audit log on every reply** | Pillar 8 minimum viable. Every AI reply has a `traceId` linking to retrieved chunks, confidence, and action log. Closes Gap 7. |
| **Per-conversation receipts in the customer dashboard** | The procurement-team-pleaser. No competitor has this. |

**Explicit non-goals in Track 1:** voice, WhatsApp, screen share, action chains beyond ticket creation, relationship lifecycle, self-improving KB. **All deferred.**

### Track 2 — Differentiation wedge (weeks 9–20)

**Goal:** Become the only credible SaaS support agent for LatAm/SEA/Africa and the only credible voice-native option for SMB SaaS.

| Workstream | Why now |
|---|---|
| **WhatsApp Cloud API integration as relationship channel** | Use Meta's official Cloud API for production (ToS-safe). Capture WhatsApp number in conversation, persist to CustomerProfile, continue threads across web → email → WhatsApp. Closes Gap 6 for the LatAm/SEA/Africa wedge. |
| **Voice-native inbound + outbound** | Nova Sonic is already built. Wrap it in LiveKit Agents (Apache-2.0, see Section 5.4). Customer calls a number → AI picks up → same memory as chat. Outbound proactive calls for high-urgency events. |
| **Autonomous action engine v1** | LangGraph state graph with checkpointer. Limited action allowlist: refund, CRM update, ticket creation, Slack notify. **Configurable approval gate per action type** — critical for trust. See Section 5.2. |
| **Lifetime customer memory** | Mem0 (Apache-2.0) as primary memory primitive. Every conversation across every channel writes to the same CustomerProfile. Pillar 3. |
| **Smart escalation routing + ticket auto-creation** | The "this is more than a chatbot" moment for buyers. Bug → Linear `#engineering`; billing → Slack `#billing`; compliance → P1 + email. |

**Explicit non-goals in Track 2:** vision/screen share, relationship-engine sales features, self-improving KB. Still deferred.

### Track 3 — Defensibility (weeks 21–32)

**Goal:** Make Lira measurably smarter than incumbents, week-over-week, and close the support→product loop nobody else does.

| Workstream | Why now |
|---|---|
| **Self-improving knowledge engine** | Pillar 5. Every escalation feeds GPT-4o-mini for root-cause analysis → AI drafts the missing KB entry → human approves with one click. Weekly metrics dashboard. Forces a feedback loop competitors don't have. |
| **Support → Product signal pipeline** | Pillar 9. Auto-extract bug/feature/friction signals → Linear with full transcript → close the loop when fix ships. Customer becomes advocate. Essentially free given existing Linear integration. |
| **Visual Intelligence v1 — screenshot analysis only** | Customer pastes screenshot → GPT-4o vision → KB cross-reference → contextual answer. **Live screen share deferred** (WebRTC is a tar pit; ship screenshots first). Closes the visual gap. |
| **Proactive trigger engine** | Pillar 1. Webhook receiver (already built per spec) → condition engine → outbound email/voice/WhatsApp. Configurable in dashboard. |

### Track 4 — Relationship Engine (weeks 33+)

**Goal:** Move from "AI support tool" to "AI customer relationship engine" — but only after the support product is winning on its own merits.

This is the most valuable long-term track and the one where Lira has no real competition. But shipping it before Tracks 1–3 are battle-tested invites the "12-pillar startup failure" pattern.

| Workstream | What it includes |
|---|---|
| **Lifecycle stage tracking + ConversionEvent table** | The data model that makes everything else possible |
| **Prospect qualification flow on website widget** | Sales objection handling, content linking, demo booking |
| **Trial nurture sequences triggered by product usage** | "You set up your KB — most teams do CRM next, want help?" |
| **Churn signal detection + proactive re-engagement** | Usage drop + sentiment shift → outbound on preferred channel |
| **Expansion + renewal outreach** | Personalized usage summaries, ROI framing, retention offers |

### What's explicitly NOT on this roadmap (and why)

- **Live screen share (WebRTC):** Engineering complexity vs. customer demand is wrong. Ship screenshot analysis instead. Revisit at Series B scale.
- **SMS:** WhatsApp captures the same value in our target geos. SMS is a US-centric channel and Twilio fees would eat margin.
- **On-premise / private cloud deployment:** Enterprise selling motion. Wrong stage. Single-tenant in our VPC if a F500 demands it; otherwise no.
- **"World's first AI Customer Relationship Engine" positioning:** Risky category invention. Lead with "best AI support for SaaS"; the relationship engine is the upsell.
- **Outcome-based pricing as default:** Tempting to copy Sierra. Don't. SMB doesn't trust outcome billing because it's adversarial. Flat-with-cap is the wedge.
- **Multi-language voice beyond English + Spanish + Portuguese in Track 2:** Each language is a quality bar. Three is plenty for the LatAm wedge.

---

## 5. Technical building blocks — open-source projects per pillar

For each track in Section 4, the open-source projects worth studying or vendoring. **Licensing key:** ✅ permissive (MIT/Apache/BSD — safe to study, fork patterns from, or vendor). ⚠️ restrictive (AGPL/OSL/ELv2 — study only, do not link or distribute).

### 5.1 Inbox shell + omnichannel router — Chatwoot (MIT) ✅

**Repo:** [github.com/chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) — 29.6k stars, Rails + Vue

**What to study:** The channel adapter pattern. Chatwoot has the cleanest open-source implementation of "many channels, one inbox" — every channel-specific payload (Facebook, Instagram, Messenger, email, SMS, WhatsApp) gets normalized through a uniform builder into a shared `Message` model.

**Files worth reading:**
- `app/builders/messages/message_builder.rb` — the shared funnel
- `app/builders/messages/facebook/`, `instagram/`, `messenger/` — per-channel implementations
- `app/services/` and `app/listeners/` — event-driven side-effects (worth mirroring structurally for our action chains)

**Pattern Lira should mirror:**

```text
Inbound payload (channel-specific)
    ↓
Channel adapter (normalizes to canonical Message)
    ↓
Shared Message store + EventBus
    ↓
Listeners (notifications, automations, audit log, action chains)
```

We already partially have this in our support module — the goal is to formalize the contract so adding WhatsApp / voice / new channels is a single-file change.

### 5.2 Action chains — LangGraph (MIT) ✅

**Repo:** [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) — 32.5k stars

**Why:** LangGraph's `StateGraph` + conditional edges + checkpointer give us durable, resumable workflows. Critical because action chains often call a tool, wait for a webhook, and resume — you cannot do this with a simple sequential LLM loop.

**Pattern to study:** their canonical customer-support agent tutorial (`docs.langchain.com` — search "customer support"). Key shape:

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

graph = StateGraph(State)
graph.add_node("classify_intent", classify_intent)
graph.add_node("retrieve_kb", retrieve_kb)
graph.add_node("plan_actions", plan_actions)
graph.add_node("execute_action", execute_action)
graph.add_node("escalate", escalate)

graph.add_conditional_edges(
    "plan_actions",
    lambda state: "escalate" if state["confidence"] < 0.7 else "execute_action",
)
graph.add_edge("execute_action", END)

app = graph.compile(checkpointer=MemorySaver())
```

The checkpointer is what makes resumes possible. When the action waits on an external webhook (e.g., compliance review), the graph pauses, persists state, and resumes when the webhook fires.

### 5.3 Lifetime customer memory — Mem0 (Apache-2.0) ✅

**Repo:** [github.com/mem0ai/mem0](https://github.com/mem0ai/mem0) — 56.3k stars

**Why:** Highest leverage memory primitive. Apache-2.0. Entity linking + temporal reasoning (April 2026 update) means it remembers "this customer churned from competitor X in March, churn-risk-scored 87 in May." Exactly what Pillar 3 needs.

**Pattern:**

```python
from mem0 import Memory
memory = Memory()

# Before generating
relevant = memory.search(query=message, filters={"user_id": customer_id}, top_k=3)

# After responding
memory.add(messages, user_id=customer_id)
```

The retrieve / respond / persist loop wraps every conversation turn. Memory is durable across channels because `user_id` is the canonical `customerId` from our `CustomerProfile`.

**Alternative for graph-shaped memory:** [Zep](https://github.com/getzep/zep) (Apache-2.0). Temporal knowledge graph with `valid_at`/`invalid_at` on facts. Use if/when we need "show me what this customer believed about our product in Q3 vs. Q4."

### 5.4 Voice-native — LiveKit Agents (Apache-2.0) ✅

**Repo:** [github.com/livekit/agents](https://github.com/livekit/agents) — 10.6k stars

**Why:** Production-grade real-time voice agent framework, WebRTC-native, Apache-2.0. Pairs cleanly with Nova Sonic — LiveKit handles transport, room model, turn-taking, barge-in scaffolding; Nova Sonic supplies the model.

**Pattern:**

```python
class LiraVoiceAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are Lira. You answer support calls...",
            tools=[LookupCustomerTool(), CreateTicketTool(), RefundTool()],
        )

    async def on_enter(self):
        self.session.generate_reply(instructions="greet the caller by name")

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    session = AgentSession(stt=..., llm=..., tts=..., vad=...)
    await session.start(agent=LiraVoiceAgent(), room=ctx.room)
```

For Nova Sonic specifically, swap STT/TTS with the unified speech-to-speech model. The agent owns instructions + tools; the session owns IO wiring; the entrypoint binds to a room. Multi-tenant ready out of the box.

**Alternative:** [Pipecat](https://github.com/pipecat-ai/pipecat) (BSD-2). Frame-based pipeline — better if we need per-component swap-out (e.g., per-frame sentiment scoring). Pick one early; both work.

### 5.5 Knowledge base + self-improvement — RAGFlow (Apache-2.0) ✅

**Repo:** [github.com/infiniflow/ragflow](https://github.com/infiniflow/ragflow) — 80.9k stars

**Why:** Hardest part of KB is turning messy PDFs / slides / scanned docs into clean, citable chunks. RAGFlow ships visual chunking, template-based ingestion, and citation grounding (reduces hallucination — critical for support).

**Pattern to adopt:** Their citation-grounding model where every retrieved chunk has a stable ID, page number, and bounding box, and the AI response cites chunks inline. This is what auditable reasoning traces (Gap 7) require.

**Alternative for pipeline mental model:** [Haystack](https://github.com/deepset-ai/haystack) (Apache-2.0). Explicit `retriever → router → memory → generator` nodes map cleanly onto Lira's "answer-from-KB vs. escalate vs. tool-call" decision.

### 5.6 WhatsApp — official Cloud API + Baileys (MIT) ✅ as fallback

**Repo:** [github.com/WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) — 9.5k stars

**Recommendation:** Use **Meta's official WhatsApp Cloud API** for all paid/production traffic (ToS-safe, supports verified business profiles, template messages, etc.). Baileys (MIT, WebSocket-based, no browser) is acceptable for free-tier or dev environments but carries WhatsApp ToS risk for production multi-tenant use.

**Alternative engine abstraction:** [WAHA](https://github.com/devlikeapro/waha) (Apache-2.0) — HTTP API wrapper over multiple WhatsApp engines (WEBJS / NOWEB / GOWS). Useful if we want to swap engines without changing integration code.

### 5.7 Audit + observability — Langfuse (MIT) ✅

**Repo:** [github.com/langfuse/langfuse](https://github.com/langfuse/langfuse) — 27.6k stars

**Why:** Self-hostable (we control the data), MIT-licensed, decorator-based instrumentation, sessions / prompts / evals built in. Becomes the audit log substrate for Pillar 8.

**Pattern:**

```python
from langfuse import observe
from langfuse.openai import openai

@observe()
def answer(message, customer_id):
    return openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": message}],
    ).choices[0].message.content
```

One decorator per turn gives us a hierarchical trace: retrieval → tool calls → agent steps → final reply. Customers get a `traceId` they can audit. **This is the receipt that wins procurement.**

**Avoid:** [Arize Phoenix](https://github.com/Arize-ai/phoenix) — Elastic License 2.0 has competitive-use restrictions. Fine for internal monitoring, do not build product on top.

### 5.8 Vision / screenshot analysis — build it; study screenshot-to-code

**Reference:** [github.com/abi/screenshot-to-code](https://github.com/abi/screenshot-to-code) — 72.6k stars, MIT.

The "support-screenshot diagnoser" category has **no mature open-source repo**. Build it ourselves. Reference architecture from screenshot-to-code:

```text
Customer pastes/uploads image
    ↓
Stored to S3 with signed URL
    ↓
GPT-4o Vision (or Claude vision) prompted with:
    - Customer's recent conversation context
    - Top-3 RAG chunks from KB
    - "What error is shown? What action would resolve it?"
    ↓
Structured output: { error_type, suggested_action, confidence }
    ↓
Inject into conversation context before AI generates reply
```

Ship this for screenshots first. **Defer live screen share (WebRTC) indefinitely.**

### 5.9 Licensing summary

| Safe to vendor / adopt | Study-only (license risk for closed-source SaaS) |
|---|---|
| Chatwoot (MIT), Papercups (MIT), Tiledesk (MIT), Botpress (MIT) | Erxes (AGPL), FreeScout (AGPL), UVdesk (OSL-3.0) |
| LiveKit Agents (Apache), Pipecat (BSD), Vocode (MIT), Ultravox (MIT) | Arize Phoenix (ELv2) |
| LangGraph (MIT), CrewAI (MIT), Letta (Apache), Mem0 (Apache), Zep (Apache) | AutoGen (MIT but in maintenance — MS recommends Agent Framework) |
| RAGFlow (Apache), Haystack (Apache), Verba (BSD) | — |
| Baileys (MIT), WAHA (Apache), Wuzapi (MIT) | All carry WhatsApp ToS risk independent of license |
| Langfuse (MIT), Helicone (Apache), OpenLLMetry (Apache) | — |

---

## 6. Pricing strategy recommendation

Based on the competitive analysis in Section 2 and the gaps in Section 3.

### The core thesis

**Sell predictability, not price.** Buyers do not need Lira to be the cheapest tool. They need to be able to predict their bill. Every competitor uses uncapped usage billing; the procurement team's quiet pain is variance, not absolute cost.

### Proposed structure

```
Starter   — $500/mo flat, up to 1,500 resolutions/mo, web + email channels
            Solo founders, very small teams.
            Over the cap: prompt to upgrade, NOT overage billed.

Growth    — $2,000/mo flat, up to 7,500 resolutions/mo, + voice + WhatsApp
            Real ICP: 10-100 person SaaS.
            Over the cap: upgrade prompt.

Scale     — $5,000/mo flat, up to 25,000 resolutions/mo, + audit export
            + SOC 2 report, + dedicated success.
            Real ICP: 100-500 person SaaS, growing.
            Over the cap: upgrade prompt.

Enterprise — Custom. Single-tenant in our VPC if required. Annual contract.
              Custom SLA. Action allowlist customization.

Resolution definition (published, conservative):
   A billable resolution is closed without escalation AND no reopen
   within 7 days AND has a logged outcome action attached.

Every billable resolution ships with a downloadable receipt:
   reasoning trace, retrieved KB chunks, action payload, outcome status.
```

### Why this beats every competitor

| Competitor | Their model | Why Lira's beats it |
|---|---|---|
| Ada | $30K floor + $1–$3.50/res, no cap | 7x cheaper at entry; capped bill |
| Decagon | ~$95K floor | Way under for SMB/mid-market they ignore |
| Sierra | $150K+ floor | Not even competing — different segment |
| Fin | $0.99/res, no cap, no floor | Predictable: 7,500 resolutions at Lira Growth = $2K vs $7,425 on Fin |
| Gorgias | $0.90–$1/interaction + tier fee + double-billing | No double-billing; SaaS-shaped not e-comm |
| Zendesk | $1.50/res + $50/agent + base | No per-agent fees, no add-on tax |
| Kustomer | $89–$139/seat × 8-seat min + $0.60/conv | No seat minimum |

### Critical pricing decisions explained

**Why flat with a hard cap, not outcome-based:**
- Sierra-style outcome billing requires enterprise-grade trust and a finance team on the buyer side to audit it. SMB/mid-market doesn't have that.
- A hard cap creates the right buyer behavior: "I'm hitting my cap → I should upgrade" instead of "I'm getting surprised on the invoice."
- Predictable margin for Lira: we know our cost per resolution (GPT-4o-mini + retrieval + storage); we set tier limits where margin holds.

**Why publish the resolution definition:**
- It's the procurement team's #1 unanswered question across all competitors.
- The conservative definition (no reopen + outcome action logged) means we under-count vs. competitors who use "assumed resolution after 24h silence." That's a feature, not a bug — buyers trust us more.

**Why downloadable receipts per resolution:**
- Bessemer documents the audit-rights demand. We meet it natively. No competitor does.
- Receipts also become marketing — "show me an Ada receipt vs. a Lira receipt" is a closing slide.

**Why no per-seat fees ever:**
- Per-seat is the SaaS pricing model. AI agents are not SaaS. Pricing on seats anchors buyers to old mental models. We sell outcomes, capped.

### What we don't promise

- Free tier: no. Free tier burns margin (real per-call compute) and attracts low-quality leads. Free trial yes (14 days, full Growth tier features).
- Open-source self-host: no. Some buyers will ask. The answer is "Enterprise tier deploys to your VPC." Open-sourcing the inference layer is product giveaway.
- Lifetime pricing locks: no. Annual contracts with 10% discount; nothing longer than that until we're 3 years in.

---

## 7. Risk register — what kills this plan

### Risk 1: Reasoning quality gap with Decagon / Fin

Both have 2+ years of edge-case hardening. Lira will be measurably worse on the long tail of weird customer messages until we accumulate the same volume.

**Mitigation:** Self-improving knowledge engine in Track 3. Every escalation feeds the loop. Plus aggressive Langfuse-based evals from day one. Plus humble messaging — *"we're not the smartest yet; we're the most transparent and predictable"* — until we have the data to claim otherwise.

### Risk 2: Per-resolution unit economics

Agent gross margins are 50–60% (Bessemer). If we cap at 7,500 resolutions for $2K, our cost per resolution must stay under ~$0.10 for healthy margin.

**Mitigation:** GPT-4o-mini for classification + retrieval; route only ambiguous cases to GPT-4o / Claude. Aggressive caching of KB embeddings. Anthropic prompt caching for repeated system prompts (5-min TTL). Periodic per-tier margin reviews — adjust caps if unit economics drift.

### Risk 3: Voice quality on Nova Sonic

Nova Sonic is newer than 11Labs / OpenAI's voice models. Edge cases (accents, noise, code-switching) may underperform.

**Mitigation:** Voice as Growth-tier feature, not Starter, so we control deployment surface. LiveKit Agents abstraction lets us swap providers per tenant if a customer needs OpenAI Realtime instead. Don't bet the brand on Nova Sonic alone.

### Risk 4: WhatsApp ToS for unofficial integrations

Baileys et al. are technically against WhatsApp ToS for multi-tenant SaaS. Production use risks bans.

**Mitigation:** Cloud API for all paid traffic. Baileys only for dev / free trial / single-tenant self-hosted scenarios. Document the trade-off clearly in onboarding.

### Risk 5: A competitor copies the pricing model

Sierra/Decagon won't (they need ACV). Fin might. Gorgias might in e-commerce.

**Mitigation:** Pricing is the wedge, not the moat. Once we land customers on Lira pricing, the moat is the relationship engine (Track 4) and the audit-grade receipts. Move fast on Tracks 1–3, lock customers in with multi-year discounts once they're up.

### Risk 6: We try to ship all 11 pillars at once

This is the most likely failure mode. The original spec is too ambitious.

**Mitigation:** This document. Anyone proposing a feature outside the current track must answer: which gap (Section 3) and which track (Section 4)? If neither, defer.

---

## 8. Reference index

### Competitor pricing pages

- [fin.ai/pricing](https://fin.ai/pricing) — Intercom Fin
- [zendesk.com/pricing](https://www.zendesk.com/pricing/) — Zendesk
- [gorgias.com/pricing](https://www.gorgias.com/pricing) — Gorgias
- [docs.gorgias.com/en-US/how-youre-billed-for-using-gorgias-199385](https://docs.gorgias.com/en-US/how-youre-billed-for-using-gorgias-199385) — Gorgias billing mechanics
- Ada, Decagon, Sierra — no public pricing pages (quote-only)

### Industry analysis

- [Bessemer 2026 AI Pricing Playbook](https://www.bvp.com/) — search "AI pricing playbook"
- [a16z on AI agent business models](https://a16z.com/) — search "agent pricing"
- [Sacra company profiles](https://sacra.com/c/) — Ada, Decagon, Sierra, Gorgias, Forethought
- [Vendr marketplace](https://www.vendr.com/marketplace) — real ACVs and contract data

### Open-source repos (top 5)

1. [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) — inbox + omnichannel router (MIT)
2. [livekit/agents](https://github.com/livekit/agents) — voice agent framework (Apache-2.0)
3. [mem0ai/mem0](https://github.com/mem0ai/mem0) — lifetime memory primitive (Apache-2.0)
4. [langfuse/langfuse](https://github.com/langfuse/langfuse) — audit + tracing + evals (MIT)
5. [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) — durable action chains (MIT)

### Lira internal docs

- `/lira-support-product-spec.md` — original 11-pillar spec
- `/docs/LIRA_AI_ARCHITECTURE.md` — current architecture
- `/docs/SUPPORT_SYSTEM_IMPLEMENTATION.md` — current support build state
- `/docs/FEATURES_BUILT_SO_FAR.md` — what's already shipped

---

## 9. The one-page version

If you only remember five things from this document:

1. **Pricing is the wedge.** Flat tiers, hard caps, no overage, downloadable receipts. Procurement-friendly. Every competitor uses uncapped usage billing — that is the gap.
2. **Resolution definition is published and conservative.** Closed + no reopen in 7 days + outcome action logged. Auditable. Competitors hide this; we publish it.
3. **Four tracks, not twelve phases.** Foundation → Voice + WhatsApp + Actions → Self-improvement + Product-loop → Relationship Engine. Ship in order. Don't skip.
4. **Vendor the open-source primitives.** Chatwoot patterns, LiveKit voice, Mem0 memory, Langfuse audit, LangGraph actions. Five permissively-licensed projects do 60% of the heavy lifting.
5. **Don't claim "world's first AI Customer Relationship Engine" until we've earned it.** Lead with "best AI support for SaaS." Earn the relationship-engine pitch with shipped product and customer outcomes.

*— End of document. Update this file when pricing changes, when a competitor raises a round, or when a track ships.*

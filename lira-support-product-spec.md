# Lira Customer Support & Relationship Engine — Product Specification

### "From first hello to fifth renewal — one AI, one conversation, one relationship."

> **Version:** 2.0 — April 2026
> **Audience:** Engineering, Product, Sales, Investors
> **Status:** Specification — Ready for Build Prioritization

---

## 1. The Vision

Every AI support tool on the market today is a **reactive inbox with a chatbot bolted on top.**

Customer messages → AI looks up knowledge base → AI replies or escalates → Human takes over.

That is Intercom. That is Zendesk. That is Freshdesk. That is Gorgias. That is every tool charging you $500/month — plus $1 per automated interaction on top — to do what a smart search bar used to do for free.

**Lira is different at the architecture level — and different in its ambition.**

Most support tools ask: _how do we handle tickets faster?_

Lira asks: _how do we build a relationship with every customer that walks through the door — and make sure they never want to leave?_

Lira is the world's first **AI Customer Relationship Engine** built specifically for SaaS. It doesn't just answer questions. It meets prospects on your website, qualifies them in conversation, guides them through trials, converts them to paying customers, supports them when things go wrong, re-engages them when they go quiet, and expands their accounts when they're ready to grow — all through a single AI with persistent memory, working across every channel they actually use: chat, email, voice, and WhatsApp.

It is simultaneously a support tool, a relationship manager, and a conversion engine. No headcount required.

Gorgias proved this model works for e-commerce. Nobody has built it for SaaS. That is the gap Lira owns.

It doesn't wait. It doesn't deflect. It builds.

---

## 2. Market Gap (Backed by Data)

| Gap                                | What Exists Today                                                                                                                                                                              | What Lira Does                                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reactive only**                  | Every tool waits for the customer to open a chat                                                                                                                                               | Lira monitors events and messages customers proactively                                                                                                  |
| **Answers, doesn't act**           | AI gives text replies; human must push buttons                                                                                                                                                 | Lira executes full action chains across HubSpot, Salesforce, Slack, Linear, ticketing                                                                    |
| **Zero memory**                    | Every session starts fresh; customer repeats themselves                                                                                                                                        | Lira maintains full lifetime customer context across every channel                                                                                       |
| **Text-first**                     | Voice is a bolt-on afterthought                                                                                                                                                                | Lira is voice-native (Nova Sonic) — same AI speaks and types                                                                                             |
| **Punitive pricing**               | Pay per seat, per resolution, per feature                                                                                                                                                      | Lira charges per **verified outcome** — zero cost for failed or unnecessary resolutions                                                                  |
| **Static knowledge**               | Bots frozen at last knowledge base update                                                                                                                                                      | Lira learns from every escalation — measurably improves each week                                                                                        |
| **Omnichannel gap**                | 73% of customers expect continuity across channels; only 33% of companies deliver (Zendesk)                                                                                                    | Lira holds full context across email, chat, and voice in a single customer thread                                                                        |
| **Blind to visual context**        | All tools require customers to describe problems in text; screenshots processed manually by humans                                                                                             | Lira analyzes screenshots and live screen state with GPT-4o Vision — the AI sees exactly what the customer sees                                          |
| **AI black box**                   | No tool explains why the AI did what it did; no audit trail for regulators or legal teams                                                                                                      | Lira logs every decision, confidence score, and reasoning trace — every action is fully auditable and exportable                                         |
| **Technical-only deployment**      | Embedding support tools requires developer time, API knowledge, and backend setup                                                                                                              | Lira deploys via a single copy-paste script tag — no-code configuration dashboard, no developer required                                                 |
| **Support-to-product signal loss** | Bug reports and feature requests from customers die in support queues, never reaching product or engineering                                                                                   | Lira auto-routes customer signals to Linear and Slack, closes the loop when fixes ship                                                                   |
| **Support-only thinking**          | Every tool is built to handle tickets — none is built to build customer relationships or convert prospects                                                                                     | Lira handles the full customer lifecycle: prospect → trial → paid → expansion → renewal, all in one continuous AI conversation                           |
| **Punitive per-action pricing**    | Gorgias charges $0.90–$1 per automated interaction _on top of_ monthly fees — high support volume means runaway costs                                                                          | Lira charges a simple flat monthly fee — unlimited interactions, no per-resolution surcharge, predictable cost as you scale                              |
| **SaaS-blind tools**               | Gorgias is built for e-commerce orders and returns; Intercom/Zendesk are generic — neither understands SaaS-specific workflows like trials, seat expansion, API access, or usage-based billing | Lira is purpose-built for SaaS: trial-to-conversion, feature adoption, churn signals, usage-based upgrade triggers, developer-facing support             |
| **WhatsApp gap**                   | No major SaaS support tool natively supports WhatsApp as a relationship channel                                                                                                                | Lira captures WhatsApp in conversation and continues the customer relationship natively on WhatsApp — critical for Latin America, Southeast Asia, Africa |

**The cost of inaction:** Poor customer service costs businesses **$4.7 trillion/year** globally (Qualtrics). **61% of customers** have switched brands due to poor service (Appinventiv). **80% of business leaders** call CX a high priority — only **6%** saw CX quality actually improve in 2023 (Forrester).

---

## 3. The Eleven Pillars

### Pillar 1 — Proactive Support Engine

_"We noticed. We reached out. Problem solved."_

Lira connects to your product's event stream (via webhook). When a predefined trigger fires — payment failure, KYC verification stuck, fraud flag, API error spike, subscription about to expire — Lira automatically reaches out to the affected customer via email or voice before they even feel the pain.

**In fintech specifically:**

- Failed payment → Lira emails the customer with retry steps and a direct link
- KYC check blocked → Lira proactively asks for the required document before the customer's frustration builds
- Unusual transaction → Lira notifies the customer and confirms whether it was authorized, pre-empting a fraud complaint

**Why this matters:** The most expensive support ticket is one that turns into a churn event. Proactive outreach eliminates the complaint before it exists.

**Tech foundation:** Webhook receiver (already in Lira's External Webhooks system, Section 21.6). Event condition engine. Outbound trigger via Resend email (already built, Section 19) or Nova Sonic voice call.

**Proactive Autonomous Resolution Cycle:**

Lira's proactive engine doesn't just send notifications — it resolves:

1. **Continuous monitoring:** Lira autonomously polls connected systems (CRM, payment processor, transaction logs, API health checks) at configurable intervals for anomalous signals
2. **Anomaly detection:** Abnormal patterns — failed payments, stalled KYC, API error spikes, expiring documents — trigger the evaluation engine
3. **Context enrichment:** Before reaching out, Lira loads the customer's full profile, interaction history, churn risk score, and any open tickets
4. **Channel and tone selection:** Lira determines the right outreach channel (email vs. voice call), tone (informational vs. urgent), and timing (immediate vs. within-SLA)
5. **Resolution-first:** Where possible, Lira resolves the issue before reaching out — retries a payment, updates a record, clears a flag — then notifies the customer of what was done
6. **Follow-through:** If the customer responds, Lira continues the conversation in full context. If no response within the SLA window, Lira escalates to the human support team with the full proactive context attached

---

### Pillar 2 — Autonomous Action Engine

_"Lira doesn't just talk. She does."_

Every other support AI sends words. Lira takes actions.

When a customer has a problem, Lira doesn't send a reply that says "I've escalated your refund request." Lira **initiates the refund** in HubSpot, **creates the Jira ticket** in Linear, **messages the on-call engineer** in Slack, **updates the CRM record** in Salesforce, and **follows up with the customer** when the action is complete — all in a single autonomous chain, zero human in the loop unless the action requires judgment.

**Example full action chain (fintech):**

1. Customer emails: "My transfer of $2,000 has been pending for 3 days."
2. Lira queries the transaction ID from the CRM (HubSpot/Salesforce)
3. Lira checks the transaction status via API
4. Lira determines the transaction is stuck due to compliance hold
5. Lira creates a priority ticket in Linear tagged `compliance-hold`
6. Lira messages the compliance team channel in Slack with full context
7. Lira replies to the customer: "I've flagged this as urgent to our compliance team. You'll hear back within 2 hours. Reference: [ticket #]."
8. When the compliance team resolves the ticket, Lira follows up with the customer automatically.

No human had to read, route, copy, paste, or type anything.

**Tech foundation:** Lira already has full working integrations for HubSpot, Salesforce, Slack, Linear, GitHub, and Teams (Section 21). The action engine is an orchestration layer on top of existing integration SDKs + GPT-4o-mini for decision logic.

---

### Pillar 3 — Lifetime Customer Memory

_"Lira already knows you."_

Today, every support bot resets on every session. The customer explains their problem again. The AI has no idea they called yesterday, that they're a 4-year customer, that their last 3 tickets were escalated, or that they churn-risk scored 87 last week.

Every Lira customer has a **persistent Customer Profile** stored across their entire history with your company:

- Every conversation (email, chat, voice) — stored and indexed
- Every action taken on their behalf — logged
- Every resolution outcome — tracked
- Sentiment trend over time
- CRM data synced bidirectionally (HubSpot/Salesforce)
- Risk flags (churn score, escalation frequency, VIP tier)

When a customer reaches out, Lira walks into the conversation already knowing everything. She greets them by name, references their last interaction, and solves the problem faster because she never starts cold.

**Tech foundation:** DynamoDB already stores transcripts with speaker attribution (Section 8.7). Organization Context System already manages a knowledge base with vector search via Qdrant (Section 18). Customer profiles are a natural extension of the existing data model — one DynamoDB table per org mapping `customerId → interactionHistory[]`.

---

### Pillar 4 — Voice-Native Support

_"Call Lira. She picks up."_

Intercom, Zendesk, Freshdesk — all fundamentally text/chat tools with voice bolted on late. The voice experience is always an afterthought: clunky IVR trees, long hold times, misrouted calls.

Lira was built voice-first. The same Nova Sonic (AWS Bedrock) model that participates in live meetings, conducts interviews, and coaches sales reps — is the same AI that answers your customer support calls.

- Responds in natural, human-sized voice (1-3 sentence responses)
- Handles barge-in (customer interrupts — Lira stops and listens)
- No hold music. No IVR. No "press 1 for billing."
- Full context from the Customer Memory profile — the voice AI knows the customer's history the moment the call connects
- Seamlessly hands off to email follow-up after the call ends

**Tech foundation:** Nova Sonic bidirectional streaming is fully built (Section 6). Barge-in detection is already implemented (Section 6.6). The audio pipeline and wake word architecture extend naturally to inbound phone support.

---

### Pillar 5 — Self-Improving Knowledge

_"Lira gets 1% better every week without you doing anything."_

Current support bots are frozen. You train them once, they stay dumb in exactly that shape forever. Every time they fail, a human has to notice, diagnose, rewrite the docs, and retrain.

Lira's Self-Learning Engine:

1. **Escalation analysis** — every escalated ticket is fed back into GPT-4o-mini for root cause analysis: "Why couldn't Lira answer this?"
2. **Knowledge gap identification** — Lira identifies the specific missing information (e.g., "No documentation for API error code 4023")
3. **Draft generation** — Lira drafts the missing knowledge base entry and flags it for a human admin to approve with a single click
4. **Improvement metrics** — weekly dashboard showing: escalation rate trend, resolution rate trend, top unresolved topic categories
5. **Auto-publish** — after N human approvals, Lira can auto-publish low-risk knowledge updates without approval (configurable)

**The result:** Your support AI gets measurably smarter every week. Escalation rate goes down. Resolution rate goes up. Your team spends 10 minutes a week approving AI-drafted knowledge updates instead of writing them from scratch.

**Tech foundation:** Organization Context System already has website crawl + document RAG pipeline + vector search (Section 18). Self-learning is an escalation feedback loop: escalated ticket → GPT-4o-mini analysis → draft knowledge entry → Qdrant re-index.

---

### Pillar 6 — Flat, Predictable Pricing

_"Grow your customer base. Your support costs don't grow with it."_

Intercom charges per seat. Zendesk charges per agent. Gorgias charges $0.90–$1 per automated interaction on top of a monthly fee — meaning a company that handles 600 automated support interactions pays $540 in usage fees _on top of_ their plan price that month. A company handling 5,000 interactions pays $4,500 in usage charges alone.

**This model punishes growth.** The more customers you acquire, the higher your support bill. The better your AI performs, the more you pay.

**Lira's model is the opposite:**

| What Lira charges                                             | What Lira never charges                 |
| ------------------------------------------------------------- | --------------------------------------- |
| One flat monthly fee based on plan tier                       | Per-automated-interaction fees          |
| Optional add-ons for advanced channels (WhatsApp, SMS, Voice) | Per-resolution or per-ticket surcharges |
| Annual plans with significant discount                        | Overage penalties for support volume    |
| Enterprise custom pricing for large orgs                      | Seat-based fees as your team grows      |

**In plain English:** Pay once. Handle as many customer conversations as you need. Your cost is predictable whether Lira resolves 100 or 10,000 interactions that month.

For fast-growing SaaS companies, this is the single most important pricing difference. When you're scaling from 100 to 1,000 customers, you don't want your support bill multiplying in lockstep.

**Plans (indicative):**

- **Starter** — flat monthly fee, core channels (chat + email), up to N seats
- **Growth** — + voice, WhatsApp, advanced proactive triggers, Customer Relationship Engine
- **Scale** — + full audit trail, compliance exports, private cloud option, dedicated onboarding
- **Enterprise** — custom, SLA, on-premise deployment

**Tech foundation:** Usage metering already built (Section 23). Billing events already instrumented. Flat-fee model requires capping per-interaction cost inside Lira's own AI inference budget — GPT-4o-mini's low token cost makes this feasible at scale.

---

### Pillar 7 — Visual Intelligence Engine

_"Lira sees what you see."_

Most support tools are blind to visual context. When a customer says "my screen shows an error," they must describe it in words, attach a screenshot manually, and hope the agent interprets it correctly. That friction costs time, patience, and resolution accuracy.

Lira's Visual Intelligence Engine gives the AI eyes.

**Screenshot Analysis:**

- Customer uploads or pastes a screenshot directly in the chat widget or email
- Lira uses GPT-4o Vision to analyze the image: error messages, UI states, form field values, status indicators, loading states, network errors
- Lira cross-references the visual context against the org's knowledge base to pinpoint root cause
- Resolution is precise and contextual — not a generic troubleshooting checklist

**Live Screen Assist:**

- Customer initiates a live screen share session from the Lira chat widget with one click
- Lira's Screen Assist agent receives a real-time screen stream via WebRTC
- Lira analyzes the live screen state to understand exactly what the customer is experiencing
- Lira provides real-time voice and text guidance: _"I can see you're on the payments page. The red banner at the top means your bank rejected the pre-authorization — here's how to fix it in 30 seconds."_
- Screen Assist sessions are attached to the CustomerProfile for future reference

**Privacy controls:**

- Customer must explicitly initiate screen share — no passive monitoring
- Screen stream is processed server-side and not stored unless the customer explicitly consents
- Org-level controls: disable Screen Assist entirely, or restrict it to specific support tiers

**Tech foundation:** GPT-4o Vision API for screenshot analysis. WebRTC for live screen capture. Screen frames processed in Lira's backend and passed to the vision model with full conversation context. Visual analysis result injected into conversation context before the AI response is generated.

---

### Pillar 8 — Trustworthy & Auditable AI

_"Every decision. Every action. Every reason. Fully logged."_

The biggest blocker to enterprise AI adoption isn't capability — it's trust. A brand cannot deploy an AI that takes actions on customer accounts without being able to answer: _What did it do? Why did it do it? Can we prove it was right?_

Lira is built to be enterprise-auditable from day one — a brand can run it fully autonomously and still pass any internal audit or regulatory review.

**Full Decision Audit Trail:**

- Every intent classification logged with confidence score and AI reasoning
- Every action taken (CRM update, ticket creation, refund initiation) logged with: what data was used, what the AI's reasoning was, and the outcome
- Every escalation logged: why Lira decided to escalate, to whom, and when
- Audit logs are immutable, timestamped, and exportable to CSV or JSON

**Configurable Confidence Thresholds:**

- Org admins set minimum confidence scores per action type
- Below threshold → Lira drafts the action and queues it for human approval before executing
- Gradual trust-building path: start with approval-required for all actions, unlock full autonomy progressively as trust is earned

**Explainable Reasoning:**

- Every AI response has a hidden reasoning trace accessible to admins
- Admins see: which knowledge base chunks were used, confidence score, and alternatives considered
- Customers (optionally) see: _"Based on your account history and transaction records, here's what I found..."_

**Organization-Safe Guardrails:**

- Action allowlist: each org defines exactly which actions Lira is permitted to take autonomously
- Action rate limits: maximum N high-stakes actions (refunds, account changes) per hour without human review
- Conflict detection: if a proposed action contradicts recent CRM data, Lira flags it before executing
- Any action not on the allowlist → automatic escalation, no exceptions

**Compliance-Ready:**

- All interactions searchable for audit, dispute resolution, or regulatory review
- GDPR-compatible: customer data deletion removes all linked interaction history
- SOC 2-ready: immutable logs, access controls, configurable retention policies

**Tech foundation:** Append-only `AuditLog` table in DynamoDB. Reasoning trace stored alongside every `InteractionRecord`. Admin dashboard for audit log review, confidence threshold configuration, and action allowlist management. Role-based access control for audit log export.

---

### Pillar 9 — Support → Product Intelligence Pipeline

_"Your support conversations are your best product research. Lira routes them to the people who can act."_

In most companies, support and product are siloed. Customers report bugs, request features, and flag friction points — and that signal evaporates into a ticket queue the product team never reads. Lira closes that loop automatically.

**Signal Extraction:**

- Every resolved or escalated interaction is analyzed by GPT-4o-mini for signal type: bug report, feature request, UX friction, billing issue, documentation gap, compliance concern
- Confidence score assigned (0–100) — only high-confidence signals are routed automatically
- Signals auto-categorized and queued for product review

**Product Feedback Dashboard:**

- Real-time feed of customer signals categorized by type and volume
- Trend view: _"API error code 4023 appeared in 47 conversations this week — up 340% from last week"_
- Most-requested features ranked by customer frequency
- Friction hotspots: which product areas generate the most support volume
- Bug clusters: similar error reports grouped with full conversation transcripts attached

**Auto-Routing to the Right Team:**

- Bug reports → Linear issue tagged `from-support` with linked conversation transcript
- Feature requests → product backlog queue in Linear (configurable)
- Billing issues → finance/billing team pinged in Slack `#billing`
- Compliance flags → compliance team, P1 priority
- Engineering alerts → on-call engineer notified in Slack when error rates spike above threshold

**Closing the Loop:**

- When a Linear ticket originating from support is resolved, Lira automatically notifies the customer who first reported it: _"The issue you reported has been fixed in our latest update."_
- This converts frustrated customers into brand advocates.

**Tech foundation:** GPT-4o-mini signal extraction pipeline triggered on conversation close. Linear integration (already built) for ticket routing. Slack integration (already built) for team notifications. New `ProductSignal` table in DynamoDB.

---

### Pillar 10 — True Omnichannel Presence

_"Wherever your customer is, Lira is already there."_

73% of customers expect a seamless experience across channels. Most support tools offer multi-channel in name only — the email thread doesn't know about the chat session, the voice call doesn't know about the email from yesterday, and every channel starts fresh. The customer repeats themselves every time.

Lira is genuinely omnichannel: one AI, one memory, every channel, zero repetition.

**Channels Lira operates across:**

| Channel                 | Use Case                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **In-app chat widget**  | Embedded in the SaaS product — primary support and onboarding channel                          |
| **Website chat widget** | Pre-signup conversations — prospect qualification, demo booking, FAQs                          |
| **Email**               | Inbound support, proactive outreach, follow-ups, ticket notifications                          |
| **Voice (Nova Sonic)**  | Phone support, proactive calls, high-urgency escalations                                       |
| **WhatsApp**            | Relationship continuity, re-engagement, conversion follow-up — critical for LatAm, SEA, Africa |
| **SMS**                 | Short alerts, trial expiry nudges, authentication messages                                     |
| **Slack / Teams**       | Internal notifications to the client's own team, not customer-facing                           |

**What makes it truly omnichannel:**

- Every channel writes to the same `CustomerProfile` and `InteractionRecord` — the conversation history is unified regardless of where it happened
- When a prospect starts on the website chat and later emails in, Lira already knows them — no re-introduction, no repeated context
- WhatsApp number capture: when a customer or prospect is in a chat or email conversation, Lira can ask for their WhatsApp and continue the relationship there — opt-in, explicit consent, stored in the customer profile
- Channel preferences: Lira learns which channel each customer responds to fastest and defaults to it for proactive outreach
- Conversation continuity: a conversation started on email can continue on WhatsApp, and Lira carries the full thread context with it

**WhatsApp specifically:**
WhatsApp is not just another channel for Lira — it's a relationship layer. In Latin America, WhatsApp open rates exceed 90%. In Southeast Asia and Africa, it is effectively the internet for millions of SMB customers. Lira's ability to capture a WhatsApp number in conversation and maintain a long-running relationship thread there — sending onboarding tips, trial reminders, proactive issue alerts, renewal nudges, and support responses — is a capability no existing SaaS support tool offers.

**Tech foundation:** WhatsApp Business API (Meta) for WhatsApp. Twilio or similar for SMS. Existing Nova Sonic pipeline for voice. Existing Resend integration for email. Unified channel router dispatches to the correct channel adapter. All interactions write to the same DynamoDB `InteractionRecord` table regardless of channel.

---

### Pillar 11 — Customer Relationship Engine

_"Lira doesn't just close tickets. She builds relationships that close deals."_

Support and sales have always been treated as separate functions — support is reactive, sales is proactive. But every great customer relationship is a continuous conversation that spans both. The same person who asks "how do I set up my integration?" on day 3 is the person who decides whether to upgrade on day 60 and whether to renew on month 12.

Lira is the first AI that handles that entire arc as a single, continuous relationship — not siloed tools talking past each other.

**The SaaS Customer Lifecycle Lira Manages:**

**Stage 1 — Prospect (First Contact)**

- A visitor lands on the website. The Lira widget opens not with a generic greeting, but with a contextual question based on the page they're on: pricing page → pricing question, feature page → feature question
- Lira qualifies the prospect in natural conversation: company size, current tool, pain point, urgency
- Lira answers objections with product knowledge, real data, and relevant case studies — linked inline in the chat
- Lira books a demo, starts a trial, or captures contact details (including WhatsApp) to continue the conversation later
- If the prospect leaves without converting, Lira's relationship timeline is preserved — when they return, Lira remembers them

**Stage 2 — Trial User**

- The moment a trial starts, Lira already knows everything from the pre-signup conversation
- Lira monitors product usage and proactively guides the user toward the features that drive conversion: _"You've set up your knowledge base — the next step most teams do is connect their CRM. Want me to walk you through it?"_
- If the user goes quiet (inactivity signal), Lira re-engages on their preferred channel: _"Hey, noticed you haven't logged in — did anything get in the way?"_
- Lira provides proactive onboarding help — the user never has to file a support ticket to get unstuck

**Stage 3 — Conversion**

- 3–5 days before trial ends, Lira initiates a conversion conversation — not a generic "your trial is expiring" email, but a personalised message referencing what the user actually did in the product
- Lira handles pricing objections in real-time with ROI framing specific to the customer's use case
- For B2B, Lira can identify the decision-maker and adapt its messaging accordingly

**Stage 4 — Paying Customer (Support + Retention)**

- Full support capabilities activate: knowledge base, ticket creation, escalation, visual intelligence, audit trail
- Lira monitors for churn signals: reduced usage, failed payments, negative sentiment in conversations, support escalation frequency
- Lira proactively re-engages at-risk customers before they churn: _"We noticed you've been using X less this month — is there something we can help with?"_

**Stage 5 — Expansion**

- When usage approaches plan limits, Lira proactively surfaces an upgrade: _"You're at 90% of your monthly limit. Here's what the next plan unlocks — the math on why it pays for itself."_
- When the customer's team grows (detectable from CRM or product data), Lira suggests seat expansion
- Lira identifies which features the customer hasn't activated and positions them as upsell opportunities with clear value framing

**Stage 6 — Renewal**

- 30 days before contract renewal, Lira opens a renewal conversation with a personalised summary: _"Over the past year, Lira handled X support interactions, saved your team Y hours, and helped convert Z trial users. Here's what renewing looks like."_
- Lira handles renewal objections and, where configured, can apply retention discounts autonomously within approved limits

**Sales Intelligence Layer:**

- Full product knowledge base — Lira knows every feature, every integration, every use case, every pricing tier
- Objection handling playbook — loaded from the org's sales materials, updated when the product changes
- Competitor intelligence — Lira knows how to position against alternatives when a prospect mentions a competitor
- Content linking — Lira links to relevant blog posts, case studies, docs, and video walkthroughs inline in conversation
- Conversion tracking — every conversation linked to a lifecycle outcome, feeding the analytics dashboard

**Tech foundation:** Lifecycle stage tracking added to `CustomerProfile` (`stage` field). Sales intelligence loaded from org knowledge base (same Qdrant pipeline). WhatsApp API for relationship continuity. Intent classifier extended to detect sales intent vs. support intent. New `ConversionEvent` table tracking lifecycle transitions.

---

## 4. Product Architecture

```
INBOUND CHANNELS
├── Website chat widget (pre-signup, prospect qualification)
├── In-app chat widget (trial + paying customer support)
├── Email (Resend inbound + custom domain — already built)
├── Voice (Nova Sonic — already built)
├── WhatsApp (Meta WhatsApp Business API)
├── SMS (Twilio)
└── Screenshot / Screen Share (Visual Intelligence Engine)
        │
        ▼
CUSTOMER IDENTITY RESOLVER
├── Match inbound to CustomerProfile in DynamoDB (across all channels)
├── Pull CRM context (HubSpot / Salesforce — already integrated)
├── Load full interaction history (every channel, unified thread)
└── Determine lifecycle stage: prospect / trial / paying / at-risk / churned
        │
        ▼
VISUAL INTELLIGENCE ENGINE (if media present)
├── Screenshot analysis — GPT-4o Vision identifies error, UI state, context
├── Live screen stream analysis — WebRTC + Vision frame-by-frame
└── Visual context injected into conversation before AI processes
        │
        ▼
INTENT + LIFECYCLE CLASSIFIER (GPT-4o-mini)
├── Classify intent: support / sales / onboarding / objection / churn signal
├── Determine confidence score
└── Route: support engine / relationship engine / escalation
        │
   ┌───┼───┐
   │   │   │
   ▼   ▼   ▼
SUPPORT   RELATIONSHIP ENGINE    ESCALATION + TICKETING
ENGINE    ├── Prospect qualify     ├── AI builds structured ticket
├── Query   ├── Objection handle     ├── Smart-route: eng/product/
│  KB+CRM  ├── Content link/demo      │   billing/compliance/VIP
├── Execute ├── Trial nudge          ├── Notify team (Slack/Teams)
│  actions ├── Conversion push      ├── Human-AI handoff brief
└── Confirm ├── Expansion trigger    └── Notify customer + ETA
   +follow  └── Renewal outreach
        │
        ▼
AUDIT ENGINE (every action, every decision)
├── Log intent classification + confidence score + reasoning trace
├── Log every action: payload, outcome, status
├── Enforce action allowlist and rate limits
└── Immutable audit trail → DynamoDB AuditLog table
        │
        ▼
OUTCOME VERIFIER
├── Was the customer satisfied? (CSAT check, reply sentiment)
├── Log lifecycle transition: did prospect convert? did trial upgrade?
├── Log outcome to Customer Memory
├── Flag for Self-Learning Engine if unresolved
└── Trigger billing ledger event
        │
        ▼
PRODUCT SIGNAL PIPELINE (on every resolved/escalated interaction)
├── Extract signal: bug / feature / UX friction / billing / compliance
├── Route to product dashboard + Linear / Slack by signal type
└── Close the loop: notify customer when their reported issue is fixed
        │
        ▼
PROACTIVE + RELATIONSHIP ENGINE (runs continuously in parallel)
├── Subscribes to product event webhooks
├── Monitors lifecycle signals: inactivity, usage limits, churn risk, trial expiry
├── Dispatches proactive outreach on preferred channel (email/WhatsApp/voice)
└── Resolves where possible before customer notices
```

---

## 5. Data Models

### CustomerProfile

```
{
  customerId: string,          // external ID from client's system
  orgId: string,               // Lira organization
  name: string,
  email: string,
  phone?: string,
  whatsappNumber?: string,     // captured in conversation, opt-in
  preferredChannel: "chat" | "email" | "voice" | "whatsapp" | "sms",
  crmId?: string,              // HubSpot contactId or Salesforce Id
  lifecycleStage: "prospect" | "trial" | "paying" | "at-risk" | "churned" | "expanded",
  tier: "standard" | "vip" | "enterprise",
  churnRiskScore?: number,     // 0-100, updated per interaction
  conversionScore?: number,    // 0-100, for prospects and trial users
  interactionHistory: InteractionRecord[],
  openTickets: TicketRecord[],
  resolvedTickets: TicketRecord[],
  sentimentTrend: "improving" | "stable" | "declining",
  lastContactedAt: ISO8601,
  totalInteractions: number,
  escalationCount: number,
  createdAt: ISO8601
}
```

### InteractionRecord

```
{
  interactionId: string,
  channel: "email" | "chat" | "voice" | "whatsapp" | "sms",
  direction: "inbound" | "outbound" | "proactive",
  intentType: "support" | "sales" | "onboarding" | "objection" | "churn_signal" | "expansion",
  timestamp: ISO8601,
  summary: string,
  transcript: TranscriptEntry[],
  resolution: "autonomous" | "escalated" | "pending" | "converted" | "re-engaged",
  lifecycleTransition?: string,  // e.g. "prospect→trial", "trial→paying"
  csat?: number,               // 1-5, if collected
  actionsExecuted: ActionLog[],
  knowledgeGapsIdentified: string[]
}
```

### ActionLog

```
{
  actionId: string,
  type: "crm_update" | "ticket_create" | "slack_notify" | "refund_initiate" | "email_send" | "follow_up_scheduled",
  integration: "hubspot" | "salesforce" | "linear" | "slack" | "teams" | "github",
  payload: Record<string, unknown>,
  status: "success" | "failed" | "pending",
  executedAt: ISO8601
}
```

### ProactiveTrigger

```
{
  triggerId: string,
  orgId: string,
  name: string,
  eventType: string,           // e.g. "payment.failed", "kyc.blocked"
  conditions: TriggerCondition[],
  outreachTemplate: string,    // handlebars template
  channel: "email" | "voice",
  enabled: boolean,
  createdAt: ISO8601
}
```

### AuditLog

```
{
  logId: string,
  orgId: string,
  interactionId: string,
  customerId: string,
  timestamp: ISO8601,
  eventType: "intent_classified" | "action_executed" | "escalation_triggered" | "knowledge_lookup",
  confidenceScore: number,         // 0-100
  reasoning: string,               // GPT reasoning trace
  actionType?: string,             // populated when eventType = action_executed
  actionPayload?: Record<string, unknown>,
  outcome: "success" | "failed" | "pending" | "blocked_by_allowlist",
  humanApprovalRequired: boolean,
  humanApprovedBy?: string,
  humanApprovedAt?: ISO8601
}
```

### ProductSignal

```
{
  signalId: string,
  orgId: string,
  interactionId: string,
  customerId: string,
  timestamp: ISO8601,
  signalType: "bug" | "feature_request" | "ux_friction" | "billing_issue" | "documentation_gap" | "compliance_concern",
  summary: string,
  confidenceScore: number,         // 0-100
  linkedLinearTicketId?: string,
  routed: boolean,
  routedTo: string[],              // e.g. ["slack:#engineering", "linear:product-backlog"]
  loopClosed: boolean,             // true when fix deployed and customer notified
  loopClosedAt?: ISO8601
}
```

### TicketRecord

```
{
  ticketId: string,
  orgId: string,
  customerId: string,
  interactionId: string,
  linearTicketId?: string,
  priority: "P1" | "P2" | "P3" | "P4",
  issueType: "technical_bug" | "billing" | "feature_request" | "account_access" | "compliance" | "general",
  routedTo: string,                // team destination
  aiSummary: string,
  aiSuggestedResolution: string,
  status: "open" | "in-progress" | "pending-customer" | "resolved" | "closed",
  assignedTo?: string,
  createdAt: ISO8601,
  resolvedAt?: ISO8601,
  slaDueAt: ISO8601,
  humanResolved: boolean
}
```

### ConversionEvent

```
{
  eventId: string,
  orgId: string,
  customerId: string,
  interactionId: string,         // the conversation that drove the transition
  timestamp: ISO8601,
  fromStage: string,             // e.g. "prospect"
  toStage: string,               // e.g. "trial"
  channel: string,               // which channel the conversion happened on
  aiDriven: boolean,             // true if Lira drove it autonomously
  revenueImpact?: number,        // populated on paid conversions and expansions
  notes?: string
}
```

---

## 6. Build Priority & Phases

### Phase 1 — Lira Support Foundation (What's Already Built)

The following are **already implemented** in Lira V1:

| Feature                                            | Where in current spec |
| -------------------------------------------------- | --------------------- |
| Email inbound/outbound with custom domain          | Section 19            |
| Knowledge base with RAG (vector search via Qdrant) | Section 18            |
| Knowledge base grounded AI reply engine            | Section 22            |
| Escalation routing                                 | Section 22            |
| HubSpot + Salesforce CRM integrations              | Section 21            |
| Linear ticket creation                             | Section 21            |
| Slack + Teams notifications                        | Section 21            |
| External webhook receivers                         | Section 21.6          |
| Voice AI (Nova Sonic, barge-in, personality)       | Sections 6, 7         |
| Usage tracking                                     | Section 23            |

**Phase 1 is already done.** It is a functional AI email support tool with CRM sync and escalation.

---

### Phase 2 — Customer Memory (8 weeks)

Extend existing DynamoDB + Qdrant architecture to include persistent customer profiles. Every inbound email is matched to a CustomerProfile. Full interaction history maintained. Sentiment tracking. Churn risk scoring via GPT-4o-mini.

**Key deliverables:**

- `CustomerProfile` table in DynamoDB
- Inbound email → customer identity resolution
- Conversation history loader for context injection at reply time
- Basic churn risk score (keyword + escalation frequency model)
- Customer history view in Lira dashboard

---

### Phase 3 — Autonomous Action Engine (6 weeks)

Build the orchestration layer that sequences multi-step actions across existing integrations. The integrations already work individually — this phase teaches Lira to chain them.

**Key deliverables:**

- Action planner (GPT-4o-mini decides what action sequence solves the request)
- Action executor (runs the planned sequence against existing integration SDKs)
- Action log with rollback support for critical operations (refunds, account changes)
- Confirmation + follow-up system (Lira tells customer what she did and when it's complete)
- Admin approval gate for high-stakes actions (configurable per action type)

---

### Phase 4 — Proactive Support Engine (4 weeks)

Extend the existing External Webhooks system (already implemented) to accept any client-defined product event and trigger outreach.

**Key deliverables:**

- Proactive trigger configuration UI (define event type + conditions + template)
- Inbound webhook → trigger evaluation → outreach dispatch
- Proactive outreach via email (Resend, already integrated)
- Proactive outreach via voice (Nova Sonic, already integrated)
- Proactive interaction logged to CustomerProfile

---

### Phase 5 — Self-Improving Knowledge Engine (4 weeks)

Add the feedback loop from escalations back into the knowledge base.

**Key deliverables:**

- Escalation analysis pipeline (GPT-4o-mini root cause analysis on escalated tickets)
- Knowledge gap identification and classification
- AI-drafted knowledge entry generator
- Admin approval UI (single-click approve/edit/reject)
- Weekly improvement metrics dashboard (escalation rate, resolution rate, top gaps)

---

### Phase 6 — Outcome-Based Pricing Engine (3 weeks)

Instrument all resolution outcomes and build the billing logic.

**Key deliverables:**

- CSAT collection (post-interaction email with 1-click rating)
- Outcome verifier (confirmed satisfied = billable event)
- Billing event log
- Usage dashboard showing resolved vs. escalated vs. proactive counts
- Per-outcome pricing API (for integration with Stripe or manual invoicing)

---

### Phase 7 — Visual Intelligence Engine (8 weeks)

Build screenshot analysis and live Screen Assist.

**Key deliverables:**

- Screenshot intake: chat widget upload handler + email attachment extraction pipeline
- GPT-4o Vision integration for image analysis with knowledge-base cross-reference
- Visual context injection into conversation context before AI response generation
- WebRTC-based live screen share: session initiation, stream capture, frame pipeline
- Frame-by-frame screen analysis passed to vision model with conversation context
- Screen Assist session logging to `InteractionRecord`
- Privacy controls: explicit consent flow, org-level Screen Assist toggle, no-store mode

---

### Phase 8 — Auditable AI & Compliance Infrastructure (6 weeks)

Build the full decision audit trail and configurable guardrail system.

**Key deliverables:**

- Append-only `AuditLog` table in DynamoDB
- Reasoning trace capture on every AI decision and action
- Confidence threshold configuration UI per action type in admin dashboard
- Action allowlist management UI (per org, per action type)
- Action rate limits (configurable: max N high-stakes actions per hour before human review)
- Conflict detection engine (proposed action vs. current CRM data)
- GDPR data deletion flow (full customer history purge on request)
- Audit log export: CSV / JSON, admin-only, with date-range filter
- Compliance report generator: weekly summary of all AI actions with outcomes

---

### Phase 9 — Support → Product Intelligence Pipeline (4 weeks)

Build the signal extraction and auto-routing pipeline.

**Key deliverables:**

- GPT-4o-mini signal extraction pipeline triggered on conversation close and escalation
- `ProductSignal` table in DynamoDB
- Product Feedback Dashboard: real-time signal feed, trend view, frequency rankings, bug clusters
- Auto-routing: Linear (bugs + feature requests) and Slack (billing, compliance, engineering alerts)
- Signal confidence threshold: only high-confidence signals routed automatically; low-confidence flagged for human review
- "Close the loop" notification: when a support-originated Linear ticket is resolved, notify original customer via email

---

### Phase 10 — Code & No-Code Deployment Layer (4 weeks)

Build the embed widget, REST API, and no-code configuration system.

**Key deliverables:**

- CDN-hosted JavaScript embed widget (`cdn.lira.ai/support.js`) with single-line integration
- No-code configuration dashboard: AI name/avatar, language, channels, knowledge base upload, escalation contacts, action allowlist, proactive trigger builder
- Sandbox preview mode: test full widget behavior without affecting production
- Full REST API endpoint suite for programmatic integration
- OpenAPI spec published at `api.lira.ai/docs`
- Webhook event registration and management API
- Multi-language support: English, Spanish, Portuguese, French

---

### Phase 11 — True Omnichannel + WhatsApp (6 weeks)

Build native WhatsApp, SMS, and unified cross-channel conversation threading.

**Key deliverables:**

- Meta WhatsApp Business API integration: inbound + outbound messaging
- WhatsApp number capture flow: in-chat opt-in, stored to `CustomerProfile.whatsappNumber`
- Unified conversation thread in DynamoDB: every channel writes to the same `InteractionRecord` set per customer
- Channel preference detection and storage: Lira tracks and learns which channel each customer responds to
- Cross-channel continuation: conversation started on web chat can be picked up on WhatsApp with full context intact
- SMS integration via Twilio: short proactive alerts, trial nudges, authentication messages
- Channel selector in no-code config dashboard: org enables/disables channels per plan tier
- WhatsApp template management UI: pre-approved message templates (required by Meta for outbound)

---

### Phase 12 — Customer Relationship Engine (10 weeks)

Build the full sales intelligence and lifecycle management layer.

**Key deliverables:**

- `lifecycleStage` field added to `CustomerProfile` with stage transition detection
- `ConversionEvent` table in DynamoDB: every lifecycle transition logged
- Intent classifier extended to detect sales intent, objection, churn signal, expansion opportunity
- Prospect qualification flow: configurable question sequences for website widget
- Objection handling playbook loader: org uploads sales materials, Lira indexes them
- Content linking engine: inline link recommendations to blog posts, case studies, docs based on conversation context
- Trial nurture sequences: configurable onboarding conversation flows triggered by product usage events
- Churn signal detection: usage drop + sentiment analysis → proactive re-engagement trigger
- Expansion trigger: usage approaching limit → upgrade conversation initiated proactively
- Renewal outreach: configurable days-before-renewal trigger with personalised usage summary
- Competitor intelligence loader: org uploads competitive positioning notes, Lira uses in prospect conversations
- Relationship analytics dashboard: conversion rate by channel, lifecycle stage distribution, AI-driven revenue attribution, churn saves

---

## 7. Competitive Positioning

|                                                       | Intercom Fin | Zendesk AI | Gorgias          | Freshdesk Freddy | **Lira** |
| ----------------------------------------------------- | ------------ | ---------- | ---------------- | ---------------- | -------- |
| Proactive outreach                                    | ❌           | ❌         | ❌               | ❌               | ✅       |
| Autonomous multi-system actions                       | ❌           | ❌         | ❌               | ❌               | ✅       |
| Lifetime customer memory                              | ❌           | Partial    | ❌               | ❌               | ✅       |
| Voice-native (same AI)                                | ❌           | ❌         | ❌               | ❌               | ✅       |
| Self-improving knowledge                              | ❌           | ❌         | ❌               | ❌               | ✅       |
| Flat pricing (no per-interaction fees)                | ❌           | ❌         | ❌               | ❌               | ✅       |
| BFSI-ready (fintech workflows)                        | Partial      | Partial    | ❌               | Partial          | ✅       |
| SaaS lifecycle management                             | Partial      | ❌         | ❌               | ❌               | ✅       |
| Meetings + Sales coaching bundled                     | ❌           | ❌         | ❌               | ❌               | ✅       |
| Screenshot + live screen analysis                     | ❌           | ❌         | ❌               | ❌               | ✅       |
| Auditable AI decisions + reasoning trace              | ❌           | ❌         | ❌               | ❌               | ✅       |
| No-code embed deployment                              | Partial      | Partial    | Partial          | Partial          | ✅       |
| WhatsApp native channel                               | ❌           | ❌         | ❌               | ❌               | ✅       |
| Support → product feedback pipeline                   | ❌           | ❌         | ❌               | ❌               | ✅       |
| Smart ticket routing (eng/product/finance/compliance) | ❌           | Partial    | ❌               | ❌               | ✅       |
| Prospect qualification + conversion                   | Partial      | ❌         | ✅ (e-comm only) | ❌               | ✅       |
| Trial nurture + churn prevention                      | ❌           | ❌         | ❌               | ❌               | ✅       |

---

## 8. Go-To-Market Wedge (For Your 100-Company List)

**Target profile:** SaaS companies with 5–200 employees, currently using Intercom, Zendesk, or Gorgias, paying $100–2,000/month for support tools, with high trial churn, limited support headcount, or operations in high-WhatsApp markets (Latin America, Southeast Asia, Africa).

**Opening pitch:**

> “Intercom charges you per seat whether your team uses it or not. Gorgias charges $1 per automated interaction — so your support bill grows every time your product succeeds. Lira charges a flat monthly fee, handles every conversation from first website visit to fifth renewal, and works on WhatsApp natively. Your best support agent, your best SDR, and your best CSM — all one AI.”

**First demo scenario (SaaS-specific):** Live demo showing a prospect landing on the pricing page, Lira qualifying them in conversation, linking a case study, capturing their WhatsApp number, following up the next day, handling a pricing objection, and converting them to a trial — then immediately switching into onboarding mode when they sign up, with zero human involvement throughout.

---

## 9. Success Metrics

| Metric                                           | Target (6 months post-launch)                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Autonomous resolution rate                       | > 70% of inbound tickets                                                       |
| Escalation rate                                  | < 30%                                                                          |
| Average first response time                      | < 30 seconds                                                                   |
| Proactive outreach conversion (ticket prevented) | > 40% of triggered events                                                      |
| Knowledge base improvement cycle                 | Weekly, < 10 min admin time                                                    |
| Customer CSAT (AI-resolved tickets)              | > 4.0 / 5.0                                                                    |
| NPS vs. Intercom customers                       | +20 points                                                                     |
| Screenshot analysis resolution rate              | > 85% of visual support queries resolved without escalation                    |
| Audit log completeness                           | 100% of AI decisions and actions logged with reasoning trace                   |
| Product signals surfaced per week                | Measurable, categorized, and routed to correct team within 1 hour              |
| No-code deployment time (new customer)           | < 10 minutes from signup to live widget                                        |
| Support → product loop closure rate              | > 60% of support-originated bugs resolved and customer notified within 30 days |
| Trial-to-paid conversion rate (AI-driven)        | Measurable baseline within 60 days of Phase 12 launch                          |
| WhatsApp response rate vs. email                 | Tracked per org, expected > 2x email open rates in LatAm/SEA markets           |
| Churn saves (proactive re-engagement)            | > 25% of at-risk customers re-engaged before churning                          |
| Expansion revenue attributed to Lira             | Measurable per org via ConversionEvent tracking                                |

---

_Lira Customer Support & Relationship Engine — built on Lira V1. The foundation is already there. The world has never seen what comes next._

---

## 10. Intelligent Ticketing & Smart Escalation Routing

### How AI Creates Tickets

Lira doesn't wait for a human to decide a ticket is needed. The system autonomously determines when, what, and where — building a complete, context-rich ticket before any human sees it.

**Automatic ticket creation triggers:**

- Autonomous resolution fails after two attempts (AI confidence drops below threshold)
- Customer sentiment detected as `frustrated` or `angry` with no resolution path found
- Action type is not on the org's autonomous action allowlist
- Issue requires system access Lira doesn't have (e.g., internal admin panels)
- Customer explicitly requests a human agent
- Compliance, legal, or financial threshold exceeded (configurable per org)
- VIP-tier customer contacts support for any reason — always escalated with full context

**What AI includes in every ticket:**

- Conversation summary (AI-generated, 2–3 sentences) + full verbatim transcript
- Customer profile snapshot: tier, account age, churn risk score, open and past issues
- AI classification: issue type, severity, estimated effort to resolve
- Actions already attempted by Lira and their outcomes
- Suggested next steps for the human agent
- Estimated priority (P1–P4) based on customer tier + issue severity + detected sentiment
- All relevant CRM data (HubSpot/Salesforce) attached automatically
- Links to related previous tickets from the CustomerProfile

### Smart Routing to the Right Team

| Issue Type                        | Destination                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| Technical bug / API error         | Engineering in Linear + Slack `#engineering`                 |
| Product UX friction               | Product team in Linear + Slack `#product`                    |
| Billing dispute / payment issue   | Finance/Billing in Slack `#billing`                          |
| Account access / security concern | Security team, P1 flag + immediate Slack DM to security lead |
| Feature request                   | Product backlog in Linear, no immediate interruption         |
| General inquiry (AI unresolved)   | Support queue in Linear + Slack `#support`                   |
| VIP customer — any issue          | Direct Slack DM to dedicated account manager, P1 priority    |
| Compliance / regulatory flag      | Compliance team, P1 tag + email notification                 |

### Escalation Dashboard

Every team gets a unified escalation dashboard scoped to their queue:

- **Inbox view:** all open tickets sorted by priority, customer tier, and SLA urgency
- **Ticket detail:** AI-compiled context, full conversation, customer profile, suggested resolution
- **One-click actions:** resolve, reassign, escalate further, request more info from customer
- **SLA timers:** countdown based on customer tier and issue severity (configurable)
- **AI assist:** for each open ticket, Lira surfaces similar resolved tickets and recommends a resolution
- **Status tracking:** open → in-progress → pending-customer → resolved → closed, with automatic customer notification at each state change

### Human-AI Handoff Protocol

When a ticket escalates to a human agent:

1. Agent receives a full AI-compiled context brief — no re-reading the conversation from scratch
2. Lira stays available in the ticket thread — agent can invoke `@lira suggest` for real-time recommendations
3. After the human resolves the ticket, Lira logs the resolution pattern to the Self-Learning Engine
4. Lira sends the customer follow-up confirming resolution, unless the agent prefers to send it personally
5. Resolution outcome logged to `CustomerProfile` and to the billing ledger if Lira partially resolved it

---

## 11. Deployment — Code & No-Code

Lira Customer Support deploys to any product regardless of technical sophistication. A startup in Colombia, a fintech in Nigeria, a lending company in Mexico — any team should be able to add Lira to their product in under 10 minutes.

### No-Code Deployment (Copy-Paste Embed)

**The Lira Support Widget** requires one line of HTML:

```html
<script
  src="https://cdn.lira.ai/support.js"
  data-lira-key="YOUR_ORG_KEY"
  data-lira-lang="es"
  data-lira-channel="chat,voice"
></script>
```

The widget appears, connects to the org's knowledge base, and starts handling customer queries. No backend work required.

**No-code configuration via Lira Dashboard:**

- Set the AI's name, avatar, and opening greeting
- Set language: English, Spanish, Portuguese, French (more on request)
- Set active channels: chat only / chat + voice / chat + voice + Screen Assist
- Upload knowledge base: paste a URL, upload PDFs, connect Notion or Google Drive
- Define escalation contacts: who gets notified when the AI can't resolve
- Set the autonomous action allowlist: what can Lira do without asking?
- Configure proactive triggers: which product events should Lira act on proactively?
- Preview and test in a sandbox environment before going live — zero risk to production

### API & Code Deployment

For engineering teams that want programmatic control:

**REST API endpoints:**

```
POST /v1/support/conversation          — start a new support conversation
POST /v1/support/message               — send a message to an active conversation
GET  /v1/support/conversation/{id}     — retrieve conversation + full transcript
GET  /v1/support/ticket/{id}           — retrieve a specific ticket
GET  /v1/support/tickets               — list tickets (filterable by status/team/priority)
POST /v1/support/webhook               — register a proactive trigger via API
GET  /v1/support/customer/{id}         — full customer support history
POST /v1/support/screenshot            — submit a screenshot for visual analysis
POST /v1/support/screen-session        — initiate a live Screen Assist session
GET  /v1/support/audit-log             — retrieve audit trail (admin only)
```

**Webhook event registration:**

```json
{
  "event": "payment.failed",
  "customer_id_field": "user_id",
  "metadata_fields": ["amount", "currency", "failure_reason"],
  "outreach_template": "payment_failed_es",
  "channel": "email",
  "delay_minutes": 0
}
```

**SDKs (roadmap):**

- `npm install @lira/support` (Node.js / TypeScript)
- `pip install lira-support` (Python)
- Full OpenAPI spec at `api.lira.ai/docs`

**Deployment environments:**

- **SaaS (default):** fully managed, zero infrastructure, instant onboarding
- **Private cloud:** deploy Lira's inference layer to the org's own AWS / GCP / Azure VPC
- **On-premise (enterprise):** full self-hosted deployment for strict data residency requirements

---

## 12. The Gorgias Comparison — Why SaaS Needs Its Own Tool

Gorgias is the best customer support tool ever built for e-commerce. 17,000 brands use it. It handles order edits, returns, Shopify integrations, and product recommendations in a single AI conversation. It is genuinely excellent at what it does.

**But Gorgias is not built for SaaS.** And every gap in Gorgias's model is a feature in Lira's.

| Dimension                         | Gorgias (E-commerce)                             | Lira (SaaS)                                                                       |
| --------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Primary workflow**              | Order status, returns, refunds, Shopify edits    | Trial conversion, onboarding, feature adoption, billing support, churn prevention |
| **Pricing model**                 | $0.90–$1 per automated interaction + monthly fee | Flat monthly fee, unlimited interactions                                          |
| **Key integrations**              | Shopify, BigCommerce, Magento, WooCommerce       | HubSpot, Salesforce, Linear, Slack, GitHub, Stripe, usage-based billing APIs      |
| **Lifecycle handling**            | Transactional (one-time buyers, returns)         | Recurring (trials, subscriptions, expansions, renewals)                           |
| **Sales capability**              | Product recommendations, discount codes, upsells | Prospect qualification, objection handling, demo booking, trial nurture, renewal  |
| **Target market**                 | E-commerce brands on Shopify                     | SaaS companies of any size, any industry                                          |
| **WhatsApp**                      | ❌                                               | ✅ (native, relationship-first)                                                   |
| **Voice AI**                      | Add-on, not native                               | Native Nova Sonic — same AI speaks and types                                      |
| **Audit trail**                   | ❌                                               | ✅ Full decision + action audit log                                               |
| **SaaS trial management**         | ❌                                               | ✅ Trial stage detection, usage monitoring, conversion triggers                   |
| **Screen share / visual support** | ❌                                               | ✅ WebRTC + GPT-4o Vision                                                         |
| **Works without Shopify**         | Rarely                                           | Always                                                                            |

**The bottom line:** Gorgias proved that a vertical-specific, relationship-first AI support tool beats generic horizontal tools. Lira is the same bet, made for SaaS — a market that is larger, recurring-revenue-based, and completely underserved by existing tools.

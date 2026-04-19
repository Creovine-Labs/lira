# Lira Customer Support — Product Specification

### "Don't wait for support tickets. Solve problems before they're filed."

> **Version:** 1.0 — April 2026
> **Audience:** Engineering, Product, Sales, Investors
> **Status:** Specification — Ready for Build Prioritization

---

## 1. The Vision

Every AI support tool on the market today is a **reactive inbox with a chatbot bolted on top.**

Customer messages → AI looks up knowledge base → AI replies or escalates → Human takes over.

That is Intercom. That is Zendesk. That is Freshdesk. That is every tool charging you $500/month to do what a smart search bar used to do for free.

**Lira Customer Support is different at the architecture level.**

It is the world's first **Proactive Autonomous Support AI** — a system that monitors your product's event stream, reaches out to customers _before_ they complain, and when they do reach out, takes real actions across all your connected systems — not just sends replies.

It doesn't wait. It doesn't deflect. It resolves.

---

## 2. Market Gap (Backed by Data)

| Gap                      | What Exists Today                                                                           | What Lira Does                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Reactive only**        | Every tool waits for the customer to open a chat                                            | Lira monitors events and messages customers proactively                                 |
| **Answers, doesn't act** | AI gives text replies; human must push buttons                                              | Lira executes full action chains across HubSpot, Salesforce, Slack, Linear, ticketing   |
| **Zero memory**          | Every session starts fresh; customer repeats themselves                                     | Lira maintains full lifetime customer context across every channel                      |
| **Text-first**           | Voice is a bolt-on afterthought                                                             | Lira is voice-native (Nova Sonic) — same AI speaks and types                            |
| **Punitive pricing**     | Pay per seat, per resolution, per feature                                                   | Lira charges per **verified outcome** — zero cost for failed or unnecessary resolutions |
| **Static knowledge**     | Bots frozen at last knowledge base update                                                   | Lira learns from every escalation — measurably improves each week                       |
| **Omnichannel gap**      | 73% of customers expect continuity across channels; only 33% of companies deliver (Zendesk) | Lira holds full context across email, chat, and voice in a single customer thread       |

**The cost of inaction:** Poor customer service costs businesses **$4.7 trillion/year** globally (Qualtrics). **61% of customers** have switched brands due to poor service (Appinventiv). **80% of business leaders** call CX a high priority — only **6%** saw CX quality actually improve in 2023 (Forrester).

---

## 3. The Six Pillars

### Pillar 1 — Proactive Support Engine

_"We noticed. We reached out. Problem solved."_

Lira connects to your product's event stream (via webhook). When a predefined trigger fires — payment failure, KYC verification stuck, fraud flag, API error spike, subscription about to expire — Lira automatically reaches out to the affected customer via email or voice before they even feel the pain.

**In fintech specifically:**

- Failed payment → Lira emails the customer with retry steps and a direct link
- KYC check blocked → Lira proactively asks for the required document before the customer's frustration builds
- Unusual transaction → Lira notifies the customer and confirms whether it was authorized, pre-empting a fraud complaint

**Why this matters:** The most expensive support ticket is one that turns into a churn event. Proactive outreach eliminates the complaint before it exists.

**Tech foundation:** Webhook receiver (already in Lira's External Webhooks system, Section 21.6). Event condition engine. Outbound trigger via Resend email (already built, Section 19) or Nova Sonic voice call.

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

### Pillar 6 — Outcome-Based Pricing

_"You don't pay for our failures."_

Intercom charges per resolution — including failed ones. Zendesk charges per agent seat whether they're needed or not. Every incumbent punishes you for having more customers or complex problems.

**Lira's pricing model:**

| What you pay for                                         | What you don't pay for                        |
| -------------------------------------------------------- | --------------------------------------------- |
| Verified customer satisfaction (CSAT confirmed positive) | Failed resolutions that escalated to a human  |
| Proactive outreach that prevented a ticket               | Messages sent that received no reply          |
| Action chains fully completed autonomously               | Human reviews of AI-drafted knowledge updates |
| Voice calls fully resolved by AI                         | Calls that transferred to a human agent       |

**In plain English:** If Lira doesn't solve it, you don't pay. The incentive is permanently aligned — Lira is built to resolve, not to answer.

This pricing model alone will make every mid-market BFSI company's finance team sign off on switching from Intercom.

---

## 4. Product Architecture

```
INBOUND CHANNELS
├── Email (Resend inbound + custom domain — already built)
├── Chat widget (web embed)
└── Voice (Nova Sonic — already built)
        │
        ▼
CUSTOMER IDENTITY RESOLVER
├── Match inbound to Customer Profile in DynamoDB
├── Pull CRM context (HubSpot / Salesforce — already integrated)
└── Load full conversation history from Customer Memory
        │
        ▼
INTENT CLASSIFIER (GPT-4o-mini)
├── Classify: information request / action request / complaint / escalation needed
├── Determine confidence score
└── Route: autonomous resolution vs. human escalation
        │
     ┌──┴──┐
     │     │
     ▼     ▼
AUTONOMOUS         ESCALATION
ACTION             ENGINE
ENGINE             ├── Create ticket (Linear — integrated)
├── Query          ├── Notify team (Slack/Teams — integrated)
│  data sources    ├── Assign to agent
├── Execute        └── Notify customer with ETA
│  actions
│  (CRM/Linear/
│  Slack/GitHub)
└── Confirm +
   follow up
        │
        ▼
OUTCOME VERIFIER
├── Was the customer satisfied? (CSAT check, reply sentiment)
├── Log outcome to Customer Memory
├── Flag for Self-Learning Engine if unresolved
└── Trigger billing event if outcome = resolved
        │
        ▼
PROACTIVE ENGINE (runs in parallel)
├── Listens to product event webhooks
├── Evaluates trigger conditions
└── Initiates outreach before customer contacts support
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
  crmId?: string,              // HubSpot contactId or Salesforce Id
  tier: "standard" | "vip" | "enterprise",
  churnRiskScore?: number,     // 0-100, updated per interaction
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
  channel: "email" | "chat" | "voice",
  direction: "inbound" | "outbound" | "proactive",
  timestamp: ISO8601,
  summary: string,
  transcript: TranscriptEntry[],
  resolution: "autonomous" | "escalated" | "pending",
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

## 7. Competitive Positioning

|                                   | Intercom Fin | Zendesk AI | Freshdesk Freddy | **Lira** |
| --------------------------------- | ------------ | ---------- | ---------------- | -------- |
| Proactive outreach                | ❌           | ❌         | ❌               | ✅       |
| Autonomous multi-system actions   | ❌           | ❌         | ❌               | ✅       |
| Lifetime customer memory          | ❌           | Partial    | ❌               | ✅       |
| Voice-native (same AI)            | ❌           | ❌         | ❌               | ✅       |
| Self-improving knowledge          | ❌           | ❌         | ❌               | ✅       |
| Outcome-based pricing             | ❌           | ❌         | ❌               | ✅       |
| BFSI-ready (fintech workflows)    | Partial      | Partial    | Partial          | ✅       |
| Meetings + Sales coaching bundled | ❌           | ❌         | ❌               | ✅       |

---

## 8. Go-To-Market Wedge (For Your 100-Company List)

**Target profile:** BFSI companies (payments, lending, compliance, crypto) with 20-500 employees, currently using Intercom or Zendesk, paying $300-$2,000/month for support tools, experiencing high support volume from customers asking about transaction status, KYC delays, API errors.

**Opening pitch:**

> "You're paying Intercom $X per month every time a customer asks why their payment failed. Lira knows about the failure before the customer does, reaches out first, and resolves it without a human touching it. You pay only when Lira actually solves the problem."

**First demo scenario (fintech-specific):** Live demo showing a payment failure event triggering a proactive outreach email, customer replying, Lira looking up the transaction in HubSpot, creating a priority ticket in Linear, notifying the Slack channel, and sending a follow-up to the customer — all in under 60 seconds with zero human involvement.

---

## 9. Success Metrics

| Metric                                           | Target (6 months post-launch) |
| ------------------------------------------------ | ----------------------------- |
| Autonomous resolution rate                       | > 70% of inbound tickets      |
| Escalation rate                                  | < 30%                         |
| Average first response time                      | < 30 seconds                  |
| Proactive outreach conversion (ticket prevented) | > 40% of triggered events     |
| Knowledge base improvement cycle                 | Weekly, < 10 min admin time   |
| Customer CSAT (AI-resolved tickets)              | > 4.0 / 5.0                   |
| NPS vs. Intercom customers                       | +20 points                    |

---

_Lira Customer Support — built on Lira V1. The foundation is already there. The world has never seen what comes next._

# Customer support — every scenario worth supporting

> **Version:** 1.0 — 2026-05-21
> **Purpose:** Exhaustive catalogue of where customers ask for help, what they typically need, and which Lira deployment format fits each. Use this to (a) decide what Lira ships next and (b) speak with prospects about whether Lira fits their use case.
> **Audience:** Founders, Product, Sales, Eng.

---

## How to read this doc

Every customer-support need lives at the intersection of three axes:

1. **Surface** — where the customer is when they need help (website, mobile app, email, etc.)
2. **Moment** — what stage of the relationship they're in (pre-purchase, onboarding, billing dispute, churn risk, etc.)
3. **Format** — what kind of support UI they see (corner widget, full help center, ticket form, voice call, etc.)

A single visitor on a marketing site (**surface**) evaluating pricing (**moment**) probably wants a corner widget (**format**). A churned customer reaching out via email (**surface**) demanding a refund (**moment**) needs ticketing + escalation (**format**). Same product, different shape.

Below is the full catalogue.

---

## 1. Surfaces — where customers are

### 1.1 Marketing website / landing pages

**Who's there:** anonymous prospects evaluating buying the product.

**Typical scenarios:**

- "What does this actually do?"
- "How much does it cost?"
- "Does it integrate with [X]?"
- "Is there a free trial?"
- "Compare you to [competitor]"
- "Book a demo with sales"
- "Is your company real / trustworthy?"

**Recommended Lira format:**

- **Corner widget** (highest leverage). Pre-sale qualification + objection handling.
- **Optional full /help page** for visitors who didn't find the widget or want to browse before buying.

**Current Lira support:** ✅ widget (the embed `<script>` tag), ✅ `/demo/help` style helpcenter.

---

### 1.2 Web app / SaaS product (logged-in)

**Who's there:** active customers mid-task.

**Typical scenarios:**

- "I clicked Save and got an error"
- "How do I do X?"
- "My data isn't syncing"
- "Why am I being charged this?"
- "I need to invite a teammate"
- "I forgot how to find the [Z] setting"
- "Cancel my subscription"

**Recommended Lira format:**

- **Corner widget** with verified-customer identification (HMAC-signed visitor flow). Lira knows the user's account, plan, recent activity → personalized answers.
- **In-app help screen / dedicated `/help` route** as a secondary path for users who want to browse.
- **Inline tooltips / "ask Lira" buttons** next to specific features (advanced).

**Current Lira support:** ✅ widget with verified visitor, ✅ customer-aware system prompt and tool calls (HubSpot/Salesforce/etc.).

---

### 1.3 Mobile app (iOS / Android, native or hybrid)

**Who's there:** customers on the go, often with one hand, often interrupted.

**Typical scenarios:**

- "I can't log in"
- "App crashed when I tapped X"
- "How do I export this data?"
- "I lost my receipt"
- "Push notifications aren't working"
- Quick chat while doing something else

**Recommended Lira format:**

- **Native chat screen** (embedded inside the app via SDK or webview)
- **Voice mode prominent** — mobile users prefer talking 3x more than desktop
- **Push notifications** for agent replies (Lira backend already supports FCM)
- Email fallback for issues that need attachment uploads

**Current Lira support:** ✅ widget loadable in webview, ✅ FCM push, ⚠️ native SDK is roadmap (Phase 2+).

---

### 1.4 Dedicated help center / support portal (subdomain or path)

**Who's there:** customers who specifically navigated to "get help" — high-intent.

**Typical scenarios:**

- Browse help articles + FAQs first
- Submit a ticket if articles don't help
- Track an existing ticket's status
- Chat with AI / human
- Find contact methods

**Recommended Lira format:**

- **Full-page chat as the centerpiece** (what `/demo/help` shows)
- **Sidebar / grid of help categories**
- **Article search**
- **Ticket submission form** for issues that need human handling later

**Current Lira support:** ✅ `/demo/help` full-page mode, ✅ ticket auto-creation + smart routing, ⚠️ help-article browsing UI not built (KB is consumed by AI, not shown directly to users).

---

### 1.5 Email (inbound + outbound)

**Who's there:** customers who prefer async, or who have a complex issue with attachments.

**Typical scenarios:**

- "Here's a screenshot of the error"
- Detailed bug report with logs
- Multi-day back-and-forth on a complex issue
- Receiving order/booking/billing notifications and replying
- Proactive outreach from us (payment failed, trial ending, etc.)

**Recommended Lira format:**

- **Custom support email address** (e.g. `support@yourco.com`)
- **AI auto-reply** with KB-grounded answers
- **Smart escalation** to humans when complexity exceeds threshold
- **Proactive outbound** via Resend (already wired)

**Current Lira support:** ✅ full email integration, ✅ Resend outbound, ✅ AI reply pipeline.

---

### 1.6 SMS

**Who's there:** customers in regions where SMS is the default channel; alerts and short interactions.

**Typical scenarios:**

- 2FA codes
- Order status updates
- Appointment reminders
- "Reply STOP to unsubscribe" loops
- Quick yes/no confirmations
- Outbound nudges (trial expiry, payment failure)

**Recommended Lira format:**

- **Outbound SMS** for proactive alerts
- **Inbound SMS** with simple short-message AI replies
- Avoid long conversations on SMS — escalate to chat or call

**Current Lira support:** ⚠️ roadmap. Twilio integration needed.

---

### 1.7 WhatsApp / Messenger / iMessage

**Who's there:** customers in LatAm/SEA/Africa where WhatsApp is the default; consumer-product customers globally.

**Typical scenarios:**

- Full support conversations (richer than SMS)
- Document/image sharing for billing / claims / returns
- Conversation continuity from web chat → WhatsApp for follow-up
- Re-engagement nudges
- Order confirmations and shipping updates

**Recommended Lira format:**

- **WhatsApp Cloud API integration** for the demo and production
- **Persistent thread** tied to customer profile across channels
- **Template messages** for outbound (Meta-required)

**Current Lira support:** ⚠️ in spec, roadmap Phase 2 — WhatsApp Business Cloud API integration. (The doc you have lays this out as a major wedge.)

---

### 1.8 Phone / voice (PSTN inbound + outbound)

**Who's there:** customers who pick up the phone — older demographics, urgent issues, complex matters, regions where calls are the default.

**Typical scenarios:**

- "I want to talk to a person"
- Banking / fraud reports
- Urgent issue under time pressure
- Account access recovery
- Complex billing disputes
- Outbound: collections, sales follow-up, payment retry confirmation

**Recommended Lira format:**

- **Voice-native AI agent** (Lira's Nova Sonic on Bedrock)
- **Inbound phone number** customers can dial
- **Outbound calls** for proactive resolution
- **Voicemail with callback** for off-hours
- Human handoff with full conversation context

**Current Lira support:** ✅ voice agent built (Nova Sonic, barge-in, etc.), ⚠️ PSTN inbound number provisioning is per-org setup.

---

### 1.9 Slack / Microsoft Teams (B2B customer support)

**Who's there:** enterprise B2B customers who want help in their work tool.

**Typical scenarios:**

- "Help me debug this integration"
- Dedicated #yourco-support channel
- Account-manager-style relationships
- Triaging tickets where the customer's team is multi-stakeholder

**Recommended Lira format:**

- **Shared Slack channel** between vendor and customer
- **AI bot in the channel** that answers basic questions
- **Escalates to humans** in same channel for complex issues

**Current Lira support:** ✅ Slack integration for routing notifications to vendor team. ⚠️ customer-facing Slack-Connect-style support is a future enterprise feature.

---

### 1.10 Social media DMs (Twitter, Instagram, Facebook)

**Who's there:** customers who tweet at brands instead of using support channels, or who DM after a public complaint.

**Typical scenarios:**

- Public complaint requiring private resolution
- "DM us your details and we'll look into it"
- High-visibility issues you need to handle gracefully
- Brand reputation moments

**Recommended Lira format:**

- **Unified inbox** that pulls in social DMs
- **AI triage** to classify urgency / sentiment
- **Human handoff** with brand-voice guidance

**Current Lira support:** ⚠️ not built. Lower priority than WhatsApp / email.

---

### 1.11 Live event / in-person / physical kiosks

**Who's there:** users at conferences, retail, banking branches, event venues.

**Typical scenarios:**

- Kiosk-based check-in
- Conference Q&A
- In-store product questions
- Banking branch self-service

**Recommended Lira format:**

- **Voice-only mode** on the kiosk (no keyboard)
- **Touchscreen widget** for simpler in-store tablets
- **QR code → mobile chat** so the customer continues on their own phone

**Current Lira support:** Voice mode works in any browser context. Kiosk/retail deployment is implicit — same widget, just rendered on different screen.

---

### 1.12 Status page / incident communication

**Who's there:** customers checking if a known incident is affecting them.

**Typical scenarios:**

- "Is the API down right now?"
- "Why was X slow this morning?"
- Subscribing to status updates
- Reading post-mortems

**Recommended Lira format:**

- **Standalone status page** (statuspage.io style)
- **Lira AI deflection** — when a customer asks "is X down?" she can check the live status and respond instead of routing to support
- **Proactive notifications** during incidents

**Current Lira support:** ⚠️ no status page built. Could be a future Lira-managed offering. Today: orgs use their own status page (Statuspage, BetterStack) and Lira escalates accordingly.

---

### 1.13 Voice assistant integrations (Alexa, Google Assistant, Siri)

**Who's there:** customers using a voice-first interface for support.

**Typical scenarios:**

- "Alexa, ask Acme what my balance is"
- Smart-home appliance support
- Accessibility-driven voice usage

**Recommended Lira format:**

- **Native voice assistant skill / action** that calls Lira's voice API
- Same Nova Sonic backend, different entry point

**Current Lira support:** ⚠️ not built. Niche.

---

### 1.14 Browser extension

**Who's there:** power users who installed a Chrome extension that includes a help button.

**Typical scenarios:**

- "How does this extension work?"
- "Why isn't it activating on this site?"
- Extension-specific bug reports

**Recommended Lira format:**

- **Widget loaded inside the extension popup** (same embed code)

**Current Lira support:** ✅ works — the widget loads in any web context.

---

### 1.15 API / developer integrations

**Who's there:** developers integrating against Lira programmatically, or against the customer's API that Lira's running on top of.

**Typical scenarios:**

- API error codes and debugging
- Authentication issues
- Rate limit clarifications
- Integration patterns

**Recommended Lira format:**

- **Docs-aware chat** on the API docs page
- **Discord / Slack community** for async dev help
- **API status responses** that include "click here to chat with our team"

**Current Lira support:** ✅ chat works on docs sites. ⚠️ no dedicated developer community channel.

---

## 2. Moments — when customers reach out

Cross-cuts every surface. Each moment shapes urgency and tone.

| Moment                            | Typical surface                  | Lira behavior                                        |
| --------------------------------- | -------------------------------- | ---------------------------------------------------- |
| **Pre-purchase / evaluation**     | Marketing site widget            | Qualify, link case studies, book demo, capture email |
| **Trial / onboarding**            | In-app widget, email nudges      | Proactive guidance, walkthrough offers               |
| **First payment / activation**    | In-app + email                   | Confirm, reduce friction, suggest next step          |
| **Active use ("how do I…")**      | In-app widget, KB                | Grounded answer + optional escalation                |
| **Stuck on error**                | In-app widget, screenshot upload | Diagnose, link KB, escalate if novel                 |
| **Billing dispute**               | Email, full-page portal          | Ticket creation, smart routing to finance            |
| **Refund request**                | Email, widget                    | Action chain — verify, refund, confirm               |
| **Cancellation moment**           | In-app, email                    | Retention offers, churn-save flow                    |
| **Renewal nudge**                 | Email, WhatsApp                  | Personalized summary, offer + payment link           |
| **Expansion ("upgrade my plan")** | In-app, sales contact            | Plan comparison, route to sales                      |
| **Security / fraud concern**      | Phone, email, P1 escalation      | Always-escalate intent, no AI guessing               |
| **Bug report**                    | Widget, email                    | Linear ticket + product-signal pipeline              |
| **Feature request**               | Widget, community                | Linear backlog + close-the-loop notification         |
| **Compliance / legal**            | Email, ticket                    | Always-escalate, audit trail                         |
| **Outage / incident**             | Status page, in-app banner       | Acknowledge known incident, defer non-related Qs     |

---

## 3. Formats — every shape a deployment can take

### 3.1 Widget on a site

Floating chat bubble in the corner. Most common. Best for in-context help.

### 3.2 Full help-center page (e.g. /help, help.yourco.com)

Chat is the page, optionally with category sidebar + KB search.

### 3.3 In-app help screen (mobile / web)

A dedicated route in the app — `/support` or "Help" tab. Often combines KB + chat.

### 3.4 Embedded inline ask box

"Ask Lira" button next to specific features — context auto-passed.

### 3.5 Modal / drawer (no dedicated route)

Opens over the current page, e.g. from a "Help" link in the nav.

### 3.6 Email-only (no chat)

Customers reach support exclusively via support@yourco.com.

### 3.7 Ticket-only (no chat)

Form-based submission — typical for legacy enterprise B2B.

### 3.8 Voice call (inbound number)

Customer dials a number, AI picks up.

### 3.9 Voice call (outbound)

We proactively call for high-urgency issues.

### 3.10 Async messaging (WhatsApp / iMessage / SMS)

Conversation that crosses days; can pause and resume.

### 3.11 Co-browse / screen share

Agent (human or AI) sees what the customer sees in real time.

### 3.12 Community forum

Users help each other; staff occasionally answer.

### 3.13 Self-serve KB only (no human, no chat)

Pure search-and-find documentation.

### 3.14 IVR / phone tree (legacy)

Press 1 for billing, press 2 for technical. Lira replaces these.

### 3.15 Office hours / live Q&A

Scheduled time when staff answer questions live (Zoom, etc.).

### 3.16 Concierge model

Dedicated human contact for enterprise accounts; AI assists the human.

### 3.17 Status banner / inline notice

Not "support" per se but reduces inbound by telling customers about known issues proactively.

---

## 4. Industries that bend the format choice

Different verticals push very different format priorities.

| Industry                               | Top formats                              | Why                                |
| -------------------------------------- | ---------------------------------------- | ---------------------------------- |
| **SaaS B2B**                           | Widget in product, email, dedicated CSM  | Technical depth, named accounts    |
| **SaaS B2C**                           | Widget, email                            | High volume, mostly self-serve     |
| **E-commerce**                         | Widget on site, WhatsApp, returns portal | Pre-purchase + post-purchase split |
| **Fintech / Banking**                  | Phone, secure chat, in-app               | Trust + urgency + regulation       |
| **Healthcare**                         | Phone, secure portal, in-app             | HIPAA, urgent, named providers     |
| **Insurance**                          | Phone, claims portal, email              | Claims process is form-heavy       |
| **Telecom**                            | Phone (IVR), social media, app           | Volume + outage events             |
| **Travel / Hospitality**               | Phone + WhatsApp + email                 | Time-critical, multi-channel       |
| **Gaming**                             | Email + in-game ticket + community forum | Account recovery, async            |
| **Education**                          | Email + community + widget               | Async, semester-paced              |
| **Government / Public sector**         | Phone + portal + email                   | Accessibility, compliance          |
| **Marketplace (Uber, DoorDash, Etsy)** | In-app, push notifications               | Real-time, location-aware          |
| **Real estate / B2B services**         | Email + concierge + phone                | Named accounts, slow async         |
| **Enterprise (large accounts)**        | Shared Slack/Teams + named TAM           | Strategic, named-contact model     |

---

## 5. Cross-cutting concerns (apply to all surfaces)

- **Anonymous vs identified** — HMAC-signed visitor context unlocks personalized answers
- **Multilingual** — auto-detect, route to language-specific KBs
- **Accessibility** — screen-reader compatibility, keyboard navigation, WCAG AA
- **Sensitive data handling** — PII auto-redaction, encryption at rest
- **Real-time vs async** — chat/voice are realtime; email/SMS/WhatsApp can be async with response-time SLAs
- **Embedded vs standalone** — embedded inherits the host site's auth/style; standalone owns its own
- **Mobile-first vs desktop-first** — voice prominence, touch targets, offline behavior
- **Time-zone / hours** — 24/7 AI; humans on hours
- **Brand voice** — consistent across surfaces; configurable system prompt

---

## 6. What Lira ships today — by format

| Format                          | Lira status                                        |
| ------------------------------- | -------------------------------------------------- |
| Corner widget (web)             | ✅ Production ready                                |
| Full help-center page           | ✅ Demo at `/demo/help`, generalizable per org     |
| In-app webview                  | ✅ Widget works in any web context                 |
| Email (custom domain)           | ✅ Production ready                                |
| Voice (browser-based WebRTC)    | ✅ Nova Sonic integration                          |
| PSTN inbound voice              | ⚠️ Per-org number provisioning required            |
| WhatsApp Business API           | ⚠️ Roadmap (Phase 2)                               |
| SMS via Twilio                  | ⚠️ Roadmap                                         |
| Slack/Teams customer-facing     | ⚠️ Roadmap (today: vendor-side notifications only) |
| Native mobile SDK (iOS/Android) | ⚠️ Roadmap                                         |
| Browser extension chat          | ✅ Widget works as-is                              |
| Status page                     | ❌ Not built                                       |
| Voice assistant skills (Alexa)  | ❌ Not built                                       |
| Social DMs (Twitter/IG)         | ❌ Not built                                       |

---

## 7. Priority recommendation for what to build next

Based on the SaaS-mid-market target market and current product gaps:

1. **WhatsApp Cloud API** (Phase 2 priority) — biggest unlock for LatAm/SEA/Africa, listed in spec, no real competitor for SaaS demographic
2. **Native mobile SDK** (Phase 2 priority) — makes us viable for B2C/consumer apps
3. **SMS via Twilio** (Phase 3) — easy add, lights up trial-expiry / payment-retry / appointment-reminder nudges
4. **Standalone status page** (Phase 3) — easy add, reduces inbound, brand trust signal
5. **In-app inline "ask Lira" buttons** (Phase 3) — UI primitive for SaaS embedding, low-eng-cost

Everything else is either already shipped or low priority.

---

## 8. Pitch language to use

When prospects ask "do you support [X]?", here's how to answer honestly:

- **Web widget** → "Yes, single-line embed."
- **Help-center page** → "Yes, full-page mode at your-subdomain/help."
- **Mobile app** → "Yes, via webview embed today; native SDK coming Q3."
- **Email** → "Yes, custom domain, AI-replies + smart escalation."
- **Voice / phone** → "Yes, browser-native voice today; PSTN inbound on Growth plan."
- **WhatsApp** → "On roadmap for Phase 2 — Q4 target. Want to be an early customer?"
- **Slack/Teams** → "We notify your team in Slack today. Customer-facing Slack Connect is on the enterprise roadmap."
- **API/SDK** → "Full REST API + WebSocket. Mobile SDKs Q3."
- **Status page** → "Not built. We integrate with Statuspage/BetterStack."

The honest matrix above lets sales pitch what's true today, what's near (Phase 2), and what's deferred — without overpromising.

---

_— End of document. Update when a new surface lands (e.g. WhatsApp ships) or when industry-specific demand reshuffles priorities._

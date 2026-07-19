# Lira — Complete Feature Reference

> **What Lira is:** a Conversational Intelligence platform whose flagship product is
> an **AI customer-support layer** that answers, guides, captures, and routes —
> grounded in each organization's knowledge and embedded inside their own product.
> Lira also extends into meetings and sales conversational intelligence.
>
> **Design stance:** non-agentic-by-default for regulated industries (Lira answers
> and routes; it does not move money or read individual financial records),
> data-minimal, and embeddable on the customer's own domain.

Legend: **● Live** · **◐ Partial / configurable** · **○ Planned**

---

## 1. Channels & surfaces

How end-customers reach support — all powered by one runtime, one knowledge base, one inbox.

- **● Full-page Support Center SDK** — an answer-first help page mounted on the customer's own route (e.g. `company.com/support`). Describe-your-issue input → inline AI answer + cited KB articles + suggestion buttons → opt-in chat → ticket escalation. Includes browse-topics, popular articles, an account panel, and the visitor's tickets. Default layout for full-page embeds.
- **● Floating chat widget** — a launcher bubble on any page; same runtime, no full page required. Home/Chat messenger surface.
- **● Email channel** — inbound email → AI answer → threaded outbound reply. Org gets a dedicated support address with domain-forwarding support.
- **● Voice (real-time)** — live voice conversations with the AI agent (Sonic/Pipecat runtime), with the same tools and escalation as chat.
- **● Hosted portal** — a no-code Lira-hosted support page for teams that can't ship product code yet (fallback, not the primary path).
- **● Web SDK (script tag, JS API, NPM/React)** — one-line script embed, a `window.Lira` JS API, and an `@liraintelligence/support` NPM package with React components (`LiraProvider`, `LiraSupportPage`, `LiraWidget`, `useLira`).
- **◐ Mobile** — SDK + push-notification registration (Flutter / React Native) guides.
- **○ WhatsApp Business API** — inbound/outbound, threaded, approved templates. _Planned._

---

## 2. AI support engine

- **● Knowledge-grounded answers (RAG)** — retrieves the org's content and answers only from it; no hallucinated features or navigation steps.
- **● Citations** — answers on the Support Center surface render their KB sources as clickable cards.
- **● Confidence gate** — low-confidence retrievals escalate instead of guessing (configurable threshold).
- **● Structured turns** — answer + "is this what you mean?" interpretations + next-step suggestions + sources + status, driving the button-led support page.
- **● Conversation memory** — remembers the thread (not the customer's financial records).
- **◐ Brand voice & greeting** — per-org tone and greeting configuration.
- **● Financial-advice refusal** — declines investment/financial/tax/legal advice and hands off (per-org toggle, on by default).
- **○ Multilingual** — Nigerian Pidgin / Yoruba / Hausa / Igbo with per-language eval gates; language auto-detect. _Planned._

---

## 3. Knowledge base

- **● Multi-source ingestion** — website crawl, document upload (chunking + extraction), and connected sources → embedded into a vector store (Qdrant).
- **● Semantic + hybrid search** over the indexed knowledge.
- **● Freshness / staleness detection** — flags articles not updated within a configurable window (`kb_stale_after_days`) for human review.
- **● Self-improving knowledge loop** — escalations and gaps generate draft KB entries for human approval.
- **◐ KB gap detection** — surfaces questions the knowledge base couldn't answer.

---

## 4. Tickets, SLA & case management

- **● Complaint/ticket capture** — any chat/email conversation can become a tracked, categorized ticket.
- **● AI classification** — category, subcategory, priority, language, product area.
- **● Smart routing** — to the right team/queue based on classification.
- **● Queues & teams** — multiple queues, team membership, and assignment (auto-assignment worker + manual).
- **● SLA engine** — first-response and resolution deadlines with ok → at-risk → breach tracking and pre-breach notification.
- **◐ CBN-aligned SLAs** — configurable acknowledgement (default 24h) and resolution (default 14 days) targets for regulated complaints.
- **● Ticket threads** — public customer-facing thread separate from internal notes; attachments supported.
- **● Visitor ticket access** — verified (HMAC) or magic-link access for customers to track/reply to their tickets.
- **● Audit trail & export** — ticket event history and audit export for dispute defense.
- **● Auto-resolve** — idle conversations can resolve automatically after a configurable window.

---

## 5. Escalation & human handoff

- **● Automatic handoff triggers** — VIP customer, negative sentiment, repeated failure, going-in-circles, and SLA-pressure (each toggleable with thresholds).
- **● Structured handoff brief** — humans receive a concise brief (issue, what the AI tried, what's needed), not a raw transcript.
- **● Clean boundary** — the support page is AI + links + in-app help; human-to-human conversation happens in the Tickets section (ticket chat + email), keeping the two surfaces separate.

---

## 6. Agent runtime, actions & safety

- **● Customer action layer** — host apps register actions/resources (`registerAction` / `registerResource`) the agent can invoke; results flow back via events and tracking.
- **● Tool packs** — bundled agent capabilities configurable per org.
- **● Policy & guardrails** — auth scopes (public / verified_visitor / verified_customer) and risk tiers (read → safe_write → step-up → human-only) govern what the agent may do.
- **● Human-in-the-loop** — inline confirm prompts and PIN/step-up gating for sensitive actions.
- **● PII redaction** — BVN/NIN, NUBAN accounts, card PANs (Luhn), phone numbers, and emails are scrubbed before reaching the LLM, before storage, and out of logs.
- **● Live product context** — host apps pass route/account context so the agent answers in-context.

---

## 7. Proactive

- **● Broadcast proactive** — maintenance notices, feature news, outage alerts (no per-customer financial data).
- **○ Per-customer proactive** — event-driven, deferred and gated behind a data-processing agreement. _Planned._

---

## 8. CSAT & analytics

- **● CSAT** — post-resolution satisfaction capture.
- **● Support analytics** — deflection rate, top questions, volume vs. plan cap, SLA compliance, first-response times, and ticket analytics.
- **● Usage metering** — conversations and AI replies counted per org per month against tier limits.

---

## 9. Admin dashboard

- **● Unified inbox** — all conversations across channels in one place.
- **● Ticket board** — status tracking + SLA view.
- **● Customers** — customer profiles, tiers, history.
- **● Knowledge manager** — upload/crawl/connect sources, review drafts and stale articles.
- **● Settings** — channels, brand voice, escalation contacts, handoff triggers, queues, SLA policies, notifications, outbox.
- **● Pilot & compliance controls** — sandbox/production toggle, currency, financial-advice refusal, CBN SLA hours, KB staleness window (all no-code).
- **● Guided install ("Get connected")** — a 3-question chooser that yields the single tailored embed snippet, an email-to-developer hand-off, and a live "verify connection" check.
- **● Concierge onboarding** — admin-issued invite links gate prospect signup; activation flow stands up a new org.

---

## 10. Integrations

- **● Escalation/outbox** — Slack, Linear, and generic signed webhooks for ticket events.
- **● Notifications** — Slack / Microsoft Teams.
- **● CRM** — HubSpot and Salesforce contact linking.
- **● Email infrastructure** — per-org support addresses, inbound parsing, outbound via Resend, integration health checks.
- **● Webhooks** — inbound event receiver + outbound event stream.

---

## 11. Identity, security & compliance

- **● Signed visitor identity** — HMAC-SHA256 over the visitor email (computed server-side with the org's widget secret); degrades safely to anonymous on mismatch.
- **● Sandbox / production environments** — new orgs start in sandbox: no real outbound sends, a visible SANDBOX badge, and going live is a deliberate toggle.
- **● PII redaction** — see §6 (BVN/NIN/PAN/account/phone/email).
- **● Financial-advice refusal** — see §2.
- **● Audit logging** — ticket and action audit trails.
- **◐ Data-minimal & cross-border posture** — designed to store little personal data; cross-border transfer basis (NDPA/SCCs) handled at the contract layer for offshore infrastructure.

---

## 12. Localization

- **● Dynamic currency** — per-org ISO currency (USD default; NGN, KES, GBP, etc.) injected into agent responses; never hard-coded to one country.
- **◐ Locale formatting** — per-org locale field.
- **○ Local languages** — see §2 (planned).

---

## 13. Developer platform

- **● CDN runtime** — `https://widget.liraintelligence.com/v1/widget.js` exposing `window.Lira` (`init`, `identify`, `logout`, `setContext`, `track`, `open/close/toggle`, `registerAction`, `registerResource`, `mountWidget`, `mountSupportPage`, `destroy`).
- **● NPM package** — `@liraintelligence/support` + `/react`, with TypeScript types for config, identity, context, events, actions, and resources.
- **● Lifecycle events** — `open`, `close`, `unread_count`, `message`, plus action/resource result events.
- **● Layout option** — `mountSupportPage(target, { layout: 'support_center' | 'messenger' })`.
- **● Public docs** — Web SDK guide, widget guide, actions, tickets, analytics, audit, onboarding, portal, and integration guides.

---

## 14. Conversational intelligence beyond support

Part of Lira's broader positioning (conversational intelligence for support, sales, and meetings):

- **◐ Meeting intelligence** — meeting capture, transcription/diarization, scheduling, and meeting bots.
- **◐ Sales conversations** — real-time conversational support for sales calls.
- **◐ Tasks & scheduling** — task execution and scheduled jobs tied to conversations.
- **◐ Calendar sync** — calendar lookup and sync for scheduling.

_(These share the platform's knowledge, identity, and runtime but are outside the core customer-support surface documented above.)_

---

## 15. Pricing model

- **◐ Tiered flat pricing by query volume** (Starter / Growth / Scale / Custom) rather than per-resolution, with per-100 overage blocks.
- **◐ Usage metering** against tier caps; one-time setup/onboarding fee; add-on metering for high-COGS channels (WhatsApp, voice).

---

## 16. Roadmap (planned)

- **○ WhatsApp Business API** channel
- **○ AI-triggered, DOM-anchored product tours** + onboarding checklists (AI launches the right walkthrough from a chat question)
- **○ Inbound voice-note transcription** + voice replies (TTS)
- **○ Nigerian Pidgin / Yoruba / Hausa / Igbo** with eval gates and language auto-detect
- **○ Per-customer proactive** (event-driven, under DPA)
- **○ Visible SLA countdown UI** + live-connection verifier polish

---

_This document reflects the platform as currently built. Items marked ○ Planned are
designed/specced but not yet shipped; items marked ◐ are present and configurable
but still maturing._

# Lira — Implementation Gaps (Not Yet Built)

> **Purpose:** Backlog of everything specified in the two product docs that is **not implemented**, **partially implemented**, or **diverges from spec** in the current codebase.
> **Source docs:** `lira-agent-capability-architecture.md` (22 capability layers) + `lira-ticketing-system-spec.pdf` (12 modules).
> **Verified against:** `creovine-backend/src` (DynamoDB-backed support services/routes), `lira-ai/src` (dashboard + widget), `packages/lira-support` (SDK), `creovine-backend/pipecat` (voice). Generated 2026-05-27.
> Legend: ✅ built · 🟡 partial · ❌ missing

---

## 0. Divergences from spec (built differently than documented)

These are not "not built yet" — they contradict the docs and should be a conscious decision:

- [ ] **LLM provider mismatch.** Docs say Claude (Anthropic) is primary; the agent actually runs on **OpenAI GPT-4o / GPT-4o-mini** (`lira-support-agent.service.ts`). No Anthropic calls in the support path. → Decide: align docs to OpenAI, or migrate agent to Claude.
- [ ] **Vector tenancy.** Architecture §1.6 mandates **one Qdrant collection per org**. Code uses a **single shared collection** (`lira_org_embeddings`) filtered by an `org_id` payload (`lira-vector-search.service.ts`) — the cross-tenant-leak pattern the doc explicitly warns against. → Move to per-org collections (or accept + document the risk).
- [ ] **Voice disabled.** Voice is the headline channel but `VOICE_FEATURE_ENABLED = false` in the widget (parked over EC2 audio jitter). Re-enable or remove from positioning.

---

# PART A — Capability Architecture (22 layers)

## 1. Knowledge Layer — 🟡

- [ ] Query rewriting before retrieval (§1.7)
- [ ] Reciprocal Rank Fusion to combine vector + BM25 (§1.7) — currently only vector + keyword-frequency boost
- [ ] Cross-encoder reranker (top-20 → top-5) (§1.7)
- [ ] PDF parsing + OCR/Textract for image-heavy docs (§1.4)
- [ ] Audio/video KB ingestion (Whisper transcription) (§1.4)
- [ ] Source connectors beyond crawler + file upload: Notion, Confluence, Google Docs, Zendesk/Intercom past-ticket import, Slack channels, YouTube, GitHub (§1.3) — current integration adapters are OAuth connectors, **not** KB ingestors
- [ ] Citation chips in UI + invented-citation validation (§1.8) — `grounded_in` IDs stored but never surfaced/validated
- [ ] Per-source permissions: `audience` (customer_facing / internal_only), role visibility, `excluded_paths`, `pii_scrub` (§1.9)
- [ ] Freshness/staleness detection + daily "Knowledge Health" report (§1.10)
- [ ] Self-improving loop completeness (§1.11): cluster similar unresolved Qs, ≥3 gap threshold, auto-embed-on-approve — only single-conversation KB drafts exist today

## 2. Action Layer — 🟡

- [ ] Risk tiers (`safe`/`low`/`medium`/`high`/`critical`) per action (§2.5) — only a 3-value HITL flag (`auto`/`confirm`/`human`) exists
- [ ] Approval policy engine with dollar thresholds / M-of-N for large amounts (§2.5)
- [ ] Preconditions DSL (e.g. `charge.refunded == false`) (§2.2)
- [ ] Idempotency keys + `action_executions` unique-constraint dedup (§2.6)
- [ ] Reversibility: `inverse_action_id`, compensating rollback, topological ordering of irreversible actions last (§2.7)
- [ ] Generic HTTP action block with mandatory `url_allowlist` (SSRF guard) (§2.4)
- [ ] Broader connectors (only Stripe + Slack + HubSpot/Salesforce-read exist): Chargebee/Recurly/Paddle, Shopify/Woo, Auth0/Okta/Clerk, Twilio/Postmark, Jira/GitHub/PagerDuty as actions (§2.3)

## 3. Orchestration Layer — ❌ (essentially unbuilt)

- [ ] Workflow-as-DAG / node canvas (Trigger/Classifier/Retrieval/LLM/Action/Condition/Loop/Approval/Handoff/Response nodes) (§3.2) — agent is a hardcoded `MAX_STEPS=5` loop
- [ ] Per-node model selection / model picker (§3.3)
- [ ] Per-turn dynamic model routing ("Auto" mode) (§3.3)
- [ ] Workflow storage + versioning (`workflows` / `workflow_versions`) (§3.4)
- [ ] Durable execution engine (self-built→Temporal), exactly-once for side effects (§3.5)
- [ ] Staging vs production environments + shadow traffic diffing (§3.6)
- [ ] Per-node determinism tuning (strict/balanced/creative, temperature/top_p) (§3.7)

## 4. Identity & Trust Layer — 🟡

- [ ] Step-up verification: email OTP + account-detail confirm, gated per risk tier (§4.3)
- [ ] Tier-3 long-term semantic customer memory (per-customer Qdrant namespace) (§4.4) — structured profile + summaries exist; semantic recall missing
- [ ] Audit log hardening (§4.5): append-only/immutable guarantee, `model_used` field, WORM/S3 object-lock archive — `ActionLog` exists but is mutable and partial

## 5. Channel Layer — 🟡

- [ ] WhatsApp (Business API, template messages, 24h window) (§5.3)
- [ ] SMS (§5.2)
- [ ] Social DMs (PDF §6.1)
- [ ] Slack/Teams as **two-way conversation channels** (§5.3) — currently notify-only
- [ ] Email: signatures, attachment persistence, spam filtering (PDF §6.2)
- [ ] Re-enable + harden voice (currently disabled)
- [ ] **Voice depth (§5.3):**
  - [ ] Real-time sentiment-adaptive prosody
  - [ ] Mid-conversation language switching (50+ languages, per-utterance detection)
  - [ ] Voice payments (DTMF-only, PCI-compliant, PAN never reaches LLM/transcript)
  - [ ] Smart human transfer (15s spoken handoff brief + written brief)
  - [ ] Outbound voice (card-declined recovery etc.)
  - [ ] Voicemail-to-ticket conversion
  - [ ] Callback scheduling from a voice ticket
  - [ ] Call quality scoring (AI-rated)
  - [ ] Robust interruption/barge-in, noise/accent robustness (verify in pipecat)

## 6. Handoff Layer — 🟡

- [ ] Structured handoff brief (§6.3): customer summary + "what agent tried" + "what human needs to do" + suggested response — only freeform AI summary today
- [ ] Missing escalation triggers (§6.2): sentiment threshold, repeated-failure (≥3 same intent), SLA-pressure, VIP-auto, multi-turn-confusion, hallucination self-flag
- [ ] Round-trip learning: capture human's actual answer/plan-correctness → feed eval + KB loop (§6.4)

## 7. Guardrails Layer — 🟡 (security-critical gaps)

- [ ] `<user_message>` XML wrapping of all customer content (§7.1) — only regex sanitization exists
- [ ] **PII redaction before external LLM calls** (card/SSN/phone/email/NER + rehydration) (§7.2) — **none today**
- [ ] Refusal policies (legal/medical/financial/abuse), per-org config (§7.3)
- [ ] Brand voice config (§7.4): banned phrases, formality, emoji policy, disclaimers, sign-off, brand-voice checker — only greeting/color exist
- [ ] Adversarial prompt-injection payload library run in CI (§7.1)

## 8. Evaluation Layer — ❌ (entirely unbuilt)

- [ ] Replay / backtesting engine + mandatory regression gate before promote (§8.2)
- [ ] Synthetic adversarial test suite (knowledge/jailbreak/multi-turn/tool-misuse/identity) (§8.3)
- [ ] LLM-as-judge open-ended scoring (§8.4)
- [ ] Knowledge-gap detection reporting / weekly digest (§8.5)
- [ ] A/B testing at workflow/prompt level with significance (§8.6)
- [ ] Auto-remediation / self-healing fix queue (§8.7)
- [ ] Voice-specific simulation suite (accents/noise/rate/interruptions/DTMF) (§8.8)

## 9. Analytics Layer — 🟡

- [ ] Deflection rate, **true** resolution rate, FCR (§9.1)
- [ ] Cost per conversation / per resolution (token + tool + infra) (§9.1)
- [ ] Action success rate by `action_id`, approval-queue depth, mean-time-in-approval (§9.1)
- [ ] AI confidence distribution, accuracy rate, handoff-reason breakdown (PDF §9.2)
- [ ] Custom report builder, scheduled reports, raw CSV/JSON export, reporting API (PDF §9.3)
- [ ] Lira-internal cross-org dashboards + activation funnel (§9.3)
- [ ] Per-segment / per-customer (B2B) reporting (§9.4)

## 10. Onboarding Layer — 🟡

- [ ] Industry templates (workflow + KB + connectors per vertical) (§10.2)
- [ ] Sandbox mode (test API keys, no real emails/PII) (§10.3)
- [ ] Time-to-first-value metrics (§10.4)
- [ ] **Bootstrap / "Ghostwriter" path** (§10.5): ingest SOPs + call recordings + whiteboards → generated draft workflows/KB/actions with review canvas + simulation drive — entirely absent

## 11. SDK & Platform Coverage — 🟡 (web only)

- [ ] Native SDKs: iOS, Android, React Native, Flutter, Ionic, Vue/Angular wrappers, WordPress plugin (§11.3, §11.7)
- [ ] Missing SDK methods vs §11.6: `softReInitialize`, `setEnvironment`, `updateContact`, `isUserIdentified`, `trackPage`, `setTags`, `openHelpCenter`, `openNews`, `openChecklists`, `showSurvey`, `startFeedbackFlow`, `setNetworkLogPropsToIgnore` + masking classes
- [ ] Agent-skills: `migrate-from-intercom` / `migrate-from-gleap` / `migrate-from-zendesk-widget` / `lira-tool-scaffold` (§11.2) — only `lira-install` exists
- [ ] Install verification ("Connected" badge via first SDK ping, 60s troubleshooting) (§11.5)

## 12. In-App Capture Layer — ❌ (entirely unbuilt)

- [ ] Screenshot capture (html2canvas / native)
- [ ] Session replay (rrweb) + storage/sampling/cold-archive
- [ ] Console log capture (last N)
- [ ] Network log capture (last N, body cap, overflow marker)
- [ ] Audio note capture (opt-in)
- [ ] Device metadata + session breadcrumbs
- [ ] Annotation overlay (draw/arrow/blur)
- [ ] Capture bundle upload → ticket creation
- [ ] Agent reads capture (parse console errors/failed requests into agent context)
- [ ] Auto engineering-ticket generation from capture (repro from breadcrumbs, dedup by error signature)
- [ ] Replay privacy masking (`lira-mask` / `lira-block`, password masking, `maskAllText`)

## 13. Inbox & Ticketing Layer — 🟡 (see PART B for full ticket spec)

- [ ] Kanban / ticket boards with column models + column-transition automations (§13.3)
- [ ] Realtime presence/viewing/collision indicators (§13.6)
- [ ] Per-ticket sidebar: capture panel, AI panel (retrieved chunks + suggested action + confidence + regenerate) (§13.5)
- [ ] Bidirectional tracker sync (Jira/GitHub/Azure/Asana/ClickUp/Shortcut; status-close → auto-reply) (§13.7) — only Linear one-way create exists

## 14. Help Center Layer — ❌

- [ ] Public branded KB site (subdomain + custom domain) (§14.3) — current `portal` is ticket submission/tracking, **not** a help center
- [ ] Article authoring (WYSIWYG, scheduling, version history, AI-assisted drafts) (§14.4)
- [ ] Inline "AI Answer" with citations on the help center (§14.3)
- [ ] Article → knowledge-index publish pipeline (atomic chunk swap) (§14.5)
- [ ] Article quality loop (helpful votes, search-miss tracking) (§14.6)
- [ ] Multi-language article variants (§14.2)

## 15. Feedback Portal Layer — ❌

- [ ] Feature requests CRUD + voting + AI dedup (§15.3)
- [ ] Public roadmap (Ideas→Planned→In Progress→Shipped) (§15.2)
- [ ] Changelogs (dated, push to subscribers via news + email) (§15.5)
- [ ] RICE-style prioritization scoring (Benefit/Output/Cost) (§15.4)
- [ ] Portal settings (custom domain, email templates, auth mode, SEO, CTA formula) (§15.6)

## 16. Engagement / Outreach Layer — 🟡 (CSAT + webhook outreach only)

- [ ] NPS + multi-question / branching surveys + AI free-text summarization (§16.4) — only 1–5 CSAT email link exists
- [ ] In-app messages / proactive chat nudges (§16.2)
- [ ] News / changelog feed in widget (§16.2)
- [ ] Checklists (beyond the onboarding install checklist) (§16.2)
- [ ] Push notifications (web FCM, mobile APNs/FCM) (§16.2)
- [ ] Email campaigns / scheduled outreach (§16.2)
- [ ] Banners, modals, tooltips, product tours, cobrowse (§16.2)
- [ ] Targeting engine (segments, attribute/event/url filters, timezone quiet-hours, frequency caps) (§16.3)
- [ ] Suppression / opt-out / STOP / GDPR lists (§16.5) — only per-trigger cooldown exists
- [ ] Auto anomaly detection for proactive outreach (currently manual webhook triggers only)

## 17. Contacts & Sessions Layer — 🟡

- [ ] Billing enrichment in sidebar (Stripe/Shopify/Chargebee: subscription, last transactions, MRR, failed payments, refunds) (§17.4)
- [ ] Compute `churn_risk_score` (field exists in model, never populated) + custom attributes (§17.1)
- [ ] Segmentation: rule-based segments + static lists (§17.5)
- [ ] Import/migration: CSV wizard, native Intercom, native Zendesk (§17.6)
- [ ] Companies / B2B grouping (§17.2)
- [ ] Continuous CRM sync (only on-demand HubSpot/Salesforce lookups today) (§17.6)

## 18. Automation Builder Layer — ❌

- [ ] No-code trigger → conditions → actions UI (§18.2) — only proactive-trigger CRUD via API, no builder UI
- [ ] Rule priority ordering + rule activity log (PDF §10.1)
- [ ] Default shipped automations (§18.3)
- [ ] Forms: configurable field sets, submissions-as-tickets, prefill, shareable/embeddable (§18.4) — only a hardcoded name/email pre-chat form exists

## 19. Translations & i18n Layer — ❌ (entirely unbuilt)

- [ ] Widget UI string localization
- [ ] Help center / portal content variants
- [ ] Locale detection priority chain
- [ ] Translation workflow (machine + human review, re-translate diffs only)
- [ ] `setLocale` / `getAvailableLocales` SDK + server CRUD

## 20. Public API & MCP Layer — 🟡 (REST exists)

- [ ] API keys with scopes (read/write/webhook/admin) (§20.2) — JWT only today
- [ ] Sandbox vs live keys (§20.2)
- [ ] Rate limiting (per-org token bucket + headers) (§20.2)
- [ ] **Outbound webhooks** to customer endpoints (event types, HMAC sign, retry, dead-letter, replay) (§20.3) — only inbound receiver exists
- [ ] First-party MCP server (`mcp.lira.app`, tool surface) (§20.4)
- [ ] `@lira/server` Node SDK generated from OpenAPI (§20.5)

## 22. Human Copilot (Live Assist) — ❌ (entirely unbuilt)

- [ ] AI panel in inbox: drafted reply for human review, one-click accept/edit/reject (§22.2)
- [ ] Suggested action chain (ticked on/off, one-click execute, `human_in_the_loop: required`) (§22.2)
- [ ] Knowledge chips, customer-context summary, tone coaching, inline translation (§22.2)
- [ ] Trigger modes: always-on / on-demand / confidence-gated / training (§22.3)
- [ ] Learning from human edits (diff capture → prompt/KB/action tuning) (§22.5)
- [ ] Copilot productivity metrics (acceptance rate, edit distance, time-to-send, handle-time delta) (§22.6)

---

# PART B — Ticketing & Escalation System spec (the sections you flagged)

## 1.1 Ticket Creation & Ingestion

- [x] ✅ Omnichannel email/chat/voice/API ingestion (no WhatsApp/SMS)
- [x] ✅ Auto-ticket creation from inbound messages (AI parses intent)
- [ ] 🟡 Manual ticket creation by agents — exists but **without full field control** (no custom fields/category)
- [ ] ❌ Merge duplicate tickets (AI-detected or manual) — only **customer-record** merge exists, not ticket merge
- [ ] ❌ Ticket splitting for multi-issue conversations
- [ ] ❌ Ticket linking (parent/child, related)
- [ ] ❌ CC / BCC on email-originated tickets

## 1.2 Ticket Fields & Data Model

- [x] ✅ Standard fields (Subject, Status, Priority, Channel, Created/Updated)
- [ ] ❌ Custom fields (text/dropdown/date/number/checkbox/file)
- [ ] ❌ Internal notes (agent-only) — **not present** on tickets or conversations
- [x] ✅ Customer-facing reply thread
- [x] ✅ Tags (free-form) — structured tag taxonomy ❌
- [ ] ❌ Ticket categories / sub-categories (configurable taxonomy)
- [x] ✅ SLA due date field (single per-org `sla_hours`)
- [x] ✅ CSAT score field (post-resolution)

## 1.3 Ticket Lifecycle & Status

- [ ] 🟡 Statuses — has `open/in_progress/resolved/closed`; **missing New, Pending, On Hold** as the full chain
- [ ] ❌ Custom status workflows per team/product line
- [ ] 🟡 Re-open logic — exists for conversations, not formalized for tickets on customer reply
- [ ] ❌ Snooze / defer ticket to a future date
- [ ] ❌ Bulk status updates
- [ ] ❌ Ticket archiving policy (configurable retention)

## 1.4 Priority & Classification

- [x] ✅ Priority tiers (Urgent/High/Medium/Low)
- [ ] 🟡 AI auto-classification of priority — intent/sentiment classified, but priority is **not auto-derived** from content+tier+channel
- [x] ✅ Intent detection
- [x] ✅ Sentiment tagging (positive/neutral/negative/urgent)
- [ ] ❌ Language detection with auto-routing to language-matched agent
- [ ] ❌ Topic clustering across tickets for trend detection

## 3.3 Escalation Workflow

- [x] ✅ Escalation reason required
- [ ] 🟡 Receiving agent notified — Slack/Linear/email notify exist; **no in-app push to a specific assigned agent**
- [x] ✅ Full context carried (conversation history + customer profile); ⚠️ "AI actions taken" not bundled into a structured brief
- [x] ✅ Escalation SLA timer starts (`sla_target`)
- [ ] ❌ Acknowledgment timeout → auto-reroute
- [ ] ❌ Escalation trail visible in ticket timeline (alerts logged, no timeline UI)
- [ ] ❌ De-escalation path (return to AI queue)

## 3.4 Manager & Supervisor Controls

- [ ] ❌ Live escalation queue view (all active escalations)
- [ ] ❌ Whisper mode (supervisor → agent, customer can't see)
- [ ] ❌ Barge-in (supervisor takes over ticket)
- [ ] ❌ Escalation analytics (volume by trigger, MTTR by tier, agent escalation rate)
- [ ] ❌ Force-assign escalation to a specific agent

## 5.3 Team & Group Management

- [ ] ❌ Teams with configurable members and leads
- [ ] ❌ Team inbox (shared view)
- [ ] ❌ Cross-team collaboration (tagging, forwarding)
- [ ] ❌ Team capacity dashboard (live load per agent)
- [ ] ❌ Out-of-office handling (auto-reassign when agent is OOO)

### (also missing from §5 Assignment & Queue, for completeness)

- [ ] ❌ Named queues (channel/team/region/product/language), capacity limits, overflow rules, visibility controls
- [ ] ❌ Assignment modes (round-robin / least-busy / skill-based)
- [ ] ❌ Agent availability status (online/busy/away/offline), max-concurrent limits, preferred-agent, unassigned alerts
- [ ] ❌ Bulk reassign-all (offboarding hygiene)

### (also missing from §4 SLA & Compliance)

- [ ] ❌ Multiple SLA policies (by channel/priority/tier/product), FRT/NRT/RT targets
- [ ] ❌ Business-hours vs 24/7 + holiday calendar
- [ ] ❌ SLA countdown clock UI, color urgency, 75%/90%/breach alerts, pause-on-pending-customer
- [ ] ❌ Compliance: data residency, PII masking in logs/exports, GDPR/NDPA ticket-level deletion, audit export, data-level RBAC

---

## Priority ranking (suggested)

1. **Guardrails: PII redaction + refusal policies** (§7) — security-critical, currently absent despite compliance claims
2. **Action trust mechanics** (§2.5–2.7) — risk tiers, dollar-threshold approvals, idempotency, reversibility (the "moat")
3. **Ticketing depth** — queues/assignment/teams (PDF §5), supervisor controls (PDF §3.4), full SLA engine (PDF §4), ticket merge/link/internal-notes/custom-fields (PDF §1)
4. **Human Copilot** (§22) — lowest-effort/highest-trust wedge; reuses retrieval + actions
5. **Orchestration + Evaluation** (§3, §8) — workflow canvas + replay/eval/A-B; framed P0 in the doc
6. **In-App Capture** (§12), **Help Center** (§14), **Feedback Portal** (§15) — three whole unbuilt surfaces
7. **Channel breadth + voice depth** (§5) — WhatsApp/SMS; re-enable + deepen voice
8. **Multi-platform SDK + migration skills** (§11)
9. **Engagement breadth** (§16), **Contacts CRM-lite** (§17), **Automation builder** (§18), **Public API keys/webhooks/MCP** (§20), **i18n** (§19)

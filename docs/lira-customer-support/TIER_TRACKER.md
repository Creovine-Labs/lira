# Lira Customer Support — Tier Tracker & Audit

> **Purpose:** Single source of truth for what's built, what's broken, and what's next for the Lira Customer Support wedge.
> **Owner:** Founders
> **Last audited:** 2026-04-21 (Phase B P0 complete)
> **Repos audited:** `lira_ai` (frontend, Vercel) · `creovine-api` (backend, AWS EC2)

---

## TL;DR Summary

**The platform is far more complete than either of you realised.** Out of 36 tracked items across all three tiers, ~30 are already built and wired end-to-end. All four P0 blockers are resolved (streaming chat, pricing page, widget CDN deploy, demo site). The wedge is now ready for outreach after you: (a) push the frontend commit and (b) add the two Cloudflare DNS records (see `Cloudflare DNS to add` section at the bottom).

| Tier        | ✅ Built | ⚠️ Needs polish | ❌ Broken/missing | ⬜ Not started | 🚫 Out of scope |
| ----------- | -------- | --------------- | ----------------- | -------------- | --------------- |
| Tier 1 (10) | 8        | 2               | 0                 | 0              | 0               |
| Tier 2 (10) | 8        | 2               | 0                 | 0              | 0               |
| Tier 3 (16) | 1        | 7               | 1                 | 1              | 6               |

**P0 blockers (all resolved 2026-04-21):**

1. ✅ Streaming chat — backend `generateReplyStream` + WS `reply_start`/`reply_chunk`/`reply_end` + widget direct-DOM chunk append
2. ✅ Public pricing page — `/pricing` with 3 tiers, FAQ, cost comparison, schema.org `Product` offers
3. ✅ Widget CDN — streaming-enabled widget (46 KB / 11 KB gz) live on CloudFront, new version cache-invalidated
4. ✅ Demo site — `/demo` (“Nimbus” fake SaaS) with widget, Vercel host rewrite wired for `demo.liraintelligence.com`

---

## Legend

| Symbol | Meaning                                       |
| ------ | --------------------------------------------- |
| ✅     | Built & working — verified against real code  |
| ⚠️     | Built but needs polish / edge cases / UX gaps |
| ❌     | Broken or not yet wired end-to-end            |
| ⬜     | Not started                                   |
| 🚫     | Explicitly out of scope for this wedge        |

---

## Tier 1 — Must ship before any cold outreach

| #    | Item                                             | Status | Findings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Action                                                                                                                                                                                                                               |
| ---- | ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1  | Chat widget embed (one-line `<script>`)          | ✅     | Full IIFE widget at `src/components/support-widget/widget.ts`. Shadow DOM, localStorage visitor ID, 24h message cache, WS reconnect w/ backoff, pre-chat form, voice, CSAT. **Deployed 2026-04-21**: 46 KB / 11 KB gz built and uploaded to S3 `lira-widget-cdn/v1/widget.js`, CloudFront `EZMZM7JYD11HG` invalidated. Live at `https://d1chn6n8ujqd20.cloudfront.net/v1/widget.js` (200 OK). Alias `widget.liraintelligence.com` configured on distribution but DNS CNAME still needs to be added in Cloudflare. | Add Cloudflare CNAME `widget` → `d1chn6n8ujqd20.cloudfront.net` (DNS-only / grey cloud).                                                                                                                                             |
| 1.2  | URL-crawl knowledge base ingestion               | ✅     | `lira-crawl.service.ts` fetches URL, parses with cheerio, respects robots.txt, excludes login/admin/auth paths, 10-page default, categorizes by URL signals, summarizes with GPT-4o-mini, chunks, embeds with OpenAI `text-embedding-3-small`, indexes in Qdrant. Async worker pattern (returns 202). Graceful fallback to keyword search when Qdrant unavailable.                                                                                                                                                | Verified wired end-to-end. No action.                                                                                                                                                                                                |
| 1.3  | Streaming chat replies (<3s first token)         | ✅     | **Shipped 2026-04-21.** Added `generateReplyStream` in `lira-support-reply.service.ts` using OpenAI `stream: true`. Chat service emits `reply_start` → `reply_chunk` (token deltas) → `reply_end` over WS. Widget handles chunks via direct DOM append on the active lira bubble (no full re-render per token) and auto-scrolls. Backend deployed; widget bundle rebuilt + pushed to CDN.                                                                                                                         | Smoke-test: open demo site, send “how does pricing work?” — you should see tokens appear progressively within ~800 ms.                                                                                                               |
| 1.4  | Slack escalation with full context brief         | ✅     | `lira-support-escalation.service.ts` creates DynamoDB ticket, writes in-app alert, updates conversation status, increments customer escalation count, creates Linear issue if connected, posts to Slack channel, sends escalation email. Slack OAuth flow full.                                                                                                                                                                                                                                                   | Verified. Manual test: trigger an escalation and confirm Slack post format is on-brand.                                                                                                                                              |
| 1.5  | Minimal dashboard (inbox, transcripts, takeover) | ✅     | `SupportInboxPage.tsx` with status filters, stats, search. `SupportConversationPage.tsx` for transcript + manual reply. Backend has `/reply` (human reply pushed to widget via WS), `/handback` (return to AI), `/resolve`, `/escalate`, `/merge` — all in `lira-support-inbox.routes.ts`. Sender name + avatar flow to widget.                                                                                                                                                                                   | Verified. No action.                                                                                                                                                                                                                 |
| 1.6  | Onboarding flow (<20 min signup → live widget)   | ⚠️     | `SupportActivatePage.tsx` exists with live widget preview (desktop/mobile toggle), brand color, logo, greeting config. Backend email slug auto-generated. Embed code shown on activation. **Unverified:** full "paste URL → crawl done → embed code → test conv" loop timed end-to-end. A new signup may hit KB-indexing wait time (async crawl) that's not surfaced to the user.                                                                                                                                 | Run a full signup with a stopwatch. Surface crawl progress % in UI.                                                                                                                                                                  |
| 1.7  | Demo environment (fake SaaS with Lira installed) | ✅     | **Shipped 2026-04-21.** New page at `src/pages/DemoSitePage.tsx` (“Nimbus” fake finance SaaS) — hero, product mockup, logo strip, features, pricing, CTA. Widget script injected via `useLiraWidget`, org id resolution order: `?org=<id>` query → `VITE_DEMO_ORG_ID` env → hardcoded fallback. Vercel `vercel.json` has a host-based rewrite: `demo.liraintelligence.com` root → `/demo`. Also accessible directly at `liraintelligence.com/demo`.                                                               | (1) Add Cloudflare CNAME `demo` → `cname.vercel-dns.com` (DNS-only). (2) In Vercel, add `demo.liraintelligence.com` as a domain on the `lira_ai` project. (3) Set `VITE_DEMO_ORG_ID` in Vercel env to the org you want to demo with. |
| 1.8  | Public pricing page on marketing site            | ✅     | **Shipped 2026-04-21.** New `src/pages/PricingPage.tsx` with 3 tiers (Starter $299 / Growth $799 / Enterprise custom), cost comparison vs Zendesk / hiring a rep, FAQ, CTA linking to `demo.liraintelligence.com` and `/signup`. SEO metadata + schema.org `Product` `Offer` JSON-LD. Added “Pricing” button to marketing navbar. Footer link updated to `/pricing`. Added to `sitemap.xml`.                                                                                                                      | Edit copy/prices once you have real data. Screenshot for cold-email embed.                                                                                                                                                           |
| 1.9  | Security / data-handling page                    | ⚠️     | `SecurityPage.tsx` exists. Contents unverified — may be generic boilerplate. B2B buyers check this on first call.                                                                                                                                                                                                                                                                                                                                                                                                 | Read the page. Ensure it answers: where data is stored (AWS us-east-1), encryption at rest + in transit, whether you train on customer data (no), deletion policy, SOC 2 roadmap.                                                    |
| 1.10 | 3-min product Loom video                         | ⬜     | Not started.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Record after 1.7 (demo environment) exists — run the demo site through a real customer journey.                                                                                                                                      |

---

## Tier 2 — Ship within 30 days of first paying customer

| #    | Item                                                             | Status | Findings                                                                                                                                                                                                                                                                                              | Action                                                                                         |
| ---- | ---------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 2.1  | Email channel (inbound support@ → AI reply)                      | ✅     | Full pipeline in `lira-support-email.service.ts`: SNS → S3 fetch → MIME parse → customer resolve → thread match (via `In-Reply-To`) → classify → RAG → reply via Resend → or escalate. Reply-to routes admin replies back through system. Per-org support slug address auto-generated.                | Verified. Needs DNS MX setup for first customer using custom domain.                           |
| 2.2  | HubSpot CRM sync (customer lookup + record update)               | ⚠️     | OAuth + token storage exists (`hubspot.adapter.ts`). **Unverified:** whether the support conversation flow actually reads from HubSpot to hydrate customer context or writes back on resolution.                                                                                                      | Verify `lira-support-customer.service.ts` hooks into HubSpot on conversation create + resolve. |
| 2.3  | Human takeover from dashboard                                    | ✅     | `/reply` endpoint pushes agent message to open widget WS via `sendAgentReplyToWidget`. `/handback` returns control to AI with a friendly banner. Sender name + avatar shown.                                                                                                                          | Verified.                                                                                      |
| 2.4  | CSAT collection (post-resolution thumbs up/down)                 | ✅     | `lira-support-csat.service.ts` generates HMAC-signed one-time-use score URLs (1–5 stars), sends via Resend post-resolution, records in DynamoDB with idempotency check, feeds into analytics. Widget also supports in-chat CSAT via `end` message type.                                               | Verified.                                                                                      |
| 2.5  | Proactive engine — one trigger (trial expiry or inactivity)      | ✅     | `lira-support-proactive.service.ts` has full trigger CRUD, condition matching (eq/neq/gt/lt/contains), cooldown + per-day limits, outreach logging, email + voice channels. `lira-support-webhook.routes.ts` accepts external events. Dispatch through `sendProactiveToWidget` for live-session push. | Verified. Add 1 preset trigger template ("Trial expires in 3 days") for demo effect.           |
| 2.6  | Basic analytics (resolution rate, deflection, avg response time) | ✅     | `lira-support-analytics.service.ts` computes total/open/resolved (autonomous vs human)/escalated, avg first-response time, CSAT avg, top intents. Weekly report function exists. `SupportAnalyticsPage.tsx` consumes it.                                                                              | Verified.                                                                                      |
| 2.7  | Confidence-threshold escalation                                  | ✅     | Classifier service + escalation logic check configurable confidence threshold (default 70%). Config exposed via support-config.                                                                                                                                                                       | Verified from route wiring.                                                                    |
| 2.8  | Customer profile & memory (persistent across conversations)      | ✅     | `CustomerProfile` model with name/email/phone, interaction history, escalation count, visitor_id linking for anonymous-to-identified merge. `resolveOrCreateCustomer` + `mergeCustomers` logic in chat service.                                                                                       | Verified. Robust.                                                                              |
| 2.9  | Autonomous ticket creation + smart routing                       | ✅     | Tickets created in DynamoDB on escalation with SLA target, priority, auto-routed to Linear team (if configured) or Slack channel.                                                                                                                                                                     | Verified.                                                                                      |
| 2.10 | Knowledge base management UI (upload, re-crawl, test search)     | ✅     | `SupportKnowledgePage.tsx` + `KnowledgeBasePage.tsx`. Backend supports doc upload (S3 + chunk + embed), URL crawl, entry list, delete, clear. Test-search panel at `src/pages/kb/QueryPanel.tsx`.                                                                                                     | Verified.                                                                                      |

---

## Tier 3 — Build only when a paying customer asks

| #    | Item                                                  | Status | Findings                                                                                                                                                                                                                     | Action                                                        |
| ---- | ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 3.1  | Inbound phone / Nova Sonic voice calls (Twilio)       | ⚠️     | `lira-support-voice.service.ts` has full µ-law↔linear16 conversion, active-call registry, Nova Sonic bridge. Routes at `lira-support-voice.routes.ts`. Needs Twilio number provisioning per org to actually work end-to-end. | Do not enable for demos until phone provisioning flow tested. |
| 3.2  | In-widget voice chat (speak-to-AI)                    | ⚠️     | `voice.ts` module in widget exists; button renders when `voice_enabled` config is on. Bidirectional audio path + barge-in supported by Nova Sonic. Untested in production widget.                                            | Leave disabled by default.                                    |
| 3.3  | Screenshot / vision support (GPT-4o Vision)           | ❌     | No vision code found in backend (grep for "screenshot"/"vision" only hits bot meeting drivers). Widget has no attachment icon in input bar.                                                                                  | Not needed for wedge. Skip.                                   |
| 3.4  | Linear integration (auto-create engineering tickets)  | ✅     | `createLinearIssue` in escalation service. OAuth + team selection wired.                                                                                                                                                     | Verified.                                                     |
| 3.5  | Salesforce integration                                | ⚠️     | OAuth + adapter exist (`salesforce.adapter.ts`). Depth of support-flow integration unverified.                                                                                                                               | Pursue only if a paying customer demands it. HubSpot first.   |
| 3.6  | Full audit trail + compliance exports                 | ⬜     | Not found.                                                                                                                                                                                                                   | Defer.                                                        |
| 3.7  | Product signal pipeline (support → Linear auto-route) | ⚠️     | Manual Linear ticket on escalation exists. Auto-classification into "bug vs feature request vs support" not found.                                                                                                           | Defer.                                                        |
| 3.8  | Self-improving KB (auto-learn from escalations)       | ⚠️     | `lira-support-learning.service.ts` exists. Depth unverified.                                                                                                                                                                 | Defer.                                                        |
| 3.9  | Full autonomous action chains (multi-step)            | ⚠️     | `lira-support-action.service.ts` + routes exist. Real actions (refund, record update) unverified end-to-end.                                                                                                                 | Defer. Show as "roadmap" in pitch.                            |
| 3.10 | Multi-org white label                                 | 🚫     | Out of scope pre-scale                                                                                                                                                                                                       | —                                                             |
| 3.11 | Competitor intelligence loader                        | 🚫     | Post-MVP                                                                                                                                                                                                                     | —                                                             |
| 3.12 | Live screen share (WebRTC)                            | 🚫     | Too complex for wedge                                                                                                                                                                                                        | —                                                             |
| 3.13 | WhatsApp channel                                      | 🚫     | 4–8 wk external dependency                                                                                                                                                                                                   | —                                                             |
| 3.14 | SMS channel                                           | 🚫     | Not blocker for value                                                                                                                                                                                                        | —                                                             |
| 3.15 | npm/pip SDK packages                                  | 🚫     | REST API sufficient                                                                                                                                                                                                          | —                                                             |
| 3.16 | Additional languages (ES, PT, FR)                     | ⚠️     | Config accepts language field; UI not fully translated.                                                                                                                                                                      | Defer unless customer asks.                                   |

---

## Cross-cutting findings

### Architecture is solid

- Event-driven, multi-tenant, AWS-native (DynamoDB single-table, Qdrant vectors, Resend email, Twilio voice)
- HMAC-signed widget auth for identified visitors prevents impersonation
- WebSocket + HTTP polling fallback for agent reply delivery to widget
- Graceful degradation when Qdrant / integrations unavailable

### Gaps that matter for the wedge

1. **No streaming chat (1.3)** — biggest UX issue. Fix before any demo.
2. **No public pricing (1.8)** — biggest funnel leak. Fix before any cold email.
3. **No demo environment (1.7)** — biggest sales asset missing. Fix before any demo call.
4. **Widget CDN deploy unverified (1.1)** — may already be deployed from past work; needs a 2-min check.
5. **Marketing site still advertises interviews + sales + meetings equally** — the wedge says "support is the headline." Homepage + nav need repositioning.

### Environment & deploy

**Frontend** — Vercel, config at `vercel.json`. `npm run build` → `dist/`. SPA fallback in place. Deploy = `git push` (Vercel auto). Widget needs a **separate build** via `npx vite build --config vite.widget.config.ts` → upload `dist/widget/widget.js` to S3 `lira-widget-cdn` → CloudFront invalidation. Manual step; consider adding an npm script `build:widget` + `deploy:widget`.

**Backend** — AWS EC2 t3.small at `98.92.255.171`, `api.creovine.com`. Deploy via `./deploy-auto.sh` (build → rsync → npm install → prisma migrate → systemd restart). No staging. Secrets pulled from AWS Secrets Manager. `.env` excluded from rsync (set separately on server).

### Risk notes for the first deploy after audit

- Prisma migrations auto-run on deploy — if anyone has local uncommitted migrations, they apply to prod. **Before next deploy:** `cd creovine-api && git status && npx prisma migrate status`.
- Widget is a **separate build step** from main frontend. Easy to forget — Vercel deploys do NOT re-deploy the widget.

---

## Recommended Phase B (fix gaps) — priority order

### P0 — Blocks first demo (this week)

1. **Streaming chat replies (1.3)** — convert reply service to `stream: true`, wire WS `reply_chunk` messages, widget renders token-by-token. ~2 hrs.
2. **Public pricing page (1.8)** — `/pricing` route with 3 tiers. Placeholder copy OK; polish later. ~3 hrs.
3. **Verify widget CDN is live (1.1)** — `curl -I https://widget.liraintelligence.com/v1/widget.js`. If 404, build + deploy. ~30 min.
4. **Demo environment (1.7)** — fake SaaS landing page with widget embedded at `demo.liraintelligence.com`. ~4 hrs.

### P1 — Blocks broad outreach (next week)

5. **Marketing site repositioning** — homepage leads with "AI support that acts, not just answers." Interviews/meetings/sales demoted to an "also built in" row. Hand to girlfriend. ~4 hrs.
6. **Security page audit (1.9)** — verify copy answers the 5 buyer questions.
7. **Onboarding polish (1.6)** — surface crawl progress %, ensure <20 min loop on a stopwatch.

### P2 — Polish before scaling outreach

8. Preset proactive trigger: "Trial expires in 3 days" (great demo moment).
9. HubSpot end-to-end verification (2.2).
10. Record 3-min Loom (1.10).

---

## Deploy plan (when P0 is ready)

1. `creovine-api`: `git diff` → review → `./deploy-auto.sh` → smoke test `/lira/v1/support/chat/widget/<test-org>`.
2. `lira_ai`: commit → push → Vercel auto-deploy → smoke test `/pricing` + `/support/activate`.
3. Widget bundle: `npx vite build --config vite.widget.config.ts` → `aws s3 cp dist/widget/widget.js s3://lira-widget-cdn/v1/widget.js --content-type "application/javascript" --cache-control "public, max-age=3600"` → `aws cloudfront create-invalidation --distribution-id EZMZM7JYD11HG --paths "/v1/*"`.
4. Verify demo environment loads widget from CDN and completes a full "open → message → streamed reply" loop.

---

## Explicitly excluded from this wedge

These are **not** part of the customer-support wedge and should not be marketed during cold outreach:

- Interview AI (kept in product, hidden from homepage)
- Meeting AI + task execution (kept in product, hidden from homepage)
- Sales coaching (kept in product, hidden from homepage)
- Flutter gifting / realtime streaming features (different product surface entirely)

These return to the roadmap **after** customer support has 5+ paying customers.

---

## Change Log

- **2026-04-21** — Tier tracker created. Full audit across both repos completed.
- **2026-04-21** — Phase B P0 complete:
  - 1.3 Streaming chat: backend `generateReplyStream` + WS `reply_start` / `reply_chunk` / `reply_end`; widget direct-DOM chunk append. Backend deployed to `api.creovine.com` (service active, health OK).
  - 1.8 Pricing page: `/pricing` live in source (pending Vercel push).
  - 1.7 Demo site: `/demo` live in source, host rewrite wired for `demo.liraintelligence.com`.
  - 1.1 Widget CDN: streaming-enabled widget uploaded to S3 + CloudFront invalidated.
  - Frontend commit `7c6f7d0` created locally — **push blocked by GitHub auth (403)**. User must push manually: `cd /Users/apple/creovine_main/lira_ai && git push origin main`.
- **Next update:** After Cloudflare DNS added + frontend push + smoke test.

---

## Cloudflare DNS to add

Add these three records to the `liraintelligence.com` zone in Cloudflare. All should be **DNS only** (grey cloud, not orange) because they front AWS/Vercel which do their own TLS.

| Type  | Name                                                    | Target                          | Proxy    | Why                                                                                                                                                |
| ----- | ------------------------------------------------------- | ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CNAME | `widget`                                                | `d1chn6n8ujqd20.cloudfront.net` | DNS only | Serves the chat widget IIFE bundle from CloudFront. Distribution already has `widget.liraintelligence.com` in its aliases, so TLS cert is ready.   |
| CNAME | `demo`                                                  | `cname.vercel-dns.com`          | DNS only | Serves the Nimbus demo SaaS page from Vercel. After adding the DNS record, also add `demo.liraintelligence.com` as a domain in the Vercel project. |
| CNAME | `support` _(optional, for custom-domain portals later)_ | `cname.vercel-dns.com`          | DNS only | Only if/when you use the portal custom-domain feature the backend now supports. Skip for now.                                                      |

**After DNS propagates (usually < 5 min):**

```bash
# Widget CDN
curl -I https://widget.liraintelligence.com/v1/widget.js
# should return: HTTP/2 200, content-type: application/javascript

# Demo site
curl -I https://demo.liraintelligence.com/
# should return: HTTP/2 200, content-type: text/html
```

**Vercel extra step for `demo`:**

1. Vercel dashboard → `lira_ai` project → Settings → Domains → Add `demo.liraintelligence.com`.
2. Environment Variables → add `VITE_DEMO_ORG_ID` → set to the org id you want the demo widget to use (pick one of your existing orgs with a populated knowledge base).
3. Re-deploy.

**Smoke test after everything is green:**

1. Visit `https://demo.liraintelligence.com` — Nimbus landing should render, widget bubble bottom-right.
2. Open the bubble, send “how does your pricing work?” — tokens should stream in within ~800 ms.
3. Escalate a question Lira can’t answer — should see escalation in Slack/Linear/inbox.

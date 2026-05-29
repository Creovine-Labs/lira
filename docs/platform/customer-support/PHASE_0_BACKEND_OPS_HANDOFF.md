# Phase 0 — Backend & Ops Handoff

> **Version:** 1.0 — 2026-05-20
> **Purpose:** Hand off the non-frontend half of Phase 0 (interactive demo risk infrastructure). The frontend repo (`lira-ai`) has shipped what it can. The items below live in the backend repo, the widget repo, or ops/infra and must land before the public demo grows beyond internal QA.
> **Parent spec:** [INTERACTIVE_DEMO_PLATFORM.md](./INTERACTIVE_DEMO_PLATFORM.md) — Section 12 Phase 0
> **Owner:** TBD — assign before scoping

---

## What was shipped from `lira-ai` (✅ done)

| Item                                                                                                                                                                       | File / Location                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| HMAC test-visitor flow guarded behind `import.meta.env.DEV`                                                                                                                | [src/pages/DemoSitePage.tsx#L60-L95](../../../src/pages/DemoSitePage.tsx)                 |
| `robots.txt` disallow `/demo` and `/demo/`                                                                                                                                 | [public/robots.txt](../../../public/robots.txt)                                           |
| `<meta name="robots" content="noindex, nofollow">` on the SPA-rendered `/demo`                                                                                             | DemoSitePage now uses `<SEO noIndex>`                                                     |
| `<meta name="robots" content="noindex, nofollow">` on the prerendered Nimbus static HTML                                                                                   | Already in [seo-prerender.cjs#L238-247](../../../seo-prerender.cjs) (was already correct) |
| Privacy Policy: new Section 2.4 "Public Demo Site" describing what we collect anonymously, retention windows, legitimate-interest basis, deletion contact, sandbox warning | [src/pages/PrivacyPolicyPage.tsx](../../../src/pages/PrivacyPolicyPage.tsx)               |
| Privacy Policy `LAST_UPDATED` bumped to 2026-05-20                                                                                                                         | Same file                                                                                 |

**Verification:** TypeScript clean. Local build passes. No deploy yet (per user preference — kept local).

---

## What's still open and where it must live

Each item below has been pulled out of the original Phase 0 list with a clear destination and the smallest acceptance criteria that closes it. **These must all land before the demo URL is shared publicly.**

### 1. CDN edge rate-limit rules

**Lives in:** Vercel project config (or Cloudflare in front of `widget.liraintelligence.com` if applicable).

**Acceptance criteria:**

- A rule on `*.liraintelligence.com` and `widget.liraintelligence.com` that blocks any single IP exceeding **60 requests/hour** to widget API endpoints
- Response code on block: `429 Too Many Requests` with a generic body — do not reveal that rate-limiting is per-IP
- Bypass / allowlist for our own internal monitoring + test runners

**Estimate:** 1–2 hours config work. No code.

### 2. Backend per-IP rate-limit (anonymous session creation)

**Lives in:** widget backend / API gateway.

**Acceptance criteria:**

- Per-IP cap: **max 3 distinct anonymous session creations per hour**
- Per-visitorId cap: **max 10 messages / 24h** before forced quota wall (Section 6.1 of parent spec)
- Per-visitorId voice cap: **max 90 seconds / 24h** (Section 11)
- Quota check happens _before_ any LLM invocation — capped visitors must cost zero inference dollars
- Quota state stored in Redis or equivalent low-latency KV
- 24h rolling window keyed on `(visitorId, day)` — bucket-based, simple to reason about

**Estimate:** 2–3 days. The data model is straightforward; the work is wiring the check into every inference path.

### 3. Org-level daily spend ceiling (kill-switch)

**Lives in:** backend, observability layer.

**Acceptance criteria:**

- Track cumulative inference cost per UTC day for the demo org (`VITE_DEMO_ORG_ID`)
- At **$25/day spend** → post to `#demo-ops` Slack channel: _"Demo spend at 50% of daily cap. Current: $X. Watch for spike."_
- At **$50/day spend** → auto-disable inference for the demo org. Replies fall through to a static message: _"Our demo is paused for the day to keep things sustainable for everyone. We'd love to show you what Lira can do — please [speak to an expert](https://liraintelligence.com/book-demo)."_
- At **$20/day voice-specific spend** → auto-disable voice. Voice attempts fall through to text with banner.
- At **$100/day hard global cap** → block all demo traffic; require manual ops override to resume
- Resume automatically at UTC midnight (no manual reset needed for the soft cap)

**Estimate:** 1 week. The cost-tracking pipeline is the hard part — needs reliable per-request cost attribution.

### 4. Input moderation pass

**Lives in:** widget backend, in the request path before LLM invocation.

**Acceptance criteria:**

- Every user message routed through a moderation classifier (OpenAI Moderation API or equivalent — free or near-free)
- Categories blocked: hate, harassment, self-harm, sexual/minors, violence, illegal
- On block: return a generic _"I can't help with that — want to ask about Nimbus or Lira instead?"_ response. Do not call the LLM.
- Log the block (anon-session-keyed) for abuse review
- **Critical:** moderation latency must be <200ms p95 — otherwise it kills demo conversational feel

**Estimate:** 1 day. Mostly wiring.

### 5. Output moderation pass

**Lives in:** widget backend, in the response path after LLM invocation.

**Acceptance criteria:**

- Every LLM output passed through the same moderation classifier before being streamed/returned
- On violation: block the response and substitute a generic _"Let me try that again — what were you asking?"_ fallback
- Log the violation (anon-session-keyed) with the offending output for prompt iteration
- For voice: also block the TTS rendering (don't synthesize moderated text)

**Estimate:** 1 day. Same pattern as #4.

### 6. Disposable-email domain blocklist

**Lives in:** backend, lead-capture endpoint.

**Acceptance criteria:**

- A maintained list of disposable-email domains (start with [disposable-email-domains/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) — public domain, ~3,000 entries)
- On lead capture: reject `email.split('@')[1]` if it matches the blocklist, return a generic _"Please use a business email"_ error
- Update the list quarterly (cron job pulls from upstream)
- Allow override list for known good but obscure domains (the user adds them manually as they discover false positives)

**Estimate:** half a day.

### 7. Internal cost / conversion dashboard

**Lives in:** existing admin app (`/admin/...` routes in this repo) OR a separate ops dashboard.

**Acceptance criteria:**

- Read-only page accessible to `is_admin` users only
- Shows for current day + last 7 days:
  - Total demo inference spend (text + voice broken out)
  - Distinct visitors (by visitorId)
  - Capped-state hits
  - Email captures
  - Conversion rate (email captures / distinct visitors)
- Shows alerts: if any of the Section 3 thresholds were hit today, prominent banner
- Auto-refreshes every 60s

**Estimate:** 2–3 days once the backing data exists (depends on #2 and #3 landing first).

### 8. Verify `VITE_DEMO_WIDGET_SECRET` is dev-only in build pipeline

**Lives in:** Vercel project env config + CI checks.

**Acceptance criteria:**

- `VITE_DEMO_WIDGET_SECRET` is set **only** in Vercel's _Development_ environment, never in _Preview_ or _Production_
- Add a CI step that fails the build if the variable is detected in a production build's output (grep the bundled JS for the variable's expected name pattern or for any plausible HMAC-related strings)
- Document the env var policy in [docs/aws_secrets.txt](../../aws_secrets.txt) or equivalent secrets-runbook

**Estimate:** 1–2 hours. The runtime guard is already in place (see "What was shipped" above), but defense-in-depth at the build layer is still worth doing.

---

## Dependency graph

```
                ┌────────────────────────┐
                │  #1 CDN rate-limit     │  (config; no deps)
                └────────────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │  #2 Backend rate-limit │  (depends on Redis or KV)
                └────────────┬───────────┘
                             │
                ┌────────────┴────────────┐
                │  #3 Spend kill-switch   │  (depends on cost tracking)
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │  #7 Internal dashboard  │  (depends on #2, #3 data)
                └─────────────────────────┘

                ┌────────────────────────┐
                │  #4 Input moderation   │  (parallel; no deps)
                └────────────────────────┘
                ┌────────────────────────┐
                │  #5 Output moderation  │  (parallel; no deps)
                └────────────────────────┘
                ┌────────────────────────┐
                │  #6 Disposable-email   │  (deps: lead-capture endpoint)
                └────────────────────────┘
                ┌────────────────────────┐
                │  #8 Build-pipe guard   │  (config; no deps)
                └────────────────────────┘
```

**Critical path:** #1 → #2 → #3 → #7. Everything else parallel.

---

## Definition of "Phase 0 complete"

All 8 items above land + the 5 frontend items already shipped + the privacy policy is reviewed by legal. At that point the demo URL can be shared publicly without operational risk.

Until then, the demo remains behind internal-QA-only signaling: the `robots.txt` block prevents organic indexing, the `noIndex` meta blocks accidental sharing-link previews, and we don't publicize the URL.

---

## Out of scope for Phase 0 (deferred to later phases)

Just to be explicit — these are intentionally not Phase 0 work:

- The `/demo/help` full-page mode (Phase 1)
- Anonymous session token issuance + visitorId hashing (Phase 1)
- The test-profile creation flow (Phase 2)
- The demo persona system prompt (Phase 2)
- Suggested prompt chips + scenario cards (Phase 3)
- Voice in demo (Phase 5)
- The operator-side helpdesk view (Phase 7 / deferred)

These all depend on Phase 0 being solid first — running them concurrently without the risk infrastructure in place is exactly how the cost-runaway disasters from Section 4 of the parent spec happen.

---

## Reference

- Parent spec: [INTERACTIVE_DEMO_PLATFORM.md](./INTERACTIVE_DEMO_PLATFORM.md)
- Strategic context: [COMPETITIVE_GAP_ANALYSIS_AND_ROADMAP.md](./COMPETITIVE_GAP_ANALYSIS_AND_ROADMAP.md)
- Privacy posture: [PrivacyPolicyPage.tsx](../../../src/pages/PrivacyPolicyPage.tsx) — Section 2.4

_— End of document. Update as each item closes (mark ✅, link the PR). When all open items close, mark this whole doc as superseded._

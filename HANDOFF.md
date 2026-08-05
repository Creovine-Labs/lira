# Handoff — current state and next tasks

Written 2026-08-05. Read this first in a new chat, then delete the sections you finish.

---

## Next tasks (in priority order)

### 1. Remaining product-feedback items

From the feedback doc. Two are done (see below); these are not:

- **Single knowledge base** — both the landing AI and the dashboard AI now read
  the same Lira org KB, but they run _different models and prompts_
  (landing = `gpt-4o-mini` via `/lira/v1/voice-demo/concierge`;
  dashboard = Claude Sonnet 5 via the support agent). Not yet proven that they
  answer _consistently_. Verify, then reconcile.
- **Agentic onboarding** — needs a real signup walkthrough to judge whether it
  actively drives activation rather than waiting to be asked.
- **Docs review for a first-time developer** — the mobile path was rebuilt this
  session; authentication, webhooks, and common implementation examples have not
  been reviewed end to end.

### 2. Known gap worth fixing

`profile.logo_url` is stripped server-side if someone posts a `data:` URI. Both
onboarding and Settings now upload properly, so this is only a safety net — but
any _other_ client still hitting the API directly would silently lose the logo.

---

## What shipped this session (don't redo)

- **Sandbox badge is now the go-live shortcut** — the topbar pill opens a
  Sandbox/Live menu (`src/components/shell/EnvironmentMenu.tsx`), reusing
  `GoLiveModal`. A `402 SUBSCRIPTION_REQUIRED` from the switch flips the modal
  into checkout mode (new `requiresPayment` prop, also wired into Settings), and
  a successful switch reloads the app so every page reflects production.
- **Signup 500 fixed** — onboarding inlined the logo as a base64 `data:` URI,
  blowing DynamoDB's 400KB item limit. Oversized profile values are now dropped
  on create/update, and logos upload to S3 via `POST /orgs/:orgId/logo` with a
  stable public `GET /orgs/:orgId/logo`.
- **API keys: any member** can create/list/revoke (was owner/admin — the 403
  Riverly hit).
- **`support:read` / `support:write` are now real.** New shared dual-auth gate
  (`src/middleware/org-auth.middleware.ts`) accepts a dashboard JWT _or_ a
  developer key with the required scope. Applied to support config (read,
  update, activate) and knowledge base (crawl, document upload). A team can now
  provision Lira entirely from CI.
- **AI correctness** — landing + voice concierge grounded in the org KB; stopped
  claiming links it never sent; stopped inventing a mobile SDK; localized voice
  correctly described as a separate product at voice.liraintelligence.com.
- **Docs** — mobile guide merged into one page
  (`/platform/customer-support/mobile-frontend`), navigation rewritten to match
  the real dashboard, fintech examples removed from general pages, reference-app
  references deleted.
- **Six platform defects fixed** — sandbox no longer posts to real
  Slack/Linear/webhooks, backend billing gate on go-live, dead scopes,
  fail-closed environment default, CLI credential clash, sandbox extension now
  raises KB caps.

---

## Tools you'll want

```bash
# Test the customer-facing AI (12 cases, asserts on answers). Exits non-zero on failure.
cd ../lira-docs && node scripts/test-lira-ai.mjs

# Refresh the AI's knowledge base after any docs change (REQUIRED — not automatic)
LIRA_EMAIL=... LIRA_PASSWORD=... node scripts/refresh-lira-kb.mjs
```

**Add a case to `test-lira-ai.mjs` whenever a wrong AI answer is found in the
wild** — the `forbid` list is what stops regressions coming back.

---

## Gotchas that cost time this session

- **The docs site does NOT auto-deploy on git push.** You must run
  `vercel --prod` in `lira-docs`. A branch push alone changes nothing live.
- **The KB does not auto-sync from docs.** Run `refresh-lira-kb.mjs` after
  publishing, or the AI keeps answering from the old snapshot.
- **Only ONE crawled website per org** — a new crawl wipes the previous one.
  Uploaded documents coexist and survive crawls; that's how the docs are held.
- **Always run `npm run build` BEFORE committing backend changes.** A broken
  template literal reached `main` twice this session.
- **Before changing a backend contract, grep the frontend for its callers.**
  Removing a scope enum value broke the dashboard and blocked a customer.
- Landing AI link buttons are **client-side keyword matching** in
  `LandingVoiceConcierge.tsx` (`linkFromText`) — the AI names a topic, the client
  attaches the button. It cannot emit URLs itself on the voice path.

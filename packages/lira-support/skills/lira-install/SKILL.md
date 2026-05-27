---
name: lira-install
description: Install Lira's customer support (AI chat + tickets + identified visitors) into the current project. Use this when the user asks to "install Lira", "add Lira support", "set up the support widget", or scaffold the @liraintelligence/support package. Detects the framework, scaffolds the right files, and wires identified-visitor signing.
metadata:
  short-description: Scaffold @liraintelligence/support into the current project
---

# Lira Install

This skill scaffolds Lira's customer support runtime (chat widget + full-page support route + tickets + identified visitors) into the user's current project.

## When to use

The user mentions any of:

- "install Lira"
- "add Lira support"
- "set up the chat widget"
- "scaffold @liraintelligence/support"
- "wire up customer support" / "add a support page"
- A Lira dashboard or onboarding agent asked them to run a Claude Code skill

## What you'll do

1. **Detect the framework** by reading the user's `package.json` (or, if missing, look for `Gemfile` → Rails, `manage.py` → Django, `*.html` files only → static).
2. **Ask for the org id** (format: `org-xxxxxxxx`) unless one is already in the project's `.env*` files. Get it from the Lira dashboard → Settings → Organization.
3. **Run the scaffold:**
   ```bash
   npx @liraintelligence/support init --org-id=<ORG_ID> --org-name=<ORG_NAME>
   ```
   This drops:
   - Next.js: `app/support/page.tsx`, `app/support/LiraSupport.client.tsx`, `app/api/lira/sign/route.ts`, `.env.local`
   - Vite: `src/Support.tsx`
   - Other: a starter snippet in `support.html`
4. **Install the package** (skip for Rails/Django/plain-HTML — they use the script tag, no npm dep):
   ```bash
   npm install @liraintelligence/support
   ```
5. **Tell the user where to grab their widget secret**: Lira dashboard → Settings → Support → Secret tab. Fill it into `.env.local` as `LIRA_WIDGET_SECRET=...`.
6. **Print next steps** — show the user how to start the dev server and visit `/support`.

## Framework-specific notes

| Framework          | Use this guide                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| Next.js            | https://docs.liraintelligence.com/platform/customer-support/integration-guides/nextjs  |
| Vite + React       | https://docs.liraintelligence.com/platform/customer-support/integration-guides/vite    |
| Remix              | https://docs.liraintelligence.com/platform/customer-support/integration-guides/remix   |
| Rails              | https://docs.liraintelligence.com/platform/customer-support/integration-guides/rails   |
| Django             | https://docs.liraintelligence.com/platform/customer-support/integration-guides/django  |
| Express + frontend | https://docs.liraintelligence.com/platform/customer-support/integration-guides/express |
| Plain HTML         | https://docs.liraintelligence.com/platform/customer-support/integration-guides/html    |
| Something else     | https://docs.liraintelligence.com/platform/customer-support/web-sdk                    |

If you're working in a framework the CLI doesn't scaffold (Rails, Django, raw Express, vanilla HTML), don't run `npx ... init`. Instead, fetch the relevant guide above and walk the user through the steps inline.

## Identified visitors

If the user's app has logged-in users (auth, dashboards, accounts), make sure they understand that:

1. `LIRA_WIDGET_SECRET` must live server-side only (never `NEXT_PUBLIC_*` or browser-exposed)
2. A server route signs each visitor's email: `HMAC-SHA256(LIRA_WIDGET_SECRET, email.trim().toLowerCase())`
3. The signature gets passed to `<LiraProvider identity={{ email, name, sig }}>`

The Next.js CLI scaffold sets this up automatically. For other frameworks, the integration guide shows the exact signing code in their language.

## Validation

After scaffolding:

1. Confirm the relevant files exist (run `ls -la` on the scaffolded paths).
2. Tell the user: "Now fill `LIRA_WIDGET_SECRET` in `.env.local` and run `npm run dev`. Visit `/support` to see it live."
3. Offer to run `npm install @liraintelligence/support` if they haven't yet.

## What NOT to do

- **Do not invent your own integration code.** Always use the canonical `npx @liraintelligence/support init` for bundled frameworks, or the docs site for non-bundled ones.
- **Do not hardcode the widget secret in browser code.** Always server-side env var.
- **Do not invent the `org_id`.** Ask the user — it's specific to their Lira account.
- **Do not skip the validation step.** If the scaffold fails or the user has the wrong framework, fall back to the docs guide.

# Lira Integration Verification Tracker

## Core Mandate

**Every integration must be officially approved/verified by its platform. No red warnings. No "not approved" banners. No exceptions.**

Reasons:

- Enterprise customers notice unverified/unapproved status immediately — it kills trust.
- Approval processes take weeks to months. We start them early — so we're already approved when large-scale marketing begins.
- Just like Google OAuth review was submitted early, every platform's review/listing/certification must be started now.

This tracker covers: (1) making the integration technically correct, AND (2) submitting for official platform approval.

## Execution Rule

1. Work only one provider at a time.
2. Complete: console config → code alignment → legal/docs → **submit for official platform approval**.
3. Mark provider done only when submission/application is sent.
4. Move to next provider only when user says `next`.

## Status Board

| #   | Integration     | Status                             | Approval Target                                                               |
| --- | --------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Google          | In Progress                        | Google OAuth verification (data access review) — submitted, awaiting response |
| 2   | Slack           | Tech Complete — Awaiting Customers | Slack App Directory — submit when 3+ active orgs confirmed                    |
| 3   | Microsoft Teams | Temporarily Disabled               | Microsoft 365 App Certification (Teams Store)                                 |
| 4   | Linear          | Tech Complete — Awaiting Customers | Linear Developer Platform — official app listing                              |
| 5   | GitHub          | Tech Complete — Awaiting Customers | GitHub Marketplace — official listing                                         |
| 6   | HubSpot         | Tech Complete — Awaiting Customers | HubSpot App Marketplace — official listing                                    |
| 7   | Salesforce      | Tech Complete — Awaiting Customers | Salesforce AppExchange — security review + listing                            |
| 8   | Greenhouse      | Tech Complete — Awaiting Customers | Greenhouse Partner Program — official partner listing                         |

---

## 1) Google (Current: In Progress)

### Current state

- Branding/domain verification completed.
- OAuth clients split (login vs integrations).
- Frontend and backend deployed with updated Google integration flows.
- Verification demo video recorded and submitted.
- Google data access review: pending.

### Wait-state actions

- Monitor reviewer email daily.
- Respond to reviewer requests same day.
- Keep demo artifacts ready (video link, scope justifications, test access path).

### Done criteria

- Google approval received.
- Unverified warning removed for production users (where applicable).

---

## 2) Slack (Current: In Progress)

### Approval target

**Slack App Directory** — official listing so Lira shows as a Slack-reviewed, approved app. Removes the "app not approved by Slack" warning that enterprise workspaces see.
URL to submit: https://api.slack.com/apps → your app → Manage Distribution → Submit to App Directory

### Verified from code (completed)

- OAuth callback route: `https://api.creovine.com/lira/v1/integrations/slack/callback`
- Interactions URL: `https://api.creovine.com/lira/v1/integrations/slack/interactions`
  - Handles Block Kit `block_actions` (Acknowledge button on every posted message)
  - Signature-verified via `x-slack-signature` (timing-safe, 5-min replay protection)
  - Must be set in Slack App Console → Interactivity & Shortcuts
- Current scopes requested by app:
  - `chat:write`
  - `channels:read`
  - `groups:read` — justification: show private channels user has invited Lira to
  - `im:write` — justification: send DMs with action items assigned to specific users
  - `users:read`
  - `users:read.email` — justification: match Lira members to Slack users by email
  - `team:read`
- Connected features in product:
  - list/select channel
  - post summaries/action items to channel with interactive Acknowledge button
  - map members and send DMs
  - Block Kit interactive button (`lira_acknowledge`) → updates message on click

### Security fix (completed)

- `docs/replytoken.txt` removed from git and added to `.gitignore`
- `REPLY_TOKEN_SECRET` rotated on EC2, backend restarted

### Website/App Console tasks

- [ ] App name, icon, support contact, developer/contact email — all filled in
- [ ] Privacy policy URL and Terms URL — set to lira URLs
- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/slack/callback`
- [ ] Interactivity & Shortcuts → Request URL: `https://api.creovine.com/lira/v1/integrations/slack/interactions`
- [ ] All Manage Distribution checks green (Remove Hard-Coded Information resolved)
- [ ] Public Distribution activated

### Customer threshold before submitting

> **Do not submit to the App Directory until Lira has at least 3 active organizations using the Slack integration.**
> Slack reviewers check for real usage. 3 orgs is a safe minimum — enough to show legitimate adoption without being blocked for "no customers".
> Even 1–2 orgs with verifiable activity (message history in their workspace) will likely pass. 3 is the safe target.

### App Directory Submission tasks (do these when customer threshold is met)

- [ ] App description (short + long) written
- [ ] Screenshots uploaded (at least 3 showing real Slack usage in Lira)
- [ ] Scope justifications written (scope justifications are pre-written above in "Verified from code")
- [ ] Support URL and privacy policy URLs confirmed
- [ ] Provide Slack reviewer a test org account with Slack connected (they will check it)
- [ ] Submit for Slack review

### Done criteria

- 3+ active orgs using Slack integration confirmed
- App Directory submission sent to Slack
- "App not approved by Slack" warning will be removed once Slack approves (typically 1–4 weeks)

---

## 3) Microsoft Teams

### Current state

> **Temporarily removed from UI and backend** (April 2026) — active OAuth issues being investigated.
> All code is commented out with `TEAMS_DISABLED` markers. Re-enable by reverting those comments.
> Files to restore:
>
> - `creovine-api/src/index.ts` — import + route registration
> - `creovine-api/src/services/lira-task-executor.service.ts` — import, token loading, action cases
> - `lira_ai/src/pages/IntegrationsPage.tsx` — imports, types, URL handler, `<TeamsCard />`

### Approval target

**Microsoft 365 App Certification** — Lira's Teams app must pass Microsoft's certification process so it can be submitted to the Teams App Store. Without this, org admins see "This app has not been certified" and may block installation.
Path: Azure Portal → App Registration → then Teams Admin Center → Manage Apps → submit for certification.

### Verified from code (completed)

- OAuth callback route: `https://api.creovine.com/lira/v1/integrations/teams/callback`
- Azure App Registration: `2e07a337-f9e5-4084-a176-1a324f9daed9` (Display name: Lira)
- `TEAMS_TENANT_ID` intentionally unset → defaults to `'common'` (correct for multi-tenant SaaS)
- Credentials live on EC2 (`/opt/creovine-api/.env`) — integration is functional in production
- Graph scopes in use (all justified):
  - `Team.ReadBasic.All` — list teams the user belongs to
  - `Channel.ReadBasic.All` — list channels within a team
  - `ChannelMessage.Send` — post meeting summaries to channels
  - `User.Read.All` — member mapping (match Lira members to Teams users by email)
  - `Chat.Create` + `ChatMessage.Send` — send 1:1 DMs with action items
  - `offline_access` — token refresh (access tokens expire in 1 hour)
- Connected features in product:
  - list joined teams, list channels, set default team/channel
  - post summaries/action items to channels
  - member mapping and 1:1 DMs
  - auto-refresh token on expiry

### Website/App Console tasks (do these now — no customers needed)

- [ ] Entra app registration: branding, support URL, privacy URL, terms URL fully filled in
  - Support URL: `https://liraintelligence.com/support`
  - Privacy URL: `https://liraintelligence.com/privacy`
  - Terms URL: `https://liraintelligence.com/terms`
- [ ] Redirect URL confirmed in Azure: `https://api.creovine.com/lira/v1/integrations/teams/callback`
- [ ] Publisher verification completed — verify `liraintelligence.com` domain via Microsoft Partner Network (MPN)
  - Path: partner.microsoft.com → enroll → verify domain → link to Azure app registration
  - This is required before Teams Store submission is even possible
- [ ] Teams App manifest created (JSON file with app ID, scopes, bot/tab if needed)

### Customer threshold before submitting

> Same rule as Slack: **3 active organizations using Teams integration** before submitting to the Teams Store.
> Publisher verification (above) has no customer requirement — do it immediately.

### Certification/Listing tasks (do when customer threshold met)

- [ ] Submit app to Teams App Store via Partner Center
- [ ] Complete Microsoft 365 App Certification (automated + manual checks)

### Done criteria

- Publisher verification completed
- Teams Store submission sent (after 3+ active orgs)
- Microsoft 365 Certified badge applied (removes "not certified" warning)

---

## 4) Linear

### Approval target

**Linear Developer Platform — official app listing.** Linear publishes verified integrations at linear.app/integrations. Getting listed signals to engineering-focused enterprise teams that Lira is a trusted, vetted tool.
Path: linear.app/settings/api → create OAuth app → apply for public listing via Linear's developer program.

### Verified from code (completed)

- OAuth callback route: `https://api.creovine.com/lira/v1/integrations/linear/callback`
- Credentials on EC2: `LINEAR_CLIENT_ID` + `LINEAR_CLIENT_SECRET` — ✅
- Scopes: `read write` — justified:
  - `read` — list teams, members, workflow states
  - `write` — create/update/delete issues
- Webhook: auto-registers on connect at `https://api.creovine.com/lira/v1/webhooks/inbound/linear`
  - Signature verified (HMAC-SHA256, timing-safe)
  - Idempotency check on delivery ID
- Full task sync: create issue, update status, update assignee, delete issue
- Member mapping: auto-maps by email on connect
- `linear:create_issue` action in AI task executor — fully wired

### Website/App Console tasks (do now — no customers needed)

- [ ] Confirm redirect URL in Linear OAuth app: `https://api.creovine.com/lira/v1/integrations/linear/callback`
- [ ] App name, description, icon, support URL, privacy URL filled in at linear.app/settings/api

### Customer threshold before submitting

> **3 active organizations using Linear integration** before applying for public listing.
> Linear's listing process is lightweight — no security review, just an application form and a description of your integration.

### Listing tasks (do when customer threshold met)

- [ ] Apply for public OAuth app listing via Linear developer program (linear.app/settings/api → your app → Request public listing)

### Done criteria

- Application submitted to Linear
- Listed on linear.app/integrations (once approved)

---

## 5) GitHub

### Approval target

**GitHub Marketplace listing.** Listed apps appear at github.com/marketplace as verified integrations. Enterprise GitHub orgs trust Marketplace-listed apps and can allow them via org policy without individual IT approval tickets.
Path: github.com/settings/apps → your app → Marketplace → list this app.

### Verified from code (completed)

- OAuth callback: `https://api.creovine.com/lira/v1/integrations/github/callback`
- Scopes: `repo,read:user,user:email` — justified:
  - `repo` — list repos, browse files, create branches, create/update files, list issues/PRs, create issue/PR
  - `read:user` — get authenticated user (login, name, avatar)
  - `user:email` — map GitHub account to org member by email
- 13 routes registered: `/auth`, `/callback`, `/status`, `DELETE /github`, `/repos`, `/repos/:o/:r/branches`, `/repos/:o/:r/files`, `/repos/:o/:r/file`, `POST /repos/:o/:r/files`, `POST /repos/:o/:r/branches`, `/repos/:o/:r/issues`, `POST /repos/:o/:r/issues`, `/repos/:o/:r/pulls`, `POST /repos/:o/:r/pulls`, `/repos/:o/:r/search`
- Task executor: `github:create_repo` and `github:create_file` wired, `githubToken` loaded from encrypted store
- Frontend: Full `GitHubCard` component, all service functions, all types imported
- Env var names: `GITHUB_APP_CLIENT_ID` + `GITHUB_APP_CLIENT_SECRET`

### Website/App Console tasks (do now — no customers needed)

- [x] GitHub OAuth App created at github.com/settings/developers
- [x] Callback URL set: `https://api.creovine.com/lira/v1/integrations/github/callback`
- [x] `GITHUB_APP_CLIENT_ID` + `GITHUB_APP_CLIENT_SECRET` confirmed on EC2 and synced to local `.env`
- [ ] App description, logo, homepage URL, privacy policy URL filled in

### Customer threshold before submitting to Marketplace

> **3 active organizations using GitHub integration** before applying for Marketplace listing.
> GitHub Marketplace also requires a free pricing plan (at minimum) — set this in the app settings before submitting.

### Listing tasks (do when customer threshold met)

- [ ] Set pricing plan to "Free" at minimum in app settings
- [ ] Submit Lira GitHub App for Marketplace review (github.com/settings/apps → your app → Marketplace)

### Done criteria

- GitHub Marketplace listing submitted
- Listed at github.com/marketplace once approved

---

## 6) HubSpot

### Approval target

**HubSpot App Marketplace listing.** HubSpot reviews and lists partner apps at ecosystem.hubspot.com/marketplace/apps. Sales-focused enterprises check HubSpot Marketplace before approving new tools that touch their CRM data.
Path: developers.hubspot.com → your app → Marketplace → submit for listing.

### Verified from code (completed)

- OAuth callback: `https://api.creovine.com/lira/v1/integrations/hubspot/callback`
- Credentials confirmed: `HUBSPOT_CLIENT_ID` + `HUBSPOT_CLIENT_SECRET` on EC2
- Scopes: `crm.objects.contacts.read/write`, `crm.objects.companies.read/write`, `crm.objects.deals.read/write`, `crm.objects.owners.read`, `settings.users.read`
- Adapter, routes, frontend card, task executor all implemented

### Customer threshold before submitting

> **3 active organizations using HubSpot integration** before applying for Marketplace listing.

### Listing tasks (do when customer threshold met)

- [ ] Complete HubSpot App Marketplace Partner Agreement
- [ ] Submit app for HubSpot review at developers.hubspot.com
- [ ] Provide use case demo / test credentials to HubSpot reviewer

### Done criteria

- HubSpot Marketplace submission sent
- Listed on ecosystem.hubspot.com once approved

---

## 7) Salesforce

### Approval target

**Salesforce AppExchange listing + Security Review.** AppExchange is the world's largest enterprise app marketplace. Salesforce enterprise accounts will not allow unapproved Connected Apps to access their org data. The security review (mandatory) covers data handling, API usage, and code scanning.
Path: partners.salesforce.com → submit app for AppExchange security review → publish listing.

### Verified from code (completed)

- OAuth callback: `https://api.creovine.com/lira/v1/integrations/salesforce/callback`
- Credentials confirmed: `SALESFORCE_CLIENT_ID` + `SALESFORCE_CLIENT_SECRET` on EC2
- Scopes: `api refresh_token` — minimum required
- Adapter, routes, frontend card, task executor all implemented

### Customer threshold before submitting

> **3 active organizations using Salesforce integration** before applying for AppExchange.
> ⚠️ AppExchange security review is the longest process (weeks) — submit early once threshold is met.

### Listing tasks (do when customer threshold met)

- [ ] Join Salesforce Partner Program at partners.salesforce.com
- [ ] Submit app to AppExchange security review (Checkmarx scan + manual review)
- [ ] Resolve any security findings from scan
- [ ] Publish listing on AppExchange

### Done criteria

- AppExchange security review submitted
- Listing published once approved

---

## 8) Greenhouse

### Approval target

**Greenhouse Partner Program — official partner listing.** Greenhouse lists verified integration partners at greenhouse.io/integrations. HR teams at enterprises specifically check this list before allowing a tool to connect to their recruiting pipeline.
Path: greenhouse.io/partners → apply to become a listed integration partner.

### Verified from code (completed)

- API key-based integration (no OAuth) — key stored and validated in backend
- Adapter, routes, frontend card all implemented
- Error handling for invalid/missing API keys confirmed

### Customer threshold before submitting

> **3 active organizations using Greenhouse integration** before applying for Partner Program listing.

### Listing tasks (do when customer threshold met)

- [ ] Write integration setup docs (how to generate Greenhouse API key and connect with Lira)
- [ ] Apply to Greenhouse Partner Program at greenhouse.io/partners
- [ ] Provide integration description, logo, use cases to Greenhouse team

### Done criteria

- Greenhouse partner application submitted
- Listed on greenhouse.io/integrations once approved

---

## One-by-One Workflow Commands

- Start next provider: user says `next`.
- During provider execution:
  - Complete website console tasks.
  - Complete code/config tasks.
  - Complete legal/docs tasks.
  - Mark status in this file.

Current next provider: **Linear**.

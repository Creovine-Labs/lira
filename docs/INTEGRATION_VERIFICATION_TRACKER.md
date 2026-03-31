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

| #   | Integration     | Status      | Approval Target                                                               |
| --- | --------------- | ----------- | ----------------------------------------------------------------------------- |
| 1   | Google          | In Progress | Google OAuth verification (data access review) — submitted, awaiting response |
| 2   | Slack           | In Progress | Slack App Directory — submission in progress                                  |
| 3   | Microsoft Teams | Not Started | Microsoft 365 App Certification (Teams Store)                                 |
| 4   | Linear          | Not Started | Linear Developer Platform — official app listing                              |
| 5   | GitHub          | Not Started | GitHub Marketplace — official listing                                         |
| 6   | HubSpot         | Not Started | HubSpot App Marketplace — official listing                                    |
| 7   | Salesforce      | Not Started | Salesforce AppExchange — security review + listing                            |
| 8   | Greenhouse      | Not Started | Greenhouse Partner Program — official partner listing                         |

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
- Current scopes requested by app:
  - `chat:write`
  - `channels:read`
  - `groups:read`
  - `im:write`
  - `users:read`
  - `users:read.email`
  - `team:read`
- Connected features in product:
  - list/select channel
  - post summaries/action items to channel
  - map members and send DMs

### Security fix (completed)

- `docs/replytoken.txt` removed from git and added to `.gitignore`
- `REPLY_TOKEN_SECRET` rotated on EC2, backend restarted

### Website/App Console tasks

- [ ] App name, icon, support contact, developer/contact email — all filled in
- [ ] Privacy policy URL and Terms URL — set to lira URLs
- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/slack/callback`
- [ ] All Manage Distribution checks green (Remove Hard-Coded Information resolved)
- [ ] Public Distribution activated

### App Directory Submission tasks

- [ ] App description (short + long) written
- [ ] Screenshots uploaded (at least 3 showing real Slack usage in Lira)
- [ ] Scope justifications written (why each scope is needed)
- [ ] Support URL and privacy policy URLs confirmed
- [ ] Submit for Slack review

### Done criteria

- App Directory submission sent to Slack
- "App not approved by Slack" warning will be removed once Slack approves (typically 1–4 weeks)

---

## 3) Microsoft Teams

### Approval target

**Microsoft 365 App Certification** — Lira's Teams app must pass Microsoft's certification process so it can be submitted to the Teams App Store. Without this, org admins see "This app has not been certified" and may block installation.
Path: Azure Portal → App Registration → then Teams Admin Center → Manage Apps → submit for certification.

### Website/App Console tasks

- [ ] Entra app registration: branding, support URL, privacy URL, terms URL fully filled in
- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/teams/callback`
- [ ] Graph scopes verified against product use:
  - `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`
  - `User.Read.All`, `Chat.Create`, `ChatMessage.Send`, `offline_access`
- [ ] Publisher verification completed (Microsoft Partner Network domain verification)
- [ ] Teams App manifest prepared

### Certification/Listing tasks

- [ ] Submit app to Teams App Store via Partner Center
- [ ] Complete Microsoft 365 App Certification (automated + manual checks)

### Done criteria

- Teams Store submission sent
- Microsoft 365 Certified badge applied (removes "not certified" warning)

---

## 4) Linear

### Approval target

**Linear Developer Platform — official app listing.** Linear publishes verified integrations at linear.app/integrations. Getting listed signals to engineering-focused enterprise teams that Lira is a trusted, vetted tool.
Path: linear.app/settings/api → create OAuth app → apply for public listing via Linear's developer program.

### Website/App Console tasks

- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/linear/callback`
- [ ] Scope review: `read write` — justified against issues/teams/project usage
- [ ] App name, description, icon, support URL, privacy URL filled in

### Listing tasks

- [ ] Apply for public OAuth app listing via Linear developer program

### Done criteria

- Application submitted to Linear
- Listed on linear.app/integrations (once approved)

---

## 5) GitHub

### Approval target

**GitHub Marketplace listing.** Listed apps appear at github.com/marketplace as verified integrations. Enterprise GitHub orgs trust Marketplace-listed apps and can allow them via org policy without individual IT approval tickets.
Path: github.com/settings/apps → your app → Marketplace → list this app.

### Website/App Console tasks

- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/github/callback`
- [ ] Scopes reviewed: `repo`, `read:user`, `user:email` — justified against features
- [ ] App name, description, icon, support URL, privacy URL set
- [ ] Pricing plan set (free tier at minimum required for Marketplace listing)

### Listing tasks

- [ ] Submit Lira GitHub App for Marketplace review
- [ ] Pass GitHub's automated and manual review

### Done criteria

- GitHub Marketplace listing submitted
- Listed at github.com/marketplace once approved

---

## 6) HubSpot

### Approval target

**HubSpot App Marketplace listing.** HubSpot reviews and lists partner apps at ecosystem.hubspot.com/marketplace/apps. Sales-focused enterprises check HubSpot Marketplace before approving new tools that touch their CRM data.
Path: developers.hubspot.com → your app → Marketplace → submit for listing.

### Website/App Console tasks

- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/hubspot/callback`
- [ ] Scopes reviewed against product features:
  - `crm.objects.contacts.read/write`
  - `crm.objects.companies.read/write`
  - `crm.objects.deals.read/write`
  - `crm.objects.owners.read`
  - `settings.users.read`
- [ ] App name, description, icon, support URL, privacy URL filled in

### Listing tasks

- [ ] Complete HubSpot App Marketplace Partner Agreement
- [ ] Submit app for HubSpot review
- [ ] Provide use case demo / test credentials to HubSpot reviewer

### Done criteria

- HubSpot Marketplace submission sent
- Listed on ecosystem.hubspot.com once approved

---

## 7) Salesforce

### Approval target

**Salesforce AppExchange listing + Security Review.** AppExchange is the world's largest enterprise app marketplace. Salesforce enterprise accounts will not allow unapproved Connected Apps to access their org data. The security review (mandatory) covers data handling, API usage, and code scanning.
Path: partners.salesforce.com → submit app for AppExchange security review → publish listing.

### Website/App Console tasks

- [ ] Redirect URL confirmed: `https://api.creovine.com/lira/v1/integrations/salesforce/callback`
- [ ] Scopes: `api refresh_token` — minimum required, justified
- [ ] Connected App settings: OAuth policies, permitted users, IP relaxation
- [ ] Join Salesforce Partner Program (required for AppExchange)

### Security Review tasks

- [ ] Submit app to AppExchange security review (Checkmarx scan + manual review)
- [ ] Resolve any security findings from scan
- [ ] Publish listing on AppExchange

### Done criteria

- AppExchange security review submitted (this is the longest process — submit ASAP)
- Listing published once approved

---

## 8) Greenhouse

### Approval target

**Greenhouse Partner Program — official partner listing.** Greenhouse lists verified integration partners at greenhouse.io/integrations. HR teams at enterprises specifically check this list before allowing a tool to connect to their recruiting pipeline.
Path: greenhouse.io/partners → apply to become a listed integration partner.

### Website/App Console tasks

- [ ] Integration setup docs written (how to generate Greenhouse API key and connect with Lira)
- [ ] API key validation + permission error handling confirmed in backend
- [ ] Privacy policy covers Greenhouse candidate/job data usage and deletion

### Partner listing tasks

- [ ] Apply to Greenhouse Partner Program at greenhouse.io/partners
- [ ] Provide integration description, logo, use cases to Greenhouse team
- [ ] Pass any technical/security review Greenhouse requires

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

Current next provider: **Slack**.

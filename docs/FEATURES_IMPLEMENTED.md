# Lira — Features Implemented

Generated: 2026-05-28
Scope: Full platform (marketing, app, support, admin, portal, widget, SDK).

This document inventories every shipped feature in this repository. Sub-features are bulleted under each feature with file references.

---

## 1. Marketing & Public Pages

### 1.1 Landing & home

- **Landing V4** ([LandingPageV4.tsx](src/pages/LandingPageV4.tsx)) — current primary landing.
- **Landing V3** ([LandingPageV3.tsx](src/pages/LandingPageV3.tsx)) — alternative variant.
- **Landing variant** ([LandingPageVariant.tsx](src/pages/LandingPageVariant.tsx)) — A/B variant.
- **Home / auth gate** ([HomePage.tsx](src/pages/HomePage.tsx)) — login + signup + Google OAuth router.

### 1.2 Product pages

- **Features** ([FeaturesPage.tsx](src/pages/FeaturesPage.tsx))
- **Pricing** ([PricingPage.tsx](src/pages/PricingPage.tsx)) — Starter / Growth / Enterprise tiers + FAQs.
- **Product: customer support** ([ProductCustomerSupportPage.tsx](src/pages/ProductCustomerSupportPage.tsx))
- **Product: sales** ([ProductSalesPage.tsx](src/pages/ProductSalesPage.tsx))
- **Integrations** ([IntegrationsPage.tsx](src/pages/IntegrationsPage.tsx))

### 1.3 Company & resources

- **About** ([AboutPage.tsx](src/pages/AboutPage.tsx))
- **Careers** ([CareersPage.tsx](src/pages/CareersPage.tsx))
- **Contact** ([ContactPage.tsx](src/pages/ContactPage.tsx))
- **Book demo** ([BookDemoPage.tsx](src/pages/BookDemoPage.tsx))
- **Security & compliance** ([SecurityPage.tsx](src/pages/SecurityPage.tsx))

### 1.4 Docs, blog, tutorials

- **Docs hub** ([DocsHubPage.tsx](src/pages/DocsHubPage.tsx))
- **Doc article** ([DocArticlePage.tsx](src/pages/DocArticlePage.tsx))
- **Tutorials** ([TutorialsPage.tsx](src/pages/TutorialsPage.tsx))
- **Blog hub** ([BlogPage.tsx](src/pages/BlogPage.tsx))
- **Blog post** ([BlogPostPage.tsx](src/pages/BlogPostPage.tsx))
- **Resources** ([ResourcesPage.tsx](src/pages/ResourcesPage.tsx))

### 1.5 Legal

- Privacy ([PrivacyPolicyPage.tsx](src/pages/PrivacyPolicyPage.tsx))
- Terms ([TermsOfServicePage.tsx](src/pages/TermsOfServicePage.tsx))
- Cookie ([CookiePolicyPage.tsx](src/pages/CookiePolicyPage.tsx))
- Acceptable use ([AcceptableUsePolicyPage.tsx](src/pages/AcceptableUsePolicyPage.tsx))

### 1.6 Demo / playground

- **Demo site** ([DemoSitePage.tsx](src/pages/DemoSitePage.tsx)) — Nimbus-style demo with bubble widget mounted (`demo.liraintelligence.com`).
- **Demo help portal** ([DemoHelpPage.tsx](src/pages/DemoHelpPage.tsx)) — full-page support portal demo (SDK fullscreen mode).
- **Launch demo** ([LaunchDemoPage.tsx](src/pages/LaunchDemoPage.tsx)) — launch Lira bot into a meeting.
- **UI Lab** ([UiLabPage.tsx](src/pages/UiLabPage.tsx)) — internal component playground.

---

## 2. Authentication & Onboarding

- **Email + password signup** — name, email, password, optional company.
- **Google OAuth login** — via `@react-oauth/google`.
- **Email + password login**.
- **Forgot password** ([ForgotPasswordPage.tsx](src/pages/ForgotPasswordPage.tsx)) — email token send.
- **Reset password** ([ResetPasswordPage.tsx](src/pages/ResetPasswordPage.tsx)) — token-based.
- **Email verification** ([VerifyEmailPage.tsx](src/pages/VerifyEmailPage.tsx)) — 6-digit OTP.
- **Onboarding wizard** ([OnboardingPage.tsx](src/pages/OnboardingPage.tsx)) — first-time org setup, KB intro.
- **Accept invite** ([AcceptInvitePage.tsx](src/pages/AcceptInvitePage.tsx)) — accept org invite via token.
- **Platform invite codes** — `validatePlatformInvite()` during signup/login.
- **Employee invites** — send, list, revoke, accept, validate.

---

## 3. App Shell & Navigation

- **AppShell** ([AppShell.tsx](src/components/shell/AppShell.tsx)) — authenticated wrapper:
  - Left sidebar (org switcher, nav sections, quick actions)
  - Top bar (user menu, notifications, settings, help)
  - Notification bell with badge counts
  - Light/dark theme
  - Responsive mobile drawer
- **Admin shell** ([AdminShell.tsx](src/pages/admin/AdminShell.tsx)) — admin-only wrapper.
- **Org layout** ([components/org/](src/components/org/)) — org-scoped page wrapper.
- **SEO helper** ([SEO.tsx](src/components/SEO.tsx)) — meta tags per page.

---

## 4. Support Module

### 4.1 Activation & entry

- **Activate support** ([SupportActivatePage.tsx](src/pages/support/SupportActivatePage.tsx)) — enable support, configure email/widget/portal.
- **Support landing** ([SupportPage.tsx](src/pages/support/SupportPage.tsx)) — redirects to tickets; config guard redirects to activate if not activated.

### 4.2 Inbox

- **Inbox** ([SupportInboxPage.tsx](src/pages/support/SupportInboxPage.tsx))
  - Status filters: all / open / pending / escalated / resolved
  - Search by customer / subject / text; sort by recency / status / sentiment
  - Row metadata: customer, subject, preview, channel, status badge, sentiment, last updated
  - Stats cards: totals, open, resolved, autonomous vs human, escalations
  - Background polling (5s)
  - Latest-conversation-per-customer grouping when no status filter

### 4.3 Tickets

- **Tickets list** ([SupportTicketsPage.tsx](src/pages/support/SupportTicketsPage.tsx))
  - Tabs: all / open / in_progress / resolved / closed
  - **New ticket modal** with subject, message, **file attachments** (commit `dc310ff`)
  - Search + sort
- **Ticket detail** — full thread, agent reply, resolve with feedback (+CSAT), escalate, assign, tags, regenerate handoff brief, attachment display.

### 4.4 Conversation detail

- **Conversation page** ([SupportConversationPage.tsx](src/pages/support/SupportConversationPage.tsx))
  - Full message thread (customer, Lira, agent, system roles)
  - Streaming AI replies with chunked rendering
  - Agent reply send + typing indicator
  - Customer typing + last-seen real-time
  - Resolve, escalate (with reason), delete, hand back to Lira, update tags, generate summary
  - Display confidence score, grounded KB sources
  - Metadata: subject, status, sentiment, intent, CSAT, tags, linked ticket/action IDs

### 4.5 Customers

- **Customers list** ([SupportCustomersPage.tsx](src/pages/support/SupportCustomersPage.tsx)) — directory with email, tier, totals, escalations; search; tier badges (Standard / VIP / Enterprise); delete with cascade.
- **Customer detail** ([SupportCustomerDetailPage.tsx](src/pages/support/SupportCustomerDetailPage.tsx)) — profile, update, delete, merge duplicates, conversation history, metrics.
- Profile fields: name, email, phone, company, visitorId, HubSpot contact ID, Salesforce contact ID, tier, totals, last contacted.

### 4.6 Analytics

- **Analytics** ([SupportAnalyticsPage.tsx](src/pages/support/SupportAnalyticsPage.tsx))
  - Overview cards: total / open / resolved / pending, autonomous vs human, escalations, avg response time, avg CSAT
  - Resolution breakdown chart
  - Channel breakdown (chat / email / voice / portal)
  - Message volume (total / customer / Lira / team)
  - Top customer intents
  - Monthly conversation + AI reply usage
  - Weekly report tab (period start/end, top intents, KB drafts created/approved)

### 4.7 Actions (operator approvals)

- **Actions** ([SupportActionsPage.tsx](src/pages/support/SupportActionsPage.tsx))
  - **Approval Queue** — pending `email_followup` actions (customer-facing drafts) for approve/reject
  - **History** — completed/failed/rejected actions including `escalation_email`
  - Statuses: pending, approved, executing, completed, executed, failed, rejected

### 4.8 Knowledge gaps

- **Knowledge** ([SupportKnowledgePage.tsx](src/pages/support/SupportKnowledgePage.tsx))
  - KB draft queue (pending / approved / rejected)
  - Approve with optional title/body edits; reject with reason
  - Draft fields: title, body, gap description, conversation context, reviewer

### 4.9 Proactive outreach

- **Proactive** ([SupportProactivePage.tsx](src/pages/support/SupportProactivePage.tsx))
  - Triggers CRUD + enable/disable toggle
  - Fields: name, event type, conditions, channels, template, cooldown hours, daily cap
  - Condition operators: eq / neq / gt / gte / lt / lte / contains
  - Channels: email, in-app widget, web push, SMS, mobile push, Slack DM, voice
  - Activity log: sent / delivered / failed / skipped
  - Send proactive message to specific customer

### 4.10 Notifications

- **Notifications** ([SupportNotificationsPage.tsx](src/pages/support/SupportNotificationsPage.tsx))
  - Escalation alerts feed per org, mark-as-read, deep-link into conversation
  - In-app bell badge

### 4.11 Tool packs

- **Tool packs** ([SupportToolPacksPage.tsx](src/pages/support/SupportToolPacksPage.tsx)) — enable/disable agent action packs, redacted config display, upsert config.

### 4.12 Settings tab

- **Support settings** ([SupportSettingsPage.tsx](src/pages/support/SupportSettingsPage.tsx))
  - Widget embed snippet + secret (show/hide, copy)
  - Rotate widget secret with confirm
  - Email / portal / escalation / handoff trigger config
  - Onboarding state

### 4.13 Handoff layer (commit `bbec89c`)

- **Auto-escalation triggers** — sentiment, repeated failure, VIP, multi-turn confusion, SLA pressure (all configurable per-org via `handoff_triggers`).
- **Handoff brief** — auto-generated context summary on escalation; regenerate-on-demand.
- **Round-trip learning** — escalation outcomes feed back into KB draft suggestions.
- **Ticket creation** with priority, assignee, SLA target, Slack thread ts, Linear issue ID/URL, breach timestamp.

---

## 5. Embeddable Widget ([components/support-widget/](src/components/support-widget/))

### 5.1 Build & isolation

- Standalone IIFE build (`npm run build:widget`) — Shadow DOM isolation, host-page-safe CSS.
- Single `<script>` tag embed; configurable via `data-*` attributes.

### 5.2 Configuration (script tag attrs)

- `orgId`, `color`, `greeting`, `position`
- `visitorEmail`, `visitorName`, `visitorSig` (HMAC-SHA256 identity verification)
- `ephemeral` (sessionStorage only, demo mode)
- `autoOpenFirstVisit`

### 5.3 Views

- Launcher button with unread badge
- Pre-chat form (configurable fields)
- Chat view (message thread + input)
- CSAT view (1–5 scale)
- Voice call view (timer, controls)

### 5.4 Message rendering

- Customer + Lira text bubbles
- **Streaming replies** — token-by-token chunk rendering
- **Rich generative cards** — title, body, fields, badge (success/warn/error/neutral), action buttons (primary/secondary/danger), `standard` and `stepper` kinds; stepper steps with done/active/pending status + sub-progress
- **HITL confirm prompts** — inline Approve/Cancel
- **Action cards** — live action status (pending → success/failed)
- **Suggestion chips**
- **Typing indicators** (both directions)
- **Customer last-seen** timestamp

### 5.5 Voice (gated by `voice_enabled`, commit `16b6b2c`)

- Phone icon in widget header, mic permission flow
- States: idle / connecting / connected / speaking / listening / ended / error
- Call duration timer; AudioContext + PCM playback
- WebSocket voice transport (Nova Sonic); barge-in support; clean teardown

### 5.6 State & persistence

- Persistent visitor UUID per org in localStorage
- Chat history persisted + scoped to visitor; 24h local expiry
- Conversation ID maintained across reloads
- Logout rotates anonymous visitor scope + clears history
- Ephemeral mode uses sessionStorage (demo only)

### 5.7 Connection

- WebSocket chat with auto-reconnect (exponential backoff)
- Polling fallback for connection loss
- Client-side message dedup by ID
- Event types — in: `reply / reply_start / reply_chunk / reply_end / status / error / escalated / welcome / typing / agent_reply / handback / proactive / history / card / confirm / action_result / navigate / demo_action_executed / action_started / action_completed / action_failed / pin_required / suggestions / lira_action / integration_warning`; out: `message / typing / end / confirm_response / demo_context / context_update / pin_response / pin_cancel / customer_action_result`.

---

## 6. Support SDK & Full-Page Embed ([src/sdk/](src/sdk/), commit `a1eebae`)

- **`loadLira(src)`** — fetch widget script + return Lira API.
- **`init(config)`** — set org ID + partial widget config.
- **`identify(visitor)`** — set verified identity (email, name, HMAC sig).
- **`logout()`** — clear identity, rotate visitor scope.
- **`setContext(context)`** — pass live product context to the agent.
- **`track(event, payload)`** — custom event tracking.
- **`mountWidget(config)`** — mount floating bubble.
- **`mountSupportPage(target, config)`** — mount fullscreen embed into a CSS selector or HTMLElement (customer-owned `/support` page).
- **`destroy()`** — teardown + cleanup.

---

## 7. Customer Portal ([src/portal/](src/portal/), separate Vite app)

- Standalone build (`npm run dev:portal` / `npm run build:portal`); served from `portal.html`.
- Path-based SPA router with `history` API.
- Routes: `/:orgSlug`, `/submit`, `/tickets`, `/tickets/:id`, `/chat`.
- Pages: PortalHome, SubmitTicket, MyTickets, TicketDetail, ChatPage.
- **Magic-link auth** for customers (passwordless).
- **Customer session** persistence per visitor.
- **Org branding**: name, logo, color, custom domain (portal_color, portal_logo_url).
- Feature gates: `portal_chat_enabled`, `portal_tickets_enabled`, `portal_track_enabled`, `portal_voice_enabled`.
- Loading and "portal unavailable" error states.

### Customer-facing tickets inside main app

- **My Tickets** ([MyTicketsPage.tsx](src/pages/MyTicketsPage.tsx)) — list view for the ticket creator.

---

## 8. Admin Module ([src/pages/admin/](src/pages/admin/))

- **Dashboard** ([AdminDashboardPage.tsx](src/pages/admin/AdminDashboardPage.tsx)) — orgs, users, active meetings, support stats, usage.
- **Users** ([AdminUsersPage.tsx](src/pages/admin/AdminUsersPage.tsx)) — list, search, view, delete, send email, promote/demote admin.
- **Organizations** ([AdminOrganizationsPage.tsx](src/pages/admin/AdminOrganizationsPage.tsx)) — list, detail, delete, create-for-user.
- **Email** ([AdminEmailPage.tsx](src/pages/admin/AdminEmailPage.tsx)) — direct email + broadcast.
- **Invites** ([AdminInvitesPage.tsx](src/pages/admin/AdminInvitesPage.tsx)) — platform invite CRUD with plan tier.
- **Management** ([AdminManagementPage.tsx](src/pages/admin/AdminManagementPage.tsx)) — admin promotion / demotion list.
- **Demo ops** ([AdminDemoOpsPage.tsx](src/pages/admin/AdminDemoOpsPage.tsx)) — demo env setup.

---

## 9. Organization & Members

- **Organizations** ([OrganizationsPage.tsx](src/pages/OrganizationsPage.tsx)) — org list, switch, create.
- **Org settings** ([OrgSettingsPage.tsx](src/pages/OrgSettingsPage.tsx)) — name, industry, description, website, logo, culture, products, terminology, custom instructions; "Let Lira write it" description generator.
- **Org members** ([OrgMembersPage.tsx](src/pages/OrgMembersPage.tsx)) — directory, roles, invite/remove, transfer ownership, member mappings to Slack/Linear/Teams.
- **Member profile** ([MemberProfilePage.tsx](src/pages/MemberProfilePage.tsx)) — name, email, picture, password.
- **Org email page** ([OrgEmailPage.tsx](src/pages/OrgEmailPage.tsx)) — org-level email config.
- **Org task detail** ([OrgTaskDetailPage.tsx](src/pages/OrgTaskDetailPage.tsx)) — see Tasks below.
- **Roles**: Owner / Admin / Member.

---

## 10. Meetings & AI Participant

### 10.1 Pages

- **Meetings list** ([MeetingsPage.tsx](src/pages/MeetingsPage.tsx)) — search, filter, stats cards.
- **Meeting detail** ([MeetingDetailPage.tsx](src/pages/MeetingDetailPage.tsx))
  - Transcript with speaker labels + timestamps
  - Summary (short / long, regenerate)
  - Post-meeting Q&A chat (`chatAboutMeeting`)
  - Participants list
  - Settings editor, export, action items
- **Live meeting room** ([MeetingPage.tsx](src/pages/MeetingPage.tsx)) — Google Meet / Zoom embed, AI participant card, controls (mute, hangup, settings), live transcript, sidebar.
- **Launch demo** ([LaunchDemoPage.tsx](src/pages/LaunchDemoPage.tsx)) — deploy Lira bot.
- **Demo help** ([DemoHelpPage.tsx](src/pages/DemoHelpPage.tsx)).

### 10.2 Bot deployment ([components/bot-deploy/](src/components/bot-deploy/))

- Deploy bot into Google Meet or Zoom.
- Lifecycle: launching → navigating → in_lobby → joining → active → leaving → terminated / error.
- Controls: mute/unmute mic, mute/unmute AI output, terminate, trigger proactive speech.
- Google + Zoom OAuth status with token expiry tracking + silent refresh.

### 10.3 Meeting settings (per user / per meeting)

- **AI name** (default Lira), **voice** (tiffany / ruth / matthew / stephen), **personality** (supportive / challenger / facilitator / analyst).
- Wake word toggle, proactive suggestions toggle, language.
- Meeting type: meeting / interview / standup / 1:1 / technical / brainstorming / sales.

### 10.4 Components

- [MeetingHeader](src/components/meeting-room/), [MeetingControlsBar](src/components/meeting-room/), [AiParticipantCard](src/components/meeting-room/), [MeetingSidebar](src/components/meeting-room/), [ParticipantTile](src/components/meeting-room/)
- Transcript components ([components/transcript/](src/components/transcript/))

---

## 11. Knowledge Base & Documents

- **KB hub** ([KnowledgeBasePage.tsx](src/pages/KnowledgeBasePage.tsx)) — tabbed workspace.
- **Connected sources** ([kb/ConnectedSourcesPanel.tsx](src/pages/kb/ConnectedSourcesPanel.tsx)) — add/manage crawl URLs, status (idle / crawling / completed / failed), pages crawled, retry.
- **Crawl** ([kb/CrawlPanel.tsx](src/pages/kb/CrawlPanel.tsx)) — trigger, monitor, history, depth + filter config.
- **Documents** ([kb/DocumentsPanel.tsx](src/pages/kb/DocumentsPanel.tsx)) — upload PDF / Word / text, batch upload, status (uploaded / processing / indexed / failed), metadata (size, pages, chunks, embeddings), download, delete, reprocess.
- **Query** ([kb/QueryPanel.tsx](src/pages/kb/QueryPanel.tsx)) — keyword + embedding search; preview entry (title, summary, category, keywords, source URL); pagination; delete entry.
- **Documents page** ([DocumentsPage.tsx](src/pages/DocumentsPage.tsx)) — separate dedicated docs view.
- Auto-summarization, keyword extraction, embedding density tracking, category tagging (about / product / docs / blog / other).

### Source types

- Web (HTTP/HTTPS, depth + follow + pattern filters)
- PDF, Word (.docx), plain text
- Google Drive folders/files, Google Docs, Google Sheets

---

## 12. Tasks & Action Items

- **Tasks** ([TasksPage.tsx](src/pages/TasksPage.tsx)) — list extracted from meetings; filter by status/priority; search; create manual; assign.
- **Task detail** ([OrgTaskDetailPage.tsx](src/pages/OrgTaskDetailPage.tsx)) — title, description, assignee, priority, status, due date, source quote from transcript, execution status, email draft, Lira review status (reviewing / needs_info / approved), preview.
- Types: action_item / draft_document / follow_up_email / research / summary / decision.
- Auto-extraction from meetings; email execution (draft + send); Lira autonomous review.

---

## 13. Settings, Billing, Webhooks

- **Settings hub** ([SettingsPage.tsx](src/pages/SettingsPage.tsx)) — profile, support, integrations, calendar sync.
- **Usage** ([UsagePage.tsx](src/pages/UsagePage.tsx)) — plan tier, monthly conversation + AI reply counts vs caps, upgrade CTA, beta limit modal.
- **Webhooks** ([WebhooksPage.tsx](src/pages/WebhooksPage.tsx)) — subscribe per event (`task_created`, `task_completed`, `meeting_ended`, `summary_ready`); Slack webhook URL; email notification toggles.
- **Integrations** ([IntegrationsPage.tsx](src/pages/IntegrationsPage.tsx)) — see §14.

---

## 14. Integrations

| Category  | Service                          | Capabilities                                                         |
| --------- | -------------------------------- | -------------------------------------------------------------------- |
| Comms     | **Slack**                        | OAuth, channels, default channel, member mapping, escalation routing |
| Comms     | **Microsoft Teams**              | OAuth scaffold (hidden)                                              |
| Voice/SMS | **Twilio**                       | Connect (number, SID, token), proactive SMS                          |
| CRM       | **HubSpot**                      | OAuth, contacts, companies, deals, pipelines, owners                 |
| CRM       | **Salesforce**                   | OAuth, contacts, accounts, opportunities, leads                      |
| PM        | **Linear**                       | OAuth, teams, members, create issues from escalations                |
| PM        | **GitHub**                       | OAuth, repos, branches, files, issues, PRs                           |
| Calendar  | **Google Calendar**              | OAuth, list calendars, create events, auto-scheduling                |
| HR        | **Greenhouse**                   | API connect, jobs, candidates, applications                          |
| Storage   | **Google Drive / Docs / Sheets** | List, search, read content, create folders                           |

---

## 15. API Surface

### 15.1 Main API client ([services/api/index.ts](src/services/api/index.ts))

- **Auth**: googleLogin, signup, login, sendOtp/verifyOtp, forgot/resetPassword
- **Meetings**: createMeeting, list/get/delete, getMeetingSummary, getMeetingChat, chatAboutMeeting, updateMeetingSettings
- **Bot**: deployBot, getBotStatus, terminateBot, listActiveBots, terminateAllBots, mute/unmute, triggerBotSpeak, getBotAuthStatus, refreshBotAuth
- **Org**: createOrganization, list/get/update/delete, leaveOrganization, listOrgMembers, updateMemberRole, removeMember, transferOwnership, employee invites CRUD
- **Profile**: getMe, getAuthMe, updateMyPicture/Name/Email, changePassword, deleteAccount
- **KB**: triggerCrawl, getCrawlStatus, listKBEntries, deleteKBEntry, clearKB, queryKB
- **Documents**: uploadDocument, list/get/delete, getDocumentDownloadUrl, reprocessDocument
- **Tasks**: list/get/create/update/delete, listTasksByMeeting, executeTask, updateTaskLiraReview
- **Webhooks**: getWebhookConfig, updateWebhookConfig
- **Usage**: getOrgUsage, getDashboardStats
- **Schedules**: create/list/get/update/delete/toggleSchedule
- **Admin**: dashboard, orgs/users CRUD, send/broadcast email, invites, promote/demote
- **Misc**: getLiraWidgetCreds, saveAttribution, validatePlatformInvite, calendar sync
- **Integrations**: 9 services × (auth URL / status / disconnect / list-resources / write actions) — see §14.

### 15.2 Support API client ([services/api/support-api.ts](src/services/api/support-api.ts))

- **Config**: get/update/activate, rotateWidgetSecret
- **Customers**: list/get/update/delete, merge
- **Conversations**: list/get/search/delete
- **Tickets**: list/get, createManualTicket, replyToTicket, resolveTicket, deleteTicket, uploadTicketAttachment, getTicketAttachment
- **Messages**: sendMessage, sendTypingIndicator, endConversation
- **Escalation**: escalateConversation, regenerateHandoffBrief, listEscalationAlerts, markEscalationAlertsRead
- **Actions**: listActionLogs, approveAction, rejectAction
- **KB drafts**: list, approve (with edits), reject
- **Proactive**: triggers CRUD, listOutreachLogs, sendProactiveMessage
- **Tags & summaries**: updateConversationTags, generateConversationSummary
- **Analytics**: getSupportStats, getWeeklyReport
- **Tool packs**: list/get/upsertConfig/disable
- Wrapper: `supportFetch` with auth, session-expiry handling, beta-limit interception.

---

## 16. State Management ([src/app/store/](src/app/store/))

Zustand stores (✱ = persisted to localStorage):

| Store                 | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `useAuthStore` ✱      | User credentials, plan tier, email verified, picture, name  |
| `useOrgStore` ✱       | Current org, org list, membership                           |
| `useUserPrefsStore` ✱ | Meeting AI name / voice / personality                       |
| `useNotifStore` ✱     | Client-side notification entries, seen tracking per section |
| `useMeetingStore`     | Active meeting state, transcript, AI status                 |
| `useBotStore`         | Deployed bot state, URL, platform, error                    |
| `useKBStore`          | KB entries, crawl status                                    |
| `useDocumentStore`    | Uploaded documents                                          |
| `useTaskStore`        | Org tasks, status filter                                    |
| `useUsageStore`       | Plan usage summary, beta-limit modal                        |
| `useSupportStore`     | All support module state (see §4)                           |

---

## 17. Common Components & UI Library

- **shadcn-style UI primitives** ([components/ui/](src/components/ui/)) — Button, Card, Modal, Tooltip, Badge, etc.
- **Common** ([components/common/](src/components/common/)) — Avatar, LoadingState, ErrorState, EmptyState, ConfirmDialog, BetaLimitModal, Cluster, Stack, Grid.
- **Controls** ([components/controls/](src/components/controls/)) — interactive controls.
- **Marketing** ([components/marketing/](src/components/marketing/)) — Layout, Navbar, Footer, DemoCallModal, DemoEntryModal, DemoNimbusDashboard, DemoChatHint, TestProfileModal.
- **Bot deploy** ([components/bot-deploy/](src/components/bot-deploy/)) — BotDeployPanel, ActiveBotControls, AuthStatusCard.
- **Settings** ([components/settings/](src/components/settings/)) — CalendarSyncSection.
- **Schedules** ([components/schedules/](src/components/schedules/)) — ScheduleModal.
- **AI** ([components/ai/](src/components/ai/)) — AI-related shared UI.
- **Public widgets** — [LiraLogo](src/components/LiraLogo.tsx), [PublicLiraWidget](src/components/PublicLiraWidget.tsx), [LiraOnboardingWidget](src/components/LiraOnboardingWidget.tsx).

---

## 18. Feature Gates

- **Plan tier** (Starter / Growth / Enterprise) gates advanced support features and usage caps.
- **Support activation** hides support module features until activated.
- **Portal config** gates portal chat / tickets / tracking / voice independently.
- **Voice** gated by single org-level `voice_enabled` flag (commit `16b6b2c`).
- **Email support** gated by `email_enabled` + verified custom email.

---

## 19. Build & Deployment

| Target         | Command                                       | Output                                                          |
| -------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Main app       | `npm run dev` / `npm run build`               | SPA (Vercel)                                                    |
| Support widget | `npm run build:widget`                        | IIFE bundle (`widget.liraintelligence.com` via S3 + CloudFront) |
| Portal app     | `npm run dev:portal` / `npm run build:portal` | Separate SPA                                                    |
| SDK            | `tsconfig.sdk.json` + `vite.sdk.config.ts`    | Distributable SDK                                               |
| Widget deploy  | `npm run deploy:widget`                       | S3 + CloudFront upload                                          |

Config files: [vite.config.ts](vite.config.ts), [vite.widget.config.ts](vite.widget.config.ts), [vite.portal.config.ts](vite.portal.config.ts), [vite.sdk.config.ts](vite.sdk.config.ts).

---

## 20. Recent Major Commits (last 30 days)

| Commit    | Feature                                                         |
| --------- | --------------------------------------------------------------- |
| `dc310ff` | New ticket modal + ticket file attachments UI                   |
| `bbec89c` | Handoff layer — brief, escalation triggers, round-trip learning |
| `a1eebae` | Lira support SDK + full-page embed                              |
| `0464695` | Fully removed Pipecat chat path (legacy WebSocket only)         |
| `16b6b2c` | Voice feature behind single `voice_enabled` flag                |

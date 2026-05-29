# Customer Support Features Built So Far

Generated on: 2026-05-06

This inventory covers the customer support product area only. It is based on the current support pages, support API client, support store, embeddable widget, customer portal, and support documentation in this repository.

## 1. Support Product Entry Points

- Public customer support product page.
- Support demo site page with the embeddable Lira widget mounted.
- Dedicated support module route inside the main app.
- Support activation route for first-time setup.
- Support conversation detail routes from inbox and notifications.
- Support customer detail route.
- Documentation links from support pages to support docs.

## 2. Support Module Navigation

- Main Support page with tabbed workspace.
- Tabs currently wired:
  - Inbox.
  - Customers.
  - Actions.
  - Proactive.
  - Analytics.
  - Settings.
- Support config guard:
  - Loads the current organization support config.
  - Redirects to activation if support is not activated.
  - Avoids false redirects while config is still loading.
- Organization-aware support state.

## 3. Support Activation and Configuration

- Activate support for an organization.
- Load support configuration by organization.
- Update support configuration.
- Configuration fields supported:
  - Activation state.
  - Activation timestamp.
  - Email support enabled.
  - Generated support email address.
  - Custom support email.
  - Email verification state.
  - Chat enabled.
  - Voice enabled.
  - Portal enabled.
  - Portal slug.
  - Custom portal domain.
  - Portal color.
  - Portal logo URL.
  - Portal greeting.
  - Portal chat enabled.
  - Portal voice enabled.
  - Portal tickets enabled.
  - Portal ticket tracking enabled.
  - Auto-reply enabled.
  - AI confidence threshold.
  - Forced escalation intents.
  - Slack escalation channel.
  - Linear escalation team.
  - Escalation email.
  - Greeting message.
  - SLA hours.
  - Widget color.
  - Widget secret.
  - Monthly conversation limit.
  - Monthly AI reply limit.
  - Monthly conversation usage.
  - Monthly AI reply usage.
  - Onboarding completion state.
  - Onboarding step.
- Widget secret rotation API support.

## 4. Support Inbox

- Inbox panel in the support workspace.
- Conversation list loading by organization.
- Conversation status filtering.
- Supported conversation statuses:
  - Open.
  - Pending.
  - Resolved.
  - Escalated.
- Search conversations.
- Sort conversations.
- Latest-conversation-per-customer grouping when no status filter is active.
- Conversation rows with:
  - Customer identity.
  - Subject/title.
  - Last message preview.
  - Channel.
  - Status badge.
  - Sentiment indicator.
  - Last updated time.
  - Customer avatar initial.
- Background polling for inbox updates.
- Optional stats display in inbox.
- Click-through to conversation detail.

## 5. Conversation Detail and Agent Actions

- Load a selected support conversation.
- Display full conversation message history.
- Supported message roles:
  - Customer.
  - Lira.
  - Agent.
  - System.
- Supported conversation channels:
  - Email.
  - Chat.
  - Voice.
  - Portal.
- Agent reply sending.
- Resolve conversation.
- Delete conversation.
- Hand conversation back to Lira.
- Escalate conversation with a reason.
- Update conversation tags.
- Generate conversation summary.
- Send agent typing indicator.
- Display customer typing state.
- Display customer last-seen state.
- Preserve selected conversation in support store.
- Keep conversation list and selected conversation in sync after status changes.

## 6. Conversation Metadata

- Conversation subject.
- Conversation status.
- Resolution type:
  - Autonomous.
  - Human.
  - Failed.
- Display ID.
- Tags.
- Summary.
- Intent.
- Sentiment:
  - Positive.
  - Neutral.
  - Negative.
  - Urgent.
- Confidence score.
- CSAT score.
- CSAT collection timestamp.
- Linked ticket ID.
- Linked action IDs.
- Knowledge sources used.
- Created and updated timestamps.
- Resolved timestamp.
- Customer profile merged into conversation responses.

## 7. Customer Management

- Customers tab in the support workspace.
- List support customers by organization.
- Customer detail page.
- Load selected customer.
- Update customer profile.
- Delete customer.
- List conversations for a specific customer.
- Merge duplicate customers.
- Customer profile fields supported:
  - Customer ID.
  - Organization ID.
  - Name.
  - Email.
  - Phone.
  - Company.
  - Visitor ID.
  - HubSpot contact ID.
  - Salesforce contact ID.
  - Tier.
  - Total conversations.
  - Total escalations.
  - Last contacted timestamp.
  - Created and updated timestamps.
- Supported customer tiers:
  - Standard.
  - VIP.
  - Enterprise.

## 8. Support Analytics

- Analytics tab in the support workspace.
- Load support stats by organization.
- Load weekly report by organization.
- Metrics supported:
  - Total conversations.
  - Open conversations.
  - Resolved conversations.
  - Pending conversations.
  - Autonomous resolutions.
  - Human resolutions.
  - Escalations.
  - Average response time.
  - Average CSAT.
  - Conversations this month.
  - AI replies this month.
  - Total messages.
  - Customer messages.
  - Lira messages.
  - Agent messages.
  - Chat conversations.
  - Email conversations.
  - Voice conversations.
  - Portal conversations.
  - Top intents.
- Weekly report fields:
  - Period start.
  - Period end.
  - Total conversations.
  - Autonomous resolutions.
  - Escalations.
  - Average response time.
  - Average CSAT.
  - Top intents.
  - KB drafts created.
  - KB drafts approved.
- Legacy analytics response normalization is handled in the API client.

## 9. Support Actions

- Actions tab in the support workspace.
- Load action logs by organization.
- Filter action logs by status.
- Approve pending action.
- Reject pending action.
- Action log fields supported:
  - Action ID.
  - Organization ID.
  - Conversation ID.
  - Action type.
  - Status.
  - Input.
  - Output.
  - Error.
  - Created timestamp.
  - Executed timestamp.
- Supported action statuses:
  - Pending.
  - Approved.
  - Executing.
  - Completed.
  - Executed.
  - Failed.
  - Rejected.

## 10. Knowledge Gap Drafts

- Support knowledge draft API support.
- Load KB drafts by organization.
- Approve KB draft.
- Approve KB draft with optional title/body edits.
- Reject KB draft.
- Draft fields supported:
  - Draft ID.
  - Organization ID.
  - Conversation ID.
  - Title.
  - Body.
  - Gap description.
  - Status.
  - Created timestamp.
  - Reviewed timestamp.
  - Reviewer.
- Supported draft statuses:
  - Pending review.
  - Approved.
  - Rejected.

## 11. Proactive Support

- Proactive tab in the support workspace.
- Load proactive triggers.
- Load outreach logs.
- Create proactive trigger.
- Update proactive trigger.
- Delete proactive trigger.
- Send proactive message to a customer.
- Trigger fields supported:
  - Trigger ID.
  - Organization ID.
  - Name.
  - Event type.
  - Conditions.
  - Outreach template.
  - Channel.
  - Channels.
  - Enabled state.
  - Cooldown hours.
  - Max messages per customer per day.
  - Created and updated timestamps.
- Trigger condition fields:
  - Field.
  - Operator.
  - Value.
- Supported trigger operators:
  - Equals.
  - Not equals.
  - Greater than.
  - Greater than or equal.
  - Less than.
  - Less than or equal.
  - Contains.
- Supported proactive channels:
  - Email.
  - Widget.
  - Web push.
  - SMS.
  - Mobile push.
  - Slack.
  - Voice.
- Outreach log fields:
  - Outreach ID.
  - Organization ID.
  - Trigger ID.
  - Customer ID.
  - Channel.
  - Status.
  - Sent timestamp.
  - Created timestamp.
  - Customer name.
  - Trigger name.
- Outreach statuses:
  - Sent.
  - Delivered.
  - Failed.
  - Skipped.

## 12. Escalations and Alerts

- Escalate conversation from the support inbox.
- Escalation reason capture.
- Support ticket metadata support:
  - Ticket ID.
  - Conversation ID.
  - Customer ID.
  - Subject.
  - Priority.
  - Status.
  - Assignee.
  - Escalation reason.
  - Linear issue ID.
  - Linear issue URL.
  - Slack thread timestamp.
  - SLA target.
  - SLA breach notification timestamp.
  - Created, updated, and resolved timestamps.
- Supported ticket priorities:
  - Low.
  - Medium.
  - High.
  - Urgent.
- Supported ticket statuses:
  - Open.
  - In progress.
  - Resolved.
  - Closed.
- Escalation alerts API support:
  - List escalation alerts.
  - Mark escalation alerts read.
- Escalation alert fields:
  - Alert ID.
  - Organization ID.
  - Ticket ID.
  - Conversation ID.
  - Subject.
  - Reason.
  - Read state.
  - Created timestamp.

## 13. Support Notifications

- Support notifications route.
- Notification detail routing into support conversation detail.
- Client-side support section seen tracking.
- Client-side support escalation notification type.
- Mark support notifications as seen.
- Conversation notification links for escalations.

## 14. Tool Packs

- Tool-pack admin API support.
- List tool packs.
- Get a single tool pack.
- Upsert tool pack configuration.
- Disable tool pack.
- Tool pack fields:
  - Pack ID.
  - Enabled state.
  - Redacted config.
  - Updated timestamp.

## 15. Embeddable Support Widget

- Standalone embeddable support widget.
- Dedicated widget build script.
- Single-script IIFE output.
- Shadow DOM style isolation.
- Host-page-safe CSS injection.
- Script tag configuration:
  - Organization ID.
  - Color.
  - Greeting.
  - Position.
  - Visitor email.
  - Visitor name.
  - HMAC signature.
- Default widget settings:
  - Bottom-right position.
  - Primary color.
  - Greeting message.
- Branded launcher button.
- Unread count badge.
- Dynamic widget config fetch:
  - Organization name.
  - Logo URL.
  - Widget color.
  - Voice enabled.
  - Pre-chat form enabled.
  - Pre-chat form fields.
- Persistent visitor ID in localStorage.
- Chat history persistence in localStorage.
- 24-hour local chat expiry.
- Conversation ID persistence.
- Seen message tracking.
- Launcher view.
- Pre-chat form view.
- Chat view.
- CSAT view.
- Open and close widget behavior.
- Start new conversation flow.
- Force new case support.
- WebSocket chat connection.
- WebSocket reconnect support.
- Polling fallback/update loop.
- Incoming message handling.
- Streaming Lira reply support.
- Typing indicators.
- Customer typing timeout.
- Message deduplication.
- Local unread count updates.
- Conversation resolved state.
- Conversation escalated state.
- Re-notification count support.
- CSAT submission.

## 16. Widget Message Types and Interactions

- Customer text messages.
- Lira text messages.
- Agent/system message support through incoming event handling.
- Rich card rendering.
- Card action buttons.
- Confirmation prompt rendering.
- Approve/cancel style responses.
- Human-in-the-loop prompt support.
- Streaming reply start/end handling.
- Incremental streaming bubble updates.
- Conversation resolution events.
- Conversation reopen events.
- Confidence and grounded-source metadata support.

## 17. Widget Voice Support

- Voice call button support when enabled.
- Start voice call.
- End voice call.
- Voice state tracking:
  - Idle.
  - Connecting.
  - Connected.
  - Speaking/listening state support in voice module.
  - Ended/error state support.
- Call duration timer.
- Browser audio capture plumbing.
- AudioContext playback.
- PCM playback support.
- Voice WebSocket connection.
- Audio cleanup on call end.
- Voice status callbacks into the widget UI.

## 18. Customer Support Portal

- Separate portal app entry point.
- Dedicated portal Vite config.
- Path-based portal router.
- Portal routes:
  - `/:orgSlug` portal home.
  - `/:orgSlug/submit` submit ticket.
  - `/:orgSlug/tickets` my tickets.
  - `/:orgSlug/tickets/:id` ticket detail.
  - `/:orgSlug/chat` live chat.
- Portal config loading by organization slug.
- Branded portal shell.
- Portal theme color applied as CSS variable.
- Portal browser title set to organization support name.
- Loading state.
- Portal unavailable/error state.
- SPA-style link interception.
- Back/forward navigation support.
- Feature gates from portal config:
  - Tickets enabled.
  - Ticket tracking enabled.
  - Chat enabled.
- Customer session persistence.
- Customer logout.
- Magic-link token detection and cleanup.

## 19. Portal Home

- Organization-branded support home.
- Entry points into available support options.
- Conditional display based on portal config.
- Links to ticket submission, ticket tracking, and chat when enabled.

## 20. Portal Ticket Submission

- Submit ticket page.
- Ticket creation through portal API.
- Customer-facing ticket form support.
- Portal config-aware ticket availability.
- Ticket subject/message/customer identity support through portal types/API.

## 21. Portal Ticket Tracking

- My tickets page.
- Auth-gated ticket access.
- Customer session required for ticket tracking.
- Ticket list display.
- Ticket detail page.
- Ticket conversation/detail loading.
- Magic-link/session flow support through `AuthGate`.

## 22. Portal Live Chat

- Portal chat page.
- Config-gated chat availability.
- Customer chat through portal support APIs.
- Organization-branded chat experience.

## 23. Support API Client

- Dedicated `supportFetch` wrapper.
- Authorization token injection.
- JSON body handling.
- Session-expired handling.
- Shared support error parsing.
- API groups implemented:
  - Config.
  - Customers.
  - Inbox/conversations.
  - Stats.
  - Actions.
  - KB drafts.
  - Proactive triggers.
  - Outreach logs.
  - Escalation alerts.
  - Tags.
  - Summaries.
  - Typing indicators.
  - Customer conversations.
  - Customer merge.
  - Proactive messages.
  - Tool packs.

## 24. Support State Management

- Dedicated Zustand support store.
- Support config state.
- Conversation list state.
- Selected conversation state.
- Conversation status filter state.
- Customer list state.
- Selected customer state.
- Customer conversation state.
- Support stats state.
- Weekly report state.
- Action log state.
- KB draft state.
- Proactive trigger state.
- Outreach log state.
- Loading states for each major section.
- Clear support store on organization switch.
- Store methods for all major support API actions.

## 25. Support-Related Integrations

- Slack escalation channel configuration support.
- Linear escalation team configuration support.
- Escalation email configuration support.
- HubSpot contact ID field on customer profiles.
- Salesforce contact ID field on customer profiles.
- Twilio connection support in integrations area for voice/SMS support.
- Google/Slack/Linear/etc. integration infrastructure available for broader workspace automation.

## 26. Customer Support Knowledge and Automation Docs

- Customer support product spec.
- Customer support implementation plan.
- Support system implementation documentation.
- Autonomous support architecture documentation.
- Agentic support roadmap.
- Unified data flywheel documentation.
- Figma flow documentation.
- Tier tracker documentation.

## 27. Build and Deployment Support

- Widget build command.
- Widget deployment command to S3 and CloudFront.
- Portal development command.
- Portal build command.
- Test support widget HTML page.
- Demo site widget mounting.
- Widget-specific Vite config.
- Portal-specific Vite config.

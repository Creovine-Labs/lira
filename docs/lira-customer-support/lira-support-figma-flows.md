# Lira Customer Support — Complete Figma Design Flow

### Every Screen. Every State. Every Transition.

> **Version:** 1.0 — April 2026
> **Purpose:** Figma design reference for the full Customer Support module UX
> **Scope:** Integration architecture, onboarding, all feature flows, data connections, API setup, and customer-facing surfaces

---

## ARCHITECTURE DECISION: How Support Lives Inside Lira

**Recommendation: Embedded module inside the existing Lira dashboard — NOT a separate product.**

Why:

- Lira's dashboard already has 4 product areas in a shared sidebar (Meetings, Interviews, Sales Coaching). Customer Support becomes the 5th section — visually consistent.
- All integrations (HubSpot, Salesforce, Slack, Linear) are already global to the org — support doesn't need its own integration setup if the user already connected them elsewhere.
- The knowledge base (Qdrant) is already org-scoped — support inherits it directly.
- The Nova Sonic voice AI is already running — support doesn't re-instantiate it, it calls into it.
- The unified data flywheel pitch to customers depends on this — "everything Lira learns from calls and interviews also improves your support AI."
- Separate product = separate login, separate brand, separate pricing page = unnecessary complexity at this stage.

**The Support module gets its own top-level sidebar section** with sub-navigation inside. It feels like a distinct product surface inside the same shell, like how Notion has Docs, Databases, and Calendar under one roof.

**Where it sits in the sidebar (left nav):**

```
LIRA
├── Home (overview across all modules)
├── Meetings
├── Interviews
├── Sales Coaching
├── ── ── ── ── ── (divider)
├── Support         ← NEW MODULE — highlighted as "New" with a badge
│   ├── Inbox
│   ├── Customers
│   ├── Proactive
│   ├── Knowledge
│   ├── Actions
│   └── Analytics
├── ── ── ── ── ──
├── Integrations    (global, shared)
└── Settings        (global, shared)
```

---

## SCREEN INVENTORY

Total screens/states: **47**

| #   | Screen                                                  | Flow       |
| --- | ------------------------------------------------------- | ---------- |
| 1   | Global sidebar with Support module nav item             | Navigation |
| 2   | Module Activation screen                                | Onboarding |
| 3   | Onboarding Step 1: Email Channel Setup                  | Onboarding |
| 4   | Onboarding Step 2: Chat Widget Setup                    | Onboarding |
| 5   | Onboarding Step 3: Voice Setup                          | Onboarding |
| 6   | Onboarding Step 4: Connect Integrations                 | Onboarding |
| 7   | Onboarding Step 5: Knowledge Base Seed                  | Onboarding |
| 8   | Onboarding Step 6: API & Webhook Setup                  | Onboarding |
| 9   | Onboarding Step 7: Test & Go Live                       | Onboarding |
| 10  | Support Home / Dashboard                                | Home       |
| 11  | Inbox — Conversation List                               | Inbox      |
| 12  | Inbox — Conversation Detail (AI handled)                | Inbox      |
| 13  | Inbox — Conversation Detail (Action Chain in progress)  | Inbox      |
| 14  | Inbox — Escalation Modal                                | Inbox      |
| 15  | Inbox — Human Override (manual reply)                   | Inbox      |
| 16  | Inbox — CSAT Outcome View                               | Inbox      |
| 17  | Inbox — Voice Call Transcript View                      | Inbox      |
| 18  | Customer List                                           | Customers  |
| 19  | Customer Profile — Overview                             | Customers  |
| 20  | Customer Profile — Interaction Timeline                 | Customers  |
| 21  | Customer Profile — CRM Sync Status                      | Customers  |
| 22  | Proactive Engine — Trigger List                         | Proactive  |
| 23  | Proactive Trigger Wizard — Step 1: Event Type           | Proactive  |
| 24  | Proactive Trigger Wizard — Step 2: Condition Builder    | Proactive  |
| 25  | Proactive Trigger Wizard — Step 3: Outreach Template    | Proactive  |
| 26  | Proactive Trigger Wizard — Step 4: Channel & Timing     | Proactive  |
| 27  | Proactive Trigger Wizard — Step 5: Test                 | Proactive  |
| 28  | Proactive — Outreach Activity Log                       | Proactive  |
| 29  | Knowledge Base — Document Library                       | Knowledge  |
| 30  | Knowledge Base — AI Draft Queue                         | Knowledge  |
| 31  | Knowledge Base — Review Entry (approve / edit / reject) | Knowledge  |
| 32  | Knowledge Base — Manual Entry Editor                    | Knowledge  |
| 33  | Knowledge Base — Gap Report                             | Knowledge  |
| 34  | Action Engine — Action Chain Visualizer                 | Actions    |
| 35  | Action Engine — Approval Queue                          | Actions    |
| 36  | Action Engine — Approve / Reject Modal                  | Actions    |
| 37  | Action Engine — Action History Log                      | Actions    |
| 38  | Action Engine — Integration Health Panel                | Actions    |
| 39  | Analytics — Overview Dashboard                          | Analytics  |
| 40  | Analytics — Proactive Outreach Performance              | Analytics  |
| 41  | Analytics — Self-Improvement Weekly Report              | Analytics  |
| 42  | Analytics — Billing & Outcome Events Log                | Analytics  |
| 43  | Settings — Channels & API Keys                          | Settings   |
| 44  | Settings — Chat Widget Customizer                       | Settings   |
| 45  | Settings — Action Approval Thresholds                   | Settings   |
| 46  | Settings — Team & Agent Management                      | Settings   |
| 47  | Customer-Facing Chat Widget (all states)                | Widget     |

---

---

# FLOW 0 — Navigation & Global Shell

## Screen 1: Global Sidebar with Support Module

**Context:** Existing Lira users upgrading / new users who select Support during onboarding.

**Layout:**

- Left sidebar, 240px wide, dark background (consistent with current Lira design language)
- Lira logo top-left
- Vertical nav icons + labels
- "Support" entry in sidebar with a small "New" badge pill (green or accent color)
- When Support section is expanded: 6 sub-nav items indented below it (Inbox, Customers, Proactive, Knowledge, Actions, Analytics)
- Active state: filled background pill on the active item
- Notification dots: red dot on "Inbox" if there are unread conversations; yellow dot on "Actions" if there are pending approvals
- Bottom of sidebar: user avatar, Help, Settings

**States to design:**

1. Support collapsed (just the parent item visible)
2. Support expanded (sub-items visible)
3. Inbox has unread conversations (notification badge)
4. Actions has pending approvals (approval badge)
5. Support module not yet activated (greyed out, with "Set up" CTA)

---

---

# FLOW 1 — Onboarding: First-Time Module Activation

**Trigger:** User clicks "Support" in sidebar for the first time (module not activated), OR during initial Lira account setup they checked "Customer Support."

**Design pattern:** Full-screen stepper modal, 7 steps, progress bar at top, "Back" and "Continue" at bottom right, "Skip for now" link for optional steps.

---

## Screen 2: Module Activation Screen

**Full-screen modal, centered card.**

**Headline:** "Activate Lira Customer Support"
**Subheadline:** "Set up takes 10 minutes. By the end, Lira will be answering your customer emails."

**Visual:** Simplified diagram showing: Customer email → Lira AI → Reply/Action → CRM (similar to the architecture diagram in the spec)

**Two CTAs:**

- Primary: "Start Setup" (takes user to Step 1)
- Secondary: "Learn more" (opens the product spec summary page or a short explainer video)

**Bottom note:** "Already have integrations connected? Lira will reuse your existing connections."
(Logic: if HubSpot/Salesforce/Slack/Linear are already connected in global Integrations, Step 4 will show them as pre-connected and user just confirms.)

---

## Screen 3: Onboarding Step 1 — Email Channel Setup

**Step indicator:** Step 1 of 7 — "Email Channel"

**Purpose:** Connect the email address that customer emails will come into. Lira monitors this inbox, intercepts inbound emails, and replies from it.

**Elements:**

- Section label: "Inbound email address"
- Input: text field — "support@yourcompany.com"
- Helper text: "This is the address your customers already email for support. Lira will monitor it and reply on your behalf."
- Sub-section: "Verify ownership"
  - Button: "Send verification email" → user receives email → clicks link → status updates to ✓ Verified
  - Status indicator: [ ] Not verified → [✓] Verified (green)
- Section: "Sender name" — text input, prepopulated with org name — "How Lira will sign off: [Lira | CompanyName Support]"
- Section: "Reply-from address" — radio options:
  - `reply@lira-mail.yourcompany.com` (default, custom subdomain Lira provisions)
  - `support@yourcompany.com` (requires DNS CNAME record)
  - If second option selected: show DNS record in a code block with a "Copy" button and instructions
- Toggle: "CC your team on every reply" — if on, show email input for CC address
- Toggle: "BCC for compliance logging" — if on, show email input

**Transition:** "Continue" → Step 2 (Chat Widget). "Skip" marks email as unconfigured but lets user continue.

---

## Screen 4: Onboarding Step 2 — Chat Widget Setup

**Step indicator:** Step 2 of 7 — "Chat Widget"

**Purpose:** Embed Lira's chat widget on the client's website/app so customers can chat in real-time.

**Layout split: Left (config) / Right (live preview)**

**Left — Config panel:**

- Toggle: "Enable Chat Widget" (on by default)
- Sub-section: "Widget appearance"
  - Color picker: accent color (hex input + swatch picker)
  - Upload launcher icon (optional, default = Lira logo)
  - Launcher position: radio buttons — Bottom Right / Bottom Left
  - Greeting message: textarea — "Hi! I'm Lira, your support assistant. How can I help?"
  - Widget title: text input — "CompanyName Support"
- Sub-section: "Availability"
  - Toggle: "Always on (24/7)" — default
  - If off: time picker grid (by day / hour, similar to Calendly availability)
  - Timezone selector

**Right — Live Preview:**

- Shows a mock browser window with the chat widget in the selected position
- Widget launcher button (closed state)
- On click → widget opens to show the greeting message
- Updates live as config changes on the left

**Bottom of screen:**

- Embed code section: "Add this to your website's `<head>` tag"
  - Code block with copy button
  - Button: "Email this to my developer"

---

## Screen 5: Onboarding Step 3 — Voice Setup

**Step indicator:** Step 3 of 7 — "Voice Support"

**Purpose:** Enable Lira to handle voice calls from customers. This uses Nova Sonic.

**Elements:**

- Toggle: "Enable Voice Support" (off by default — optional)
- [If enabled:]
  - Section: "Phone number"
    - Radio: "Provision a new number" (Lira provisions a Twilio number)
    - Radio: "Forward your existing support number to Lira" → shows forwarding instructions
  - Section: "Voice personality"
    - Dropdown: Voice selection (e.g., "Aria – Professional," "Maya – Friendly") — same voices already in Lira's voice settings
    - Speed control: slider (0.8x – 1.2x)
    - Sample button: "Hear a sample" → plays 5-second clip
  - Section: "Escalation behavior"
    - When Lira can't resolve on voice: radio options
      - "Transfer to a human agent" → show input for transfer number
      - "Offer callback" → customer stays on line, agent calls back
      - "Send follow-up email" → Lira closes call and emails the customer
- Note: "Voice calls are transcribed and linked to the customer's profile automatically."

---

## Screen 6: Onboarding Step 4 — Connect Integrations

**Step indicator:** Step 4 of 7 — "Integrations"

**Purpose:** Connect CRM, project management, and communication tools Lira will act on.

**Layout:** Integration cards in a 2-column grid

**Each integration card:**

- Logo + name + one-line description of how Lira uses it
- Status badge: "Not connected" (grey) / "Connected ✓" (green) / "Already connected ✓" (green, if connected globally)
- CTA button: "Connect" → OAuth flow in a pop-up window → returns to this step as "Connected ✓"

**Integrations shown:**

| Integration     | How Lira uses it                                   | Required?   |
| --------------- | -------------------------------------------------- | ----------- |
| HubSpot         | Sync customer profiles, update contact records     | Recommended |
| Salesforce      | Sync customer profiles, update contact records     | Recommended |
| Linear          | Create and assign support tickets                  | Recommended |
| Slack           | Notify teams on escalation, compliance holds       | Recommended |
| Microsoft Teams | Alternative to Slack for team notifications        | Optional    |
| GitHub          | Create issues for product bugs surfaced in support | Optional    |

- Note at top: "Lira will only take actions on these tools when a customer conversation warrants it. You control action permissions in the Action Engine settings."
- "Already connected" integrations are shown first, pre-checked, greyed out with a note: "From your [Meetings] setup. No action needed."

---

## Screen 7: Onboarding Step 5 — Knowledge Base Seed

**Step indicator:** Step 5 of 7 — "Knowledge Base"

**Purpose:** Feed Lira the knowledge she needs to answer customer questions accurately.

**Elements:**

**Tab 1 — Website Crawl (default active)**

- Input: "Website URL" — text field, e.g. `https://yourcompany.com`
- Checkbox list of pages to crawl: automatically suggested from sitemap (e.g., /pricing, /docs, /faq, /help, /about)
- User can check/uncheck which pages to include
- Button: "Start Crawl" → shows progress bar with page-by-page status
- Crawl complete state: "48 pages indexed. 1,240 knowledge chunks ready." with a green checkmark

**Tab 2 — File Upload**

- Drag-and-drop zone: "Drop PDF, DOCX, TXT, or CSV files here"
- Accepted formats listed below
- Uploaded files appear as a list with name, size, status (Processing / Ready)
- Max file size: 50MB per file
- "Upload from Google Drive" link → opens Google Drive picker (integrates with existing Google integration)

**Tab 3 — Manual Entry**

- Simple rich text editor: Title + body
- Lira will use this to answer questions like: "What is your refund policy?" (user types the policy here)
- Save button creates entry instantly

**Bottom:** "You can add more later in the Knowledge Base section. Lira only answers questions she can find in here — she won't make things up."

---

## Screen 8: Onboarding Step 6 — API & Webhook Setup

**Step indicator:** Step 6 of 7 — "API & Webhooks"

**Purpose:** Two things happen here: (1) User gets Lira's API key to connect their product to Lira. (2) User configures webhooks so Lira can receive product events for the Proactive Engine.

**Section A — Lira API Key**

- Headline: "Your API Key"
- Description: "Use this to send customer data to Lira, create customer profiles, and trigger actions programmatically."
- Large read-only input with masked key: `lira_live_xxxx•••••••••••••••`
- Buttons: "Reveal" | "Copy" | "Regenerate" (regenerate has a warning confirmation)
- Link: "View API Documentation →" (opens in new tab)
- Code snippet tab switcher: cURL / Node.js / Python — shows how to call the API to create a CustomerProfile
  ```
  POST https://api.creovine.com/support/customers
  Authorization: Bearer lira_live_xxxx
  {
    "customerId": "cust_abc123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "crmId": "hs_contact_456"
  }
  ```
- Toggle: "Sandbox mode" — lets user test without triggering real actions

**Section B — Inbound Webhook URL**

- Headline: "Proactive Support Webhook"
- Description: "Send product events to this URL. When a payment fails, a KYC check stalls, or any event you define fires — Lira will reach out to the affected customer."
- Read-only input: `https://api.creovine.com/support/webhook/org_xxxx`
- Button: "Copy URL"
- "Expected payload" — expandable code block showing the JSON format:
  ```json
  {
    "event": "payment.failed",
    "customerId": "cust_abc123",
    "timestamp": "2026-04-06T14:32:00Z",
    "data": {
      "amount": 2000,
      "currency": "USD",
      "failureCode": "insufficient_funds"
    }
  }
  ```
- Button: "Send test event" → fires a test payload → shows success/fail response inline
- Note: "Your engineering team sets this up once. After that, Lira handles everything automatically."

---

## Screen 9: Onboarding Step 7 — Test & Go Live

**Step indicator:** Step 7 of 7 — "Test & Go Live"

**Purpose:** Validate the whole setup is working before activating.

**Layout:** Checklist of setup items, each with a test result

| Item                      | Status                              |
| ------------------------- | ----------------------------------- |
| ✓ Email channel connected | support@yourcompany.com verified    |
| ✓ Chat widget configured  | Embed code generated                |
| — Voice support           | Skipped                             |
| ✓ HubSpot connected       | 1,204 contacts synced               |
| ✓ Linear connected        | Workspace: YourCompany              |
| ✓ Slack connected         | #support-escalations                |
| ✓ Knowledge base seeded   | 48 pages, 3 documents, 1,240 chunks |
| ✓ API key generated       | Ready                               |
| ✓ Webhook URL ready       | Test event received successfully    |

**Send a test email section:**

- Instruction: "Send a test email to support@yourcompany.com. Lira will respond within 30 seconds."
- Live preview panel: shows incoming email → Lira's AI-generated reply → action chain log — all in real-time as the test runs
- Status: "Waiting for test email…" → "Email received" → "Lira is composing reply…" → "Reply sent!" → tick animation

**Bottom CTA:**

- Large primary button: "Activate Customer Support" — turns the module live
- Secondary: "Save and finish later"

**Post-activation state:**

- Confetti animation (subtle)
- Green banner: "Lira Customer Support is live. Emails are being monitored."
- Auto-redirect to Support Home (Screen 10)

---

---

# FLOW 2 — Support Home Dashboard

## Screen 10: Support Home

**Purpose:** The landing page when user clicks "Support" in the sidebar once it's activated. A real-time command center view of the entire support operation.

**Layout:** Top stats bar + three-column grid below

**Top stats bar (4 cards, full width):**

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Open Inbox     │  │  Resolved Today │  │  Proactive      │  │  Escalated      │
│  12             │  │  47             │  │  Sent Today     │  │  Awaiting Agent │
│  3 urgent       │  │  ↑ 12% vs. avg  │  │  8              │  │  2              │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

- Each card is clickable, navigates to the relevant sub-section
- Trend arrows (up/down with % vs. 7-day average)

**Left column — Recent Activity Feed:**

- Live-updating list of recent events:
  - "Lira resolved email from jana@finco.com — Payment question ✓"
  - "Proactive outreach sent to 3 customers — payment.failed event"
  - "Escalated: Daniel Roy — Compliance hold, assigned to @Sarah"
  - "Knowledge base updated — 1 new entry auto-approved"
- Each entry has a timestamp (relative: "2 min ago") and a "View →" link
- "View all activity →" at the bottom

**Center column — Inbox Preview (top 5 conversations):**

- Compact conversation cards showing: customer name, subject, channel icon (email/chat/voice), time, Lira's status (Resolved / Pending / Escalated)
- "Open Inbox →" button at bottom

**Right column — Quick Actions + Alerts:**

- Alerts section:
  - Yellow cards for items needing human attention: "2 escalations waiting" / "3 knowledge drafts awaiting approval"
  - Each alert has "Review →" link
- Quick Actions section (icon buttons):
  - "New Trigger" → opens proactive trigger wizard
  - "Add Knowledge" → opens knowledge base manual entry editor
  - "View Analytics" → navigates to analytics
  - "Test Lira" → opens a sandbox chat window to test Lira's responses

**Resolution rate gauge (bottom of right column):**

- Donut chart: green = autonomous, yellow = escalated
- Example: 74% resolved autonomously | 26% escalated
- "This week's target: 70% ✓"

---

---

# FLOW 3 — Inbox & Conversations

## Screen 11: Inbox — Conversation List

**Purpose:** Master list of all customer conversations across all channels.

**Layout:** Left filter panel + main list + right preview pane (3-column)

**Left filter panel:**

- Search: "Search by customer name, email, topic…"
- Filter groups:
  - **Status:** All | Open | Resolved | Escalated | Pending CSAT
  - **Channel:** All | Email | Chat | Voice
  - **Direction:** All | Inbound | Proactive outreach
  - **Assignee:** Lira (AI) | [Agent names] | Unassigned
  - **Date range:** Today | This week | This month | Custom
  - **Tag:** Billing | KYC | Technical | Fraud | General
- Sort: Newest | Oldest | Urgent first | Unresolved first
- Saved filter sets (user can save a combination as "My Filters")

**Main conversation list (center):**

- Each conversation row:
  - Left: Channel icon (email envelope / chat bubble / phone)
  - Customer name + email (truncated)
  - Subject / topic (auto-classified by Lira: "Payment retry question")
  - Status badge: Open (blue) | Resolved ✓ (green) | Escalated (orange) | Awaiting (grey)
  - Time: relative timestamp ("3 min ago")
  - Right: "Lira handled" tag or agent name if escalated
- Unread conversations have a bold name and colored left border
- Bulk selection: checkboxes on hover → bulk actions toolbar appears at top: "Mark resolved," "Assign to," "Export"

**Right preview pane:**

- Opens automatically when a conversation is clicked (without navigating away)
- Shows last 2-3 messages + Lira's planned reply
- "Open full conversation →" link

---

## Screen 12: Inbox — Conversation Detail (AI Handled)

**Purpose:** Full view of a single conversation Lira resolved autonomously.

**Layout:** Header bar + main thread + right sidebar

**Header bar:**

- Back arrow → returns to list
- Customer name + channel icon
- Status badge (Resolved)
- Actions: "Reopen" | "Export" | "View Customer Profile →"

**Main thread (center, scrollable):**

- Message bubbles: customer messages on the left, Lira's replies on the right
- Customer message: name, avatar (initials), timestamp, body text
- Lira's reply: "Lira" label with the Lira AI icon, timestamp, reply body
- Below each Lira reply: small "AI-generated | Grounded in: [KB entry name]" attribution chip — shows which knowledge base entry or CRM data point backed the reply
- Bottom: "This conversation is resolved. CSAT: 4/5 ✓"

**Right sidebar — Interaction Summary:**

- **Customer:** Name, email, tier (Standard/VIP), churn risk score (e.g., "Low — 12"), link to full profile
- **Resolved in:** "22 seconds"
- **Channel:** Email
- **Lira's actions taken:** Collapsible list — e.g., "Queried HubSpot contact record," "Grounded reply in [Knowledge Base: Refund Policy]"
- **Knowledge used:** List of KB entries cited
- **CSAT:** Star display (1-5)
- **Tags added (by Lira):** "Billing", "Resolved autonomously"

---

## Screen 13: Inbox — Conversation Detail (Action Chain in Progress)

**Purpose:** View of a live conversation where Lira is executing a multi-step action chain.

**Same layout as Screen 12 but with a live action chain panel.**

**Addition — Action Chain Panel (in the main thread area, below the conversation thread, or as a collapsible card):**

- Headline: "Lira is working on this…"
- Visual step-by-step chain (horizontal stepper or vertical list):

```
[✓] Query HubSpot — Found contact: Daniel Roy, $2,400 pending transfer
[✓] Check transaction status via API — Status: Compliance hold (code CH-4401)
[⟳] Create Linear ticket — "Compliance hold: Daniel Roy — TXN #48291" [IN PROGRESS]
[ ] Notify Slack #compliance-team — Waiting...
[ ] Reply to customer — Waiting...
[ ] Schedule follow-up for 2 hours — Waiting...
```

- Each step:
  - Completed (✓ green): shows step name + brief result
  - In progress (spinner): shows step name + "in progress…"
  - Pending (empty circle, grey): shows step name, dimmed
  - Failed (✗ red): shows step name + error + CTA "Retry" or "Skip and continue"
- Total time elapsed: "Running for 8 seconds…"
- Estimated completion: "~15 seconds"

**If any step requires human approval** (e.g., initiating a refund):

- That step shows: "[ ! ] Awaiting your approval — Lira wants to initiate a $2,400 refund"
- Inline approval buttons: "Approve" | "Reject" | "Modify"
- Timer: "Auto-cancels in 10 minutes if no action"

---

## Screen 14: Inbox — Escalation Modal

**Purpose:** Appears when Lira determines a conversation needs a human, OR when the user manually escalates.

**Trigger:** Lira's confidence score < threshold, OR user clicks "Escalate" button in the conversation detail.

**Modal design (centered overlay, ~540px wide):**

- Header: "Escalate Conversation"
- Summary card: Shows customer name, conversation topic, and a 2-sentence AI-generated summary of the issue
- **Assign to:**
  - User/agent dropdown (shows agents from the Settings → Team management list)
  - Or: "Notify via Slack" toggle + channel picker (#support-escalations)
  - Or: "Notify via Teams" toggle + channel picker
- **Priority:** Low | Medium | High | Urgent (radio)
- **Add a note for the agent:** Textarea — pre-filled by Lira: "Customer has been waiting 2 days for a $2,000 transfer. Transaction is on a compliance hold (CH-4401). Linear ticket created: #4832. CRM record updated."
- **Notify customer checkbox:** "Send customer a message: 'A specialist has been assigned to your case and will follow up within [X hours]'" — editable ETA
- Buttons: "Escalate →" (primary) | "Cancel"

**Post-escalation state in conversation thread:**

- New status banner in thread: "Escalated to Sarah K. | Priority: High | Ticket #4832"
- Conversation status badge changes to "Escalated" (orange)

---

## Screen 15: Inbox — Human Override (Manual Reply)

**Purpose:** Human agent can intervene and send a manual reply at any point.

**Bottom of conversation thread — Reply Composer:**

- Toggle at top of composer: "Lira is drafting | You are drafting" — clicking switches to manual mode
- **Lira drafting mode (default):**
  - Shows Lira's pending reply in grey draft text
  - Buttons: "Send Lira's reply" | "Edit before sending" | "Discard and write manually"
  - Chip: "Grounded in: [KB entry]" showing what Lira used
- **Manual mode:**
  - Full rich-text editor (bold, italic, bullet, link)
  - No AI suggestion visible
  - Toolbar: text formatting + attach file + insert template
  - Button: "Send as [Agent Name]"
  - Note: "This reply will be sent as you. Lira will continue monitoring but won't auto-reply unless you re-enable AI mode."
  - Re-enable AI: "Hand back to Lira →"

---

## Screen 16: Inbox — CSAT Outcome View

**Purpose:** Shows the post-resolution CSAT feedback from the customer.

**In the conversation thread, at the bottom:**

- Card: "Customer satisfaction collected"
- Display: Star rating (1-5) shown as filled stars, e.g., ★★★★☆
- Comment bubble if customer left a comment: "It was a bit slow but eventually resolved — thanks!"
- Timestamp: "CSAT submitted: April 6, 2026, 3:22 PM"
- Badge: "Billable resolution" if outcome = positive CSAT (outcome-based pricing)
- If rating ≤ 2: "Not billed — escalated outcome" badge + note "This interaction is flagged for self-improvement analysis."

---

## Screen 17: Inbox — Voice Call Transcript View

**Purpose:** View a voice call handled by Lira's Nova Sonic voice AI.

**Layout:** Same as Screen 12 but conversation thread shows transcript format.\*\*

**Top of thread:**

- Audio player: "Call recording — 3m 42s"
  - Play/pause/scrub bar
  - "Download" link
  - Note: "Recording stored per your data retention settings"

**Transcript:**

- Speaker-labeled blocks:
  - "Customer (Jane Smith):" — text, with timestamp at right (0:04)
  - "Lira:" — text, with timestamp at right (0:06)
  - Color-coded bubbles, same as chat
- Search in transcript: input at top of thread — highlights matching text
- Sentiment markers: small emoji-like indicators in the margin showing detected emotion (neutral / frustrated / relieved)

**Right sidebar:**

- Same as Screen 12 + "Call duration: 3m 42s" + "Resolved: Yes — no transfer needed"

---

---

# FLOW 4 — Customer Profiles (Lifetime Memory)

## Screen 18: Customer List

**Purpose:** Browse all customers Lira has interacted with.

**Layout:** Left filter panel + table view

**Table columns:**

- Name
- Email
- Tier badge: Standard | VIP | Enterprise
- Churn Risk: color-coded score (0-100) — green <30, yellow 30-70, red >70
- Total Interactions: number
- Escalations: number
- Sentiment trend: arrow icon (improving ↑, stable →, declining ↓)
- Last Contact: relative time
- CRM Sync: HubSpot / Salesforce icon (green = synced, yellow = out of sync)
- Action: "View Profile →"

**Left filters:**

- Search by name or email
- Filter by Tier
- Filter by Churn Risk (Low / Medium / High)
- Filter by Sentiment trend
- Filter by CRM (HubSpot | Salesforce | Not synced)
- Sort: Last contact | Churn risk | Escalation count | Interaction count

**Bulk actions:** Select multiple → "Export CSV," "Flag for review," "Merge duplicates"

---

## Screen 19: Customer Profile — Overview

**Purpose:** The full 360° view of a single customer.

**Header:**

- Customer name (large) + email + phone (if available)
- Tier badge + Churn Risk score
- CRM sync status: "Synced with HubSpot ✓ — Contact ID: [xyz]" with "Open in HubSpot →" link
- Sentiment trend: "Improving ↑ over last 30 days"
- Quick action buttons: "View full history" | "Send proactive message" | "Create ticket" | "Flag as VIP"

**4 Stats cards (row):**

- Total interactions: 14
- Autonomous resolutions: 11 (79%)
- Escalations: 3
- Average CSAT: 4.1/5.0

**Summary section:**

- AI-generated customer summary paragraph: "Jane has been a customer since January 2025. She has primarily contacted support about transaction status and payment delays. Her last 2 interactions were smoothly resolved by Lira. Her churn risk score is low."

**Open tickets section:**

- List of currently open/pending conversations with "View →" links

**Proactive outreach history:**

- List of proactive messages sent to this customer with event type and outcome (replied / no reply / ticket prevented)

**Bottom:** "View full interaction timeline →" → opens Screen 20

---

## Screen 20: Customer Profile — Interaction Timeline

**Purpose:** Chronological view of every interaction Lira has had with this customer.

**Layout:** Vertical timeline, newest at top

**Each timeline entry:**

- Date + time
- Channel icon (email / chat / voice)
- Direction: Inbound / Outbound / Proactive
- Brief AI-generated summary: "Customer asked about delayed transfer. Lira queried HubSpot, created Linear ticket #4401, notified #compliance-slack. Resolved in 38 seconds."
- Resolution status: Autonomous ✓ | Escalated | Pending
- CSAT: ★★★★☆ or "Not collected"
- "Expand for full transcript" — expandable section revealing the full message thread
- Actions taken: collapsible chips showing "HubSpot updated," "Linear #4401 created," "Slack notified"

**Filters on timeline:**

- Channel toggle pills (All | Email | Chat | Voice)
- Direction toggle (All | Inbound | Proactive)
- Date range picker

---

## Screen 21: Customer Profile — CRM Sync Status

**Purpose:** Show the live CRM data that Lira has pulled or pushed for this customer.

**Side-by-side panel:**

**Left — Lira's Customer Profile fields:**

- Name, email, phone, tier, churn risk, interaction count, etc.

**Right — CRM Record (HubSpot or Salesforce):**

- Live pull from CRM API: shows the matching fields in the CRM contact/account record
- Sync status per field: ✓ Synced | ⚠ Mismatch | — Not mapped

**Sync actions:**

- "Sync now" button — forces a bi-directional sync
- "Field mapping →" button — opens integration settings for field mappings
- Last synced timestamp

**Mismatch resolution panel** (if mismatches exist):

- Table: Field | Lira value | CRM value | Action (keep Lira's / keep CRM's / keep both in notes)

---

---

# FLOW 5 — Proactive Support Engine

## Screen 22: Proactive Trigger List

**Purpose:** Overview of all configured proactive triggers.

**Layout:** Header + trigger cards grid (or table toggle)

**Header:**

- "Proactive Triggers" title
- Stats bar: "8 active triggers | 47 outreaches this week | 38% ticket prevention rate"
- Button: "New Trigger +" (primary)

**Each trigger card:**

- Trigger name: e.g., "Payment Failed — Retry Prompt"
- Event type: `payment.failed`
- Channel: Email or Voice icon
- Status toggle: Active / Paused (large toggle)
- Stats chip: "Fired 12x this week | 5 tickets prevented"
- Actions: Edit | Duplicate | Delete | View activity log

**Empty state:** Illustration + "No triggers yet" + "Create your first trigger →"

**Pre-built templates section (for new users):**

- "Start from a template" — cards for common fintech triggers:
  - Payment Failed – Retry Prompt
  - KYC Blocked – Document Request
  - Suspicious Transaction – Authorization Check
  - Subscription Expiring – Renewal Reminder
  - API Error Threshold Exceeded – Engineering Alert
  - Onboarding Stalled – Activation Nudge

---

## Screen 23: Proactive Trigger Wizard — Step 1: Event Type

**Full-screen wizard modal, 5 steps, progress bar at top.**

**Step 1: "What event triggers this outreach?"**

**Two modes:**

- **Predefined events** (tab default): Grid of common event types with labels and icons:
  - `payment.failed` — "A payment fails"
  - `kyc.blocked` — "KYC verification stalls"
  - `fraud.flagged` — "A transaction is flagged"
  - `subscription.expiring` — "Subscription expires in X days"
  - `api.error.spike` — "API error count exceeds threshold"
  - `account.inactive` — "Account inactive for X days"
  - - "Create custom event type" option

- **Custom event** (tab):
  - Input: "Event name (as it will appear in your webhook payload)" — e.g., `order.shipped`
  - Description: "What does this event mean?" — free text
  - Sample payload: JSON editor — "Paste a sample JSON payload from your system"
  - Lira auto-detects available fields from the payload (e.g., `data.customerId`, `data.orderId`) for use in conditions and templates

**Trigger name input at bottom:** "Name this trigger" — e.g., "Payment Failed – Fintech Retry"

---

## Screen 24: Proactive Trigger Wizard — Step 2: Condition Builder

**Step 2: "When exactly should this fire?"**

**Purpose:** Avoid sending proactive messages to every event — apply conditions to filter.

**Visual condition builder (similar to Zapier/HubSpot filter UI):**

```
Fire this trigger when:

  [ event.type ] [ equals ] [ payment.failed ]    AND

  [ data.amount ] [ greater than ] [ 500 ]         AND

  [ customer.tier ] [ is not ] [ enterprise ]
```

- Each row: field selector dropdown | operator dropdown | value input
- "Add condition" (AND) button
- "Add OR group" button (for OR logic)
- "Clear all" link

**Field selector:** Populated from the sample payload provided in Step 1 + Lira's standard fields (customer.tier, customer.churnRiskScore, customer.totalInteractions, etc.)

**Operator options:** equals | does not equal | contains | greater than | less than | is null | is not null

**Right panel — Condition preview:**

- Plain English summary: "This trigger will fire when a payment fails AND the amount is over $500 AND the customer is not on the Enterprise tier."
- "Estimated frequency: ~8-12 times per week based on your recent data" (if historical data is available)

---

## Screen 25: Proactive Trigger Wizard — Step 3: Outreach Template

**Step 3: "What will Lira say?"**

**Template editor (left) + preview (right):**

**Left — Template editor:**

- Editable subject line (for email): "Action needed: Your payment didn't go through"
- Rich text body with handlebars variable insertion:
  - Toolbar includes: Bold | Italic | Link | Insert Variable
  - "Insert Variable" opens a dropdown of available variables: `{{customer.name}}`, `{{data.amount}}`, `{{data.currency}}`, `{{data.failureCode}}`
  - Example default template:

    ```
    Hi {{customer.name}},

    We noticed your recent payment of {{data.amount}} {{data.currency}} didn't go through.
    This can usually be resolved quickly — here's what to do:

    [Retry payment link]

    If you need help, just reply to this email and I'll sort it out immediately.

    – Lira, your support assistant at {{org.name}}
    ```

- Toggle: "Let Lira personalize this template" — if on, Lira uses the template as a base but rewrites it using the customer's history and tone for each individual send
- Fallback behavior: "If a variable is missing, use: \_\_\_"

**Right — Preview:**

- Rendered email preview (mobile frame or desktop frame toggle)
- "Send preview to myself" button → sends a sample email to the logged-in admin

---

## Screen 26: Proactive Trigger Wizard — Step 4: Channel & Timing

**Step 4: "How and when should Lira reach out?"**

**Channel selection:**

- Radio: "Email" | "Voice call" | "Both (email first, then voice if no reply in X hours)"
- If email: confirm email sender (from Step 3 or Onboarding Step 1)
- If voice: confirm voice persona (from Onboarding Step 5) + call script
- If both: define "try email, if no reply in [X] hours, escalate to voice call"

**Timing:**

- Radio:
  - "Immediately when the event fires" (default)
  - "Wait [X] minutes after the event fires" — avoids firing for events that auto-resolve in seconds
  - "Only during business hours" — toggle → time range & timezone picker
- Deduplication: "Don't re-fire this trigger for the same customer within [X] [hours/days]"
- Max frequency: "Never send more than [X] proactive messages to the same customer per [week/month]"

**If Lira response needed:**

- Toggle: "After sending, monitor for reply and continue the conversation" (default on)
- If on: Lira will respond to any reply, track it in the Inbox, and create a CustomerProfile interaction record

---

## Screen 27: Proactive Trigger Wizard — Step 5: Test

**Step 5: "Test before activating."**

**Testing panel:**

- "Simulate a test event" — JSON editor pre-populated with sample payload
- Button: "Fire test trigger →"
- Live output panel:
  - Event received: ✓
  - Conditions evaluated: ✓ (shows each condition result: pass/fail)
  - Template rendered: ✓ (shows the actual email that would be sent, with variables filled)
  - Customer matched: "✓ Jane Smith <jane@finco.com>" (if a real customer matches the test payload)
  - Outreach: "NOT sent — this is a test" (safety note)
- Status: "Test passed. Ready to activate."

**Bottom:**

- "Save as Draft" | "Activate Trigger" (primary)
- If activated: returns to Trigger List (Screen 22) with the new trigger showing as "Active"

---

## Screen 28: Proactive — Outreach Activity Log

**Purpose:** Full log of every proactive message sent.

**Table view:**

- Columns: Timestamp | Customer | Event Type | Channel | Template Used | Delivery Status | Customer Reply? | Outcome
- Delivery Status: Sent ✓ | Failed ✗ | Pending
- Customer Reply: Replied (link to conversation) | No reply yet | No reply (closed)
- Outcome: Ticket prevented | Conversation opened | No engagement

**Filters:** Trigger name | Date range | Outcome | Channel

**Click a row:** Opens a side panel showing the full message sent + customer reply (if any) + Lira's follow-up actions

---

---

# FLOW 6 — Knowledge Base (Self-Improving)

## Screen 29: Knowledge Base — Document Library

**Purpose:** View and manage all knowledge sources Lira uses to ground her replies.

**Layout:** Left source filter + document grid

**Left filter:**

- Source type: All | Website pages | Uploaded files | Manual entries | AI-drafted (approved)
- Status: All | Active | Archived
- Tag: Billing | Compliance | Technical | Onboarding | Product | Other
- Search: "Search in knowledge base..."

**Document grid / list (toggle):**

- Each document card:
  - Title
  - Source type icon (globe / file / pencil / Lira star)
  - Date added / last updated
  - Chunk count (e.g., "24 knowledge chunks")
  - Status: Active (green) | Archived (grey)
  - Tags
  - Actions: View | Edit | Re-index | Archive | Delete

**Top bar actions:**

- "Add Knowledge +" dropdown: "Crawl webpage" | "Upload file" | "Write manually" | "Import from Google Drive"
- "Re-index all" button (re-runs the Qdrant vector indexing on all content)
- Stats: "1,847 total chunks | Last indexed: 2 hours ago"

---

## Screen 30: Knowledge Base — AI Draft Queue

**Purpose:** Lira automatically drafts new knowledge entries after analyzing escalated conversations. This screen is where admins review them.

**Header:**

- "AI-Drafted Knowledge Entries — Awaiting Your Review"
- Count badge: "7 pending"
- Explanation: "After Lira couldn't answer a question, she drafted these entries. Review takes about 30 seconds per entry."

**Draft entry cards:**

Each card:

- Title: e.g., "What to do when API error code 4023 occurs"
- Draft body: the drafted knowledge entry text (first 3-4 lines shown, "Read more" expand)
- Reason drafted: "Escalated 3 times in the last 7 days — customers ask about this but it's not in your docs"
- Source conversations: "[3 conversations] →" link showing the conversations that triggered this gap
- Suggested tags: auto-applied (editable)
- Confidence: "Lira is 91% confident this answer is correct based on your existing docs + escalation patterns"
- Actions (3 buttons, prominent):
  - "Approve & Publish" (green primary)
  - "Edit then Publish" (secondary) → opens inline editor
  - "Reject" (destructive, grey)

**Batch actions:** "Approve all with 90%+ confidence" button (saves time for high-confidence drafts)

---

## Screen 31: Knowledge Base — Review Entry (Edit flow)

**Triggered by "Edit then Publish" on Screen 30.**

**Full-page editor:**

- Title input (editable)
- Body: rich text editor with the AI draft pre-filled
- Tags: multi-select tag input
- Source conversations: read-only chips showing which chats informed this entry (for reference)
- AI confidence note: "Lira used these 3 existing documents as context: [links]"
- Preview pane: "How Lira will use this" — shows a simulated chat where the customer asks the trigger question and Lira answers using this entry
- Bottom actions: "Publish" | "Save draft" | "Discard"

---

## Screen 32: Knowledge Base — Manual Entry Editor

**Purpose:** Human writes a knowledge entry from scratch.\*\*

**Same layout as Screen 31 but:**

- No AI draft pre-filled
- No source conversations
- Extra section: "Who is this for?" — optional — can be tagged to specific customer tiers or product areas

---

## Screen 33: Knowledge Base — Gap Report

**Purpose:** Shows a report of the most common topics Lira couldn't answer this week.\*\*

**Layout:** Metrics cards + ranked list

**Top metrics:**

- "Coverage rate: 84% of questions answered" → "16% of questions had no matching knowledge"
- "Top unresolved topic this week: API error codes (asked 11 times)"
- "New gaps identified: 7" (same 7 as the draft queue)

**Ranked list — Top Knowledge Gaps:**
| Rank | Topic | Times Asked | Knowledge Entry Status |
|---|---|---|---|
| 1 | API error code 4023 | 11 | Draft pending review |
| 2 | International wire transfer limits | 7 | No draft yet → "Ask Lira to draft" button |
| 3 | KYC document requirements for non-residents | 5 | Draft pending review |

- "Ask Lira to draft" button: triggers Lira to immediately generate a draft entry for that gap
- Click a topic: opens a panel showing the actual customer conversations that asked about it

---

---

# FLOW 7 — Autonomous Action Engine

## Screen 34: Action Engine — Action Chain Visualizer

**Purpose:** View and understand every multi-step action chain Lira has executed.\*\*

**Layout:** Conversation/event selector on left + chain visualizer on right

**Left — Recent action chains list:**

- Each entry: Customer name | Event/trigger | Date | Final outcome
- Click to load that action chain in the visualizer

**Right — Chain Visualizer:**

- Vertical step-by-step display (similar to a flowchart rendered top to bottom):

```
┌─────────────────────────────────────┐
│  TRIGGER                            │
│  customer.email — "Transfer stuck"  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  ✓ INTENT CLASSIFIED                │
│  "Action request — transaction      │
│  status + escalation required"      │
│  Confidence: 94%                    │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌────────────────┐  ┌──────────────────────┐
│ ✓ QUERY CRM    │  │ ✓ CHECK TX STATUS    │
│ HubSpot        │  │ Internal API         │
│ Found: Daniel  │  │ Status: CH-4401      │
│ Roy, $2,400 tx │  │ Compliance hold      │
└───────┬────────┘  └──────────┬───────────┘
        └──────────┬───────────┘
                   ▼
        ┌───────────────────────┐
        │  ✓ CREATE TICKET      │
        │  Linear #4832         │
        │  Tagged: compliance   │
        └────────────┬──────────┘
                     ▼
        ┌───────────────────────┐
        │  ✓ NOTIFY SLACK       │
        │  #compliance-team     │
        │  Message sent ✓       │
        └────────────┬──────────┘
                     ▼
        ┌───────────────────────┐
        │  ✓ REPLY TO CUSTOMER  │
        │  "Flagged urgent to   │
        │  compliance. Ref:     │
        │  #4832. 2hr ETA."     │
        └────────────┬──────────┘
                     ▼
        ┌───────────────────────┐
        │  ⏰ FOLLOW-UP         │
        │  SCHEDULED            │
        │  In 2 hours           │
        └───────────────────────┘
```

- Completed steps: green background, ✓ icon
- Each step is clickable: opens a detail panel showing full input/output payload (for debugging)
- Total duration: "Completed in 42 seconds"
- Outcome: "Autonomous ✓ — No human intervention"

---

## Screen 35: Action Engine — Approval Queue

**Purpose:** List of high-stakes actions Lira has paused, waiting for human approval.\*\*

**Urgency:** This screen has a red badge in the sidebar when approvals are pending.

**List of pending approvals:**

Each item card:

- Customer name + issue summary
- Action Lira wants to take: "Initiate $2,400 refund via HubSpot"
- Risk level badge: Low | Medium | High | Critical
- Context: "Customer Jane Smith has been waiting 6 days. Refund eligibility confirmed. CRM record shows VIP tier."
- Time waiting: "Pending for 14 minutes"
- Auto-cancel timer: "Will auto-cancel in 46 minutes if not reviewed"
- Actions: "Approve" (green) | "Reject" (red) | "Modify" (blue) | "View full conversation"

**Batch approve:** "Approve all Low-risk actions" button

---

## Screen 36: Action Engine — Approve / Reject Modal

**Triggered by "Approve" or "Modify" on Screen 35.**

**Modal:**

- Headline: "Authorize Lira to [action description]"
- Full action detail: Integration, endpoint, payload to be sent (readable format, not raw JSON)
- Example: "HubSpot — Update Deal #48291 → Status: Refund Processed | Amount: $2,400"
- Impact statement: "This will update the HubSpot deal record and mark the refund as processed. This cannot be undone automatically."
- Approve: "Authorize" (primary)
- Modify: opens the payload fields for editing before approval
- Reject: "Reject" + optional rejection note (Lira will tell the customer it can't be done automatically)
- After action: Lira resumes the action chain from this step

---

## Screen 37: Action Engine — Action History Log

**Purpose:** Full searchable log of every action Lira has taken.\*\*

**Table:**

- Columns: Timestamp | Customer | Action Type | Integration | Status (✓ | ✗ | ⏳) | Triggered By | Duration
- Filters: Integration | Action type | Date range | Status | Approval required (yes/no)
- Click any row: shows integration name, full payload sent, response received, and link to the parent conversation

---

## Screen 38: Action Engine — Integration Health Panel

**Purpose:** Monitor the health of all connected integrations in real-time.\*\*

**Grid of integration cards:**

- Each card: logo + name + status: "Connected ✓" (green) | "Error" (red) | "Rate limited" (yellow)
- Last successful action: "2 minutes ago"
- Today's action count: "17 actions today"
- Error log: "0 errors today" or "3 errors — view →"
- Click card: shows recent action history for that integration + error details if any

**Top bar:**

- Test all integrations: "Run health check" → fires a test ping to each integration API
- Date range toggle for historical health view

---

---

# FLOW 8 — Analytics & Improvement Dashboard

## Screen 39: Analytics — Overview Dashboard

**Purpose:** The executive-level view of Lira's support performance.\*\*

**Layout:** Date range picker top-right + full-width grid of charts and metrics

**Metric cards (top row):**

- Autonomous Resolution Rate: 74% → ↑8% vs. last week
- Escalation Rate: 26% → ↓8% vs. last week
- Average First Response Time: 18 seconds
- Average CSAT (AI-resolved): 4.2 / 5.0
- Total Conversations: 342 this week
- Proactive Outreaches Sent: 47 this week | 38% resulted in prevented tickets

**Charts:**

- Line chart: Resolution rate trend (last 30 days)
- Bar chart: Daily conversation volume by channel (email / chat / voice)
- Donut: Resolution outcome breakdown (Autonomous / Escalated / Pending)
- Bar: CSAT score distribution (1 through 5 star counts)
- Funnel chart: Proactive outreach funnel (Sent → Opened → Replied → Ticket prevented)

**Leaderboard (if multi-agent escalations):**

- Agent resolution times comparison (for escalated tickets only)

---

## Screen 40: Analytics — Proactive Outreach Performance

**Purpose:** Deep dive on proactive engine performance.\*\*

**Metrics:**

- Total outreaches sent: 47
- Opened rate (email): 81%
- Reply rate: 53%
- Ticket prevention rate: 38%
- Voice call answer rate (if voice used): X%

**Per-trigger breakdown table:**

- Trigger name | Fired | Delivered | Replied | Tickets prevented | Avg. conversation outcome
- Each row expandable to show day-by-day stats

**Best/worst performing triggers:**

- "Payment Failed – Retry Prompt" — 62% prevention rate ✓ Best
- "Account Inactive" — 11% prevention rate ← could be improved (Lira suggestion: "Template may need personalization turned on")

---

## Screen 41: Analytics — Self-Improvement Weekly Report

**Purpose:** Show how the knowledge base improved this week and what Lira learned.\*\*

**Report format (clean card layout, designed to be screenshotted / shared):**

- "Week of April 6, 2026"
- Escalation rate: 26% → ↓5 points vs. last week ✓
- Knowledge entries added: 4 (2 approved from AI drafts, 1 manual, 1 auto-published)
- Gaps remaining: 3 (with "Review them →" link)
- Top resolved topic: "API error code 4023" — now in knowledge base, asked 11x, resolved autonomously this week
- Estimated savings: "12 escalations avoided = ~4 human-hours saved"

**Chart: Escalation rate trend over last 12 weeks** — should show a downward curve as the knowledge base matures

---

## Screen 42: Analytics — Billing & Outcome Events Log

**Purpose:** Transparent record of every billable outcome for outcome-based pricing.\*\*

**Summary cards:**

- Billable resolutions this month: 214
- Estimated bill: $X (based on per-resolution pricing)
- Non-billable (escalated / no CSAT / failed): 73

**Table — Outcome Events:**

- Columns: Date | Customer | Channel | Resolution Type | CSAT | Billable? | Amount
- Billable = green row | Non-billable = grey row
- "Export for invoicing" button: CSV download
- "Send to Stripe" button (if Stripe is connected in Settings)

---

---

# FLOW 9 — Settings & Configuration

## Screen 43: Settings — Channels & API Keys

**Layout:** Left settings nav + right content panel (standard settings page design)

**Left nav items:** Channels | API Keys | Webhooks | Chat Widget | Action Thresholds | Team | Billing | Danger Zone

**Channels section:**

- Email: shows configured addresses, add new, verify, delete — same as onboarding step but editable
- Chat Widget: enable/disable per domain, manage multiple widget instances
- Voice: enable/disable, change number, update voice persona

**API Keys section:**

- Table: Key name | Masked key | Created | Last used | Environment (Live/Sandbox)
- Actions: Reveal | Copy | Revoke
- "Create new key" button → modal: name the key, select environment, copy on creation

**Webhooks section:**

- Lira's inbound webhook URL (read-only, with copy)
- "Rotate webhook URL" button (with confirmation warning)
- Test webhook: fire a test event and see the response inline
- Delivery log: last 20 webhook calls with status codes

---

## Screen 44: Settings — Chat Widget Customizer

**Live split view — same as Onboarding Step 2 but always editable:**

- Left: full appearance and behavior config
- Right: live preview of the widget
- Extra options not in onboarding:
  - Pre-chat form: "Collect customer name/email before starting chat" toggle + field config
  - Identity verification: "Use signed JWT to authenticate your users" toggle + code snippet
  - Blocked domains: input list — "Don't show widget on these URLs"
  - Custom CSS: advanced textarea — override widget styles
- "Save changes" button (top right)
- "Preview on your site" button: generates a temporary preview URL

---

## Screen 45: Settings — Action Approval Thresholds

**Purpose:** Define which actions Lira can take autonomously vs. which require approval.\*\*

**Table of action types:**

| Action                       | Default                 | Your Setting    |
| ---------------------------- | ----------------------- | --------------- |
| Update CRM contact record    | Auto-approve            | Toggle          |
| Create Linear ticket         | Auto-approve            | Toggle          |
| Send Slack notification      | Auto-approve            | Toggle          |
| Initiate refund < $100       | Require approval        | Toggle          |
| Initiate refund ≥ $100       | Require approval        | Toggle          |
| Delete or archive CRM record | Always require approval | Toggle (locked) |
| Send email on behalf of org  | Auto-approve            | Toggle          |
| Create contact in CRM        | Auto-approve            | Toggle          |

- Each row: toggle (Auto-approve / Require approval)
- For refunds: threshold input — "Auto-approve refunds up to $[amount]"
- Note: "Actions marked 'Always require approval' cannot be auto-approved. This protects against irreversible changes."
- Admin can create custom rules: "If customer tier = Enterprise, always require approval for any financial action"

---

## Screen 46: Settings — Team & Agent Management

**Purpose:** Manage the human agents who receive escalations.\*\*

**Agent table:**

- Name | Email | Role (Admin / Agent / Viewer) | Status (Active / Inactive)
- Actions: Edit | Remove
- "Invite agent" button → modal with email + role selector

**Escalation routing rules:**

- Default assignee: dropdown — "Auto (round-robin)" | specific agent
- Priority routing: "High-priority escalations always go to [agent dropdown]"
- Out-of-office: if an agent is offline, route to: [another agent] | unassigned queue

**Notification preferences (per agent):**

- How to receive escalation alerts: Email | Slack DM | Teams DM | All
- Working hours: toggle — "Only notify during these hours" → time grid

---

---

# FLOW 10 — Customer-Facing Chat Widget

## Screen 47: Chat Widget — All States

**Purpose:** The embedded chat widget that lives on the client's product/website. Designed as a floating overlay.\*\*

**State 1 — Closed:**

- Floating button (bottom-right corner)
- Brand color, company logo or Lira icon
- Optional notification badge: "1 new message" (for proactive outreach opening a chat)
- On hover: slight scale-up + shadow

**State 2 — Opening animation:**

- Widget expands upward from the launcher button (smooth animation, ~300ms)

**State 3 — Open, idle (first open):**

- Widget header: company name / logo + "We typically reply in seconds"
- Greeting message from Lira: "Hi [Customer name]! 👋 How can I help you today?" (personalized if the customer is authenticated)
- Suggested questions: 3-4 quick-reply chips: "Check my payment status" | "Talk to a human" | "Account help" | "Something else"
- Input bar at bottom: "Type a message…" + send button + microphone button (for voice-to-text)
- Powered by: small "Powered by Lira" watermark bottom-right (removable in white-label plan)

**State 4 — Customer typing:**

- Typing indicator visible in input bar
- Character count if message is long

**State 5 — Lira responding:**

- "Lira is typing…" with animated dots
- Response appears word-by-word (streaming effect, similar to ChatGPT)

**State 6 — Conversation active:**

- Scrollable message thread inside the widget
- Customer messages: right-aligned, brand-colored bubble
- Lira messages: left-aligned, white bubble with Lira avatar
- Timestamps on hover of any message
- "Send another message" input always visible at bottom

**State 7 — Action in progress:**

- Small status card above the input: "I'm checking your account…" with a subtle loading animation
- Appears when Lira is executing API calls or action chains

**State 8 — Escalated to human:**

- Status card: "You're now chatting with [Agent Name]"
- Agent avatar replaces Lira's AI icon
- Conversation continues seamlessly — customer sees no disruption
- "Transfer" is invisible to the customer unless the agent identifies themselves

**State 9 — Resolved + CSAT prompt:**

- Banner at bottom of thread: "Is your issue resolved?"
- 5-star rating inline (tap to rate)
- Optional comment: "Tell us more (optional)" text field
- Submit button
- After rating: "Thank you! Your feedback helps Lira improve. 🌟"

**State 10 — Minimized (during active conversation):**

- Launcher shows an unread badge with message count
- On re-open: conversation history is visible, no restart

**State 11 — Proactive widget open (initiated by Lira, not customer):**

- Widget opens automatically (with a gentle animation) when Lira sends a proactive notification
- Shows: "Hi [name], I noticed your payment didn't go through. Want me to help you retry it?" with "Yes, help me" and "Dismiss" buttons
- If dismissed: widget closes, proactive message logged as "No engagement"

---

---

# TRANSITION MAP (For Figma Prototype Connections)

```
Screen 2 (Module Activation)
  → "Start Setup" → Screen 3

Screen 3 → 4 → 5 → 6 → 7 → 8 → 9 (linear stepper)
  → Screen 9 "Activate" → Screen 10

Screen 10 (Home)
  → Inbox card          → Screen 11
  → Escalations alert   → Screen 35
  → Knowledge drafts    → Screen 30
  → Any activity item   → Screen 12 or 13

Screen 11 (Inbox list)
  → Click conversation  → Screen 12 or 13 (based on status)
  → Escalate button     → Screen 14

Screen 12 / 13
  → "Escalate"          → Screen 14
  → "Manual override"   → Screen 15
  → "View Customer"     → Screen 19
  → CSAT displayed      → Screen 16
  → Voice call          → Screen 17

Screen 18 (Customer List)
  → Click customer      → Screen 19

Screen 19 (Customer Profile)
  → "Timeline"          → Screen 20
  → "CRM Sync"          → Screen 21

Screen 22 (Trigger List)
  → "New Trigger"       → Screen 23

Screen 23 → 24 → 25 → 26 → 27 (linear wizard)
  → Activate            → Screen 22

Screen 22
  → "Activity log"      → Screen 28

Screen 29 (KB Library)
  → "AI Draft Queue"    → Screen 30

Screen 30
  → "Edit"              → Screen 31
  → "Manual"            → Screen 32
  → "Gap Report"        → Screen 33

Screen 34 (Action chain)
  → Any pending step    → Screen 35

Screen 35 (Approval queue)
  → "Approve/Modify"    → Screen 36

Screen 39 (Analytics)
  → "Proactive"         → Screen 40
  → "Weekly Report"     → Screen 41
  → "Billing"           → Screen 42

Settings (Screen 43)
  → "Widget"            → Screen 44
  → "Thresholds"        → Screen 45
  → "Team"              → Screen 46
```

---

---

# DESIGN SYSTEM NOTES (For Lira Design Consistency)

## Colors

- Use existing Lira brand color palette for primary actions
- Support module accent color: distinct from Meetings and Sales Coaching sections — suggest a teal/cyan tone to differentiate from the rest of the product, while still feeling like Lira
- Status colors (standard across all screens):
  - Resolved: `#22C55E` (green)
  - Escalated: `#F97316` (orange)
  - Pending: `#3B82F6` (blue)
  - Urgent: `#EF4444` (red)
  - Proactive: `#8B5CF6` (purple)

## Typography

- Same type scale as rest of Lira dashboard
- Section headers: 20px semi-bold
- Card titles: 16px medium
- Body: 14px regular
- Supporting text: 12px regular, muted color

## Icons

- Channel icons: consistent across all screens
  - Email: envelope icon
  - Chat: speech bubble icon
  - Voice: phone/waveform icon
  - Proactive: lightning bolt icon (to convey "Lira initiated")

## Spacing & Layout

- 24px column gutter
- Card border-radius: 12px
- Side panel width (right sidebar in conversation detail): 320px
- Sidebar width: 240px

## Component Patterns

- Action chain: custom component (no off-the-shelf equivalent) — build as a vertical stepper with conditional colors per step state
- CSAT rating: 5-star inline component, tap/click to select
- Risk score: progress bar 0-100 with green/yellow/red zones
- Condition builder: row-based with dropdown + operator + value inputs — can reference Zapier's filter UI as design inspiration

## Empty States

Every list/table should have a designed empty state:

- Inbox empty: "No conversations yet. Once customers reach out, you'll see them here."
- Trigger list empty: "No triggers yet. Create one to start proactive outreach."
- Knowledge base empty: "Lira can't answer questions without knowledge. Add your first document."
- Approval queue empty: "No approvals pending. Lira is handling everything automatically."

## Loading States

- Skeleton loaders for conversation lists and customer tables
- Spinner inside action chain step icons
- Progressive content load for long transcripts (virtual scroll)

---

# API SPEC SUMMARY (For Engineering Handoff)

## Endpoints Needed for This UX

| Endpoint                                     | Purpose                           | Screen               |
| -------------------------------------------- | --------------------------------- | -------------------- |
| `POST /support/customers`                    | Create/update CustomerProfile     | Onboarding, API docs |
| `GET /support/customers`                     | List all customers                | Screen 18            |
| `GET /support/customers/:id`                 | Get single customer profile       | Screen 19-21         |
| `GET /support/conversations`                 | List conversations (with filters) | Screen 11            |
| `GET /support/conversations/:id`             | Get conversation detail           | Screen 12-17         |
| `POST /support/conversations/:id/reply`      | Human manual reply                | Screen 15            |
| `POST /support/conversations/:id/escalate`   | Escalate conversation             | Screen 14            |
| `GET /support/triggers`                      | List proactive triggers           | Screen 22            |
| `POST /support/triggers`                     | Create trigger                    | Screen 27            |
| `PUT /support/triggers/:id`                  | Update trigger                    | Screen 27            |
| `POST /support/triggers/:id/test`            | Fire test trigger                 | Screen 27            |
| `GET /support/outreach-log`                  | Proactive outreach log            | Screen 28            |
| `GET /support/knowledge`                     | List KB documents                 | Screen 29            |
| `POST /support/knowledge`                    | Add KB entry                      | Screen 32            |
| `GET /support/knowledge/drafts`              | List AI drafts                    | Screen 30            |
| `POST /support/knowledge/drafts/:id/approve` | Approve draft                     | Screen 30-31         |
| `GET /support/actions`                       | Action history log                | Screen 37            |
| `GET /support/actions/pending`               | Pending approvals                 | Screen 35            |
| `POST /support/actions/:id/approve`          | Approve action                    | Screen 36            |
| `POST /support/actions/:id/reject`           | Reject action                     | Screen 36            |
| `GET /support/analytics/overview`            | Overview metrics                  | Screen 39            |
| `GET /support/analytics/proactive`           | Proactive metrics                 | Screen 40            |
| `GET /support/analytics/outcomes`            | Billing outcomes                  | Screen 42            |
| `POST /support/webhook`                      | Inbound product events            | Proactive Engine     |
| `GET /support/settings`                      | Get org settings                  | Screen 43-46         |
| `PUT /support/settings`                      | Update settings                   | Screen 43-46         |

---

_Document complete — 47 screens, 10 flows, full integration architecture, design system guidance, and API endpoint inventory._
_Ready for Figma._

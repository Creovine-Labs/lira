# Google Stitch Prompt — Lira Customer Support: Screens 41–47

Paste each block below as a separate Stitch prompt, one screen at a time.

---

## PROMPT — Screen 41: Analytics — Self-Improvement Weekly Report

Design a full-page SaaS dashboard screen for the Self-Improvement Weekly Report inside Lira Customer Support's Analytics section. The dark sidebar on the left shows "Support > Analytics" as active.

PAGE HEADER:
- "Analytics" heading + tab bar: "Overview" | "Proactive Performance" | "Weekly Report" (active/underlined) | "Billing & Outcomes"
- Right: week selector "Week of April 6, 2026 ▾" + "Share report" ghost button + "Download PDF" ghost button with a download icon

The screen design is intentionally different from the other analytics tabs — it should feel like a printed report / summary card, designed to be read in 60 seconds and optionally screenshotted or emailed to a team.

REPORT HERO CARD (full-width card, white, with a subtle green left border ~6px):
- Heading: "Week of April 6, 2026" (bold, 22px) + a gold/amber "↑ Your best week yet" badge pill on the right
- A large centered stat with supporting copy:
  "Lira autonomously resolved 74% of all conversations this week — up from 69% last week."
- Subtext: "That's 5 percentage points of improvement in 7 days."

4-METRIC HIGHLIGHT ROW (below the hero card, 4 equal-width light cards side by side, each with a prominent icon):

CARD 1 — Escalation trend:
- Icon: downward arrow in a green circle
- Large: "↓ 5 points" in green
- Label: "Escalation rate this week: 26%"
- Subtext: "vs. 31% last week ✓"

CARD 2 — Knowledge base growth:
- Icon: open book / knowledge icon in blue circle
- Large: "4 entries added"
- Label: "Knowledge base grew this week"
- Subtext: "2 approved from AI drafts · 1 manual · 1 auto-approved (94% confidence)"

CARD 3 — Gaps remaining:
- Icon: magnifying glass in amber circle
- Large: "3 gaps" in amber
- Label: "Knowledge gaps still open"
- Subtext + action link: "Review them →" in brand color

CARD 4 — Estimated savings:
- Icon: clock in green circle
- Large: "~4 human-hours saved"
- Label: "Based on 12 escalations avoided"
- Subtext: "Each escalation estimated at ~20 min of human agent time"

TOP RESOLVED TOPIC THIS WEEK (full-width card below the 4 metrics, light green background tint):
- Left: a star / award icon in green
- Heading: "Top new resolution this week"
- Body: "API error code 4023 — asked by 11 customers this week. Lira couldn't answer it last week. This week: 2 AI-drafted knowledge entries were approved and published on April 5th. All 11 subsequent questions were answered autonomously."
- Right: "→ View knowledge entry" text link

MAIN CHART (full width below the highlight card):
- Heading: "Escalation Rate — Last 12 Weeks" (bold 16px) + tooltip info icon (ℹ)
- A clean LINE CHART:
  - X-axis: 12 weekly labels (Jan 12 → Apr 6, 2026)
  - Y-axis: percentage 0–60%, grid lines in very light grey
  - The line: starts around 48% (week 1), has some ups and downs in weeks 2–6, then trends downward from week 7 onward, ending at 26% (current week)
  - The last datapoint (26%) should be highlighted with a larger dot + a callout label: "26% this week"
  - A light green fill/shading under the line from roughly week 7 onward to indicate the downtrend zone
  - A thin dashed horizontal reference line at 30% labeled "Target: ≤30%"
- Below the chart: label "↓ Escalations decline as knowledge base matures — Lira learns from every interaction"

KNOWLEDGE ACTIVITY LOG (full width below the chart, a compact timeline):
- Heading: "Knowledge changes this week"
- 4 timeline rows (compact, each on one line with a left icon dot):
  - Green dot: "Apr 5 — 'API Error Code 4023' approved and published (AI draft, 91% confidence)"
  - Green dot: "Apr 5 — 'API Error Code 4023 — Code 4031 variation' approved (AI draft, 94%)"
  - Blue dot: "Apr 3 — 'Refund Policy' manually updated by Sarah K."
  - Green dot: "Apr 2 — 'International Wire Limits' auto-published (94% confidence, above auto-approve threshold)"

FOOTER NOTE: "This report is generated automatically every Monday. Share it with your team or download as PDF."

Style: this screen is intentionally warmer and more editorial than the other analytics tabs. It's meant to feel like a "report card" or weekly digest — the kind of email your CEO might want to read. The hero card and 4 metrics sections carry the most visual weight. The downward-sloping escalation chart is the emotional core — it tells the "Lira gets smarter every week" story visually. Green dominates as the color tone (improvement = good = green).

---

## PROMPT — Screen 42: Analytics — Billing & Outcome Events Log

Design a full-page SaaS dashboard screen for the Billing & Outcome Events log in Lira Customer Support's Analytics section. The dark sidebar shows "Support > Analytics" as active. This screen gives complete transparency on outcome-based pricing — every billable resolution is listed.

PAGE HEADER:
- "Analytics" heading + tab bar: "Overview" | "Proactive Performance" | "Weekly Report" | "Billing & Outcomes" (active/underlined)
- Right: month picker "April 2026 ▾" + "Export for invoicing" outlined button + "Send to Stripe" outlined button (with Stripe logo icon, shown only if Stripe is connected — show it as connected here)

SUMMARY CARDS ROW (top, 3 equal-width cards):

CARD 1 — "Billable Resolutions This Month"
- Large: "214"
- Subtext: "Autonomous resolutions with positive CSAT confirmed"
- Green dot + "Billing active"

CARD 2 — "Estimated Invoice (April)"
- Large: "$1,926.00" (shown as an estimate, formatted as currency)
- Subtext: "$9.00 per billable resolution · 214 resolutions"
- Small disclaimer below: "Final amount confirmed at month end"

CARD 3 — "Non-Billable Events"
- Large: "73" in muted grey
- Subtext breakdown: "41 escalated (no charge) · 18 pending CSAT · 14 failed resolution"
- Note: "Non-billable events are never charged"

FILTER BAR (below the summary cards):
- Filter pills: "Resolution type: All ▾" | "Channel: All ▾" | "Billable: All ▾"
- Right: "Export CSV" ghost button

DATA TABLE (full width):
- Heading: "Outcome Events" (semi-bold 16px) + "287 total this month" muted subcount

COLUMN HEADERS (sticky, grey background): Date | Customer | Channel | Resolution Type | CSAT | Billable? | Amount

Show 10 data rows. Billable rows have a very subtle green left border or very light green tint. Non-billable rows are slightly muted/grey.

ROW 1 (billable — green tint):
"Apr 6, 2:14 PM" | "Jana Fischer" (avatar "JF") | ✉ Email chip | "Autonomous ✓" green chip | "★★★★☆" | "✓ Billable" green pill | "$9.00"

ROW 2 (billable):
"Apr 6, 10:42 AM" | "Mark Adeyemi" ("MA") | 📞 Voice chip | "Autonomous ✓" green | "★★★★★" | "✓ Billable" green | "$9.00"

ROW 3 (non-billable — muted):
"Apr 6, 10:48 AM" | "Daniel Roy" ("DR") | ✉ Email | "Escalated" orange chip | "★★★☆☆" | "— Not billable" grey pill | "$0.00"

ROW 4 (billable):
"Apr 5, 4:05 PM" | "Sarah Chen" ("SC") | 💬 Chat chip | "Autonomous ✓" | "★★★★★" | "✓ Billable" | "$9.00"

ROW 5 (non-billable — pending CSAT):
"Apr 5, 3:50 PM" | "Elena Petrov" ("EP") | ✉ Email | "Autonomous ✓" | "Pending ⏳" amber chip | "⏳ Awaiting CSAT" amber pill | "—"

ROW 6 (billable):
"Apr 5, 2:10 PM" | "Kwame Asante" ("KA") | ✉ Email | "Autonomous ✓" | "★★★★☆" | "✓ Billable" | "$9.00"

ROW 7 (non-billable — escalated):
"Apr 4, 11:20 AM" | "Priya Nair" ("PN") | ✉ Email | "Escalated" orange | "★★★☆☆" | "— Not billable" grey | "$0.00"

ROW 8 (billable):
"Apr 4, 9:30 AM" | "Tom Bakker" ("TB") | 💬 Chat | "Autonomous ✓" | "★★★★★" | "✓ Billable" green | "$9.00"

ROW 9 (non-billable — failed):
"Apr 3, 5:00 PM" | "Kwame Asante" | ✉ Email | "Failed" red chip | "—" | "— Not billable" grey | "$0.00"

ROW 10 (billable):
"Apr 3, 2:30 PM" | "Jana Fischer" | 💬 Chat | "Autonomous ✓" | "★★★★☆" | "✓ Billable" green | "$9.00"

TABLE FOOTER: "Showing 1–10 of 287 outcomes · Billable: 214 · Non-billable: 73" + pagination arrows.

BILLING EXPLAINER NOTE (below the table, a light grey info card):
- Small ℹ info icon + text: "You are only charged for autonomous resolutions confirmed by a positive CSAT rating (3 stars or above). Escalated, failed, and pending-CSAT interactions are never billed — regardless of how much work Lira did."
- "View full pricing terms →" text link

Style: this screen is about trust and transparency. The visual hierarchy emphasizes the billable/non-billable split — green for billable (positive), grey/muted for non-billable (neutral, never alarming). The "$0.00" amounts on non-billable rows reinforce that escalations truly aren't charged. The summary cards at the top should give the user confidence that the total looks reasonable. The "Send to Stripe" button in the header makes the billing integration feel seamless rather than manual.

---

## PROMPT — Screen 43: Settings — Channels & API Keys

Design a full-page SaaS dashboard settings screen for Lira Customer Support. The dark sidebar on the left shows "Support > Settings" as active (with a cog/gear icon).

The screen uses a standard 2-column settings layout:

LEFT SETTINGS NAV (~220px, light grey background, full height):
- Vertical list of settings sections, icon + label each:
  - Channels (currently selected — highlighted)
  - API Keys
  - Webhooks
  - Chat Widget
  - Action Thresholds
  - Team & Agents
  - Billing
  - Danger Zone (red text, at bottom)

RIGHT SETTINGS PANEL (remaining width):

The content panel is organized into 3 expandable sections. All 3 are expanded (open) on this screen:

SECTION 1 — "Channels" (heading with a divider below):

SUBSECTION — Email:
- Row 1: email icon + "support@fincopay.com" bold + "Verified ✓" green badge + "Remove" muted text link
- Row 2: email icon + "noreply@fincopay.com" + "Verified ✓" green badge + "Remove"
- "+ Add email address" text link in brand color (below the rows)

SUBSECTION — Chat Widget:
- Row: Chat bubble icon + "Chat widget active" bold + toggle (ON, green) + "Configure widget →" text link (right)
- Below that: a small read-only row in muted text: "Active on: fincopay.com · app.fincopay.com"
- "+ Add domain" text link

SUBSECTION — Voice:
- Row: Phone icon + "Voice: Active" bold + toggle (ON, green)
- Sub-row in muted text: "Phone number: +1 (844) 555-0192 · Voice: Nova Sonic — Default" + "Change number" and "Change voice" text links

SECTION 2 — "API Keys" (heading + divider):

TABLE (4 columns):
Column headers (light grey): Key name | Masked key | Created | Last used | Environment | Actions

3 rows:
ROW 1: "Production key" | "lira_live_••••••••d7e2" | "Jan 15, 2026" | "2 minutes ago" | "Live" (green badge) | Reveal / Copy / Revoke (action links)
ROW 2: "Staging key" | "lira_live_••••••••a4b9" | "Feb 3, 2026" | "Yesterday" | "Sandbox" (grey badge) | Reveal / Copy / Revoke
ROW 3: "Developer local" | "lira_live_••••••••c1f3" | "Mar 1, 2026" | "3 days ago" | "Sandbox" (grey badge) | Reveal / Copy / Revoke

Below the table: "Create new API key" outlined button + small warning note: "Keep your API keys secret — never expose them in client-side code."

SECTION 3 — "Webhooks" (heading + divider):

Webhook URL row:
- Label: "Your Lira inbound webhook URL"
- A dark/code-style read-only input displaying: "https://api.creovine.com/support/webhook/org_f82k..." (partially masked)
- Row of 3 action links to the right of the input: "Copy URL" | "Rotate URL" (+ yellow warning tooltip on hover: "Rotating this URL will break existing integrations") | "Test webhook"

DELIVERY LOG (below the URL row):
- Sub-heading: "Recent webhook calls" + "Last 20 shown" muted label
- 5 compact log rows (table-like):
  - Apr 6, 2:10 PM | "payment.failed" | "200 ✓" green | "84ms"
  - Apr 6, 1:44 PM | "payment.failed" | "200 ✓" green | "91ms"
  - Apr 5, 4:05 PM | "fraud.flagged" | "200 ✓" green | "77ms"
  - Apr 5, 3:00 PM | "kyc.blocked" | "422 ✗" red text | "201ms"
  - Apr 4, 9:15 AM | "subscription.expiring" | "200 ✓" green | "88ms"
- "View full delivery log →" text link below

Style: clean settings page with a left nav that makes section switching obvious. All three sections (Channels, API Keys, Webhooks) deliver their respective management tasks in a compact, no-clutter format. The API keys table should feel secure — masked keys by default, "Reveal" only on explicit click. The webhook delivery log is a compact dev tool, dense but well-spaced. Danger Zone at the bottom of the left nav should be visually distinct (red text) but not garish.

---

## PROMPT — Screen 44: Settings — Chat Widget Customizer

Design a full-page SaaS dashboard settings screen for the Chat Widget configuration in Lira Customer Support. The dark sidebar shows "Support > Settings" as active. The left settings nav is the same as Screen 43, with "Chat Widget" as the selected/highlighted item.

This screen is a persistent "always-editable" version of the widget setup from the onboarding flow. It uses the same two-column live-preview layout.

PAGE HEADING (top of right panel):
- "Chat Widget" heading (bold, 22px)
- Right: "Save changes" primary filled button + "Preview on your site" outlined button (which will generate a temporary preview URL)

TWO-COLUMN LAYOUT (main content):

LEFT COLUMN — CONFIGURATION PANEL (~55% width):

SECTION — "Appearance":
- "Widget color" — a small color swatch chip (currently showing brand color, roughly #6366F1 / indigo) + "Change" text link → opens a simple color picker inline
- "Widget position" — radio row: "Bottom right" (selected) | "Bottom left"
- "Launcher icon" — option row: Lira icon (selected, with filled border) | Chat bubble icon | Custom upload (outlined, blank)
- "Company name in header" — text input: "FincoSupport"
- "Greeting message" — text input: "Hi {{customer.name}}! 👋 How can I help you today?" — with a small "Insert variable" link below

SECTION — "Behavior":
- "Suggested reply chips" — toggle (ON) + a small manage link "Manage chips →" showing 4 chip-pills inline in muted style: "Check my payment status" | "Talk to a human" | "Account help" | "Something else" — "+ Add chip" link after them
- "Auto-open for proactive messages" — toggle (ON): "Open the widget automatically when Lira sends a proactive outreach"
- "Show 'Powered by Lira' badge" — toggle (OFF, grey): "Remove branding on paid plans"

SECTION — "Pre-chat form" (new vs. onboarding):
- Toggle row: "Collect info before starting chat" (OFF by default — toggle shows OFF/grey)
- Collapsed content below the toggle (add a visual "expand" hint showing greyed-out fields): "Name · Email · Issue type"
- A small note: "Turn on to collect customer details before the first message. Useful if you haven't implemented identity verification."

SECTION — "Identity verification":
- Toggle row: "Verify customer identity via signed JWT" (ON — toggle shows green)
- When ON, a code block below the toggle:
  - Dark background code snippet panel (~100px tall):
    "// Verify your users before chat opens
    LiraWidget.initialize({
      userId: user.id,
      userHash: generateHMAC(user.id, SECRET_KEY)
    });"
  - "Copy snippet" copy icon on the right edge of the code block
  - Small note below: "Generate the HMAC server-side. Never expose your secret key client-side."

SECTION — "Blocked domains":
- Label: "Don't show widget on these URLs"
- A tag-input showing 1 existing entry: "staging.fincopay.com" chip (×) + "+ Add domain" input placeholder
- Note: "This is often used to hide the widget from internal tools."

SECTION — "Custom CSS":
- A collapsible accordion: "Advanced — Custom CSS ▾" (currently closed)
- Show it as a closed grey accordion toggle with a small "Advanced" badge

RIGHT COLUMN — LIVE PREVIEW (~45% width):

COLUMN HEADING: "Widget preview" with a small eye icon + two toggle tabs: "Desktop" (selected) | "Mobile"

A desktop mock frame (white rectangle with a nav bar on top, representing a browser window / product page). The browser chrome shows URL bar reading "app.fincopay.com/dashboard".

Inside the mock content area, at the bottom-right corner of the frame: the chat widget is shown in its OPEN, IDLE state:
- Widget container: a white rounded card ~280px wide, ~360px tall, floating at bottom-right
- Header: company color top bar + "FincoSupport" name + X close icon
- Greeting: "Hi Jana! 👋 How can I help you today?" — Lira message bubble (left-aligned)
- 4 quick-reply chip buttons below the greeting: "Check my payment status" | "Talk to a human" | "Account help" | "Something else"
- Input bar at the bottom: "Type a message…" + send icon + mic icon
- "Powered by Lira" watermark — but greyed out / crossed out visually showing it's been hidden (since the toggle was OFF)

Below the mock frame: "Preview is based on current settings. Changes reflect in real time."

Style: the left configuration section is a practical admin tool — toggles, inputs, code snippets. The right live preview is the reward panel — every config change on the left should feel like it visibly updates the widget on the right. The Identity Verification code block is an important unique element that signals developer-level capability. Sections are clearly separated by spacing/dividers without being too heavy.

---

## PROMPT — Screen 45: Settings — Action Approval Thresholds

Design a full-page SaaS dashboard settings screen for configuring Lira's autonomous action permissions in Lira Customer Support. The dark sidebar shows "Support > Settings" as active. Left settings nav (same as Screen 43) has "Action Thresholds" as the selected/highlighted item.

PAGE HEADING (top of right panel):
- "Action Approval Thresholds" heading (bold, 22px)
- Subheading: "Control which actions Lira can take autonomously and which require a human to approve first." in muted grey
- Right: "Save changes" primary filled button (disabled/greyed until a change is made)

EXPLAINER CARD (full width, light blue tinted info card below the heading):
- ℹ info icon + text: "By default, Lira auto-approves low-risk, reversible actions and requires approval for financial, destructive, or high-value actions. You can adjust these rules below."
- Text link: "Learn about risk levels →"

MAIN TABLE (full width):

TABLE HEADING: "Action Permissions" + "8 action types" muted count

COLUMN HEADERS (grey background): Action Type | Risk Level | Default Setting | Your Setting

Show 8 rows:

ROW 1:
- "Update CRM contact record" (e.g. update name, email, notes)
- Risk: "Low" — green badge
- Default: "Auto-approve" grey text
- Your Setting: a TOGGLE (ON, green with "Auto-approve" label next to it)

ROW 2:
- "Create ticket in Linear / Jira"
- Risk: "Low" green
- Default: "Auto-approve"
- Toggle: ON green

ROW 3:
- "Send Slack / Teams notification"
- Risk: "Low" green
- Default: "Auto-approve"
- Toggle: ON green

ROW 4:
- "Send email on behalf of org"
- Risk: "Low" green
- Default: "Auto-approve"
- Toggle: ON green

ROW 5:
- "Create contact in CRM"
- Risk: "Medium" — yellow badge
- Default: "Auto-approve"
- Toggle: ON green

ROW 6 (SPECIAL ROW — has an extra sub-row control):
- "Initiate refund or financial transaction"
- Risk: "High" — orange badge
- Default: "Require approval"
- Toggle: OFF grey (showing "Require approval")
- EXPANDED SUB-ROW below (indented, light grey background):
  - "Auto-approve refunds up to:" + number input field showing "$100" + "Per transaction" label
  - "Require approval for amounts ≥ $100"
  - Note in muted small text: "Turn on the toggle to enable auto-approval below this threshold. Keep off to always require approval."

ROW 7:
- "Delete or archive CRM record"
- Risk: "Critical" — red badge
- Default: "Always require approval"
- Toggle: LOCKED (shows a lock icon 🔒 instead of editable toggle, greyed) + label "Cannot be auto-approved"

ROW 8:
- "Update account type or tier"
- Risk: "High" orange
- Default: "Require approval"
- Toggle: OFF grey

CUSTOM RULES SECTION (full width card below the table):
- Heading: "Custom rules" + "+ Add rule" outlined button on the right
- A single existing custom rule shown as a row:
  - Tag chip: "if customer.tier = Enterprise"
  - Arrow: "→"
  - Label: "Always require approval for any financial action"
  - Edit | Delete text links on the right
- Muted subtext below: "Custom rules override the table settings above for matching conditions."

LOCKED ACTIONS NOTE (below custom rules, amber left-border card):
- ⚠ amber icon + "Actions marked 'Always require approval' (red badge) cannot be auto-approved. This protects against irreversible or destructive changes to customer data."

Style: this settings screen should communicate two things: control and safety. The risk badge column (Low green → Medium yellow → High orange → Critical red) provides an instant visual hierarchy that guides admins to make appropriate decisions. The locked row for "Delete/archive" (with a lock icon, greyed out toggle) signals immovable guardrails. The expandable refund threshold sub-row is a unique detail — it lets admins set a dollar-ceiling for auto-approval rather than a binary on/off.

---

## PROMPT — Screen 46: Settings — Team & Agent Management

Design a full-page SaaS dashboard settings screen for managing the human agents and escalation routing in Lira Customer Support. The dark sidebar shows "Support > Settings" as active. Left settings nav has "Team & Agents" highlighted.

PAGE HEADING (top of right panel):
- "Team & Agents" heading (bold, 22px)
- Subheading: "Manage who receives escalations from Lira and how they're notified." in muted grey
- Right: "Invite agent" primary filled button (with a + person icon)

AGENTS TABLE SECTION:

Section heading: "Agents (4)" semi-bold

TABLE COLUMN HEADERS (grey background): Name | Email | Role | Status | Notification preference | Actions

4 rows:

ROW 1 — CURRENT USER / ADMIN:
- "Sarah K." (avatar "SK", green dot showing online) + "(you)" muted label
- "sarah@fincopay.com"
- "Admin" dark pill badge
- "Active" green text
- Notification: Email icon + Slack icon (both active, filled)
- Actions: "Edit ▾" link (shows notification pref editor)

ROW 2:
- "James Osei" (avatar "JO", green dot)
- "james@fincopay.com"
- "Agent" grey pill
- "Active" green
- Notification: Slack icon only
- Actions: "Edit" | "Remove" muted red

ROW 3:
- "Lena Mayer" (avatar "LM", grey dot — offline)
- "lena@fincopay.com"
- "Agent" grey pill
- "Inactive / Out of office" grey text (with a moon icon)
- Notification: Email icon only
- Actions: "Edit" | "Remove"

ROW 4:
- "Ravi Singh" (avatar "RS", grey dot)
- "ravi@fincopay.com"
- "Viewer" light grey pill
- "Active" green
- Notification: Teams icon only
- Actions: "Edit" | "Remove"

Below the table: "Invite agent" text link as an additional secondary CTA.

PENDING INVITE ROW (below the table, slightly indented/muted):
- Email icon + "kai@fincopay.com" + "Invited — pending acceptance" amber badge + "Resend invite" text link + "Cancel" text link (red)

ESCALATION ROUTING SECTION (below the agents table with a section divider):

Section heading: "Escalation Routing Rules" semi-bold

THREE CONFIGURATION ROWS (each a label + control inline):

ROW 1:
- "Default escalation assignee:" label
- Dropdown: showing "Auto (round-robin across all agents)" — other options: specific agent names
- Description below: "Escalated conversations are evenly distributed across all active agents by default."

ROW 2:
- "High-priority escalations always go to:" label
- Dropdown: showing "Sarah K." (with avatar) — can override to any agent
- Description: "Conversations escalated with 'Urgent' or 'Critical' priority always route here first."

ROW 3:
- "If assigned agent is offline, route to:" label
- Dropdown: "Next available agent (round-robin)"
- An inline toggle below: "If no agents are online: Create unassigned queue → email all agents" (toggle ON)

NOTIFICATION PREFERENCES SECTION (below routing rules, with section heading):

Section heading: "Default notification preferences" + note: "Agents can override these in their own profile settings."

Two rows of global defaults:
- "Escalation alerts via:" — 3 toggle chips in a row: "Email" (ON, filled) | "Slack DM" (ON, filled) | "Teams DM" (OFF, outlined)
- "Only notify during:" — a toggle "Working hours only" (ON) + a compact time grid visual showing Mon–Fri, 9AM–6PM highlighted in brand light blue, weekend greyed out + "Edit hours →" text link

Style: this is a clean admin management screen. The agents table is the centrepiece — the online/offline status dots are important (they affect routing logic). The "Inactive / Out of office" state for Lena Mayer should be visually distinct (grey dot, italic or muted status) since her offline state has consequences for escalation routing. The Escalation Routing section below the table directly answers "what happens after I add agents" — keeping cause and effect on the same screen.

---

## PROMPT — Screen 47: Customer-Facing Chat Widget — All States

Design a reference sheet screen showing the Lira Customer Support chat widget in all 11 possible states. This is a DESIGN REFERENCE SCREEN — it shows the widget at full size across the page in a labeled grid, not a functional dashboard. Think of it as a component states page in a design system.

SCREEN BACKGROUND: Light grey (#F8F9FA) — no sidebar, no nav. Just a clean grid of widget states.

PAGE TITLE (top center, large):
- "Chat Widget — All States" (bold, 28px)
- Subtext: "Customer-facing widget · 340px wide · Bottom-right anchored" in muted grey

The widget states are laid out in a 3-column or 2-column grid. Each state card shows:
- A LABEL above the widget frame in small-caps grey (e.g. "STATE 1 — CLOSED")
- The widget frame itself (a white rounded-rectangle, ~340px wide, appropriate height for the state)
- Below the frame: a one-line description in muted italic

Show each state frame faithfully as follows:

STATE 1 — CLOSED:
- Only the floating launcher button is visible: a circle (~56px) in brand color, with the Lira star icon or company logo inside
- A small red badge on the launcher: unread count "1" (for a proactive message)
- Description: "Floating launcher button. Badge appears for unread messages."

STATE 2 — OPEN, IDLE (first time opening):
- Full widget frame (~360px tall):
  - Header bar: brand color background + "FincoSupport" + Lira avatar icon + X close icon
  - Below header: "We typically reply in seconds" in muted green text
  - Greeting message (left-aligned Lira bubble): "Hi Jana! 👋 How can I help you today?"
  - 4 quick-reply chip buttons below: "Check my payment status" | "Talk to a human" | "Account help" | "Something else"
  - Input bar at bottom: "Type a message…" + send arrow icon + mic icon
  - "Powered by Lira" watermark, small, bottom-right of widget
- Description: "Default open state with personalized greeting and quick-reply chips."

STATE 3 — CUSTOMER TYPING:
- Same widget layout but input bar shows customer has typed something:
- Input bar: shows typed text "My payment didn't g—" with a blinking cursor at the end
- The send button is now active/colored (was grey before)
- Description: "Input bar active. Send button activates when text is present."

STATE 4 — LIRA RESPONDING:
- The conversation thread now has the customer's sent message (right bubble, brand-tinted): "My payment didn't go through"
- Below it: Lira's typing indicator (left side, Lira avatar + 3 animated dots "●●●" in a light grey bubble)
- Description: "Lira typing indicator. Streamed responses appear word-by-word."

STATE 5 — CONVERSATION ACTIVE:
- Thread showing 3 messages:
  - Customer (right, tinted bubble): "My payment didn't go through"
  - Lira (left, white bubble): "Hi Jana! I can see your payment of $450 failed due to insufficient funds. Here's how to retry it: go to Payments > Retry, or I can walk you through it now."
  - Customer (right): "Can you walk me through it?"
- Input bar at bottom, standard empty state
- Description: "Scrollable message thread. Customer right, Lira left."

STATE 6 — ACTION IN PROGRESS:
- Same conversation thread as State 5 + Lira's last message
- Above the input bar: a small status card (light blue tint, full widget width, ~36px tall):
  - A small spinning circle loader icon + "Checking your account…" in muted text
- Description: "Status card appears when Lira is making API calls. Disappears on response."

STATE 7 — ESCALATED TO HUMAN:
- Status card at top of widget (just below the header): "You're now chatting with James O." — with a real avatar/initial circle "JO" and a green online dot
- The previous conversation thread is visible below — the human agent's first message appears: "Hi Jana, I'm James from the support team — I'm looking into this now."
- Lira's icon is replaced by James's initials in subsequent messages
- Description: "Seamless handoff. Customer sees agent name. Lira's icon replaced by agent avatar."

STATE 8 — RESOLVED + CSAT:
- Conversation thread still visible (scrolled to bottom)
- A "conversation resolved" grey divider bar: "Resolved · Apr 6, 2026"
- Below the divider: a CSAT prompt card (full widget width):
  - Question: "Was your issue resolved?"
  - 5 clickable star icons in a row, large (tap-friendly, ~32px each) — all outlined (not yet rated)
  - Optional text below: "Leave a comment (optional)" link
  - No submit button yet — submits automatically on star tap
- Description: "CSAT prompt appears after resolution. Stars are tap-to-submit."

STATE 9 — POST-CSAT (after rating submitted):
- Customer has tapped 4 stars (4 filled gold stars shown)
- The CSAT prompt card has transformed into a confirmation:
  - A large green checkmark
  - "Thank you, Jana! 🌟 Your feedback helps us improve."
  - Small subtext: "Conversation closed."
- Below: "Start a new conversation" text link
- Description: "Thank-you state after CSAT submission. Conversation closed."

STATE 10 — MINIMIZED (with active conversation):
- Only the launcher button visible (closed state)
- But the launcher now shows a green online dot (conversation is active) + a "1" unread badge
- Description: "Minimized state during active chat. Badge shows unread count."

STATE 11 — PROACTIVE WIDGET OPEN (initiated by Lira, not customer):
- Widget opens automatically with a distinct layout:
  - Header: same branded header
  - Proactive message (Lira bubble, left): "Hi Jana, I noticed your payment didn't go through. Want me to help you retry it?" — with a lightning bolt icon next to the Lira avatar (indicates outbound/proactive)
  - TWO PROMINENT BUTTONS below the bubble (stacked, full widget width):
    - "Yes, help me →" — filled primary button
    - "Dismiss" — ghost/text button (grey)
  - No input bar shown (buttons replace it)
- Description: "Proactive state. Widget opens automatically on a trigger event. Customer must tap Yes or Dismiss."

Style: this reference sheet is a design-system component page, not a dashboard screen. The background is neutral grey so the white widget frames stand out clearly. Each state should be shown at identical widget width (~340px) to make comparison natural. Labels above each state frame should be in small-caps in a consistent style. The states should flow naturally in a grid — group them loosely: closed/launch states (1, 10) → open/idle (2) → active conversation states (3–6) → special states (7–11).

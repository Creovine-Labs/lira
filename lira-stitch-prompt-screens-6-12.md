# Google Stitch Prompt — Lira Customer Support: Screens 6–12

Paste each block below as a separate Stitch prompt, one screen at a time.

---

## PROMPT — Screen 6: Onboarding Step 4 — Connect Integrations

Design a full-screen onboarding step for a dark SaaS dashboard. At the top is a horizontal 7-step progress bar with Step 4 "Integrations" active and filled. Small label: "Step 4 of 7".

Below the step bar is a page heading: "Connect Your Tools" with a subheading: "Lira will only take actions on these tools when a customer conversation warrants it." in muted grey text.

The main content area is a 2-column grid of integration cards, 3 rows deep (6 cards total). Each card is a white rounded rectangle (~280px wide) with a subtle border and shadow. Card structure:
- Top row: integration logo on the left (16x16 icon) + integration name in bold + a "Recommended" or "Optional" tag pill on the right
- Middle row: one-line description in muted text
- Bottom row: a status badge on the left + a CTA button on the right

Show these 6 cards:
1. HubSpot — "Sync customer profiles, update contact records" — Status: "Connected ✓" (green badge) — Button: greyed out "Connected" (already linked, no action needed) — note below: "From your Meetings setup. No action needed."
2. Salesforce — "Sync customer profiles, update contact records" — Status: "Not connected" (grey badge) — Button: "Connect" (outlined)
3. Linear — "Create and assign support tickets" — Status: "Not connected" — Button: "Connect" (outlined)
4. Slack — "Notify teams on escalation and compliance holds" — Status: "Connected ✓" (green) — Button: greyed out "Connected" — note: "From your Meetings setup."
5. Microsoft Teams — "Alternative to Slack for team notifications" — Status: "Not connected" — Button: "Connect" (outlined) — tag: "Optional"
6. GitHub — "Create issues for product bugs surfaced in support" — Status: "Not connected" — Button: "Connect" (outlined) — tag: "Optional"

HubSpot and Slack cards are visually distinct — they have a light green background tint and their "Connected ✓" badge is green. The other 4 cards are white with a grey "Not connected" badge.

Bottom navigation: "Skip for now" text link (left) + "Back" ghost button + "Continue" primary button (right-aligned, filled, brand accent color).

Style: clean SaaS integration page, same design system as previous onboarding steps. Cards in a 2-column grid with generous vertical spacing between rows.

---

## PROMPT — Screen 7: Onboarding Step 5 — Knowledge Base Seed

Design a full-screen onboarding step for a SaaS dashboard. At the top is the 7-step progress bar with Step 5 "Knowledge Base" active.

Page heading: "Seed Lira's Knowledge Base" with subheading: "Lira only answers questions she can find in here — she won't make things up." in muted text.

The main content area is a centered card (~720px wide) containing a 3-tab interface at the top. The tabs are: "Website Crawl" (active, underlined), "File Upload", "Manual Entry".

TAB 1 — Website Crawl (shown as active):
- A text input labeled "Website URL" with placeholder "https://yourcompany.com" and a blue "Crawl" button on the right
- Below the input: a checklist of auto-detected pages with checkboxes, showing 6 rows:
  - ✓ yourcompany.com/pricing
  - ✓ yourcompany.com/docs
  - ✓ yourcompany.com/faq
  - ✓ yourcompany.com/help
  - ✓ yourcompany.com/about
  - ☐ yourcompany.com/blog (unchecked)
- Below the checklist: a progress bar (shown at ~80% complete) with label "Crawling pages… 38 of 48 done"
- Below the progress bar: a success state card showing "48 pages indexed. 1,240 knowledge chunks ready." with a green checkmark icon and green text

TAB 2 and TAB 3 are shown as inactive tabs (grey text), not expanded.

BOTTOM of the card:
- A subtle info note in muted text: "You can add more knowledge at any time from the Knowledge section."
- Bottom nav row: "Skip for now" link (left) + "Back" ghost button + "Continue" primary button (right)

Style: clean tabbed card, progress indicator that looks like it's mid-crawl, checklist rows with standard checkboxes, consistent with previous onboarding screens.

---

## PROMPT — Screen 8: Onboarding Step 6 — API & Webhook Setup

Design a full-screen onboarding step for a SaaS dashboard. At the top is the 7-step progress bar with Step 6 "API & Webhooks" active.

The main content area is a centered card (~720px wide) divided into two clearly separated sections with a horizontal divider between them.

SECTION A — "Your API Key":
- Section heading: "Your API Key" — semi-bold, 18px
- Description: "Use this to send customer data to Lira, create customer profiles, and trigger actions programmatically." — muted, small
- A read-only input field (full width, slightly tinted background) showing: "lira_live_xxxx••••••••••••••••" with three small icon buttons on the right side of the input: an eye icon (Reveal), a copy icon (Copy), and a refresh icon (Regenerate)
- A small text link: "View API Documentation →"
- A tab switcher with 3 tabs: "cURL" | "Node.js" | "Python" — "Node.js" tab is active
- A dark code block (dark grey/black background, rounded corners, monospace font) showing:
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
  with a "Copy" button in the top-right corner of the code block
- A toggle row at the bottom of this section: "Sandbox mode" (toggle OFF) with description: "Test without triggering real actions"

HORIZONTAL DIVIDER

SECTION B — "Proactive Support Webhook":
- Section heading: "Proactive Support Webhook" — semi-bold, 18px
- Description: "Send product events to this URL. When a payment fails, a KYC check stalls, or any event you define fires — Lira will reach out to the affected customer." — muted, small
- A read-only input showing: "https://api.creovine.com/support/webhook/org_xxxx" with a "Copy" button on the right
- An expandable section labeled "Expected payload format ▾" — shown in expanded state — containing a dark code block with JSON:
  ```
  {
    "event": "payment.failed",
    "customerId": "cust_abc123",
    "timestamp": "2026-04-06T14:32:00Z",
    "data": { "amount": 2000, "currency": "USD" }
  }
  ```
- A row with a button: "Send test event" (outlined button) and next to it a small success chip: "✓ Test received — 200 OK" in green

Bottom nav: "Back" ghost button + "Continue" primary button (right-aligned).

Style: developer-oriented onboarding screen. Dark code blocks with syntax highlighting style against the white card. Clean section separation. Same overall design system.

---

## PROMPT — Screen 9: Onboarding Step 7 — Test & Go Live

Design a full-screen onboarding step for a SaaS dashboard. At the top is the 7-step progress bar with Step 7 "Test & Go Live" active. This is the final step.

Page heading: "Everything looks good. Let's go live." with subheading: "Run a quick test to confirm Lira is ready." in muted text.

The main content area is a centered card (~720px wide) in two parts:

PART 1 — Setup Checklist:
A clean checklist table with two columns: left = item name, right = status. Show 9 rows:
- ✓ Email channel connected | support@yourcompany.com verified
- ✓ Chat widget configured | Embed code generated
- — Voice support | Skipped (this row uses a dash and grey text, not a checkmark)
- ✓ HubSpot connected | 1,204 contacts synced
- ✓ Linear connected | Workspace: YourCompany
- ✓ Slack connected | #support-escalations
- ✓ Knowledge base seeded | 48 pages, 3 docs, 1,240 chunks
- ✓ API key generated | Ready
- ✓ Webhook URL ready | Test event received successfully

Each ✓ row: green checkmark icon on the left, item name in dark text, status description in muted grey text on the right. The "Voice support — Skipped" row has a grey dash icon and all grey text.

PART 2 — Live Test Panel (below a divider):
- Heading: "Send a test email to confirm Lira is responding"
- Instruction text: "Send any email to support@yourcompany.com. Lira will reply within 30 seconds."
- A horizontal step indicator showing the test flow: "Waiting for email…" → "Email received" → "Lira composing…" → "Reply sent!" — The third step "Lira composing…" is the active/current state, shown highlighted with a spinner animation indicator
- A mock email preview card below: shows a sample inbound email on the left (white card, "From: test@yourcompany.com | Subject: Test") with an arrow pointing right to Lira's reply card (white card with a Lira AI icon, short reply text: "Hi there! Thanks for reaching out. I'm Lira, your support assistant…")

BOTTOM CTA:
- A large full-width primary button: "Activate Customer Support" in brand accent color, bold text
- A small grey text link below it: "Save and finish later"

Style: final onboarding step energy — checklist should feel complete and satisfying, live test panel has a sense of movement. Large CTA button should feel like a meaningful moment.

---

## PROMPT — Screen 10: Support Home Dashboard

Design a full-page SaaS dashboard screen for the "Support" home section of an AI platform called Lira. The left sidebar is visible (240px dark sidebar as previously designed — with Support > Inbox as the active item). The main content area is the full remaining width.

MAIN CONTENT AREA layout: top stats bar spanning full width, then a 3-column grid below it.

TOP STATS BAR — 4 equal-width metric cards in a horizontal row, each with a light background and border:
- Card 1: "Open Inbox" | large number "12" | small subtitle "3 urgent" in red
- Card 2: "Resolved Today" | large number "47" | small stat "↑ 12% vs. avg" in green with an up arrow
- Card 3: "Proactive Sent Today" | large number "8" | small subtitle "4 triggered by events"
- Card 4: "Escalated — Awaiting Agent" | large number "2" | subtitle in orange "Needs attention"

THREE COLUMNS BELOW (equal width, full remaining page height):

LEFT COLUMN — "Recent Activity":
- Column heading: "Recent Activity"
- A vertical list of 5 activity feed items, each on its own row with a left icon, description text, and right-aligned timestamp:
  - Green checkmark icon: "Lira resolved email from jana@finco.com — Payment question" | "2 min ago"
  - Purple lightning icon: "Proactive outreach sent to 3 customers — payment.failed event" | "5 min ago"
  - Orange alert icon: "Escalated: Daniel Roy — Compliance hold, assigned to @Sarah" | "12 min ago"
  - Blue star icon: "Knowledge base updated — 1 new entry auto-approved" | "1 hr ago"
  - Green checkmark icon: "Lira resolved chat from mike@startup.io — API question" | "1 hr ago"
- A small text link at the bottom: "View all activity →"

CENTER COLUMN — "Inbox Preview":
- Column heading: "Inbox Preview"
- 5 compact conversation rows, each showing: a channel icon (email envelope or chat bubble), customer name in bold, subject line in grey, time on the right, and a status badge:
  - jana@finco.com | "Payment retry question" | 2m | "Open" blue badge
  - daniel.roy@corp.com | "Transfer stuck — 3 days" | 12m | "Escalated" orange badge
  - sarah@techco.io | "API error 4023" | 1h | "Resolved ✓" green badge
  - mark@fintech.com | "KYC document upload" | 2h | "Pending CSAT" grey badge
  - hello@crypto.io | "Account limit question" | 3h | "Resolved ✓" green badge
- A "Open Inbox →" button (outlined, full width of column) at the bottom

RIGHT COLUMN — "Alerts & Quick Actions":
- Sub-section heading: "Alerts"
  - Two yellow/amber alert cards stacked:
    - "2 escalations waiting for agent assignment" | "Review →" link
    - "3 knowledge drafts awaiting your approval" | "Review →" link
- Sub-section heading: "Quick Actions" (below the alerts)
  - 4 icon button rows, each with an icon on the left and label:
    - Lightning bolt icon: "New Trigger"
    - Book icon: "Add Knowledge"
    - Chart icon: "View Analytics"
    - Chat icon: "Test Lira"
- Sub-section heading: "Resolution Rate" (bottom of right column)
  - A medium-sized donut chart: 74% green (autonomous) + 26% yellow (escalated)
  - Legend below: "74% autonomous | 26% escalated"
  - Small green note: "This week's target: 70% ✓"

Style: full dashboard layout, dark sidebar on left, light main content area. Metric cards with clean numbers. Activity feed feels live. Donut chart is clear and minimal. Same Inter font, same design system as onboarding screens.

---

## PROMPT — Screen 11: Inbox — Conversation List

Design a full-page SaaS dashboard screen for the Inbox section of an AI platform called Lira. The dark left sidebar is visible with "Support > Inbox" as the active nav item. The main content area uses a 3-column layout spanning the full page width.

COLUMN 1 — LEFT FILTER PANEL (~220px, light grey background, full height):
- A search input at top: placeholder "Search by name, email, topic…"
- Below the search, grouped filter sections with small section labels and checkbox or toggle options:
  - "STATUS" label: rows for All (selected), Open, Resolved, Escalated, Pending CSAT
  - "CHANNEL" label: rows for All (selected), Email (envelope icon), Chat (bubble icon), Voice (phone icon)
  - "ASSIGNEE" label: Lira AI, Sarah K., Unassigned
  - "DATE RANGE" label: Today (selected), This week, This month, Custom
  - "TAG" label: Billing, KYC, Technical, Fraud, General
- Sort dropdown at bottom: "Newest first"

COLUMN 2 — MAIN CONVERSATION LIST (~55% of remaining width):
- A top bar with: heading "Inbox" on the left + total count "47 conversations" in muted text + "Bulk select" checkbox on the right
- List of 8 conversation rows. Each row:
  - A small channel icon (email/chat/phone) on the far left
  - Customer name (bold if unread) + truncated email below in grey
  - Subject/topic auto-label in the middle (e.g. "Payment retry question", "Transfer stuck", "API error 4023")
  - Status badge on the right: Open (blue) | Resolved ✓ (green) | Escalated (orange) | Awaiting (grey)
  - Timestamp far right: "2m", "12m", "1h" etc.
  - "Lira handled" small grey tag below status for AI-resolved rows
  - Unread rows have a bold name, slightly brighter background, and a colored left border accent (blue)
  - The 2nd row (Daniel Roy — escalated) has an orange left border
  - Show a bulk-select checkbox that appears on hover (one row showing it hovered)

COLUMN 3 — RIGHT PREVIEW PANE (~30% width, light background, full height):
- When a row is selected (first row — jana@finco.com), the right pane shows a message preview:
  - Header: customer name "Jana Fischer" + email icon chip + "Open" status badge
  - Last 2 message bubbles: customer message on left ("Hi, I tried to retry my payment but it still says failed"), Lira reply on right in a slightly tinted bubble ("Hi Jana! I can see your last payment attempt for $450 was declined due to…")
  - Below Lira's reply: small muted chip "AI-generated | Grounded in: Payment FAQ"
  - A button at the bottom: "Open full conversation →" (full width, outlined)

Style: 3-column inbox layout similar to Gmail or Linear. Clean, information-dense but not cluttered. Left filter panel lighter grey, center list white, right preview pane very light. Consistent status badge colors throughout.

---

## PROMPT — Screen 12: Inbox — Conversation Detail (AI Handled)

Design a full-page SaaS dashboard screen showing a single open conversation in the Lira Customer Support inbox. The dark sidebar on the left shows "Support > Inbox" as the active item.

The main content area uses a 2-column layout:

HEADER BAR (full width, above both columns):
- A left-pointing back arrow + label "Back to Inbox"
- Center: customer name "Jana Fischer" + a small email icon chip
- Right: a "Resolved ✓" status badge in green, then action buttons: "Reopen" (ghost) | "Export" (ghost) | "View Customer Profile →" (text link in brand color)

LEFT COLUMN — MAIN THREAD (~65% width, scrollable):
Shows a conversation thread with message bubbles:
- MESSAGE 1 (customer, left-aligned): Avatar circle with initials "JF" in grey + name "Jana Fischer" + timestamp "Today 2:14 PM" — bubble text: "Hi, I tried to retry my payment three times but it keeps failing. The amount is $450. Can someone help?"
- MESSAGE 2 (Lira, right-aligned): Small Lira AI icon (a small logo/star) + label "Lira" + timestamp "Today 2:14 PM (22s later)" — bubble in a light brand-tinted background: "Hi Jana! I looked into this for you. Your last three payment attempts for $450 were declined with code insufficient_funds. Here are the steps to resolve this: [1] Check your card balance… [2] Try a different payment method… [3] If the issue persists, reply here and I'll escalate immediately." — Below the bubble: a small muted attribution chip: "AI-generated | Grounded in: Payment Troubleshooting Guide"
- MESSAGE 3 (customer, left-aligned): Same "JF" avatar — bubble: "Thank you! I tried a different card and it worked."
- MESSAGE 4 (Lira, right-aligned): "Great news Jana! I've updated your account and logged this as resolved. Is there anything else I can help you with?" — attribution chip below: "AI-generated | Grounded in: Payment FAQ"
- BOTTOM of thread: a green card: "This conversation is resolved. CSAT: ★★★★☆ 4/5"

RIGHT COLUMN — INTERACTION SUMMARY SIDEBAR (~35% width, light grey background, full height):
A clean summary panel with labeled rows:
- Section heading: "Conversation Summary"
- "Customer": "Jana Fischer | jana@finco.com"
  - Below: "Standard tier | Churn Risk: Low — 12" with a small green pill
  - Link: "View full profile →"
- "Resolved in": "22 seconds"
- "Channel": Email icon + "Email"
- "Lira's actions taken": a collapsible list showing 2 items with small icons:
  - "Queried HubSpot contact record ✓"
  - "Grounded reply in [Payment Troubleshooting Guide] ✓"
- "Knowledge used":
  - "Payment Troubleshooting Guide"
  - "Payment FAQ"
- "CSAT": 4 filled gold stars + 1 empty star
- "Tags": two tag chips — "Billing" and "Resolved autonomously"

Style: clean conversation UI, message bubbles similar to a chat product (left for customer, right for AI). Right sidebar feels like a compact info panel. The AI attribution chip is small and subtle. Resolved state feels complete and satisfying with the green resolved bar at the bottom.

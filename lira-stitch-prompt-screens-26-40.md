# Google Stitch Prompt — Lira Customer Support: Screens 26–40

Paste each block below as a separate Stitch prompt, one screen at a time.

---

## PROMPT — Screen 26: Proactive Trigger Wizard — Step 4: Channel & Timing

Design a full-page modal/wizard screen for Step 4 of the proactive trigger creation flow in Lira Customer Support. Same wide modal format (~780px wide white card, dashboard blurred/dimmed behind). 

AT THE TOP of the modal:
- Modal heading: "New Proactive Trigger — Payment Failed – Fintech Retry"
- 5-step progress bar: Steps 1, 2, 3 have green checkmarks (completed) | Step 4 "Channel & Timing" is active/filled | Step 5 "Test" is grey

STEP HEADING:
- "How and when should Lira reach out?" (bold, 22px)
- Subheading: "Choose the channel Lira uses to contact the customer, and set timing rules to avoid over-messaging." in muted grey

SECTION: "Channel" — section label in small caps:
A horizontal 3-option radio group, each option is a large selectable card (~200px wide) with an icon, label, and description:
- CARD 1 (SELECTED — filled border, light background tint): Email icon · "Email" · "Send personalized email via your support address"
- CARD 2: Phone icon · "Voice call" · "Lira calls the customer using Nova Sonic AI voice"
- CARD 3: Split icon (email + phone) · "Email first, then voice" · "Email first. If no reply in X hours, Lira calls." — show this option has an extra sub-field when selected: "Escalate to voice after: [2] hours" (a small input, currently inactive/greyed since it's not selected)

SECTION: "Timing" — section label:
A radio group of 3 options (stacked vertically):
- Option 1 (SELECTED): "Send immediately when the event fires" — radio selected, muted description below: "Lira reaches out as soon as the webhook event arrives"
- Option 2: "Wait [__] minutes after the event fires" — radio unselected + an inline number input field (showing "10" placeholder, currently inactive/greyed): "Avoids firing for events that auto-resolve in seconds"
- Option 3: "Only during business hours" — radio unselected + a collapsed time-range row showing "Mon–Fri, 9:00 AM – 6:00 PM EST" in a pill chip (greyed/inactive since not selected)

SECTION: "Frequency limits" — section label:
Two rows of controls:
- Row 1: "Don't re-fire for the same customer within" + inline number input "72" + dropdown "hours" — description: "Prevents the same customer from getting repeated messages for recurring events"
- Row 2: "Never send more than" + inline number input "3" + "proactive messages per" + dropdown "week" + "per customer"

SECTION: "Reply monitoring" — section label:
A single toggle row:
- Toggle (ON, green): "After sending, monitor for reply and continue the conversation"
- Description below in muted text: "If the customer replies, Lira picks up the conversation, logs it in the Inbox, and adds it to their Customer Profile."

MODAL FOOTER:
- "← Back" ghost button
- "Cancel" ghost text link
- "Continue →" primary filled button

Style: this screen is about controls and options — it should feel precise and configurable without being overwhelming. The 3 channel cards at the top make the most important decision visual and clickable. The timing radio group below uses a conservative, readable stacked layout. All inactive sub-fields (the voice fallback hours, the wait-minutes input, the business hours picker) appear greyed out to show they only activate when the parent option is selected.

---

## PROMPT — Screen 27: Proactive Trigger Wizard — Step 5: Test

Design a full-page modal/wizard screen for Step 5 (the final step) of the proactive trigger creation flow in Lira Customer Support. Same wide modal format (~780px wide, dashboard blurred behind).

AT THE TOP of the modal:
- Modal heading: "New Proactive Trigger — Payment Failed – Fintech Retry"
- 5-step progress bar: Steps 1–4 all have green checkmarks (completed) | Step 5 "Test" is active/filled

STEP HEADING:
- "Test before activating." (bold, 22px)
- Subheading: "Simulate an event to confirm your trigger fires correctly. Nothing will actually be sent." in muted grey

THE SCREEN is a TWO-COLUMN layout inside the modal:

LEFT COLUMN — TEST INPUT (~45% width):
- Section heading: "Simulate a test event" in small caps grey
- A dark code editor block (same style as Screen 8 / Screen 25 — dark background, monospace font, ~240px tall) pre-populated with a JSON payload:
```
{
  "event": "payment.failed",
  "customerId": "cust_abc123",
  "timestamp": "2026-04-06T14:32:00Z",
  "data": {
    "amount": 750,
    "currency": "USD",
    "failureCode": "insufficient_funds"
  }
}
```
- Small note below the code block: "Edit any field to test different scenarios."
- A large "Fire Test Trigger →" button below the code block (filled, brand accent color, full width of this column) — with a small shield/test-tube icon on the left

RIGHT COLUMN — TEST RESULTS (~55% width):
A white card with a light background. Shows the live test output — all items showing success (since test passed):

Section heading: "Test Results" — with a green "✓ Test passed" pill badge on the right

Vertical checklist of test result rows, each on its own line:
- GREEN ROW ✓: "Event received" — right: "200 OK in 84ms"
- GREEN ROW ✓: "Conditions evaluated" — right: small collapsible ▾ showing: "amount > 500: ✓ PASS (750) | tier is not enterprise: ✓ PASS"
- GREEN ROW ✓: "Customer matched" — right: "Jana Fischer <jana@finco.com>"
- GREEN ROW ✓: "Template rendered" — right: "View rendered email ▾" (shown expanded below):
  - An indented mini-card showing the rendered email preview — small version: Subject: "Action needed: Your payment didn't go through" | Body: "Hi Jana, We noticed your recent payment of $750 USD didn't go through…"
- YELLOW INFO ROW ⚠: "Outreach" — right: "NOT sent — this is a test mode" (muted yellow, safety reassurance)

Below the results checklist: a green summary card with a large green checkmark icon and bold text: "Test passed. Your trigger is ready to activate."

MODAL FOOTER:
- "← Back" ghost button (far left)
- "Save as draft" ghost button (center-left)
- "Activate Trigger" primary filled button (right, green — communicating "go live")

Style: the two-column layout makes this feel like a developer test console — code payload on the left, live output streaming in on the right. The results should look like a checklist of CI/CD green checkmarks — each line passing. The yellow "NOT sent" safety row is important — it reassures the user that this was truly just a simulation. The green "Test passed" summary card at the bottom of the results column is the reward moment.

---

## PROMPT — Screen 28: Proactive Outreach Activity Log

Design a full-page SaaS dashboard screen for the Outreach Log view in the Proactive section of Lira Customer Support. The dark sidebar on the left shows "Support > Proactive" as active.

PAGE HEADER (full width):
- Left: "Proactive Triggers" heading + a tab bar below: "Triggers" | "Outreach Log" (current, active/underlined)
- Right: a date range picker showing "Last 7 days ▾"

FILTER BAR (below the header, full width row):
- Filter chips in a horizontal row: "Trigger: All ▾" | "Channel: All ▾" | "Outcome: All ▾" — each a small dropdown pill
- Right side: "Export CSV" ghost button

STATS SUMMARY ROW (below filter bar, 4 compact stat chips in a light grey row band):
- "47 outreaches sent" | "81% delivered" | "38 replies received" | "18 tickets prevented ✓"

MAIN DATA TABLE (full width below the stats row):

TABLE HEADER ROW (column labels, grey background):
Timestamp | Customer | Event Type | Channel | Template Used | Delivery | Reply? | Outcome

Show 8 data rows. Each row is full width with alternating very subtle grey/white row backgrounds:

ROW 1:
- "Apr 6, 2:10 PM" | "Jana Fischer" (with small avatar initials "JF") | "payment.failed" code chip | ✉ Email icon | "Payment Failed – Retry Prompt" | "Sent ✓" green chip | "Replied ✓" green text with "View →" link | "Ticket prevented" green chip

ROW 2:
- "Apr 6, 1:44 PM" | "Daniel Roy" ("DR") | "payment.failed" | ✉ Email | "Payment Failed – Retry Prompt" | "Sent ✓" | "No reply yet" grey text | "Conversation open" blue chip

ROW 3:
- "Apr 6, 11:20 AM" | "Sarah Chen" ("SC") | "kyc.blocked" | ✉ Email | "KYC Blocked – Document Request" | "Sent ✓" | "Replied ✓" with "View →" | "Ticket prevented" green chip

ROW 4:
- "Apr 5, 4:05 PM" | "Mark Adeyemi" ("MA") | "fraud.flagged" | 📞 Voice icon | "Suspicious Transaction – Auth Check" | "Sent ✓" | "Answered ✓" | "Ticket prevented" green chip

ROW 5:
- "Apr 5, 2:33 PM" | "Elena Petrov" ("EP") | "payment.failed" | ✉ Email | "Payment Failed – Retry Prompt" | "Sent ✓" | "No reply" grey/closed text | "No engagement" grey chip

ROW 6:
- "Apr 4, 9:15 AM" | "Kwame Asante" ("KA") | "subscription.expiring" | ✉ Email | "Subscription Expiring – Renewal" | "Sent ✓" | "Replied ✓" with "View →" | "Ticket prevented" green

ROW 7:
- "Apr 4, 8:00 AM" | "Priya Nair" ("PN") | "kyc.blocked" | ✉ Email | "KYC Blocked – Document Request" | "Failed ✗" red chip | "—" | "Not delivered" red/muted chip

ROW 8:
- "Apr 3, 3:50 PM" | "Tom Bakker" ("TB") | "payment.failed" | ✉ Email | "Payment Failed – Retry Prompt" | "Sent ✓" | "Replied ✓" with "View →" | "Ticket prevented" green

RIGHT SIDE PANEL (slides in when ROW 1 is clicked, ~320px wide, overlapping or docked on the right):
- Panel heading: "Outreach Detail — Jana Fischer"
- "Sent via: Email · Apr 6, 2:10 PM"
- "Trigger: Payment Failed – Retry Prompt"
- Full rendered message preview (white card with subject + body text, compact)
- Customer reply preview (light grey bubble): "Hi! I retried with a different card — all sorted."
- "View full conversation →" link
- "Actions taken by Lira after reply": "Conversation resolved · HubSpot updated ✓"
- Close (×) button top-right of panel

TABLE FOOTER: "Showing 1–8 of 47" pagination row.

Style: data table with deliberate color coding — the Outcome column is the most important column visually. "Ticket prevented" in green should feel like a win. "Failed" and "No engagement" rows are muted/grey. The slide-in detail panel gives full context without navigating away. Event type code chips (payment.failed) use the same monospace chip style as the trigger screens.

---

## PROMPT — Screen 29: Knowledge Base — Document Library

Design a full-page SaaS dashboard screen for the Knowledge Base section of Lira Customer Support. The dark sidebar on the left shows "Support > Knowledge" as the active item. The main content uses a left filter panel and a main document area.

LEFT FILTER PANEL (~220px, light grey background, full height):
- Search input at top: "Search in knowledge base…"
- Section label "SOURCE TYPE": radio/checkbox rows — All (selected), Website pages (globe icon), Uploaded files (file icon), Manual entries (pencil icon), AI-drafted approved (Lira star icon)
- Section label "STATUS": All (selected), Active, Archived
- Section label "TAG": rows for Billing, Compliance, Technical, Onboarding, Product, Other (checkboxes)

MAIN CONTENT AREA (remaining width):

TOP BAR:
- Left: "Knowledge Base" heading (bold 22px) + "1,847 chunks · Last indexed: 2 hours ago" in muted small text
- Right: a "Re-index all" outlined button + a dropdown button "Add Knowledge +" (primary, filled) — with dropdown showing: "Crawl webpage" | "Upload file" | "Write manually" | "Import from Google Drive"
- Below the top bar: a view toggle (grid icon | list icon) — grid is selected

DOCUMENT CARD GRID (3 columns, showing 9 document cards):

CARD 1 — "Payment Troubleshooting Guide" (website page):
- Top: globe icon (source) + "Website page" label tag
- Title: "Payment Troubleshooting Guide" (bold)
- Meta row: "24 knowledge chunks · Added March 10, 2026"
- Tags: "Billing" blue pill + "Technical" grey pill
- Status: "Active" green dot + "Active" text
- Action icons row (bottom): View | Edit | Re-index | ⋯ (more: Archive / Delete)

CARD 2 — "KYC Document Requirements" (uploaded file):
- File icon (PDF) + "Uploaded file" tag
- "KYC Document Requirements v3.pdf"
- "18 chunks · Added Feb 22"
- Tags: "Compliance" orange pill
- Status: Active
- Action icons

CARD 3 — "Refund Policy" (manual entry):
- Pencil icon + "Manual entry" tag
- "Refund Policy"
- "6 chunks · Updated Apr 1"
- Tags: "Billing" blue
- Status: Active

CARD 4 — "API Error Code Reference" (AI-drafted, approved):
- Lira star icon + "AI-drafted ✓" tag (slight purple tint on the tag)
- "API Error Code Reference"
- "31 chunks · AI-drafted Apr 5, approved Apr 6"
- Tags: "Technical" grey
- Status: Active · "AI-drafted" label in small purple text

CARD 5 — "Account Settings Help" (website page):
- Globe icon, Active, 12 chunks

CARD 6 — "Fraud & Security FAQ" (uploaded file):
- File icon, Active, 9 chunks, "Compliance" + "Billing" tags

CARD 7 — "Pricing & Plans" (website page):
- Globe icon, Active, 7 chunks, "Product" tag

CARD 8 — "Onboarding Checklist" (manual entry):
- Pencil icon, Active, 4 chunks, "Onboarding" tag

CARD 9 — "Old Terms of Service (2024)" (uploaded file):
- File icon + "Archived" grey chip (status) — the entire card has a grey/muted appearance to show it's archived
- Action icons show "Restore" instead of Edit

Below the grid: "Showing 9 of 23 documents · Load more"

Style: card grid knowledge management UI. Each card clearly signals its source type via the icon and label tag. AI-drafted entries have a subtle purple visual identity (icon + tag) to distinguish them from human-authored content. Archived cards are visually muted. The "Add Knowledge +" dropdown button is the primary action and should be prominent in the top bar.

---

## PROMPT — Screen 30: Knowledge Base — AI Draft Queue

Design a full-page SaaS dashboard screen for the AI Draft Queue in Lira Customer Support's Knowledge Base section. The dark sidebar on the left shows "Support > Knowledge" as active.

PAGE HEADER (full width):
- Navigation breadcrumb: "Knowledge Base / AI Draft Queue"
- Left: heading "AI-Drafted Knowledge Entries" (bold 22px) + a count badge pill: "7 pending" (amber/yellow background)
- Below the heading: an explanation note in muted text: "After Lira couldn't answer a question, she drafted these entries. Each review takes about 30 seconds."
- Right: "Approve all with 90%+ confidence" button (outlined, with a bolt/AI icon) — this is a batch action

FILTER/SORT BAR (below header):
- Left: filter chips: "Confidence: All ▾" | "Tag: All ▾"
- Right: Sort: "Newest first ▾"

DRAFT ENTRY CARDS (full width, single column stacked vertically, 3 visible cards):

CARD 1:
- TOP ROW: "What to do when API error code 4023 occurs" (bold title, 18px) + right-aligned confidence chip: "91% confident" in green
- SECOND ROW: Draft body text (4 lines shown, then fade-out): "API error code 4023 indicates a temporary rate limit on outbound transactions. This typically resolves within 15 minutes. To resolve immediately: [1] Wait 15 minutes and retry. [2] If the issue persists after 30 minutes, contact your account manager. [3] For urgent cases, use the manual override in your dashboard under Settings > API…"
- A "Read more ▾" text link at the end of the truncated body
- THIRD ROW: left: smaller label "Why Lira drafted this:" + text "Escalated 3 times in the last 7 days — customers ask about this but it's not in your docs" in muted italic — right: "[3 conversations] →" link in brand color (shows the source chats)
- FOURTH ROW: "Suggested tags:" + 2 editable tag chips: "Technical" (grey) + "API" (grey) + a small "+ Add tag" link
- FIFTH ROW: a light grey divider line
- BUTTON ROW (bottom of card, 3 side-by-side buttons):
  - "Approve & Publish" — filled green primary button (most prominent)
  - "Edit then Publish" — outlined secondary button
  - "Reject" — plain text button in muted red/grey

CARD 2:
- Title: "International wire transfer limits — what customers need to know"
- Confidence: "87% confident" in yellow/amber (below 90% threshold)
- Draft body (truncated): "International wire transfers are subject to SWIFT network limits of $50,000 per transaction for individual accounts and $250,000 for business accounts. Processing time…"
- "Why drafted": "Asked 7 times in 5 days — no matching knowledge base entry found"
- "[7 conversations] →" link
- Tags: "Compliance" + "Billing"
- Same 3 action buttons

CARD 3:
- Title: "KYC document requirements for non-resident accounts"
- Confidence: "94% confident" green
- Draft body (truncated): "Non-resident account holders are required to submit: [1] Valid passport [2] Proof of address (less than 3 months old) [3] Tax identification number from country of residence…"
- "Why drafted": "Escalated 5 times — KYC team has not documented the non-resident flow"
- "[5 conversations] →" link
- Tags: "Compliance" + "KYC"
- Same 3 buttons

BOTTOM: "Showing 3 of 7 drafts · Load more 4 →" text at bottom

Style: these draft cards are the core of this screen. The card layout should feel like a review queue — each card presenting just enough to make a decision WITHOUT requiring the reviewer to open anything. The 3-button row at the bottom of each card (Approve & Publish / Edit then Publish / Reject) should be clean, unambiguous, and appropriately weighted: green primary > outlined secondary > muted destructive. The confidence score chip is the first thing to scan. Cards with 90%+ confidence should feel "safe to approve"; cards below 90% are slightly visually cautious (amber chip).

---

## PROMPT — Screen 31: Knowledge Base — Review Entry (Edit Flow)

Design a full-page SaaS dashboard screen for the Edit Entry flow in Lira Customer Support's Knowledge Base. This screen appears when a user clicks "Edit then Publish" on a draft card from Screen 30. The dark sidebar shows "Support > Knowledge" as active.

PAGE HEADER:
- Breadcrumb: "Knowledge Base / AI Draft Queue / Edit Entry"
- Left: page heading "Edit & Publish Knowledge Entry" (bold, 22px)
- Right: three action buttons: "Save draft" (ghost) | "Discard" (ghost, red text) | "Publish" (primary filled green, bold)

TWO-COLUMN LAYOUT (main content):

LEFT COLUMN — EDITOR (~60% width):

TITLE INPUT:
- Label: "Title"
- Large text input field (full width, prominent): showing "API Error Code Reference — Code 4023"

TAGS INPUT:
- Label: "Tags"
- A multi-select tag input row showing 2 added tags as chips: "Technical" (×) + "API" (×) + a "+ Add tag" ghost pill input

BODY — RICH TEXT EDITOR:
- A rich text editor toolbar row: B | I | U | H1 | H2 | Numbered list | Bullet list | Link | Blockquote — all small icon buttons
- Editor area (~300px tall, white, has a subtle border) containing the pre-filled AI draft text:
  "API error code 4023 indicates a temporary rate limit on outbound transactions. This typically resolves within 15 minutes.

  **To resolve immediately:**
  1. Wait 15 minutes and retry the transaction.
  2. If the issue persists after 30 minutes, contact your account manager using the support chat.
  3. For urgent cases, use the manual override in your dashboard under **Settings > API > Rate Limits**.

  This error does not affect customer account balances or pending transactions."

SOURCE CONVERSATIONS SECTION (below the editor):
- Label: "Source conversations (read-only)" in small caps grey
- 3 read-only chip rows, each showing: a chat/email icon + customer name + date + "View →" link:
  - Email icon · "Daniel Roy — Apr 3, 2026" · "View →"
  - Chat icon · "Mark Adeyemi — Apr 1, 2026" · "View →"
  - Email icon · "Priya Nair — Mar 29, 2026" · "View →"

AI CONTEXT NOTE (below source conversations):
- A subtle light blue/tinted info card: small Lira star icon + "Lira used these 3 documents as context when drafting this entry:" + 3 linked document names: "Payment Troubleshooting Guide" · "API Rate Limit Policy (internal)" · "Account Settings Help" — all as text links

RIGHT COLUMN — LIVE PREVIEW (~40% width, light grey background, border on left):

PREVIEW PANEL HEADING: "How Lira will use this" with a chat bubble icon

A simulated mini conversation showing how Lira would answer with this entry:
- Customer message (left-aligned bubble, grey): "I'm getting API error 4023 — what does it mean?"
- Lira response (right-aligned bubble, brand tinted): "API error 4023 is a temporary rate limit on outbound transactions. It typically resolves in 15 minutes. To fix it right away, wait 15 minutes and retry — or if it's urgent, go to Settings > API > Rate Limits to use the manual override. Your account balance is not affected."
- Below Lira's reply bubble: "Grounded in: API Error Code Reference — Code 4023" attribution chip

Below the preview conversation, a small info note: "This is how Lira would answer today. Edit the entry on the left to change what she says."

SECTION below preview: "Confidence after edit" — a simple gauge:
- Before: "91% confidence"
- Arrow →
- After editing: "91% confidence" (same, since the edit was minor) — green label "No change"

FOOTER: "Last edited 2 minutes ago · AI draft · Not yet published"

Style: two-panel editor with the draft content on the left and the simulated Lira answer on the right. The right panel is the most unique element — it transforms the abstract "edit a knowledge entry" task into a tangible "here is exactly how Lira will answer customers using this." The source conversations section and AI context note at the bottom of the left panel give reviewers full traceability of where this draft came from.

---

## PROMPT — Screen 32: Knowledge Base — Manual Entry Editor

Design a full-page SaaS dashboard screen for the Manual Knowledge Entry editor in Lira Customer Support. The dark sidebar shows "Support > Knowledge" as active. This screen appears when a user clicks "Write manually" from the "Add Knowledge +" dropdown.

PAGE HEADER:
- Breadcrumb: "Knowledge Base / New Manual Entry"
- Left: page heading "Write a Knowledge Entry" (bold, 22px)
- Subheading: "Write anything Lira should know to answer customer questions. Be specific — the more detail, the better Lira's answers." in muted grey
- Right: "Save draft" (ghost) | "Discard" (ghost, muted red) | "Publish" (primary filled green)

TWO-COLUMN LAYOUT (same structure as Screen 31):

LEFT COLUMN — EDITOR (~60% width):

TITLE INPUT:
- Label: "Title" + helper text: "Be descriptive — this becomes a searchable document name"
- Text input, empty, placeholder: "e.g. 'Refund policy for subscription plans'"

TAGS INPUT:
- Label: "Tags" + helper text: "Add tags to help organize and filter your knowledge base"
- Empty multi-select tag input with placeholder "+ Add tag": shows suggested tag pills below in grey: "Billing" · "Compliance" · "Technical" · "Onboarding" · "Product"

BODY — RICH TEXT EDITOR (empty, larger area ~360px):
- Same toolbar as Screen 31 (B | I | U | H1 | H2 | lists | link | blockquote)
- Empty editor area with a placeholder prompt in muted italic: "Write the answer Lira should give when a customer asks about this topic. You can use headers, bullet lists, and bold text to structure the answer."

AUDIENCE SECTION (below the editor, unique to manual entries):
- Label: "Who is this for?" — small caps grey, optional badge
- A short description: "Optionally scope this entry to specific customer groups. Lira will only use it when helping customers that match."
- Three checkbox rows:
  - ☑ All customers (default checked)
  - ☐ VIP tier only
  - ☐ Enterprise tier only
- A tag input below: "Product area (optional)" + placeholder "+ Add product area tag"

RIGHT COLUMN — LIVE PREVIEW (~40%, light grey background):

PREVIEW PANEL HEADING: "How Lira will use this" with a chat bubble icon

Empty/placeholder state — since nothing has been typed yet:
- A muted illustration (simple, e.g. a blank document + a small AI star icon)
- Text: "Start writing on the left to see how Lira would answer using this entry."
- Muted subtext: "The preview updates live as you type."

Below the placeholder, a grayed-out confidence note: "Confidence score: Available after publishing"

TIPS SECTION (below preview placeholder):
- Small card with a light yellow background:
  - Heading: "Tips for writing great knowledge entries"
  - 3 bullet points in small text:
    - "Write in first-person plural: 'Our refund policy allows…'"
    - "Include specific numbers, timeframes, or amounts when relevant"
    - "If there are exceptions, list them clearly — Lira handles nuance well"

FOOTER: "New entry not yet saved"

Style: clean blank-slate editor. The contrast with Screen 31 (which was pre-filled with AI content) should be clear — this screen starts entirely empty and invites the human to write. The right column's placeholder state should feel helpful and encouraging, not broken. The "Who is this for?" audience section is the unique element that doesn't appear in Screen 31 — it should feel optional and lightweight (not a mandatory gating step).

---

## PROMPT — Screen 33: Knowledge Base — Gap Report

Design a full-page SaaS dashboard screen for the Knowledge Gap Report in Lira Customer Support's Knowledge Base section. The dark sidebar shows "Support > Knowledge" as active. This is a reporting/analytics view about what Lira couldn't answer.

PAGE HEADER (full width):
- Left: "Knowledge Gap Report" heading (bold, 22px) + "Week of April 6, 2026" in grey subtitle
- Right: date range picker "This week ▾" + "Export report" ghost button

TOP METRICS ROW — 3 stat cards (full width, horizontal row):
- CARD 1: "Coverage Rate" | large "84%" in dark text | progress bar below (green for 84%, red for remaining 16%) | subtitle: "84% of questions answered from knowledge base"
- CARD 2: "Unanswerable Questions" | large "47" | subtitle "16% of total volume this week" in muted text | a small red down-arrow chip: "↑ 3 new gaps vs. last week"
- CARD 3: "New Gaps Identified" | large "7" | subtitle "Lira has drafted entries for all 7" in green text | a button chip: "Review drafts →" (text link in brand color)

"TOP UNRESOLVED TOPIC THIS WEEK" HIGHLIGHT CARD (below metrics, full width, light amber/yellow background card):
- Left: a magnifying glass / alert icon
- Text: "Most-asked unanswered topic: API error codes — asked 11 times this week by 8 different customers"
- Right: "→ Review draft" action link in brand color

RANKED GAP TABLE (full width below the highlight card):

TABLE HEADING ROW: "Top Knowledge Gaps" (semi-bold) + sub-caption "Click any row to see the customer conversations that asked about it"

Column headers: Rank | Topic | Times Asked | Top Customer | Status | Action

TABLE ROWS (8 rows shown):

ROW 1:
- Rank: "1" (in a bold circle)
- Topic: "API error code 4023" — with a small "Technical" grey tag
- Times Asked: "11" (bold + a small bar indicator fill)
- Top Customer: "Daniel Roy, Mark Adeyemi +6 more"
- Status: "Draft pending review" — amber chip
- Action: "Review draft →" text link in brand color

ROW 2:
- "2" | "International wire transfer limits" | "7" | "Elena Petrov +6" | "No draft yet" — grey chip | "Ask Lira to draft →" outlined button (small, compact — the CTA is unique to this row because no draft exists yet)

ROW 3:
- "3" | "KYC requirements for non-residents" | "5" | "Priya Nair +4" | "Draft pending review" amber | "Review draft →"

ROW 4:
- "4" | "Dispute resolution timeline" | "4" | "Tom Bakker +3" | "No draft yet" grey | "Ask Lira to draft →" button

ROW 5:
- "5" | "API sandbox environment setup" | "3" | "Kwame Asante +2" | "Draft pending review" amber | "Review draft →"

ROW 6:
- "6" | "Account closure process" | "2" | "Jana Fischer +1" | "No draft yet" grey | "Ask Lira to draft →"

ROW 7:
- "7" | "Business account upgrade requirements" | "2" | "Sarah Chen +1" | "Draft pending review" amber | "Review draft →"

ROW 8:
- "8" | "Currency conversion fees" | "2" | "Daniel Roy +1" | "No draft yet" grey | "Ask Lira to draft →"

SIDE PANEL (slides in when ROW 1 is clicked, ~360px wide):
- Heading: "Conversations asking about API error code 4023"
- 3 conversation preview cards stacked: customer name + date + brief message excerpt + "View conversation →" link
- Bottom: "This gap inspired 1 AI draft → [Review it]"

BOTTOM NOTE: "Lira identifies gaps automatically after every escalated conversation. Resolve gaps to lower your escalation rate over time."

Style: this is an analytics + action screen. The ranked table is the core — it should feel like a prioritized to-do list for the knowledge admin. The rank column (bold numbered circles) gives it a clear "most important first" hierarchy. The Status column differentiates "has a draft" (amber — just needs review) from "no draft yet" (grey — needs one click to create). "Ask Lira to draft →" buttons are small and inline to make generating a draft feel effortless.

---

## PROMPT — Screen 34: Action Engine — Action Chain Visualizer

Design a full-page SaaS dashboard screen for the Action Chain Visualizer in Lira Customer Support's Actions section. The dark sidebar shows "Support > Actions" as active.

PAGE HEADER (full width):
- Left: "Action Engine" heading + a tab bar below: "Action Chains" (active/underlined) | "Approval Queue" | "History" | "Integration Health"
- Right: a date range picker "Today ▾"

TWO-COLUMN LAYOUT (main content):

LEFT COLUMN — RECENT ACTION CHAINS LIST (~30% width, light grey background, full height):

Column heading: "Recent Action Chains" (semi-bold, 14px)

A scrollable list of 6 entries. Each entry is a compact row with:
- Customer name (bold) + tiny channel icon
- Trigger/topic label in grey (1 line, truncated)
- Right-aligned: date + outcome badge

ENTRY 1 (SELECTED — highlighted background):
- "Daniel Roy" + email icon
- "Transfer pending — compliance hold"
- "Today" + "Autonomous ✓" green badge

ENTRY 2:
- "Jana Fischer" + email icon
- "Payment retry failure"
- "Today" + "Autonomous ✓" green

ENTRY 3:
- "Mark Adeyemi" + phone icon
- "Suspicious transaction — auth check"
- "Today" + "Autonomous ✓" green

ENTRY 4:
- "Priya Nair" + email icon
- "KYC document request"
- "Yesterday" + "Escalated" orange badge

ENTRY 5:
- "Sarah Chen" + chat icon
- "API error 4023 — technical question"
- "Yesterday" + "Autonomous ✓" green

ENTRY 6:
- "Elena Petrov" + email icon
- "Subscription expiry inquiry"
- "Apr 4" + "Autonomous ✓" green

RIGHT COLUMN — CHAIN VISUALIZER (~70% width, white background):

VISUALIZER HEADER ROW:
- Left: "Daniel Roy — Transfer pending — compliance hold" (bold)
- Right: "Completed in 42 seconds · April 6, 2026 · Autonomous ✓" in green text

The main area is the visual flowchart — a vertical chain of connected node cards flowing top to bottom with thin arrows between each step. Center-aligned, each node card is ~320px wide:

NODE 1 — TRIGGER (dark navy/charcoal background, white text):
- Label: "TRIGGER" in small caps
- Content: "Inbound email — Daniel Roy" + quote: "My transfer of $2,000 has been pending for 3 days."

ARROW DOWN ↓

NODE 2 — INTENT CLASSIFIED (green background, white text):
- "✓ INTENT CLASSIFIED" small caps label
- Content: "Action request — transaction status + escalation required"
- Sub-note: "Confidence: 94%"

ARROW DOWN ↓ that FORKS into two parallel arrows ↓↓

TWO PARALLEL NODES (side by side, ~145px each):

NODE 3A (green):
- "✓ QUERY CRM"
- "HubSpot"
- "Found: Daniel Roy | $2,000 pending transfer | VIP"

NODE 3B (green):
- "✓ CHECK TX STATUS"
- "Internal API"
- "Status: Compliance hold (CH-4401)"

The two parallel nodes merge back into a single arrow ↓

NODE 4 (green):
- "✓ CREATE TICKET"
- "Linear #4832"
- "Tagged: compliance-hold · Priority: High"

ARROW DOWN ↓

NODE 5 (green):
- "✓ NOTIFY SLACK"
- "#compliance-team"
- "Message sent with full context ✓"

ARROW DOWN ↓

NODE 6 (green):
- "✓ REPLY TO CUSTOMER"
- "Sent: 'I've flagged this as urgent to our compliance team. You'll hear back within 2 hours. Ref: #4832.'"

ARROW DOWN ↓

NODE 7 (light grey, softer — scheduled but not yet executed):
- "⏰ FOLLOW-UP SCHEDULED"
- "In 2 hours · Will auto-send if ticket #4832 not resolved"

Below the last node: a green summary bar "Completed in 42 seconds · No human intervention ✓"

CLICKABLE DETAIL: Each node shows a small "Details ▾" link — show NODE 4 as expanded with a detail sub-panel below it (white card, inside the main visualizer):
- "Integration: Linear"
- "Action: Create issue"
- "Payload: { title: 'Compliance hold: Daniel Roy', priority: 'high', labels: ['compliance-hold'] }"
- "Response: 201 Created | Issue ID: #4832 | 312ms"
- Close ▲

Style: the flowchart is the entire visual experience of this screen. It should look like a GitHub Actions workflow diagram or a CI pipeline chart — clean node cards connected by arrows, color-coded for success (green), pending (grey), warning (amber), failed (red). The forking parallel step (nodes 3A and 3B) shows that Lira can run queries in parallel. Each node is compact but informative. The expanded detail panel gives a developer-level view of the actual API call made — payload in and response out. The left list panel gives context about which chain you're viewing and lets you switch between recent chains quickly.

---

## PROMPT — Screen 35: Action Engine — Approval Queue

Design a full-page SaaS dashboard screen for the Approval Queue in Lira Customer Support's Actions section. This screen has urgency — the sidebar should show a red notification badge on the "Actions" item. Dark sidebar shows "Support > Actions" as active.

PAGE HEADER:
- Tab bar: "Action Chains" | "Approval Queue" (active/underlined, with a red "2" count badge) | "History" | "Integration Health"
- Right: "Approve all Low-risk actions" outlined button with a green checkmark icon

PAGE SUB-HEADING (below tabs):
- "2 actions paused and waiting for your approval. Lira cannot continue these conversations until you decide."
- Amber/yellow left-border info card, subtle but noticeable

APPROVAL ITEM CARDS (full width, two cards stacked vertically):

CARD 1 (more urgent — shown first):

TOP ROW:
- Left: customer avatar "JS" + bold name "Jane Smith"
- Center: short topic label: "Refund request — transaction #TXN-4821"
- Right: "CRITICAL" risk badge (dark red pill) + "Pending 14 minutes" muted text

ACTION LIRA WANTS TO TAKE (highlighted row, light amber background strip):
- Bold label: "Proposed action:"
- Text: "Initiate $2,400 refund via HubSpot · Deal #48291 → Status: Refund Processed"
- A small amber warning icon on the left

CONTEXT SECTION (below the highlighted row):
- "Context:" label in small caps + paragraph in muted text: "Customer Jane Smith has been waiting 6 days for this refund. Eligibility confirmed — deal record shows fully processed return. CRM record shows VIP tier. Linear ticket #4291 open."
- Integration chips: HubSpot logo chip + "Deal #48291" + Linear logo chip + "#4291"

TIMER ROW:
- Clock icon + "Auto-cancels in 46 minutes if not reviewed" — muted amber text

ACTIONS ROW (bottom of card, 4 buttons):
- "Approve" filled green primary button (most prominent)
- "Modify" outlined blue button
- "Reject" outlined red button
- "View full conversation →" small text link

CARD 2 (lower urgency):

TOP ROW:
- "Tom Bakker" + "Account upgrade to Enterprise" topic
- "MEDIUM" risk badge (yellow pill) + "Pending 3 minutes"

ACTION PROPOSED:
- "Update Salesforce account type: Standard → Enterprise · Account ID: SF-8823"

CONTEXT:
- "Tom's company recently signed an Enterprise upgrade contract. CRM shows the contract is countersigned. Upgrading account type will unlock Enterprise feature gates."
- Salesforce logo chip + "SF-8823"

TIMER: "Auto-cancels in 57 minutes"

ACTIONS: "Approve" (green) | "Modify" (outlined blue) | "Reject" (outlined red) | "View full conversation →"

FOOTER NOTE: "Actions you reject will be logged. Lira will inform the customer the action couldn't be completed automatically and may suggest contacting a human agent."

Style: this screen communicates urgency clearly. The red badge on the sidebar and the amber warning banner at the top set the tone immediately. CARD 1 (Critical risk) should feel more serious — the "CRITICAL" red badge is visually dominant and the amber action row stands out. The 4-button action row at the bottom of each card makes the decision feel immediate — all options are visible without any extra clicks. The auto-cancel timer creates appropriate urgency without being alarming.

---

## PROMPT — Screen 36: Action Engine — Approve / Reject Modal

Design a modal overlay screen for the Action Approval flow in Lira Customer Support's Action Engine. This modal appears when "Approve" or "Modify" is clicked on an approval card from Screen 35. The background shows the dimmed/blurred Approval Queue screen behind it.

The modal is a centered white card (~560px wide, ~500px tall) with 16px rounded corners and a strong drop shadow.

MODAL CONTENT from top to bottom:

MODAL HEADER:
- Left: bold heading "Authorize Lira to take this action" (18px)
- Right: small X close icon

ACTION DETAIL CARD (full width of modal, light grey background, 12px rounded corners):
- TOP ROW: HubSpot logo icon on left + "HubSpot" label in bold + a "CRM Update" tag chip on the right
- Second row, the action label (slightly larger text, 15px): "Update Deal #48291 → Status: Refund Processed | Amount: $2,400"
- Below that: expand into readable field-by-field breakdown:
  - "Deal ID:" · "#48291"
  - "Field changed:" · "Status"
  - "From:" · "Pending" (grey text)
  - "To:" · "Refund Processed" (green text, arrow →)
  - "Amount field:" · "$2,400"
  - "Triggered by:" · "Customer request — Jane Smith"
- Each row is a clean label: value pair, left-aligned

IMPACT STATEMENT (below the detail card):
- A yellow/amber left-border alert card (warning style, ~50px tall):
  - "⚠ This action will update the HubSpot deal record and mark the refund as processed. This cannot be undone automatically — reversal requires manual intervention in HubSpot."

CONSEQUENCE PREVIEW:
- Below the warning, a clean text row: "After you authorize this: Lira will complete the action chain — notify Slack #billing-ops, then reply to Jane with the refund confirmation."

"MODIFY PAYLOAD" SECTION (collapsed accordion — show it closed):
- A grey accordion toggle row: "Modify action fields before approving ▾" — currently closed, shows a small "Advanced" label

FOOTER BUTTON ROW:
- Left: "Reject" ghost button (red/destructive text, no fill)
- Center: a small text field that appears when Reject is hover-targeted: "Add rejection note (optional)" — show it as greyed out placeholder hint
- Right: "Authorize" large primary filled button — green, bold text

Just below the button row in very muted small text: "This authorization will be logged to the Action History with your name as approver."

Style: this modal is a moment of deliberate human decision-making. It should feel precise and trustworthy — not rushed. The action detail card makes the payload human-readable (not raw JSON). The amber warning card conveys appropriate gravity without panic. The "Authorize" button is the clear dominant CTA — it's green, big, and says exactly what happens. The "Reject" button is available but not visually competing. The "Modify payload" accordion lets technical users drop into the raw fields if needed without cluttering the default view.

---

## PROMPT — Screen 37: Action Engine — Action History Log

Design a full-page SaaS dashboard screen for the Action History Log in Lira Customer Support's Actions section. The dark sidebar shows "Support > Actions" as active.

PAGE HEADER:
- Tab bar: "Action Chains" | "Approval Queue" | "History" (active/underlined) | "Integration Health"
- Right: date range picker "Last 7 days ▾" + "Export CSV" ghost button

FILTER BAR (below header, full width horizontal row):
- Filter dropdown pills: "Integration: All ▾" | "Action type: All ▾" | "Status: All ▾" | "Approval required: All ▾"

STATS SUMMARY BAND (below filters, a thin grey row):
- "142 actions this week" | "136 succeeded (96%)" | "6 failed" | "8 required approval"

DATA TABLE (full width):

COLUMN HEADERS (grey background, sticky):
Timestamp | Customer | Action Type | Integration | Status | Triggered By | Duration

Show 10 data rows. Each full-width row with alternating subtle row backgrounds and a hover state.

ROW 1:
"Apr 6, 2:14 PM" | "Jana Fischer" (avatar "JF") | "Update contact record" | HubSpot logo chip | "✓ Success" green chip | "Email conversation" | "312ms"

ROW 2:
"Apr 6, 2:14 PM" | "Jana Fischer" | "Knowledge retrieval" | "Qdrant" internal chip | "✓ Success" green | "Email conversation" | "88ms"

ROW 3:
"Apr 6, 10:42 AM" | "Daniel Roy" ("DR") | "Create issue" | Linear logo chip | "✓ Success" green | "Email conversation" | "541ms"

ROW 4:
"Apr 6, 10:42 AM" | "Daniel Roy" | "Send notification" | Slack logo chip | "✓ Success" green | "Email conversation" | "244ms"

ROW 5:
"Apr 6, 10:42 AM" | "Daniel Roy" | "Update deal record" | HubSpot chip | "⏳ Awaiting approval" yellow chip | "Email conversation — approval required" | "—"

ROW 6:
"Apr 5, 4:05 PM" | "Mark Adeyemi" ("MA") | "Verify transaction" | "Internal API" chip | "✓ Success" green | "Voice call" | "189ms"

ROW 7:
"Apr 5, 3:22 PM" | "Priya Nair" ("PN") | "Send outreach email" | "Resend" chip (email provider) | "✗ Failed" red chip | "Proactive trigger — payment.failed" | "—"

ROW 8:
"Apr 5, 2:10 PM" | "Elena Petrov" ("EP") | "Update contact record" | Salesforce logo chip | "✓ Success" green | "Chat conversation" | "428ms"

ROW 9:
"Apr 4, 11:15 AM" | "Kwame Asante" ("KA") | "Create issue" | Linear chip | "✓ Success" green | "Email conversation" | "390ms"

ROW 10:
"Apr 4, 9:30 AM" | "Tom Bakker" ("TB") | "Update account type" | Salesforce chip | "✓ Success" green | "Email conversation — approved by Sarah K." | "506ms"

ROW DETAIL PANEL (slides in from the right when ROW 7 is clicked — the failed row):
- Heading: "Action Detail — Send outreach email"
- "Integration: Resend · Endpoint: /emails"
- "Status: Failed · Error: 422 Unprocessable Entity"
- "Reason: Customer email address (pnair@fintech.com) is on the suppression list"
- "Payload sent:" — dark code block (compact): `{ "to": "pnair@fintech.com", "template": "payment-failed-retry" }`
- "Response:" — `{ "error": "recipient_suppressed", "code": 422 }`
- "Resolution: Email was not re-attempted. Customer was not contacted."
- "Parent conversation: View →" link
- Close × button

TABLE FOOTER: "Showing 1–10 of 142" with pagination arrows.

Style: this is a developer/admin-grade audit log. The table should be dense but well-organized. The Status column is the fastest scan column — ✓ green, ✗ red, ⏳ yellow all immediately tell the story. The failed row (ROW 7) might have a very subtle red left border to draw the eye. The detail panel for the failed row should look like a proper API debug panel — payload in, response out, error reason clearly stated. Integration logo chips make it easy to filter visually by tool.

---

## PROMPT — Screen 38: Action Engine — Integration Health Panel

Design a full-page SaaS dashboard screen for the Integration Health Panel in Lira Customer Support's Actions section. The dark sidebar shows "Support > Actions" as active.

PAGE HEADER:
- Tab bar: "Action Chains" | "Approval Queue" | "History" | "Integration Health" (active/underlined)
- Right: date range toggle buttons: "Today" (selected) | "7 days" | "30 days" | and a "Run health check" primary button with a pulse/refresh icon

HEALTH CHECK LAST RUN NOTE (below tabs):
- Green chip: "✓ Last health check: 4 minutes ago — all integrations responding"

INTEGRATION CARDS GRID (2-column card grid, 3 rows = 6 cards total):

CARD 1 — HubSpot:
- TOP ROW: HubSpot logo (orange) + "HubSpot" name in bold + "Connected ✓" green status pill on the right
- Metric rows (inside card):
  - "Last successful action:" "2 minutes ago"
  - "Actions today:" "47"
  - "Avg. response time:" "341ms"
  - "Errors today:" "0 errors" (green text)
- Bottom row: "View HubSpot action history →" text link

CARD 2 — Salesforce:
- Salesforce cloud logo + "Salesforce" + "Connected ✓" green pill
- "Last action: 18 minutes ago" | "Actions today: 12" | "Avg response: 521ms" | "Errors today: 0"
- "View history →"

CARD 3 — Linear:
- Linear logo + "Linear" + "Connected ✓" green
- "Last action: 10 minutes ago" | "Actions today: 8" | "Avg response: 480ms" | "Errors today: 0"

CARD 4 — Slack:
- Slack logo + "Slack" + "Connected ✓" green
- "Last action: 8 minutes ago" | "Actions today: 14" | "Avg response: 198ms" | "Errors today: 0"

CARD 5 — Resend (email provider):
- Resend logo (or generic envelope icon if no logo) + "Resend" + "Error" red status pill — this card has a light red background tint (differs from the green cards)
- "Last successful action: 14 hours ago"
- "Actions today: 3" | "Errors today: 1 error" — red text
- A red alert row: "1 error — recipient_suppressed (422) · Apr 5, 3:22 PM" with "View →" link
- "View error log →" text link

CARD 6 — Microsoft Teams:
- Teams logo + "Teams" + "Rate limited" yellow status pill — this card has a light amber/yellow tint
- "Last successful action: 45 minutes ago"
- "Actions today: 2" | "Rate limit hit: 1 time today" — yellow text
- A yellow info row: "Rate limit hit at 11:30 AM — Microsoft 429 response. Auto-retried in 60s successfully."
- "View log →"

BELOW THE CARDS — "Historical uptime" section:
- Section heading: "Integration uptime — last 7 days"
- A horizontal bar showing 7 colored segments per integration (one row per integration, stacked):
  - HubSpot: all 7 days green (100% uptime this week)
  - Salesforce: all 7 days green
  - Linear: all 7 days green
  - Slack: all 7 days green
  - Resend: 6 green + 1 red dot for today
  - Teams: 5 green + 2 yellow dots
- Each row: integration logo on left + 7 colored dots/blocks + "100%" or "92%" uptime percentage on the right

Style: this is an ops/monitoring dashboard. The most important visual decision is the health status pills — the green cards should feel calm and reassuring; the Resend error card should immediately catch the eye with a red tint; the Teams rate-limit card should be cautionary amber. The historical uptime section at the bottom lets admins see patterns at a glance (is this a one-time issue or recurring?). The "Run health check" button in the header should feel like a manual trigger that fires a live ping to all APIs.

---

## PROMPT — Screen 39: Analytics — Overview Dashboard

Design a full-page SaaS dashboard screen for the Analytics Overview in Lira Customer Support. The dark sidebar shows "Support > Analytics" as active.

PAGE HEADER (full width):
- Left: "Analytics" heading (bold, 24px) + a tab bar below: "Overview" (active/underlined) | "Proactive Performance" | "Weekly Report" | "Billing & Outcomes"
- Right: date range picker "Last 7 days ▾" + a secondary "Compare to previous period" toggle (OFF)

TOP METRIC CARDS ROW — 6 equal-width compact stat cards in a 3+3 or 6-across layout:

- Card 1: "Autonomous Resolution Rate" | large "74%" | green trend chip "↑ 8% vs. last week"
- Card 2: "Escalation Rate" | large "26%" | green trend chip "↓ 8% vs. last week" (down is good here)
- Card 3: "Avg. First Response Time" | large "18s" | green chip "↓ 4s vs. last week"
- Card 4: "Avg. CSAT (AI-resolved)" | "4.2/5.0" + 4 small gold stars | green chip "↑ 0.3 vs. last week"
- Card 5: "Total Conversations" | "342" | muted chip "This week"
- Card 6: "Proactive Outreaches" | "47 sent" | green chip "38% → tickets prevented"

MAIN CHARTS GRID (below the metric cards, 2-column layout):

LEFT COLUMN, CHART 1 (full left column width, ~55%):
- Heading: "Resolution Rate Trend — Last 30 days"
- A LINE CHART: x-axis = dates (March 8 → April 6), y-axis = percentage (0–100%). Two lines:
  - Green line: "Autonomous resolution %" — starts around 62%, trends upward to 74%, with minor fluctuation
  - Orange line: "Escalation rate %" — starts around 38%, trends downward to 26%
  - The two lines moving in opposite directions (one up, one down) shows the improvement story clearly
  - Hover tooltip shown at April 6 datapoint: "Apr 6: 74% autonomous | 26% escalated"
- Legend below: green dot "Autonomous" | orange dot "Escalated"

RIGHT COLUMN, CHART 2 (~45%):
- Heading: "Conversations by Channel — Daily"
- A STACKED BAR CHART: 7 bars (Mon–Sun of current week), each bar split into 3 color segments:
  - Blue segment: Email
  - Teal segment: Chat
  - Purple segment: Voice
  - Bars range from ~40–65 total conversations per day with natural variation
- Legend: blue "Email" | teal "Chat" | purple "Voice"

SECOND ROW OF CHARTS (below, full width, 3-column layout):

CHART 3 (~33%):
- Heading: "Resolution Outcome Breakdown"
- A DONUT CHART: 3 segments
  - 74% green "Autonomous"
  - 22% orange "Escalated"
  - 4% grey "Pending / In progress"
- Large "74%" in the center of the donut
- Legend below

CHART 4 (~33%):
- Heading: "CSAT Distribution"
- A HORIZONTAL BAR CHART showing counts for each star rating:
  - ★★★★★ 5 stars: long green bar | "89 conversations"
  - ★★★★☆ 4 stars: medium green bar | "61"
  - ★★★☆☆ 3 stars: short yellow bar | "18"
  - ★★☆☆☆ 2 stars: very short orange bar | "6"
  - ★☆☆☆☆ 1 star: tiny red bar | "3"

CHART 5 (~33%):
- Heading: "Proactive Outreach Funnel"
- A TOP-DOWN FUNNEL CHART (each level narrower than the above):
  - "Sent" → 47 (widest, full width)
  - "Delivered" → 38 (slightly narrower)
  - "Opened" → 31 (narrower)
  - "Replied" → 25 (narrower)
  - "Ticket prevented" → 18 (narrowest, bottom)
  - Each level labeled with count + percentage of previous level
  - Color: shades of brand accent color, darkening as the funnel narrows

FOOTER: "Last updated: 2 minutes ago · All times in UTC"

Style: clean analytics/reporting dashboard. The top 6 metric cards should feel scannable in 5 seconds. The charts use distinct visual types (line, stacked bar, donut, horizontal bar, funnel) to prevent monotony and to match each metric's natural data shape. The line chart with two opposing trends (resolution up, escalation down) is the hero chart — it tells the "Lira is getting better" story most clearly. Color system: green = autonomous/positive, orange = escalated/caution, blue/teal/purple = channel breakdown.

---

## PROMPT — Screen 40: Analytics — Proactive Outreach Performance

Design a full-page SaaS dashboard screen for the Proactive Outreach Performance analytics tab in Lira Customer Support. The dark sidebar shows "Support > Analytics" as active.

PAGE HEADER:
- "Analytics" heading + tab bar: "Overview" | "Proactive Performance" (active/underlined) | "Weekly Report" | "Billing & Outcomes"
- Right: date range picker "Last 7 days ▾"

TOP METRIC CARDS ROW — 5 stat cards (horizontal row):
- Card 1: "Total Outreaches Sent" | "47" | muted: "This week"
- Card 2: "Delivery Rate" | "96%" | green chip "✓ 45 delivered"
- Card 3: "Open Rate (email)" | "81%" | green chip "↑ 4% vs. last week"
- Card 4: "Reply Rate" | "53%" | green chip "↑ 7% vs. last week"
- Card 5: "Ticket Prevention Rate" | large "38%" in green | subtext "18 tickets prevented this week"

MAIN CONTENT (2-column layout below the metric cards):

LEFT COLUMN (~60% width):

HEADING: "Per-Trigger Breakdown" (semi-bold, 16px)

A data table showing performance for each active trigger:

TABLE HEADERS: Trigger | Fired | Delivered | Replied | Tickets Prevented | Avg Outcome | Trend

ROW 1 — "Payment Failed – Retry Prompt":
- "21" fired | "20" delivered | "13" replied | "13 (62%)" — shown in bold green | "Resolved ✓" green badge | Up-trend arrow ↑ green

ROW 2 — "KYC Blocked – Document Request":
- "12" | "12" | "7" | "6 (50%)" green | "Resolved ✓" | Flat trend →

ROW 3 — "Suspicious Transaction – Auth Check":
- "8" | "7" | "5" | "4 (50%)" green | "Resolved ✓" | Flat →

ROW 4 — "Subscription Expiring – Renewal Reminder":
- Italic/muted row: "PAUSED" status label spanning cells | "0 (paused)" across the row | grey

Each row is expandable: show ROW 1 as expanded, revealing a sub-table of day-by-day stats:
- Sub-table header: Day | Fired | Replied | Tickets prevented
- Mon: 3 | 2 | 2
- Tue: 4 | 3 | 3
- Wed: 5 | 3 | 2
- Thu: 4 | 2 | 2
- Fri: 5 | 3 | 4
- (The expanded rows have a very light indented/shaded background to show they're children of row 1)

RIGHT COLUMN (~40% width):

TOP CARD — "Best performing trigger this week":
- A green-bordered highlight card
- Large green badge: "Payment Failed – Retry Prompt"
- "62% ticket prevention rate ✓"
- Stat: "13 tickets prevented out of 21 outreaches"
- "View trigger →" text link

BELOW — "Needs attention" card:
- A yellow/amber-bordered card
- Badge: "Account Inactive – Activation Nudge" (PAUSED)
- "11% prevention rate when last active — lowest performer"
- Lira suggestion (small tinted blue card inside): "💡 Suggestion: This template may benefit from personalization. Try enabling 'Let Lira personalize' in the template settings for better engagement."
- "Edit trigger →" text link

BELOW — OUTREACH FUNNEL for the entire week (mini version, same as Screen 39 Chart 5 but smaller and more compact):
- Heading: "This week's funnel"
- Compact funnel: Sent 47 → Delivered 45 → Opened 38 → Replied 25 → Prevented 18

FOOTER of right column: "Outreach data updates every 15 minutes."

Style: this is a performance deep-dive screen for the proactive engine specifically. The per-trigger table is the core — it should feel like a marketing campaign performance report. The Tickets Prevented column is the most important column (it's the metric that drives billing and proves ROI) and should be styled more prominently (bold green numbers). The expandable day-by-day sub-rows give granularity without cluttering the default view. The right column's "Best / Needs attention" cards give instant recommendations without requiring the user to interpret the table themselves.

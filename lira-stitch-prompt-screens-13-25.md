# Google Stitch Prompt — Lira Customer Support: Screens 13–25

Paste each block below as a separate Stitch prompt, one screen at a time.

---

## PROMPT — Screen 13: Inbox — Conversation Detail (Action Chain in Progress)

Design a full-page SaaS dashboard screen for the Lira Customer Support inbox showing a live conversation where the AI is executing a multi-step action chain. The dark sidebar on the left shows "Support > Inbox" as the active nav item.

The main content area uses a 2-column layout.

HEADER BAR (full width):
- Left-pointing back arrow + "Back to Inbox"
- Center: customer name "Daniel Roy" + email icon chip
- Right: an "In Progress" status badge with a subtle pulsing blue color + action buttons: "Escalate" (outlined, orange) | "Export" (ghost)

LEFT COLUMN — MAIN THREAD (~65% width):
Shows the conversation thread at the top:
- MESSAGE 1 (customer, left-aligned): Avatar "DR" + name "Daniel Roy" + timestamp "Today 10:42 AM" — bubble: "Hi, my transfer of $2,000 has been pending for 3 days now. Can someone look into this urgently?"
- MESSAGE 2 (Lira, right-aligned): Lira AI icon + "Lira" label + timestamp "Today 10:42 AM" — bubble: "Hi Daniel, I'm looking into this right now. I'll have an update for you shortly." — attribution chip below: "AI-generated"

Below the message thread, separated by a thin divider line, is the ACTION CHAIN PANEL — a card with a light blue/indigo tinted background and a heading row: a spinning circular loader icon + bold text "Lira is working on this…" + right-aligned "Running for 8 seconds | ~15 seconds remaining" in muted text.

The action chain is a vertical step-by-step list inside the card, each step on its own row:

STEP 1 — COMPLETED (green left border, green checkmark icon):
- "Query HubSpot contact record"
- Result text in muted green: "Found: Daniel Roy | $2,000 pending transfer | VIP tier"

STEP 2 — COMPLETED (green):
- "Check transaction status via API"
- Result: "Status: Compliance hold (code CH-4401)"

STEP 3 — IN PROGRESS (blue left border, animated spinning circle icon):
- "Create Linear ticket — Compliance hold: Daniel Roy — TXN #48291"
- Status text: "Creating ticket…" in blue

STEP 4 — PENDING (grey left border, empty circle icon, dimmed text):
- "Notify Slack #compliance-team"
- "Waiting…"

STEP 5 — PENDING (grey, dimmed):
- "Reply to customer with ticket reference and ETA"
- "Waiting…"

STEP 6 — PENDING (grey, dimmed):
- "Schedule follow-up for 2 hours"
- "Waiting…"

Below the steps, inside the same card, a yellow "Approval needed" banner row (appears between step 2 and 3 area conceptually but shown at the bottom of the panel): "! Lira will request approval before initiating any financial action on this conversation." — small yellow info pill.

RIGHT COLUMN — INTERACTION SUMMARY SIDEBAR (~35% width, light grey background):
- "Customer": "Daniel Roy | d.roy@corp.com" — "VIP tier | Churn Risk: Medium — 54" with a yellow pill — "View full profile →" link
- "Status": "Action chain in progress"
- "Steps completed": "2 of 6"
- "Integrations active": HubSpot icon + Linear icon + Slack icon in a row
- "Started": "8 seconds ago"
- A grey divider then: "Tags": "Compliance" and "In Progress" chips

Style: the action chain panel is the visual centerpiece of this screen. It should feel like a live process monitor — similar to how GitHub Actions shows a running workflow. Green completed steps, spinning blue current step, dimmed grey future steps. The overall feel is "Lira is working — watch her go."

---

## PROMPT — Screen 14: Inbox — Escalation Modal

Design a modal overlay screen for a SaaS dashboard. The background behind the modal shows the dimmed/blurred conversation detail screen (Screen 12 or 13 style — message thread visible but greyed out behind the overlay).

The modal is a centered white card (~540px wide, ~620px tall) with 16px rounded corners and a strong drop shadow.

MODAL CONTENT from top to bottom:

HEADER ROW:
- Left: bold heading "Escalate Conversation" — 20px
- Right: a small X close icon

CUSTOMER SUMMARY CARD (light grey background card inside the modal, ~full width of modal):
- Customer name "Daniel Roy" in bold + "d.roy@corp.com" in muted text
- One line below: topic label "Transfer pending — compliance hold"
- Below that: a 2-line AI-generated italic summary in muted text: "Daniel's $2,000 transfer has been pending for 3 days, flagged under compliance hold code CH-4401. Linear ticket #4832 has been created and CRM record is updated."

SECTION: "Assign to" — section label small caps
- A dropdown input showing placeholder: "Select agent or team" — currently showing "Sarah K." selected (with a small avatar/initial circle on the left of the dropdown)
- Below the dropdown, two toggle rows side by side:
  - "Notify via Slack" toggle (ON) + channel input showing "#support-escalations"
  - "Notify via Teams" toggle (OFF)

SECTION: "Priority" — section label
- A horizontal radio button group with 4 pill-style options: "Low" | "Medium" | "High" (selected, filled accent color) | "Urgent"

SECTION: "Note for agent" — section label
- A textarea (3 rows tall) pre-filled with Lira's AI-written note in slightly muted text: "Customer has been waiting 3 days for a $2,000 transfer. Transaction is on a compliance hold (CH-4401). Linear ticket created: #4832. HubSpot CRM record updated with full context."
- Small muted label below textarea: "Pre-filled by Lira · You can edit this"

SECTION: "Notify customer"
- A checkbox (checked) + label text: "Send the customer: 'A specialist has been assigned and will follow up within"
- Inline editable number input: "2" + dropdown "hours"
- Full resulting message shown in muted italic beneath: "A specialist has been assigned to your case and will follow up within 2 hours."

FOOTER BUTTON ROW:
- Left: "Cancel" ghost button
- Right: "Escalate →" primary filled button in brand accent color (bold text)

Style: clean modal design. Summary card inside uses a very light grey fill to differentiate from the white modal background. Priority pills feel interactive. The AI pre-filled note area should look slightly distinct (maybe a very subtle yellow tint) to signal it was written by AI. The whole modal feels urgent but organized.

---

## PROMPT — Screen 15: Inbox — Human Override (Manual Reply)

Design a full-page SaaS dashboard screen showing a conversation detail view in Lira Customer Support, focused on the reply composer area at the bottom. This is the "human override" state where a human agent has taken over drafting the reply instead of Lira. The dark sidebar on the left shows "Support > Inbox" as active.

HEADER BAR (full width):
- Back arrow + "Back to Inbox"
- Customer name "Jana Fischer" + email icon chip
- Status badge: "Open" (blue)
- Action buttons: "Escalate" | "Export" | "View Customer Profile →"

MAIN THREAD (upper center area, ~65% width, shorter to leave room for the composer below):
Show 2 conversation bubbles:
- Customer (left): "Hi — I'm trying to update my bank account details but the form keeps giving an error. It's been 2 hours."
- Lira draft (right, in a GREYED OUT / muted draft state, with a dashed border instead of solid): "Hi Jana! I can help you with that. To update your bank account details, please go to Settings > Payment Methods and…" — this text appears lighter/greyed to show it's an un-sent draft

REPLY COMPOSER AREA (bottom of the left column, ~200px tall, white card with a top border):

At the very top of the composer: a segmented toggle/tab switcher showing two states side by side:
- "Lira is drafting" tab (left, currently NOT selected — grey text)
- "You are drafting" tab (right, SELECTED — shown with filled background pill or underline, brand accent color)

Inside the composer (manual mode is active):
- A rich text toolbar row: Bold (B) | Italic (I) | Underline (U) | Bullet list icon | Link icon | Attach file icon | Insert template icon — all small icon buttons in a row, subtle grey
- A text input area below the toolbar (2-3 rows, empty with blinking cursor): placeholder "Write your reply…"
- Below the input area, a soft amber/yellow info note: "This reply will be sent as you — Sarah K. Lira will continue monitoring but won't auto-reply until you hand back."
- Two buttons in a bottom row of the composer:
  - Left: "Hand back to Lira →" text link in brand color (small)
  - Right: "Send as Sarah K." primary filled button

RIGHT SIDEBAR (~35% width, same as Screen 12):
- Customer: Jana Fischer | Standard tier | Churn Risk: Low
- "Status": Open — waiting for reply
- "Lira's draft quality": "87% confidence | Grounded in: Account Settings Guide"
- Note in muted text: "Lira's draft is still available — click 'Hand back to Lira' to use it."
- Tags: "Account", "Human override"

Style: the key visual story here is the CONTRAST between the greyed-out Lira draft in the chat thread (showing the AI's pending reply but faded) and the active, bright composer area below it with the human writing. The segmented toggle at the top of the composer makes it very clear which mode is active. The "Hand back to Lira" option is present but non-dominant.

---

## PROMPT — Screen 16: Inbox — CSAT Outcome View

Design a full-page SaaS dashboard screen showing a resolved conversation in Lira Customer Support inbox, focused on the CSAT (customer satisfaction) outcome card at the bottom of the conversation thread. The dark sidebar on the left shows "Support > Inbox" as active.

HEADER BAR (full width):
- Back arrow + "Back to Inbox"
- Customer name "Jana Fischer" + email icon
- Status badge: "Resolved ✓" (green)
- Action buttons: "Reopen" (ghost) | "Export" (ghost) | "View Customer Profile →" (text link)

MAIN THREAD (~65% width):
Show the same 4-message conversation as Screen 12 (Jana Fischer / payment retry). The messages are scrolled so only the last 2 are visible at the top:
- Lira reply (right-aligned, last message): "Great news Jana! I've updated your account and logged this as resolved. Is there anything else I can help you with?"
- Below the last message: a light green / mint divider bar with small text "Conversation resolved · April 6, 2026 · 2:14 PM"

Below the divider, the CSAT OUTCOME CARD — a white card with a soft green left border (4px):
- Top row: a green filled circle with a checkmark icon on the left + bold text "Customer satisfaction collected" + right-aligned timestamp "April 6, 2026, 3:22 PM"
- Second row: 5 stars displayed large — 4 filled gold stars + 1 empty/outlined star (★★★★☆)
- Third row — customer comment bubble (light grey background, speech bubble shape): "It was a bit slow but eventually resolved — thanks!"  — with the customer name "Jana Fischer" and a small avatar below it
- Fourth row: two badge pills side by side:
  - A green pill: "✓ Billable resolution" (outcome-based pricing, this interaction will be billed)
  - A grey pill: "AI-resolved · 22 seconds"

Below the CSAT card, a soft muted note: "This resolution has been logged to Jana's customer profile and counted in this week's analytics."

RIGHT SIDEBAR (~35%):
Same interaction summary as Screen 12, with the CSAT row now showing: 4 filled gold stars + "4/5 · Submitted by customer"
- "Billing status": "✓ Billable — positive CSAT confirmed" in green text
- "Outcome": "Autonomous resolution"
- Tags: "Billing", "Resolved autonomously", "CSAT collected"

Style: the CSAT card should feel satisfying and final — the green left border, gold stars, and "Billable resolution" green badge all communicate a successful outcome. The comment bubble should feel like a real customer quote. Calm, clean, positive visual energy at the bottom of this screen.

---

## PROMPT — Screen 17: Inbox — Voice Call Transcript View

Design a full-page SaaS dashboard screen showing a voice call conversation in Lira Customer Support. This is the transcript view for a call handled by Lira's AI voice system. The dark sidebar on the left shows "Support > Inbox" as active.

HEADER BAR (full width):
- Back arrow + "Back to Inbox"
- Customer name "Jane Smith" + a phone icon chip (instead of email icon)
- Status badge: "Resolved ✓" (green)
- Action buttons: "Reopen" | "Export" | "Download recording" | "View Customer Profile →"

LEFT COLUMN — MAIN THREAD (~65% width):

TOP OF THREAD — AUDIO PLAYER CARD (white card, full width of column):
- Left side: a play button (filled circle with triangle inside) + waveform visualization (a simplified horizontal waveform bar graphic using varying height bars in the brand accent color) + duration "3m 42s"
- Right side of the same card: scrub bar (a thin line with a draggable dot positioned at about 25%) + current time "0:54 / 3:42"
- Below the waveform row: three small text links: "Download recording" | "View raw audio log" | "Data retention: 90 days"

SEARCH IN TRANSCRIPT row below the audio player: a search input with a search icon and placeholder "Search in transcript…"

TRANSCRIPT SECTION (scrollable, below the audio player):
Show 6 transcript entries, alternating customer and Lira, formatted as speaker-labeled blocks:

BLOCK 1 — Customer (left-aligned, grey avatar "JS"):
- "Customer (Jane Smith)" label in small bold text — timestamp "0:04" aligned right in muted text
- Speech bubble (light grey): "Hi, I'm calling about a transaction that's been flagged as suspicious. I approved it — it was me."
- Sentiment indicator in left margin: a small neutral grey circle emoji indicator

BLOCK 2 — Lira (right-aligned, Lira AI star icon):
- "Lira" label — timestamp "0:07" right
- Speech bubble (light brand-tinted): "Hi Jane, thanks for calling. I've pulled up your account. I can see the transaction flagged was $340 at 9:14 PM on April 5th. Can you confirm that was you?"
- Sentiment: neutral

BLOCK 3 — Customer (left-aligned):
- timestamp "0:19"
- "Yes, that was me. I was shopping online."
- Sentiment: still neutral

BLOCK 4 — Lira (right-aligned):
- timestamp "0:22"
- "Perfect. I've marked that transaction as verified on your account. The hold has been lifted. Your card is fully active again."
- Sentiment: —

BLOCK 5 — Customer (left-aligned):
- timestamp "0:31"
- "Oh wonderful, thank you so much! That was fast."
- Sentiment: a small green smiley face indicator in the left margin (positive)

BLOCK 6 — Lira (right-aligned):
- timestamp "0:34"
- "Happy to help Jane! Is there anything else I can do for you today?"

Below the last block: a green resolved bar "Call ended · Resolved · 3m 42s"

RIGHT SIDEBAR (~35%):
Same structure as Screen 12 sidebar, with these specifics:
- "Customer": Jane Smith | jane@example.com | Standard tier | Churn Risk: Low — 8
- "Call duration": "3m 42s"
- "Resolved": "Yes — no transfer to human agent needed"
- "Channel": Phone icon + "Voice (Nova Sonic)"
- "Lira's actions taken":
  - "Queried account transaction history ✓"
  - "Marked transaction #TXN-8847 as verified ✓"
  - "Lifted fraud hold on card ✓"
- "CSAT": ★★★★★ (5/5 — post-call SMS rating)
- Tags: "Fraud", "Voice call", "Resolved autonomously"
- Sentiment trend row: small sentiment chart showing 3 neutral dots then a positive spike at the end

Style: the audio player card at the top is an important unique element — it clearly signals this is a voice call, not an email/chat. The transcript feels like a teleprompter / subtitles layout with speaker labels and timestamps. The sentiment indicators in the left margin of customer blocks are small and unobtrusive but add richness. The side-by-side of call metadata in the right sidebar gives it a call-log quality.

---

## PROMPT — Screen 18: Customer List

Design a full-page SaaS dashboard screen for the "Customers" section of a Lira Customer Support module. The dark sidebar on the left shows "Support > Customers" as the active nav item. The main content area has a left filter panel and a main data table.

LEFT FILTER PANEL (~220px, light grey background, full height):
- A search input at the top: placeholder "Search by name or email…"
- Section label "TIER": checkbox rows — All (checked), Standard, VIP, Enterprise
- Section label "CHURN RISK": checkbox rows — All, Low (green dot), Medium (yellow dot), High (red dot)
- Section label "SENTIMENT": checkbox rows — All, Improving ↑, Stable →, Declining ↓
- Section label "CRM SYNC": checkbox rows — All, HubSpot synced, Salesforce synced, Not synced
- Sort dropdown at bottom: "Sort by: Last contact ▾"

MAIN CONTENT AREA (remaining width):
TOP BAR:
- Left: page heading "Customers" (bold 22px) + sub-count "214 customers" (muted)
- Right: "Export CSV" ghost button + "Bulk select" checkbox

DATA TABLE with column headers (all sortable — small ↕ sort icon on hover):
- Name | Email | Tier | Churn Risk | Interactions | Escalations | Sentiment | Last Contact | CRM Sync | (action column)

Show 8 customer rows in the table. Each row is a full-width table row with subtle hover state:

ROW 1 — Jana Fischer | jana@finco.com | "Standard" grey pill | Churn Risk: "18" with a green progress bar sliver | "14" | "3" | "↑" green arrow | "2 min ago" | HubSpot green icon ✓ | "View →" link
ROW 2 — Daniel Roy | d.roy@corp.com | "VIP" indigo pill | Churn Risk: "54" with a yellow progress bar | "7" | "5" | "→" grey arrow | "15 min ago" | HubSpot green ✓ | "View →"
ROW 3 — Sarah Chen | s.chen@techco.io | "Enterprise" dark pill | Churn Risk: "12" green | "31" | "1" | "↑" green | "1 hr ago" | Salesforce green ✓ | "View →"
ROW 4 — Mark Adeyemi | mark@startup.com | "Standard" grey | Churn Risk: "78" with a red bar | "5" | "5" | "↓" red arrow | "3 hr ago" | "⚠ Out of sync" yellow | "View →"
ROW 5 — Elena Petrov | e.petrov@bank.io | "VIP" indigo | Churn Risk: "33" yellow | "22" | "2" | "→" grey | "Yesterday" | HubSpot ✓ | "View →"
ROW 6 — Kwame Asante | k.asante@crypto.io | "Standard" grey | "9" green | "4" | "0" | "↑" green | "Yesterday" | "— Not synced" grey dash | "View →"
ROW 7 — Priya Nair | p.nair@fintech.com | "Enterprise" dark | "61" yellow progress bar | "18" | "4" | "↓" red | "2 days ago" | Salesforce ✓ | "View →"
ROW 8 — Tom Bakker | t.bakker@corp.nl | "Standard" grey | "25" green | "3" | "0" | "↑" green | "3 days ago" | "— Not synced" grey | "View →"

BULK ACTIONS row (appears at top of table on row selection, currently hidden): "Export CSV" | "Flag for review" | "Merge duplicates" with a count badge.

TABLE FOOTER: pagination bar — "Showing 1–8 of 214" with prev/next arrows.

Style: clean data table with strong column scanability. The Churn Risk column is the most visually prominent — a small inline color progress bar makes high/medium/low immediately obvious without reading the number. The Tier column uses pill badges. Sentiment arrows use color coding. The whole screen is data-dense but not overwhelming.

---

## PROMPT — Screen 19: Customer Profile — Overview

Design a full-page SaaS dashboard screen for a single customer profile in Lira Customer Support. The dark sidebar on the left shows "Support > Customers" as the active item. This is the 360° overview page for customer "Jana Fischer."

PROFILE HEADER (full width, white card with a subtle bottom border):
- Left: a large avatar circle (56px) with initials "JF" in white on a brand-colored background
- Next to avatar: large customer name "Jana Fischer" (bold 24px) + below it "jana@finco.com · +1 (415) 555-0182" in muted grey
- Right of the name block: a "Standard" tier grey pill badge + a Churn Risk score pill "Low — 18" in green
- Further right: CRM sync row — HubSpot icon + "Synced ✓ — Contact ID: hs_4829" in small green text + "Open in HubSpot →" text link
- Below the name, another row: sentiment indicator "Improving ↑ over last 30 days" in green with a small up-arrow icon
- Far right of the header: a row of 4 action buttons:
  - "View full history" (ghost)
  - "Send proactive message" (ghost)
  - "Create ticket" (ghost)
  - "Flag as VIP" (ghost with star icon)

4 STATS CARDS (full-width row of 4 equal cards below the header, each with a light border):
- Card 1: "Total Interactions" | large "14" | "since Jan 2025" muted
- Card 2: "Autonomous Resolutions" | large "11" | "79% resolved by Lira" in green text below
- Card 3: "Escalations" | large "3" | "2 resolved, 1 pending" muted
- Card 4: "Average CSAT" | large "4.1/5.0" | 4 filled gold stars + 1 partial rendered below

3-COLUMN LAYOUT below the stats row:

LEFT + CENTER (~65% combined width) — Main profile content:

AI SUMMARY CARD:
- Section heading "Customer Summary" with a small Lira AI star icon
- Paragraph text (slightly indented, ~3 sentences): "Jana has been a customer since January 2025. She has primarily contacted support about payment retry issues and account settings. Her last 2 interactions were resolved autonomously by Lira in under 30 seconds. Her churn risk score is low and her sentiment is improving."
- Small muted text below: "Generated by Lira · Updated April 6, 2026"

OPEN TICKETS section heading:
- 2 rows, each showing: channel icon + topic label + status badge + "View →" link
  - Email icon | "KYC document upload" | "Pending CSAT" grey badge | "View →"
  - Chat icon | "Account limit question" | "Open" blue badge | "View →"

PROACTIVE OUTREACH HISTORY section heading:
- 2 rows showing past proactive messages:
  - Lightning icon | "payment.failed event · April 3, 2026" | outcome badge "Ticket prevented ✓" green | "View →"
  - Lightning icon | "subscription.expiring event · March 14, 2026" | outcome badge "Replied" blue | "View →"

A text link at the bottom of this section: "View full interaction timeline →" (brand color)

RIGHT COLUMN (~35%, light grey background):

CHURN RISK PANEL:
- Heading: "Churn Risk"
- A large horizontal gauge/progress bar: 0 on left, 100 on right, with the indicator positioned at 18 (green zone left side)
- Score "18 / 100" in large bold text below the bar
- GREEN label: "Low risk"
- Small note: "Based on: interaction frequency, escalation count, sentiment trend, CSAT average"

CRM RECORD LINK PANEL:
- "HubSpot Connection" heading
- Row: HubSpot logo + "Connected ✓" green badge
- "Contact ID": hs_4829
- "Last sync": "2 min ago"
- "Open contact in HubSpot →" text link

Style: this screen is a rich, data-forward profile page but should feel organized and clean, not crowded. The header with avatar, name, tier, and CRM sync should feel like a professional CRM card. The stats row is scannable at a glance. The AI summary box has a slightly distinct background (very faint tint) to signal it was AI-generated. The churn risk gauge on the right sidebar is an important standalone visual.

---

## PROMPT — Screen 20: Customer Profile — Interaction Timeline

Design a full-page SaaS dashboard screen for the Interaction Timeline tab within Jana Fischer's customer profile in Lira Customer Support. The dark sidebar on the left shows "Support > Customers" as active.

PROFILE SUB-NAV (below the profile header from Screen 19, shown in a condensed form):
- Smaller header row: "Jana Fischer" (smaller, 18px, with back arrow to Customer List) + Tier + Churn Risk pill
- Below it: a tab row with 3 tabs: "Overview" | "Interaction Timeline" (active, underlined or filled) | "CRM Sync"

FILTER BAR (below the tab row, full width):
- Three pill toggle groups on left:
  - Channel: All (selected, filled) | Email ✉ | Chat 💬 | Voice 📞
  - Direction: All (selected) | Inbound | Proactive
- Date range picker on the right: "Last 90 days ▾"

TIMELINE CONTENT (main area, monocolumn, full width):
A vertical timeline with a thin vertical line down the left side and timeline entries as cards branching to the right. Show 5 entries, newest at the top:

ENTRY 1 — Today, 2:14 PM:
- Timeline dot: green filled circle
- Card (white, rounded, border):
  - Top row: email icon + "Email — Inbound" label + "Autonomous ✓" green badge + CSAT "★★★★☆ 4/5" on the right
  - Summary text: "Jana asked about a failed payment retry for $450. Lira identified the failure code (insufficient_funds), provided step-by-step retry instructions, and resolved the issue. Resolved in 22 seconds."
  - Bottom row of action chips: "HubSpot updated" grey chip | "Grounded in: Payment FAQ" grey chip | "Expand for full transcript ▾" text link

ENTRY 2 — April 3, 2026, 11:05 AM:
- Timeline dot: purple filled circle (proactive)
- Card:
  - Top row: lightning bolt icon + "Proactive — Outbound (payment.failed trigger)" + "Ticket prevented ✓" green badge
  - Summary: "Lira detected a payment.failed event for Jana's account and proactively sent an email before Jana contacted support. Jana replied and confirmed the issue was resolved after following the retry instructions."
  - Action chips: "Outbound email sent" | "Jana replied ✓"

ENTRY 3 — March 28, 2026, 4:30 PM:
- Timeline dot: orange filled circle (escalated)
- Card:
  - Top row: email icon + "Email — Inbound" + "Escalated" orange badge + "★★★☆☆ 3/5" CSAT
  - Summary: "Jana reported a delayed transfer of $1,200 flagged by compliance. Lira created a Linear ticket (#4128), notified Slack #compliance-team, but could not resolve autonomously. Escalated to Sarah K. — resolved by human in 3 hours."
  - Action chips: "Linear #4128 created" | "Slack notified" | "Escalated to Sarah K."

ENTRY 4 — March 14, 2026, 9:00 AM:
- Timeline dot: purple circle (proactive)
- Card:
  - Top row: lightning + "Proactive — Outbound (subscription.expiring)" + "Replied" blue badge
  - Summary: "Lira proactively emailed Jana about her subscription expiring in 7 days. Jana replied with questions, Lira answered them, and Jana renewed."

ENTRY 5 — February 12, 2026, 2:00 PM:
- Timeline dot: green circle
- Card:
  - Top row: chat bubble icon + "Chat — Inbound" + "Autonomous ✓" green + "★★★★★ 5/5"
  - Summary: "Jana asked how to update bank account details via chat widget. Lira answered using the Account Settings knowledge base entry. Resolved in 14 seconds."

TIMELINE FOOTER: "View earlier interactions (9 more)" — text link or "Load more" button.

Style: the timeline is the key visual. The vertical line on the left with colored dots signals different event types at a glance (green = autonomous, orange = escalated, purple = proactive). Cards feel like concise activity log entries. Chips at the bottom of each card show which tools were touched. The filter bar at the top lets the user slice by channel or direction quickly.

---

## PROMPT — Screen 21: Customer Profile — CRM Sync Status

Design a full-page SaaS dashboard screen for the CRM Sync Status tab within Jana Fischer's customer profile in Lira Customer Support. Dark sidebar shows "Support > Customers" as active.

PROFILE SUB-NAV (same condensed form as Screen 20):
- "Jana Fischer" with back arrow + Tier + Churn Risk pill
- Tab row: "Overview" | "Interaction Timeline" | "CRM Sync" (active, underlined)

PAGE HEADING + SYNC STATUS BAR (full width):
- Left: "CRM Sync — HubSpot" with a HubSpot logo icon
- Right: "Last synced: 2 minutes ago" muted + "Sync now" outlined button + "Field mapping →" text link
- Below heading: a green banner bar showing "✓ Synced — All 6 mapped fields match"

MAIN CONTENT — SIDE-BY-SIDE COMPARISON TABLE (full width, two columns with a divider between them):

LEFT COLUMN HEADING: "Lira Profile" with a small Lira star icon
RIGHT COLUMN HEADING: "HubSpot Contact Record" with HubSpot logo icon

TABLE ROWS — each row is a field comparison:

Row 1: Field label "Name" | Lira value: "Jana Fischer" | Sync status center icon: ✓ (green checkmark) | HubSpot value: "Jana Fischer"

Row 2: Field "Email" | "jana@finco.com" | ✓ | "jana@finco.com"

Row 3: Field "Phone" | "+1 (415) 555-0182" | ✓ | "+1 (415) 555-0182"

Row 4: Field "Tier" | "Standard" | ⚠ MISMATCH (yellow warning triangle icon in center) | "VIP" — MISMATCH row is highlighted with a very subtle yellow background across the full row

Row 5: Field "Churn Risk Score" | "18" | — (grey dash, "Not mapped") | "—" | Right side note: "This field has no HubSpot equivalent. Create mapping →"

Row 6: Field "Last Support Contact" | "April 6, 2026" | ✓ | "April 6, 2026"

Row 7: Field "Open Tickets" | "2" | — (not mapped) | "—"

MISMATCH RESOLUTION PANEL (appears below the table, highlighted with a yellow left border card):
- Heading: "1 field mismatch requires your attention"
- Row for the "Tier" mismatch:
  - Field: "Tier"
  - "Lira says: Standard" | "HubSpot says: VIP"
  - Three action buttons in a row: "Use Lira's value (Standard)" ghost | "Use HubSpot's value (VIP)" ghost | "Keep both in notes" ghost
  - Note in muted text: "This may affect how Lira treats this customer. Resolve before next interaction."

FIELD MAPPING NOTE (below the mismatch panel):
- "Want to add more fields? Set up custom field mappings in Integration Settings."
- "Field mapping →" text link

Style: this is a data reconciliation screen. The side-by-side table layout should feel like a diff view or data comparison tool. The mismatch row highlighted in yellow and the resolution panel below are the most important elements — they demand attention. The ✓ and ⚠ icons in the center column act as the visual "verdict" for each field. Clean, table-based, developer/admin facing.

---

## PROMPT — Screen 22: Proactive Engine — Trigger List

Design a full-page SaaS dashboard screen for the "Proactive" section of Lira Customer Support. The dark sidebar on the left shows "Support > Proactive" as the active nav item.

PAGE HEADER (full width):
- Left: "Proactive Triggers" heading (bold, 24px)
- Center: a horizontal stats row of 3 pill chips in muted grey: "8 active triggers" | "47 outreaches this week" | "38% ticket prevention rate"
- Right: "New Trigger +" primary filled button in brand accent color

TABS below the header (or as a secondary nav): "Triggers" (active) | "Outreach Log" — toggle between the trigger list and the activity log

TRIGGER CARDS SECTION:
A 2-column card grid of 4 trigger cards (2 rows × 2 columns). Each card is a white rounded rectangle with a subtle border and shadow (~380px wide).

CARD 1 — "Payment Failed — Retry Prompt"
- Top row: card title bold "Payment Failed — Retry Prompt" + a large pill toggle on the right showing "Active" (green filled toggle, pill shape)
- Second row: event type label "payment.failed" in a dark monospace code chip
- Third row: channel icons — email envelope icon + "Email" text
- Stats row (light grey background band within the card): "Fired 12x this week" left | "5 tickets prevented ✓" right in green
- Action row (bottom of card): "Edit" text link | "Duplicate" text link | "Delete" text link (muted red) | "View activity →" text link

CARD 2 — "KYC Blocked — Document Request"
- Same structure, toggle: Active (green)
- Event: "kyc.blocked" code chip
- Channel: email icon
- Stats: "Fired 7x this week" | "3 tickets prevented ✓"

CARD 3 — "Subscription Expiring — Renewal Reminder"
- Toggle: "Paused" (grey, not active — toggle is off)
- Event: "subscription.expiring"
- Channel: email icon
- Stats row: dimmed/greyed — "Paused · Last fired March 28"
- The entire card has a slightly lower opacity / muted appearance to signal it's paused

CARD 4 — "Suspicious Transaction — Auth Check"
- Toggle: Active (green)
- Event: "fraud.flagged"
- Channel: email icon + phone icon (both email and voice)
- Stats: "Fired 3x this week" | "2 tickets prevented ✓"

BELOW THE CARDS — "Start from a template" section:
- Section heading: "Start from a template" in grey label
- A horizontal scrollable row of 4 smaller template pill buttons (outlined, grey):
  - "API Error Spike → Engineering Alert"
  - "Account Inactive → Activation Nudge"
  - "Onboarding Stalled → Re-engagement"
  - "+ Create custom trigger"

Style: the trigger cards as the visual centerpiece. The Active/Paused toggle is visually dominant on each card — it should be the first thing your eye goes to. Paused cards should clearly look less alive. The stats band inside each card (fired count / tickets prevented) creates a mini-dashboard-within-a-card feel. Clean, action-forward layout.

---

## PROMPT — Screen 23: Proactive Trigger Wizard — Step 1: Event Type

Design a full-page modal/wizard screen for creating a new proactive trigger inside Lira Customer Support. The dark dashboard is visible but blurred/dimmed behind the modal. The modal is a large centered white card (~780px wide).

AT THE TOP of the modal:
- Modal heading: "New Proactive Trigger" (bold, 20px) + X close icon top-right
- Below the heading: a 5-step horizontal progress bar. Steps labeled: "1. Event Type" (current, filled/active) | "2. Conditions" | "3. Template" | "4. Channel & Timing" | "5. Test" — steps 2-5 are empty/grey

STEP HEADING:
- Large step question: "What event triggers this outreach?" (bold, 22px)
- Subheading: "Choose an event type from your product that should trigger Lira to reach out to the affected customer." in muted grey

TWO TABS below the step heading: "Predefined events" (active, underlined) | "Custom event"

TAB 1 CONTENT — Predefined events (shown active):
A 3-column grid of 6 event type selection cards and 1 "custom" card. Each card is a selectable tile (~200px wide) with a hover state and a selected state:

CARD 1 (SELECTED — shown with filled brand-color border and light blue background tint):
- Icon: a credit card with an X (payment failure icon)
- Bold label: "payment.failed"
- Description: "A payment attempt fails"

CARD 2:
- Icon: an ID card / identity badge icon
- Label: "kyc.blocked"
- Description: "KYC verification stalls"

CARD 3:
- Icon: an alert triangle
- Label: "fraud.flagged"
- Description: "A transaction is flagged as suspicious"

CARD 4:
- Icon: a calendar / clock expiry icon
- Label: "subscription.expiring"
- Description: "Subscription expires in X days"

CARD 5:
- Icon: a graph with a spike / error icon
- Label: "api.error.spike"
- Description: "API error count exceeds threshold"

CARD 6:
- Icon: a sleeping moon / inactive user
- Label: "account.inactive"
- Description: "Account inactive for X days"

CARD 7 (dashed outline, lighter):
- Icon: a plus (+) symbol
- Label: "Create custom event"
- Description: "Define your own event type"

TRIGGER NAME INPUT (below the card grid):
- Label: "Trigger name"
- Text input with placeholder: "e.g. Payment Failed — Fintech Retry" — currently showing typed value "Payment Failed — Fintech Retry" with cursor

MODAL FOOTER:
- Left: "Cancel" ghost button
- Right: "Continue →" primary filled button (disabled/greyed because no event is selected? — actually show it ENABLED since payment.failed is selected)

Style: the event type selection grid is the core of this screen. The selected card (payment.failed) has a strong visual selection state — brand blue border glow + light fill. The monospace code label on each card (payment.failed) makes it feel technical/developer-friendly. The trigger name input at the bottom ties the selection to a human-readable name.

---

## PROMPT — Screen 24: Proactive Trigger Wizard — Step 2: Condition Builder

Design a full-page modal/wizard screen for Step 2 of the proactive trigger creation flow in Lira Customer Support. Same modal format as Screen 23 (~780px wide white card, dimmed/blurred dashboard behind it).

AT THE TOP of the modal:
- Modal heading: "New Proactive Trigger — Payment Failed – Fintech Retry" (smaller subtitle under main heading)
- 5-step progress bar: Step 1 "Event Type" (completed, green checkmark) | Step 2 "Conditions" (current, active/filled) | Steps 3-5 grey

STEP HEADING:
- "When exactly should this fire?" (bold, 22px)
- Subheading: "Add conditions to avoid sending messages for every event. Only fire when these are all true." in muted grey

CONDITION BUILDER (main content, left ~60%):

A card-style container with a light background. Inside:
- Top label: "Fire this trigger when:" in small caps grey

CONDITION ROW 1 (full row, 3 connected inputs):
- Dropdown 1 (field selector, ~180px): showing "event.type" selected, grey background dropdown
- Dropdown 2 (operator, ~120px): showing "equals"
- Dropdown 3 / text input (value, ~160px): showing "payment.failed" in a monospace code style
- On the right: a small grey trash/remove icon

SMALL GREY "AND" CONNECTOR LABEL between rows, centered

CONDITION ROW 2:
- Dropdown 1: "data.amount" selected
- Dropdown 2: "greater than"
- Input: "500" (with a small "$" prefix inside the input)
- Remove icon

AND CONNECTOR

CONDITION ROW 3:
- Dropdown 1: "customer.tier"
- Dropdown 2: "is not"
- Dropdown 3: "enterprise"
- Remove icon

Below the 3 rows: two add-buttons in a row:
- "+ Add condition (AND)" — text link, muted
- "+ Add OR group" — text link, muted

Right side (~40% width) — PLAIN ENGLISH PREVIEW PANEL (light grey background, rounded, full height):

PANEL HEADING: "In plain English:" with a small AI/translation icon

PREVIEW TEXT (renders automatically from the conditions above):
"This trigger fires when:
· A payment fails
· AND the amount is greater than $500
· AND the customer is not on the Enterprise tier"
— in slightly larger, human-readable text with bullet points

Below the preview text:
A frequency estimate row: small clock icon + "Est. frequency: ~8–12 times per week" in muted text

FIELD REFERENCE accordion (below): "Available fields from your webhook payload ▾" — shown collapsed as a grey accordion toggle

MODAL FOOTER:
- "← Back" ghost button
- "Cancel" ghost text link
- "Continue →" primary filled button

Style: the condition builder is the visual focus. Each condition row should look like a clear 3-part input (field + operator + value) — similar to how Zapier's filter UI or HubSpot's smart list builder looks. The rows are horizontally inline. The right-side plain English preview updating in real time is the "magic" of this screen — it makes a technical config feel approachable. The AND connectors between rows are small and unobtrusive.

---

## PROMPT — Screen 25: Proactive Trigger Wizard — Step 3: Outreach Template

Design a full-page modal/wizard screen for Step 3 of the proactive trigger creation flow in Lira Customer Support. Same modal format as Screens 23 and 24 but wider (~900px) to accommodate the two-panel split layout inside. Dashboard dimmed/blurred behind.

AT THE TOP of the modal:
- Modal heading: "New Proactive Trigger — Payment Failed – Fintech Retry"
- 5-step progress bar: Steps 1 and 2 have green checkmarks (completed) | Step 3 "Template" is active/filled | Steps 4-5 grey

STEP HEADING:
- "What will Lira say?" (bold, 22px)
- Subheading: "Write the message Lira will send when this trigger fires. Use variables to personalize it." in muted grey

TWO-COLUMN SPLIT LAYOUT (the main content):

LEFT COLUMN — TEMPLATE EDITOR (~55% width):

Section: "Subject line" (for email):
- Text input showing: "Action needed: Your payment didn't go through" (editable)

Section: "Message body":
- A formatting toolbar row: B (Bold) | I (Italic) | Link icon | bullet list icon | then a special button: "Insert Variable { }" in brand accent color (outlined)
- When "Insert Variable" is clicked, a small dropdown appears (show it open) with variable chips listed:
  - {{customer.name}}
  - {{data.amount}}
  - {{data.currency}}
  - {{data.failureCode}}
  - {{org.name}}
- The main text editor area below the toolbar contains the template body text. Show the text with variables highlighted in colored pills/chips inline:
  "Hi {{customer.name}}," — the {{customer.name}} part appears as a small tinted blue pill (not plain text)
  (blank line)
  "We noticed your recent payment of {{data.amount}} {{data.currency}} didn't go through. This can usually be resolved quickly — here's what to do:"
  (blank line)
  "[→ Retry payment]" — shown as a styled button/link placeholder within the text
  (blank line)
  "If you need help, just reply to this email and I'll sort it out immediately."
  (blank line)
  "– Lira, your support assistant at {{org.name}}"

Two toggle rows below the editor:
- "Let Lira personalize this template" toggle (ON) with description: "Lira rewrites this message for each customer using their history and tone"
- "Fallback if variable is missing" toggle (OFF) with description: "Define placeholder text for missing variables"

RIGHT COLUMN — LIVE PREVIEW (~45% width):

Preview panel heading: "Preview" with a small framing/eye icon — and two small tab buttons: "Desktop" (selected) | "Mobile"

Shows a rendered email preview inside a mock email client frame (desktop version):
- Email header row: "From: Lira — FincoSupport" | "To: jana@finco.com" | "Subject: Action needed: Your payment didn't go through"
- Email body rendered with variables replaced by realistic sample values:
  "Hi Jana,"
  (blank line)
  "We noticed your recent payment of $450 USD didn't go through. This can usually be resolved quickly — here's what to do:"
  (blank line)
  A styled blue button: "→ Retry payment"
  (blank line)
  "If you need help, just reply to this email and I'll sort it out immediately."
  (blank line)
  "– Lira, your support assistant at FincoSupport"

Below the email preview frame: a small "Send preview to myself" outlined button with an envelope icon.

MODAL FOOTER:
- "← Back" ghost button
- "Cancel" ghost text link
- "Continue →" primary filled button

Style: the big visual story here is the LIVE PREVIEW on the right. The left template editor uses inline variable chips in blue/tinted to make `{{customer.name}}` feel like a UI element, not just typed text — similar to how Intercom or Mailchimp's variable insertion works. The right preview shows the fully rendered human-readable email in a realistic email client mockup frame. This split gives the user confidence that what they write will look exactly right when it sends.

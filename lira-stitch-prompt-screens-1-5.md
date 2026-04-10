# Google Stitch Prompt — Lira Customer Support: Screens 1–5

Paste each block below as a separate Stitch prompt, one screen at a time.

---

## PROMPT — Screen 1: Global Sidebar (Support Module Navigation)

Design a dark-themed SaaS dashboard sidebar for an AI platform called Lira. The sidebar is 240px wide with a dark background (#0F1117 or similar dark navy/charcoal). At the top-left is the Lira logo (wordmark, white). Below it is a vertical navigation list with icon + label rows for: Home, Meetings, Interviews, Sales Coaching. Then a thin horizontal divider line. Below the divider is a "Support" nav item with a small green pill badge that says "New" next to it. The Support item is expanded, showing 6 indented sub-items beneath it: Inbox, Customers, Proactive, Knowledge, Actions, Analytics. "Inbox" is the currently active sub-item — it has a filled rounded background pill highlight. "Inbox" also has a small red notification dot on the right. "Actions" has a small yellow notification dot on the right. Another thin divider below, then: Integrations, Settings. At the very bottom of the sidebar: a user avatar circle, a Help icon, and a Settings icon. The overall style is clean, minimal, modern SaaS — similar to Linear or Vercel's dashboard. Use Inter or a similar sans-serif font. Muted icon colors except for the active item which is bright white.

---

## PROMPT — Screen 2: Module Activation Screen

Design a full-screen modal overlay for a dark SaaS dashboard. The modal is a large centered card (approximately 640px wide) with rounded corners (16px), white or very light background on top of a darkened/blurred dashboard behind it. 

Content of the card from top to bottom:
- A small icon or illustrated badge at the top center representing AI customer support (e.g., a stylized chat bubble with a lightning bolt or waveform)
- Large headline text: "Activate Lira Customer Support" — bold, ~28px
- Subheadline beneath it: "Set up takes 10 minutes. By the end, Lira will be answering your customer emails." — grey, ~16px
- A horizontal flow diagram in the center of the card showing 4 connected nodes with arrows between them: "Customer email" → "Lira AI" → "Reply & Action" → "CRM". Each node is a rounded pill or small card with an icon and label. The arrows between them are thin with arrowheads. The Lira AI node is highlighted (brand accent color).
- Two CTA buttons at the bottom center: a large primary button "Start Setup" (filled, brand color) and a smaller secondary text-link button "Learn more" below it
- A small footer note in muted text: "Already have integrations connected? Lira will reuse your existing connections."

Style: clean, trustworthy, modern SaaS onboarding. Light card on dark blurred background.

---

## PROMPT — Screen 3: Onboarding Step 1 — Email Channel Setup

Design a full-screen onboarding step inside a SaaS dashboard. At the very top is a horizontal step progress bar showing 7 steps, with Step 1 filled/active and labeled "Email Channel". The step is labeled "Step 1 of 7" in small text.

The main content area is a centered form card (~640px wide) with generous padding. Content from top to bottom:

- Section heading: "Inbound Email Address" — semi-bold, 18px
- A text input field pre-filled with placeholder: "support@yourcompany.com"
- Helper text below the input: "This is the address your customers already email for support. Lira will monitor it and reply on your behalf." in muted small text
- A subsection: "Verify ownership" with a grey outlined button "Send verification email" and a status indicator showing: a grey unfilled circle icon + "Not verified" in grey text (unverified state)
- A text input labeled "Sender name" with placeholder "Lira | CompanyName Support" and small helper text: "How Lira will sign off"
- A radio group labeled "Reply-from address" with two options: Option 1 (selected): "reply@lira-mail.yourcompany.com (recommended)" — Option 2: "support@yourcompany.com (requires DNS setup)"
- Two toggle rows: "CC your team on every reply" (toggle off) and "BCC for compliance logging" (toggle off). Each toggle is a standard pill toggle switch on the right.
- At the bottom of the card: a right-aligned row with a ghost/text "Skip for now" link on the left and a filled primary "Continue" button on the right. A "Back" ghost button sits to the left of "Continue".

Style: clean SaaS form, white card on light grey page background, Inter font, subtle field borders, section headings with consistent spacing. Status indicator uses green checkmark when verified.

---

## PROMPT — Screen 4: Onboarding Step 2 — Chat Widget Setup

Design a full-screen onboarding step for a SaaS dashboard. At the top is the 7-step progress bar with Step 2 "Chat Widget" active.

The main content area uses a two-column split layout inside a wide card:

LEFT COLUMN — Configuration panel (~55% width):
- Toggle row at the top: "Enable Chat Widget" with a toggle switch turned ON (green)
- Section heading: "Widget Appearance"
  - A color picker row: label "Accent color" + a hex input field showing "#6366F1" (indigo) + a row of 6 color swatches + a custom color circle
  - A file upload row: label "Launcher icon" + small dashed upload zone with "Upload icon" text (optional)
  - Radio group labeled "Launcher position": two options — "Bottom Right" (selected) and "Bottom Left" — each with a tiny visual showing widget position in a mini browser mockup
  - A textarea labeled "Greeting message" containing: "Hi! I'm Lira, your support assistant. How can I help?"
  - A text input labeled "Widget title" with value "CompanyName Support"
- Section heading: "Availability"
  - Toggle row: "Always on (24/7)" — toggle ON

RIGHT COLUMN — Live Preview (~45% width):
- A mock browser window frame (rounded, with a fake URL bar showing "yourcompany.com" and three traffic light dots)
- Inside the browser frame, a mock webpage (simple grey content) with a floating chat widget launcher button in the bottom-right corner — indigo colored circle button with a chat bubble icon
- The widget is in open state: a white chat widget card popped open above the launcher showing the header "CompanyName Support" and the greeting message "Hi! I'm Lira, your support assistant. How can I help?" with input bar at bottom

BOTTOM of the full screen card:
- A section labeled "Embed code" with a dark code block showing one line of HTML script tag with a "Copy" button on the right
- A small link: "Email this to my developer"
- Bottom nav: "Back" ghost button + "Continue" primary button (right-aligned)

Style: split-panel layout, live preview with shadow, SaaS clean aesthetic.

---

## PROMPT — Screen 5: Onboarding Step 3 — Voice Setup

Design a full-screen onboarding step for a SaaS dashboard. At the top is the 7-step progress bar with Step 3 "Voice Support" active.

The main content area is a single-column centered card (~640px wide). The very first element is a prominent top-level toggle row:

- Label: "Enable Voice Support" — medium weight, 16px — with a supporting description line: "Let Lira answer customer support phone calls using AI voice" in muted text
- Toggle switch on the right: toggled ON (green)

Below the toggle (since it's ON, all sub-sections are expanded):

SECTION: "Phone Number"
- Sub-heading: "Phone Number" — with a radio group of two options stacked:
  - Option 1 (selected): "Provision a new number" — selected radio + description: "Lira will assign you a dedicated support number instantly"
  - Option 2: "Forward your existing number to Lira" — unselected radio + description: "Set up call forwarding from your current support line"

SECTION: "Voice Personality"
- Sub-heading: "Voice Personality"
- A dropdown selector showing selected option: "Aria – Professional"
- Below the dropdown, a playback row: waveform icon + "Aria – Professional sample" text + a small "Play ▶" button
- A slider labeled "Speaking speed" ranging from "0.8x" on the left to "1.2x" on the right, with the handle positioned at 1.0x

SECTION: "When Lira can't resolve"
- Sub-heading: "Escalation Behavior"
- A radio group of 3 options, stacked:
  - Option 1 (selected): "Transfer to a human agent" — with a text input below it showing placeholder "Enter transfer number e.g. +1 (555) 000-0000"
  - Option 2: "Offer callback — customer stays on line, agent calls back"
  - Option 3: "Send follow-up email — Lira closes the call and emails the customer"

BOTTOM of card:
- A small info note in a light blue/grey callout box: "Voice calls are transcribed and linked to the customer's profile automatically."
- Bottom nav: "Skip for now" text link (left) + "Back" ghost button + "Continue" primary button (right-aligned)

Style: clean SaaS form card, same design system as screens 3 and 4. Toggle in an ON state reveals all subsections. Subtle section dividers between each section group.

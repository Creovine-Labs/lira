# Lira AI — Product Testing & Demo Videos

> **Purpose:** A structured guide for recording demo/testing videos of the Lira platform.  
> Each section is one video (or one clip in a longer video). The goal is two-fold:
>
> 1. Verify every major feature works end-to-end.
> 2. Create compelling content for Twitter/Instagram that shows exactly what Lira can do.

---

## How to Use This Guide

- Work through each test in order — the sections build on each other (you need a workspace before you can test meetings, etc.).
- Record each section as a separate screen recording so you can post them individually or stitch them together.
- Mark **✅ PASS**, **⚠️ PARTIAL**, or **❌ FAIL** next to each test after you record it.
- Note any bugs or unexpected behaviour in the "Issues Found" column so you can fix them after.

---

## Section 1 — Workspace Setup & Organisation Profile

> **Video title idea:** _"Setting up your AI workspace in Lira — takes 60 seconds"_

| #   | Test                         | What to show                                                                            | Expected result                                           |
| --- | ---------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1.1 | Create a new organisation    | Click **Add Organisation** → fill in name, company name, industry, website, description | Organisation is created and you land on the settings page |
| 1.2 | Complete the org profile     | Add a logo URL, communication style, meeting norms, custom AI instructions              | Settings save successfully with a toast confirmation      |
| 1.3 | Invite a team member         | Go to **Members** tab → enter an email → assign a role                                  | Invitation is sent; member appears in the members list    |
| 1.4 | Switch between organisations | Use the org switcher in the sidebar                                                     | Dashboard and data update to reflect the selected org     |

**What makes this video interesting:** Viewers see how personalised and branded Lira becomes once you fill in the org profile — it sets up every other demo.

---

## Section 2 — Meetings: Deploying Lira into a Live Call

> **Video title idea:** _"I added an AI to my Google Meet — here's what happened"_

### 2A — Creating & Deploying a Meeting Bot

| #   | Test                              | What to show                                                                                                                                    | Expected result                                              |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 2.1 | Add a new meeting                 | On the **Meetings** page click **+** → paste a Google Meet or Zoom URL → choose meeting type (e.g. Stand-up, Sales, Technical)                  | Meeting card appears in the list with the correct type badge |
| 2.2 | Deploy Lira bot into the meeting  | Click **Deploy** on the meeting card → watch the bot status progress through: Launching → Opening meeting → Waiting in lobby → Joining → Active | Bot status reaches **Active**                                |
| 2.3 | Mute / unmute the bot mid-meeting | Use the mute toggle on the active bot card                                                                                                      | Bot responds to mute/unmute commands in real time            |
| 2.4 | Trigger Lira to speak             | Click **Ask Lira to speak**                                                                                                                     | Bot delivers a voice response inside the meeting             |
| 2.5 | End the meeting / terminate bot   | Click **End**                                                                                                                                   | Bot leaves the meeting; status changes to **Terminated**     |

### 2B — The Live Audio Meeting Room (in-app)

| #    | Test                             | What to show                                               | Expected result                               |
| ---- | -------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| 2.6  | Start an in-app audio meeting    | Go to **/meeting** → set a title → click **Start Meeting** | Microphone activates; live transcript appears |
| 2.7  | Speak and see live transcription | Say a few sentences out loud                               | Words appear in the transcript in real time   |
| 2.8  | Wake-word interaction            | Say _"Hey Lira"_ followed by a question                    | Lira AI responds with a spoken + text answer  |
| 2.9  | Mute / unmute yourself           | Toggle the mute button                                     | Audio pauses/resumes; UI reflects muted state |
| 2.10 | End the meeting                  | Click **Leave**                                            | Meeting ends; you are redirected              |

---

## Section 3 — Meeting Intelligence: Summary, Transcript & AI Chat

> **Video title idea:** _"Lira writes your meeting notes before you even close the tab"_

| #   | Test                          | What to show                                                                               | Expected result                                                       |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 3.1 | Open a completed meeting      | Navigate to **Meetings** → click a finished meeting                                        | Meeting detail page opens showing participants, duration, date        |
| 3.2 | View the full transcript      | Scroll through the transcript section                                                      | Every utterance is shown with speaker name and timestamp              |
| 3.3 | View the AI-generated summary | Click or scroll to the **Summary** section                                                 | A structured summary is displayed (key topics, decisions, etc.)       |
| 3.4 | Chat about the meeting        | Type a question in the **Ask Lira** chat box (e.g. _"What were the main decisions made?"_) | Lira responds with a relevant, accurate answer drawn from the meeting |
| 3.5 | Share the meeting             | Click the **Share** icon                                                                   | A shareable link or share confirmation is produced                    |
| 3.6 | Edit the meeting title/type   | Click the **Edit** (pencil) icon                                                           | Title and type can be changed inline; changes save                    |

---

## Section 4 — Tasks: AI-Generated Action Items from Meetings

> **Video title idea:** _"Every meeting automatically creates tasks for your team"_

| #   | Test                                     | What to show                                                          | Expected result                                                                                 |
| --- | ---------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 4.1 | View auto-generated tasks from a meeting | On the meeting detail page scroll to the **Tasks** section            | Tasks extracted by the AI are listed (type: action item, follow-up email, draft document, etc.) |
| 4.2 | Browse the Tasks page                    | Go to **/tasks**                                                      | All tasks across meetings are listed with status, priority, and type badges                     |
| 4.3 | Filter by status                         | Switch between Pending → In Progress → Completed                      | List filters correctly                                                                          |
| 4.4 | Create a manual task                     | Click **+** → fill in title, type, priority, assignee, linked meeting | Task appears in the list                                                                        |
| 4.5 | Update task status                       | Change a task from **Pending** to **In Progress**                     | Status badge and colour update immediately                                                      |
| 4.6 | Delete a task                            | Click delete on a task → confirm                                      | Task is removed from the list                                                                   |

---

## Section 5 — Schedules: Recurring AI Meeting Presence

> **Video title idea:** _"Lira joins your recurring stand-ups automatically — no invite needed"_

| #   | Test                        | What to show                                                                                                  | Expected result                                     |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 5.1 | Create a recurring schedule | On the Meetings page open the **Schedule** modal → set a meeting URL, recurrence (daily/weekly), day and time | Schedule is saved and appears in the schedules list |
| 5.2 | Enable / disable a schedule | Toggle the schedule on/off                                                                                    | Status updates immediately                          |
| 5.3 | Edit an existing schedule   | Click edit on a schedule → change the time or recurrence                                                      | Changes are saved                                   |
| 5.4 | Delete a schedule           | Click delete → confirm                                                                                        | Schedule is removed                                 |

---

## Section 6 — Interviews: AI-Powered Candidate Screening

> **Video title idea:** _"Lira interviews candidates while you sleep — here's the full walkthrough"_

### 6A — Creating an Interview

| #   | Test                          | What to show                                                                                                                  | Expected result                                                      |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 6.1 | Create a new interview record | Go to **Interviews** → click **+** → enter role title, candidate name, candidate email                                        | Interview record is created in **Draft** status                      |
| 6.2 | Set interview parameters      | Choose experience level (Junior/Mid/Senior), personality (Supportive/Challenger), mode (Solo AI / Copilot / Shadow), duration | All fields save correctly                                            |
| 6.3 | Upload a candidate résumé     | Click **Upload Résumé** → select a PDF                                                                                        | Résumé is uploaded and attached to the interview                     |
| 6.4 | AI question generation        | Click **Generate Questions**                                                                                                  | Lira generates a set of role-specific interview questions in seconds |
| 6.5 | Review & edit questions       | Add, remove, or reorder the generated questions                                                                               | Questions update in real time                                        |

### 6B — Running the Interview

| #   | Test                            | What to show                                         | Expected result                                                       |
| --- | ------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| 6.6 | Start an interview session      | Click **Start Session** on the interview detail page | Session starts; bot status goes to **Bot Deployed** → **In Progress** |
| 6.7 | Watch Lira ask questions        | Monitor the live transcript                          | Lira asks the generated questions in turn                             |
| 6.8 | Mute / unmute the interview bot | Toggle mute on the active bot                        | Bot responds to commands                                              |
| 6.9 | Cancel/end the interview        | Click **Cancel Session** or **End**                  | Session ends; status updates to **Completed** or **Cancelled**        |

### 6C — Post-Interview Intelligence

| #    | Test                      | What to show                                                           | Expected result                                                             |
| ---- | ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 6.10 | View the Q&A evaluation   | Open a completed interview → scroll to **Q&A Summary**                 | Each question shows: answer summary, score (0–100), quality label, analysis |
| 6.11 | Expand score & analysis   | Click **View score & analysis** on a Q&A card                          | Detailed analysis and key points appear                                     |
| 6.12 | Run AI evaluation         | Click **Run Evaluation**                                               | Lira re-evaluates the interview and updates scores                          |
| 6.13 | Record a hiring decision  | Click **Record Decision** → choose Hire / No Hire / Next Round         | Decision badge appears on the interview card                                |
| 6.14 | Browse interviews by role | On the **Interviews** page view role groups with candidate counts      | Roles are grouped; each shows candidate count and most recent date          |
| 6.15 | View related interviews   | On the interview detail page, check the **Related Interviews** section | Other candidates for the same role are shown                                |

---

## Section 7 — Customer Support: The AI Support Agent

> **Video title idea:** _"We replaced our support inbox with an AI — this is what it looks like"_

### 7A — Activation & Setup

| #   | Test                             | What to show                                                        | Expected result                                                                                   |
| --- | -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 7.1 | Activate the support module      | Go to **/support** → follow the activation flow                     | Support is activated; a dedicated `support-xxx@liraintelligence.com` email address is provisioned |
| 7.2 | Configure the widget             | Set greeting text, brand colour, logo                               | Widget preview updates live as you type                                                           |
| 7.3 | Get the embed snippet            | Copy the widget embed code                                          | Code snippet is copied to clipboard                                                               |
| 7.4 | Connect integrations for support | Connect Slack and/or HubSpot or Salesforce from the activation page | Integration shows as **Connected**                                                                |

### 7B — Inbox & Conversations

| #   | Test                           | What to show                                      | Expected result                                                                                             |
| --- | ------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 7.5 | View the support inbox         | Go to **Support → Inbox**                         | All conversations are listed with status badges (Open / Pending / Escalated / Resolved) and sentiment icons |
| 7.6 | Filter conversations by status | Switch between Open, Pending, Escalated, Resolved | List filters correctly                                                                                      |
| 7.7 | Open a conversation            | Click on a conversation                           | Full conversation thread opens with AI and customer messages                                                |
| 7.8 | Search conversations           | Type a keyword in the search box                  | Matching conversations are highlighted                                                                      |

### 7C — Customers

| #    | Test                   | What to show                  | Expected result                                              |
| ---- | ---------------------- | ----------------------------- | ------------------------------------------------------------ |
| 7.9  | View customer profiles | Go to **Support → Customers** | List of customers with conversation counts and last activity |
| 7.10 | Open a customer detail | Click on a customer           | Full customer profile with all conversation history          |

### 7D — AI Actions & Approvals

| #    | Test                    | What to show                                 | Expected result                                               |
| ---- | ----------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| 7.11 | View pending AI actions | Go to **Support → Actions → Approval Queue** | Pending automated actions awaiting human approval             |
| 7.12 | Approve an action       | Click **Approve** on a pending action        | Action is executed; moves to History tab                      |
| 7.13 | Reject an action        | Click **Reject**                             | Action is rejected; moves to History with **Rejected** status |
| 7.14 | View action history     | Click the **History** tab                    | All past actions are shown with their final status            |

### 7E — Proactive Outreach

| #    | Test                       | What to show                                                                                                                      | Expected result                           |
| ---- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 7.15 | Create a proactive trigger | Go to **Support → Proactive → Triggers** → click **+** → set name, event type, outreach template, channel (email/voice), cooldown | Trigger is created and enabled            |
| 7.16 | View activity log          | Click **Activity Log** tab                                                                                                        | Log of all outreach attempts is displayed |

### 7F — Analytics

| #    | Test                        | What to show                             | Expected result                                                                            |
| ---- | --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| 7.17 | View support overview stats | Go to **Support → Analytics → Overview** | Key metrics: total conversations, resolution rate, avg. response time, sentiment breakdown |
| 7.18 | View weekly report          | Click **Weekly Report** tab              | AI-generated weekly performance summary                                                    |

---

## Section 8 — Knowledge Base: Teaching Lira About Your Business

> **Video title idea:** _"How Lira learns everything about your company in minutes"_

| #   | Test                          | What to show                                                           | Expected result                                        |
| --- | ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 8.1 | Upload a document             | Go to **Knowledge Base → Documents** → upload a PDF or text file       | Document appears in the list; status shows as indexed  |
| 8.2 | Connect a Google Drive folder | Go to **Connected Sources** → connect Google Drive → pick a folder     | Folder syncs and documents appear                      |
| 8.3 | Crawl a website               | Go to **Web Sources** → enter a URL → start crawl                      | Crawl runs; pages are indexed into the knowledge base  |
| 8.4 | Query the knowledge base      | Go to **Query** tab → type a question related to your uploaded content | Lira returns an accurate answer with source references |

---

## Section 9 — Integrations: Connecting Your Stack

> **Video title idea:** _"Lira plugs into your entire tech stack — here's how"_

| #   | Test                              | What to show                                                            | Expected result                                                               |
| --- | --------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 9.1 | Connect Google (Calendar + Drive) | Go to **Integrations** → click **Connect Google**                       | OAuth flow completes; Google Calendar and Drive show as connected             |
| 9.2 | Set default calendar              | After connecting Google, select a default calendar                      | Calendar is saved; Lira can use it for meeting scheduling                     |
| 9.3 | Connect Slack                     | Click **Connect Slack** → authorise                                     | Slack shows as connected; a default channel can be set                        |
| 9.4 | Connect Linear                    | Click **Connect Linear** → authorise → pick a team                      | Linear shows as connected; team member mappings can be set                    |
| 9.5 | Connect HubSpot                   | Click **Connect HubSpot** → authorise                                   | HubSpot shows as connected; contacts/deals/pipelines are accessible           |
| 9.6 | Connect Salesforce                | Click **Connect Salesforce** → authorise                                | Salesforce shows as connected; contacts/accounts/opportunities are accessible |
| 9.7 | Connect Greenhouse (ATS)          | Enter Greenhouse API key → save                                         | Greenhouse shows as connected; jobs and candidates are listed                 |
| 9.8 | Connect GitHub                    | Click **Connect GitHub** → authorise                                    | GitHub shows as connected; repos, issues, and PRs are accessible              |
| 9.9 | Browse integration data           | Click into a connected integration → browse files, events, issues, etc. | Data from the integration loads correctly inside Lira                         |

---

## Section 10 — Dashboard: The Command Centre

> **Video title idea:** _"Everything you need in one place — the Lira dashboard"_

| #    | Test                               | What to show                               | Expected result                                                                             |
| ---- | ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 10.1 | View dashboard stats               | Open the **Dashboard**                     | KPI cards show: total meetings, total interviews, open support conversations, pending tasks |
| 10.2 | Recent meetings widget             | Scroll to Recent Meetings                  | Latest meetings listed with type, date, and quick link                                      |
| 10.3 | Recent interviews widget           | Scroll to Recent Interviews                | Latest interviews listed with candidate name, role, status                                  |
| 10.4 | Active bots from dashboard         | Check the active bots panel                | Any currently running bots are visible with live status                                     |
| 10.5 | Quick-deploy a bot                 | Use the deploy shortcut on the dashboard   | Bot deploys directly from the dashboard                                                     |
| 10.6 | Navigate to support from dashboard | Click the open support conversations count | Navigates to the support inbox                                                              |

---

## Section 11 — The Support Chat Widget (Customer-Facing)

> **Video title idea:** _"What your customers actually see when they chat with Lira"_

| #    | Test                          | What to show                                                  | Expected result                                          |
| ---- | ----------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| 11.1 | Open the widget demo page     | Open `test-support-widget.html` in a browser                  | The embedded chat widget appears in the corner           |
| 11.2 | Start a conversation          | Type a message into the widget                                | Lira responds with a greeting and attempts to answer     |
| 11.3 | Ask a knowledge-base question | Type a question that matches something in your Knowledge Base | Lira gives an accurate, sourced answer                   |
| 11.4 | Trigger escalation            | Ask something the bot can't handle                            | Bot gracefully escalates or offers to connect to a human |
| 11.5 | Voice interaction in widget   | If voice is enabled, speak a message                          | Voice input is transcribed and Lira responds             |

---

## Section 12 — Org Members & Roles

> **Video title idea:** _"Managing your team inside Lira"_

| #    | Test                   | What to show                               | Expected result                                                  |
| ---- | ---------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| 12.1 | View org members       | Go to **Org → Members**                    | All members listed with name, email, and role                    |
| 12.2 | View a member profile  | Click on a member                          | Member profile page with activity, meeting participation history |
| 12.3 | Change a member's role | Edit a member's role (admin/member/viewer) | Role updates and is reflected in the list                        |

---

## Section 13 — Settings & Personalisation

> **Video title idea:** _"Customising Lira to fit how your team works"_

| #    | Test             | What to show                                            | Expected result                                            |
| ---- | ---------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| 13.1 | Dark mode toggle | Switch to dark mode                                     | The entire UI switches cleanly                             |
| 13.2 | Account settings | Go to **Settings** → update display name or email prefs | Changes save                                               |
| 13.3 | Usage & limits   | Go to **Usage** page                                    | Current usage stats and plan limits are visible            |
| 13.4 | Webhooks         | Go to **Webhooks** page → add a webhook URL             | Webhook is registered; events to listen to can be selected |

---

## Suggested Recording Order for Maximum Impact

If you want to post in a logical narrative sequence:

1. **Workspace setup** (Section 1) — the foundation
2. **Dashboard tour** (Section 10) — overview of the whole product
3. **Knowledge Base** (Section 8) — teach Lira before showing it in action
4. **Live meeting with bot** (Section 2A) — the "wow" moment
5. **Meeting intelligence** (Section 3) — show the output
6. **Tasks** (Section 4) — show the downstream value
7. **Interviews** (Section 6) — separate vertical
8. **Customer Support activation** (Section 7A–7B) — third vertical
9. **Support widget** (Section 11) — show the customer side
10. **Integrations** (Section 9) — show how it connects to everything else

---

## Issues Tracker

Use this table to log anything that breaks or looks wrong during recording.

| Section | Test # | Issue Description | Severity | Fixed? |
| ------- | ------ | ----------------- | -------- | ------ |
|         |        |                   |          |        |

---

## Notes

- All bot deployments require a **live** Google Meet or Zoom link to test properly. Have a secondary Google account ready to host the call.
- For the interview session tests, have a real or dummy résumé PDF ready to upload.
- For the Knowledge Base crawl test, use a public URL (e.g. your own docs site or a simple landing page).
- For the support widget demo, open `test-support-widget.html` directly in a browser and make sure the support module is already activated for your org.

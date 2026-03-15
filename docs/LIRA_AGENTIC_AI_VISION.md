# Lira AI — Agentic AI Vision & Architecture

**Version:** 1.0  
**Date:** March 13, 2026  
**Status:** Draft / Brainstorm

---

## Table of Contents

1. [The Problem with Lira Today](#1-the-problem-with-lira-today)
2. [The Vision: From Observer to Operator](#2-the-vision-from-observer-to-operator)
3. [Core Agentic Capabilities](#3-core-agentic-capabilities)
   - [3.1 AI-Conducted Interviews](#31-ai-conducted-interviews)
   - [3.2 Task Creation & Project Management Integration](#32-task-creation--project-management-integration)
   - [3.3 Autonomous Meeting Scheduling & Coordination](#33-autonomous-meeting-scheduling--coordination)
   - [3.4 Email & Communication Agent](#34-email--communication-agent)
4. [Additional Agentic Ideas](#4-additional-agentic-ideas)
   - [4.1 Standup & Check-in Automation](#41-standup--check-in-automation)
   - [4.2 Onboarding Copilot](#42-onboarding-copilot)
   - [4.3 Decision Tracker & Action Item Enforcer](#43-decision-tracker--action-item-enforcer)
   - [4.4 Knowledge Base Builder](#44-knowledge-base-builder)
   - [4.5 Performance & Sentiment Pulse](#45-performance--sentiment-pulse)
   - [4.6 Client Relationship Manager](#46-client-relationship-manager)
5. [System Architecture](#5-system-architecture)
   - [5.1 Agent Core (The Brain)](#51-agent-core-the-brain)
   - [5.2 Integration Layer](#52-integration-layer)
   - [5.3 Memory & Context System](#53-memory--context-system)
   - [5.4 Action Execution Engine](#54-action-execution-engine)
6. [Data Model](#6-data-model)
7. [Integration Map](#7-integration-map)
8. [Security & Trust Model](#8-security--trust-model)
9. [Implementation Phases](#9-implementation-phases)
10. [What Makes This Different](#10-what-makes-this-different)

---

## 1. The Problem with Lira Today

Lira currently does three things well:

1. **Joins meetings** as a voice participant via Google Meet
2. **Listens and responds** to questions in real-time
3. **Summarizes** meetings after they end

This is impressive technically, but from a business value standpoint, it puts Lira in the same category as Otter.ai, Fireflies, and every other meeting note-taker. The honest question a business asks is:

> "Okay, it can sit in my meeting and take notes. So what? How does this save me money, reduce my workload, or make my team more productive?"

The answer right now is: **it doesn't do enough.**

Lira needs to evolve from a **passive observer** into an **active operator** — an AI that doesn't just understand what happened in a meeting, but **acts on it**. The meeting is just the entry point. The real value is everything that happens after.

---

## 2. The Vision: From Observer to Operator

```
┌─────────────────────────────────────────────────────────────────┐
│                        LIRA TODAY                               │
│                                                                 │
│    Meeting → Listen → Summarize → Done                          │
│                                                                 │
│    (passive, single-purpose, no follow-through)                 │
└─────────────────────────────────────────────────────────────────┘

                              ↓ EVOLUTION ↓

┌─────────────────────────────────────────────────────────────────┐
│                      LIRA AGENTIC                               │
│                                                                 │
│    Meeting → Understand → Decide → Act → Follow Up → Report    │
│                                                                 │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│    │Interview │  │ Create   │  │ Schedule │  │ Send     │     │
│    │Candidates│  │ Tasks    │  │ Meetings │  │ Emails   │     │
│    ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤     │
│    │ Evaluate │  │ Assign   │  │ Notify   │  │ Follow   │     │
│    │ & Score  │  │ to People│  │ People   │  │ Up       │     │
│    ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤     │
│    │ Report   │  │ Track    │  │ Attend & │  │ Report   │     │
│    │ Findings │  │ Progress │  │ Run      │  │ Back     │     │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                 │
│    (proactive, multi-domain, autonomous, accountable)           │
└─────────────────────────────────────────────────────────────────┘
```

**The core shift:** Lira becomes an employee, not a tool. It has responsibilities, takes initiative, reports back, and its value is measured in hours saved and outcomes delivered.

---

## 3. Core Agentic Capabilities

### 3.1 AI-Conducted Interviews

#### What It Does

Lira conducts job interviews autonomously — either as the sole interviewer or as a co-interviewer alongside a human. After the interview, it produces a structured evaluation with scores, strengths, concerns, and a hire/no-hire recommendation.

#### How It Works

**Setup Phase (on the Lira dashboard):**

1. **Create an Interview** — The hiring manager creates an interview inside Lira. They provide:
   - Job title and description
   - Required skills and experience
   - Custom questions (optional — Lira can generate its own based on the role)
   - Evaluation criteria and weights (e.g., "technical depth: 30%, communication: 20%, culture fit: 20%, problem-solving: 30%")
   - Interview mode:
     - **Solo Mode** — Lira conducts the entire interview on its own
     - **Co-Pilot Mode** — A human leads, Lira listens and asks follow-up questions at the end
     - **Shadow Mode** — Lira only observes and evaluates silently

2. **Attach a Meeting Link** — The user pastes the Google Meet link. Lira now knows this meeting is an interview and will behave accordingly.

3. **Candidate Info (optional)** — Upload a resume or paste a LinkedIn URL. Lira uses this to personalize questions ("I see you worked at Stripe for 3 years on payment infrastructure — can you walk me through a challenge you faced there?").

**During the Interview:**

- Lira joins the Google Meet at the scheduled time
- In **Solo Mode**: Lira introduces itself, explains the process, and begins asking questions. It adapts its follow-ups based on the candidate's answers (not a rigid script).
- In **Co-Pilot Mode**: Lira listens to the human interviewer. When the human says "Lira, your turn" or a similar trigger phrase, Lira asks its own questions — specifically targeting gaps the human didn't cover.
- In **Shadow Mode**: Lira is silent throughout, only observing.
- Lira keeps track of time ("We have about 10 minutes left, so let me ask one final question...")
- Lira handles awkward situations gracefully (candidate goes on a tangent → Lira gently redirects)

**After the Interview — The Evaluation:**

```
┌────────────────────────────────────────────────────┐
│           INTERVIEW EVALUATION REPORT              │
│                                                    │
│  Candidate: Jane Smith                             │
│  Role: Senior Backend Engineer                     │
│  Date: March 13, 2026                              │
│  Duration: 42 minutes                              │
│  Mode: Solo Interview                              │
│                                                    │
│  ── OVERALL SCORE ──────────────── 78/100 ──       │
│                                                    │
│  Technical Depth        ████████░░  82/100          │
│  Communication          ███████░░░  74/100          │
│  Problem Solving        ████████░░  80/100          │
│  Culture Fit            ███████░░░  72/100          │
│  Leadership Potential   ████████░░  81/100          │
│                                                    │
│  ── RECOMMENDATION ─────────────────────── ──      │
│  ✅ RECOMMENDED FOR NEXT ROUND                     │
│                                                    │
│  Strengths:                                        │
│  • Deep understanding of distributed systems       │
│  • Clear communicator when discussing technical     │
│    architecture                                    │
│  • Asked insightful questions about the team       │
│                                                    │
│  Concerns:                                         │
│  • Limited experience with event-driven systems    │
│  • Hesitated on system design question about       │
│    handling 10M concurrent connections              │
│                                                    │
│  Notable Quotes:                                   │
│  "I believe in building systems that fail          │
│   gracefully rather than trying to prevent all     │
│   failures" — context: discussing resilience        │
│                                                    │
│  ── FULL TRANSCRIPT ───────────────────────        │
│  [Expandable]                                      │
└────────────────────────────────────────────────────┘
```

#### Why This Is Valuable

- **Saves 2-5 hours per interview** for hiring managers (prep, conducting, writing evaluations)
- **Standardized evaluation** — every candidate is scored on the same criteria, reducing bias
- **24/7 interviewing** — Lira can interview candidates in any timezone without human availability constraints
- **Screening at scale** — a company hiring 50 engineers can have Lira conduct all first-round interviews, and humans only step in for the final round

---

### 3.2 Task Creation & Project Management Integration

#### What It Does

Lira listens to meetings, identifies action items, and automatically creates tasks in the team's project management tool (Jira, Linear, ClickUp, Asana, Notion). It assigns tasks to the right people, sets priorities, and can track follow-ups.

#### How It Works

**Integration Setup:**

1. **Connect PM Tool** — In Lira's org settings, the admin connects their Jira/Linear/ClickUp workspace via OAuth. Lira gets read/write access to create issues and read team members.

2. **Team Mapping** — Lira maps org members to their PM tool identities (Jira user IDs, Linear handles, etc.). This can be auto-detected from email addresses or manually configured.

3. **Project Context** — Lira reads the team's existing project structure (boards, sprints, labels, epics). This lets it categorize new tasks correctly instead of dumping everything into a generic backlog.

**During Meetings:**

Lira listens for action items — both explicit and implicit:

| What's Said                                            | What Lira Does                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| "John, can you fix that authentication bug by Friday?" | Creates a bug ticket, assigns to John, sets due date to Friday                                                          |
| "We need to migrate the database before the launch"    | Creates an epic/task, flags it as high priority, doesn't assign (asks in the meeting or post-meeting who should own it) |
| "Someone should look into why the checkout is slow"    | Creates an investigation task, suggests assignment based on who owns that area of the codebase                          |
| "Let's revisit this next week"                         | Creates a follow-up reminder, schedules it, links to the meeting context                                                |

**After Meetings:**

- Lira posts a summary in the team's Slack channel (or via email) with all created tasks and links
- Team members can approve, modify, or reject tasks before they're finalized (configurable — some teams may want auto-create, others want approval)
- Lira tracks whether tasks are completed by their due dates and can send gentle follow-ups

**Smart Task Classification:**

```
Meeting Transcript → Lira's NLP Pipeline
                         ↓
              ┌──────────────────────┐
              │  Action Item Detector │
              │  ─────────────────── │
              │  • Explicit commands  │
              │  • Implicit to-dos    │
              │  • Decisions made     │
              │  • Questions deferred │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │  Task Enrichment     │
              │  ─────────────────── │
              │  • Type (bug/feature │
              │    /task/spike)      │
              │  • Priority (P0-P3)  │
              │  • Assignee (from    │
              │    context + team    │
              │    ownership map)    │
              │  • Due date (from    │
              │    spoken deadlines) │
              │  • Labels/epic       │
              └──────────┬───────────┘
                         ↓
              ┌──────────────────────┐
              │  PM Tool Writer      │
              │  ─────────────────── │
              │  • Jira → POST issue │
              │  • Linear → mutation │
              │  • ClickUp → task    │
              │  • Links back to     │
              │    meeting transcript│
              └──────────────────────┘
```

#### Why This Is Valuable

- **Eliminates "meeting tax"** — nobody has to spend 15 minutes after a meeting writing up action items
- **Nothing falls through the cracks** — every commitment made in a meeting becomes a tracked task
- **Context is preserved** — each task links back to the meeting transcript and the exact moment it was discussed
- **Smart assignment** — Lira knows who works on what and assigns accordingly

---

### 3.3 Autonomous Meeting Scheduling & Coordination

#### What It Does

Lira manages the team's meeting lifecycle end-to-end: schedules meetings, sends personalized invitations via Slack DM or email, waits in the meeting room for participants, sends reminders, and follows up with no-shows.

#### How It Works

**Scheduling:**

There are two modes:

1. **Recurring Smart Meetings** — Instead of fixed calendar events, Lira manages "flexible meetings" where the time shifts based on team availability, timezone conflicts, or priority.
   - Example: Daily standup is "sometime between 9 AM and 11 AM" — Lira picks the optimal time each day based on everyone's calendar.

2. **Ad-hoc Meeting Creation** — Anyone can tell Lira (via Slack, the dashboard, or even during another meeting): "Lira, schedule a design review for this week with Alice, Bob, and Carol."
   - Lira checks calendars, proposes times, and confirms

**Notification Flow:**

```
Lira determines meeting time
         ↓
┌────────────────────────────────────────┐
│  INDIVIDUAL NOTIFICATIONS (not group)  │
│                                        │
│  Slack DM to Alice:                    │
│  "Hey Alice, there's a design review   │
│   today at 3 PM. Here's the link:      │
│   [Google Meet URL]                    │
│   Agenda: Review the new onboarding    │
│   flow mockups from yesterday's        │
│   discussion."                         │
│                                        │
│  Slack DM to Bob:                      │
│  "Hey Bob, design review at 3 PM       │
│   today. I know you mentioned the      │
│   header component concern yesterday — │
│   we can address that. Link: [URL]"    │
│                                        │
│  (personalized, contextual messages)   │
└────────────────────────────────────────┘
         ↓
Lira joins the Google Meet at 2:58 PM
         ↓
Lira is already there when people join
         ↓
5 mins after start, if Carol hasn't joined:
  → Lira sends Carol a Slack DM:
    "Hey Carol, the design review started
     5 minutes ago. Are you joining?"
```

**Key principle:** Notifications are **individual, not group**. This is more personal, harder to ignore, and lets Lira add context specific to each person.

**Meeting Lifecycle:**

```
Schedule → Notify → Remind → Attend → Conduct → Summarize → Follow Up
   ↑                                                            │
   └────────── feedback loop (reschedule if needed) ────────────┘
```

**Interview Scheduling (combines with 3.1):**

When the org wants to interview a candidate:

1. Tell Lira: "Schedule an interview with jane@example.com for the Senior Backend Engineer role"
2. Lira sends Jane an email introducing itself and proposing times
3. Jane replies with her preferred time (Lira reads and understands the email)
4. Lira confirms, creates the Google Meet, and sends the link to both Jane and the hiring manager
5. If Jane doesn't reply within 24 hours, Lira follows up
6. After the interview, Lira sends Jane a thank-you email

#### Why This Is Valuable

- **Zero calendar management overhead** — no more "when are you free?" ping-pong
- **Lira is always early** — it's in the meeting room before anyone else, ready to go
- **Personal touch** — individual notifications feel more intentional than a calendar invite lost in 50 other notifications
- **Follow-up automation** — no-shows get gentle nudges, no manual chasing

---

### 3.4 Email & Communication Agent

#### What It Does

Lira manages a dedicated email inbox (e.g., `lira@company.com` or `hiring@company.com`) and can read, compose, and respond to emails on behalf of the organization — with appropriate guardrails.

#### How It Works

- Lira monitors a connected email inbox (Gmail/Outlook via OAuth or IMAP)
- For known workflows (interview scheduling, follow-ups, meeting coordination), Lira responds autonomously
- For unknown/sensitive emails, Lira drafts a response and surfaces it to the appropriate team member for approval
- All email activity is logged in the Lira dashboard with full audit trail

**Guardrails:**

| Scenario                                        | Lira's Behavior                             |
| ----------------------------------------------- | ------------------------------------------- |
| Candidate asks "What's the salary range?"       | Drafts response, flags for human approval   |
| Candidate says "Can we reschedule to Thursday?" | Responds autonomously, updates the calendar |
| Unknown person emails asking about services     | Drafts response, flags for human review     |
| Candidate confirms interview time               | Responds with confirmation, creates meeting |

**The key insight:** Lira should handle the routine 80% autonomously and escalate the sensitive 20%. The org owner/admin can always review what Lira has been doing via an "Activity Feed" on the dashboard.

---

## 4. Additional Agentic Ideas

These are capabilities that naturally extend from the foundation above and would further differentiate Lira from anything else on the market.

### 4.1 Standup & Check-in Automation

**Problem:** Daily standups waste 15-30 minutes when half the team just says "same as yesterday."

**Lira's approach:**

- Lira DMs each team member on Slack at 9 AM: "What are you working on today? Any blockers?"
- Team members reply asynchronously (text or voice message)
- Lira compiles all responses into a single standup summary and posts it to the team channel
- If someone mentions a blocker, Lira proactively pings the person who can help
- No meeting needed. 15 minutes saved per person per day.

**Escalation logic:** If three team members mention the same blocker, Lira schedules an emergency sync meeting.

---

### 4.2 Onboarding Copilot

**Problem:** New employees spend their first 2 weeks lost — reading outdated docs, not knowing who to ask, sitting in meetings without context.

**Lira's approach:**

- When a new employee is added to the org, Lira becomes their onboarding buddy
- Day 1: Lira sends them a welcome message, introduces the team (based on org data), and gives them a rundown of active projects
- Week 1: Lira schedules 1:1s with key team members, shares relevant meeting summaries from the past 2 weeks, and answers questions about company processes
- Ongoing: Lira sits in on the new employee's meetings and privately sends them context ("FYI, when John mentioned 'Project Atlas,' he's referring to the v2 API migration that started in January")

---

### 4.3 Decision Tracker & Action Item Enforcer

**Problem:** Decisions made in meetings are forgotten. Action items are assigned but never tracked.

**Lira's approach:**

- Lira maintains a living "Decision Log" for the org — every significant decision made in any meeting is recorded with context, date, and who made it
- When someone in a future meeting contradicts a past decision, Lira flags it: "Just a heads up — on February 12, the team decided to use PostgreSQL instead of MongoDB for this project. Want me to pull up the context?"
- For action items: Lira tracks deadlines and sends reminders. If a task is overdue, Lira asks the assignee for a status update. If it's still blocked, Lira escalates to their manager.

**Accountability without micromanagement.** The AI enforces follow-through so humans don't have to nag each other.

---

### 4.4 Knowledge Base Builder

**Problem:** Institutional knowledge lives in people's heads and dies when they leave.

**Lira's approach:**

- Every meeting Lira attends becomes a searchable, indexed entry in the org's knowledge base
- Lira automatically categorizes discussions by topic, project, and team
- Anyone can ask Lira: "What did we decide about the pricing model?" and Lira searches across all past meetings to find the answer — with timestamps and audio clips
- Over time, Lira builds a structured wiki from unstructured meeting conversations
- When someone asks a question that was already answered in a past meeting, Lira surfaces it instead of letting the team have the same discussion twice

---

### 4.5 Performance & Sentiment Pulse

**Problem:** Managers don't know how their team is feeling until it's too late (burnout, disengagement, frustration).

**Lira's approach:**

- Lira periodically (weekly) sends private check-in DMs: "How's your week going? Anything I can help with?"
- Responses are anonymized and aggregated into a team sentiment dashboard for managers
- Lira detects patterns: "Engineering team sentiment dropped 15% this sprint — common themes: unclear requirements, deadline pressure"
- No invasive surveillance — this is opt-in and anonymous
- Managers get actionable insights, not raw data

**Important:** This must be handled with extreme care around privacy. Employees must explicitly opt in, and individual responses must never be attributable.

---

### 4.6 Client Relationship Manager

**Problem:** After client calls, action items get lost, follow-ups are late, and context is scattered across inboxes and Slack channels.

**Lira's approach:**

- Lira attends client meetings and maintains a per-client context file
- After each call, Lira creates a client-facing summary (professional, no internal jargon) that can be sent to the client
- Lira tracks commitments made to clients and ensures they're fulfilled
- Before the next client call, Lira briefs the team: "Last time, we promised them the API docs by March 15. Those haven't been shared yet."
- Lira can even send the follow-up email to the client: "Hi Sarah, thanks for the call today. Here's a summary of what we discussed and next steps..."

---

## 5. System Architecture

### 5.1 Agent Core (The Brain)

The Agent Core is the central intelligence that processes inputs, maintains context, makes decisions, and dispatches actions.

```
                    ┌─────────────────────────────┐
                    │        AGENT CORE           │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │   Perception Layer    │  │
                    │  │   ─────────────────   │  │
                    │  │   • Meeting audio     │  │
                    │  │   • Email content     │  │
                    │  │   • Slack messages    │  │
                    │  │   • Calendar events   │  │
                    │  │   • PM tool updates   │  │
                    │  └───────────┬───────────┘  │
                    │              ↓               │
                    │  ┌───────────────────────┐  │
                    │  │   Understanding       │  │
                    │  │   ─────────────────   │  │
                    │  │   • Intent detection  │  │
                    │  │   • Entity extraction │  │
                    │  │   • Sentiment analysis│  │
                    │  │   • Context retrieval │  │
                    │  └───────────┬───────────┘  │
                    │              ↓               │
                    │  ┌───────────────────────┐  │
                    │  │   Planning Layer      │  │
                    │  │   ─────────────────   │  │
                    │  │   • Goal decomposition│  │
                    │  │   • Action sequencing │  │
                    │  │   • Tool selection    │  │
                    │  │   • Risk assessment   │  │
                    │  └───────────┬───────────┘  │
                    │              ↓               │
                    │  ┌───────────────────────┐  │
                    │  │   Execution Layer     │  │
                    │  │   ─────────────────   │  │
                    │  │   • API calls         │  │
                    │  │   • Email composition │  │
                    │  │   • Task creation     │  │
                    │  │   • Meeting scheduling│  │
                    │  └───────────┬───────────┘  │
                    │              ↓               │
                    │  ┌───────────────────────┐  │
                    │  │   Reflection Layer    │  │
                    │  │   ─────────────────   │  │
                    │  │   • Outcome tracking  │  │
                    │  │   • Self-correction   │  │
                    │  │   • Learning / adapt  │  │
                    │  └───────────────────────┘  │
                    └─────────────────────────────┘
```

### 5.2 Integration Layer

Every external service Lira connects to goes through a unified integration layer with OAuth, rate limiting, and retry logic.

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                           │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ Google  │  │  Slack  │  │  Jira   │  │ Linear  │          │
│  │ Meet    │  │   API   │  │   API   │  │   API   │          │
│  │ + Cal   │  │         │  │         │  │         │          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ClickUp │  │ Asana   │  │ Gmail / │  │ Outlook │          │
│  │   API   │  │   API   │  │ SMTP    │  │   API   │          │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │ Notion  │  │ GitHub  │  │ Webhook │                        │
│  │   API   │  │   API   │  │ (Inbound│                        │
│  │         │  │         │  │  /Outb.) │                        │
│  └─────────┘  └─────────┘  └─────────┘                        │
│                                                                 │
│  ── All integrations go through: ──                             │
│  • OAuth 2.0 token management (refresh, revoke)                │
│  • Rate limiter (per-service, per-org)                          │
│  • Retry with exponential backoff                               │
│  • Audit logger (every API call is logged)                      │
│  • Circuit breaker (disable failing integrations gracefully)    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Memory & Context System

This is what makes Lira truly intelligent over time — a layered memory system that gives the AI persistent context across meetings, days, and months.

```
┌──────────────────────────────────────────────────────────┐
│                   MEMORY SYSTEM                          │
│                                                          │
│  Layer 1: WORKING MEMORY (current meeting/conversation)  │
│  ─────────────────────────────────────────────────────── │
│  • Current transcript buffer                             │
│  • Active participants and their roles                   │
│  • Running list of action items from this session        │
│  • Emotional/sentiment tracking for this conversation    │
│  TTL: Duration of the meeting                            │
│                                                          │
│  Layer 2: SHORT-TERM MEMORY (recent days/weeks)          │
│  ─────────────────────────────────────────────────────── │
│  • Past 30 days of meeting summaries                     │
│  • Recent action items and their status                  │
│  • Ongoing conversations (email threads, Slack DMs)      │
│  • Current sprint context from PM tools                  │
│  Storage: DynamoDB with TTL                              │
│                                                          │
│  Layer 3: LONG-TERM MEMORY (organizational knowledge)    │
│  ─────────────────────────────────────────────────────── │
│  • Decision log (all major decisions + context)          │
│  • Team structure and roles                              │
│  • Project history and timelines                         │
│  • Company processes and preferences                     │
│  • Client relationship context                           │
│  Storage: Vector DB (Pinecone/pgvector) + S3             │
│                                                          │
│  Layer 4: IDENTITY (who Lira is for this org)            │
│  ─────────────────────────────────────────────────────── │
│  • Company name, industry, values                        │
│  • Communication style preferences                       │
│  • Org settings (already exists in current system)       │
│  • Boundaries (what Lira should/shouldn't do)            │
│  Storage: DynamoDB (already exists)                      │
└──────────────────────────────────────────────────────────┘
```

### 5.4 Action Execution Engine

The engine that turns Lira's decisions into real-world actions. Every action has an approval policy.

```
┌──────────────────────────────────────────────────────────┐
│              ACTION EXECUTION ENGINE                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            APPROVAL POLICIES                     │   │
│  │                                                  │   │
│  │  AUTO-APPROVE (Lira acts immediately):           │   │
│  │  • Send meeting reminders                        │   │
│  │  • Join scheduled meetings                       │   │
│  │  • Generate meeting summaries                    │   │
│  │  • Answer factual questions in meetings          │   │
│  │  • Send interview confirmation emails            │   │
│  │  • Create draft tasks (if team uses drafts)      │   │
│  │                                                  │   │
│  │  NOTIFY-THEN-ACT (Lira notifies, then acts       │   │
│  │  after 30min if no objection):                   │   │
│  │  • Create tasks in PM tool                       │   │
│  │  • Schedule meetings                             │   │
│  │  • Send follow-up emails to known contacts       │   │
│  │  • Reassign tasks based on workload              │   │
│  │                                                  │   │
│  │  APPROVAL-REQUIRED (Lira drafts, human approves):│   │
│  │  • Send emails to external contacts (first time) │   │
│  │  • Respond to sensitive questions                 │   │
│  │  • Modify project priorities                     │   │
│  │  • Share confidential information                 │   │
│  │  • Any financial or legal commitment              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Every action produces:                                  │
│  • Audit log entry (who triggered, what happened)        │
│  • Notification to relevant stakeholders                 │
│  • Rollback capability (undo within 5 minutes)           │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Data Model

Key new entities that extend the existing Lira data model:

```
Interview
├── id
├── org_id
├── title (e.g., "Senior Backend Engineer")
├── job_description (text)
├── required_skills (JSON array)
├── custom_questions (JSON array)
├── evaluation_criteria (JSON: { criterion: weight })
├── mode (solo | copilot | shadow)
├── status (draft | scheduled | in_progress | completed | cancelled)
├── meeting_link
├── candidate_name
├── candidate_email
├── candidate_resume_url (S3)
├── scheduled_at
├── evaluation (JSON — scores, strengths, concerns, recommendation)
├── transcript_id (FK → meeting transcript)
├── created_by (FK → user)
├── created_at / updated_at

AgentTask
├── id
├── org_id
├── source (meeting | slack | manual | email)
├── source_reference (meeting_id, message_id, etc.)
├── external_tool (jira | linear | clickup | asana)
├── external_id (JIRA-1234, LIN-567, etc.)
├── title
├── description
├── assignee_user_id
├── priority (p0 | p1 | p2 | p3)
├── due_date
├── status (draft | created | in_progress | done | cancelled)
├── approval_status (auto | pending | approved | rejected)
├── created_at / updated_at

ScheduledMeeting
├── id
├── org_id
├── title
├── meeting_type (standup | review | interview | ad_hoc | recurring)
├── meeting_link
├── scheduled_at
├── participants (JSON array of user_ids + external emails)
├── notification_sent (boolean)
├── reminder_sent (boolean)
├── lira_joined (boolean)
├── related_interview_id (nullable FK → Interview)
├── created_at / updated_at

EmailThread
├── id
├── org_id
├── thread_type (interview | follow_up | client | internal)
├── external_email
├── subject
├── messages (JSON array: { from, to, body, timestamp, lira_generated })
├── status (active | resolved | escalated)
├── assigned_to (user_id — who reviews Lira's drafts)
├── created_at / updated_at

DecisionLog
├── id
├── org_id
├── meeting_id
├── decision_text
├── context (surrounding transcript excerpt)
├── decided_by (array of user_ids)
├── tags (JSON array — project, topic)
├── superseded_by (nullable FK → newer DecisionLog)
├── created_at

Integration
├── id
├── org_id
├── service (slack | jira | linear | clickup | google | outlook)
├── access_token (encrypted)
├── refresh_token (encrypted)
├── token_expires_at
├── scopes (JSON array)
├── config (JSON — workspace ID, project mappings, etc.)
├── status (active | expired | revoked)
├── connected_by (user_id)
├── created_at / updated_at
```

---

## 7. Integration Map

Priority order for building integrations:

| Priority | Integration                  | Used By                                | Complexity         |
| -------- | ---------------------------- | -------------------------------------- | ------------------ |
| **P0**   | Google Meet (already exists) | All features                           | Done               |
| **P0**   | Google Calendar              | Scheduling, Interviews                 | Medium             |
| **P1**   | Slack                        | Notifications, Standups, Communication | Medium             |
| **P1**   | Gmail / SMTP                 | Email agent, Interview scheduling      | Medium             |
| **P1**   | Linear                       | Task creation (most modern API)        | Low                |
| **P2**   | Jira                         | Task creation (most widely used)       | High (complex API) |
| **P2**   | Notion                       | Knowledge base, Documentation          | Medium             |
| **P3**   | ClickUp                      | Task creation (alternative)            | Medium             |
| **P3**   | Asana                        | Task creation (alternative)            | Medium             |
| **P3**   | Microsoft Outlook / Teams    | Enterprise email & meetings            | High               |
| **P3**   | GitHub                       | Link tasks to PRs, code context        | Low                |

---

## 8. Security & Trust Model

Agentic AI that takes real-world actions on behalf of an organization demands a rigorous security and trust model.

### Principles

1. **Least Privilege** — Lira requests only the OAuth scopes it needs for the features the org has enabled. If they don't use the interview feature, Lira doesn't have calendar access.

2. **Audit Everything** — Every action Lira takes (email sent, task created, meeting scheduled) is logged with full context: who triggered it, what data was used, what the outcome was.

3. **Human-in-the-Loop for Sensitive Actions** — The approval policy system (Section 5.4) ensures Lira never takes high-risk actions without human review.

4. **Data Isolation** — Strict tenant isolation. Org A's meeting transcripts, decisions, and context are never accessible to Org B's Lira instance. Enforced at the database query level, not just the application level.

5. **Token Encryption** — All OAuth tokens are encrypted at rest (AES-256) and never logged or exposed in API responses.

6. **Revocability** — Any integration can be disconnected instantly from the dashboard. When disconnected, Lira immediately stops all actions related to that service and tokens are revoked.

7. **Transparency** — The Activity Feed on the dashboard shows everything Lira has done, is doing, and plans to do. No "black box" behavior.

---

## 9. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Build the infrastructure that all agentic features depend on.

- [ ] **Agent Core scaffolding** — Action queue, approval policy engine, audit logger
- [ ] **Integration framework** — OAuth flow, token management, unified API adapter pattern
- [ ] **Memory system (Layer 2 & 4)** — Short-term memory (recent meetings) + identity (existing org settings)
- [ ] **Activity Feed UI** — Dashboard page showing all Lira actions with timestamps and status
- [ ] **Google Calendar integration** — Read/write calendar events (prerequisite for scheduling)
- [ ] **Slack integration (basic)** — Send DMs and channel messages via Slack Bot

### Phase 2: Interviews (Weeks 5-8)

**Goal:** Launch the AI interview feature end-to-end.

- [ ] **Interview setup UI** — Create interview, define criteria, attach meeting link
- [ ] **Interview mode in Lira's meeting behavior** — Solo, Co-Pilot, Shadow modes
- [ ] **Evaluation engine** — Scoring, strengths/concerns extraction, recommendation
- [ ] **Interview review UI** — Dashboard page showing evaluation report, transcript, scores
- [ ] **Candidate email flow** — Scheduling, confirmation, thank-you (using Gmail integration)
- [ ] **Resume parsing** — Extract skills and experience from uploaded PDFs

### Phase 3: Task Management (Weeks 9-12)

**Goal:** Lira creates tasks from meetings and integrates with PM tools.

- [ ] **Action item detection** — NLP pipeline to extract tasks from transcripts
- [ ] **Linear integration** — Create issues, assign users, set priorities
- [ ] **Jira integration** — Same capabilities for Jira-using orgs
- [ ] **Post-meeting task summary** — Slack/email notification with all created tasks
- [ ] **Task approval workflow** — Draft → review → approve → create in PM tool
- [ ] **Team mapping UI** — Map org members to PM tool identities

### Phase 4: Scheduling & Communication (Weeks 13-16)

**Goal:** Lira autonomously manages meetings and email.

- [ ] **Meeting scheduling engine** — Calendar-aware scheduling with conflict resolution
- [ ] **Individual Slack notifications** — Personalized, contextual meeting reminders
- [ ] **Auto-join behavior** — Lira joins meetings 2 minutes early and waits
- [ ] **No-show follow-up** — Automatic nudges for late participants
- [ ] **Email agent** — Read inbox, compose responses, apply approval policies
- [ ] **Follow-up automation** — Track sent emails, send follow-ups on schedule

### Phase 5: Intelligence (Weeks 17-20)

**Goal:** Long-term memory and organizational intelligence.

- [ ] **Vector DB setup** — Pinecone or pgvector for semantic search over past meetings
- [ ] **Decision log** — Automatic extraction and tracking of decisions
- [ ] **Knowledge base search** — "What did we decide about X?" queries
- [ ] **Standup automation** — Async standups via Slack DM
- [ ] **Sentiment pulse** — Optional weekly check-ins with anonymized reporting
- [ ] **Onboarding copilot** — New employee context briefing

---

## 10. What Makes This Different

| Competitor                    | What They Do                      | What Lira Does Differently                                                                                   |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Otter.ai / Fireflies**      | Transcribe and summarize meetings | Lira _acts_ on meetings — creates tasks, schedules follow-ups, conducts interviews                           |
| **Reclaim.ai / Clockwise**    | Smart calendar scheduling         | Lira schedules _and attends_ meetings, sends personal reminders, follows up with no-shows                    |
| **ChatGPT / Claude**          | General AI assistant              | Lira is specialized for organizational workflows with persistent memory, team context, and real integrations |
| **Jira / Linear AI features** | AI-assisted task descriptions     | Lira creates tasks _from spoken conversations_ and assigns them based on team knowledge                      |
| **HireVue**                   | Video interview platform          | Lira conducts _live voice interviews_ in Google Meet with real-time follow-up questions — not pre-recorded   |

**The moat:** No one else combines **live meeting participation** + **agentic task execution** + **persistent organizational memory** + **cross-platform integration** in a single product. Each of these exists in isolation. Lira unifies them under one AI that _knows your company_.

---

_This is a living document. As features are built and validated, this document should be updated with learnings, architectural changes, and revised priorities._

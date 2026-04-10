# Lira AI — Complete Project Documentation

> **Your AI workforce — Lira joins your meetings, conducts your interviews, coaches your sales reps, and handles your customer support, all autonomously and deeply integrated with the tools your team already uses.**

*Last updated: June 2026 — includes 9 third-party integrations (Linear, Slack, Teams, Google Calendar/Drive, GitHub, Greenhouse, HubSpot, Salesforce), Customer Support AI with email domain management, Usage Tracking & Quotas, Sales Coaching desktop app spec, dual Google OAuth (login vs integrations), OpenAI GPT-4o-mini, Deepgram real-time speaker diarization, Organization Context System, Email Integration via Resend, and AI-Conducted Interviews with automated scheduling and candidate evaluation*

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
  - [1.1 What is Lira AI?](#11-what-is-lira-ai)
  - [1.2 The Problem It Solves](#12-the-problem-it-solves)
  - [1.3 Key Capabilities](#13-key-capabilities)
- [2. Technology Stack](#2-technology-stack)
  - [2.1 Frontend](#21-frontend)
  - [2.2 Backend](#22-backend)
  - [2.3 AI & Audio](#23-ai--audio)
  - [2.4 Infrastructure](#24-infrastructure)
- [3. Architecture Overview](#3-architecture-overview)
  - [3.1 High-Level Architecture](#31-high-level-architecture)
  - [3.2 Data Flow — From Meeting Audio to AI Response](#32-data-flow--from-meeting-audio-to-ai-response)
  - [3.3 Component Map](#33-component-map)
- [4. Google Meet Integration — The Hard Part](#4-google-meet-integration--the-hard-part)
  - [4.1 Why Browser Automation?](#41-why-browser-automation)
  - [4.2 Creating the Bot's Google Account](#42-creating-the-bots-google-account)
  - [4.3 Capturing Authentication State](#43-capturing-authentication-state)
  - [4.4 Silent Auth Refresh](#44-silent-auth-refresh)
  - [4.5 The Google Meet Driver](#45-the-google-meet-driver)
  - [4.6 Chromium Launch Configuration](#46-chromium-launch-configuration)
- [5. The Audio Pipeline — Bidirectional Audio in a Headless Browser](#5-the-audio-pipeline--bidirectional-audio-in-a-headless-browser)
  - [5.1 The Challenge](#51-the-challenge)
  - [5.2 Audio Bridge Architecture](#52-audio-bridge-architecture)
  - [5.3 Capture Path (Meeting → Lira)](#53-capture-path-meeting--lira)
  - [5.4 Injection Path (Lira → Meeting)](#54-injection-path-lira--meeting)
  - [5.5 The Echo Gate](#55-the-echo-gate)
  - [5.6 getUserMedia Override](#56-getusermedia-override)
  - [5.7 RTCPeerConnection Interception](#57-rtcpeerconnection-interception)
- [6. Amazon Nova Sonic — Speech-to-Speech AI](#6-amazon-nova-sonic--speech-to-speech-ai)
  - [6.1 What is Nova Sonic?](#61-what-is-nova-sonic)
  - [6.2 Bidirectional Streaming Protocol](#62-bidirectional-streaming-protocol)
  - [6.3 Event Flow](#63-event-flow)
  - [6.4 System Prompt & Personality Engine](#64-system-prompt--personality-engine)
  - [6.5 Keepalive Mechanism](#65-keepalive-mechanism)
  - [6.6 Barge-In Detection](#66-barge-in-detection)
  - [6.7 Output Gating & Wake Word Integration](#67-output-gating--wake-word-integration)
  - [6.8 Mute / Unmute via Voice Commands](#68-mute--unmute-via-voice-commands)
- [7. Wake Word Detection System](#7-wake-word-detection-system)
  - [7.1 The Problem with Speech-to-Text](#71-the-problem-with-speech-to-text)
  - [7.2 Four-Layer Detection Architecture](#72-four-layer-detection-architecture)
  - [7.3 Rolling Transcript Buffer](#73-rolling-transcript-buffer)
  - [7.4 Cooldown Window](#74-cooldown-window)
- [8. Backend Architecture](#8-backend-architecture)
  - [8.1 Server & Framework](#81-server--framework)
  - [8.2 Bot Manager — The Orchestrator](#82-bot-manager--the-orchestrator)
  - [8.3 Meeting Bot — Browser Lifecycle](#83-meeting-bot--browser-lifecycle)
  - [8.4 REST API Routes](#84-rest-api-routes)
  - [8.5 WebSocket Routes](#85-websocket-routes)
  - [8.6 DynamoDB Store](#86-dynamodb-store)
  - [8.7 Data Models](#87-data-models)
- [9. Frontend Architecture](#9-frontend-architecture)
  - [9.1 Project Structure](#91-project-structure)
  - [9.2 Authentication Flow](#92-authentication-flow)
  - [9.3 Bot Deploy Panel — The Main Feature](#93-bot-deploy-panel--the-main-feature)
  - [9.4 Browser-Based Demo Meeting](#94-browser-based-demo-meeting)
  - [9.5 State Management](#95-state-management)
  - [9.6 API Service Layer](#96-api-service-layer)
- [10. Infrastructure & Deployment](#10-infrastructure--deployment)
  - [10.1 AWS Resources](#101-aws-resources)
  - [10.2 EC2 Server Setup](#102-ec2-server-setup)
  - [10.3 Vercel Frontend Deployment](#103-vercel-frontend-deployment)
  - [10.4 DNS Configuration](#104-dns-configuration)
  - [10.5 Deployment Script](#105-deployment-script)
  - [10.6 Environment Variables](#106-environment-variables)
- [11. Challenges & Solutions](#11-challenges--solutions)
  - [11.1 Echo — Lira Hearing Herself](#111-echo--lira-hearing-herself)
  - [11.2 Wake Word Splitting Across STT Chunks](#112-wake-word-splitting-across-stt-chunks)
  - [11.3 Getting Stuck on Mute](#113-getting-stuck-on-mute)
  - [11.4 Double Voice Output](#114-double-voice-output)
  - [11.5 Nova Sonic Session Timeouts](#115-nova-sonic-session-timeouts)
  - [11.6 Auto-Leaving Empty Meetings](#116-auto-leaving-empty-meetings)
  - [11.7 Google Meet UI Selector Fragility](#117-google-meet-ui-selector-fragility)
  - [11.8 Multi-Turn Echo Gate — Nova Sonic Splitting Long Responses](#118-multi-turn-echo-gate--nova-sonic-splitting-long-responses)
  - [11.9 Speaker Identification Without Per-Stream Access](#119-speaker-identification-without-per-stream-access)
- [12. How It All Connects — End-to-End Walkthrough](#12-how-it-all-connects--end-to-end-walkthrough)
- [13. Repository Structure](#13-repository-structure)
- [14. Running Locally](#14-running-locally)
- [15. Known Limitations & Future Work](#15-known-limitations--future-work)
  - [15.1 Single Bot Account](#151-single-bot-account)
  - [15.2 EC2 Sizing](#152-ec2-sizing)
  - [15.3 ScriptProcessorNode Deprecation](#153-scriptprocessornode-deprecation)
  - [15.4 Rolling Wake Word Buffer — Cross-Speaker Context](#154-rolling-wake-word-buffer--cross-speaker-context)
  - [15.5 Zoom Support](#155-zoom-support)
  - [15.6 Two Audio Code Paths](#156-two-audio-code-paths)
  - [15.7 Speaker Identification Accuracy](#157-speaker-identification-accuracy)
- [16. Speaker Identification System (DOM Layer)](#16-speaker-identification-system-dom-layer)
  - [16.1 Overview](#161-overview)
  - [16.2 Architecture](#162-architecture)
  - [16.3 Participant Name Scraping](#163-participant-name-scraping)
  - [16.4 Active Speaker Detection](#164-active-speaker-detection)
  - [16.5 System Prompt Enrichment](#165-system-prompt-enrichment)
  - [16.6 Polling Strategy](#166-polling-strategy)
  - [16.7 Speaker-Attributed Transcripts](#167-speaker-attributed-transcripts)
  - [16.8 Accuracy & Limitations](#168-accuracy--limitations)
- [17. Deepgram Speaker Diarization](#17-deepgram-speaker-diarization)
  - [17.1 Why Deepgram?](#171-why-deepgram)
  - [17.2 How It Works](#172-how-it-works)
  - [17.3 Speaker Index → Real Name Correlation](#173-speaker-index--real-name-correlation)
  - [17.4 Deepgram API Configuration](#174-deepgram-api-configuration)
  - [17.5 Service Architecture](#175-service-architecture)
  - [17.6 Graceful Degradation](#176-graceful-degradation)
  - [17.7 Impact on Meeting Summaries](#177-impact-on-meeting-summaries)
- [18. Organization Context System](#18-organization-context-system)
  - [18.1 Overview & Problem Statement](#181-overview--problem-statement)
  - [18.2 System Architecture](#182-system-architecture)
  - [18.3 Data Models](#183-data-models)
  - [18.4 Phase 1 — Organization CRUD & Membership](#184-phase-1--organization-crud--membership)
  - [18.5 Phase 2 — Organization Profile & Context Injection](#185-phase-2--organization-profile--context-injection)
  - [18.6 Phase 3 — Website Crawl & Knowledge Base](#186-phase-3--website-crawl--knowledge-base)
  - [18.7 Phase 4 — Document Upload, Parsing & RAG Pipeline](#187-phase-4--document-upload-parsing--rag-pipeline)
  - [18.8 Phase 5 — Vector Search & Semantic Retrieval](#188-phase-5--vector-search--semantic-retrieval)
  - [18.9 Phase 6 — Context Injection into Nova Sonic](#189-phase-6--context-injection-into-nova-sonic)
  - [18.10 Phase 7 — Task Execution Engine](#1810-phase-7--task-execution-engine)
  - [18.11 Phase 8 — Frontend Implementation](#1811-phase-8--frontend-implementation)
  - [18.12 Phase 9 — Testing, Observability & Hardening](#1812-phase-9--testing-observability--hardening)
  - [18.13 API Reference](#1813-api-reference)
  - [18.14 Pricing Tiers & Feature Matrix](#1814-pricing-tiers--feature-matrix)
  - [18.15 Security & Data Isolation](#1815-security--data-isolation)
  - [18.16 Infrastructure & AWS Resources](#1816-infrastructure--aws-resources)
  - [18.17 Migration Strategy & Backward Compatibility](#1817-migration-strategy--backward-compatibility)
- [19. Email Integration — Resend + Inbound Reply Engine](#19-email-integration--resend--inbound-reply-engine)
  - [19.1 Overview](#191-overview)
  - [19.2 Two Sending Modes (Platform vs Custom Domain)](#192-two-sending-modes-platform-vs-custom-domain)
  - [19.3 Email Types](#193-email-types)
  - [19.4 Inbound Reply Engine](#194-inbound-reply-engine)
  - [19.5 Architecture & Data Models](#195-architecture--data-models)
  - [19.6 API Reference](#196-api-reference)
  - [19.7 Frontend — Email Settings UI](#197-frontend--email-settings-ui)
- [20. AI-Conducted Interviews](#20-ai-conducted-interviews)
  - [20.1 Overview & Problem Statement](#201-overview--problem-statement)
  - [20.2 Interview Modes](#202-interview-modes)
  - [20.3 How It Works — End-to-End Flow](#203-how-it-works--end-to-end-flow)
  - [20.4 Data Model](#204-data-model)
  - [20.5 AI Pipeline — Questions, Evaluation & Scoring](#205-ai-pipeline--questions-evaluation--scoring)
  - [20.6 Interview Scheduler (Auto-Deploy)](#206-interview-scheduler-auto-deploy)
  - [20.7 Resume Parsing](#207-resume-parsing)
  - [20.8 API Reference](#208-api-reference)
  - [20.9 Frontend Pages](#209-frontend-pages)
- [21. Third-Party Integrations](#21-third-party-integrations)
  - [21.1 Overview](#211-overview)
  - [21.2 Integration Providers](#212-integration-providers)
  - [21.3 Integration Architecture](#213-integration-architecture)
  - [21.4 Google Calendar Event CRUD](#214-google-calendar-event-crud)
  - [21.5 Member Mapping System](#215-member-mapping-system)
  - [21.6 External Webhooks](#216-external-webhooks)
  - [21.7 Integration Verification & Approval](#217-integration-verification--approval)
- [22. Customer Support AI](#22-customer-support-ai)
  - [22.1 Overview](#221-overview)
  - [22.2 Key Features](#222-key-features)
  - [22.3 Architecture](#223-architecture)
  - [22.4 Email Domain Setup Flow](#224-email-domain-setup-flow)
- [23. Usage Tracking & Quotas](#23-usage-tracking--quotas)
  - [23.1 Overview](#231-overview)
  - [23.2 Implementation](#232-implementation)
  - [23.3 Usage Metrics](#233-usage-metrics)
- [24. Sales Coaching](#24-sales-coaching)
  - [24.1 Overview](#241-overview)
  - [24.2 Product Marketing](#242-product-marketing)
  - [24.3 Desktop App Architecture](#243-desktop-app-architecture)
  - [24.4 CRM Integration for Sales](#244-crm-integration-for-sales)
- [25. Dual Google OAuth System](#25-dual-google-oauth-system)
  - [25.1 Why Two Client IDs?](#251-why-two-client-ids)
  - [25.2 Backend Implementation](#252-backend-implementation)
  - [25.3 Config Schema](#253-config-schema)

---

## 1. Project Overview

### 1.1 What is Lira AI?

Lira AI is **your AI workforce** — autonomous AI that does the work your team doesn't have time for. It spans four product areas — **Meetings**, **Interviews**, **Sales Coaching**, and **Customer Support** — and connects to the tools your team already uses through 9 deep third-party integrations.

**Meetings** — Paste a Google Meet link into the Lira dashboard, press "Send Lira to Meeting," and within seconds a new participant named **"Lira AI"** appears in the meeting. Lira listens to the entire conversation in real-time, and when someone says her name, she responds with a natural, conversational voice. She captures action items, generates summaries, and pushes updates to your connected tools automatically.

**Interviews** — Lira conducts AI-powered interviews autonomously — deploying a bot to a Google Meet call, asking structured questions, evaluating candidates against configurable criteria, and producing scored reports — all without a human interviewer needing to be present.

**Sales Coaching** — Real-time transcription, objection handling guidance, battle cards, and CRM auto-fill during sales calls. A dedicated desktop app architecture is specified for always-on sales coaching (see `docs/features/SALES_COACHING_DESKTOP_APP.md`).

**Customer Support** — AI-powered email support with custom domain management, knowledge base–grounded responses, and automatic escalation when Lira can't confidently answer.

**Integrations** — Lira connects to Linear, Slack, Microsoft Teams, Google Calendar & Drive, GitHub, Greenhouse, HubSpot, and Salesforce with full OAuth flows, member mapping, and bidirectional data sync. Tasks created in meetings flow into your project tracker; meeting summaries land in your Slack channel; calendar events are created and updated automatically.

### 1.2 The Problem It Solves

Organisations lose productivity to fragmented workflows — meetings lack follow-through, hiring is inconsistent, sales reps coach themselves, and support is reactive. Lira puts all of this on autopilot:

- **Never misses context** — she listens to 100% of the conversation, not just when you're paying attention
- **Responds on demand** — say her name and she'll summarise, challenge, suggest, or facilitate
- **Participates naturally** — uses voice (not chat), speaks in 1–3 sentences, and respects conversational flow
- **Adapts personality** — can be supportive, a devil's advocate, a facilitator, or analytical
- **Mutes on command** — "Lira, mute yourself" → she acknowledges and goes silent until unmuted
- **Syncs across tools** — tasks, summaries, and updates flow into Linear, Slack, Teams, Google Calendar, GitHub, and CRMs automatically
- **Hires at scale** — autonomous AI interviews with structured scoring, resume parsing, and multi-round tracking
- **Supports customers 24/7** — AI email replies grounded in your org's knowledge base, with human escalation when needed

### 1.3 Key Capabilities

| Capability | Description |
|---|---|
| **Real-time voice participation** | Joins as a named participant, listens and speaks via WebRTC audio |
| **Wake word activation** | Only responds when addressed by name (configurable) |
| **4 personality modes** | Supportive, Challenger, Facilitator, Analyst |
| **Voice mute/unmute** | Physical mic toggle in Google Meet via voice commands |
| **Barge-in support** | Stops talking immediately when interrupted |
| **Auto-leave** | Leaves after 45 seconds alone in an empty meeting |
| **Speaker diarization** | Deepgram identifies who is speaking in real-time; transcripts show real names (e.g. "John:") not "participant" |
| **Named transcript attribution** | Every message stored in DynamoDB is tagged with the speaker's real name, sourced from Deepgram + DOM correlation |
| **Transcript storage** | All conversation is stored in DynamoDB with sentiment tags and named speaker labels |
| **Individual-contribution summaries** | AI summaries (short \& long) call out each person's specific contributions — who drove the discussion, who proposed key ideas, and who was most impactful |
| **Meeting summaries** | AI-generated summaries via OpenAI GPT-4o-mini — available in short (4-6 sentence) or detailed (400-700 word) mode |
| **Post-meeting email notifications** | Sends meeting summaries, task assignments, and meeting invites via Resend (platform domain or custom org domain) |
| **AI reply engine** | Recipients can reply to Lira's emails — Lira reads the reply in context, searches the org knowledge base, and either responds directly or escalates to an admin |
| **AI-conducted interviews** | Deploys the Lira bot to a Google Meet as an interviewer — asks structured questions, follows up intelligently, and produces a full scored candidate evaluation after the session |
| **Interview auto-scheduler** | Interviews scheduled for a future time are automatically started by a background scheduler — no manual bot deployment needed |
| **Resume parsing** | Upload candidate PDFs; Lira extracts structured data (name, experience, skills, education) using GPT-4o-mini |
| **9 third-party integrations** | Linear, Slack, Microsoft Teams, Google Calendar & Drive, GitHub, Greenhouse, HubSpot, Salesforce — all with OAuth flows, member mapping, and connection management |
| **Google Calendar sync** | Create and update calendar events; list calendars, set defaults per org |
| **Google Drive management** | Create folders, list/search/read files, read Sheets and Docs content |
| **GitHub integration** | Browse repos, read files, create issues and PRs, search code |
| **CRM sync (HubSpot + Salesforce)** | Contacts, companies, deals, accounts, opportunities, leads, pipelines, notes |
| **ATS integration (Greenhouse)** | API-key auth, candidate/job/application/scorecard management |
| **Project management (Linear)** | OAuth2, issue sync, team/member mapping |
| **Team communication (Slack + Teams)** | Post messages, list channels, member mapping, inbound webhooks |
| **Customer Support AI** | AI email support with custom domain, knowledge base grounding, thread management, escalation |
| **Usage tracking & quotas** | Per-org usage dashboard, beta limits, quota enforcement |
| **External webhook receivers** | Inbound webhooks from Linear, Slack, and Teams for real-time event processing |
| **AI task review** | Tasks have `lira_review_status` ("reviewing" | "needs_info" | "approved") — Lira autonomously validates tasks before execution |
| **Member contribution tracking** | Per-member contribution analytics across meetings |
| **Auth session management** | Auto-refreshes Google login cookies every 7 days |
| **Dual Google OAuth** | Separate client IDs for platform login vs integration scopes — `getAllowedAudiences()` accepts both |
| **Multi-platform** | Architecture supports Google Meet and Zoom |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript ~5.9** | Type safety |
| **Vite 7** | Build tool and dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Zustand 5** | Lightweight state management |
| **Zod 4** | Runtime schema validation |
| **React Router 7** | Client-side routing |
| **@react-oauth/google** | Google Sign-In integration |
| **Lucide React** | Icon library |
| **Radix UI** | Accessible primitives (dialog, tabs, tooltip, etc.) |

### 2.2 Backend

| Technology | Purpose |
|---|---|
| **Fastify 4** | High-performance Node.js HTTP framework |
| **TypeScript 5.3** | Type safety |
| **Playwright 1.58** | Headless Chromium browser automation |
| **Zod 3** | Request validation |
| **@fastify/websocket** | WebSocket support for real-time audio |
| **@fastify/jwt** | JWT authentication |
| **@fastify/swagger** | OpenAPI documentation |
| **@fastify/multipart** | Multipart form-data for resume PDF uploads (50 MB limit) |
| **Prisma 5** | Database ORM (PostgreSQL for platform data) |
| **Resend** | Transactional email delivery (meeting summaries, task assignments, interview invites) |
| **mailparser** | MIME email parsing for the inbound reply webhook |
| **pdf-parse** | PDF text extraction for candidate resume parsing |
| **mammoth** | DOCX to text conversion for document processing |
| **crawlee** | Website crawling with Cheerio for knowledge base ingestion |
| **jsonwebtoken** | JWT generation for reply tokens (email reply context encoding) |
| **uuid** | Session/bot ID generation |

#### Integration SDKs & OAuth Libraries

| Technology | Purpose |
|---|---|
| **googleapis** | Google Calendar, Drive, Sheets, Docs API access |
| **@slack/web-api** | Slack OAuth V2, channel/message management |
| **@microsoft/microsoft-graph-client** | Microsoft Teams integration (Azure AD OAuth) |
| **@octokit/rest** | GitHub API — repos, issues, PRs, code search |
| **hubspot-api-client** | HubSpot CRM — contacts, companies, deals, pipelines |
| **jsforce** | Salesforce OAuth2 + PKCE, SOQL queries, CRM operations |
| **@linear/sdk** | Linear OAuth2, issue/team sync |
| **Greenhouse Harvest API** | API-key auth for ATS integration (candidates, jobs, scorecards) |

### 2.3 AI & Audio

| Technology | Purpose |
|---|---|
| **Amazon Nova Sonic** (`amazon.nova-sonic-v1:0`) | Speech-to-speech model — STT + LLM + TTS in one bidirectional stream |
| **AWS Bedrock** (`InvokeModelWithBidirectionalStreamCommand`) | Streaming inference API for Nova Sonic |
| **OpenAI GPT-4o-mini** | Text generation: meeting summaries (short \& long), meeting titles, AI text responses |
| **Deepgram Nova-2** | Real-time speaker diarization — identifies which speaker is which in the mixed audio stream |
| **Web Audio API** | In-browser audio capture and injection |
| **WebRTC** | Meeting audio transport (intercepted via `RTCPeerConnection` hook) |

### 2.4 Infrastructure

| Resource | Purpose |
|---|---|
| **AWS EC2** (`t3.small`, `98.92.255.171`) | Backend server (Ubuntu 22.04) |
| **AWS DynamoDB** | Meeting sessions + transcripts (`lira-meetings`, `lira-connections`, `lira-organizations`, `lira-interviews`) |
| **AWS S3** | Audio recordings, Google auth state backup, candidate resume storage (`lira-documents-storage`), inbound email storage (`lira-inbound-email`), org documents (`creovine-lira-documents`) |
| **AWS SES** | Inbound email receipt for `reply+*@liraintelligence.com` (reply engine) |
| **AWS SNS** | Notification bridge from SES receipt rule → Fastify inbound webhook |
| **AWS Secrets Manager** | Database credentials and shared secrets |
| **OpenAI API** | GPT-4o-mini — meeting summaries, title generation, AI text responses, interview question generation, candidate evaluation, email reply decisions |
| **Deepgram API** | Nova-2 streaming — real-time speaker diarization ($0.0059/min, pay-per-use) |
| **Resend API** | Transactional outbound email — meeting summaries, task assignments, interview invites |
| **Qdrant** | Self-hosted vector DB on EC2 (Docker) — org knowledge base embeddings for RAG |
| **Vercel** | Frontend hosting (`lira.creovine.com`) |
| **Namecheap DNS** | Domain management (`api.creovine.com` → EC2, `reply.liraintelligence.com` MX for inbound email) |
| **systemd** | Process management (`creovine-api.service`) |
| **nginx** | Reverse proxy + SSL termination (Let's Encrypt, cert valid to June 2026) |

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                  │
│                                                                          │
│   lira.creovine.com (Vercel)                                            │
│   ┌────────────────────────────────────────┐                            │
│   │  React SPA                             │                            │
│   │  ┌──────────────────┐  ┌────────────┐  │                            │
│   │  │  Bot Deploy Panel │  │ Demo Meeting│  │                            │
│   │  │  Paste Meet link  │  │ Browser mic │  │                            │
│   │  │  → Deploy bot     │  │ → WebSocket │  │                            │
│   │  └────────┬─────────┘  └──────┬─────┘  │                            │
│   └───────────┼───────────────────┼────────┘                            │
│               │ REST              │ WSS                                   │
└───────────────┼───────────────────┼──────────────────────────────────────┘
                │                   │
                ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   EC2 BACKEND (api.creovine.com)                         │
│                                                                          │
│   Fastify Server                                                         │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  /lira/v1/bot/deploy  ──────► Bot Manager                       │   │
│   │                                    │                             │   │
│   │                         ┌──────────▼──────────┐                  │   │
│   │                         │    Meeting Bot       │                  │   │
│   │                         │  ┌────────────────┐  │                  │   │
│   │                         │  │  Playwright     │  │                  │   │
│   │                         │  │  Chromium       │  │                  │   │
│   │                         │  │  (headless)     │  │                  │   │
│   │                         │  │                 │  │                  │   │
│   │                         │  │  Google Meet    │─────► Google Meet  │   │
│   │                         │  │  Driver         │  │    servers      │   │
│   │                         │  │                 │  │                  │   │
│   │                         │  │  Audio Bridge   │  │                  │   │
│   │                         │  └───────┬─────────┘  │                  │   │
│   │                         └──────────┼────────────┘                  │   │
│   │                                    │ PCM audio                     │   │
│   │                         ┌──────────▼──────────┐                    │   │
│   │                         │  Nova Sonic Service  │                    │   │
│   │                         │  (Bedrock streaming) │──────► AWS Bedrock│   │
│   │                         │                      │                    │   │
│   │                         │  Wake Word Service   │                    │   │
│   │                         └──────────────────────┘                    │   │
│   │                                                                      │   │
│   │  /lira/v1/meetings  ──────► DynamoDB Store                          │   │
│   │  /lira/v1/ws         ──────► WebSocket Handler                      │   │
│   └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow — From Meeting Audio to AI Response

Here is exactly what happens when a meeting participant speaks and Lira responds:

```
1. Participant speaks in Google Meet
        │
        ▼
2. WebRTC delivers audio to all participants
   (including Lira's headless Chromium browser)
        │
        ▼
3. RTCPeerConnection.ontrack fires in Lira's browser
   Audio Bridge intercepts the remote audio stream
        │
        ▼
4. AudioContext (16 kHz) → ScriptProcessorNode
   Float32 samples → Int16 PCM → base64 encoding
        │
        ▼
5. page.exposeFunction('__liraOnAudioCapture')
   Bridges from browser context to Node.js
        │
        ▼
6. Echo Gate check: is Lira currently outputting audio?
   YES → drop the frame (prevents feedback loop)
   NO  → forward to Nova Sonic
        │
        ▼
7. Nova Sonic Service pushes PCM into the bidirectional stream
   (aws bedrock InvokeModelWithBidirectionalStreamCommand)
        │
        ▼
8. Nova Sonic processes in real-time:
   - Speech-to-Text (transcribes what was said)
   - LLM reasoning (decides what to say)
   - Text-to-Speech (generates voice response)
        │
        ▼
9. Output stream delivers events:
   - textOutput (role=user) → transcript
   - textOutput (role=assistant) → AI response text
   - audioOutput → PCM voice data
        │
        ▼
10. Wake Word Gate: was Lira's name mentioned?
    NO  → discard AI audio output (stay silent)
    YES → forward audio to the meeting
        │
        ▼
11. Audio Bridge receives PCM (24 kHz)
    base64 → Int16 → Float32 → AudioBuffer
        │
        ▼
12. AudioBufferSourceNode → MediaStreamDestination (48 kHz)
    Scheduled for gapless playback
        │
        ▼
13. getUserMedia override returns this custom stream
    as Lira's "microphone" to Google Meet's WebRTC
        │
        ▼
14. All meeting participants hear Lira speak
```

### 3.3 Component Map

```
Backend (creovine-api)
├── src/routes/
│   ├── lira-bot.routes.ts        — REST API for bot deploy/status/terminate
│   └── lira-meetings.routes.ts   — REST API for meeting CRUD + summaries
├── src/services/
│   ├── lira-bot/
│   │   ├── bot-manager.service.ts — Orchestrator: deploys bots, wires audio
│   │   ├── meeting-bot.ts         — Browser lifecycle (launch → join → capture)
│   │   ├── audio-bridge.ts        — Bidirectional audio pipe (browser ↔ Node.js)
│   │   ├── auth-refresh.ts        — Silent Google session renewal
│   │   └── drivers/
│   │       ├── google-meet.driver.ts — Google Meet UI automation
│   │       └── zoom.driver.ts        — Zoom UI automation (Phase 2)
│   ├── lira-sonic.service.ts      — Nova Sonic bidirectional streaming
│   ├── lira-wakeword.service.ts   — 4-layer wake word detection
│   ├── lira-store.service.ts      — DynamoDB persistence
│   └── lira-ai.service.ts         — Meeting summaries (Nova Lite)
├── src/models/
│   ├── lira.models.ts             — Meeting, Message, SonicSession types
│   └── lira-bot.models.ts         — BotConfig, BotState, platform detection
└── deploy-auto.sh                 — One-command production deployment

Frontend (lira_ai)
├── src/pages/
│   ├── HomePage.tsx               — Login + Bot Deploy + Demo meeting start
│   └── MeetingPage.tsx            — Browser-based demo meeting UI
├── src/components/
│   └── bot-deploy/
│       ├── BotDeployPanel.tsx     — Paste link → deploy → status tracking
│       └── AuthStatusCard.tsx     — Google session health indicator
├── src/services/
│   └── api/index.ts               — REST + bot deploy + auth status API client
├── src/features/
│   └── meeting/use-audio-meeting.ts — Full audio meeting lifecycle hook
├── src/app/
│   └── store/index.ts             — Zustand stores (auth, meeting, bot)
└── src/env.ts                      — Runtime environment config (Zod validated)
```

---

## 4. Google Meet Integration — The Hard Part

### 4.1 Why Browser Automation?

Google Meet has no public API for joining meetings programmatically. There is no SDK, no REST endpoint, no WebSocket you can connect to. The only way to join a Google Meet meeting is the same way a human does: open a browser, navigate to the meeting URL, enter a name, and click "Join now."

This means Lira literally runs a **headless Chromium browser** (via Playwright) that:
1. Navigates to `https://meet.google.com/xxx-yyy-zzz`
2. Dismisses popups
3. Turns off the camera
4. Enters the name "Lira AI"
5. Clicks the "Join now" button
6. Waits to be admitted (if there's a waiting room)
7. Once inside, intercepts all audio via WebRTC hooks

This is not a hack or workaround — it's the **only** way to build a meeting bot for Google Meet without being Google.

### 4.2 Creating the Bot's Google Account

Lira needs a Google account to join meetings as an authenticated participant (avoiding guest restrictions and CAPTCHA challenges). We created:

- **Email**: `lira.ai.creovine@gmail.com`
- **Display name**: Lira AI
- **Profile picture**: Custom Lira avatar

This account is used solely by the bot. The account's session cookies are saved and reused for every meeting join.

### 4.3 Capturing Authentication State

Playwright can save and restore browser sessions via `storageState`. We wrote a setup script (`scripts/setup-bot-auth.ts`) that:

1. Launches a **visible** Chromium browser (not headless)
2. Navigates to `https://accounts.google.com`
3. Pauses and waits for you to manually log in
4. After login, saves the full session (cookies + localStorage) to `.lira-bot-auth/google-state.json`

This file is then used by the bot every time it launches:

```typescript
contextOptions.storageState = this.config.authStatePath;
```

The session cookies last approximately 30 days. After that, they expire and the bot can't join meetings.

### 4.4 Silent Auth Refresh

To prevent the 30-day expiry from breaking the bot, we built an **automatic silent refresh** system:

- Every **7 days**, the backend opens a headless Chromium instance
- Loads the saved session state
- Navigates to `meet.google.com` (which triggers Google to refresh the cookies)
- Saves the updated session state back to disk
- **Backs up the updated state to S3** for disaster recovery

**S3 auth state backup:** After every successful refresh, the auth state JSON is uploaded to S3 (`s3://<bucket>/lira-bot/auth-state/google-state.json`). On server startup, if the local auth state file is missing (e.g. fresh instance, EBS replacement), the system automatically restores it from S3. This ensures a new EC2 instance can start serving immediately without manual re-authentication. Configured via `LIRA_BOT_AUTH_S3_BUCKET` and `LIRA_BOT_AUTH_S3_PREFIX` environment variables.

The frontend displays the session health via the `AuthStatusCard` component:
- **Green**: Session is healthy (auto-refreshes)
- **Amber**: Expiring soon (< 7 days)
- **Red**: Expired (needs manual re-login)

The auth refresh is also available as an on-demand API endpoint: `POST /lira/v1/bot/auth-refresh`.

### 4.5 The Google Meet Driver

The `GoogleMeetDriver` class (560 lines) handles all UI automation. It uses **multiple fallback CSS selectors** for every element because Google Meet frequently changes its DOM structure:

```typescript
const SELECTORS = {
  joinButton: [
    'button[data-mdc-dialog-action="join"]',
    'button[jsname="Qx7uuf"]',
  ],
  joinButtonText: ['Ask to join', 'Join now', 'Join'],
  
  micMuteButton: [
    'button[aria-label="Turn off microphone"]',
    'button[data-tooltip="Turn off microphone"]',
    'button[aria-label="Turn off microphone (ctrl + d)"]',
    'button[data-tooltip="Turn off microphone (ctrl + d)"]',
  ],
  // ... 4 variants for each button
};
```

**Join flow:**
1. `page.goto(meetingUrl)` — navigate to the meeting
2. `dismissPopups()` — click "Got it", "Dismiss", "OK" on any info dialogs
3. `turnOffCamera()` — the bot doesn't need video
4. `enterName()` — triple-click to select all, then `fill("Lira AI")`
5. `clickJoinButton()` — try CSS selectors, then text matching, then brute-force scan
6. `waitForEntry()` — poll for in-meeting indicators vs. lobby vs. meeting ended
7. `startMeetingEndMonitor()` — 5-second polling interval to detect meeting end

**Screenshot-on-failure:** When the join sequence fails — join button not found, timeout, or an unexpected exception — the driver saves a full-page PNG screenshot to `debug-screenshots/` with a timestamped filename (e.g. `2026-03-02T10-30-00-000Z_join-button-not-found.png`). This provides immediate visual context for debugging DOM changes without needing to reproduce the failure. The directory is configurable via `LIRA_BOT_SCREENSHOT_DIR`.

**Meeting end detection checks for:**
- Text like "You were removed from the meeting" or "The meeting has ended"
- Loss of in-meeting indicators (leave button disappears)
- Bot is alone: counts remote audio streams via the Audio Bridge. If zero other participants for 45 seconds, auto-leaves.

### 4.6 Chromium Launch Configuration

The headless browser is configured with specific Chrome flags for performance and compatibility on a server:

```typescript
const CHROME_ARGS = [
  '--use-fake-ui-for-media-stream',              // Auto-accept mic/camera prompts
  '--disable-notifications',                       // No Google Meet popups
  '--disable-gpu',                                 // No GPU in headless mode
  '--disable-background-timer-throttling',         // Keep audio processing smooth
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--no-sandbox',                                  // Required for running as root
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',                       // Prevent /dev/shm issues
  '--disable-extensions',
  '--disable-default-apps',
  '--no-first-run',
  '--disable-translate',
  '--disable-infobars',
];
```

The browser context is created with:
- **Permissions**: microphone, camera, notifications (granted for `meet.google.com`)
- **Viewport**: 1280×720 (realistic for Google Meet)
- **User agent**: Chrome 131 on Linux
- **Storage state**: Saved Google session cookies

---

## 5. The Audio Pipeline — Bidirectional Audio in a Headless Browser

### 5.1 The Challenge

A headless browser has no microphone and no speakers. Google Meet expects `getUserMedia()` to return a valid audio stream, and it sends audio to participants via WebRTC. We needed to:

1. **Intercept** all incoming audio from meeting participants
2. **Pipe** that audio to Nova Sonic for processing
3. **Inject** Nova Sonic's voice response back as Lira's "microphone"
4. **Prevent** Lira from hearing her own voice (echo cancellation)

All of this happens inside a browser page that runs JavaScript before any Google Meet code loads.

### 5.2 Audio Bridge Architecture

The Audio Bridge is a 534-line TypeScript file that operates on two sides:

**Browser side** (runs as `addInitScript` before page load):
- Overrides `navigator.mediaDevices.getUserMedia`
- Overrides `navigator.mediaDevices.enumerateDevices`
- Intercepts `RTCPeerConnection` to capture remote audio tracks
- Manages audio contexts for capture (16 kHz) and injection (48 kHz)
- Exposes control functions (`__liraStartCapture`, `__liraInjectAudio`, etc.)

**Node.js side** (the `AudioBridge` class):
- Calls `page.exposeFunction()` to bridge data from browser to Node.js
- Receives captured PCM audio via callback
- Batches outbound audio chunks (50ms flush interval) to reduce CDP overhead
- Manages the echo gate flag

### 5.3 Capture Path (Meeting → Lira)

```
Google Meet sends audio via WebRTC
    │
    ▼
RTCPeerConnection.ontrack (intercepted)
    │
    ▼
MediaStreamSource → GainNode (mixer) → ScriptProcessorNode
    │                                         │
    │                              ┌──────────┘
    │                              │
    ▼                              ▼
AudioContext at 16 kHz     Buffer size: 2048 samples
                           = 128 ms per callback
                                   │
                                   ▼
                           Check: outputting? → drop (echo gate)
                           Check: energy < 0.001? → drop (silence gate)
                                   │
                                   ▼
                           Float32 → Int16 PCM → base64
                                   │
                                   ▼
                           window.__liraOnAudioCapture(base64)
                                   │
                                   ▼
                           Node.js: Buffer.from(base64, 'base64')
                                   │
                                   ▼
                           bot.emit('audio', pcm) → sonic.sendAudio()
```

The capture `AudioContext` runs at **16 kHz** because that's what Nova Sonic expects for input. The `ScriptProcessorNode` uses a buffer size of 2048 samples, producing one callback every 128 ms.

An **energy gate** skips near-silent frames (RMS < 0.001) so we don't waste bandwidth sending silence to Nova Sonic.

### 5.4 Injection Path (Lira → Meeting)

```
Nova Sonic sends audio response (24 kHz PCM)
    │
    ▼
bot-manager: meetingBot.injectAudio(pcm)
    │
    ▼
AudioBridge.injectAudio(pcmChunk)
    │ (chunks are batched for 50ms)
    ▼
flushInjectBuffer() → Buffer.concat → base64
    │
    ▼
page.evaluate(__liraInjectAudio, base64)
    │
    ▼ (inside browser)
base64 → Uint8 → Int16 → Float32
    │
    ▼
AudioBuffer at 24 kHz (the browser's 48 kHz context auto-resamples)
    │
    ▼
AudioBufferSourceNode.start(nextPlayTime)
    │  (scheduled for gapless playback)
    ▼
MediaStreamDestination → custom MediaStream
    │
    ▼
getUserMedia override returns this stream
    │
    ▼
Google Meet uses it as Lira's "microphone"
    │
    ▼
All participants hear Lira speak via WebRTC
```

The injection context runs at **48 kHz** (Google Meet's expected sample rate) but the `AudioBuffer` is created at **24 kHz** (Nova Sonic's output rate). The `AudioContext` handles the resampling automatically.

Audio chunks are **scheduled for gapless playback** using `nextPlayTime`:
```javascript
const now = injectCtx.currentTime;
if (nextPlayTime < now) nextPlayTime = now + 0.01; // 10 ms initial buffer
source.start(nextPlayTime);
nextPlayTime += audioBuffer.duration;
```

### 5.5 The Echo Gate

Without echo prevention, Lira would hear her own voice being played back through WebRTC, creating a feedback loop where she responds to herself. The echo gate is a simple boolean flag:

```javascript
// Set to true when audio injection starts
processorNode.onaudioprocess = function(e) {
  if (!capturing || outputting) return;  // ← echo gate
  // ... capture audio
};
```

When Lira finishes speaking, the echo gate isn't cleared immediately — there's a **drain delay**:

```javascript
window.__liraEndOutput = function endOutput() {
  var drainMs = 0;
  if (injectCtx && nextPlayTime > injectCtx.currentTime) {
    drainMs = (nextPlayTime - injectCtx.currentTime) * 1000;
  }
  var delay = Math.max(drainMs, 200) + 500; // pipeline buffer + short safety margin
  setTimeout(function() {
    outputting = false;
    nextPlayTime = 0;
  }, delay);
};
```

This ensures all scheduled audio has finished playing and Google Meet's internal audio pipeline has drained before capture resumes. The 500 ms margin (reduced from 1200 ms) accounts for pipeline buffering. On the Node side, an additional 800 ms safety buffer ensures the capture callback won't forward stale audio.

### 5.6 getUserMedia Override

The most critical override. Google Meet calls `getUserMedia({ audio: true })` to get the user's microphone. We intercept this and return our custom stream instead:

```javascript
navigator.mediaDevices.getUserMedia = async function(constraints) {
  ensureInjectContext();
  
  const stream = new MediaStream();
  // Add our custom audio tracks (connected to MediaStreamDestination)
  for (const track of customStream.getAudioTracks()) {
    stream.addTrack(track);
  }
  
  // If video was requested, provide a black canvas
  if (constraints?.video) {
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 640, 480);
    const videoStream = canvas.captureStream(1);
    for (const vt of videoStream.getVideoTracks()) {
      stream.addTrack(vt);
    }
  }
  
  return stream;
};
```

We also override `enumerateDevices` to ensure at least one `audioinput` device is reported (some Google Meet code paths check for available devices):

```javascript
navigator.mediaDevices.enumerateDevices = async function() {
  const devices = await _origEnumerateDevices();
  if (!devices.some(d => d.kind === 'audioinput')) {
    devices.push({
      deviceId: 'lira-virtual-mic',
      kind: 'audioinput',
      label: 'Lira AI Microphone',
    });
  }
  return devices;
};
```

### 5.7 RTCPeerConnection Interception

To capture audio from other meeting participants, we wrap `RTCPeerConnection`:

```javascript
const OrigRTCPC = window.RTCPeerConnection;

window.RTCPeerConnection = function LiraRTCPeerConnection(...args) {
  const pc = new OrigRTCPC(...args);
  
  pc.addEventListener('track', (event) => {
    if (event.track?.kind === 'audio') {
      const stream = event.streams?.[0] ?? new MediaStream([event.track]);
      onRemoteAudioStream(stream);  // Connect to capture pipeline
    }
  });
  
  return pc;
};

// Preserve prototype chain for instanceof checks
window.RTCPeerConnection.prototype = OrigRTCPC.prototype;
```

Each new remote audio stream is connected to the capture mixer via `MediaStreamSource → mixerNode`, enabling Lira to hear all participants mixed together.

---

## 6. Amazon Nova Sonic — Speech-to-Speech AI

### 6.1 What is Nova Sonic?

Amazon Nova Sonic is a **speech-to-speech foundation model** available through AWS Bedrock. Unlike traditional pipelines that chain separate STT → LLM → TTS services, Nova Sonic handles all three in a **single bidirectional stream**:

- **Input**: Raw PCM audio (16 kHz, 16-bit, mono)
- **Processing**: Simultaneous transcription, reasoning, and speech synthesis
- **Output**: Text transcripts + PCM audio (24 kHz, 16-bit, mono)

This means lower latency (no round-trips between services), more natural conversation flow, and the ability to handle interruptions natively.

### 6.2 Bidirectional Streaming Protocol

Nova Sonic uses AWS Bedrock's `InvokeModelWithBidirectionalStreamCommand`. The connection is an async generator that yields input events and receives output events simultaneously.

**Input side** (what we send):
```
sessionStart → promptStart → systemPrompt (TEXT) → audioContentStart → [audioInput...] → contentEnd → promptEnd
```

**Output side** (what we receive):
```
contentStart (role, type) → [textOutput | audioOutput]... → contentEnd → [repeat for each turn]
```

### 6.3 Event Flow

The input stream generator creates events in a specific order:

1. **`sessionStart`** — inference configuration (maxTokens: 1024, temperature: 0.7, topP: 0.9)
2. **`promptStart`** — output configs (text/plain, audio at 24 kHz via voice "tiffany") + empty tool config
3. **`contentStart`** (TEXT, SYSTEM) → **`textInput`** (system prompt) → **`contentEnd`** — sets personality and behaviour
4. **`contentStart`** (AUDIO, USER) — opens the interactive audio stream
5. **`audioInput`** events — pushed continuously as meeting audio arrives
6. **`contentEnd`** + **`promptEnd`** — sent when ending the session

The output stream processes events:
- **`contentStart`** with `role=USER` → incoming user transcript
- **`textOutput`** with `role=user` → speech-to-text transcript of what the user said
- **`contentStart`** with `role=ASSISTANT` → AI starting to respond
- **`textOutput`** with `role=assistant` → text of what the AI is saying
- **`audioOutput`** → PCM audio of the AI speaking
- **`contentEnd`** → content block finished
- **Barge-in**: `contentStart` with `type=INTERRUPTION` or new `role=USER` while `ASSISTANT` is active

### 6.4 System Prompt & Personality Engine

The system prompt is dynamically built by `buildSystemPrompt(settings)`. It establishes Lira's **core identity as a meeting participant** — not an AI assistant, chatbot, or help desk.

**Core identity block** (~30 lines):
- Establishes that Lira is a colleague sitting in the meeting, not a service
- Explicitly bans generic assistant phrases: "How can I help you?", "What can I assist you with?", "I'd be happy to help with that"
- Instructs Lira to reference the ongoing discussion when first addressed ("What are we covering today?", "Sounds like the main blocker is the API integration, right?")
- Adapts to meeting energy: casual in standups, thoughtful in strategy discussions, creative in brainstorms
- Lira has opinions — she flags concerns and gaps in reasoning, not just agrees
- Responses are concise (1–3 sentences) unless more detail is explicitly requested

**Anti-patterns (explicitly banned):**
- Never introduce herself as an "AI assistant" or "virtual assistant"
- Never offer generic help like "What would you like to know?"
- Never list capabilities or treat a greeting as a command to start assisting
- Never say "Sure! I'd be happy to help with that."

**Proactive behaviours:**
- Build context about who is in the meeting, what's being discussed, what decisions are pending
- Offer quick summaries when asked "where are we at?" or "recap"
- Note action items naturally ("So it sounds like Sarah is handling the API docs and we're reconvening Thursday?")
- Adapt style to meeting type — bullet-point updates for standups, creative contributions for brainstorms

**Four personality modes** (layered on top of the core identity):

| Mode | Behaviour |
|---|---|
| **Supportive** | Encourages others, validates good ideas, asks clarifying questions. Makes everyone feel heard but still flags concerns. |
| **Challenger** | Pushes back on assumptions, surfaces blind spots. "Wait, have we considered…?" Rigorous but collegial. |
| **Facilitator** | Keeps conversation on track. Surfaces action items, prompts quieter voices, helps the group reach conclusions. |
| **Analyst** | Structured thinking, data-oriented. Breaks complex topics into concrete components, thinks about trade-offs and dependencies. |

**Wake word instructions:**
- "Your name is 'Lira'. People may pronounce it differently (Lyra, Leera, Lara, etc.). Treat ALL of these as your name."
- "When nobody has mentioned your name, stay quiet and listen. You are paying attention the entire time."
- "When someone says your name, respond using the full context of everything you've heard so far."
- Mute acknowledgement: "Got it, going on mute. Just say 'Lira, unmute' when you want me back."
- Unmute acknowledgement: "I'm back — what'd I miss?" (not "What can I help with?")

### 6.5 Keepalive Mechanism

Nova Sonic sessions timeout if no audio input is received for too long. To prevent this, we send **silent PCM every 5 seconds**:

```typescript
const KEEPALIVE_INTERVAL_MS = 5_000;
const SILENT_PCM = Buffer.alloc(5120); // 160 ms of silence at 16 kHz

session.keepaliveTimer = setInterval(() => {
  if (!session.active) return;
  pushEvent(buildAudioInputEvent(promptName, audioContentName, SILENT_PCM));
}, KEEPALIVE_INTERVAL_MS);
```

### 6.6 Barge-In Detection

When a user starts speaking while Lira is responding, Nova Sonic signals an interruption. We detect this in two ways:

1. **New `contentStart` with `role=USER` while assistant was outputting** — the user started talking
2. **`contentStart` with `type=INTERRUPTION`** — explicit interruption signal from Nova Sonic

On barge-in:
- Discard any partial assistant text
- Call `onInterruption` callback → `meetingBot.endAudioOutput()` → clear echo gate immediately
- Stop forwarding assistant audio

### 6.7 Output Gating & Wake Word Integration

Not all Nova Sonic output should reach the meeting. When wake word mode is enabled (the default), the `shouldForwardAssistantOutput()` function gates all assistant responses:

```typescript
function shouldForwardAssistantOutput(session: SonicSession): boolean {
  if (!session.wakeWordEnabled) return true;

  // 1-on-1 mode: when only 1 other participant, bypass wake word entirely
  if (session.participantCount === 1 && !session.muted) return true;
  
  // If muted, block all output (except the mute acknowledgement)
  if (session.muted) return session.wakeWordActive;
  
  // Forward only if wake word was recently detected
  if (session.wakeWordActive) return true;
  return isWithinCooldown(session.lastWakeWordTime, false);
}
```

This means Nova Sonic is **always listening and generating responses**, but those responses are silently discarded unless:
- Someone said Lira's name recently (within the 45-second cooldown window), OR
- Only one other participant is in the meeting (1-on-1 mode — obviously talking to Lira)

### 6.8 Mute / Unmute via Voice Commands

Voice-triggered mute/unmute physically clicks the Google Meet mic button. The detection uses regex patterns checked against both current transcription and the rolling transcript buffer:

**Mute triggers** (requires wake word + keyword):
- "Lira, mute yourself", "Lira, be quiet", "Lira, go on mute", "Lira, shut up", "Lira, stop talking"

**Unmute triggers** (does NOT require wake word when muted):
- "unmute", "come back", "start listening", "speak again", "wake up", "you can talk"

When muting:
1. Set `session.muted = true`
2. Let the mute command's response through (so Lira can say "Okay, I'll go on mute")
3. After a 4-second delay (enough for the acknowledgement), call `onMicMute` callback
4. Bot Manager calls `meetingBot.muteMic()` → Google Meet Driver clicks the "Turn off microphone" button
5. Participants see Lira's mic icon as muted in Google Meet

When unmuting:
1. Any "unmute" keyword triggers, **no wake word required** (prevents getting stuck on mute)
2. Set `session.muted = false`, `session.wakeWordActive = true`
3. Call `onMicUnmute` callback immediately
4. Bot Manager calls `meetingBot.unmuteMic()` → Google Meet Driver clicks "Turn on microphone"

---

## 7. Wake Word Detection System

### 7.1 The Problem with Speech-to-Text

When someone says "Hey Lira, what do you think?", the speech-to-text engine (inside Nova Sonic) might transcribe it as:
- "Hey **Lyra**, what do you think?" (common variant)
- "Hey **Leera**, what do you think?" (phonetic spelling)
- "Hey **Lara**, what do you think?" (wrong vowel)
- "Hey **Leila**, what do you think?" (completely different but similar sound)

Worse, the name might be **split across chunks**: Nova Sonic sends transcript in fragments, so "Lira" might arrive as "Li" in one chunk and "ra" in the next.

We built a 4-layer detection system to handle all of this.

### 7.2 Four-Layer Detection Architecture

**Layer 0 — Hardcoded STT Variants** (fastest, highest confidence):

A lookup table of 17 known mispellings of "Lira" that STT engines commonly produce:

```typescript
const COMMON_VARIANTS = {
  lira: ['lyra', 'leera', 'lara', 'leara', 'leela', 'liera', 'liara',
         'leyra', 'leila', 'lura', 'lera', 'lirra', 'leerah', 'lyrah',
         'laira', 'lehera', 'leira'],
};
```

Each variant is checked with word-boundary regex: `/\blyra\b/i`.

**Layer 1 — Exact Match** (fast, high confidence):

Regex word-boundary match of the exact AI name:
```typescript
const exactRegex = new RegExp(`\\b${escapedName}\\b`, 'i');
```

**Layer 2 — Fuzzy Match via Levenshtein Distance** (medium, handles typos):

Tokenises the transcript and checks each word's edit distance against the AI name. For short names (≤ 4 characters like "Lira"), allows a distance of **2** — meaning up to 2 character insertions, deletions, or substitutions:

```
"leera" vs "lira" → distance 2 → MATCH
"laura" vs "lira" → distance 2 → MATCH
"michael" vs "lira" → distance 5 → NO MATCH
```

**Layer 3 — Phonetic Match via Soundex** (catches sounds-alike words):

Soundex encodes words by how they sound in English. "Lira", "Lyra", and "Lura" all produce the Soundex code **L600**. Any word with the same Soundex code is a potential match, subject to a Levenshtein distance guard (≤ maxDist + 2) to prevent over-matching.

```
soundex("Lira")  → "L600"
soundex("Lyra")  → "L600" → MATCH
soundex("Laura") → "L600" → MATCH (with distance check)
soundex("Luna")  → "L500" → NO MATCH
```

### 7.3 Rolling Transcript Buffer

Nova Sonic sends transcripts in small chunks. The name "Lira" might be split:
- Chunk 1: "Hey Li"
- Chunk 2: "ra, what do you think?"

To handle this, we maintain an **8-second rolling buffer** of recently received transcript chunks:

```typescript
const TRANSCRIPT_BUFFER_WINDOW_MS = 8_000;
const recentUserChunks: { text: string; time: number }[] = [];

function getRecentUserText(): string {
  const cutoff = Date.now() - TRANSCRIPT_BUFFER_WINDOW_MS;
  while (recentUserChunks.length > 0 && recentUserChunks[0].time < cutoff) {
    recentUserChunks.shift();
  }
  return recentUserChunks.map(c => c.text).join(' ');
}
```

Wake word detection runs against **both** the current chunk and the buffered text. So even if "Lira" is split across chunks, combining the last 8 seconds of text will capture the full name.

### 7.4 Cooldown Window

After detecting the wake word, Lira stays "addressed" for **45 seconds**. This enables natural conversation flow. Crucially, the timer **refreshes after each Lira response** — so the 45-second window restarts from when Lira finishes speaking, not from the original wake word.

```
User: "Hey Lira, what happened last quarter?"     ← wake word detected (t=0)
Lira: "Revenue was up 15%..."                      ← responds (t=5s), timer refreshed → t=0
User: "Can you break that down by region?"          ← no wake word, within 45s → responds
Lira: "Sure, EMEA was..."                           ← responds (t=10s), timer refreshed → t=0
User: "And compare it to Q1?"                       ← still within 45s → responds
[... 45 seconds of silence ...]
User: "What about marketing spend?"                 ← no wake word, cooldown expired → silent
```

### 7.5 1-on-1 Auto-Respond Mode

When only **one other participant** is in the meeting (a 1-on-1 call), Lira bypasses the wake word entirely. The logic: if it's just the user and Lira, there's nobody else the user could be talking to.

**Implementation**:
- `MeetingBot.getParticipantCount()` queries the audio bridge's `connectedSources.length`
- Bot Manager polls this every 5 seconds and calls `sonic.setParticipantCount(sessionId, count)`
- `shouldForwardAssistantOutput()` checks `session.participantCount === 1` — if true, always forward
- When a third person joins, the count changes to 2+ and wake word gating re-engages

This covers the most common use case: a user calling Lira into a private meeting for a 1-on-1 chat.

---

## 8. Backend Architecture

### 8.1 Server & Framework

The backend runs as a **Fastify 4** server on EC2. It serves the Creovine platform (CVault VPN, CMS, etc.) and Lira AI from the same process.

**Route groups:**
- `/v1/auth/*` — Platform authentication (JWT)
- `/lira/v1/meetings/*` — Meeting CRUD
- `/lira/v1/bot/*` — Bot deployment and management
- `/lira/v1/ws` — WebSocket for real-time audio (demo mode)
- `/lira/v1/integrations/*` — OAuth callbacks, connection CRUD, member mapping for all 9 integrations
- `/lira/v1/integrations/google/events/*` — Google Calendar event creation and updates
- `/lira/v1/usage/*` — Org usage tracking and quota enforcement
- `/lira/v1/webhooks/inbound/*` — Inbound webhooks from Linear, Slack, Teams
- `/lira/v1/email/*` — Email config, domain management, inbound reply engine
- `/api/orgs/*` — Organization CRUD, membership, knowledge base, documents, tasks

The server starts on port 3000 (behind Nginx on EC2 for TLS termination) and registers Swagger/OpenAPI documentation at `/docs`.

### 8.2 Bot Manager — The Orchestrator

`bot-manager.service.ts` (338 lines) is the central orchestrator that ties everything together. It's a module with state managed in a `Map<string, ManagedBot>` (not a class — simple and effective).

**Constants:**
```typescript
const MAX_ACTIVE_BOTS = parseInt(process.env.LIRA_BOT_MAX_ACTIVE ?? '3', 10);
const MAX_BOTS_PER_USER = parseInt(process.env.LIRA_BOT_MAX_PER_USER ?? '2', 10);
const DEFAULT_TTL_DAYS = parseInt(process.env.LIRA_MEETING_TTL_DAYS ?? '7', 10);
const GOOGLE_AUTH_STATE_PATH = process.env.LIRA_BOT_GOOGLE_AUTH_STATE || '';
const BOT_HEADLESS = process.env.LIRA_BOT_HEADLESS !== 'false';
const DEFAULT_DISPLAY_NAME = process.env.LIRA_BOT_DISPLAY_NAME || 'Lira AI';
```

The default `MAX_ACTIVE_BOTS` is 3 (calibrated for the `t3.small` instance — each Chromium consumes ~200–400MB RAM on a 2GB machine). `MAX_BOTS_PER_USER` prevents a single user from monopolising capacity.

Each deploy logs memory usage (`rss`, `heapUsed`, active bot count) for capacity monitoring.

**Deploy flow** (`deployBot(request, userId)`):
1. Validate meeting URL
2. Detect platform — **Zoom returns a clear `PLATFORM_NOT_SUPPORTED` error** (Phase 2)
3. Check global capacity (`MAX_ACTIVE_BOTS`) and per-user limit (`MAX_BOTS_PER_USER`)
4. Generate unique `botId` and `sessionId`
5. Merge user settings with defaults
6. Create `Meeting` record in DynamoDB (TTL = `DEFAULT_TTL_DAYS`)
7. Construct `BotConfig` (URL, platform, auth path, headless flag, timeouts)
8. Create `MeetingBot` instance
9. Wire all event handlers (see below)
10. Call `meetingBot.launch()` (async — returns immediately)
11. Return `{ bot_id, session_id, state: 'launching' }`

**Event wiring:**

```
meetingBot.on('state')  → update BotInstance state
meetingBot.on('joined') → start Nova Sonic session with callbacks:
    sonic.onAudioOutput  → meetingBot.injectAudio(pcm)
    sonic.onTextOutput   → store.appendMessage() + console log
    sonic.onAudioOutputEnd → meetingBot.endAudioOutput()
    sonic.onInterruption → meetingBot.endAudioOutput()
    sonic.onMicMute      → meetingBot.muteMic()
    sonic.onMicUnmute    → meetingBot.unmuteMic()
meetingBot.on('audio')  → sonic.sendAudio(sessionId, pcm)
meetingBot.on('ended')  → sonic.endSession() + cleanup
```

### 8.3 Meeting Bot — Browser Lifecycle

`MeetingBot` extends `EventEmitter` and manages the complete lifecycle:

**States**: `launching` → `navigating` → `joining` → `active` → `leaving` → `terminated`

**Launch sequence:**
1. Launch Chromium with `CHROME_ARGS`
2. Create browser context with auth state + permissions
3. Create page
4. Set up `AudioBridge` (inject init script before page load)
5. Register audio capture callback
6. Create platform-specific driver (`GoogleMeetDriver`)
7. Register meeting-end callback
8. Call `driver.join()` (handles navigation, popups, name entry, join click, lobby wait)
9. Start audio capture
10. Emit `'joined'` event
11. Set meeting duration timeout (4 hours max)

**Terminate sequence:**
1. Stop audio capture
2. Destroy audio bridge
3. Call `driver.leave()` (click leave button)
4. Close page → close context → close browser
5. Emit `'ended'` event

### 8.4 REST API Routes

#### Bot Routes (`/lira/v1/bot`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/deploy` | Deploy a bot to join a meeting. Body: `{ meeting_url, display_name?, settings? }`. Returns 429 if global capacity or per-user limit exceeded. Returns 400 `PLATFORM_NOT_SUPPORTED` for Zoom. |
| `GET` | `/:botId` | Get bot status (state, platform, errors, timestamps) |
| `POST` | `/:botId/terminate` | Gracefully terminate a bot |
| `GET` | `/active` | List all active bots with count |
| `GET` | `/auth-status` | Get Google/Zoom session health (days remaining, urgency) |
| `POST` | `/auth-refresh` | Trigger silent Google session refresh |

#### Meeting Routes (`/lira/v1/meetings`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create a meeting session. Optional `ttl_days` (1–90, default 7). |
| `GET` | `/` | List all meetings for the authenticated user |
| `GET` | `/:id` | Get a single meeting with full transcript |
| `GET` | `/:id/summary` | Generate AI summary of the meeting |
| `PUT` | `/:id/settings` | Update AI settings mid-meeting |
| `DELETE` | `/:id` | Delete a meeting |

#### Organisation Routes (`/lira/v1/orgs`)

See [Section 18.13](#1813-api-reference) for the full org, knowledge base, document, task, and webhook route reference.

#### Interview Routes (`/lira/v1/orgs/:orgId/interviews`)

See [Section 20.8](#208-api-reference) for the full interview route reference.

#### Email Routes (`/lira/v1/email`)

See [Section 19.6](#196-api-reference) for the full email configuration and inbound route reference.

#### Integration Routes (`/lira/v1/integrations`)

See [Section 21](#21-third-party-integrations) for full details. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/:provider/auth-url` | Get OAuth authorization URL (Linear, Slack, Teams, Google, GitHub, HubSpot, Salesforce) |
| `GET` | `/:provider/callback` | OAuth callback handler — exchanges code for tokens, stores encrypted connection |
| `GET` | `/:provider/status` | Check connection status for a provider |
| `DELETE` | `/:provider/disconnect` | Disconnect integration and revoke tokens |
| `GET` | `/:provider/members` | List members from the connected platform |
| `GET` | `/:provider/member-mappings` | Get org member ↔ platform member mappings |
| `POST` | `/:provider/member-mappings` | Save member mapping |
| `POST` | `/greenhouse/connect` | Connect Greenhouse via API key (not OAuth) |
| `GET` | `/google/calendars` | List Google calendars |
| `POST` | `/google/calendars/default` | Set default calendar for the org |
| `GET` | `/google/events` | List upcoming Google Calendar events |
| `POST` | `/google/events` | Create a Google Calendar event |
| `PUT` | `/google/events/:eventId` | Update a Google Calendar event |
| `GET` | `/google/drive/folders` | List Google Drive folders |
| `GET` | `/google/drive/files` | List/search Google Drive files |
| `GET` | `/google/drive/files/:fileId` | Read file content (Docs, Sheets, raw) |
| `POST` | `/google/drive/folders` | Create a Google Drive folder |
| `GET` | `/linear/teams` | List Linear teams |
| `POST` | `/linear/teams/default` | Set default Linear team |
| `GET` | `/slack/channels` | List Slack channels |
| `POST` | `/slack/channels/default` | Set default Slack channel |
| `GET` | `/teams/teams` | List Microsoft Teams teams |
| `GET` | `/teams/channels` | List channels for a team |
| `POST` | `/teams/teams/default` | Set default Teams team |
| `GET` | `/github/repos` | List GitHub repositories |
| `GET` | `/github/repos/:owner/:repo/files` | Browse repo files |
| `POST` | `/github/issues` | Create GitHub issue |
| `POST` | `/github/pull-requests` | Create GitHub PR |
| `GET` | `/greenhouse/jobs` | List Greenhouse jobs |
| `GET` | `/greenhouse/candidates` | List Greenhouse candidates |
| `GET` | `/hubspot/contacts` | List HubSpot contacts |
| `GET` | `/hubspot/deals` | List HubSpot deals |
| `GET` | `/salesforce/contacts` | List Salesforce contacts |
| `GET` | `/salesforce/opportunities` | List Salesforce opportunities |

#### External Webhook Routes (`/lira/v1/webhooks/inbound`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/linear` | Linear webhook handler — receives issue/comment events |
| `POST` | `/slack` | Slack Events API handler — message events, app mentions |
| `POST` | `/teams` | Microsoft Teams webhook — activity notifications |

#### Usage Routes (`/lira/v1/usage`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/?orgId=<id>` | Get org usage stats (meetings, bots deployed, interviews, documents, API calls) |

All routes require JWT authentication via `jwtWithTenantAuth` middleware (except external webhook endpoints which use platform-specific signature verification).

### 8.5 WebSocket Routes

The `/lira/v1/ws` endpoint supports a browser-based demo mode where the user's microphone audio is sent directly to the backend (bypassing the browser bot). The protocol uses:

- **Text frames**: JSON messages with `{ action, session_id?, payload }`
  - Actions: `join`, `text`, `audio_start`, `audio_stop`, `settings`, `leave`
- **Binary frames**: Raw PCM audio (16 kHz Int16 mono)

Server responses:
- `joined` — successfully joined a session
- `transcript` — user or AI speech transcript
- `ai_response` — AI text response
- `ai_response_end` — AI finished speaking
- `interruption` — user interrupted the AI
- `audio_ready` — S3 recording URL available
- `error` — error message

### 8.6 DynamoDB Store

`lira-store.service.ts` provides a clean CRUD layer over two DynamoDB tables:

**`lira-meetings`** (partition key: `session_id`):
- Stores meeting metadata, settings, transcript messages, AI state
- **7-day default TTL** (`ttl` attribute, configurable per meeting via `ttl_days` or globally via `LIRA_MEETING_TTL_DAYS`)
- Messages are appended via `list_append` UpdateExpression

**`lira-connections`** (partition key: `connection_id`):
- Tracks active WebSocket connections
- Links connections to sessions and users

Both tables use PAY_PER_REQUEST billing and the AWS SDK v3 `DynamoDBDocumentClient` for clean JSON marshalling.

### 8.7 Data Models

**`MeetingSettings`**:
```typescript
{
  personality: 'supportive' | 'challenger' | 'facilitator' | 'analyst',
  participation_level: 0.0 – 1.0,
  wake_word_enabled: boolean,
  proactive_suggest: boolean,
  ai_name: string,        // default: "Lira"
  voice_id?: string,       // default: "tiffany"
  language?: string,       // default: "en-US"
}
```

**`Meeting`**:
```typescript
{
  session_id: string,      // "mtg-<uuid>"
  title: string,
  user_id: string,
  created_at: string,      // ISO-8601
  updated_at: string,
  ttl: number,             // Unix epoch seconds (default: 7 days)
  settings: MeetingSettings,
  messages: Message[],
  participants: string[],
  ai_state: { last_response_time, response_count },
  audio_url?: string,      // S3 presigned URL
}
```

**`Message`**:
```typescript
{
  id: string,
  speaker: string,         // "participant" or "lira"
  text: string,
  timestamp: string,
  is_ai: boolean,
  sentiment?: string,      // "positive", "negative", "neutral"
}
```

**`SonicSession`** (runtime, not persisted):
```typescript
{
  sessionId, connectionId, active, recordingChunks,
  promptCounter, aiName, wakeWordEnabled, wakeWordActive,
  lastWakeWordTime, conversationContext, muted, participantCount,
  keepaliveTimer, pushAudio(pcm), endAudio()
}
```

| Field | Purpose |
|-------|---------|
| `participantCount` | Number of other participants. When `1`, wake word is bypassed (1-on-1 mode). Updated by bot-manager polling every 5 seconds. |

**`BotConfig`**:
```typescript
{
  meetingUrl: string,
  platform: 'google_meet' | 'zoom',
  displayName: string,
  sessionId: string,
  settings: MeetingSettings,
  authStatePath?: string,
  headless: boolean,
  timeouts: { joinMs: 120_000, meetingMs: 14_400_000, lobbyMs: 300_000 }
}
```

**Bot states**: `launching` → `navigating` → `in_lobby` → `joining` → `active` → `leaving` → `terminated` | `error`

---

## 9. Frontend Architecture

### 9.1 Project Structure

The frontend is a **React 19 + TypeScript SPA** built with Vite 7, deployed on Vercel at `https://lira.creovine.com`.

```
src/
├── pages/
│   ├── HomePage.tsx                    — Login + Bot Deploy + Demo meeting start
│   ├── LandingPage.tsx                 — Public marketing landing (4 products: Meetings, Interviews, Sales, Support)
│   ├── DashboardPage.tsx               — Authenticated user dashboard
│   ├── MeetingPage.tsx                 — Browser-based demo meeting
│   ├── MeetingsPage.tsx                — List of all meetings
│   ├── MeetingDetailPage.tsx           — Full transcript + summary for a meeting
│   ├── OnboardingPage.tsx              — First-login org creation / join flow
│   ├── OrganizationsPage.tsx           — List of user's organisations
│   ├── OrgSettingsPage.tsx             — Organisation profile & settings
│   ├── OrgMembersPage.tsx              — Member list, roles, invite code
│   ├── OrgEmailPage.tsx                — Email config: platform / custom domain, threads
│   ├── WebhooksPage.tsx                — Slack webhook & email notification config
│   ├── KnowledgeBasePage.tsx           — Website crawl & KB entry management
│   ├── DocumentsPage.tsx               — Uploaded document management
│   ├── TasksPage.tsx                   — Task list: filter by status, assign, execute
│   ├── OrgTaskDetailPage.tsx           — Single task detail + execution result
│   ├── InterviewsPage.tsx              — Interview roles list (grouped by job title)
│   ├── InterviewRolePage.tsx           — All candidates for a role
│   ├── InterviewCreatePage.tsx         — Create / draft a new interview
│   ├── InterviewDetailPage.tsx         — Interview detail: transcript, evaluation, scoring
│   ├── IntegrationsPage.tsx            — Connect/disconnect 9 integrations, OAuth flows, member mapping
│   ├── UsagePage.tsx                   — Org usage dashboard & quota tracking
│   ├── MemberProfilePage.tsx           — Individual member profile + contributions
│   ├── SettingsPage.tsx                — Personal user settings
│   ├── ProductSalesPage.tsx            — Sales coaching product marketing page
│   ├── ProductInterviewsPage.tsx       — AI Interviews product marketing page
│   ├── ProductCustomerSupportPage.tsx  — Customer support product marketing page
│   ├── ResourcesPage.tsx               — Resources / documentation links
│   ├── SecurityPage.tsx                — Platform security overview
│   ├── BlogPage.tsx                    — Blog listing page
│   ├── BlogPostPage.tsx                — Individual blog post
│   ├── PrivacyPage.tsx                 — Privacy policy
│   ├── TermsPage.tsx                   — Terms of service
│   ├── CookiePolicyPage.tsx            — Cookie policy
│   ├── AcceptableUsePage.tsx           — Acceptable use policy
│   └── UiLabPage.tsx                   — Component development playground
├── components/
│   ├── bot-deploy/
│   │   ├── BotDeployPanel.tsx   — Main feature: paste link → deploy bot
│   │   └── AuthStatusCard.tsx   — Google session health display
│   ├── ai/                      — AI participant components
│   ├── interview/               — Interview form, question builder, evaluation display
│   ├── meeting-room/            — In-meeting controls and transcript display
│   ├── org/                     — Organisation management components
│   ├── transcript/              — Transcript rendering components
│   ├── marketing/               — Marketing layout and section components
│   ├── common/                  — Reusable UI components (ConfirmDialog, PageLoader, etc.)
│   └── ui/                      — Radix/shadcn primitives
├── services/
│   └── api/index.ts              — All REST API calls (200+ typed wrappers including 50+ integration APIs)
├── features/
│   ├── ai-participant/           — AI participant feature state
│   ├── interview/                — Interview feature store and logic
│   ├── meeting/
│   │   └── use-audio-meeting.ts — Audio meeting lifecycle hook
│   ├── participants/             — Participant management
│   └── settings/                — User settings feature
├── app/
│   ├── store/index.ts            — Zustand stores (auth, meeting, bot, org, interview, tasks, KB)
│   └── router/index.ts           — Route definitions (40+ routes + 8 integration callbacks)
├── lib/
│   ├── audio.ts                  — Browser mic capture + AI audio playback
│   └── utils.ts                  — Tailwind class merge utilities
└── env.ts                         — Zod-validated environment config
```

### 9.2 Authentication Flow

The frontend uses Creovine platform authentication:

1. **Google Sign-In** (primary): Uses `@react-oauth/google` to get a Google ID token, sends it to `POST /v1/auth/google`, receives a JWT
2. **Email/password** (fallback): `POST /v1/auth/login`

The JWT is stored in `localStorage` via a Zustand store with `persist` middleware and sent as `Authorization: Bearer <token>` on all API requests.

### 9.3 Bot Deploy Panel — The Main Feature

The `BotDeployPanel` component is the core user-facing feature. It provides a simple flow:

1. **Paste a meeting link** — validates as Google Meet (`meet.google.com/xxx-yyy-zzz`) or Zoom
2. **Click "Send Lira to Meeting"** — calls `POST /lira/v1/bot/deploy`
3. **Status tracking** — polls `GET /lira/v1/bot/:botId` every 2 seconds
4. **Live status display** — shows animated state indicators:
   - `launching` → amber, spinning loader
   - `navigating` → amber, spinning loader
   - `in_lobby` → blue, with "Admit her from your meeting" hint
   - `joining` → blue, spinning loader
   - `active` → green, pulsing radio icon, with "Say Lira to get her attention" hint
   - `terminated` / `error` → grey/red, with "Deploy to Another Meeting" button
5. **Terminate button** — "Remove Lira from Meeting" calls `POST /lira/v1/bot/:botId/terminate`

The `AuthStatusCard` component shows the Google session health below the deploy panel, with a manual refresh button.

### 9.4 Browser-Based Demo Meeting

The `MeetingPage` provides an alternative mode where the user's browser microphone is used directly (no Google Meet bot involved):

1. User enters a meeting title and clicks "Start Meeting"
2. `useAudioMeeting` hook creates a meeting via REST, then opens a WebSocket
3. User clicks the mic button to start capturing
4. Browser mic audio (16 kHz PCM) is sent as binary WebSocket frames
5. Server forwards audio to Nova Sonic
6. Nova Sonic responses come back as binary frames (24 kHz PCM) + JSON transcript
7. Audio is played in the browser via `playPcmChunk()`
8. Transcript appears in real-time

This mode is useful for demos and testing without needing a real Google Meet call.

### 9.5 State Management

Zustand stores manage the frontend state:

**`useAuthStore`** (persisted to localStorage):
- `token`, `userEmail`, `userName`, `userPicture`
- `setCredentials()`, `clearCredentials()`

**`useMeetingStore`** (in-memory):
- `meetingId`, `meetingTitle`, `isConnected`, `aiStatus`
- `transcript[]` (last 200 lines, deduplicated)
- `addTranscriptLine()`, `setAiStatus()`, `setLastAiResponse()`

**`useBotStore`** (in-memory):
- `botId`, `meetingUrl`, `platform`, `botState`, `error`
- `setBotDeployed()`, `setBotState()`, `setBotError()`, `clearBot()`

**`useOrgStore`** (persisted to localStorage):
- `currentOrgId`, `currentOrg`, `orgs[]`
- `setCurrentOrg()`, `setOrgs()`

**`useInterviewStore`** (in-memory):
- `interviews[]`, `loading`
- `setInterviews()`, `addInterview()`, `updateInterview()`, `removeInterview()`

**`useTaskStore`** (in-memory):
- `tasks[]`, `loading`
- `setTasks()`, `addTask()`, `updateTask()`, `removeTask()`

**`useKBStore`** (in-memory):
- `entries[]`, `crawlStatus`, `loading`
- `setEntries()`, `removeEntry()`, `setCrawlStatus()`

### 9.6 API Service Layer

`src/services/api/index.ts` provides a typed wrapper around all backend endpoints:

- `apiFetch<T>()` — generic fetch wrapper that auto-injects JWT and handles errors
- **JWT expiry handling**: `apiFetch` intercepts 401 responses, clears `localStorage` credentials, and dispatches a `lira:auth-expired` custom event. The `AuthExpiryGuard` component in `App.tsx` listens for this event and redirects the user to the login screen.
- `googleLogin()`, `login()` — authentication
- `createMeeting()`, `listMeetings()`, `getMeeting()`, `getMeetingSummary()`, etc.
- `deployBot()`, `getBotStatus()`, `terminateBot()`, `listActiveBots()`
- `getBotAuthStatus()`, `refreshBotAuth()`
- `buildWsUrl()` — constructs WebSocket URL with token

The `BotDeployPanel` polling loop also detects JWT expiry gracefully — it stops polling, sets an error message ("Session expired — please sign in again."), and relies on `AuthExpiryGuard` to handle the redirect.

---

## 10. Infrastructure & Deployment

### 10.1 AWS Resources

| Service | Resource | Purpose |
|---|---|---|
| **EC2** | `t3.small` (i-038a4bb6abf311937) | Backend server — Fastify + Playwright |
| **Elastic IP** | `98.92.255.171` | Static IP for the backend |
| **DynamoDB** | `lira-meetings` table | Meeting sessions, transcripts, settings |
| **DynamoDB** | `lira-connections` table | WebSocket connection tracking |
| **DynamoDB** | `lira-organizations` table | Orgs, memberships, KB entries, documents, tasks, email config, threads |
| **DynamoDB** | `lira-interviews` table | Interview records (questions, evaluation, status) |
| **S3** | `creovine-lira-documents` | Org documents (uploaded PDFs, extracted text) |
| **S3** | `lira-documents-storage` | Candidate resume PDFs (interview feature) |
| **S3** | `lira-inbound-email` | Raw MIME emails routed by SES receipt rule |
| **S3** | Auth state bucket | Google bot session backup |
| **SES** | `liraintelligence.com` | Inbound email receipt — `reply+*@liraintelligence.com` routes |
| **SNS** | Inbound email topic | SES → SNS → Fastify webhook bridge for reply engine |
| **Secrets Manager** | `/creovine/shared` | DATABASE_URL + other secrets |
| **Bedrock** | `amazon.nova-sonic-v1:0` | Speech-to-speech AI model |
| **IAM** | EC2 instance role | Bedrock, DynamoDB, S3, SES, SNS, Secrets Manager access |

### 10.2 EC2 Server Setup

The EC2 instance runs Ubuntu 22.04 with:

- **Node.js 20+** (required for Playwright)
- **Playwright Chromium** browsers installed (`npx playwright install chromium`)
- **Chromium system dependencies** (`npx playwright install-deps`)
- **systemd service**: `creovine-api.service` manages the Node.js process
- **Nginx** (optional) for TLS termination and reverse proxy
- **Code location**: `/opt/creovine-api`

systemd ensures the server restarts automatically on crash:
```bash
sudo systemctl restart creovine-api
sudo journalctl -u creovine-api -f  # tail logs
```

### 10.3 Vercel Frontend Deployment

The frontend is deployed on Vercel:

- **Project**: `lira-creovine`
- **Domain**: `lira.creovine.com`
- **Framework**: Vite (auto-detected)
- **Build command**: `npm run build` → `tsc -b && vite build`
- **SPA routing**: `vercel.json` rewrites all paths to `index.html`

Environment variables on Vercel:
```
VITE_API_URL=https://api.creovine.com
VITE_WS_URL=wss://api.creovine.com/lira/v1/ws
VITE_GOOGLE_LOGIN_CLIENT_ID=<google-oauth-client-id-for-login>
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id-for-integrations>
```

> **Note:** Two separate Google Client IDs are used — `VITE_GOOGLE_LOGIN_CLIENT_ID` for platform sign-in (the Lira app's OAuth consent screen) and `VITE_GOOGLE_CLIENT_ID` for Google Calendar/Drive integration scopes (the broader Creovine platform consent screen). See Section 10.6 for more.

### 10.4 DNS Configuration

DNS records on Namecheap:

| Type | Name | Value | Purpose |
|---|---|---|---|
| `A` | `api` | `98.92.255.171` | Backend API |
| `CNAME` | `lira` | `cname.vercel-dns.com` | Frontend |

- `https://api.creovine.com` → EC2 backend
- `https://lira.creovine.com` → Vercel frontend

### 10.5 Deployment Script

`deploy-auto.sh` provides one-command deployment from the local machine:

```bash
./deploy-auto.sh
```

**What it does:**
1. `npm run build` — compiles TypeScript to `dist/` locally
2. `rsync` — syncs all files to EC2 (excludes `node_modules`, `.env`, `.git`)
3. SSH to server: `npm install --production`, `prisma generate`, `prisma migrate deploy`
4. `sudo systemctl restart creovine-api` — restarts the service
5. Verifies the service is active

**Requirements:**
- SSH key at `~/.ssh/creovine-api-key.pem`
- SSH access to `ubuntu@98.92.255.171`

### 10.6 Environment Variables

**Backend (`.env` on EC2):**

```bash
# Server
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="..."
JWT_EXPIRES_IN=15m

# AWS (via instance role, but region needed)
AWS_REGION=us-east-1

# Lira AI (text generation + summaries)
OPENAI_API_KEY=sk-proj-...              # GPT-4o-mini for summaries, titles, text responses,
                                        # interview question generation, evaluation, email replies
OPENAI_MODEL=gpt-4o-mini                # override model if needed

# Deepgram (speaker diarization — optional, falls back gracefully if unset)
DEEPGRAM_API_KEY=...                    # Deepgram Nova-2 streaming API key

# Google OAuth — DUAL CLIENT IDS
GOOGLE_LOGIN_CLIENT_ID=71053791265-...  # Lira app OAuth consent screen (login only)
GOOGLE_CLIENT_ID=467839759761-...       # Creovine platform OAuth (Calendar/Drive integration scopes)
# Backend accepts tokens from BOTH audiences via getAllowedAudiences()
# in platform-auth.service.ts — this allows users signing in via either
# the Lira frontend or the Creovine website to authenticate against the same backend

# Lira AI Bot
LIRA_BOT_GOOGLE_AUTH_STATE=.lira-bot-auth/google-state.json
LIRA_BOT_DISPLAY_NAME=Lira AI
LIRA_BOT_MAX_ACTIVE=3
LIRA_BOT_MAX_PER_USER=2
LIRA_BOT_HEADLESS=true
LIRA_BOT_SCREENSHOT_DIR=./debug-screenshots
LIRA_BOT_AUTH_S3_BUCKET=                  # S3 bucket for auth state backup (optional)
LIRA_BOT_AUTH_S3_PREFIX=lira-bot/auth-state
LIRA_MEETING_TTL_DAYS=7
LIRA_BEDROCK_REGION=us-east-1
LIRA_NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v1:0
LIRA_DYNAMODB_MEETINGS_TABLE=lira-meetings
LIRA_DYNAMODB_CONNECTIONS_TABLE=lira-connections
LIRA_DYNAMODB_ORGS_TABLE=lira-organizations    # orgs, KB, docs, tasks, email config
LIRA_DYNAMODB_INTERVIEWS_TABLE=lira-interviews # interview records

# Interview feature
LIRA_S3_DOCUMENTS_BUCKET=lira-documents-storage  # candidate resume storage

# Email integration (Resend)
RESEND_API_KEY=re_...                  # Resend API key for outbound email
REPLY_TOKEN_SECRET=...                 # Secret for signing JWT reply tokens
LIRA_EMAIL_FROM_ADDRESS=lira@liraintelligence.com  # platform sending address

# Inbound email (AWS SES → SNS → Fastify)
LIRA_INBOUND_EMAIL_SNS_ARN=arn:aws:sns:...  # Expected SNS topic ARN (security check)
LIRA_INBOUND_EMAIL_BUCKET=lira-inbound-email # S3 bucket for raw MIME emails from SES

# Vector search (Qdrant)
QDRANT_URL=http://localhost:6333             # Qdrant REST API (Docker on EC2)

# Integration OAuth credentials (per-provider)
LINEAR_CLIENT_ID=...                    # Linear OAuth2 app credentials
LINEAR_CLIENT_SECRET=...
SLACK_CLIENT_ID=...                     # Slack OAuth V2 app credentials
SLACK_CLIENT_SECRET=...
SLACK_SIGNING_SECRET=...                # For verifying inbound Slack webhook signatures
TEAMS_CLIENT_ID=...                     # Azure AD app registration
TEAMS_CLIENT_SECRET=...
TEAMS_TENANT_ID=...                     # Azure AD tenant (or "common" for multi-tenant)
GOOGLE_INTEGRATIONS_CLIENT_ID=...       # Google OAuth for Calendar/Drive (falls back to GOOGLE_CLIENT_ID)
GOOGLE_INTEGRATIONS_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...                    # GitHub OAuth app credentials
GITHUB_CLIENT_SECRET=...
HUBSPOT_CLIENT_ID=...                   # HubSpot OAuth2 app credentials
HUBSPOT_CLIENT_SECRET=...
SALESFORCE_CLIENT_ID=...                # Salesforce Connected App (OAuth2 + PKCE)
SALESFORCE_CLIENT_SECRET=...
# Note: Greenhouse uses API key auth, not OAuth — key is stored per-connection in DynamoDB
```

**Frontend (Vercel environment):**

```bash
VITE_API_URL=https://api.creovine.com
VITE_WS_URL=wss://api.creovine.com/lira/v1/ws
VITE_GOOGLE_LOGIN_CLIENT_ID=71053791265-...   # For @react-oauth/google sign-in button
VITE_GOOGLE_CLIENT_ID=467839759761-...        # For Google Calendar/Drive OAuth consent
```

---

## 11. Challenges & Solutions

### 11.1 Echo — Lira Hearing Herself

**Problem**: When Lira speaks, her voice is played through WebRTC, which means her own capture pipeline picks it up. Nova Sonic then processes Lira's voice as if a participant said something, causing Lira to respond to herself in an infinite loop.

**Solution**: The **echo gate** — a boolean flag (`outputting`) in the Audio Bridge. When Lira is injecting audio, all captured frames are dropped. After injection ends, a drain delay (remaining scheduled audio time + 500 ms margin) ensures all audio has finished playing before capture resumes. The Node-side safety buffer adds another 800 ms. Total echo gate overhead is ~1.3 seconds (down from ~3.2 seconds in earlier versions).

### 11.2 Wake Word Splitting Across STT Chunks

**Problem**: Nova Sonic sends transcripts as small fragments. When someone says "Hey Lira," the name might arrive as "Li" in one chunk and "ra" in the next. No single chunk contains "Lira", so wake word detection fails.

**Solution**: An **8-second rolling transcript buffer** combines recently received chunks. Wake word detection runs against both the current chunk AND the combined buffer text, so even split names are caught.

### 11.3 Getting Stuck on Mute

**Problem**: When Lira is muted, she can't hear anything (mic button is physically muted in Google Meet). If the unmute command required saying "Lira, unmute" — but Lira can't hear you because she's muted — you're trapped.

**Solution**: When muted, the unmute command does **NOT require the wake word**. Any occurrence of "unmute", "come back", "start listening", etc. triggers unmute, even without saying "Lira" first. The mute command still requires the wake word to prevent accidental muting.

> **Design principle**: False-positive unmute is harmless (Lira just starts listening again). False-negative unmute is a trap (user can't get Lira back). So we bias toward unmuting.

### 11.4 Double Voice Output

**Problem (v1 — text)**: Nova Sonic sends both a TEXT content block and an AUDIO content block for each assistant turn. Both contain `textOutput` events with identical text, causing duplicated transcript entries.

**Solution (v1)**: Track `currentContentBlockType` ('TEXT' vs 'AUDIO'). Only buffer assistant text from TEXT-type blocks. When contentEnd fires for AUDIO blocks, discard any buffered text (it's a duplicate of what TEXT already flushed).

**Problem (v2 — audio)**: Some Nova Sonic stream chunks failed JSON parsing and were treated as raw PCM audio via a fallback path. This meant the same audio was forwarded TWICE: once through the proper `audioOutput` JSON event and once as "raw PCM". Additionally, `audioOutput` events were not gated by content block type, so audio could be forwarded from both TEXT and AUDIO blocks.

**Solution (v2)**: (a) Removed the raw PCM fallback entirely — all output from the SDK is well-formed JSON events; non-JSON chunks are logged and skipped. (b) Added `currentContentBlockType === 'AUDIO'` guard on the `audioOutput` handler so audio is only forwarded from AUDIO-type content blocks.

### 11.5 Nova Sonic Session Timeouts

**Problem**: If no audio input is received for more than ~30 seconds (e.g., during a silent moment in the meeting), Nova Sonic closes the bidirectional stream, ending the session.

**Solution**: Send **silent PCM every 5 seconds** via a keepalive timer. The 5120-byte buffer represents 160 ms of silence at 16 kHz — enough to keep the stream alive without triggering any response.

### 11.6 Auto-Leaving Empty Meetings

**Problem**: If all participants leave a meeting, the bot sits alone indefinitely, consuming server resources.

**Solution**: The Google Meet Driver counts other participants by checking audio bridge `connectedSources`. When zero other participants are detected, a 45-second timer starts. If no one rejoins within 45 seconds, the bot auto-leaves. If someone rejoins, the timer resets.

### 11.7 Google Meet UI Selector Fragility

**Problem**: Google Meet frequently changes its DOM structure, class names, and `aria-label` values. A single CSS selector for the "Join now" button would break every few weeks.

**Solution**: Every UI element has **multiple fallback selectors**. The driver iterates through them and uses the first one that finds a visible element:

```typescript
joinButton: [
  'button[data-mdc-dialog-action="join"]',  // Primary
  'button[jsname="Qx7uuf"]',                 // Fallback
],
joinButtonText: ['Ask to join', 'Join now', 'Join'],  // Text fallback
```

If all selectors fail, a brute-force scan checks every visible button for matching text content.

When all strategies fail, a **debug screenshot** is saved automatically (see section 4.5). This captures the exact DOM state at the moment of failure, making it straightforward to update selectors without reproducing the issue.

### 11.8 Multi-Turn Echo Gate — Nova Sonic Splitting Long Responses

**Problem**: Nova Sonic splits long AI responses into multiple consecutive TEXT+AUDIO content block pairs (observed up to 4 pairs for a single answer). Each AUDIO block end fires `onAudioOutputEnd` → `endOutput()` on the Audio Bridge. The original implementation cleared the echo gate after each block — but the next block's audio arrived milliseconds later, after the gate had already opened. This created windows where Lira's own voice leaked into the capture pipeline. Nova Sonic heard the echo, interpreted it as the user speaking, and generated a duplicate response. Observed browser audio drain times exploded from 700 ms → 4,784 ms → 13,077 ms across blocks of the same response.

**Root cause trace** (from live session logs):
```
16:23:33  AUDIO block 1 starts
16:23:36  endOutput() called — Node-side gate clears after 800ms
16:23:36  AUDIO block 2 starts immediately (next sub-turn)
16:23:37  Node-side echo gate cleared ← LEAK WINDOW (browser drain was 4784ms)
16:23:40  AUDIO block 3 → browser drain 2237ms
16:23:42  AUDIO block 4 → browser drain explodes to 13,077ms
16:23:59  Lira repeats herself verbatim — echoed her own voice
```

**Solution**: Three coordinated fixes in `audio-bridge.ts`:

1. **Node-side debounce** — `endOutput()` now waits **600 ms** before acting. If `injectAudio()` is called during that window (next sub-turn audio arrived), the debounce timer resets. The echo gate only clears after all consecutive AUDIO blocks in the response are done. The `injectAudio()` method actively cancels both the debounce timer and any pending Node-side gate timer when new audio arrives.

2. **Browser-side recheck** — When the drain `setTimeout` fires, the browser rechecks `nextPlayTime`. If new audio was scheduled while waiting, it re-calculates the drain and re-waits rather than clearing the gate prematurely. Overlapping drain timers are cancelled on re-entry via a tracked `endOutputTimer`.

3. **Restored safe margins** — Browser drain: `max(drainMs, 300) + 1200 ms` (previously reduced to `200 + 500`). Node safety buffer: 2000 ms (previously 800 ms).

```typescript
// Node-side: debounce — only clear gate if no new audio for 600ms
async endOutput(): Promise<void> {
  if (this.endOutputDebounce) clearTimeout(this.endOutputDebounce);
  this.endOutputDebounce = setTimeout(async () => {
    await this.flushInjectBuffer();
    await this.page.evaluate(() => (globalThis as any).__liraEndOutput?.());
    this.nodeSideGateTimer = setTimeout(() => {
      this.outputting = false; // Node echo gate clears after 2s
    }, 2000);
  }, 600); // Wait 600ms — if new audio arrives, this resets
}

// injectAudio() cancels any pending clear when new audio arrives
injectAudio(pcmChunk: Buffer): void {
  this.outputting = true;
  if (this.endOutputDebounce) { clearTimeout(this.endOutputDebounce); this.endOutputDebounce = null; }
  if (this.nodeSideGateTimer) { clearTimeout(this.nodeSideGateTimer); this.nodeSideGateTimer = null; }
  // ... batch and flush
}
```

> **Commit**: `3da9ee3` — *fix: debounce echo gate for multi-turn Nova Sonic responses*

### 11.9 Speaker Identification — From DOM-Only to Deepgram Diarization

**Original problem**: The WebRTC audio capture pipeline receives a **single mixed PCM stream** — all participants' voices are combined before they reach the Audio Bridge. There is no standard API to demix a merged WebRTC stream in a headless browser. This meant the only identification method was DOM-based timing correlation — unreliable for rapid cross-talk and yielding generic "participant" labels for any speaker not caught by the 2-second DOM poll.

**Fully implemented solution** — Three-tier speaker identification system:

**Tier 1 — Deepgram real-time diarization** (new, primary method): The same 16 kHz Int16 PCM audio that feeds Nova Sonic is simultaneously streamed to [Deepgram's Nova-2 streaming API](https://deepgram.com) with `diarize=true`. Deepgram identifies distinct speakers in the mixed stream and labels each word with a speaker index (Speaker 0, Speaker 1, …). This works on the actual voice characteristics, not DOM timing. Cost: ~$0.0059/min, pay-per-use.

**Tier 2 — DOM name correlation**: The existing 2-second active speaker DOM poll (`getActiveSpeaker()`) calls `diarization.correlateNameWithSpeaker()` whenever Google Meet's UI shows a speaking indicator. If Deepgram recently identified a speaker index (within a 4-second window), that index is mapped to the participant name from the DOM. This mapping persists for the entire session (`Speaker 0 = John`, `Speaker 1 = Sarah`).

**Tier 3 — DOM fallback**: If Deepgram is unavailable (API key not set), the system falls back gracefully to pure DOM polling — the pre-existing behaviour.

Result: transcripts now store `speaker: "John"` instead of `speaker: "participant"`. Lira's system prompt still receives participant names from the DOM scraper. The new `deepgram-diarization.service.ts` manages the WebSocket lifecycle, speaker map, and correlation logic.

See **Section 17** for the full Deepgram integration architecture.

---

## 12. How It All Connects — End-to-End Walkthrough

Here is the complete journey from a user clicking "Send Lira to Meeting" to Lira responding in a Google Meet call:

**Step 1 — User deploys Lira**
- User pastes `https://meet.google.com/abc-defg-hij` into the BotDeployPanel
- Frontend validates the URL, detects "google_meet" platform
- Frontend calls `POST /lira/v1/bot/deploy` with the URL

**Step 2 — Backend creates the bot**
- Bot Manager generates `botId` (UUID) and `sessionId` ("mtg-UUID")
- Creates a DynamoDB meeting record
- Constructs `BotConfig` with auth state path, headless=true, Lira AI name
- Creates `MeetingBot` instance and wires event handlers
- Calls `meetingBot.launch()` (non-blocking)
- Returns `{ bot_id, session_id, state: "launching" }` to frontend

**Step 3 — Frontend starts polling**
- Frontend sets `botState = "launching"` and starts polling every 2s
- Shows amber spinner with "Launching browser…"

**Step 4 — Chromium launches**
- Playwright launches Chromium with 14 Chrome flags for headless operation
- Creates context with saved Google session cookies
- Grants microphone + camera permissions for `meet.google.com`
- Creates page and injects Audio Bridge init script

**Step 5 — Joining the meeting**
- Google Meet Driver navigates to the meeting URL
- Dismisses any "Got it" popups
- Turns off camera
- Enters "Lira AI" as display name
- Clicks "Join now" (tries CSS selectors, then text match, then brute force)
- Waits for in-meeting indicators (leave button visible) or lobby
- If lobby: waits up to 5 minutes to be admitted

**Step 6 — Audio bridge activates**
- Bot state → `active`
- Audio capture starts: `__liraStartCapture()` enables the ScriptProcessorNode
- Any pending remote streams are connected to the capture mixer
- Bot emits `'joined'` event

**Step 7 — Nova Sonic + Deepgram sessions start**
- Bot Manager receives `'joined'` event
- Calls `sonic.startSession()` with callbacks
- Nova Sonic opens bidirectional Bedrock stream — system prompt sent with personality + participant names
- **Simultaneously**, `diarization.startDiarization(sessionId)` opens a Deepgram WebSocket
- Both sessions are now ready to receive audio

**Step 8 — Meeting audio flows (dual-stream)**
- Participants speak → WebRTC delivers audio to all
- Audio Bridge captures via ScriptProcessorNode (16 kHz Int16 PCM)
- Echo gate checks: not outputting → forward
- Energy gate checks: above 0.001 → forward
- Same PCM bytes sent to **both**:
  - `sonic.sendAudio(sessionId, pcm)` → Nova Sonic for speech-to-speech
  - `diarization.sendAudio(sessionId, pcm)` → Deepgram for speaker labeling

**Step 9 — Nova Sonic processes + Deepgram labels speaker**
- Nova Sonic STT: generates transcript fragments
- Sends `textOutput` with `role=user` → transcript processing
- **Simultaneously**, Deepgram returns speaker-labeled words: `{word: "I", speaker: 0, ...}`
- Deepgram `getCurrentSpeakerName(sessionId)` → resolves Speaker 0 to "John" (via prior DOM correlation)
- Transcript stored in DynamoDB: `{ speaker: "John", text: "I think we should…" }`
- Wake word service checks transcript: "Lira" found → `wakeWordActive = true`

**Step 10 — Lira responds (if addressed)**
- Nova Sonic generates response
- `shouldForwardAssistantOutput()` checks: wake word active? → YES
- Assistant text → buffered → flushed to DynamoDB on contentEnd
- Assistant audio → `meetingBot.injectAudio(pcm)`
- Audio Bridge: batch (50ms) → `__liraInjectAudio(base64)`
- Browser: base64 → AudioBuffer → scheduled playback → MediaStreamDestination
- Google Meet uses this as Lira's "microphone"
- All participants hear Lira speak

**Step 11 — Lira finishes speaking**
- Nova Sonic sends `contentEnd` for AUDIO block
- `onAudioOutputEnd` callback fires
- `meetingBot.endAudioOutput()` → Audio Bridge drain delay
- Echo gate clears after all scheduled audio finishes + 500ms (+ 800ms Node-side)
- Capture resumes

**Step 12 — Meeting ends**
- Participant clicks "End meeting" or all leave
- Google Meet Driver detects meeting-end indicator or 45s alone timeout
- Bot terminates: stops capture → leaves meeting → closes browser
- Nova Sonic session ends; Deepgram session ends (CloseStream sent → final results logged)
- Bot Manager cleans up all timers
- Frontend polling sees `state: "terminated"`

---

## 13. Repository Structure

**Backend** — `Creovine-Labs/creovine-api` (private):
```
creovine-api/
├── src/
│   ├── index.ts                    — Fastify server + Swagger + route registration
│   ├── config/
│   │   └── index.ts                — Zod-validated config (googleClientId, googleLoginClientId, etc.)
│   ├── routes/
│   │   ├── lira-bot.routes.ts      — Bot deploy/status/terminate REST API
│   │   ├── lira-meetings.routes.ts — Meeting CRUD + summaries REST API
│   │   ├── lira-integration.routes.ts — OAuth callbacks, connection CRUD, member mapping,
│   │   │                               Google Calendar events, Drive operations
│   │   ├── lira-usage.routes.ts    — Usage tracking & quota enforcement
│   │   ├── lira-webhook-external.routes.ts — Inbound webhooks from Linear, Slack, Teams
│   │   └── lira-email.routes.ts    — Email config, domain, inbound reply
│   ├── services/
│   │   ├── lira-bot/
│   │   │   ├── index.ts            — Barrel exports
│   │   │   ├── bot-manager.service.ts — Orchestrator
│   │   │   ├── meeting-bot.ts      — Browser lifecycle
│   │   │   ├── audio-bridge.ts     — Audio capture/injection
│   │   │   ├── auth-refresh.ts     — Google session renewal
│   │   │   └── drivers/
│   │   │       ├── google-meet.driver.ts
│   │   │       └── zoom.driver.ts
│   │   ├── integrations/
│   │   │   ├── adapter.interface.ts    — Base integration adapter interface
│   │   │   ├── linear.adapter.ts       — Linear OAuth2 + issue/team sync
│   │   │   ├── slack.adapter.ts        — Slack OAuth V2 + channel/message ops
│   │   │   ├── teams.adapter.ts        — MS Teams Azure AD OAuth + messaging
│   │   │   ├── google.adapter.ts       — Google Calendar/Drive/Sheets/Docs
│   │   │   ├── github.adapter.ts       — GitHub repos/issues/PRs/code search
│   │   │   ├── greenhouse.adapter.ts   — Greenhouse API-key auth + ATS ops
│   │   │   ├── hubspot.adapter.ts      — HubSpot OAuth2 + CRM ops
│   │   │   └── salesforce.adapter.ts   — Salesforce OAuth2+PKCE + CRM ops
│   │   ├── lira-sonic.service.ts   — Nova Sonic + wake word gating
│   │   ├── lira-wakeword.service.ts — 4-layer wake word detection
│   │   ├── lira-store.service.ts   — DynamoDB persistence
│   │   ├── lira-ai.service.ts      — Meeting summaries (OpenAI GPT-4o-mini) + title generation
│   │   ├── lira-email.service.ts   — Resend email, domain config, thread storage
│   │   ├── lira-email-reply.service.ts — Inbound reply engine (SNS → GPT-4o-mini)
│   │   ├── lira-context-builder.service.ts — Org context assembly for Nova Sonic
│   │   ├── lira-crawl.service.ts   — Website crawling & KB summarization
│   │   ├── platform-auth.service.ts — Dual Google OAuth (getAllowedAudiences)
│   │   └── deepgram-diarization.service.ts — Real-time speaker diarization (Deepgram Nova-2)
│   ├── models/
│   │   ├── lira.models.ts          — Meeting, Message, SonicSession
│   │   └── lira-bot.models.ts      — BotConfig, BotState
│   └── middleware/
│       └── auth.middleware.ts       — JWT authentication
├── prisma/
│   └── schema.prisma                — PostgreSQL schema (platform data)
├── deploy-auto.sh                   — One-command deployment
├── .lira-bot-auth/
│   └── google-state.json           — Saved Google session (not in git)
└── package.json
```

**Frontend** — `Creovine-Labs/lira` (private):
```
lira_ai/
├── src/
│   ├── App.tsx                     — Root component with providers
│   ├── main.tsx                    — Entry point
│   ├── env.ts                      — Zod-validated environment config
│   ├── pages/
│   │   ├── HomePage.tsx            — Login + Bot Deploy
│   │   ├── LandingPage.tsx         — Marketing landing (4 product tabs)
│   │   ├── DashboardPage.tsx       — User dashboard
│   │   ├── MeetingPage.tsx         — Browser demo meeting
│   │   ├── MeetingsPage.tsx        — Meeting list
│   │   ├── MeetingDetailPage.tsx   — Transcript + summary
│   │   ├── OnboardingPage.tsx      — Org creation / join
│   │   ├── OrganizationsPage.tsx   — Org list
│   │   ├── OrgSettingsPage.tsx     — Org profile & settings
│   │   ├── OrgMembersPage.tsx      — Member management
│   │   ├── OrgEmailPage.tsx        — Email config + threads
│   │   ├── WebhooksPage.tsx        — Webhook config
│   │   ├── KnowledgeBasePage.tsx   — KB management
│   │   ├── DocumentsPage.tsx       — Document management
│   │   ├── TasksPage.tsx           — Task board
│   │   ├── OrgTaskDetailPage.tsx   — Task detail
│   │   ├── InterviewsPage.tsx      — Interview roles
│   │   ├── InterviewRolePage.tsx   — Candidates per role
│   │   ├── InterviewCreatePage.tsx — Create interview
│   │   ├── InterviewDetailPage.tsx — Interview detail + evaluation
│   │   ├── IntegrationsPage.tsx    — 9 integrations management
│   │   ├── UsagePage.tsx           — Usage dashboard
│   │   ├── MemberProfilePage.tsx   — Member profile + contributions
│   │   ├── SettingsPage.tsx        — User settings
│   │   ├── ProductSalesPage.tsx    — Sales coaching marketing
│   │   ├── ProductInterviewsPage.tsx — Interviews marketing
│   │   ├── ProductCustomerSupportPage.tsx — Support marketing
│   │   ├── ResourcesPage.tsx       — Resources hub
│   │   ├── SecurityPage.tsx        — Security overview
│   │   ├── BlogPage.tsx            — Blog listing
│   │   ├── BlogPostPage.tsx        — Blog post
│   │   ├── PrivacyPage.tsx         — Privacy policy
│   │   ├── TermsPage.tsx           — Terms of service
│   │   ├── CookiePolicyPage.tsx    — Cookie policy
│   │   ├── AcceptableUsePage.tsx   — Acceptable use policy
│   │   └── UiLabPage.tsx           — Dev component playground
│   ├── components/
│   │   ├── bot-deploy/
│   │   │   ├── BotDeployPanel.tsx  — Paste link → deploy → track
│   │   │   └── AuthStatusCard.tsx  — Session health
│   │   ├── common/                 — Reusable UI components
│   │   └── ui/                     — Radix primitives
│   ├── services/
│   │   └── api/index.ts            — 200+ API wrappers (50+ integration APIs)
│   ├── features/
│   │   └── meeting/
│   │       └── use-audio-meeting.ts — Audio meeting hook
│   ├── app/
│   │   ├── store/index.ts          — Zustand stores
│   │   └── router/index.ts         — 40+ routes
│   └── lib/
│       ├── audio.ts                — Mic capture + audio playback
│       └── utils.ts                — Tailwind utilities
├── docs/
│   ├── INTEGRATION_VERIFICATION_TRACKER.md — Tracker for all 8 integration platform approvals
│   └── features/
│       └── SALES_COACHING_DESKTOP_APP.md   — Sales coaching Electron desktop app specification
├── vite.config.ts
├── vercel.json                     — SPA routing
└── package.json
```

---

## 14. Running Locally

### Prerequisites
- **Node.js 20+**
- **Playwright Chromium**: `npx playwright install chromium && npx playwright install-deps`
- **AWS credentials**: configured via `~/.aws/credentials` or environment variables (need Bedrock, DynamoDB, S3 access)
- **Google auth state**: run `npx tsx scripts/setup-bot-auth.ts --google` to capture session

### Backend

```bash
cd creovine-api

# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Edit .env with your database URL, JWT secret, AWS config, etc.

# Run database migrations
npx prisma migrate dev

# Start development server (with hot reload)
npm run dev
```

The server starts at `http://localhost:3000`. Visit `http://localhost:3000/docs` for the API reference.

### Frontend

```bash
cd lira_ai

# Install dependencies
npm install

# Create .env.local
echo 'VITE_API_URL=http://localhost:3000' > .env.local
echo 'VITE_WS_URL=ws://localhost:3000/lira/v1/ws' >> .env.local

# Start development server
npm run dev
```

The frontend starts at `http://localhost:5173`.

### Testing the Bot Locally

1. Start the backend: `npm run dev` in `creovine-api/`
2. Start the frontend: `npm run dev` in `lira_ai/`
3. Open `http://localhost:5173`
4. Sign in with your Creovine account
5. Create a Google Meet meeting at `meet.google.com`
6. Paste the meeting link into the "Meeting link" field
7. Click "Send Lira to Meeting"
8. Admit "Lira AI" from the Google Meet waiting room
9. Say "Hey Lira, introduce yourself" — Lira responds via voice

Set `LIRA_BOT_HEADLESS=false` in `.env` to see the Chromium browser window during development.

---

---

## 15. Known Limitations & Future Work

This section documents known constraints and planned improvements, informed by a thorough engineering review of the system.

### 15.1 Single Bot Account

Currently, all bots share a single Google account (`lira.ai.creovine@gmail.com`). If Google flags or suspends this account, every customer's bot stops simultaneously. The 7-day silent refresh strategy extends the session window but doesn't address this single point of failure.

**Planned fix**: A pool of bot accounts with session state sharded by bot instance and round-robin assignment. This is the highest-priority scaling item.

### 15.2 EC2 Sizing

Each Playwright Chromium instance consumes ~200–400MB of RAM. The `t3.small` (2GB RAM) realistically supports 3 concurrent bots — reflected in the `LIRA_BOT_MAX_ACTIVE=3` default. For higher concurrency, upgrade to `t3.medium` (4GB) or larger. Per-deploy memory logging is now in place for capacity planning.

### 15.3 ScriptProcessorNode Deprecation

The Audio Bridge uses `ScriptProcessorNode` for audio capture, which is deprecated in favour of `AudioWorkletProcessor`. In a headless browser (no rendering), the main-thread contention argument is weaker than in a visible browser, so this is not urgent. However, Google could increase deprecation pressure. The migration to AudioWorklet is non-trivial (separate worklet file, MessagePort communication model) and would touch the most sensitive part of the system.

**Status**: Planned but not urgent. The current approach works reliably.

### 15.4 Rolling Wake Word Buffer — Cross-Speaker Context

The 8-second rolling transcript buffer concatenates all speech regardless of speaker. In theory, if participant A says "Hey Lira" and 7 seconds later participant B says something unrelated, the buffer could create a false-positive wake context. In practice this is extremely unlikely because the wake word check requires the name to appear in the output, and the transcription text from two speakers would not accidentally form "Lira."

**Future improvement**: Tag chunks with speaker-change detection or only run the combined-buffer check when the current chunk contains a partial name match.

### 15.5 Zoom Support

The Zoom driver (`zoom.driver.ts`) exists but is Phase 2. The API currently accepts Zoom URLs in the schema but returns a clear `PLATFORM_NOT_SUPPORTED` error at deployment time. The Zoom web client has additional challenges vs. Google Meet: explicit "Join from Your Browser" click, separate audio connection dialog, shorter cookie lifetimes, and some hosts disable the web client entirely.

### 15.6 Two Audio Code Paths

The browser-based demo meeting (WebSocket + mic in browser) and the headless bot meeting use different audio code paths. Both handle PCM encoding/decoding and audio playback but are implemented independently. They can drift over time.

**Mitigation**: Both code paths are explicitly cross-referenced in comments.

### 15.7 Speaker Identification Accuracy

The speaker identification system (Sections 16 & 17) is now a **two-tier architecture** combining Deepgram diarization with DOM-based correlation. Known characteristics:

- **Deepgram diarization accuracy**: Deepgram Nova-2 has very high accuracy for clean speech in meetings. Short utterances (<0.5s) may not produce a speaker label. The `interim_results: true` setting provides faster labels but may be revised in the final result.
- **Correlation window (4 seconds)**: The DOM name poll must confirm the active speaker within 4 seconds of Deepgram's last speaker detection. In rapid cross-talk, correlation may assign a wrong name. Once mapped, corrections require a new matching event.
- **DOM dependency for name lookup**: Real names still come from Google Meet's DOM (img alt, aria-label). If Google updates the UI, the DOM scraper may stop returning names — but Deepgram diarization still works (falling back to "Speaker 0", "Speaker 1" labels).
- **Deepgram connection setup time**: The Deepgram WebSocket connection opens when the bot joins. For the first 1–2 seconds of the meeting, diarization results may not yet be flowing — early utterances may use DOM-only attribution.
- **Names not available at first Sonic session**: Participants' names are scraped 3 seconds after Lira joins. The initial Nova Sonic system prompt may start without names but subsequent session restarts include them.

---

## 16. Speaker Identification System (DOM Layer)

Lira can detect who is in the meeting, who is currently speaking, address participants by name in conversation, and attribute transcript messages to the correct speaker. This section covers the DOM-based layer. For Deepgram diarization (the primary attribution method), see **Section 17**.

### 16.1 Overview

| Capability | Implementation | Reliability |
|-----------|---------------|-------------|
| Count participants | `connectedSources.length` in Audio Bridge | High |
| Get participant names | DOM scraping — 3 strategies | Medium-High |
| Detect active speaker | Computed style polling on tiles | Medium |
| Address by name in responses | System prompt instruction | High |
| Speaker-attributed transcript (primary) | Deepgram diarization + DOM name correlation | High |
| Speaker-attributed transcript (fallback) | DOM poll correlation at transcript flush | Medium |
| Names in session on restart | Passed to `startSession()` on reconnect | High |

### 16.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Google Meet Browser (Playwright page)                          │
│                                                                 │
│  DOM: [data-participant-id] tiles                               │
│       └─ img[alt] / aria-label / text nodes  → names           │
│       └─ border-color / box-shadow           → active speaker  │
│                                                                 │
└──────────────────────┬────────────────────────┬────────────────┘
                       │ page.evaluate()        │ page.evaluate()
                       ▼ every 15s             ▼ every 2s
┌─────────────────────────────────────────────────────────────────┐
│  GoogleMeetDriver                                               │
│  getParticipantNames() → string[]                               │
│  getActiveSpeaker()    → string | null                          │
└──────────────────────┬────────────────────────┬────────────────┘
                       │                        │
                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  BotManager (polling timers)                                    │
│  participantNamePollTimer  — setInterval 15s                    │
│  activeSpeakerPollTimer    — setInterval 2s                     │
│                                                                 │
│  sonic.setParticipantNames(sessionId, names)                    │
│  sonic.setActiveSpeaker(sessionId, speaker)                     │
└──────────────────────┬────────────────────────┬────────────────┘
                       │                        │
                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  SonicSession                                                   │
│  .participantNames: string[]    used in system prompt           │
│  .activeSpeaker: string | null  used for transcript attribution │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Nova Sonic — system prompt includes participant list           │
│  "There are 3 people in this meeting: John, Peter, James"       │
│  → Lira can address them by name in responses                   │
└─────────────────────────────────────────────────────────────────┘
```

### 16.3 Participant Name Scraping

`GoogleMeetDriver.getParticipantNames()` runs inside the browser via `page.evaluate()` using a string-based eval (to avoid TypeScript DOM type requirements in the Node.js process). It applies three strategies in order, deduplicating results:

**Strategy 1 — Participant tiles** (`[data-participant-id]`)

Each tile is checked in order:
- `img[alt]` — Avatar images carry the participant's name as the `alt` attribute. Most reliable.
- `aria-label` — Tile container often has `aria-label="John Smith, microphone off, camera off"`. The name is the first comma-separated segment.
- Text node walker — Iterates text nodes in the tile, taking the first string that looks like a name (2–40 characters, not purely numeric).

The bot's own tile is excluded by checking for a `[data-self-name]` child element.

**Strategy 2 — Sidebar participant list**

If the People panel is open, `[role="list"] [role="listitem"]` elements contain participant names as the first line of their text content.

**Strategy 3 — Hovercard elements**

`[data-hovercard-id]` elements (name chips/badges) are extracted directly.

All detected names are filtered to remove the bot's own name, "You", and common non-name strings ("presentation", "screen sharing", etc.).

### 16.4 Active Speaker Detection

`GoogleMeetDriver.getActiveSpeaker()` queries computed styles of all participant tiles every 2 seconds.

Google Meet highlights the active speaker with a **coloured border** (typically blue, ~`#1a73e8`) or `box-shadow`. The detector:

1. Skips the bot's own tile (`[data-self-name]`).
2. Checks `borderColor`, `outlineColor`, and `boxShadow` via `getComputedStyle()`.
3. Filters out the default dark background borders (`rgb(32, 33, 36)`, `rgb(60, 64, 67)`) and `borderWidth: 0px`.
4. If a non-default border is found on a tile or its immediate child, that tile's participant is the active speaker.
5. Falls back to `[aria-live]` regions — Google Meet sometimes announces `"X is now talking"`.

Once the speaking tile is identified, the name is extracted using the same priority order as Strategy 1 above (img alt → aria-label → text walker).

### 16.5 System Prompt Enrichment

When participant names are known (`participantNames.length > 0`), `buildSystemPrompt()` appends a participant awareness block:

```
Participant awareness:
There are 3 other people in this meeting: John, Peter, James.
You can hear everyone's voice but the audio arrives as a single mixed stream,
so you may not always be able to tell exactly who is speaking.

How to use participant names:
- When you CAN identify who is speaking (from context, their topic, or because
  they introduced themselves), address them by name.
  e.g. "Good point, John." or "Peter, to answer your question…"
- Never guess a name if you're uncertain.
- When giving a summary, attribute contributions to the right people.
```

This is passed as part of the `buildSystemPromptEvents()` → `createInputStreamGenerator()` chain, which means it's embedded in the Nova Sonic session's SYSTEM content block at session start.

On **auto-reconnect** (Sonic session restart after a Bedrock error), `sonic.getParticipantNames(sessionId)` retrieves the current names and passes them to the new `startSession()` call, so the restarted session also has full participant awareness.

### 16.6 Polling Strategy

Three separate timers run from Bot Manager after the bot joins:

| Timer | Interval | Purpose |
|-------|----------|---------|
| `participantPollTimer` | 5 s | Count (for 1-on-1 wake word bypass) |
| `participantNamePollTimer` | 15 s (+ initial 3 s) | Update participant names |
| `activeSpeakerPollTimer` | 2 s | Track who is currently talking |

The name poller runs an initial poll 3 seconds after joining (allowing the DOM to fully render before the first scrape), then every 15 seconds thereafter. Names rarely change mid-meeting, so 15 seconds is sufficient.

The active speaker poller runs every 2 seconds. This is a balance between responsiveness and `page.evaluate()` overhead.

All timers are cleaned up when the bot ends or when `terminateAll()` is called.

### 16.7 Speaker-Attributed Transcripts

When Nova Sonic emits a user speech transcript (`onTextOutput`, `role = 'user'`), Bot Manager resolves the speaker name using a two-tier priority system:

```typescript
// In bot-manager.service.ts — onTextOutput callback
let speakerLabel = isAI ? aiName.toLowerCase() : 'participant';
if (!isAI) {
  // 1st: Deepgram diarization (most accurate — based on actual voice)
  const deepgramSpeaker = diarization.getCurrentSpeakerName(sessionId);
  if (deepgramSpeaker) {
    speakerLabel = deepgramSpeaker; // e.g. "John" — from Deepgram + DOM map
  } else {
    // 2nd: DOM active speaker fallback
    const activeSpeaker = sonic.getActiveSpeaker(sessionId);
    if (activeSpeaker) speakerLabel = activeSpeaker;
  }
}
const msg: Message = {
  id: uuidv4(),
  speaker: speakerLabel, // e.g. "John", "Sarah", or "participant"
  text,
  is_ai: false,
  ...
};
```

The result is a full meeting transcript where every line is attributed to a real person by name. This feeds directly into the meeting summaries, which now include per-person contribution analysis.

### 16.8 Accuracy & Limitations

See **Section 15.7** for current characteristics. In summary:

- Name detection via `img[alt]` and `aria-label` is **reliable** for meetings where Google renders participant tiles (2+ participants).
- Active speaker detection (DOM) is **medium reliability** — works well for turn-taking conversations.
- Deepgram diarization is **high reliability** for normal meeting speech — see Section 17 for full details.
- System prompt enrichment is **highly effective** once names are known from the DOM.

---

## 17. Deepgram Speaker Diarization

Deepgram is a pay-per-use speech AI platform. Lira uses Deepgram's **Nova-2 streaming model** specifically for speaker diarization — determining which distinct voice corresponds to which utterance in the mixed meeting audio.

### 17.1 Why Deepgram?

Nova Sonic receives the meeting as a single mixed PCM stream (all participants combined). This means Nova Sonic itself cannot tell who is speaking — it just hears voices. Deepgram solves this by analysing voice characteristics in the stream and labelling each word with a speaker index.

Compared to alternatives:
- **AWS Transcribe**: Also supports diarization but higher latency and cost (~$1.44/hr vs $0.35/hr for Deepgram).
- **AssemblyAI**: Similar quality but slightly more expensive and no performance advantage for this use case.
- **Deepgram Nova-2**: Best balance of latency, accuracy, and cost for real-time meeting diarization. Pay-as-you-go, ~$0.0059/min.

### 17.2 How It Works

The Deepgram integration runs in **parallel with Nova Sonic** — the same captured audio bytes are sent to both:

```
Meeting audio (16 kHz Int16 PCM)
          │
          ├──────────────────────────────► Nova Sonic (Bedrock)
          │                                 Speech → AI response
          │
          └──────────────────────────────► Deepgram (WebSocket)
                                            Speech → speaker-labeled transcript
```

Deepgram returns events like:
```json
{
  "type": "Results",
  "is_final": true,
  "channel": {
    "alternatives": [{
      "transcript": "I think we should go with option B",
      "words": [
        { "word": "I",     "speaker": 0, "start": 0.1 },
        { "word": "think", "speaker": 0, "start": 0.4 },
        ...
      ]
    }]
  }
}
```

The `speaker` field gives the speaker index (0, 1, 2, …). The **correlation layer** then maps these indices to real names.

### 17.3 Speaker Index → Real Name Correlation

Deepgram gives us `Speaker 0`, `Speaker 1`, etc. — not real names. The correlation works like this:

1. Deepgram fires: "Speaker 0 is talking" at time T
2. DOM polling (every 2s) fires: "John is the active speaker" at time T±2s
3. Within the 4-second correlation window: `Speaker 0 → John` is mapped
4. This mapping persists for the entire session

```typescript
// In bot-manager.service.ts — active speaker poll
const speaker = await meetingBot.getActiveSpeaker();
sonic.setActiveSpeaker(sessionId, speaker);
if (speaker) {
  diarization.correlateNameWithSpeaker(sessionId, speaker);
  // If Deepgram recently saw "Speaker 0" → maps Speaker 0 → speaker name
}
```

Once mapped, every future Deepgram utterance from Speaker 0 resolves to "John" automatically via `getCurrentSpeakerName(sessionId)`.

### 17.4 Deepgram API Configuration

```
WebSocket URL: wss://api.deepgram.com/v1/listen
Parameters:
  model=nova-2
  language=en
  diarize=true
  smart_format=true
  encoding=linear16
  sample_rate=16000
  channels=1
  interim_results=true
  utterance_end_ms=1000
  punctuate=true
Auth: Authorization: Token ${DEEPGRAM_API_KEY}
```

### 17.5 Service Architecture

`deepgram-diarization.service.ts` manages all Deepgram sessions:

| Function | Purpose |
|---|---|
| `startDiarization(sessionId, onUtterance?)` | Opens Deepgram WebSocket for a meeting session |
| `sendAudio(sessionId, pcmChunk)` | Streams audio bytes to Deepgram |
| `correlateNameWithSpeaker(sessionId, domName)` | Links DOM-scraped name to current Deepgram speaker index |
| `getCurrentSpeakerName(sessionId)` | Returns real name of current speaker (e.g. `"John"`) |
| `getSpeakerMap(sessionId)` | Returns full `Map<speakerIndex, name>` for the session |
| `endDiarization(sessionId)` | Sends CloseStream, closes WebSocket, logs final speaker map |

### 17.6 Graceful Degradation

If `DEEPGRAM_API_KEY` is not set, `startDiarization()` logs a warning and returns immediately. The bot continues to work normally — speaker attribution falls back to DOM-only polling. No errors are thrown.

If the Deepgram WebSocket disconnects mid-meeting, the service marks the session inactive. Subsequent `sendAudio()` and `getCurrentSpeakerName()` calls silently no-op. The DOM fallback takes over.

### 17.7 Impact on Meeting Summaries

Because transcripts now contain real speaker names, the summary prompt (in `lira-ai.service.ts`) has been updated to take full advantage:

- **Short summaries** include a "standout contributor" callout naming the person who drove the conversation most.
- **Long summaries** include an **Individual Contributions** section — 1-3 sentences per named participant describing what they specifically brought to the meeting.
- Lira's own contributions are described explicitly (e.g. "Lira recommended restructuring the onboarding flow and the team aligned with her suggestion").
- If only generic "participant" labels are available (Deepgram not configured), the summary gracefully refers to "the team" without inventing names.

**Example short summary output** (with diarization active):
> In a 25-minute product strategy meeting, **John**, **Sarah**, and **Lira** (AI) discussed the Q2 roadmap prioritisation. **John** proposed deprioritising the mobile feature to focus on API stability, while **Sarah** pushed back citing customer demand data. **Lira** recommended a phased approach — ship a lightweight mobile release first, then the API work — which the group aligned on. **John** was the most vocal driver of the final decision. Next steps: John to draft the revised roadmap by Friday.

**Example long summary — Individual Contributions section**:
> **John** led much of the discussion, proposing the initial prioritisation framework and ultimately driving the group toward the phased decision. His input was decisive and backed by technical context. **Sarah** provided a strong counterpoint with customer data, challenging the initial framing effectively. **Lira** synthesised the two positions and offered the bridging recommendation that resolved the disagreement — her contribution was pivotal in reaching a conclusion.

---

*Built by the Creovine Labs team. Powered by Amazon Nova Sonic on AWS Bedrock, OpenAI GPT-4o-mini, and Deepgram Nova-2.*

---

## 18. Organization Context System

> **Full implementation specification v2.0 — March 2026. Status: Shipped.**

Lira AI now supports a full **Organization Context System** that makes Lira context-aware for every team it serves. Instead of joining meetings as a knowledgeable stranger, Lira can now know a company's products, terminology, culture, and ongoing projects — and answer questions grounded in that knowledge.

---

### 18.1 Overview & Problem Statement

Before this system, Lira joined meetings as a smart stranger. It had personality, it could listen and respond, it could generate summaries — but it knew nothing about the company it was serving. It didn't know the company's products, terminology, culture, org structure, or ongoing projects. This limited its value from "impressive demo" to "indispensable team member."

**Solution:** A complete Organization Context System that:

1. Allows users to create or join an **Organization** (company / team / workspace)
2. Captures structured context about the organization (industry, products, terminology, culture)
3. Crawls the organization's website and extracts summarized knowledge
4. Accepts uploaded documents (PDFs, DOCX, TXT, Notion exports) and indexes them using a RAG pipeline
5. Stores document embeddings in a vector database for semantic retrieval
6. Injects the right context into Lira's system prompt per-meeting, per-organization
7. Enables Lira to capture and manage tasks during and after meetings (action items, follow-ups)

**Design Principles:**
- **Implement everything now, gate later.** Every feature is fully built and testable. Plan-based gating is a frontend/API concern, not an architecture concern.
- **Context is per-session.** Lira never holds multiple organizations in memory. Each Nova Sonic session receives exactly one organization's context. Zero cross-contamination.
- **Storage-efficient by design.** Raw documents stored in S3, summaries and embeddings in purpose-built stores. No raw HTML or full-text in DynamoDB.
- **Graceful degradation.** If the knowledge base is empty, Lira still works with just the organization profile. If no organization exists, Lira works exactly as it does today.

---

### 18.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Org Onboarding │  │  Knowledge Base  │  │  Document Upload │  │
│  │  Create / Join  │  │  Management UI   │  │  & Status UI     │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ REST API
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend (Fastify)                               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Org      │  │  Knowledge   │  │  Document     │  │  Context  │ │
│  │  Service  │  │  Base Service│  │  Processing   │  │  Builder  │ │
│  │  (CRUD)   │  │  (Crawl+Sum) │  │  (Parse+RAG)  │  │  Service  │ │
│  └──────────┘  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Task     │  │  Embedding   │  │  Vector      │  │  Webhook  │ │
│  │  Engine   │  │  Service     │  │  Search Svc  │  │  Service  │ │
│  └──────────┘  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                     Storage Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  DynamoDB     │  │  S3           │  │  Qdrant (self-hosted)   │ │
│  │  (Orgs, KB,   │  │  (Documents,  │  │  OR Pinecone Free Tier  │ │
│  │   Tasks,      │  │   Audio,      │  │  (Vector embeddings     │ │
│  │   Memberships)│  │   Crawl data) │  │   for RAG retrieval)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Component Responsibilities

| Component | Responsibility |
|---|---|
| **Org Service** | CRUD for organizations, membership, invite codes, profile management |
| **Knowledge Base Service** | Website crawling, page summarization, keyword extraction, scheduled re-crawls |
| **Document Processing Service** | File upload to S3, text extraction (PDF/DOCX/TXT), chunking, embedding generation |
| **Embedding Service** | OpenAI `text-embedding-3-small` for vector generation (1536 dimensions) |
| **Vector Search Service** | Qdrant (self-hosted) or Pinecone for storing/querying embeddings |
| **Context Builder Service** | Assembles the final context payload from org profile + relevant KB + RAG chunks |
| **Task Engine** | Manages action items, follow-ups, and task execution during/after meetings |
| **Webhook Service** | Outbound notifications (Slack, email) for task updates and meeting summaries |

---

### 18.3 Data Models

#### Organization Profile (DynamoDB — `lira-organizations` table)

```typescript
interface OrganizationProfile {
  PK: `ORG#${string}`       // "ORG#<orgId>"
  SK: 'PROFILE'
  orgId: string             // UUID v4
  name: string              // "AB Company"
  slug: string              // "ab-company" (URL-friendly, unique)
  inviteCode: string        // "LRA-X7K2" (regeneratable)

  // Core context fields
  industry: string
  description: string       // max 2000 chars
  mission?: string          // max 500 chars
  products: ProductEntry[]
  terminology: TermEntry[]  // domain-specific terms + definitions
  competitors?: string[]
  teamSize?: string
  culture: OrganizationCulture

  // External links
  websiteUrl?: string
  additionalUrls?: string[]

  // Knowledge base status
  websiteCrawlStatus?: 'pending' | 'crawling' | 'completed' | 'failed'
  websiteCrawlPageCount?: number
  documentCount?: number
  embeddingCount?: number

  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  createdBy: string
  createdAt: string
  updatedAt: string
}
```

#### Knowledge Base Entry (from website crawl)

```typescript
interface KnowledgeBaseEntry {
  PK: `ORG#${string}`
  SK: `KB#${string}`
  sourceUrl: string
  title: string
  summary: string          // AI-generated 200-400 word digest
  keywords: string[]
  social_links?: Record<string, string>  // { twitter, linkedin, github, ... }
  crawledAt: string
  summaryModel: string     // "gpt-4o-mini"
  tokenCount: number
}
```

#### Document Record (uploaded files)

```typescript
interface DocumentRecord {
  PK: `ORG#${string}`
  SK: `DOC#${string}`
  docId: string
  fileName: string
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'xlsx'
  s3Key: string
  status: 'uploaded' | 'processing' | 'indexed' | 'failed'
  chunkCount?: number
  embeddingCount?: number
  summary?: string
  uploadedBy: string
  uploadedAt: string
}
```

#### Task Record

```typescript
interface TaskRecord {
  PK: `ORG#${string}`
  SK: `TASK#${string}`
  taskId: string
  meetingSessionId?: string   // linked meeting
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  assignedBy: 'lira' | string
  dueDate?: string
  sourceType: 'meeting_transcript' | 'manual' | 'follow_up'
  sourceQuote?: string        // relevant transcript snippet
  taskType: 'action_item' | 'draft_document' | 'research' | 'follow_up_email' | 'summary' | 'custom'
  createdAt: string
  updatedAt: string
}
```

#### S3 Bucket Structure

```
lira-organization-data/
└── orgs/
    └── <orgId>/
        ├── documents/<docId>/original.<ext>
        ├── documents/<docId>/extracted.txt
        ├── crawl/<pageId>/raw.txt
        └── tasks/<taskId>/output.<ext>
```

#### Vector Store — Qdrant (Self-Hosted)

Qdrant runs as a Docker container on the same EC2 instance as the backend — zero additional cost. Collection: `lira-org-embeddings`, 1536-dimensional Cosine vectors (`text-embedding-3-small`). Each vector point carries payload: `orgId`, `sourceType` (`document` | `website`), `sourceId`, `chunkIndex`, `text`, `keywords`.

Alternative: **Pinecone Free Tier** (1 pod, 5M vectors) for early production or teams that prefer managed infrastructure.

---

### 18.4 Phase 1 — Organization CRUD & Membership

**API routes:** `POST /api/orgs`, `GET /api/orgs`, `GET /api/orgs/:orgId`, `PATCH /api/orgs/:orgId`, `DELETE /api/orgs/:orgId`, `POST /api/orgs/join`, `GET /api/orgs/:orgId/members`, `POST /api/orgs/:orgId/invite`, `DELETE /api/orgs/:orgId/members/:userId`

**Key behaviors:**
- Creating an org auto-generates a unique `slug` and a 6-char alphanumeric `inviteCode` (`LRA-XXXX`)
- Joining via invite code assigns the user as `member` role
- Roles: `owner` > `admin` > `member` — only owners/admins can modify org settings
- Invite codes are regeneratable by owners at any time
- Dual-write pattern: org profile stored at `ORG#<orgId>/PROFILE` and reverse lookup at `USER#<userId>/ORG#<orgId>`

---

### 18.5 Phase 2 — Organization Profile & Context Injection

The **Context Builder Service** (`lira-context-builder.service.ts`) assembles a structured context block for injection into Nova Sonic's system prompt:

```
=== ORGANIZATION CONTEXT ===
Organization: {name} | Industry: {industry} | Size: {teamSize}

Description:
{description}

Mission:
{mission}

Key Products/Services:
• {product.name}: {product.description}

Important Terminology:
• {term.term}: {term.definition}

Culture: {style} communication, {meetingStyle} meetings
Values: {values.join(', ')}

=== KNOWLEDGE BASE HIGHLIGHTS ===
{top 3 KB summaries, most relevant to meeting topic}

=== RELEVANT DOCUMENTS ===
{top 3-5 RAG chunks from uploaded documents}
```

The assembled context is injected into Nova Sonic's `systemPrompt` field at session start. Token budget is strictly managed — org profile ≤ 800 tokens, KB highlights ≤ 1200 tokens, RAG chunks ≤ 1500 tokens.

Context is also injected into the OpenAI GPT-4o-mini system prompt for meeting summary generation.

---

### 18.6 Phase 3 — Website Crawl & Knowledge Base

The **lira-crawl.service.ts** crawls up to 10 pages per org (depth ≤ 2) using `crawlee` with Cheerio for static pages. For each page:

1. Clean HTML → extract text (strip nav/footer/boilerplate)
2. GPT-4o-mini summarizes to a 200-400 word digest
3. Extract keywords (product names, industry terms)
4. Extract social links (`extractSocialLinks()` → LinkedIn, Twitter/X, GitHub, Facebook, Instagram, YouTube)
5. Store as `KnowledgeBaseEntry` in DynamoDB
6. Optionally store raw text in S3

Crawls are triggered on-demand (user action) or via a nightly SQS job. Status progression: `pending` → `crawling` → `completed` / `failed`. Social links are surfaced in the Knowledge Base UI.

---

### 18.7 Phase 4 — Document Upload, Parsing & RAG Pipeline

Document processing pipeline:

```
User uploads file
       ↓
Multipart upload → S3 (original file preserved)
       ↓
Text extraction:
  PDF  → pdf-parse (page-by-page, preserves structure)
  DOCX → mammoth (converts to clean text)
  TXT/MD → direct read
       ↓
Chunking: 512-token sliding window, 50-token overlap
(sentence-boundary-aware chunking)
       ↓
OpenAI text-embedding-3-small → 1536-dim vector per chunk
       ↓
Upsert to Qdrant with orgId payload filter
       ↓
Update DocumentRecord status → 'indexed'
```

Supported file types: PDF, DOCX, TXT, MD, CSV, XLSX. Max file size: 50 MB. All processing is async — document status polling endpoint `GET /api/orgs/:orgId/documents/:docId/status`.

---

### 18.8 Phase 5 — Vector Search & Semantic Retrieval

**Hybrid retrieval strategy:**

1. **Dense semantic search** — embed the meeting topic/transcript snippet → kNN query on Qdrant filtered by `orgId`
2. **Keyword sparse search** — BM25-style match against stored `keywords` arrays in DynamoDB KB entries
3. **Score fusion** — weight 70% dense + 30% sparse → return top-5 chunks

Each session receives at most 5 document chunks (≤ 1500 tokens) and 3 KB entries (≤ 1200 tokens). Freshness weighting optionally boosts recently updated entries.

---

### 18.9 Phase 6 — Context Injection into Nova Sonic

Context injection happens at `startSession()` in `lira-ai.service.ts`:

```typescript
const ctx = await contextBuilder.build(sessionId, orgId, {
  meetingTopic: options.meetingTopic,
  transcript: recentTranscriptSnippet,   // last ~500 tokens for relevance scoring
  maxTotalTokens: 3500,
})

const systemPrompt = buildSystemPrompt(options) + '\n\n' + ctx.contextBlock
```

Context is assembled once per session (not per turn) to avoid re-billing embeddings on every utterance. If `orgId` is not provided, `ctx.contextBlock` returns an empty string and Lira behaves exactly as before.

**Token budget enforcement:**

| Layer | Max tokens |
|---|---|
| Org profile | 800 |
| KB highlights (website) | 1200 |
| RAG document chunks | 1500 |
| **Total added context** | **≤ 3500** |

---

### 18.10 Phase 7 — Task Execution Engine

#### Real-time Task Capture in Meetings

The WebSocket handler (`lira-ws.routes.ts`) scans every transcript utterance for task-intent phrases using 15+ regex patterns:

```
"action item", "assign", "follow up", "task for", "make sure",
"don't forget", "remember to", "someone should", "we need to",
"by [day]", "before [date]", "can you"
```

When detected:
1. GPT-4o-mini extracts: `title`, `assignedTo`, `dueDate`, `priority`, `taskType`, `sourceQuote`
2. `TaskRecord` written to DynamoDB under the org
3. `task_created` WebSocket event broadcast to the meeting session
4. Frontend shows a floating toast notification: *"✓ Task added: Send Q4 report"*

#### Task Routes

`GET /api/orgs/:orgId/tasks` — list tasks (filterable by `?status=pending`, `?assigned_to=`, `?priority=`)
`POST /api/orgs/:orgId/tasks` — create task manually
`PATCH /api/orgs/:orgId/tasks/:taskId` — update status, assignee, due date
`DELETE /api/orgs/:orgId/tasks/:taskId` — delete task

---

### 18.11 Phase 8 — Frontend Implementation

#### New Pages

| Page | Route | Description |
|---|---|---|
| **OrganizationsPage** | `/organizations` | List all orgs, switch active org |
| **OnboardingPage** | `/onboarding` | Create org (with AI-assisted description from URL) or join via invite code |
| **OrgSettingsPage** | `/org/settings` | Edit profile, industry, products, terminology, culture |
| **KnowledgeBasePage** | `/org/knowledge` | Trigger crawl, view crawled pages, social links, upload documents |
| **DocumentsPage** | `/org/documents` | Document list with processing status, embeddings count |
| **TasksPage** | `/org/tasks` | Task board with filters, manual creation, status updates |
| **OrgMembersPage** | `/org/members` | Member list, invite new members, manage roles |
| **WebhooksPage** | `/org/webhooks` | Configure outbound webhook URL and event subscriptions |

#### OrgLayout

All org pages share an `OrgLayout` component that provides:
- Left sidebar navigation with org-context links
- Org switcher dropdown (top-left)
- **Notification bell** (top-right) — violet badge showing unread pending task count, auto-refreshes every 60 seconds, click opens a dropdown of recent pending tasks with click-through to the task detail

#### Meeting Integration

- **BotDeployPanel** — org picker dropdown to link a Google Meet/Zoom bot deployment to an org
- **MeetingPage** — org picker before starting a browser-based audio meeting; task toast notification when Lira captures a task during the meeting
- **MeetingsPage** — org filter dropdown, checkboxes for bulk delete, org name badge on each meeting card

#### State Management

New `useOrgStore` Zustand store:
```typescript
interface OrgStore {
  organizations: Organization[]
  currentOrgId: string | null
  setOrganizations: (orgs: Organization[]) => void
  setCurrentOrg: (orgId: string) => void
}
```
Persisted to `localStorage` via `zustand/middleware` `persist`.

---

### 18.12 Phase 9 — Testing, Observability & Hardening

#### Unit Tests (`tests/unit/`)

| Test file | What it covers |
|---|---|
| `lira-org.test.ts` | Org CRUD operations, invite code generation, membership role enforcement |
| `lira-context-builder.test.ts` | Token budget enforcement, graceful empty-KB behavior, prompt assembly |
| `lira-crawl-chunk.test.ts` | Chunking, sentence-boundary splitting, overlap handling |
| `lira-document.test.ts` | PDF/DOCX text extraction, chunk count validation |
| `lira-task.test.ts` | Task intent detection (true positives + false negatives), extraction accuracy |

#### Observability

- Every context build logs: `orgId`, token counts per layer, cache hit/miss, latency
- Task capture logs: utterance, matched pattern, extracted fields, DynamoDB write latency
- Crawl service logs: pages crawled, summaries generated, errors per URL, total duration
- All logs structured JSON via `winston` to CloudWatch Logs

---

### 18.13 API Reference

#### Organization Routes (`/api/orgs`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/orgs` | Create organization |
| `GET` | `/api/orgs` | List user's organizations |
| `GET` | `/api/orgs/:orgId` | Get org profile |
| `PATCH` | `/api/orgs/:orgId` | Update org profile |
| `DELETE` | `/api/orgs/:orgId` | Delete org (owner only) |
| `POST` | `/api/orgs/join` | Join via invite code |
| `POST` | `/api/orgs/:orgId/invite` | Generate/regenerate invite code |
| `GET` | `/api/orgs/:orgId/members` | List members |
| `DELETE` | `/api/orgs/:orgId/members/:userId` | Remove member |

#### Knowledge Base Routes (`/api/orgs/:orgId/kb`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/orgs/:orgId/kb/crawl` | Trigger website crawl |
| `GET` | `/api/orgs/:orgId/kb` | List KB entries |
| `DELETE` | `/api/orgs/:orgId/kb/:pageId` | Delete KB entry |

#### Document Routes (`/api/orgs/:orgId/documents`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/orgs/:orgId/documents` | Upload document (multipart) |
| `GET` | `/api/orgs/:orgId/documents` | List documents |
| `GET` | `/api/orgs/:orgId/documents/:docId/status` | Poll processing status |
| `DELETE` | `/api/orgs/:orgId/documents/:docId` | Delete document + embeddings |

#### Task Routes (`/api/orgs/:orgId/tasks`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/orgs/:orgId/tasks` | Create task |
| `GET` | `/api/orgs/:orgId/tasks` | List tasks (filterable) |
| `PATCH` | `/api/orgs/:orgId/tasks/:taskId` | Update task |
| `DELETE` | `/api/orgs/:orgId/tasks/:taskId` | Delete task |

---

### 18.14 Pricing Tiers & Feature Matrix

All features are fully implemented in the codebase. The tier matrix below reflects what is *gated* at the API/UI level:

| Feature | Free | Basic | Pro | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Organizations | 1 | 1 | 5 | Unlimited |
| Members per org | 3 | 10 | 50 | Unlimited |
| Website crawl pages | 5 | 20 | 100 | Unlimited |
| Uploaded documents | 3 | 25 | 200 | Unlimited |
| RAG retrieval in meetings | ✗ | ✓ | ✓ | ✓ |
| Task engine | ✓ | ✓ | ✓ | ✓ |
| AI task execution | ✗ | ✗ | ✓ | ✓ |
| Webhook notifications | ✗ | ✓ | ✓ | ✓ |
| Custom AI personality | ✗ | ✗ | ✓ | ✓ |

---

### 18.15 Security & Data Isolation

- **org_id on every DynamoDB query** — all reads/writes are partition-key scoped to `ORG#<orgId>`. Cross-org data leakage is structurally impossible at the DB layer.
- **Membership verification** — every org API route resolves the caller's `userId` from the JWT and verifies an active `OrgMembership` record before any operation.
- **S3 key isolation** — all object keys are prefixed with `orgs/<orgId>/`. IAM policy restricts access to `lira-organization-data/orgs/${orgId}/*`.
- **Qdrant payload filter** — every vector query includes `must: [{ key: 'orgId', match: { value: orgId } }]` — embeddings from one org are never retrievable by another.
- **Invite codes are ephemeral** — codes can be regenerated at any time by the org owner, immediately invalidating all outstanding invitations.
- **No raw PII in embeddings** — document chunks are plain text excerpts. Embeddings are mathematical representations; they cannot be reversed to reconstruct the original text.

---

### 18.16 Infrastructure & AWS Resources

| Resource | Purpose | Notes |
|---|---|---|
| DynamoDB `lira-organizations` | Orgs, KB entries, documents, memberships, tasks | GSI on `userId` for reverse lookup |
| S3 `lira-organization-data` | Raw documents, extracted text, crawl backups | Lifecycle: move to Glacier after 90 days |
| Qdrant (Docker on EC2) | Vector embeddings for RAG | Free, zero additional cost |
| SQS `lira-async-jobs` | Async crawl and document processing queue | FIFO, dead-letter queue configured |
| OpenAI API | `text-embedding-3-small` (embeddings) + `gpt-4o-mini` (summaries, task extraction) | — |

#### IAM Policy (abbreviated)

```json
{
  "Effect": "Allow",
  "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:UpdateItem"],
  "Resource": "arn:aws:dynamodb:*:*:table/lira-organizations*"
},
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
  "Resource": ["arn:aws:s3:::lira-organization-data", "arn:aws:s3:::lira-organization-data/*"]
}
```

---

### 18.17 Migration Strategy & Backward Compatibility

- **No existing data migration required** — this is a fully additive feature. All existing meetings, users, and API endpoints work unchanged.
- **Bot deployment without `org_id`** works exactly as before — `buildSystemPrompt()` without `organizationContext` produces identical output.
- **Existing meetings** remain unlinked to any organization. Once an org is created, new meetings auto-link if deployed with `org_id`.
- **On first login after launch**, users without an org see an onboarding prompt: "Set up your Organization" (skippable — app fully works without one).

#### Implementation Order

| Phase | Name | Key Deliverables |
|---|---|---|
| 1 | Organization CRUD & Membership | Org service, routes, models, invite codes |
| 2 | Organization Profile & Context Injection | Profile fields, context builder, modified system prompt |
| 3 | Website Crawl & Knowledge Base | Crawler, summarizer, KB storage, async processing |
| 4 | Document Upload, Parsing & RAG | S3 upload, text extraction, chunking, embeddings |
| 5 | Vector Search & Semantic Retrieval | Qdrant setup, kNN search, hybrid retrieval |
| 6 | Context Injection into Nova Sonic | Full context assembly, token management |
| 7 | Task Execution Engine | Task detection, AI extraction, WebSocket broadcast |
| 8 | Frontend Implementation | All new pages, OrgLayout, notification bell |
| 7 | Task Execution Engine | Task detection, AI extraction, WebSocket broadcast |
| 8 | Frontend Implementation | All new pages, OrgLayout, notification bell |
| 9 | Testing, Observability & Hardening | Unit tests, structured logging, error handling |

Each phase is independently shippable. The system degrades gracefully — missing phases simply mean less context available to Lira.

---

## 19. Email Integration — Resend + Inbound Reply Engine

### 19.1 Overview

Lira's email integration turns post-meeting notifications into two-way conversations. Every outgoing email (meeting summary, task assignment, meeting invite) includes a unique JWT-encoded `Reply-To` address. When a recipient replies, AWS SES captures the message and routes it through an AI reply engine that reads the reply in context, queries the org's knowledge base, and either responds directly or escalates to an admin.

**Key capabilities:**
- **Outbound email** via Resend — summaries, task assignments, meeting invites
- **Platform sending domain** (`lira@liraintelligence.com`) — zero configuration, works on account creation
- **Custom org domain** — org admins can self-configure a custom sending domain via the Resend domain management API (e.g. `lira@truthvote.com`)
- **Inbound reply engine** — GPT-4o-mini reads replies with full org context and either responds or escalates
- **Thread storage** — every back-and-forth conversation is stored in DynamoDB
- **Unsubscribe support** — Resend Audiences ensure CAN-SPAM / GDPR compliance from day one

### 19.2 Two Sending Modes (Platform vs Custom Domain)

Every organisation independently chooses their sending mode. Both modes are available to all orgs — no pricing tier gates either option.

**Mode A — Platform Domain (default, zero-config):**
- Emails sent as: `Lira · <Org Name> <lira@liraintelligence.com>`
- No setup required. Works immediately after account creation.

**Mode B — Custom Org Domain (self-serve):**
- Emails sent as: `Lira <lira@yourcompany.com>`
- Org admin enters their domain in Settings → Email → Use custom domain
- Lira calls the Resend domain API → retrieves DNS records → displays them in the settings UI with copy-to-clipboard
- Once the org adds the DNS records, Lira polls for verification and activates custom mode

**Reply-To (all modes):**
- `Reply-To: reply+<jwt>@liraintelligence.com`
- JWT encodes: `{ orgId, memberId, contextType, contextId, threadId, exp }`
- `exp` is 30 days. Each reply from Lira carries a fresh token for the next turn.

**Per-org `EMAIL_CONFIG` record (DynamoDB: `ORG#<orgId> | EMAIL_CONFIG`):**

```ts
{
  mode: 'platform' | 'custom',
  custom_domain?: string,
  resend_domain_id?: string,
  domain_verified: boolean,
  dns_records?: DnsRecord[],
  from_name?: string,
  email_notifications_enabled: boolean,
  ai_reply_enabled: boolean,           // enable/disable the inbound AI reply engine per org
  notify_on: string[],                 // ["task_created", "meeting_ended", "summary_ready", ...]
  updated_at: string,
}
```

### 19.3 Email Types

| Type | Trigger | Recipients |
|---|---|---|
| **Meeting Summary** | Meeting ends → summary generated | All meeting participants matched by email + org admins if configured |
| **Task Assignment** | Task extracted and assigned to a member | Assigned member |
| **Meeting Invite** | Scheduled meeting created | Listed participants |
| **Weekly Digest** *(planned)* | Cron (Monday 9 AM) | All org members |

**Example Meeting Summary email:**
```
Subject: Meeting Summary — "Sprint Planning" (May 20, 2025)

Hi team,

Here's the summary from today's meeting:

[Short summary paragraph]

Action Items:
• Task title — assigned to Alice — due May 25
• Task title — assigned to Bob — due May 27

Decisions Made:
• Decision 1

Full transcript and details: [link to Lira meeting page]

— Lira AI · Creovine Labs
```

### 19.4 Inbound Reply Engine

When a recipient replies to any Lira email, the message is routed through:

```
1. Recipient hits "Reply" in their email client
2. Message delivered to reply+<jwt>@liraintelligence.com
3. AWS SES receipt rule: match reply+* → store raw MIME email to S3 (lira-inbound-email)
                                        → publish notification to SNS topic
4. SNS → POST /lira/v1/email/inbound (Fastify)
5. Fastify handler:
   a. Validates SNS message signature (HTTPS certificate fetch)
   b. Validates TopicArn matches LIRA_INBOUND_EMAIL_SNS_ARN
   c. Fetches raw email from S3 (messageId from SES notification)
   d. Parses MIME via mailparser, strips quoted reply text
   e. Decodes JWT from the recipient address (reply+<jwt>@...)
   f. Loads thread history from DynamoDB (EMAIL_THREAD#<threadId>)
   g. Fetches meeting/task context
   h. Runs Qdrant vector search on the inbound message body
   i. Calls GPT-4o-mini for reply/escalate decision
   j. If "reply": sends response via Resend with new reply token in Reply-To,
      appends both messages to thread
   k. If "escalate": sends canned reply to sender + notifies org admin +
      forwards full thread, marks thread status: "escalated"
```

**GPT-4o-mini decision prompt (summary):**
The model receives the full thread history, original email context, relevant org knowledge from Qdrant, and the inbound message. It outputs `{ action: "reply" | "escalate", draft?: string }`. It is explicitly instructed never to fabricate org-specific information.

**Thread storage (DynamoDB: `ORG#<orgId> | EMAIL_THREAD#<threadId>`):**

```ts
{
  threadId: string,
  orgId: string,
  memberId: string,
  contextType: string,          // "meeting_summary" | "task_assignment" | "meeting_invite"
  contextId: string,
  subject?: string,
  recipient?: string,
  messages: Array<{
    role: 'lira' | 'member',
    body: string,
    timestamp: string,
  }>,
  status: 'open' | 'escalated' | 'closed',
  created_at: string,
  updated_at: string,
}
```

### 19.5 Architecture & Data Models

**Backend services:**
- `lira-email.service.ts` — Resend wrapper, email config CRUD, reply token generation/verification, thread storage
- `lira-email-reply.service.ts` — SNS signature verification, MIME parsing, GPT-4o-mini reply engine, escalation flow

**DynamoDB records added (in `lira-organizations` table):**

| SK | Purpose |
|---|---|
| `EMAIL_CONFIG` | Per-org sending mode, domain config, notification preferences, AI reply toggle |
| `EMAIL_THREAD#<threadId>` | Full inbound/outbound thread history per recipient per context |

### 19.6 API Reference

All routes mounted at `/lira/v1/email`. JWT auth required except `/inbound`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/inbound` | SNS signature | Inbound email webhook. Receives SNS notification, fetches MIME from S3, runs reply engine. |
| `GET` | `/config?orgId=<id>` | JWT | Get org email config (`EMAIL_CONFIG` record). Returns platform defaults if not yet configured. |
| `PUT` | `/config?orgId=<id>` | JWT | Update org email config (notification prefs, AI reply toggle, from name). |
| `POST` | `/domain?orgId=<id>` | JWT | Register custom sending domain via Resend. Returns DNS records to display in UI. |
| `GET` | `/domain/status?orgId=<id>` | JWT | Poll Resend for domain verification status. Activates custom mode on success. |
| `GET` | `/threads?orgId=<id>` | JWT | List email threads for an org (for the inbox UI). |
| `GET` | `/threads/:threadId?orgId=<id>` | JWT | Get a single thread with full message history. |

### 19.7 Frontend — Email Settings UI

**Route:** `/org/email` → `OrgEmailPage.tsx`

The email settings page has three sections:

1. **Sending Mode** — toggle between platform default and custom domain
   - Platform mode: shows `lira@liraintelligence.com`, no config needed
   - Custom domain: text input for domain → triggers `POST /email/domain` → shows DNS records table with copy buttons → live verification status badge → retry button

2. **Notification Preferences** — per-event toggles:
   - Task Created, Task Completed, Meeting Ended, Summary Ready
   - Master email notifications on/off toggle
   - AI reply engine on/off toggle

3. **Inbox / Threads** — lists recent email threads with status badges (open/escalated/closed). Clicking a thread shows the full conversation history.

---

## 20. AI-Conducted Interviews

### 20.1 Overview & Problem Statement

Screening candidates at scale is time-consuming, inconsistent, and expensive. Even with structured interview guides, human interviewers vary in quality, ask different follow-ups, and score subjectively. Lira solves this by deploying the same bot used in meetings as a **fully autonomous interviewer**.

An org admin creates an interview — defines the job title, description, required skills, candidate details, and evaluation criteria. Lira generates a structured question set (or the admin writes questions manually). When the interview is started (manually or by the scheduler), Lira's bot joins the Google Meet call, conducts the interview, and after the call ends, runs a two-phase AI evaluation pipeline:

1. **Phase 1 (auto)**: Extracts a Q&A summary and interview statistics
2. **Phase 2 (on-demand)**: Generates per-criterion scores, an overall score, hire/no-hire recommendation, strengths, red flags, candidate engagement, and notable quotes

### 20.2 Interview Modes

| Mode | Description |
|---|---|
| **Solo** | Lira conducts the interview alone. No human interviewer in the call. Fully autonomous. |
| **Copilot** | A human interviewer runs the call; Lira coaches them silently with suggested follow-ups displayed on screen. |
| **Shadow** | Lira observes and takes notes but does not speak. Evaluation still runs post-interview. |

### 20.3 How It Works — End-to-End Flow

```
1. Admin creates interview record (POST /orgs/:orgId/interviews)
   → title, job description, candidate details, mode, meeting link,
     questions (manual or AI-generated), evaluation criteria, personality

2. (Optional) Upload candidate resume (POST /interviews/:id/resume)
   → pdf-parse extracts text → GPT-4o-mini structures into ResumeData
   → Stored in S3 (lira-documents-storage), parsed data on interview record

3. Start interview (POST /interviews/:id/start)
   → Validates interview.meeting_link is set and status is "draft" or "scheduled"
   → Calls deployBot() with interview-specific system prompt
   → Bot joins Google Meet as the interviewer
   → Interview status: bot_deployed → in_progress

4. Bot conducts interview
   → System prompt includes: job description, required skills, all questions
     in order, candidate name, personality, time limit
   → Lira asks each question in order, listens for the answer, asks intelligent
     follow-ups (if follow_up_enabled on the question)
   → Marks questions as asked/answered in real-time

5. Interview ends (bot leaves or time limit reached)
   → Status: evaluating

6. Phase 1 evaluation (automatic)
   → GPT-4o-mini reads full transcript
   → Extracts: Q&A summary per question (question, candidate_answer, quality,
     duration_seconds), interview statistics (questions asked/answered/skipped,
     duration), non-judgmental interview_summary
   → Stored on interview record

7. Phase 2 evaluation (triggered by admin via "Generate Score" button)
   → GPT-4o-mini scores each evaluation criterion (0–100)
   → Produces: overall_score, recommendation, recommendation_reasoning,
     strengths, red_flags, candidate_engagement, notable_quotes,
     follow_up_questions
   → Stored on interview record → status: completed
   → Re-evaluation allowed up to 3 times per interview

8. Admin reviews evaluation + records decision (hire / no_hire / next_round)
```

### 20.4 Data Model

**DynamoDB: `lira-interviews` table (`PK: ORG#<orgId>`, `SK: INT#<interviewId>`)**

Key fields:

```ts
interface Interview {
  interview_id: string                  // "int-<uuid>"
  org_id: string
  session_id?: string                   // FK → lira-meetings (set when bot deploys)
  parent_interview_id?: string          // Links to first interview in a round chain
  round: number                         // 1 = initial, 2 = first follow-up, etc.
  interview_purpose?: InterviewPurpose  // introduction | technical | behavioral | ...

  // Job details
  title: string
  department?: string
  job_description: string
  required_skills: string[]
  experience_level: 'junior' | 'mid' | 'senior' | 'lead' | 'principal'
  salary_currency?: string              // ISO 4217 (USD, NGN, EUR, etc.)
  salary_min?: number                   // Monthly minimum
  salary_max?: number                   // Monthly maximum

  // Candidate details
  candidate_name: string
  candidate_email: string
  candidate_resume_s3_key?: string      // S3 key for the original PDF
  candidate_resume_parsed?: ResumeData  // Structured: name, experience, skills, education
  resume_parse_failed?: boolean         // Visible indicator if parsing failed

  // Configuration
  mode: 'solo' | 'copilot' | 'shadow'
  meeting_link: string
  scheduled_at?: string                 // ISO 8601 — triggers auto-scheduler
  time_limit_minutes: number            // 30, 45, or 60
  personality: 'supportive' | 'challenger' | 'facilitator' | 'analyst'
  ai_name_override?: string             // Per-interview AI name override
  no_show_timeout_seconds: number       // Default: 600 (10 min) — bot leaves if candidate doesn't join

  // Questions
  questions: InterviewQuestion[]
  question_generation: 'manual' | 'ai_generated' | 'hybrid'

  // Evaluation
  evaluation_criteria: EvaluationCriterion[]
  status: InterviewStatus
  evaluation?: InterviewEvaluation
  re_evaluation_count: number           // Rate-limited: max 3 re-evals
  decision?: 'hire' | 'no_hire' | 'next_round' | 'undecided'
}
```

**`InterviewStatus` lifecycle:**
```
draft → scheduled → bot_deployed → in_progress → evaluating → completed
                                                              → cancelled
```

**`InterviewEvaluation`** (two phases):

- **Phase 1** (auto, always): `qa_summary[]`, `interview_summary`, `interview_duration_minutes`, `questions_asked`, `questions_answered`, `questions_skipped`
- **Phase 2** (on-demand): `overall_score` (0–100), `recommendation`, `recommendation_reasoning`, `strengths[]`, `red_flags[]`, `candidate_engagement`, `notable_quotes[]`, `suggested_follow_up_questions[]`

### 20.5 AI Pipeline — Questions, Evaluation & Scoring

**Question generation (`POST /interviews/generate-questions`):**

Admin provides job description, required skills, experience level, question categories (technical, behavioral, situational, cultural, warm_up), and desired count. GPT-4o-mini generates questions with `source: "ai_generated"`, each tagged with `category`, `skill_target`, `expected_depth` (brief/moderate/detailed), and `follow_up_enabled`.

**Interview system prompt:**

The bot's system prompt for interviews differs significantly from the meeting bot prompt:
- Identity: "You are conducting an interview for the role of [title] at [company]"
- Lists every question in order with depth instructions
- Personality mode applied (supportive = encouraging tone; challenger = rigorous probing)
- Time limit awareness: gracefully wraps up if running long
- No-show handling: if candidate hasn't joined after `no_show_timeout_seconds`, bot leaves and sets `cancellation_reason: "candidate_no_show"`

**Evaluation prompt (Phase 2 summary):**

GPT-4o-mini receives the full Q&A summary from Phase 1, job description, required skills, and evaluation criteria with weights. It must:
1. Score each criterion 0–100 based only on evidence from the transcript
2. Compute weighted `overall_score`
3. Output a `recommendation` with clear `recommendation_reasoning`
4. List specific `strengths` and `red_flags` with transcript evidence
5. Assess `candidate_engagement` (high/moderate/low)
6. Extract verbatim `notable_quotes`
7. Suggest `follow_up_questions` for the next round

Re-evaluation (up to 3×) re-runs Phase 2 only — Phase 1 Q&A summary is preserved.

### 20.6 Interview Scheduler (Auto-Deploy)

`lira-interview-scheduler.service.ts` polls DynamoDB every 30 seconds for interviews whose `scheduled_at` time has arrived and whose status is `scheduled`.

```
Startup: startInterviewScheduler() → sets 30s interval
Every 30s: pollScheduledInterviews()
  → store.listScheduledInterviewsDue(now)
  → for each due interview:
     - Skip if already starting (Set<string> in-memory dedup)
     - Skip if > 15 minutes past scheduled_at (max late start)
     - Skip if no meeting_link
     - Call deployBot() with interview bot config
     - Update interview status: bot_deployed
     - On error: update status: cancelled, reason: bot_error
Shutdown: stopInterviewScheduler() (called on SIGTERM)
```

This means admins can schedule interviews for a future time during interview creation and the bot will start automatically without any manual intervention. The scheduler survives server restarts — on startup, any interviews whose `scheduled_at` is in the past (within the 15-minute window) are still picked up.

### 20.7 Resume Parsing

`POST /orgs/:orgId/interviews/:interviewId/resume` accepts a multipart PDF upload (max 50 MB, enforced by `@fastify/multipart`).

Pipeline:
1. Fastify `@fastify/multipart` reads the file stream
2. `pdf-parse` extracts raw text from the PDF
3. GPT-4o-mini structures the text into `ResumeData`:
   ```ts
   interface ResumeData {
     full_name?: string
     email?: string
     phone?: string
     location?: string
     summary?: string
     experience?: Array<{ company, role, duration, description }>
     education?: Array<{ institution, degree, field, year }>
     skills?: string[]
     certifications?: string[]
     languages?: string[]
   }
   ```
4. Original PDF saved to S3 (`lira-documents-storage/<orgId>/resumes/<interviewId>/<filename>`)
5. `candidate_resume_parsed` stored on the interview record in DynamoDB
6. If PDF parsing fails (scanned image, encrypted), `resume_parse_failed: true` is set as a visible indicator in the UI — the interview can still proceed without parsed data

### 20.8 API Reference

All routes mounted at `/lira/v1/orgs/:orgId/interviews`. JWT auth required on all routes.

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create interview. Requires `admin` role. |
| `GET` | `/` | List interviews for the org. Optionally filter by `status`, `title`. |
| `GET` | `/:interviewId` | Get interview with full question list and evaluation. |
| `PUT` | `/:interviewId` | Update interview (draft or scheduled status only). |
| `DELETE` | `/:interviewId` | Delete interview and all associated data. |
| `POST` | `/:interviewId/start` | Deploy bot to start interview. Sets status `bot_deployed`. |
| `POST` | `/:interviewId/cancel` | Cancel an in-progress or scheduled interview. Body: `{ reason }`. |
| `POST` | `/:interviewId/rejoin` | Re-deploy bot (e.g. bot crashed mid-interview). |
| `POST` | `/:interviewId/resume` | Upload and parse candidate resume PDF. Multipart form-data. |
| `POST` | `/:interviewId/evaluate` | Re-run Phase 2 evaluation (max 3 times). |
| `PUT` | `/:interviewId/decision` | Record hire/no-hire/next_round decision. |
| `POST` | `/generate-questions` | AI question generation from job description + skills. |
| `POST` | `/draft` | AI-assisted full interview draft from minimal details. |

### 20.9 Frontend Pages

**Route: `/org/roles` → `InterviewsPage.tsx`**
- Lists all interviews grouped by job title (role)
- Search by role name
- Delete role group with confirmation dialog

**Route: `/org/roles/:roleSlug` → `InterviewRolePage.tsx`**
- All candidates for a specific role with status badges
- Quick actions: start, cancel, view evaluation

**Route: `/org/roles/new` → `InterviewCreatePage.tsx`**
- Full interview creation form: job details, candidate info, resume upload, configuration, question builder, evaluation criteria weight sliders

**Route: `/org/interviews/:interviewId` → `InterviewDetailPage.tsx`**
- Three-tab view:
  1. **Overview** — job details, candidate info, status timeline
  2. **Transcript & Q&A** — full meeting transcript + Phase 1 Q&A summary (question, answer, quality badge, duration)
  3. **Evaluation** — Phase 2 scores per criterion, overall score ring, recommendation badge, strengths/red flags, notable quotes, suggested follow-up questions
- "Generate Score" button (Phase 2 trigger)
- "Record Decision" button
- "Re-evaluate" button (shows attempts remaining)

**Product Marketing Page: `/products/interviews` → `ProductInterviewsPage.tsx`**
- Public-facing marketing page for Lira AI Interviews
- Four-step how-it-works flow, feature grid, call-to-action

**Product Marketing Page: `/products/sales` → `ProductSalesPage.tsx`**
- Public-facing marketing page for Lira AI Sales Coaching
- Three-step how-it-works, feature grid (real-time transcription, objection handling, battle cards, CRM auto-fill)

---

## 21. Third-Party Integrations

> **9 integration adapters — shipped. Each adapter follows a shared interface (`adapter.interface.ts`) with OAuth connection management, encrypted token storage, and member mapping.**

### 21.1 Overview

Lira connects to the tools your team already uses. Every integration follows a consistent pattern:

1. **OAuth flow** — User clicks "Connect" on the Integrations page → redirected to the provider's consent screen → callback stores encrypted tokens in DynamoDB
2. **Connection management** — Status check, disconnect, token refresh
3. **Member mapping** — Map org members to their accounts on each platform (e.g. "Alice in Lira" = "alice@company.slack.com")
4. **Bidirectional operations** — Read data from the platform, push data back (e.g. post Slack messages, create Linear issues, update calendar events)

All integration credentials (OAuth tokens, API keys) are **encrypted at rest** in DynamoDB using AES-256 before storage. Tokens are never exposed in API responses.

### 21.2 Integration Providers

| Provider | Auth Method | Key Features |
|---|---|---|
| **Linear** | OAuth2 | Issue sync, team listing, member mapping, default team selection |
| **Slack** | OAuth V2 | Channel listing, DMs, message posting, default channel, inbound webhooks. Scopes: `chat:write`, `channels:read`, `groups:read`, `im:write`, `users:read`, `users:read.email`, `team:read` |
| **Microsoft Teams** | Azure AD OAuth | Team/channel listing, message posting, default team/channel, inbound webhooks |
| **Google Calendar** | OAuth2 (dual client) | List/set default calendar, list events, **create events**, **update events** |
| **Google Drive** | OAuth2 (dual client) | List/search files, read file content (Docs, Sheets, raw), create folders, set default folder |
| **Google Sheets** | OAuth2 (via Drive) | Read sheet data from connected spreadsheets |
| **Google Docs** | OAuth2 (via Drive) | Read document content from connected docs |
| **GitHub** | OAuth | Repos, branches, file browsing, file reading, issues, PRs, code search |
| **Greenhouse** | API Key | Candidates, jobs, applications, scorecards — no OAuth, key stored per-connection |
| **HubSpot** | OAuth2 | Contacts, companies, deals, pipelines, owners, notes (create + list) |
| **Salesforce** | OAuth2 + PKCE | Contacts, accounts, opportunities, leads |

### 21.3 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend — IntegrationsPage.tsx                                │
│  ┌───────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌───────┐ │
│  │Linear │ │Slack  │ │Teams │ │Google  │ │GitHub  │ │Greenh.│ │
│  │       │ │       │ │      │ │Cal+Drv │ │        │ │       │ │
│  ├───────┤ ├───────┤ ├──────┤ ├────────┤ ├────────┤ ├───────┤ │
│  │HubSpot│ │Salesf.│ │      │ │        │ │        │ │       │ │
│  └───┬───┘ └───┬───┘ └──┬───┘ └───┬────┘ └───┬────┘ └───┬───┘ │
└──────┼─────────┼────────┼────────┼──────────┼──────────┼──────┘
       │ GET /auth-url    │        │          │          │
       ▼                  ▼        ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│  lira-integration.routes.ts                                     │
│                                                                 │
│  OAuth Callbacks ← provider redirects back with auth code       │
│  ↓                                                              │
│  adapter.exchangeCode(code) → encrypted tokens → DynamoDB       │
│                                                                 │
│  Connection CRUD: status / disconnect / member-mappings         │
│  Provider-specific: calendars, channels, repos, contacts, etc.  │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/services/integrations/                                     │
│  ┌──────────────────┐                                           │
│  │ adapter.interface │ ← shared connect/disconnect/status       │
│  └──────────────────┘                                           │
│  ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌────────┐          │
│  │linear  │ │slack  │ │teams │ │google  │ │github  │          │
│  │adapter │ │adapter│ │adapter│ │adapter │ │adapter │          │
│  └────────┘ └───────┘ └──────┘ └────────┘ └────────┘          │
│  ┌──────────┐ ┌─────────┐ ┌────────────┐                      │
│  │greenhouse│ │hubspot  │ │salesforce  │                      │
│  │adapter   │ │adapter  │ │adapter     │                      │
│  └──────────┘ └─────────┘ └────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 21.4 Google Calendar Event CRUD

The Google integration supports full Calendar event management:

- **`POST /integrations/google/events`** — Create a calendar event with title, description, start/end time, attendees, location
- **`PUT /integrations/google/events/:eventId`** — Update an existing event (reschedule, add attendees, change description)
- **`GET /integrations/google/events`** — List upcoming events from the default calendar

Events are created using the Google Calendar API v3 via the `googleapis` SDK. The adapter uses the org's stored OAuth tokens (refreshed automatically on 401).

### 21.5 Member Mapping System

Each integration supports a member mapping table that links Lira org members to their accounts on the external platform:

```
Lira Org Member     ←→     Platform Account
"Alice Smith"               "alice@company.slack.com" (Slack)
"Alice Smith"               "U12345" (Linear user ID)
"Bob Johnson"               "bob@company.com" (HubSpot contact owner)
```

This enables:
- Task assignments to flow to the right person in Linear/Slack
- Meeting summaries tagged to the correct HubSpot contact
- Calendar events created with the right attendees

### 21.6 External Webhooks

Three providers send real-time events to Lira:

| Provider | Endpoint | Events |
|---|---|---|
| **Linear** | `POST /lira/v1/webhooks/inbound/linear` | Issue created/updated, comment added |
| **Slack** | `POST /lira/v1/webhooks/inbound/slack` | Messages, app mentions, channel events |
| **Teams** | `POST /lira/v1/webhooks/inbound/teams` | Activity notifications |

Each webhook handler verifies the request signature using the provider's signing secret before processing.

### 21.7 Integration Verification & Approval

Every integration is tracked for official platform approval. The goal: **no red warnings, no "app not approved" banners** — ever. See `docs/INTEGRATION_VERIFICATION_TRACKER.md` for current status.

| Platform | Approval Target | Status |
|---|---|---|
| Google | OAuth verification (sensitive scopes) | In Progress — awaiting review |
| Slack | Slack App Directory listing | In Progress — public distribution activated |
| Microsoft | Microsoft 365 Certification | Not Started |
| GitHub | GitHub Marketplace | Not Started |
| HubSpot | HubSpot Marketplace | Not Started |
| Salesforce | Salesforce AppExchange | Not Started |
| Greenhouse | Greenhouse Partner Program | Not Started |
| Linear | Linear integration listing | Not Started |

---

## 22. Customer Support AI

### 22.1 Overview

Lira's Customer Support product provides AI-powered email support with knowledge base grounding. Instead of generic chatbot responses, Lira reads each support email in context, searches the org's knowledge base and uploaded documents, and responds with accurate, company-specific answers — or escalates to a human when it can't confidently answer.

### 22.2 Key Features

- **Custom email domain** — Org admins self-serve domain setup via the Resend domain API. Customers email `support@yourcompany.com`; Lira responds as the company brand.
- **AI reply automation** — Toggle `ai_reply_enabled` per org. When enabled, inbound emails are processed automatically by GPT-4o-mini with full org context.
- **Knowledge base grounding** — Every AI reply is informed by Qdrant vector search across the org's crawled website and uploaded documents.
- **Escalation** — When GPT-4o-mini determines it can't answer confidently (novel topic, sensitive request, explicit "talk to a human"), the email is escalated to an org admin with the full thread forwarded.
- **Thread management** — Full inbox UI showing all email threads with status badges (open / escalated / closed).
- **Custom domain DNS verification** — Self-serve DNS record setup with live verification polling.

### 22.3 Architecture

The Customer Support system reuses the Email Integration architecture (Section 19) with these additions:

- **`ProductCustomerSupportPage.tsx`** — Marketing page for the support product
- **`OrgEmailPage.tsx`** — Email domain setup, thread inbox, notification preferences
- **Email routes** (`/lira/v1/email/*`) handle both meeting notification replies and customer support threads
- The same GPT-4o-mini reply engine handles both — context type distinguishes meeting replies from support queries

### 22.4 Email Domain Setup Flow

1. Admin navigates to Org Settings → Email → "Use custom domain"
2. Enters domain (e.g. `yourcompany.com`)
3. Frontend calls `POST /lira/v1/email/domain`
4. Backend registers domain via Resend API → returns DNS records (MX, TXT, DKIM)
5. Admin adds records to their DNS provider
6. Frontend polls `GET /lira/v1/email/domain/status` until verified
7. Once verified, all outbound emails use `lira@yourcompany.com`

---

## 23. Usage Tracking & Quotas

### 23.1 Overview

Lira tracks per-org usage to enforce beta limits and provide visibility into resource consumption. The Usage page shows meetings held, bots deployed, interviews conducted, documents uploaded, and API calls made.

### 23.2 Implementation

- **Backend**: `lira-usage.routes.ts` provides `GET /lira/v1/usage?orgId=<id>` returning usage stats
- **Frontend**: `UsagePage.tsx` at `/usage` displays usage metrics with visual progress bars against quota limits
- **API layer**: `getOrgUsage(orgId)` typed wrapper in the API service
- **Quota enforcement**: A `BETA_LIMIT_REACHED` interceptor returns 429 when an org exceeds its beta allocation

### 23.3 Usage Metrics

| Metric | Description |
|---|---|
| Meetings | Total meetings created this billing period |
| Bot deployments | Number of bot deploys (Google Meet joins) |
| Interviews | AI interviews conducted |
| Documents | Files uploaded to the knowledge base |
| Website crawl pages | Pages crawled for KB |
| API calls | Total API requests |

---

## 24. Sales Coaching

### 24.1 Overview

Lira's Sales Coaching product provides real-time assistance during sales calls. The system offers:

- **Real-time transcription** — Live call transcript with speaker identification
- **Objection handling** — AI-powered suggestions when prospects raise objections
- **Battle cards** — Competitive intelligence surfaced at the right moment
- **CRM auto-fill** — Meeting notes, next steps, and deal updates pushed to HubSpot/Salesforce automatically

### 24.2 Product Marketing

**Route**: `/products/sales` → `ProductSalesPage.tsx`

The marketing page showcases the three-step workflow (Connect → Coach → Close) and feature grid.

### 24.3 Desktop App Architecture

A dedicated Electron desktop app is specified for always-on sales coaching. See `docs/features/SALES_COACHING_DESKTOP_APP.md` for the full specification including:

- Electron + React + TypeScript architecture
- System tray integration for always-available coaching
- Screen overlay for real-time objection handling cards
- CRM integration (HubSpot, Salesforce) for automatic deal updates
- Audio capture from system audio (sales calls on any platform)

### 24.4 CRM Integration for Sales

The existing HubSpot and Salesforce integrations (Section 21) provide the data layer for sales coaching:

- **HubSpot**: `listHubSpotContacts`, `listHubSpotDeals`, `listHubSpotPipelines`, `createHubSpotNote` — for auto-filling deal notes after sales calls
- **Salesforce**: `listSalesforceContacts`, `listSalesforceOpportunities`, `listSalesforceLeads` — for syncing meeting context to opportunity records

---

## 25. Dual Google OAuth System

### 25.1 Why Two Client IDs?

Lira uses two separate Google OAuth client IDs to handle different authentication contexts:

| Client ID | Purpose | Env Var (Backend) | Env Var (Frontend) |
|---|---|---|---|
| `71053791265-...` | **Platform login** — Lira app's OAuth consent screen. Used when signing in via the Lira frontend. | `GOOGLE_LOGIN_CLIENT_ID` | `VITE_GOOGLE_LOGIN_CLIENT_ID` |
| `467839759761-...` | **Integration scopes** — Creovine platform's broader OAuth consent screen. Used for Google Calendar/Drive integration and for sign-in via the Creovine website. | `GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` |

### 25.2 Backend Implementation

In `platform-auth.service.ts`, the `getAllowedAudiences()` function returns an array of both client IDs:

```typescript
function getAllowedAudiences(): string[] {
  const audiences = [config.googleLoginClientId];
  if (config.googleClientId) {
    audiences.push(config.googleClientId);
  }
  return audiences;
}
```

The `verifyIdToken()` call passes this array, so tokens issued by either Google OAuth consent screen are accepted:

```typescript
const ticket = await client.verifyIdToken({
  idToken: token,
  audience: getAllowedAudiences(),
});
```

This enables users who sign in via the Lira frontend **or** the Creovine website to authenticate against the same backend without audience mismatch errors.

### 25.3 Config Schema

In `src/config/index.ts`, the Zod schema includes both:

```typescript
googleLoginClientId: z.string(),        // Required — Lira app login
googleClientId: z.string().optional(),   // Optional — Creovine platform integration
```

---

*Built by the Creovine Labs team. Powered by Amazon Nova Sonic on AWS Bedrock, OpenAI GPT-4o-mini, Deepgram Nova-2, and Resend.*

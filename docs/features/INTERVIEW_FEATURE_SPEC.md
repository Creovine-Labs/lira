# Lira AI — Interview Feature: Technical Specification

**Version:** 1.1  
**Date:** March 14, 2026  
**Status:** Revised — Post-Review (all v1.0 review feedback incorporated)  
**Parent Document:** [LIRA_AGENTIC_AI_VISION.md](../LIRA_AGENTIC_AI_VISION.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [What We Already Have](#2-what-we-already-have)
3. [What We Need to Build](#3-what-we-need-to-build)
4. [Interview Lifecycle](#4-interview-lifecycle)
5. [Data Model](#5-data-model)
6. [Backend Architecture](#6-backend-architecture)
   - [6.1 New API Endpoints](#61-new-api-endpoints)
   - [6.2 Interview Context Manager](#62-interview-context-manager)
     - [6.2.1 Semantic Topic Overlap Detector](#621-semantic-topic-overlap-detector-copilot-mode)
   - [6.3 Interview-Aware AI Response Generator](#63-interview-aware-ai-response-generator)
   - [6.4 Evaluation Engine](#64-evaluation-engine)
   - [6.5 Resume Parsing Service](#65-resume-parsing-service)
   - [6.6 Candidate No-Show Handling](#66-candidate-no-show-handling)
7. [Frontend Architecture](#7-frontend-architecture)
   - [7.1 New Routes](#71-new-routes)
   - [7.2 New Pages](#72-new-pages)
   - [7.3 New Components](#73-new-components)
   - [7.4 New Store](#74-new-store)
   - [7.5 New API Functions](#75-new-api-functions)
8. [WebSocket Protocol Changes](#8-websocket-protocol-changes)
9. [Interview Modes — Deep Dive](#9-interview-modes--deep-dive)
10. [Evaluation System](#10-evaluation-system)
11. [System Prompt Engineering](#11-system-prompt-engineering)
12. [Bot Deployment for Interviews](#12-bot-deployment-for-interviews)
13. [File Structure](#13-file-structure)
14. [Database Schema (DynamoDB)](#14-database-schema-dynamodb)
15. [Security Considerations](#15-security-considerations)
16. [Implementation Plan](#16-implementation-plan)
17. [Open Questions](#17-open-questions)

---

## 1. Overview

The Interview feature extends Lira from a general meeting participant into a structured interviewer that can conduct, observe, and evaluate job interviews. It builds directly on top of the existing meeting infrastructure — the same WebSocket connection, audio pipeline, bot deployment system, and AI response generator — with a specialized interview context layer on top.

**The key insight:** An interview is just a meeting with a specific purpose, a structured question flow, and an evaluation outcome. We don't need to rebuild the meeting system. We need to teach it what an interview is.

---

## 2. What We Already Have

Before designing anything new, here's exactly what we can reuse:

| Capability                         | Current State                                                                            | Reuse for Interviews                                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Bot deployment to Google Meet**  | Working — `POST /lira/v1/bot/deploy` sends a Puppeteer-controlled browser to Google Meet | **Direct reuse.** Same bot joins an interview meeting link.                                                                     |
| **WebSocket audio pipeline**       | Working — PCM 16kHz up, 24kHz down, VAD, transcription via Nova 2 Sonic                  | **Direct reuse.** Interview audio flows through the same pipeline.                                                              |
| **AI response generation**         | Working — Nova 2 Lite builds responses from conversation context + system prompt         | **Extend.** Swap the system prompt for an interview-specific one with the question list, evaluation criteria, and role context. |
| **Context Manager**                | Working — Maintains last 50 messages, detects wake words, sentiment analysis             | **Extend.** Add interview state tracking (current question index, time remaining, candidate answers per question).              |
| **Transcription**                  | Working — `transcript_delta` events with speaker diarization                             | **Direct reuse.** Same transcription, but post-meeting we parse it into Q&A pairs.                                              |
| **Meeting summary**                | Working — `POST /meetings/{id}/summary` generates short/long summaries                   | **Extend.** Add interview evaluation as a specialized summary type.                                                             |
| **Task extraction**                | Working — `POST /meetings/{sessionId}/extract-tasks`                                     | **Reuse pattern.** Interview evaluation uses the same "post-meeting AI analysis" pattern.                                       |
| **Org settings (company context)** | Working — Company name, industry, culture, products, terminology, custom instructions    | **Direct reuse.** Interview system prompt includes org context so Lira can answer candidate questions about the company.        |
| **Document upload**                | Working — `POST /orgs/{orgId}/documents` with multipart/form-data, S3 storage            | **Reuse for resumes.** Same upload flow, just tagged as `resume` document type.                                                 |
| **Meeting settings**               | Working — personality, wake_word, proactive_suggest, ai_name, voice_id                   | **Extend.** Add interview-specific settings (mode, time limit, question style).                                                 |

**What this means:** Roughly 70% of the interview feature is infrastructure we already have. The new work is:

1. Interview CRUD (create/manage interviews on the dashboard)
2. Interview-aware system prompts and question flow logic
3. Evaluation engine (post-interview scoring)
4. Frontend pages for setup and evaluation review

---

## 3. What We Need to Build

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW (Build from scratch)                      │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Interview CRUD  │  │ Evaluation Engine│  │ Interview UI │  │
│  │ API endpoints   │  │ (scoring, report)│  │ (setup,review│  │
│  │ + DynamoDB table│  │                  │  │  dashboard)  │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐                     │
│  │ Interview       │  │ Resume Parser    │                     │
│  │ System Prompts  │  │ (PDF → context)  │                     │
│  │ + Question Flow │  │                  │                     │
│  └─────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  EXTEND (Modify existing code)                  │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Context Manager │  │ AI Response Gen  │  │ Bot Deploy   │  │
│  │ (interview state│  │ (interview-aware │  │ (interview   │  │
│  │  tracking)      │  │  prompt routing) │  │  metadata)   │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐                     │
│  │ WebSocket Events│  │ Meeting Create   │                     │
│  │ (interview_     │  │ (link to         │                     │
│  │  specific)      │  │  interview_id)   │                     │
│  └─────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 REUSE AS-IS (No changes needed)                 │
│                                                                 │
│  Audio pipeline, WebSocket transport, Nova 2 Sonic STT/TTS,    │
│  Org settings, Authentication, Bot Puppeteer logic,             │
│  Transcript rendering, Document upload (for resumes)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Interview Lifecycle

This is the end-to-end flow from creating an interview to reviewing the evaluation.

```
PHASE 1: SETUP (Dashboard — Human)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Admin/Hiring Manager creates interview:
    → Job title + description
    → Skills to evaluate
    → Questions (custom or AI-generated)
    → Evaluation criteria + weights
    → Interview mode (solo / copilot / shadow)
    → Time limit (30 / 45 / 60 min)
    → (Optional) Upload candidate resume
    → Paste Google Meet link
                    ↓
  Interview created → status: "scheduled"
  Interview linked to a Lira meeting (session_id)

PHASE 2: DEPLOYMENT (Automatic or Manual)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  At scheduled time (or when user clicks "Start Interview"):
    → POST /lira/v1/bot/deploy with:
        meeting_url: Google Meet link
        meeting_type: "interview"
        interview_id: the interview record ID
    → Bot launches, navigates to Meet, joins
    → Interview status → "bot_deployed"
    → When bot is in the meeting → status: "in_progress"

PHASE 3: CONDUCTING (Google Meet — AI + Candidate + optional Human)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Audio flows through existing pipeline:
    Candidate speaks → PCM → WebSocket → Nova Sonic → Transcript
    Lira responds → Nova Lite → Nova Sonic → PCM → WebSocket → Candidate hears

  BUT: The Context Manager now has interview-specific logic:
    → Knows the question list and current position
    → Tracks which questions have been asked
    → Knows when to move to the next question
    → In Solo mode: Lira drives the conversation
    → In Copilot mode: Lira waits for trigger phrase
    → In Shadow mode: Lira never speaks

  Interview-specific WebSocket events:
    → interview_progress: { current_question: 3, total: 10, time_remaining: "18:32" }
    → interview_phase: { phase: "intro" | "questions" | "candidate_questions" | "closing" }

  The interview follows a structured flow:
    1. Introduction (Lira introduces itself, explains the process)
    2. Warm-up question (easy, builds comfort)
    3. Core questions (from the question list)
    4. Follow-up questions (AI-generated based on answers)
    5. Candidate questions ("Do you have any questions for us?")
    6. Closing (thank you, next steps)

PHASE 4: EVALUATION (Backend — AI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  When interview ends (bot leaves or time runs out):
    → Interview status → "evaluating"
    → Backend takes the full transcript
    → Groups it into Q&A pairs
    → For each evaluation criterion:
        Score 0-100 based on candidate's answers
        Extract supporting evidence (quotes)
        Note strengths and concerns
    → Generate overall recommendation
    → Save evaluation to DynamoDB
    → Interview status → "completed"
    → Notify the hiring manager (via dashboard notification)

PHASE 5: REVIEW (Dashboard — Human)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Hiring manager opens the interview detail page:
    → Sees the evaluation report (scores, strengths, concerns)
    → Reads the recommendation
    → Reviews the full transcript with Q&A grouping
    → Can listen to audio playback
    → Can export the report as PDF
    → Can add internal notes
    → Makes hire/no-hire decision and records it
```

---

## 5. Data Model

### Interview Record

```typescript
interface Interview {
  interview_id: string // UUID
  org_id: string // FK → Organization
  session_id?: string // FK → Meeting (created when interview starts)

  // ── Job Details ──
  title: string // "Senior Backend Engineer"
  department?: string // "Engineering"
  job_description: string // Full JD text
  required_skills: string[] // ["Node.js", "PostgreSQL", "System Design"]
  experience_level: 'junior' | 'mid' | 'senior' | 'lead' | 'principal'

  // ── Candidate Details ──
  candidate_name: string
  candidate_email: string
  candidate_resume_url?: string // S3 key (uploaded via document service)
  candidate_resume_parsed?: ResumeData // Extracted resume content

  // ── Interview Configuration ──
  mode: 'solo' | 'copilot' | 'shadow'
  meeting_link: string // Google Meet URL
  scheduled_at?: string // ISO 8601
  time_limit_minutes: number // 30, 45, or 60
  personality: 'supportive' | 'challenger' | 'facilitator' | 'analyst'

  // ── Questions ──
  questions: InterviewQuestion[]
  question_generation: 'manual' | 'ai_generated' | 'hybrid'

  // ── Evaluation Configuration ──
  evaluation_criteria: EvaluationCriterion[]

  // ── Status & Results ──
  status: InterviewStatus
  evaluation?: InterviewEvaluation // Populated after interview completes
  internal_notes?: string // Added by hiring manager post-interview
  decision?: 'hire' | 'no_hire' | 'next_round' | 'undecided'
  decided_by?: string // user_id
  decided_at?: string

  // ── Metadata ──
  created_by: string // user_id
  created_at: string
  updated_at: string
}

type InterviewStatus =
  | 'draft' // Interview created but not fully configured
  | 'scheduled' // Ready, waiting for scheduled_at
  | 'bot_deployed' // Bot launched, navigating to Meet
  | 'in_progress' // Bot in meeting, interview actively happening
  | 'evaluating' // Interview finished, AI generating evaluation
  | 'completed' // Evaluation ready, waiting for human review
  | 'cancelled' // Cancelled before or during

interface InterviewQuestion {
  id: string // UUID
  text: string // "Describe a system you designed that handles high concurrency."
  category: 'technical' | 'behavioral' | 'situational' | 'cultural' | 'warm_up' | 'custom'
  skill_target?: string // Which skill this tests (e.g., "System Design")
  expected_depth: 'brief' | 'moderate' | 'detailed'
  follow_up_enabled: boolean // Can Lira ask follow-ups based on the answer?
  order: number // Position in the question sequence
  source: 'manual' | 'ai_generated'
  // ── Populated during/after interview ──
  asked_at?: string // When Lira asked this question
  answer_transcript?: string // Candidate's full answer (extracted from transcript)
  answer_duration_seconds?: number // How long the candidate spoke
  follow_ups_asked?: string[] // Any follow-up questions Lira generated
}

interface EvaluationCriterion {
  id: string
  name: string // "Technical Depth", "Communication", "Problem Solving"
  description: string // "Ability to explain complex systems clearly"
  weight: number // 0.0 to 1.0 (all weights must sum to 1.0)
  // ── Populated after evaluation ──
  score?: number // 0-100
  evidence?: string[] // Quotes from the transcript
  notes?: string // AI's reasoning for the score
}

interface InterviewEvaluation {
  overall_score: number // 0-100 (weighted average of criteria scores)
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommended'
  recommendation_reasoning: string // 2-3 paragraph explanation
  strengths: string[] // "Deep understanding of distributed systems"
  concerns: string[] // "Limited experience with event-driven architecture"
  notable_quotes: NotableQuote[]
  qa_summary: QASummary[] // Structured Q&A breakdown
  interview_duration_minutes: number
  questions_asked: number
  questions_skipped: number
  candidate_engagement: 'high' | 'moderate' | 'low'
  generated_at: string
}

interface NotableQuote {
  quote: string
  context: string // What question this was in response to
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface QASummary {
  question: string
  answer_summary: string // Condensed version of the answer
  answer_quality: 'excellent' | 'good' | 'adequate' | 'poor'
  follow_ups?: { question: string; answer_summary: string }[]
}

interface ResumeData {
  raw_text: string // Full extracted text
  name?: string
  email?: string
  phone?: string
  skills: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  summary?: string
}

interface ResumeExperience {
  company: string
  role: string
  duration: string // "Jan 2022 – Present"
  description: string
}

interface ResumeEducation {
  institution: string
  degree: string
  year?: string
}
```

---

## 6. Backend Architecture

### 6.1 New API Endpoints

All endpoints are under `/lira/v1/orgs/{orgId}/interviews`.

```
┌──────────┬────────────────────────────────────────────────┬───────────────────────────┐
│ Method   │ Path                                           │ Description               │
├──────────┼────────────────────────────────────────────────┼───────────────────────────┤
│ POST     │ /orgs/{orgId}/interviews                       │ Create interview           │
│ GET      │ /orgs/{orgId}/interviews                       │ List interviews            │
│ GET      │ /orgs/{orgId}/interviews/{interviewId}         │ Get interview details      │
│ PUT      │ /orgs/{orgId}/interviews/{interviewId}         │ Update interview           │
│ DELETE   │ /orgs/{orgId}/interviews/{interviewId}         │ Delete interview           │
│          │                                                │                           │
│ POST     │ /orgs/{orgId}/interviews/{interviewId}/start   │ Deploy bot + start         │
│ POST     │ /orgs/{orgId}/interviews/{interviewId}/cancel  │ Cancel in-progress         │
│          │                                                │                           │
│ POST     │ /orgs/{orgId}/interviews/{interviewId}/resume  │ Upload candidate resume    │
│          │                                                │ (multipart/form-data)      │
│          │                                                │                           │
│ GET      │ /orgs/{orgId}/interviews/{interviewId}         │ Get evaluation (included   │
│          │ /evaluation                                    │ in interview detail when   │
│          │                                                │ status = completed)        │
│          │                                                │                           │
│ POST     │ /orgs/{orgId}/interviews/{interviewId}         │ Re-run evaluation with     │
│          │ /evaluate                                      │ different criteria          │
│          │                                                │                           │
│ PUT      │ /orgs/{orgId}/interviews/{interviewId}         │ Record hire/no-hire        │
│          │ /decision                                      │ decision + notes           │
│          │                                                │                           │
│ POST     │ /orgs/{orgId}/interviews/generate-questions    │ AI generates questions     │
│          │                                                │ from job description +     │
│          │                                                │ skills + resume            │
└──────────┴────────────────────────────────────────────────┴───────────────────────────┘
```

#### Create Interview — `POST /orgs/{orgId}/interviews`

```json
// Request
{
  "title": "Senior Backend Engineer",
  "department": "Engineering",
  "job_description": "We're looking for a senior backend engineer...",
  "required_skills": ["Node.js", "PostgreSQL", "System Design", "AWS"],
  "experience_level": "senior",
  "candidate_name": "Jane Smith",
  "candidate_email": "jane@example.com",
  "mode": "solo",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "scheduled_at": "2026-03-15T14:00:00Z",
  "time_limit_minutes": 45,
  "personality": "facilitator",
  "questions": [
    {
      "text": "Walk me through a system you designed that handles high concurrency.",
      "category": "technical",
      "skill_target": "System Design",
      "expected_depth": "detailed",
      "follow_up_enabled": true
    },
    {
      "text": "Tell me about a time you disagreed with a technical decision on your team.",
      "category": "behavioral",
      "expected_depth": "moderate",
      "follow_up_enabled": true
    }
  ],
  "question_generation": "hybrid",
  "evaluation_criteria": [
    { "name": "Technical Depth", "description": "Ability to design and reason about complex systems", "weight": 0.30 },
    { "name": "Communication", "description": "Clarity and conciseness when explaining ideas", "weight": 0.20 },
    { "name": "Problem Solving", "description": "Approach to breaking down ambiguous problems", "weight": 0.25 },
    { "name": "Culture Fit", "description": "Alignment with team values and collaboration style", "weight": 0.15 },
    { "name": "Experience Relevance", "description": "How well past experience maps to this role", "weight": 0.10 }
  ]
}

// Response
{
  "interview_id": "int_a1b2c3d4",
  "status": "draft",
  "questions": [
    // ...user's questions + AI-generated questions (if hybrid mode)
  ],
  "created_at": "2026-03-13T10:30:00Z"
}
```

#### Generate Questions — `POST /orgs/{orgId}/interviews/generate-questions`

This is a utility endpoint the frontend calls when the user wants AI-generated questions.

```json
// Request
{
  "title": "Senior Backend Engineer",
  "job_description": "We're looking for...",
  "required_skills": ["Node.js", "PostgreSQL", "System Design"],
  "experience_level": "senior",
  "resume_text": "Jane Smith has 6 years...",  // optional — parsed from uploaded resume
  "question_count": 8,
  "categories": ["technical", "behavioral", "situational"]
}

// Response
{
  "questions": [
    {
      "text": "You've worked extensively with PostgreSQL at scale. What's the most challenging query optimization problem you've solved?",
      "category": "technical",
      "skill_target": "PostgreSQL",
      "expected_depth": "detailed",
      "rationale": "Tests deep PostgreSQL knowledge based on resume experience at Stripe"
    }
  ]
}
```

### 6.2 Interview Context Manager

This extends the existing Context Manager (which tracks conversation state, message history, wake words) with interview-specific state.

```
┌─────────────────────────────────────────────────────────┐
│          INTERVIEW CONTEXT MANAGER                      │
│          (extends existing Context Manager)             │
│                                                         │
│  Existing Context Manager state:                        │
│  ├── conversation_history (last 50 messages)            │
│  ├── wake_word_detection                                │
│  ├── sentiment_tracking                                 │
│  └── should_respond logic                               │
│                                                         │
│  NEW interview-specific state:                          │
│  ├── interview_phase: intro | questions | candidate_q   │
│  │                    | closing | ended                  │
│  ├── current_question_index: number                     │
│  ├── questions_remaining: number                        │
│  ├── time_remaining_seconds: number                     │
│  ├── candidate_answers: Map<question_id, transcript[]>  │
│  ├── follow_ups_asked: Map<question_id, string[]>       │
│  ├── candidate_speaking: boolean                        │
│  ├── silence_after_answer_seconds: number               │
│  └── interview_mode: solo | copilot | shadow            │
│                                                         │
│  NEW decision logic (replaces should_respond):          │
│  ├── Solo mode:                                         │
│  │   Lira controls the flow. Responds after:            │
│  │   • Candidate finishes answering (3s silence)        │
│  │   • Detects answer is complete ("That's about it")   │
│  │   • Time running low → skip to closing               │
│  │                                                      │
│  ├── Copilot mode:                                      │
│  │   Lira waits for trigger:                            │
│  │   • "Lira, your turn"                                │
│  │   • "Lira, ask your questions"                       │
│  │   • "What do you think, Lira?"                       │
│  │   Runs Semantic Topic Overlap Detector (§6.2.1),    │
│  │   then asks only uncovered questions                 │
│  │                                                      │
│  └── Shadow mode:                                       │
│      Lira NEVER responds. Only records and evaluates.   │
│      should_respond always returns false.                │
└─────────────────────────────────────────────────────────┘
```

**How the interview-aware Context Manager modifies the response pipeline:**

```
Audio chunk arrives from candidate
        ↓
Nova 2 Sonic transcribes → transcript_delta event
        ↓
Context Manager receives transcript
        ↓
┌─ Is this an interview session? ─────────────────────────┐
│                                                          │
│  NO → Normal meeting flow (existing logic)               │
│                                                          │
│  YES → Interview flow:                                   │
│    1. Append to current question's answer buffer          │
│    2. Track answer duration                               │
│    3. Detect answer completion (combined signal):         │
│       • 8-10s silence after candidate spoke              │
│         (3s is too aggressive — technical candidates     │
│          naturally pause 4-6s mid-thought while          │
│          formulating; premature interruption breaks      │
│          the interview experience)                       │
│       • Semantic completeness signal: transcript ends    │
│         in a natural closing phrase or a declarative     │
│         sentence with no open clauses                    │
│       • Prefer both signals; silence alone triggers      │
│         only at the 10s threshold                        │
│       • Never trigger within first 30s of candidate      │
│         starting to speak on a given question            │
│       • Answer exceeds 5 minutes → gently redirect       │
│    4. When answer complete:                               │
│       a. Should we ask a follow-up?                       │
│          • Was the answer vague or incomplete?             │
│          • Does the question have follow_up_enabled?      │
│          • Have we already asked 2 follow-ups? (max)      │
│          → YES: Generate follow-up, send to Response Gen  │
│          → NO: Move to next question                      │
│       b. Are there more questions?                        │
│          → YES: Send next question to Response Generator  │
│          → NO: Move to candidate_questions phase          │
│    5. Check time remaining:                               │
│       • < 5 minutes → Move to closing regardless          │
│       • < 10 minutes → Skip non-critical questions        │
└──────────────────────────────────────────────────────────┘
```

#### 6.2.1 Semantic Topic Overlap Detector (Copilot Mode)

In Copilot mode, Lira must not ask a question the human has already substantively covered — even when phrased differently. A human asking "Tell me about scaling a system to millions of users" covers Lira's prepared "Describe a distributed system you designed for high concurrency." These are semantically equivalent but textually different. Without this check, Lira asks duplicate questions — the most damaging outcome for interview quality, and a signal to the candidate that Lira wasn't listening.

**How it works:**

When Lira is triggered in Copilot mode, before it speaks, it runs the following against all remaining questions:

1. Extract the human interviewer's turns from conversation history (identified by speaker label, excluding Lira's label)
2. For each of Lira's remaining prepared questions, send a focused Nova Lite classification call (all calls run in parallel):

```
Has this question topic already been substantively addressed in this conversation?

QUESTION TO CHECK: "{lira_question_text}"

HUMAN INTERVIEWER'S QUESTIONS (from transcript so far):
{human_questions_from_transcript}

A question is "covered" only if the human addressed the same skill or topic
AND the candidate gave a substantive answer. Surface-level mentions do not count.

Answer in JSON only:
{ "covered": true, "similar_to": "<the matching human question>" }
OR
{ "covered": false }
```

3. Filter Lira's list: skip any question where `covered: true`
4. Proceed with asking only uncovered questions

**Latency:** ~1–2 seconds total (all checks run in parallel before Lira speaks).

**Threshold:** Surface-level mentions ("So you've worked with PostgreSQL?") do not count as covering a deep technical question about PostgreSQL optimization. Both the skill target and a real candidate answer must be present.

### 6.3 Interview-Aware AI Response Generator

The existing AI Response Generator uses Nova 2 Lite with a system prompt based on the AI personality and org context. For interviews, we swap in a specialized system prompt and add structured output guidance.

**What changes:**

The Response Generator already receives context from the Context Manager and generates a natural language response. For interviews, the key difference is:

1. **System prompt** is interview-specific (see Section 11)
2. **Response content** is guided by the question flow, not freeform conversation
3. **Response style** is more structured (asking a question, acknowledging an answer, transitioning)

The actual Nova 2 Lite call and Nova 2 Sonic TTS pipeline remain unchanged. We're only changing **what we ask the LLM to say**, not **how we say it**.

```
┌───────────────────────────────────────────────────────────┐
│      AI RESPONSE GENERATOR — INTERVIEW MODE               │
│                                                           │
│  Input from Context Manager:                              │
│  ├── interview_phase: "questions"                         │
│  ├── action: "ask_next_question"                          │
│  ├── next_question: { text, category, skill_target }      │
│  ├── candidate_last_answer: "I built a system that..."    │
│  ├── conversation_history: [last 10 messages]             │
│  └── time_remaining: "22:15"                              │
│                                                           │
│  Response Generator:                                      │
│  1. Builds interview system prompt (see Section 11)       │
│  2. Appends interview state as user-context               │
│  3. Calls Nova 2 Lite:                                    │
│     → "That's a great example of handling distributed     │
│        state. I appreciate you walking through the        │
│        tradeoffs. Let me shift gears a bit — can you      │
│        tell me about a time you had to push back on       │
│        a technical decision from a more senior            │
│        engineer?"                                         │
│  4. Sends text to Nova 2 Sonic for TTS                    │
│  5. Streams audio back to candidate                       │
│                                                           │
│  Key behaviors:                                           │
│  • Acknowledges the previous answer before asking next    │
│  • Transitions naturally between topics                   │
│  • Uses the candidate's name occasionally                 │
│  • Adapts tone to match interview personality setting     │
│  • Never reveals evaluation scores during the interview   │
└───────────────────────────────────────────────────────────┘
```

### 6.4 Evaluation Engine

This is a **post-interview** process. It runs after the interview ends and produces the structured evaluation.

```
Interview ends (bot leaves meeting)
        ↓
Backend triggers evaluation pipeline
        ↓
┌───────────────────────────────────────────────────────────┐
│              EVALUATION ENGINE                            │
│                                                           │
│  Step 1: TRANSCRIPT STRUCTURING                           │
│  ─────────────────────────────────────────────            │
│  Raw transcript (flat message list)                       │
│        ↓                                                  │
│  Q&A pair extraction:                                     │
│  • Match each question to its answer segment              │
│  • Group follow-up Q&A under parent question              │
│  • Calculate answer duration per question                 │
│  • Tag segments: intro / core / candidate_q / closing     │
│                                                           │
│  Step 2: PER-CRITERION SCORING (parallel)                 │
│  ─────────────────────────────────────────────            │
│  For each EvaluationCriterion:                            │
│    Nova 2 Lite call with:                                 │
│    • System prompt: "You are an expert interview          │
│      evaluator. Score this candidate specifically on      │
│      {criterion.name}: {criterion.description}"           │
│    • Full Q&A transcript                                  │
│    • Resume data (if available)                           │
│    • Job description                                      │
│    Response (structured JSON):                            │
│    {                                                      │
│      "score": 82,                                         │
│      "evidence": ["Quote 1", "Quote 2"],                  │
│      "reasoning": "The candidate demonstrated..."         │
│    }                                                      │
│                                                           │
│  Step 3: OVERALL ASSESSMENT                               │
│  ─────────────────────────────────────────────            │
│  Nova 2 Lite call with:                                   │
│  • All per-criterion scores and evidence                  │
│  • Resume data                                            │
│  • Job description                                        │
│  Response:                                                │
│  {                                                        │
│    "overall_score": weighted_average,                     │
│    "recommendation": "recommend",                         │
│    "recommendation_reasoning": "Jane demonstrated...",    │
│    "strengths": [...],                                    │
│    "concerns": [...],                                     │
│    "notable_quotes": [...],                               │
│    "candidate_engagement": "high"                         │
│  }                                                        │
│                                                           │
│  Step 4: PERSIST                                          │
│  ─────────────────────────────────────────────            │
│  • Save evaluation to Interview record in DynamoDB        │
│  • Update interview status → "completed"                  │
│  • Emit webhook event (if org has webhooks configured)    │
│  • Create notification for hiring manager                 │
└───────────────────────────────────────────────────────────┘
```

**Why per-criterion scoring is done in parallel separate calls:**

- Each criterion gets focused attention (LLM evaluates one dimension at a time)
- Avoids a single monolithic prompt that tries to score everything at once (which produces lower-quality scores)
- Can run in parallel (5 criteria = 5 concurrent Nova 2 Lite calls)
- Each call is smaller and faster

**Expected latency and cost:**
For a 45-minute interview, the transcript is approximately 8,000–15,000 tokens. Five parallel per-criterion calls each receive the full transcript: ~40,000–75,000 tokens total input. Expected cost: **$0.10–0.30 per evaluation**. Expected wall-clock time: **30–90 seconds** (criteria calls run in parallel, then one synthesis call).

**Frontend behavior during the `evaluating → completed` transition:**

- Interview status transitions to `"evaluating"` as soon as the bot leaves
- The frontend polls `GET /orgs/{orgId}/interviews/{interviewId}` every **5 seconds** while `status === "evaluating"`
- Show a specific _"Evaluation in progress..."_ loading state on the detail page — not a generic spinner
- When status becomes `"completed"`, stop polling and render the evaluation report without a page reload
- If still `"evaluating"` after 3 minutes, show: _"Evaluation is taking longer than expected. We'll notify you when it's ready."_ and stop polling

### 6.5 Resume Parsing Service

Resumes are uploaded via the existing document upload infrastructure. The parsing step extracts structured data.

```
Resume PDF uploaded → S3
        ↓
POST /orgs/{orgId}/interviews/{interviewId}/resume
        ↓
┌───────────────────────────────────────┐
│        RESUME PARSER                  │
│                                       │
│  1. Download PDF from S3              │
│  2. Extract text (pdf-parse or        │
│     similar library)                  │
│  3. Send to Nova 2 Lite:             │
│     "Extract structured data from     │
│      this resume: name, email,        │
│      skills, experience, education"   │
│  4. Parse JSON response              │
│  5. Store as candidate_resume_parsed  │
│     on the Interview record          │
│  6. Use for question personalization  │
└───────────────────────────────────────┘
```

This is lightweight — we don't need a dedicated service. A single Lambda function or a route handler in the existing Fastify backend handles it.

**Fallback behavior when parsing fails:**

- **Encrypted or image-only PDF:** Log a warning, set `candidate_resume_parsed: null`, continue. The interview proceeds without resume context.
- **Nova Lite extraction returns malformed JSON:** Retry once with a stricter prompt; if still malformed, fall back to storing only `candidate_resume_parsed.raw_text` (unstructured).
- **All parsing fails:** The system prompt omits the `CANDIDATE BACKGROUND` section entirely — never hallucinate candidate details. A visible indicator appears on the interview detail page: _"Resume context unavailable — question personalization reduced."_ The hiring manager is never blocked from proceeding; interviews start regardless of resume parse status.

---

### 6.6 Candidate No-Show Handling

If the bot joins the meeting and no other participant joins within the **no-show window** (default: **10 minutes**, configurable per interview), the bot auto-leaves and the interview status transitions to `"cancelled"` with `cancellation_reason: "candidate_no_show"`.

**Why 10 minutes:** The existing 45-second auto-leave timeout (standard for empty meeting rooms in non-interview mode) is inappropriate here. A candidate being 5–8 minutes late is a normal scenario, not a no-show. The longer window respects normal human lateness while not leaving the bot running indefinitely.

**Implementation:**

- When a `meeting_type: "interview"` bot joins and detects it is the only participant, start a `no_show_timer` (default: 600 seconds, configurable on the interview record)
- If a second participant joins before the timer fires: cancel the timer, begin the interview normally
- If the timer fires and the bot is still alone: play a pre-scripted closing message — _"It seems there may be a scheduling issue. This interview session has been cancelled. Please contact the hiring team to reschedule."_ — then leave
- Backend sets `status: "cancelled"`, `cancellation_reason: "candidate_no_show"`, `cancelled_at: now()`
- Hire manager receives a dashboard notification

**Distinct from candidate leaving mid-interview:** If a candidate joins but disconnects or leaves before the interview ends, that sets `status: "cancelled"` with `cancellation_reason: "candidate_left_early"`. The evaluation engine still runs on the available transcript — even a partial interview can yield a useful partial evaluation.

---

## 7. Frontend Architecture

### 7.1 New Routes

Added to the existing router in `src/app/router/index.ts`:

```typescript
// Interview routes (under org)
orgInterviews: '/org/interviews' // List all interviews
orgInterviewCreate: '/org/interviews/new' // Create new interview
orgInterviewDetail: '/org/interviews/:interviewId' // View interview + evaluation
orgInterviewEdit: '/org/interviews/:interviewId/edit' // Edit draft interview
```

### 7.2 New Pages

```
src/pages/
├── InterviewsPage.tsx            // List view — all interviews with status filters
├── InterviewCreatePage.tsx       // Multi-step form to create/configure an interview
├── InterviewDetailPage.tsx       // View interview details, evaluation report, transcript
└── InterviewEditPage.tsx         // Edit a draft interview (reuses create form)
```

#### InterviewsPage.tsx — List View

```
┌─────────────────────────────────────────────────────────────────┐
│  Interviews                                    [+ New Interview]│
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [All] [Scheduled] [In Progress] [Completed] [Cancelled]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🟢 Senior Backend Engineer                               │   │
│  │    Jane Smith · Solo Interview · Scheduled Mar 15, 2PM    │   │
│  │    5 questions · 45 min                                   │   │
│  │    [Start Now]  [Edit]  [Cancel]                          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ✅ Product Designer                                       │   │
│  │    Alex Johnson · Completed Mar 12 · Score: 84/100        │   │
│  │    Recommendation: Recommend for next round               │   │
│  │    [View Evaluation]                                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ 🔵 Frontend Engineer                                     │   │
│  │    Sarah Lee · In Progress · Started 10 min ago           │   │
│  │    Question 4 of 8 · Co-Pilot mode                        │   │
│  │    [View Live]  [Cancel]                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### InterviewCreatePage.tsx — Multi-Step Form

```
Step 1: JOB DETAILS                    Step 2: CANDIDATE
─────────────────────                  ─────────────────
• Job title                            • Candidate name
• Department                           • Candidate email
• Job description (textarea)           • Upload resume (drag & drop)
• Required skills (tag input)          • Resume preview (parsed skills,
• Experience level (dropdown)            experience shown)

Step 3: QUESTIONS                      Step 4: EVALUATION CRITERIA
────────────────────                   ────────────────────────────
• Add custom questions                 • Criteria name + description
  (text + category + depth)           • Weight slider (must sum to 100%)
• [Generate with AI] button →          • Preset templates:
  calls generate-questions endpoint      "Engineering", "Design",
• Reorder via drag & drop               "Product", "General"
• Toggle follow-up per question        • Add/remove criteria
• Preview question flow

Step 5: INTERVIEW SETTINGS             Step 6: REVIEW & CREATE
──────────────────────────             ────────────────────────
• Interview mode: Solo/Copilot/Shadow  • Full summary of all settings
• Meeting link (paste Google Meet URL) • Question list preview
• Scheduled date & time                • Criteria breakdown
• Time limit: 30/45/60 min            • [Create Interview] button
• AI personality for this interview    • [Save as Draft] button
• AI name override (optional)
```

> **Auto-save:** After Step 2 completes (candidate details + resume), automatically create a `status: "draft"` interview record on the backend. Subsequent steps `PUT` to update the draft. This protects against browser crashes — users can resume from the Interviews list. A draft with only job + candidate details is a valid partial record.
>
> **Resume state across steps:** When Step 2 resume upload and parsing succeeds, hold the returned `ResumeData` in `InterviewCreatePage` component state. Do not re-fetch in Step 3. The "Generate with AI" call passes this in-memory `ResumeData` directly to `generate-questions` — questions are personalized to the actual uploaded resume without a second round-trip. If resume parsing failed (see §6.5 fallback), state holds `null` and generation proceeds without personalization.

#### InterviewDetailPage.tsx — Evaluation View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Interviews                                           │
│                                                                 │
│  Senior Backend Engineer Interview                              │
│  Candidate: Jane Smith · March 15, 2026 · 42 minutes           │
│  Mode: Solo Interview · Status: Completed                       │
│                                                                 │
│  ┌──────────────────────── TABS ────────────────────────────┐   │
│  │ [Evaluation]   [Transcript]   [Q&A Breakdown]   [Notes] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════                        │
│  OVERALL SCORE                                   78 / 100       │
│  ═══════════════════════════════════════                        │
│                                                                 │
│  Technical Depth  (30%)     ████████░░  82/100                  │
│  Communication    (20%)     ███████░░░  74/100                  │
│  Problem Solving  (25%)     ████████░░  80/100                  │
│  Culture Fit      (15%)     ███████░░░  72/100                  │
│  Experience       (10%)     ████████░░  81/100                  │
│                                                                 │
│  ── RECOMMENDATION ──────────────────────────────────────────   │
│  ✅ Recommended for Next Round                                  │
│                                                                 │
│  Jane demonstrated strong technical fundamentals, particularly  │
│  in distributed systems and database optimization. Her          │
│  experience at Stripe directly maps to our infrastructure       │
│  challenges. Some hesitation on event-driven architecture       │
│  questions suggests this is a growth area rather than a         │
│  current strength.                                              │
│                                                                 │
│  ── STRENGTHS ───────────────────────────────────────────────   │
│  • Deep understanding of PostgreSQL query optimization          │
│  • Clear communicator — explains tradeoffs well                 │
│  • Asked insightful questions about team structure               │
│                                                                 │
│  ── CONCERNS ────────────────────────────────────────────────   │
│  • Limited experience with event-driven systems (Kafka, etc.)   │
│  • Hesitated on system design for 10M concurrent connections    │
│                                                                 │
│  ── YOUR DECISION ───────────────────────────────────────────   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │  ○ Hire   ○ Next Round   ○ No Hire   ○ Undecided     │      │
│  │                                                       │      │
│  │  Internal Notes:                                      │      │
│  │  ┌─────────────────────────────────────────────────┐  │      │
│  │  │ Great candidate overall. Want to see how she    │  │      │
│  │  │ handles the live coding round before deciding.  │  │      │
│  │  └─────────────────────────────────────────────────┘  │      │
│  │                                        [Save Decision]│      │
│  └───────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 New Components

```
src/components/interview/
├── index.ts
├── InterviewCard.tsx              // Card for list view (status badge, candidate info, actions)
├── InterviewStatusBadge.tsx       // Color-coded status badge
├── QuestionEditor.tsx             // Single question editor (text, category, depth, follow-up toggle)
├── QuestionList.tsx               // Sortable list of questions with drag & drop reorder
├── CriteriaEditor.tsx             // Criterion name + description + weight slider
├── CriteriaList.tsx               // List of criteria with weight validation
│                                  //   Validate: Math.abs(sum - 1.0) < 0.001, not === 1.0
│                                  //   (0.30+0.20+0.25+0.15+0.10 = 1.0000000000000002 in JS)
├── ResumeUploader.tsx             // Drag & drop resume upload with preview
├── ResumeParsedView.tsx           // Displays extracted resume data (skills, experience, education)
├── EvaluationReport.tsx           // The full evaluation view (scores, charts, recommendations)
├── ScoreBar.tsx                   // Single criterion score bar (colored fill, label, score)
├── QABreakdown.tsx                // Question-answer pair view for transcript review
├── InterviewProgress.tsx          // Live progress indicator (current question, time remaining)
└── DecisionForm.tsx               // Hire/No Hire radio + notes textarea + save
```

### 7.4 New Store

Added to `src/app/store/index.ts`:

```typescript
interface InterviewStore {
  interviews: Interview[]
  currentInterview: Interview | null
  loading: boolean
  statusFilter: InterviewStatus | null

  setInterviews: (interviews: Interview[]) => void
  setCurrentInterview: (interview: Interview | null) => void
  addInterview: (interview: Interview) => void
  updateInterview: (interviewId: string, updates: Partial<Interview>) => void
  removeInterview: (interviewId: string) => void
  setLoading: (loading: boolean) => void
  setStatusFilter: (status: InterviewStatus | null) => void
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  interviews: [],
  currentInterview: null,
  loading: false,
  statusFilter: null,
  // ... standard setters
}))
```

### 7.5 New API Functions

Added to `src/services/api/index.ts`:

```typescript
// ── Interview CRUD ──
createInterview(orgId: string, data: CreateInterviewRequest): Promise<Interview>
listInterviews(orgId: string, filters?: { status?: InterviewStatus }): Promise<Interview[]>
getInterview(orgId: string, interviewId: string): Promise<Interview>
updateInterview(orgId: string, interviewId: string, data: Partial<Interview>): Promise<Interview>
deleteInterview(orgId: string, interviewId: string): Promise<void>

// ── Interview Actions ──
startInterview(orgId: string, interviewId: string): Promise<{ bot_id: string; session_id: string }>
cancelInterview(orgId: string, interviewId: string): Promise<void>

// ── Resume ──
uploadInterviewResume(orgId: string, interviewId: string, file: File): Promise<ResumeData>

// ── Evaluation ──
getInterviewEvaluation(orgId: string, interviewId: string): Promise<InterviewEvaluation>
rerunEvaluation(orgId: string, interviewId: string, criteria?: EvaluationCriterion[]): Promise<InterviewEvaluation>

// ── Decision ──
recordDecision(orgId: string, interviewId: string, decision: string, notes?: string): Promise<void>

// ── Question Generation ──
generateInterviewQuestions(orgId: string, data: GenerateQuestionsRequest): Promise<InterviewQuestion[]>
```

---

## 8. WebSocket Protocol Changes

The existing WebSocket protocol is extended with interview-specific events. All existing events (`transcript_delta`, `ai_status`, `ai_response`, `error`, `pong`) remain unchanged.

### New Inbound Events (Server → Frontend)

```typescript
// Interview progress update (sent every time question changes or periodically for time)
{
  type: 'interview_progress',
  payload: {
    interview_id: string
    phase: 'intro' | 'questions' | 'candidate_questions' | 'closing' | 'ended'
    current_question_index: number    // 0-based
    total_questions: number
    time_remaining_seconds: number
    time_elapsed_seconds: number
  }
}

// Interview state change
{
  type: 'interview_state',
  payload: {
    interview_id: string
    status: InterviewStatus
    message?: string                  // "Evaluation complete" etc.
  }
}
```

### How the frontend uses these

The interview detail page (when viewing a live interview) subscribes to the same WebSocket as the meeting. It uses `interview_progress` to show a live progress bar and `interview_state` to know when the evaluation is ready.

For the MVP, the hiring manager doesn't need to be in the Google Meet — they can watch the live transcript on the Lira dashboard. The WebSocket already broadcasts `transcript_delta` events for the entire session, so the detail page simply renders them.

---

## 9. Interview Modes — Deep Dive

### Solo Mode

```
WHO SPEAKS                  RESPONSIBILITY
─────────────────           ──────────────────────────────────
Lira                        Controls entire interview flow
                            Introduces itself
                            Asks all questions
                            Handles follow-ups
                            Manages time
                            Closes the interview

Candidate                   Answers questions
                            Asks clarifying questions
                            Asks questions about the role/company

Human interviewer            NOT PRESENT (or present but silent)
```

**Context Manager behavior in Solo Mode:**

- `should_respond = true` after every candidate answer completion
- Lira always knows what to say next (next question, follow-up, or transition)
- No wake word detection needed — Lira proactively speaks
- Exception: If candidate asks a question mid-answer, Lira answers it, then returns to the interview flow

### Copilot Mode

```
WHO SPEAKS                  RESPONSIBILITY
─────────────────           ──────────────────────────────────
Human interviewer            Leads the interview
                            Asks their own questions
                            Makes the candidate comfortable

Lira                        Listens throughout
                            When triggered ("Lira, your turn"):
                              Asks questions from its list
                              Focuses on gaps the human didn't cover
                            Can be asked specific questions by the human:
                              "Lira, what do you think about that answer?"
                            Goes silent again when human takes over:
                              "Thanks Lira, I'll take it from here"

Candidate                   Answers questions from both
```

**Context Manager behavior in Copilot Mode:**

- `should_respond = false` by default
- Trigger phrases activate Lira: "Lira, go ahead" / "Lira, your turn" / "Lira, ask your questions"
- Once activated, Lira behaves like Solo mode for its question set
- Deactivation phrases: "Thanks Lira" / "I'll take over" / natural handoff
- Lira tracks which topics the human already covered to avoid repetition

### Shadow Mode

```
WHO SPEAKS                  RESPONSIBILITY
─────────────────           ──────────────────────────────────
Human interviewer            Conducts the entire interview

Candidate                   Answers questions

Lira                        SILENT the entire time
                            Records everything
                            After the interview: generates evaluation
                            Evaluates based on what it heard
```

**Context Manager behavior in Shadow Mode:**

- `should_respond = false` ALWAYS — no exceptions
- Lira doesn't even need TTS — only STT for transcription
- Still tracks Q&A pairs from the human interviewer's questions
- Evaluation uses the same engine as Solo/Copilot

**Shadow mode join statement:**
When the bot joins in Shadow mode, it delivers a single pre-scripted automated message, then goes permanently silent:

> _"Hi, I'm Lira. I'll be observing this interview and won't be participating — please ignore me."_

This is a hardcoded string triggered on bot join — not AI-generated. After this message, `should_respond = false` for the remainder of the session. This statement serves a legal disclosure function: some jurisdictions require disclosure of AI observers in conversations. Without it, a named participant who never speaks for 60 minutes confuses and distracts the candidate.

---

## 10. Evaluation System

### Scoring Methodology

Each criterion is scored independently on a 0-100 scale by a separate Nova 2 Lite call. This ensures each dimension gets focused attention.

**Per-criterion prompt template:**

> **Pre-processing (bias mitigation):** Before passing transcript data to any per-criterion scoring call, replace all occurrences of `{candidate_name}` with `[Candidate]` in both the Q&A pairs and the resume text. The actual candidate name is only re-introduced in the final overall assessment synthesis step. This is a hard requirement for EU AI Act compliance and EEOC guidance on AI hiring tools — name-based pattern matching is a documented source of demographic bias in LLMs, and the instruction "score on demonstrated competence" in the prompt is insufficient protection on its own.

```
You are an expert interview evaluator specializing in assessing
"{criterion_name}" — defined as: "{criterion_description}".

You are evaluating a candidate for the role: {job_title}
Job description: {job_description}
Required skills: {required_skills}

Below is the interview transcript, structured as Q&A pairs.
The candidate's name has been replaced with [Candidate] throughout:
{structured_qa_pairs_anonymized}

{if resume_available}
Candidate's resume for context (name anonymized):
{resume_parsed_text_anonymized}
{end if}

Score the candidate from 0-100 on "{criterion_name}" only.

Respond in this exact JSON format:
{
  "score": <number 0-100>,
  "evidence": [<2-4 direct quotes from the transcript that support your score>],
  "reasoning": "<2-3 sentences explaining your score>"
}

Scoring guide:
- 90-100: Exceptional — clearly exceeds expectations for a {experience_level_label} candidate
- 75-89: Strong — meets or slightly exceeds expectations
- 60-74: Adequate — meets minimum expectations, some gaps
- 40-59: Below expectations — significant gaps
- 0-39: Poor — does not meet requirements
```

> **Note on `{experience_level_label}`:** Map the enum before injection: `junior → "junior-level"`, `mid → "mid-level"`, `senior → "senior-level"`, `lead → "lead-level"`, `principal → "principal-level"`. The phrase "a mid-level candidate" reads naturally in a sentence; "a mid candidate" does not.

**Overall assessment prompt:**

```
You are a senior hiring evaluator. You have scored a candidate across
multiple criteria. Now synthesize an overall assessment.

Role: {job_title}
Candidate: {candidate_name}

Per-criterion scores:
{for each criterion}
- {criterion_name} ({weight}%): {score}/100
  Evidence: {evidence}
  Reasoning: {reasoning}
{end for}

Overall weighted score: {calculated_weighted_average}/100

Provide your overall assessment in this JSON format:
{
  "recommendation": "strongly_recommend" | "recommend" | "neutral" | "not_recommended",
  "recommendation_reasoning": "<2-3 paragraphs>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "notable_quotes": [
    { "quote": "<exact quote>", "context": "<what question>", "sentiment": "positive|neutral|negative" }
  ],
  "candidate_engagement": "high" | "moderate" | "low"
}
```

### Q&A Pair Extraction

Turning a flat transcript into structured Q&A pairs:

```
Raw transcript:
  [Lira] Can you walk me through a system you designed for high concurrency?
  [Jane] Sure. At my previous company, we had a real-time bidding system...
  [Jane] ... so we ended up using a combination of Redis pub/sub and...
  [Jane] ... and that's basically how we handled the concurrency issue.
  [Lira] Interesting. What was the peak throughput you achieved?
  [Jane] We were handling about 50 thousand requests per second...

Structured output:
  Q1: "Can you walk me through a system you designed for high concurrency?"
  A1: "Sure. At my previous company, we had a real-time bidding system...
       so we ended up using a combination of Redis pub/sub and... and that's
       basically how we handled the concurrency issue."
  Duration: 2m 15s

  Follow-up Q1.1: "What was the peak throughput you achieved?"
  Follow-up A1.1: "We were handling about 50 thousand requests per second..."
  Duration: 45s
```

This extraction is done by the backend after the interview ends. It uses the transcript messages (which already have `speaker` and `timestamp` fields) to correlate questions with answers.

---

## 11. System Prompt Engineering

> **Model ID note:** This spec uses "Nova 2 Lite" and "Nova 2 Sonic" as shorthand. Before implementation, verify the exact Amazon Bedrock model identifiers against those already in the codebase (e.g., `amazon.nova-sonic-v1:0`). "Nova 2" may not be a separate registered Bedrock model identifier — use the same model IDs already configured in `lira-org.routes.ts` and the Context Manager. Do not introduce new IDs without confirming Bedrock availability.

### Solo Mode System Prompt

```
You are Lira, an AI interviewer conducting a job interview on behalf of
{org_name}. You are interviewing {candidate_name} for the role of {job_title}.

ABOUT THE COMPANY:
{org_profile.description}
Industry: {org_profile.industry}
Culture: {org_profile.culture.communication_style}
Values: {org_profile.culture.values}

ABOUT THE ROLE:
{job_description}
Required skills: {required_skills}
Experience level: {experience_level}

{if resume_available}
CANDIDATE BACKGROUND (from resume):
{resume_parsed_summary}
Key skills: {resume_parsed.skills}
Recent experience: {resume_parsed.experience[0].company} - {resume_parsed.experience[0].role}
{end if}

YOUR INTERVIEW STYLE:
- Personality: {personality} (supportive/challenger/facilitator/analyst)
- Be warm but professional
- Acknowledge answers before moving on ("That's a great point" / "Interesting approach")
- Ask follow-up questions when answers are vague or interesting
- Use the candidate's name occasionally
- If the candidate asks about the company, answer based on the company info above
- Never reveal that you are evaluating or scoring them during the interview
- If a candidate seems nervous, be more encouraging
- If a candidate gives overly brief answers, probe deeper

INTERVIEW STRUCTURE:
You must follow this sequence:
1. INTRODUCTION: Introduce yourself, explain you're conducting this interview on
   behalf of {org_name}, explain the format (approximately {time_limit} minutes,
   {total_questions} questions, time for their questions at the end)
2. WARM-UP: Start with an easy question to build comfort
3. CORE QUESTIONS: Ask the following questions IN ORDER. You may ask up to 2
   follow-up questions per answer if the answer is vague or you want more depth.
   {numbered_question_list}
4. CANDIDATE QUESTIONS: Ask "Do you have any questions about the role or {org_name}?"
   Answer their questions honestly based on the company information provided.
5. CLOSING: Thank them for their time, explain next steps ("The hiring team will
   review and get back to you"), say goodbye.

CURRENT STATE:
Phase: {current_phase}
Current question: {current_question_index + 1} of {total_questions}
Time remaining: {time_remaining}
{if time_remaining < 5 min}
NOTE: Time is running short. Skip to closing after this answer.
{end if}

IMPORTANT:
- NEVER make up information about the company that isn't in the provided context
- NEVER promise salary, benefits, or specific outcomes
- NEVER skip straight to evaluation or scoring language
- Keep your responses concise — this is a conversation, not a monologue
- If the candidate goes off-topic, gently redirect: "That's interesting — let me
  bring us back to..."
```

### Copilot Mode System Prompt

The same as Solo, but with these additions:

```
YOUR ROLE IN THIS INTERVIEW:
You are the CO-INTERVIEWER, not the lead. A human interviewer is leading the
conversation. You should:
- Stay SILENT unless explicitly called upon
- When activated (someone says "Lira, your turn" or similar), ask your questions
- Focus on topics the human interviewer hasn't covered yet
- Keep your segment shorter — you're supplementing, not replacing
- When done with your questions, hand back: "Those are my questions.
  [Human name], back to you."

TOPICS ALREADY COVERED BY HUMAN:
{list of topics/skills the human's questions touched on — inferred from transcript}
```

---

## 12. Bot Deployment for Interviews

The existing bot deployment system sends a Puppeteer-controlled browser to join a Google Meet. For interviews, we extend the deploy request with interview metadata.

### Modified Deploy Request

```json
// Existing deploy request
{
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "platform": "google_meet",
  "display_name": "Lira AI"
}

// Extended for interviews
{
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "platform": "google_meet",
  "display_name": "Lira AI - Interviewer",
  "meeting_type": "interview",
  "interview_id": "int_a1b2c3d4",
  "org_id": "org_xyz"
}
```

### What `meeting_type: "interview"` triggers on the backend

1. **Meeting creation**: The backend creates a meeting record with `type: "interview"` and links it to the interview record via `interview_id`
2. **Context Manager initialization**: Loads the interview configuration (questions, criteria, mode, time limit) into the Context Manager instead of normal meeting context
3. **System prompt routing**: The AI Response Generator uses the interview system prompt instead of the default meeting prompt
4. **Timer**: A background timer tracks time remaining and sends `interview_progress` events
5. **Auto-end**: When time expires, Lira says a closing statement and the bot gracefully leaves
6. **Post-meeting trigger**: When the bot leaves, the backend automatically triggers the Evaluation Engine instead of just generating a meeting summary

---

## 13. File Structure

### Backend (Fastify — `/creovine-api`)

```
src/
├── routes/
│   └── lira-interview.routes.ts      // All interview REST endpoints
├── services/
│   └── lira-interview.service.ts     // Interview CRUD, evaluation orchestration
├── prompts/
│   ├── interview-solo.prompt.ts      // Solo mode system prompt builder
│   ├── interview-copilot.prompt.ts   // Copilot mode system prompt builder
│   ├── interview-evaluator.prompt.ts // Per-criterion evaluation prompt
│   └── interview-overall.prompt.ts   // Overall assessment prompt
└── utils/
    ├── resume-parser.ts              // PDF → structured data
    └── qa-extractor.ts               // Flat transcript → Q&A pairs
```

### Frontend (React — `/lira_ai`)

```
src/
├── pages/
│   ├── InterviewsPage.tsx
│   ├── InterviewCreatePage.tsx
│   ├── InterviewDetailPage.tsx
│   └── InterviewEditPage.tsx
├── components/
│   └── interview/
│       ├── index.ts
│       ├── InterviewCard.tsx
│       ├── InterviewStatusBadge.tsx
│       ├── QuestionEditor.tsx
│       ├── QuestionList.tsx
│       ├── CriteriaEditor.tsx
│       ├── CriteriaList.tsx
│       ├── ResumeUploader.tsx
│       ├── ResumeParsedView.tsx
│       ├── EvaluationReport.tsx
│       ├── ScoreBar.tsx
│       ├── QABreakdown.tsx
│       ├── InterviewProgress.tsx
│       └── DecisionForm.tsx
├── features/
│   └── interview/
│       ├── index.ts
│       └── use-interview.ts          // Hook for interview page logic
├── services/
│   └── api/
│       └── index.ts                  // (extend with interview API functions)
├── app/
│   ├── store/
│   │   └── index.ts                  // (extend with useInterviewStore)
│   └── router/
│       └── index.ts                  // (extend with interview routes)
└── types/
    └── index.ts                      // (extend with interview types)
```

---

## 14. Database Schema (DynamoDB)

### Table: `lira-interviews`

| Key    | Type                 | Description                   |
| ------ | -------------------- | ----------------------------- |
| **PK** | `ORG#{org_id}`       | Partition key — org isolation |
| **SK** | `INT#{interview_id}` | Sort key — interview record   |

### GSI: `interview-status-index`

| Key    | Type                              | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| **PK** | `ORG#{org_id}`                    | Same partition                 |
| **SK** | `STATUS#{status}#TS#{created_at}` | Filter by status, sort by date |

### GSI: `interview-session-index`

| Key    | Type                   | Description                    |
| ------ | ---------------------- | ------------------------------ |
| **PK** | `SESSION#{session_id}` | Link from meeting to interview |
| **SK** | `INT#{interview_id}`   | The interview record           |

This allows:

- **List all interviews for org** → Query PK = `ORG#xyz`
- **Filter by status** → Query GSI `interview-status-index` with SK prefix `STATUS#completed`
- **Find interview for a meeting session** → Query GSI `interview-session-index` with PK = `SESSION#abc`

> **Constraint:** `session_id` is only populated when the bot is deployed (`status: "bot_deployed"`). Draft and scheduled interviews have `session_id: null` and will **not** appear in `interview-session-index`. This is intentional — this GSI is used exclusively by the bot manager at runtime to correlate an active meeting session with its interview config. Never query it for pre-deployment lookups; use the primary key or `interview-status-index` instead.

---

## 15. Security Considerations

### Access Control

- **Create/edit/delete interviews**: Requires `owner` or `admin` role in the org
- **View interviews**: All org members can view
- **Record decision**: Requires `owner` or `admin` role
- **Start interview (deploy bot)**: Requires `owner` or `admin` role

**Rate limiting:**

- `POST /orgs/{orgId}/interviews/{interviewId}/evaluate` (re-run evaluation): Maximum **3 re-evaluations per interview**. Enforced at the service layer by checking a `re_evaluation_count` field on the Interview record. Returns `429 Too Many Requests` with message: _"Evaluation re-run limit reached (3/3) for this interview."_ This prevents cost amplification — each re-run triggers 5+ parallel Nova Lite calls.
- Per-org soft limit: 50 total evaluation runs per org per day (configurable), with an alert at 80% usage.

### Candidate Data

- Resumes are stored in S3 with server-side encryption (AES-256)
- Resume data is only used for question generation and evaluation context — never exposed to other candidates or orgs
- Email addresses are used only for scheduling; never shared externally
- Interview evaluations are internal documents — never sent to candidates

### Evaluation Fairness

- The evaluation prompt explicitly instructs the AI to score based on demonstrated competence, not demographic signals
- All candidates for the same role are evaluated against the same criteria and weights
- The system should include a disclaimer: "AI evaluations are tools to assist human decision-making. They should not be used as the sole basis for hiring decisions."

### Data Retention

- Default retention: **2 years** from interview completion date
- `notable_quotes` in the evaluation contain exact transcript excerpts. These are legally sensitive artifacts — they are stored as-is and subject to the same deletion request process as all candidate data
- Candidates can request deletion of their data (GDPR Article 17 / CCPA). Deletion scope: resume file (S3), `candidate_resume_parsed`, `candidate_email`, audio recording, `notable_quotes`. The anonymized interview record (scores, decision, job title, criteria results) may be retained in anonymized form for audit purposes per the org's legal obligations
- Orgs can configure a shorter retention period (30 days, 90 days, 1 year) in org settings
- Retention expiry is enforced by a scheduled Lambda job
- **The default must be documented in the privacy policy:** _"AI interview evaluations, including candidate responses and assessments, are retained for 2 years unless you request deletion or your organization configures a shorter period."_

---

## 16. Implementation Plan

### Sprint 1 (Week 1-2): Backend Foundation

| Task                              | Details                                              |
| --------------------------------- | ---------------------------------------------------- |
| DynamoDB table: `lira-interviews` | Create table with GSIs                               |
| Interview CRUD endpoints          | POST, GET, PUT, DELETE with validation               |
| Interview types & validation      | Zod schemas for all request/response types           |
| Generate questions endpoint       | Nova 2 Lite call with JD + skills → questions        |
| Resume upload + parsing           | Extend document upload, PDF parsing, Nova extraction |
| Unit tests for CRUD               | Basic test coverage                                  |

### Sprint 2 (Week 3-4): Interview-Aware Meeting Pipeline

| Task                                  | Details                                                         |
| ------------------------------------- | --------------------------------------------------------------- |
| Extend bot deploy with `meeting_type` | Pass interview metadata to meeting creation                     |
| Interview Context Manager             | Interview state tracking, question flow logic, phase management |
| Interview system prompts              | Solo + Copilot prompt templates, dynamic variable injection     |
| Response Generator routing            | Detect interview session → use interview prompt                 |
| Interview-specific WS events          | `interview_progress`, `interview_state` events                  |
| Timer + auto-end                      | Background timer, closing trigger, bot leave                    |
| Integration test: full interview      | Deploy bot → conduct 3-question interview → transcript saved    |

### Sprint 3 (Week 5-6): Evaluation Engine

| Task                         | Details                                            |
| ---------------------------- | -------------------------------------------------- |
| Q&A pair extractor           | Transcript → structured Q&A grouping               |
| Per-criterion scorer         | Parallel Nova 2 Lite calls with evaluation prompts |
| Overall assessment generator | Synthesis prompt, recommendation logic             |
| Evaluation persistence       | Save to DynamoDB, update interview status          |
| Evaluation re-run            | Support re-evaluation with modified criteria       |
| Evaluation API endpoint      | GET evaluation, POST re-run                        |
| Test evaluation quality      | Run against 5 mock transcripts, tune prompts       |

### Sprint 4 (Week 7-8): Frontend

| Task                                  | Details                                             |
| ------------------------------------- | --------------------------------------------------- |
| Interview routes + navigation         | Add to router, sidebar nav, org menu                |
| InterviewsPage (list view)            | List with status filters, cards, action buttons     |
| InterviewCreatePage (multi-step form) | 6-step form with validation, AI question generation |
| InterviewDetailPage (evaluation view) | Scores, charts, recommendation, transcript tabs     |
| Interview components                  | All components from Section 7.3                     |
| Zustand store + API functions         | useInterviewStore + API service layer               |
| Live interview view                   | WebSocket subscription for progress + transcript    |
| Polish + edge cases                   | Loading states, error handling, empty states        |

### Sprint 5 (Week 9): Testing & Launch

| Task                        | Details                                                     |
| --------------------------- | ----------------------------------------------------------- |
| End-to-end test             | Create interview → deploy bot → conduct → evaluate → review |
| Prompt tuning               | Adjust interview prompts based on real testing              |
| Evaluation accuracy testing | Compare AI evaluations to human evaluations                 |
| Bug fixes and polish        | Address issues from testing                                 |
| Documentation               | API docs, user guide                                        |
| Deploy to production        | Backend + frontend                                          |

---

## 17. Open Questions

These need to be decided before or during implementation:

| #   | Question                                                                                                                       | Options                                                                                         | Recommendation                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Should Lira handle candidate **scheduling** (send email, propose times) in this phase, or just use a pre-set Google Meet link? | A) Pre-set link only (simpler) B) Full scheduling with candidate email flow                     | **A for Phase 1.** No email integration needed for MVP.                                                                                                                                                                                                    |
| 2   | Should interviews support **video analysis** (facial expressions, body language) or voice-only?                                | A) Voice-only (use existing audio pipeline) B) Add video analysis                               | **A.** Video analysis is a massive scope increase with privacy concerns.                                                                                                                                                                                   |
| 3   | How do we handle **multiple interviewers** in Copilot mode?                                                                    | A) Only one human interviewer recognized B) Multiple humans, Lira identifies each               | **A for MVP.** Note: Nova Sonic already returns speaker labels in `transcript_delta` events — the audio pipeline for multi-interviewer support is partially in place. The gap is prompt logic, not the pipeline. B is a realistic Phase 2 addition.        |
| 4   | Should the evaluation include a **comparison** to other candidates for the same role?                                          | A) Each evaluation is standalone B) Comparative ranking across candidates                       | **A first, add B later.**                                                                                                                                                                                                                                  |
| 5   | Should we support **Zoom** interviews from day one, or Google Meet only?                                                       | A) Google Meet only (existing bot) B) Both                                                      | **Can support both if bot already handles Zoom.**                                                                                                                                                                                                          |
| 6   | Where should interview question **templates** come from?                                                                       | A) AI-generated only B) Curated templates per role category + AI                                | **B.** Launch with 6 role categories: Engineering, Design, Product, Sales, Operations, General. Store templates as data (not hardcoded) to enable AI refresh or admin edits without a deploy. Template maintenance is ongoing — version them from day one. |
| 7   | Should Shadow mode interviews show up as **regular meetings** to the candidate?                                                | A) Yes — candidate doesn't know Lira is evaluating B) Lira is visibly in the meeting but silent | **B.** Some jurisdictions require disclosure. Lira is visible but silent.                                                                                                                                                                                  |

---

_Ready for review. Once approved, we begin with Sprint 1: Backend Foundation._

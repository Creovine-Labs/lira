# Lira AI — Interview Product: Complete Documentation

**Version:** 1.0
**Date:** June 2025
**Purpose:** Everything a frontend developer needs to build the standalone interview product

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Interview Lifecycle](#2-interview-lifecycle)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Data Model — Complete Type System](#4-data-model--complete-type-system)
   - [4.1 Enums & Literal Types](#41-enums--literal-types)
   - [4.2 Interview (main entity)](#42-interview-main-entity)
   - [4.3 InterviewQuestion](#43-interviewquestion)
   - [4.4 InterviewEvaluation](#44-interviewevaluation)
   - [4.5 QASummary](#45-qasummary)
   - [4.6 ResumeData](#46-resumedata)
   - [4.7 EvaluationCriterion](#47-evaluationcriterion)
   - [4.8 InterviewDraft](#48-interviewdraft)
   - [4.9 CreateInterviewInput](#49-createinterviewinput)
   - [4.10 UpdateInterviewInput](#410-updateinterviewinput)
   - [4.11 GenerateQuestionsInput](#411-generatequestionsinput)
5. [REST API — All Endpoints](#5-rest-api--all-endpoints)
   - [5.1 AI Draft Interview](#51-ai-draft-interview)
   - [5.2 Generate Questions](#52-generate-questions)
   - [5.3 Create Interview](#53-create-interview)
   - [5.4 List Interviews](#54-list-interviews)
   - [5.5 Get Interview Detail](#55-get-interview-detail)
   - [5.6 Get Related Interviews (Rounds)](#56-get-related-interviews-rounds)
   - [5.7 Update Interview](#57-update-interview)
   - [5.8 Delete Interview](#58-delete-interview)
   - [5.9 Start Interview (Deploy Bot)](#59-start-interview-deploy-bot)
   - [5.10 Cancel Interview](#510-cancel-interview)
   - [5.11 Rejoin Interview](#511-rejoin-interview)
   - [5.12 Upload Resume](#512-upload-resume)
   - [5.13 Run Evaluation (Re-evaluate)](#513-run-evaluation-re-evaluate)
   - [5.14 Generate Overall Score](#514-generate-overall-score)
   - [5.15 Record Decision](#515-record-decision)
6. [Interview Creation Flow](#6-interview-creation-flow)
   - [6.1 Phase 1: AI Draft from Prompt](#61-phase-1-ai-draft-from-prompt)
   - [6.2 Phase 2: Review & Customize Form](#62-phase-2-review--customize-form)
   - [6.3 Resume Upload During Creation](#63-resume-upload-during-creation)
   - [6.4 Question Generation](#64-question-generation)
   - [6.5 Edit Mode & Follow-up Rounds](#65-edit-mode--follow-up-rounds)
7. [Interview Modes](#7-interview-modes)
8. [AI Personality Types](#8-ai-personality-types)
9. [Bot Deployment & Runtime](#9-bot-deployment--runtime)
   - [9.1 How the Bot Joins a Meeting](#91-how-the-bot-joins-a-meeting)
   - [9.2 Candidate Name Resolution](#92-candidate-name-resolution)
   - [9.3 Interview Conduct (The AI Prompt)](#93-interview-conduct-the-ai-prompt)
   - [9.4 Question Tracking & Deduplication](#94-question-tracking--deduplication)
   - [9.5 Auto-Leave Detection](#95-auto-leave-detection)
   - [9.6 Session Recovery (Reconnection)](#96-session-recovery-reconnection)
   - [9.7 No-Show Handling](#97-no-show-handling)
10. [Evaluation Pipeline](#10-evaluation-pipeline)
    - [10.1 Phase 1: Automatic Q&A Evaluation](#101-phase-1-automatic-qa-evaluation)
    - [10.2 Phase 2: Overall Score (On-Demand)](#102-phase-2-overall-score-on-demand)
    - [10.3 Re-Evaluation](#103-re-evaluation)
11. [Decision Recording](#11-decision-recording)
12. [Multi-Round Interviews](#12-multi-round-interviews)
13. [Scheduling & Auto-Deployment](#13-scheduling--auto-deployment)
14. [Real-Time Events (WebSocket)](#14-real-time-events-websocket)
15. [Frontend Architecture Reference](#15-frontend-architecture-reference)
    - [15.1 Routes](#151-routes)
    - [15.2 Pages & Their Responsibilities](#152-pages--their-responsibilities)
    - [15.3 State Management](#153-state-management)
    - [15.4 API Service Layer](#154-api-service-layer)
    - [15.5 Polling Patterns](#155-polling-patterns)
16. [Database Schema](#16-database-schema)
17. [Currencies & Salary Display](#17-currencies--salary-display)
18. [Multi-Language Support](#18-multi-language-support)
19. [Beta Limits](#19-beta-limits)
20. [Notifications](#20-notifications)
21. [Error Codes](#21-error-codes)

---

## 1. Product Overview

The Interview product is an AI-powered interviewer that autonomously conducts job interviews via Google Meet. The system:

1. **Creates** interview configurations with AI-generated questions tailored to the role
2. **Deploys** a Chromium-based bot that joins a Google Meet call as "Lira AI"
3. **Conducts** the interview using bidirectional real-time audio (Amazon Nova Sonic)
4. **Evaluates** the candidate automatically with per-question scoring and an overall recommendation
5. **Records** hiring decisions with notes

The interview feature is built on top of Lira's existing meeting infrastructure — the same bot, audio pipeline, and WebSocket transport — with a specialized interview context layer that controls the AI's behavior.

---

## 2. Interview Lifecycle

Every interview moves through these statuses in order:

```
draft → scheduled → bot_deployed → in_progress → evaluating → completed
                                                              ↘ cancelled (at any point)
```

| Status         | Description                                                                                | Transitions To                           |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `draft`        | Interview created but not yet scheduled or started. Can still be edited.                   | `scheduled`, `bot_deployed`, `cancelled` |
| `scheduled`    | Has a `scheduled_at` datetime. The scheduler will auto-deploy the bot when the time comes. | `bot_deployed`, `cancelled`              |
| `bot_deployed` | Bot has been launched and is joining/in the Google Meet call.                              | `in_progress`, `cancelled`               |
| `in_progress`  | Candidate has spoken — the interview is actively happening.                                | `evaluating`, `cancelled`                |
| `evaluating`   | Interview ended, evaluation is being generated by AI.                                      | `completed`                              |
| `completed`    | Evaluation is ready. Decision can be recorded.                                             | (terminal)                               |
| `cancelled`    | Interview was cancelled or candidate was a no-show.                                        | Can be restarted via `rejoin`            |

**Status transitions are enforced server-side.** The frontend should enable/disable buttons based on current status.

### Key Rules:

- An interview can only be **edited** in `draft` or `scheduled` status
- An interview can only be **started** from `draft` or `scheduled` status
- An interview can only be **deleted** if NOT `in_progress`
- **Rejoin** works from `cancelled`, `bot_deployed`, `scheduled`, or `draft`
- **Evaluation** runs automatically when the bot leaves after a real interview
- **Re-evaluation** is limited to 3 times (admin-only)

---

## 3. Authentication & Authorization

All interview API endpoints require a JWT Bearer token.

```
Authorization: Bearer <jwt_token>
```

**Token storage:** `localStorage` key `lira_token`

**Auth flow:**

1. User logs in via Google OAuth or email/password → receives JWT
2. JWT is included in every API request via `Authorization` header
3. On 401 response → clear token, dispatch `lira:auth-expired` custom event, redirect to login

**Organization context:** All interview endpoints are scoped to an organization:

```
/lira/v1/orgs/{orgId}/interviews/...
```

The `orgId` comes from the user's current organization selection (stored in `useOrgStore`).

**Role-based access:**

- Creating interviews requires org membership
- Re-evaluation requires `ADMIN` or `SUPER_ADMIN` role
- All other operations require org membership

---

## 4. Data Model — Complete Type System

### 4.1 Enums & Literal Types

```typescript
type InterviewStatus =
  | 'draft'
  | 'scheduled'
  | 'bot_deployed'
  | 'in_progress'
  | 'evaluating'
  | 'completed'
  | 'cancelled'
  | 'no_show'

type InterviewMode = 'solo' | 'copilot' | 'shadow'

type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal'

type QuestionCategory =
  | 'technical'
  | 'behavioral'
  | 'situational'
  | 'cultural'
  | 'warm_up'
  | 'custom'

type InterviewPersonality = 'supportive' | 'challenger' | 'facilitator' | 'analyst'

type QuestionGenMethod = 'manual' | 'ai_generated' | 'hybrid'

type DecisionOutcome = 'hire' | 'no_hire' | 'next_round' | 'undecided'

type InterviewPurpose =
  | 'introduction'
  | 'technical'
  | 'cultural_fit'
  | 'system_design'
  | 'behavioral'
  | 'panel'
  | 'final'
  | 'onboarding'
  | 'alignment'
  | 'custom'
```

### 4.2 Interview (main entity)

```typescript
interface Interview {
  // ── Identifiers ─────────────────────────
  interview_id: string // UUID
  org_id: string // Organization ID
  created_by: string // User ID of creator

  // ── Follow-up / Round Tracking ──────────
  parent_interview_id?: string // Links to first round's ID
  round: number // 1 = first round, 2 = second, etc.
  interview_purpose?: InterviewPurpose
  custom_purpose?: string // Free text when purpose is 'custom'

  // ── Job Details ─────────────────────────
  title: string // Role title (e.g. "Senior Backend Engineer")
  department?: string
  job_description: string
  required_skills: string[] // e.g. ["TypeScript", "AWS", "DynamoDB"]
  experience_level: ExperienceLevel

  // ── Salary (structured) ─────────────────
  salary_range?: string // Display string (e.g. "$120k–$150k")
  salary_currency?: string // ISO code: "USD", "EUR", "RWF", etc.
  salary_min?: number // Numeric min (e.g. 120000)
  salary_max?: number // Numeric max (e.g. 150000)

  // ── Candidate ───────────────────────────
  candidate_name: string // Can be empty string if unknown
  candidate_email: string // Can be empty string

  // ── Configuration ───────────────────────
  mode: InterviewMode
  meeting_link: string // Google Meet URL
  session_id?: string // Lira session ID when bot is active
  scheduled_at?: string // ISO-8601 datetime for auto-deploy
  started_at?: string // ISO-8601 when interview actually began
  ended_at?: string // ISO-8601 when interview ended
  time_limit_minutes: number // 15–120 minutes
  personality: InterviewPersonality
  ai_name_override?: string // Custom name for AI (default: "Lira")
  no_show_timeout_seconds?: number
  language?: string // "en" | "fr" | "rw"

  // ── Questions ───────────────────────────
  questions: InterviewQuestion[]
  question_generation: QuestionGenMethod

  // ── Evaluation ──────────────────────────
  evaluation_criteria: EvaluationCriterion[]
  evaluation?: InterviewEvaluation // Populated after interview ends
  resume?: ResumeData // Populated after resume upload

  // ── Decision ────────────────────────────
  decision?: DecisionOutcome
  decision_notes?: string
  decision_made_by?: string // User ID
  decision_made_at?: string // ISO-8601

  // ── Status ──────────────────────────────
  status: InterviewStatus

  // ── Metadata ────────────────────────────
  created_at: string // ISO-8601
  updated_at: string // ISO-8601
}
```

### 4.3 InterviewQuestion

```typescript
interface InterviewQuestion {
  id: string // UUID, server-generated
  text: string // The actual question text
  category: QuestionCategory
  skill_target?: string // e.g. "TypeScript" or "Leadership"
  expected_depth: 'brief' | 'moderate' | 'detailed'
  follow_up_enabled: boolean
  order?: number // Display/ask order
  ai_generated?: boolean // true if AI created this question
  asked?: boolean // true if the AI actually asked it during interview
}
```

### 4.4 InterviewEvaluation

The evaluation is two-phase. Phase 1 runs automatically when the interview ends. Phase 2 is triggered on-demand by the user.

```typescript
interface InterviewEvaluation {
  // ── Phase 1: Auto-generated after interview ends ──────
  qa_summary: QASummary[] // Per-question scoring
  interview_summary: string // Neutral paragraph summary
  interview_duration_minutes: number
  questions_asked: number
  questions_answered: number
  questions_skipped: number
  generated_at: string // ISO-8601
  re_evaluation_count?: number // How many times re-evaluated (max 3)

  // ── Phase 2: On-demand (user clicks "Generate Score") ─
  overall_score: number | null // 0–100, null until generated
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommended' | null
  recommendation_reasoning: string | null
  strengths: string[] | null
  concerns: string[] | null
  notable_quotes:
    | {
        quote: string
        context: string
        sentiment: 'positive' | 'neutral' | 'negative'
      }[]
    | null
  candidate_engagement: 'high' | 'moderate' | 'low' | null
  score_generated_at: string | null // ISO-8601
}
```

### 4.5 QASummary

Each question asked during the interview gets a QASummary entry:

```typescript
interface QASummary {
  question: string // The question that was asked
  answer_summary: string // AI summary of the candidate's answer
  score: number // 0–100
  analysis: string // AI analysis of the answer quality
  key_points: string[] // Bullet points extracted from the answer
  answer_quality: 'excellent' | 'good' | 'adequate' | 'poor'
  follow_ups?: {
    question: string
    answer_summary: string
  }[]
}
```

**Score interpretation:**
| Range | Label | Meaning |
|-------|-------|---------|
| 90–100 | Exceptional | Exceeds expectations significantly |
| 75–89 | Strong | Clear understanding, good examples |
| 60–74 | Adequate | Basic understanding, room for improvement |
| 40–59 | Below expectations | Significant gaps |
| 0–39 | Poor | Major concerns |

### 4.6 ResumeData

```typescript
interface ResumeData {
  raw_text: string // Full extracted text from PDF
  parsed?: {
    skills: string[]
    experience: {
      role: string
      company: string
      duration_months?: number
      highlights: string[]
    }[]
    education: {
      degree: string
      institution: string
      year?: number
    }[]
    summary?: string
  }
  s3_key: string // S3 storage key
  filename: string // Original filename
  uploaded_at: string // ISO-8601
  parse_method: 'pdf_extract' | 'ai_extraction' | 'raw_text_only'
  parse_failed?: boolean
}
```

### 4.7 EvaluationCriterion

```typescript
interface EvaluationCriterion {
  id: string
  name: string // e.g. "Technical Skills"
  description: string
  weight: number // 0.0–1.0, all weights must sum to 1.0
}
```

**Default criteria** (auto-generated if not provided):
| Name | Weight |
|------|--------|
| Technical Skills | 0.30 |
| Communication | 0.25 |
| Experience Fit | 0.25 |
| Culture Fit | 0.20 |

### 4.8 InterviewDraft

Returned by the AI draft endpoint — a pre-filled interview ready for user review:

```typescript
interface InterviewDraft {
  title: string
  department: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  salary_range: string
  time_limit_minutes: number
  personality: InterviewPersonality
  mode: InterviewMode
  questions: Omit<InterviewQuestion, 'id' | 'ai_generated' | 'asked'>[]
  meeting_link: '' // Always empty — user must provide
  scheduled_at: '' // Always empty — user must set
  language?: string
}
```

### 4.9 CreateInterviewInput

```typescript
interface CreateInterviewInput {
  title: string // Required
  department?: string
  job_description: string // Required
  required_skills: string[] // Required, min 1
  experience_level: ExperienceLevel // Required
  salary_range?: string
  salary_currency?: string
  salary_min?: number
  salary_max?: number
  candidate_name?: string
  candidate_email?: string
  mode: InterviewMode // Required
  meeting_link?: string // Google Meet URL
  scheduled_at?: string // ISO-8601
  time_limit_minutes: number // Required, 15–120
  personality: InterviewPersonality // Required
  ai_name_override?: string
  no_show_timeout_seconds?: number
  parent_interview_id?: string // For follow-up rounds
  interview_purpose?: InterviewPurpose
  custom_purpose?: string
  questions?: Omit<InterviewQuestion, 'id' | 'ai_generated' | 'asked'>[]
  question_generation: QuestionGenMethod // Required
  evaluation_criteria?: Omit<EvaluationCriterion, 'id'>[] // Weights must sum to 1.0
  language?: string // "en" | "fr" | "rw"
}
```

### 4.10 UpdateInterviewInput

```typescript
type UpdateInterviewInput = Partial<Omit<CreateInterviewInput, 'candidate_email'>>
```

Note: `candidate_email` cannot be changed after creation.

### 4.11 GenerateQuestionsInput

```typescript
interface GenerateQuestionsInput {
  title: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  resume_text?: string // Include for personalized questions
  question_count?: number // 1–20
  categories: QuestionCategory[]
  language?: string
}
```

---

## 5. REST API — All Endpoints

**Base URL:** `{API_URL}/lira/v1/orgs/{orgId}/interviews`

All endpoints require `Authorization: Bearer <jwt_token>` header.

### 5.1 AI Draft Interview

**`POST /lira/v1/orgs/{orgId}/interviews/draft`**

Generate a complete interview configuration from a free-form text prompt.

**Request:**

```json
{
  "prompt": "I need to interview a senior backend engineer with 5+ years Node.js and AWS experience for our fintech platform"
}
```

**Response:**

```json
{
  "draft": {
    "title": "Senior Backend Engineer",
    "department": "Engineering",
    "job_description": "We are looking for a senior backend engineer...",
    "required_skills": ["Node.js", "AWS", "TypeScript", "DynamoDB"],
    "experience_level": "senior",
    "salary_range": "$130,000 – $160,000",
    "time_limit_minutes": 45,
    "personality": "facilitator",
    "mode": "solo",
    "questions": [
      {
        "text": "Can you walk me through a complex distributed system you've built?",
        "category": "technical",
        "skill_target": "System Design",
        "expected_depth": "detailed",
        "follow_up_enabled": true
      }
    ],
    "meeting_link": "",
    "scheduled_at": "",
    "language": "en"
  }
}
```

**Notes:**

- The AI uses the organization's context (company name, industry, products, values) to tailor the draft
- `meeting_link` and `scheduled_at` are always empty — the user must fill them in
- The draft is NOT saved — the user reviews it, possibly edits, then submits via the Create endpoint

### 5.2 Generate Questions

**`POST /lira/v1/orgs/{orgId}/interviews/generate-questions`**

Generate interview questions using AI, optionally personalized to a resume.

**Request:**

```json
{
  "title": "Senior Backend Engineer",
  "job_description": "...",
  "required_skills": ["Node.js", "AWS"],
  "experience_level": "senior",
  "resume_text": "John Doe, 8 years experience at Google...",
  "question_count": 10,
  "categories": ["technical", "behavioral", "situational"],
  "language": "en"
}
```

**Response:**

```json
{
  "questions": [
    {
      "id": "q_abc123",
      "text": "Given your experience at Google, how would you approach...",
      "category": "technical",
      "skill_target": "System Design",
      "expected_depth": "detailed",
      "follow_up_enabled": true,
      "order": 1,
      "ai_generated": true
    }
  ]
}
```

**Notes:**

- When `resume_text` is provided, questions are personalized to the candidate's background
- `question_count` defaults to the number appropriate for the time limit if omitted
- Questions are returned with server-generated `id` fields

### 5.3 Create Interview

**`POST /lira/v1/orgs/{orgId}/interviews`**

Create a new interview record.

**Request:** `CreateInterviewInput` (see §4.9)

**Response:**

```json
{
  "interview": {
    /* full Interview object */
  }
}
```

**Validation rules:**

- `title`, `job_description`, `required_skills` (min 1), `experience_level`, `mode`, `time_limit_minutes` (15–120), `personality`, `question_generation` are required
- `questions` array max 30 items
- `evaluation_criteria` weights must sum to 1.0 (±0.01 tolerance)
- `meeting_link` must be a valid URL if provided
- `scheduled_at` must be a valid ISO-8601 datetime if provided
- `language` must be one of: `en`, `fr`, `rw`

**Default behavior:**

- If no `evaluation_criteria` provided, defaults are used (Technical Skills 0.3, Communication 0.25, Experience Fit 0.25, Culture Fit 0.20)
- `status` is set to `draft`
- `round` is calculated automatically (1 for new interviews, parent's round + 1 for follow-ups)

**Beta limit:** Max 5 interviews per organization (skipped for ADMIN/SUPER_ADMIN)

### 5.4 List Interviews

**`GET /lira/v1/orgs/{orgId}/interviews`**

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | InterviewStatus | Filter by status (optional) |

**Response:**

```json
{
  "interviews": [
    /* array of Interview objects */
  ],
  "count": 12
}
```

**Sort order:** Newest first (`created_at` descending)

### 5.5 Get Interview Detail

**`GET /lira/v1/orgs/{orgId}/interviews/{interviewId}`**

**Response:**

```json
{
  "interview": {
    /* full Interview object with evaluation, resume, decision */
  }
}
```

### 5.6 Get Related Interviews (Rounds)

**`GET /lira/v1/orgs/{orgId}/interviews/{interviewId}/related`**

Returns all interviews in the same round chain (same candidate, linked via `parent_interview_id`).

**Response:**

```json
{
  "interviews": [
    {
      /* Round 1 */
    },
    {
      /* Round 2 */
    },
    {
      /* Round 3 — current */
    }
  ]
}
```

**Sort order:** By `round` number ascending.

### 5.7 Update Interview

**`PUT /lira/v1/orgs/{orgId}/interviews/{interviewId}`**

**Request:** `UpdateInterviewInput` (partial, any fields from CreateInterviewInput except candidate_email)

**Response:**

```json
{
  "interview": {
    /* updated Interview object */
  }
}
```

**Restriction:** Only works when status is `draft` or `scheduled`.

### 5.8 Delete Interview

**`DELETE /lira/v1/orgs/{orgId}/interviews/{interviewId}`**

**Response:** `204 No Content`

**Restriction:** Cannot delete while status is `in_progress`.

### 5.9 Start Interview (Deploy Bot)

**`POST /lira/v1/orgs/{orgId}/interviews/{interviewId}/start`**

Deploys the Chromium bot to join the Google Meet call.

**Request (all fields optional):**

```json
{
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "candidate_name": "Jane Doe",
  "language": "en"
}
```

**Response:**

```json
{
  "bot_id": "bot_abc123",
  "session_id": "sess_xyz789",
  "interview": {
    /* updated Interview with status: 'bot_deployed' */
  }
}
```

**Behavior:**

- If `meeting_link` is provided in the body, it overrides the one stored on the interview
- If `candidate_name` is provided, it updates the stored candidate name
- If `language` is provided, it updates the interview language
- Status changes to `bot_deployed`
- If the interview was `scheduled`, the `scheduled_at` is cleared
- The bot joins the Google Meet call within 10–30 seconds

**Prerequisite:** Interview must have a `meeting_link` (either stored or provided in body).

**Error if:**

- Status is not `draft` or `scheduled`
- No meeting link available
- Bot deployment fails

### 5.10 Cancel Interview

**`POST /lira/v1/orgs/{orgId}/interviews/{interviewId}/cancel`**

**Response:**

```json
{
  "interview": {
    /* updated Interview with status: 'cancelled' */
  }
}
```

**Behavior:**

- Terminates the bot if it's currently in a meeting
- Sets `cancellation_reason` and `cancelled_at`

### 5.11 Rejoin Interview

**`POST /lira/v1/orgs/{orgId}/interviews/{interviewId}/rejoin`**

Re-deploys the bot to the same meeting link. Useful when:

- The bot was disconnected
- The interview was cancelled and needs to be restarted
- The bot left due to a timeout

**Response:**

```json
{
  "bot_id": "bot_new123",
  "session_id": "sess_new789",
  "interview": {
    /* updated Interview with status: 'bot_deployed' */
  }
}
```

**Allowed from statuses:** `cancelled`, `bot_deployed`, `scheduled`, `draft`

### 5.12 Upload Resume

**`POST /lira/v1/orgs/{orgId}/interviews/{interviewId}/resume`**

Upload a PDF resume for the candidate. Uses `multipart/form-data` (NOT JSON).

**Request:**

```
Content-Type: multipart/form-data
Field name: "file"
File type: application/pdf
```

**Frontend implementation note — do NOT use the standard `apiFetch` wrapper:**

```typescript
async function uploadInterviewResume(orgId: string, interviewId: string, file: File) {
  const token = credentials.getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/lira/v1/orgs/${orgId}/interviews/${interviewId}/resume`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    // Do NOT set Content-Type — browser sets it with boundary
  })
  return res.json()
}
```

**Response:**

```json
{
  "resume": {
    "raw_text": "John Doe\nSenior Engineer at Google...",
    "parsed": {
      "skills": ["Node.js", "Python", "AWS"],
      "experience": [
        {
          "role": "Senior Engineer",
          "company": "Google",
          "duration_months": 48,
          "highlights": ["Led team of 8", "Built real-time data pipeline"]
        }
      ],
      "education": [
        {
          "degree": "BS Computer Science",
          "institution": "MIT",
          "year": 2015
        }
      ],
      "summary": "Experienced backend engineer with 8 years..."
    },
    "s3_key": "resumes/org123/int456/resume.pdf",
    "filename": "john_doe_resume.pdf",
    "uploaded_at": "2025-06-15T10:30:00Z",
    "parse_method": "ai_extraction"
  },
  "parse_failed": false,
  "message": "Resume uploaded and parsed successfully"
}
```

**Side effects:**

- Uploads the PDF to S3
- Extracts text using `pdf-parse`
- Uses GPT-4o-mini to extract structured data (skills, experience, education)
- Auto-fills `candidate_name` and `candidate_email` if found in the resume and not already set
- **Auto-regenerates personalized questions** based on the resume content

### 5.13 Run Evaluation (Re-evaluate)

**`POST /lira/v1/orgs/{orgId}/interviews/{interviewId}/evaluate`**

Re-runs the evaluation on an already-completed interview.

**Request:**

```json
{}
```

**Response:**

```json
{
  "evaluation": {
    /* InterviewEvaluation object */
  }
}
```

**Restrictions:**

- Interview must be `completed` or `evaluating`
- Maximum 3 re-evaluations
- Requires `ADMIN` or `SUPER_ADMIN` role

### 5.14 Generate Overall Score

**`POST /lira/v1/orgs/{orgId}/interviews/{interviewId}/generate-score`**

Generates the Phase 2 evaluation: overall score, recommendation, strengths, concerns, notable quotes.

**Request:**

```json
{}
```

**Response:**

```json
{
  "evaluation": {
    "overall_score": 78,
    "recommendation": "recommend",
    "recommendation_reasoning": "Strong technical skills with good communication...",
    "strengths": [
      "Deep understanding of distributed systems",
      "Clear and structured communication"
    ],
    "concerns": [
      "Limited experience with our specific tech stack",
      "Could improve on system design articulation"
    ],
    "notable_quotes": [
      {
        "quote": "I believe in building systems that are resilient by default",
        "context": "When discussing architecture philosophy",
        "sentiment": "positive"
      }
    ],
    "candidate_engagement": "high",
    "score_generated_at": "2025-06-15T11:00:00Z"
  }
}
```

**Prerequisite:** Phase 1 evaluation must exist (interview must have been evaluated first).

### 5.15 Record Decision

**`PUT /lira/v1/orgs/{orgId}/interviews/{interviewId}/decision`**

Record a hiring decision.

**Request:**

```json
{
  "decision": "next_round",
  "notes": "Strong candidate, needs a system design deep-dive in round 2"
}
```

**Valid decisions:** `hire`, `no_hire`, `next_round`, `undecided`

**Response:**

```json
{
  "interview": {
    /* updated Interview with decision fields populated */
  }
}
```

---

## 6. Interview Creation Flow

The creation flow has two phases in the current frontend:

### 6.1 Phase 1: AI Draft from Prompt

The user types a free-form description of the role they want to interview for:

```
"I need to interview a senior full-stack developer with React and Node.js
experience for our e-commerce platform. They should have 5+ years experience
and strong system design skills."
```

→ Call `POST /interviews/draft` → Returns a complete `InterviewDraft`

The AI uses the organization's context (company name, industry, products, values, terminology) to generate a tailored interview configuration.

### 6.2 Phase 2: Review & Customize Form

After the draft is generated, the user sees a multi-section form to review and edit:

**Section: Role Details**

- Title (pre-filled from draft)
- Department
- Job description (textarea)
- Required skills (tag input)
- Experience level (dropdown: junior/mid/senior/lead/principal)
- Salary range (currency selector + min/max inputs)
- Interview purpose (dropdown: 10 options)
- Interview mode (selector: solo/copilot/shadow)
- Personality (selector: supportive/challenger/facilitator/analyst)
- Time limit (slider: 15–120 minutes)
- Language (dropdown: English/French/Kinyarwanda)
- Meeting link (Google Meet URL input)
- Scheduled date/time (datetime picker)

**Section: Candidate Resume**

- PDF upload zone with drag-and-drop
- After upload: shows parsed skills, experience, education
- Auto-fills candidate name if found

**Section: Interview Questions**

- List of AI-generated questions (from draft or separate generation)
- Each question shows: text, category badge, skill target, expected depth
- Questions are editable (text, category, depth)
- Questions can be reordered, added, or removed
- "Regenerate Questions" button to get new AI-generated questions
- Questions are personalized when a resume has been uploaded

### 6.3 Resume Upload During Creation

The resume can be uploaded at any point during creation or after:

1. User drags/drops or selects a PDF file
2. Frontend sends `POST /interviews/{id}/resume` with `FormData`
3. Backend: uploads to S3 → extracts text → GPT parses structured data
4. Response includes parsed skills, experience, education
5. **Side effect:** If questions already exist, they are regenerated with resume context
6. **Side effect:** `candidate_name` auto-filled from resume if not already set

### 6.4 Question Generation

Questions can be generated independently from the draft:

1. Frontend calls `POST /interviews/generate-questions` with role details + optional resume text
2. Backend uses GPT-4o-mini to generate questions
3. Questions are tagged by category and personalized to the resume if provided
4. Count range: 1–20 questions

### 6.5 Edit Mode & Follow-up Rounds

The create page supports three modes:

1. **New interview** — Fresh creation with AI draft
2. **Edit** — Editing an existing `draft` or `scheduled` interview. Loads existing data into the form. Submits via `PUT /interviews/{id}`
3. **Follow-up round** — Creating the next round for a candidate. Sets `parent_interview_id` to the current interview's root ID. The AI can access the previous round's summary to avoid repeating questions.

**Follow-up round flow:**

1. User clicks "New Round" on a completed interview
2. Frontend navigates to create page with `parent_interview_id` query param
3. Pre-fills role details from the parent interview
4. AI generates new questions avoiding topics covered in previous rounds
5. `round` is auto-incremented (parent's round + 1)

---

## 7. Interview Modes

| Mode        | Description                                   | AI Behavior                                                                                                                                 |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Solo**    | AI conducts the entire interview autonomously | Speaks first, greets the candidate, asks all questions, manages the conversation. Wake word is disabled — AI responds to all speech.        |
| **Copilot** | AI assists a human interviewer                | Waits for the human interviewer to lead. Provides suggestions, tracks questions, can ask follow-ups when prompted. Wake word stays enabled. |
| **Shadow**  | AI observes silently                          | Listens and takes notes but does not speak during the interview. Evaluation is still generated post-interview.                              |

**Solo mode specifics:**

- The AI speaks first when joining ("Hello! I'm [name], and I'll be conducting your interview today for the [role] position...")
- Wake word is disabled — every candidate utterance gets a response
- `maxAutoResponses` is set to 30 (vs 5 for regular meetings)
- The AI manages turn-taking: every response ends with the next question

---

## 8. AI Personality Types

| Personality     | Description                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Supportive**  | Warm, encouraging. Provides positive feedback. Creates a comfortable atmosphere. Best for junior candidates or culture-fit interviews. |
| **Challenger**  | Direct, probing. Pushes candidates to think deeper. Asks tough follow-ups. Best for senior technical interviews.                       |
| **Facilitator** | Balanced, structured. Keeps the conversation on track. Ensures all topics are covered. Best for panel or standard interviews.          |
| **Analyst**     | Methodical, detail-oriented. Focuses on specifics and evidence. Best for technical deep-dives.                                         |

---

## 9. Bot Deployment & Runtime

### 9.1 How the Bot Joins a Meeting

1. **Frontend calls** `POST /interviews/{id}/start`
2. **Backend validates** status and meeting link
3. **Backend calls** `deployBot()` with `meeting_type: 'interview'`
4. **Bot Manager** launches a headless Chromium browser (Playwright)
5. **Browser navigates** to the Google Meet URL
6. **Bot enters** the display name ("Lira AI" or custom `ai_name_override`)
7. **Bot clicks** "Ask to join" or "Join now"
8. **Bot waits** in lobby if needed (up to 5 minutes)
9. **Once in meeting**, audio bridge starts (per-speaker capture via `AudioContext`)
10. **Nova Sonic connection** established for bidirectional speech

The entire process takes 10–30 seconds from API call to bot being in the meeting.

### 9.2 Candidate Name Resolution

When the interview doesn't have a `candidate_name` set:

1. The bot polls Google Meet's participant list every 8 seconds
2. It filters out its own name and the bot's display name
3. The first non-bot participant name is assumed to be the candidate
4. The name is:
   - Injected into the interview's system prompt (rebuilds the prompt)
   - Saved to the database via `updateInterviewCandidateName()`
   - Used for speaker attribution in the transcript

### 9.3 Interview Conduct (The AI Prompt)

When `meeting_type` is `'interview'`, the bot manager builds a specialized system prompt (~500 lines) with 10 sections:

1. **Role & Assignment** — AI identity, interview details, candidate resume, previous round context
2. **Operating Mode** — Solo/Copilot/Shadow behavior including opening sequences
3. **Participant Management** — Name verification, wrong-person handling, interruption responses
4. **Conversation Dynamics** — Turn management (every response ends with next question), response discipline (brief acknowledgment + question), silence handling (prompt after 5s), pacing
5. **Question Protocol** — Hard constraints: ask exactly N questions, each asked once, no invented follow-ups unless enabled, mandatory response format
6. **Candidate Engagement** — Name usage, resume references, feedback approach for different answer qualities
7. **Interview Questions** — The numbered list of questions to ask
8. **Closing Protocol** — Exact closing phrases, no "any questions?", exit phrase: "I'll be leaving the meeting now. Good luck!"
9. **Company Context** — Organization profile for answering candidate questions about the company
10. **Language** — Multi-language instructions with STT limitation handling

The prompt is injected via a special marker `═══ INTERVIEW MODE` that Nova Sonic detects to adjust its behavior (minimal wrapper prompt, 30 max auto-responses, wake word bypass).

### 9.4 Question Tracking & Deduplication

During the interview, the bot tracks which questions have been asked:

- Each question is converted to a set of keywords (stopwords removed)
- When the AI speaks, the text is checked against question keywords
- A question is marked as "covered" when enough keywords match (≥40% of keywords or the first 40 characters match)
- This tracking survives session restarts — when the bot reconnects, it knows which questions have already been asked and can resume from where it left off

### 9.5 Auto-Leave Detection

The bot detects two types of exit signals:

**AI-initiated exit (interview complete):**
Regex matches phrases like:

- "wraps up our interview"
- "all the questions I had"
- "that concludes"
- "leaving the meeting now"
- "thank you for your time... good luck"

When detected → 18-second delay → bot auto-terminates

**Participant-initiated exit:**
Regex matches phrases like:

- "leave the meeting"
- "end the interview"
- "you can leave"
- "goodbye"

When detected → bot acknowledges and leaves

### 9.6 Session Recovery (Reconnection)

If the bot's audio connection drops and reconnects:

1. The bot detects the reconnection
2. System prompt is updated with: "The session was briefly interrupted. Resume the interview naturally from where you left off."
3. A summary of which questions have been covered vs. remaining is injected:

   ```
   ✅ 1. Tell me about your experience with Node.js
   ✅ 2. How do you handle database scaling?
   ⬚ 3. Describe a challenging project you led
   ⬚ 4. How do you approach code reviews?

   Resume from question 3.
   ```

### 9.7 No-Show Handling

When the bot leaves a meeting:

1. Backend checks if any non-AI participant spoke during the session
2. **If no participant speech** → Candidate no-show:
   - Status set to `cancelled` with `cancellation_reason: 'candidate_no_show'`
   - `notifyInterviewNoShow()` sends a notification to the organization
3. **If participant speech exists** → Real interview happened:
   - Status set to `evaluating`
   - `notifyInterviewCompleted()` sends a notification
   - Auto-evaluation runs in the background

**Alone timeout:** If the bot is alone in the meeting for 2 minutes (interview-specific, vs 45s for regular meetings), it auto-leaves.

---

## 10. Evaluation Pipeline

### 10.1 Phase 1: Automatic Q&A Evaluation

Runs automatically when the interview ends and participant speech was detected.

**Process:**

1. **Extract Q&A pairs** from the flat transcript:
   - Scans for AI messages that match prepared questions (loose 40-character prefix match)
   - Collects subsequent non-AI messages as the candidate's answer
   - Groups follow-up questions with their parent question
2. **Score each Q&A pair** (parallel GPT-4o-mini calls):
   - Each answer scored 0–100
   - Analysis text explaining the score
   - Key points extracted
   - Answer quality classification (excellent/good/adequate/poor)
   - Language-aware (scores in the interview's language if not English)
3. **Generate interview summary** — A neutral paragraph summarizing the interview without judgment
4. **Persist** evaluation to the interview record
5. **Update status** to `completed`

### 10.2 Phase 2: Overall Score (On-Demand)

Triggered when the user clicks "Generate Score" in the UI.

**Process:**

1. Averages individual Q&A scores (only questions that were answered)
2. GPT-4o-mini generates:
   - Overall recommendation (strongly_recommend / recommend / neutral / not_recommended)
   - Reasoning for the recommendation
   - Top strengths (bullet points)
   - Key concerns (bullet points)
   - Notable quotes with context and sentiment
   - Candidate engagement level (high/moderate/low)
3. Results persisted alongside Phase 1 data

### 10.3 Re-Evaluation

- Maximum 3 re-evaluations per interview
- Requires ADMIN or SUPER_ADMIN role
- Re-runs the full Phase 1 pipeline on the stored transcript
- Phase 2 can be regenerated independently via `generate-score`

---

## 11. Decision Recording

After reviewing the evaluation, users can record a hiring decision:

| Decision     | Description            | Typical Next Step          |
| ------------ | ---------------------- | -------------------------- |
| `hire`       | Proceed with offer     | Move to onboarding         |
| `no_hire`    | Do not proceed         | Archive the interview      |
| `next_round` | Schedule another round | Create follow-up interview |
| `undecided`  | Need more information  | Discuss with team          |

The decision includes optional free-text `notes` for context.

---

## 12. Multi-Round Interviews

Interviews support linked rounds via `parent_interview_id`:

```
Round 1 (intro)  ←── parent_interview_id: null, round: 1
  ↓
Round 2 (technical)  ←── parent_interview_id: "round1_id", round: 2
  ↓
Round 3 (cultural)  ←── parent_interview_id: "round1_id", round: 3
```

**Key behaviors:**

- `parent_interview_id` always points to the **first round's ID** (not the immediately preceding round)
- `round` is auto-calculated: parent's chain length + 1
- `GET /interviews/{id}/related` returns all rounds sorted by round number
- When building the system prompt for round 2+, the AI receives a summary of previous rounds so it can avoid repeating topics
- The "New Round" button creates a follow-up with pre-filled role details

---

## 13. Scheduling & Auto-Deployment

Interviews can be scheduled for a future time:

1. Set `scheduled_at` to an ISO-8601 datetime during creation
2. Status becomes `scheduled`
3. A background scheduler polls every 30 seconds for due interviews
4. When `scheduled_at ≤ now`:
   - Must be within 15 minutes of scheduled time (interviews >15 min late are skipped)
   - Must have a `meeting_link`
   - Bot is auto-deployed (same as manual start)
   - Status transitions to `bot_deployed`
5. Prevents double-deploy via an in-memory `Set` tracking currently-starting interviews

---

## 14. Real-Time Events (WebSocket)

During an active interview, the frontend can connect to the WebSocket to receive real-time updates:

**Connection:** `wss://{API_HOST}/ws?token={jwt}&session_id={session_id}`

**Event types relevant to interviews:**

| Event Type         | Direction       | Description                                     |
| ------------------ | --------------- | ----------------------------------------------- |
| `live_transcript`  | Server → Client | Real-time transcript segments as they're spoken |
| `speaker_event`    | Server → Client | Speaker joined/left/speaking status changes     |
| `transcript_delta` | Server → Client | Finalized transcript segments                   |

**`live_transcript` payload:**

```json
{
  "type": "live_transcript",
  "session_id": "sess_xyz",
  "speaker": "Jane Doe",
  "text": "I have 5 years of experience with distributed systems...",
  "is_ai": false,
  "timestamp": "2025-06-15T10:35:00Z",
  "segment_id": "seg_123",
  "is_partial": false
}
```

**`speaker_event` payload:**

```json
{
  "type": "speaker_event",
  "session_id": "sess_xyz",
  "event": "speaker_change",
  "speaker": "Jane Doe",
  "timestamp": "2025-06-15T10:35:00Z"
}
```

**Frontend usage:** These events enable a live transcript view during the interview, showing who is speaking in real-time.

---

## 15. Frontend Architecture Reference

### 15.1 Routes

```typescript
const ROUTES = {
  orgInterviews: '/org/roles', // Role list page
  orgInterviewRole: '/org/roles/:roleSlug', // Per-role candidate list
  orgInterviewCreate: '/org/roles/new', // Create/edit interview
  orgInterviewEdit: '/org/interviews/:interviewId/edit', // Edit existing interview
  orgInterviewDetail: '/org/interviews/:interviewId', // Interview detail & eval
}
```

### 15.2 Pages & Their Responsibilities

**InterviewsPage** (`/org/roles`)

- Lists interviews grouped by role title
- Shows candidate count per role
- Search/filter by role name or candidate name
- "New Role" button → navigates to create page
- Delete role (deletes all interviews for that role)

**InterviewRolePage** (`/org/roles/:roleSlug`)

- Lists all candidates for a specific role
- Shows status badge, round count, created date per candidate
- "Interview Another Person" button → navigates to create page with role pre-filled

**InterviewCreatePage** (`/org/roles/new` or `/org/interviews/:id/edit`)

- Two-phase creation:
  - Phase 1: Free-form prompt → AI generates draft
  - Phase 2: Multi-section review form
- Supports three modes: new, edit, follow-up
- Resume upload with drag-and-drop
- Question management (edit, reorder, add, remove, regenerate)
- 17 currencies, 3 languages, 10 interview purposes

**InterviewDetailPage** (`/org/interviews/:interviewId`)

- Full interview management dashboard
- **Action buttons** (based on status):
  - Draft/Scheduled: Start, Edit, Delete
  - Bot Deployed: Cancel, Rejoin
  - In Progress: Cancel
  - Completed: Re-evaluate, Generate Score, Record Decision, New Round
- **Details tab**: Job info, salary, schedule, meeting link, candidate info, resume summary, bot status, live transcript, rounds timeline
- **Evaluation tab**: Q&A score cards, interview summary, overall score, recommendation, strengths/concerns, notable quotes
- **Decision modal**: 4 outcomes + notes textarea
- **Meeting link modal**: Enter/update Google Meet URL before starting

### 15.3 State Management

```typescript
// Zustand store
interface InterviewSlice {
  interviews: Interview[]
  loading: boolean
  statusFilter: InterviewStatus | 'all' | null
  setInterviews: (interviews: Interview[]) => void
  addInterview: (interview: Interview) => void
  removeInterview: (interviewId: string) => void
  updateInterview: (interviewId: string, updates: Partial<Interview>) => void
  setLoading: (v: boolean) => void
  setStatusFilter: (status: InterviewStatus | 'all' | null) => void
  clear: () => void
}
```

Usage: `const { interviews, setInterviews } = useInterviewStore()`

### 15.4 API Service Layer

All 15 API functions are available in the frontend service layer:

```typescript
// Listing & CRUD
listInterviews(orgId, status?)
createInterviewRecord(orgId, input)
getInterviewRecord(orgId, interviewId)
getRelatedInterviews(orgId, interviewId)
updateInterviewRecord(orgId, interviewId, input)
deleteInterviewRecord(orgId, interviewId)

// Interview actions
startInterviewSession(orgId, interviewId, options?)
cancelInterviewSession(orgId, interviewId)

// Resume
uploadInterviewResume(orgId, interviewId, file)

// Evaluation
runInterviewEvaluation(orgId, interviewId)
generateInterviewScore(orgId, interviewId)

// Decision
recordInterviewDecision(orgId, interviewId, decision, notes?)

// AI Generation
draftInterviewRecord(orgId, prompt)
generateInterviewQuestions(orgId, input)
```

### 15.5 Polling Patterns

The detail page uses polling to track interview progress:

| What             | Interval  | When                                                           |
| ---------------- | --------- | -------------------------------------------------------------- |
| Bot status       | 2 seconds | While status is `bot_deployed`                                 |
| Interview status | 5 seconds | While status is `bot_deployed`, `in_progress`, or `evaluating` |

**Stop polling when:** Status reaches `completed`, `cancelled`, or the page unmounts.

---

## 16. Database Schema

**Table:** `lira-interviews`

**Primary key:**

- PK: `ORG#<orgId>`
- SK: `INT#<interviewId>`

**Global Secondary Indexes:**

| GSI                       | PK                    | SK                                | Purpose                                    |
| ------------------------- | --------------------- | --------------------------------- | ------------------------------------------ |
| `interview-status-index`  | `ORG#<orgId>`         | `STATUS#<status>#TS#<created_at>` | Filter interviews by status within an org  |
| `interview-session-index` | `SESSION#<sessionId>` | `INT#<interviewId>`               | Look up interview by active bot session ID |

**Key patterns:**

- Get all interviews for an org: Query PK = `ORG#orgId`
- Get interviews by status: Query GSI1 with SK begins_with `STATUS#completed`
- Find interview for active session: Query GSI2 with PK = `SESSION#sessionId`

---

## 17. Currencies & Salary Display

The system supports 12 currencies with proper symbol display:

| Code | Symbol | Example                         |
| ---- | ------ | ------------------------------- |
| USD  | $      | $120,000 – $150,000             |
| EUR  | €      | €100,000 – €130,000             |
| GBP  | £      | £80,000 – £100,000              |
| NGN  | ₦      | ₦50,000,000 – ₦70,000,000       |
| RWF  | FRw    | FRw 30,000,000 – FRw 40,000,000 |
| ZAR  | R      | R800,000 – R1,000,000           |
| KES  | KSh    | KSh 5,000,000 – KSh 7,000,000   |
| GHS  | GH₵    | GH₵ 200,000 – GH₵ 300,000       |
| CAD  | C$     | C$130,000 – C$160,000           |
| AUD  | A$     | A$140,000 – A$170,000           |
| INR  | ₹      | ₹3,000,000 – ₹5,000,000         |
| JPY  | ¥      | ¥15,000,000 – ¥20,000,000       |

The frontend create page supports 17 currencies (superset of backend's 12 — backend uses these for AI prompt display).

**Salary fields on the model:**

- `salary_currency`: ISO code (e.g., "USD")
- `salary_min`: Numeric minimum (e.g., 120000)
- `salary_max`: Numeric maximum (e.g., 150000)
- `salary_range`: Display string (e.g., "$120,000 – $150,000") — generated by backend for the AI prompt

---

## 18. Multi-Language Support

| Code | Language          |
| ---- | ----------------- |
| `en` | English (default) |
| `fr` | French            |
| `rw` | Kinyarwanda       |

**How it works:**

- The `language` field on the interview controls the AI's spoken language
- The system prompt instructs the AI to conduct the interview in the specified language
- Speech-to-text (STT) may not always recognize the language correctly — the prompt includes handling for this:
  - If STT produces garbled text, the AI is told to continue in the target language
  - The AI should not switch languages based on STT errors
- Evaluation scoring is also language-aware — the AI evaluates in the context of the spoken language

---

## 19. Beta Limits

During beta, usage is capped per organization:

| Resource              | Limit     | Who is exempt      |
| --------------------- | --------- | ------------------ |
| Interviews created    | 5 per org | ADMIN, SUPER_ADMIN |
| Evaluations (re-eval) | 5 per org | ADMIN, SUPER_ADMIN |

The backend checks and increments a counter before creating an interview. The counter is per-org and tracked separately.

---

## 20. Notifications

The system sends notifications to the organization for key interview events:

| Event               | Type                  | When                                                   |
| ------------------- | --------------------- | ------------------------------------------------------ |
| Candidate no-show   | `interview_no_show`   | Bot leaves meeting with no participant speech          |
| Interview completed | `interview_completed` | Bot leaves after a real interview; evaluation starting |

Notifications are delivered via the organization's configured webhook (Slack, email, etc.) and appear in the in-app notification panel as `kind: 'interview'`.

---

## 21. Error Codes

| Code                       | HTTP Status | When                                                     |
| -------------------------- | ----------- | -------------------------------------------------------- |
| `INTERVIEW_NOT_FOUND`      | 404         | Interview ID doesn't exist in this org                   |
| `INTERVIEW_WRONG_STATUS`   | 409         | Action not allowed in current status                     |
| `INTERVIEW_NOT_MEMBER`     | 403         | User is not a member of this org                         |
| `INSUFFICIENT_ROLE`        | 403         | User lacks required role (e.g., re-eval needs admin)     |
| `RE_EVALUATION_LIMIT`      | 429         | Already re-evaluated 3 times                             |
| `RESUME_PARSE_FAILED`      | 422         | PDF couldn't be parsed (still stored in S3)              |
| `INVALID_CRITERIA_WEIGHTS` | 400         | Evaluation criteria weights don't sum to 1.0             |
| `BOT_DEPLOY_FAILED`        | 500         | Bot couldn't be launched                                 |
| `INTERVIEW_MISSING_LINK`   | 400         | No meeting link provided or stored                       |
| `NO_EVALUATION`            | 404         | Tried to generate score but no Phase 1 evaluation exists |
| `NO_ANSWERS`               | 422         | No answered questions found in transcript                |

---

## Appendix A: Status → Available Actions Matrix

| Status         | Start | Cancel | Edit | Delete | Rejoin | Re-eval | Gen Score | Decision | New Round |
| -------------- | ----- | ------ | ---- | ------ | ------ | ------- | --------- | -------- | --------- |
| `draft`        | ✅    | —      | ✅   | ✅     | ✅     | —       | —         | —        | —         |
| `scheduled`    | ✅    | ✅     | ✅   | ✅     | ✅     | —       | —         | —        | —         |
| `bot_deployed` | —     | ✅     | —    | —      | ✅     | —       | —         | —        | —         |
| `in_progress`  | —     | ✅     | —    | —      | —      | —       | —         | —        | —         |
| `evaluating`   | —     | —      | —    | ✅     | —      | ✅      | —         | —        | —         |
| `completed`    | —     | —      | —    | ✅     | —      | ✅      | ✅        | ✅       | ✅        |
| `cancelled`    | —     | —      | —    | ✅     | ✅     | —       | —         | —        | —         |

## Appendix B: Complete Frontend API Function Signatures

```typescript
// List all interviews (optionally filtered by status)
listInterviews(orgId: string, status?: InterviewStatus): Promise<Interview[]>

// Create a new interview
createInterviewRecord(orgId: string, input: CreateInterviewInput): Promise<Interview>

// Get a single interview with all details
getInterviewRecord(orgId: string, interviewId: string): Promise<Interview>

// Get all rounds linked to this interview
getRelatedInterviews(orgId: string, interviewId: string): Promise<Interview[]>

// Update an interview (draft/scheduled only)
updateInterviewRecord(orgId: string, interviewId: string, input: UpdateInterviewInput): Promise<Interview>

// Delete an interview
deleteInterviewRecord(orgId: string, interviewId: string): Promise<void>

// Deploy bot to start the interview
startInterviewSession(
  orgId: string,
  interviewId: string,
  options?: { meeting_link?: string; candidate_name?: string; language?: string }
): Promise<{ bot_id: string; session_id: string; interview: Interview }>

// Cancel and terminate the bot
cancelInterviewSession(orgId: string, interviewId: string): Promise<void>

// Upload candidate resume (multipart/form-data — NOT JSON)
uploadInterviewResume(
  orgId: string,
  interviewId: string,
  file: File
): Promise<{ resume: ResumeData | null; parse_failed: boolean; message: string }>

// Re-run evaluation (admin only, max 3)
runInterviewEvaluation(
  orgId: string,
  interviewId: string
): Promise<{ evaluation: InterviewEvaluation }>

// Generate Phase 2 overall score
generateInterviewScore(
  orgId: string,
  interviewId: string
): Promise<{ evaluation: InterviewEvaluation }>

// Record hiring decision
recordInterviewDecision(
  orgId: string,
  interviewId: string,
  decision: DecisionOutcome,
  notes?: string
): Promise<void>

// AI-generate a complete interview draft from prompt
draftInterviewRecord(orgId: string, prompt: string): Promise<InterviewDraft>

// AI-generate questions
generateInterviewQuestions(
  orgId: string,
  input: GenerateQuestionsInput
): Promise<InterviewQuestion[]>
```

## Appendix C: Key UX Patterns

### Interview Detail Page — Polling Logic

```
On mount:
  1. Fetch interview detail
  2. If status in ['bot_deployed', 'in_progress', 'evaluating']:
     Start polling every 5 seconds
  3. If status is 'bot_deployed':
     Also poll bot status every 2 seconds

On status change:
  - bot_deployed → in_progress: Show "Interview in progress" indicator
  - in_progress → evaluating: Show "Generating evaluation..." spinner
  - evaluating → completed: Stop polling, show evaluation tab

On unmount:
  Clear all polling intervals
```

### Toast Notifications Pattern

```
Success: "Interview started" / "Evaluation complete" / "Decision recorded"
Error:   "Failed to start interview" / "Bot deployment failed"
Info:    "Evaluation is being generated..."
```

### Status Badge Colors (suggested)

| Status         | Color             |
| -------------- | ----------------- |
| `draft`        | Gray              |
| `scheduled`    | Blue              |
| `bot_deployed` | Yellow/Amber      |
| `in_progress`  | Green (pulsing)   |
| `evaluating`   | Purple (animated) |
| `completed`    | Green (solid)     |
| `cancelled`    | Red               |

### Score Display

- 90–100: Green badge, "Exceptional"
- 75–89: Blue badge, "Strong"
- 60–74: Yellow badge, "Adequate"
- 40–59: Orange badge, "Below Expectations"
- 0–39: Red badge, "Poor"

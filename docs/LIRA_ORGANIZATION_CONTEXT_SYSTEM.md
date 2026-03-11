# Lira AI — Organization Context System

## Full Implementation Specification v2.0

**Document Version:** 2.0  
**Created:** March 9, 2026  
**Status:** Implementation Ready  
**Scope:** Complete feature — all tiers implemented, gated by plan at the UI/API level only

---

## Table of Contents

1. [Overview & Vision](#1-overview--vision)
2. [System Architecture](#2-system-architecture)
3. [Data Models](#3-data-models)
4. [Phase 1 — Organization CRUD & Membership](#4-phase-1--organization-crud--membership)
5. [Phase 2 — Organization Profile & Context Injection](#5-phase-2--organization-profile--context-injection)
6. [Phase 3 — Website Crawl & Knowledge Base](#6-phase-3--website-crawl--knowledge-base)
7. [Phase 4 — Document Upload, Parsing & RAG Pipeline](#7-phase-4--document-upload-parsing--rag-pipeline)
8. [Phase 5 — Vector Search & Semantic Retrieval](#8-phase-5--vector-search--semantic-retrieval)
9. [Phase 6 — Context Injection into Nova Sonic](#9-phase-6--context-injection-into-nova-sonic)
10. [Phase 7 — Task Execution Engine](#10-phase-7--task-execution-engine)
11. [Phase 8 — Frontend Implementation](#11-phase-8--frontend-implementation)
12. [Phase 9 — Testing, Observability & Hardening](#12-phase-9--testing-observability--hardening)
13. [API Reference](#13-api-reference)
14. [Pricing Tiers & Feature Matrix](#14-pricing-tiers--feature-matrix)
15. [Security & Data Isolation](#15-security--data-isolation)
16. [Infrastructure & AWS Resources](#16-infrastructure--aws-resources)
17. [Migration Strategy](#17-migration-strategy)

---

## 1. Overview & Vision

### 1.1 Problem

Lira AI currently joins meetings as a smart stranger. It has personality, it can listen and respond, it can generate summaries — but it knows nothing about the company it's serving. It doesn't know the company's products, terminology, culture, org structure, or ongoing projects. This limits its value from "impressive demo" to "indispensable team member."

### 1.2 Solution

Build a complete **Organization Context System** that:

1. Allows users to create or join an **Organization** (company/team/workspace)
2. Captures structured context about the organization (industry, products, terminology, culture)
3. Crawls the organization's website and extracts summarized knowledge
4. Accepts uploaded documents (PDFs, DOCX, TXT, Google Drive links, Notion exports) and indexes them using a RAG pipeline
5. Stores document embeddings in a vector database for semantic retrieval
6. Injects the right context into Lira's system prompt per-meeting, per-organization
7. Enables Lira to execute tasks during and after meetings (action items, follow-ups, draft documents)

### 1.3 Design Principles

- **Implement everything now, gate later.** Every feature is fully built and testable. Plan-based gating is a frontend/API concern, not an architecture concern.
- **Context is per-session.** Lira never holds multiple organizations in memory. Each Sonic session receives exactly one organization's context. Zero cross-contamination.
- **Storage-efficient by design.** Raw documents stored in S3, summaries and embeddings in purpose-built stores. No raw HTML or full-text in DynamoDB.
- **Crawl and index, don't cache.** Website content is summarized and indexed on ingestion, not stored in raw form.
- **Graceful degradation.** If the knowledge base is empty, Lira still works with just the organization profile. If no organization exists, Lira works exactly as it does today.

---

## 2. System Architecture

### 2.1 High-Level Architecture

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
│  ┌──────────────┐  ┌──────────────┐                               │
│  │  Bedrock      │  │  SQS          │                              │
│  │  (Embeddings, │  │  (Async job   │                              │
│  │   Summaries)  │  │   queue)      │                              │
│  └──────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component                       | Responsibility                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Org Service**                 | CRUD for organizations, membership, invite codes, profile management                                   |
| **Knowledge Base Service**      | Website crawling, page summarization, keyword extraction, scheduled re-crawls                          |
| **Document Processing Service** | File upload to S3, text extraction (PDF/DOCX/TXT), chunking, embedding generation                      |
| **Embedding Service**           | Interface to OpenAI text-embedding-3-small for vector generation (1536 dimensions)                     |
| **Vector Search Service**       | Interface to Qdrant (self-hosted) or Pinecone for storing/querying embeddings                          |
| **Context Builder Service**     | Assembles the final context payload for a meeting from org profile + relevant KB + relevant RAG chunks |
| **Task Engine**                 | Manages action items, follow-ups, and task execution during/after meetings                             |
| **Webhook Service**             | Outbound notifications (Slack, email) for task updates and meeting summaries                           |

---

## 3. Data Models

### 3.1 DynamoDB Table: `lira-organizations`

Single-table design. Partition key: `PK`, Sort key: `SK`.

#### Organization Profile Record

```typescript
interface OrganizationProfile {
  PK: `ORG#${string}` // "ORG#<orgId>"
  SK: 'PROFILE'
  orgId: string // UUID v4
  name: string // "AB Company"
  slug: string // "ab-company" (URL-friendly, unique)
  inviteCode: string // "LRA-X7K2" (6-char alphanumeric, regeneratable)

  // Core context fields
  industry: string // "Fintech / Payments"
  description: string // max 2000 chars
  mission?: string // max 500 chars
  culture: OrganizationCulture // structured culture profile
  products: ProductEntry[] // key products/services
  terminology: TermEntry[] // domain-specific terms with definitions
  competitors?: string[] // competitive landscape awareness
  teamSize?: string // "15 people", "50-100", "500+"
  locations?: string[] // "Lagos, Nigeria", "Remote-first"

  // External links
  websiteUrl?: string // primary website
  additionalUrls?: string[] // docs site, blog, etc.
  googleDriveLinks?: string[] // shared drive folders
  notionLinks?: string[] // workspace/page URLs

  // Configuration
  defaultMeetingSettings?: Partial<MeetingSettings> // org-wide defaults
  aiPersonalityOverride?: string // custom system prompt addition
  preferredLanguage?: string // BCP-47 language code

  // Metadata
  createdBy: string // userId of creator
  createdAt: string // ISO-8601
  updatedAt: string // ISO-8601

  // Knowledge base status
  websiteCrawlStatus?: 'pending' | 'crawling' | 'completed' | 'failed'
  websiteCrawlLastRun?: string // ISO-8601
  websiteCrawlPageCount?: number
  documentCount?: number
  embeddingCount?: number

  // Plan (for feature gating — all features implemented regardless)
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
}

interface OrganizationCulture {
  communicationStyle: 'casual' | 'professional' | 'mixed'
  meetingStyle: 'structured' | 'freeform' | 'hybrid'
  decisionMaking: 'consensus' | 'top-down' | 'data-driven' | 'collaborative'
  values?: string[] // "Move fast", "Customer-first", "Transparency"
  customNotes?: string // free-text, max 1000 chars
}

interface ProductEntry {
  name: string // "PayStack API"
  description?: string // max 500 chars
  category?: string // "Payment Processing"
  status?: 'active' | 'beta' | 'deprecated' | 'planned'
}

interface TermEntry {
  term: string // "KYC"
  definition: string // "Know Your Customer — identity verification process"
  category?: string // "Compliance", "Engineering", "Sales"
}
```

#### Knowledge Base Record (from website crawl)

```typescript
interface KnowledgeBaseEntry {
  PK: `ORG#${string}` // "ORG#<orgId>"
  SK: `KB#${string}` // "KB#<pageId>" (UUID)
  pageId: string
  sourceUrl: string // "https://abcompany.com/about"
  sourceType: 'website' | 'google_drive' | 'notion' | 'manual'
  title: string // extracted page title
  summary: string // AI-generated 200-400 word digest
  keywords: string[] // extracted keywords for relevance matching
  category?: string // "about", "product", "blog", "docs", "team"
  rawTextS3Key?: string // S3 key for full extracted text (backup)
  crawledAt: string // ISO-8601
  summaryModel: string // "gpt-4o-mini" or "amazon.nova-lite"
  tokenCount: number // token count of summary
  updatedAt: string
}
```

#### Document Record (uploaded files)

```typescript
interface DocumentRecord {
  PK: `ORG#${string}` // "ORG#<orgId>"
  SK: `DOC#${string}` // "DOC#<docId>" (UUID)
  docId: string
  fileName: string // "Q4_Strategy.pdf"
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'xlsx'
  fileSizeBytes: number
  s3Key: string // S3 key for original file

  // Processing status
  status: 'uploaded' | 'processing' | 'indexed' | 'failed'
  error?: string

  // Extracted content
  extractedTextS3Key?: string // S3 key for extracted plain text
  chunkCount?: number // number of chunks created
  embeddingCount?: number // number of embeddings generated
  pageCount?: number // for PDFs

  // Metadata
  uploadedBy: string // userId
  uploadedAt: string // ISO-8601
  processedAt?: string // ISO-8601
  summary?: string // AI-generated document summary (200 words)
  keywords?: string[]
  category?: string // user-assigned or AI-detected
}
```

#### Document Chunk Record (for RAG)

```typescript
interface DocumentChunk {
  PK: `ORG#${string}` // "ORG#<orgId>"
  SK: `CHUNK#${string}#${string}` // "CHUNK#<docId>#<chunkIndex>"
  docId: string
  chunkIndex: number
  text: string // chunk text (max 512 tokens)
  embeddingId?: string // reference to vector in Qdrant
  tokenCount: number
  startOffset: number // character position in original doc
  endOffset: number
}
```

#### Membership Record

```typescript
interface OrgMembership {
  PK: `ORG#${string}` // "ORG#<orgId>"
  SK: `MEMBER#${string}` // "MEMBER#<userId>"
  userId: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  department?: string // "Engineering", "Sales"
  jobTitle?: string // "Senior Developer"
  joinedAt: string // ISO-8601
  invitedBy?: string // userId of inviter
}

// Reverse lookup (user → orgs)
interface UserOrgLookup {
  PK: `USER#${string}` // "USER#<userId>"
  SK: `ORG#${string}` // "ORG#<orgId>"
  orgId: string
  orgName: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}
```

#### Task Record

```typescript
interface TaskRecord {
  PK: `ORG#${string}` // "ORG#<orgId>"
  SK: `TASK#${string}` // "TASK#<taskId>"
  taskId: string // UUID
  meetingSessionId?: string // linked meeting (optional)

  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'

  assignedTo?: string // userId or name from transcript
  assignedBy: 'lira' | string // "lira" = AI-created, else userId
  dueDate?: string // ISO-8601

  // Source context
  sourceType: 'meeting_transcript' | 'manual' | 'follow_up'
  sourceQuote?: string // relevant transcript snippet

  // Execution (for AI-executable tasks)
  taskType: 'action_item' | 'draft_document' | 'research' | 'follow_up_email' | 'summary' | 'custom'
  executionStatus?: 'not_started' | 'executing' | 'completed' | 'failed'
  executionResult?: string // output text / S3 key for generated docs
  executionResultS3Key?: string // for generated documents

  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Meeting → Tasks lookup
interface MeetingTaskLookup {
  PK: `MEETING#${string}` // "MEETING#<sessionId>"
  SK: `TASK#${string}` // "TASK#<taskId>"
  taskId: string
  orgId: string
  title: string
  status: string
}
```

### 3.2 S3 Bucket Structure

```
lira-organization-data/
├── orgs/
│   └── <orgId>/
│       ├── documents/
│       │   ├── <docId>/
│       │   │   ├── original.<ext>           # original uploaded file
│       │   │   └── extracted.txt            # plain text extraction
│       │   └── ...
│       ├── crawl/
│       │   ├── <pageId>/
│       │   │   └── raw.txt                  # raw crawled text (backup)
│       │   └── ...
│       ├── tasks/
│       │   └── <taskId>/
│       │       └── output.<ext>             # generated documents
│       └── exports/
│           └── context-snapshot-<date>.json  # periodic context export
```

### 3.3 Vector Store — Qdrant Self-Hosted (Primary) / Pinecone Free Tier (Alternative)

> **Cost decision:** OpenSearch Serverless charges ~$50-200/mo baseline regardless of usage. Instead, we use **Qdrant running on your existing server** (completely free) or **Pinecone's free tier** (also free). Both support the same kNN vector operations. OpenSearch is documented as the **upgrade path** for when you exceed 500+ organizations at scale.

#### Option A: Qdrant Self-Hosted (Recommended for testing + early production)

Run Qdrant as a Docker container on the same server that hosts the backend API. Zero additional cost.

```yaml
# docker-compose.yml addition
qdrant:
  image: qdrant/qdrant:latest
  ports:
    - '6333:6333' # REST API
    - '6334:6334' # gRPC
  volumes:
    - qdrant_storage:/qdrant/storage
  restart: unless-stopped

volumes:
  qdrant_storage:
```

**Qdrant Collection Schema:**

```typescript
// Collection name: "lira-org-embeddings"
{
  name: "lira-org-embeddings",
  vectors: {
    size: 1536,            // OpenAI text-embedding-3-small dimensions
    distance: "Cosine"
  }
}

// Point (vector record) shape:
{
  id: string,             // UUID
  vector: number[],       // 1536-dimensional embedding
  payload: {
    orgId: string,
    sourceType: "document" | "website",
    sourceId: string,
    chunkIndex: number,
    text: string,
    docId?: string,
    fileName?: string,
    pageId?: string,
    category?: string,
    keywords?: string[],
    createdAt: string
  }
}
```

**Client:** `@qdrant/js-client-rest` (official Node.js client)

#### Option B: Pinecone Free Tier (Recommended if no persistent server available)

- **Free forever:** 1 serverless index, 2GB storage, 1M vector writes/month
- **Pay-as-you-go after:** ~$0.033/million reads + $0.08/GB storage
- No infrastructure to manage, no Docker required
- At early stage with < 50 organizations: **$0/mo**

**Client:** `@pinecone-database/pinecone` (official Node.js SDK)

#### Upgrade Path → OpenSearch (when needed)

When you have 500+ organizations with heavy document uploads, the vector store can be migrated to Amazon OpenSearch Serverless. The `VectorSearchService` interface is identical — only the adapter changes. This migration needs zero changes to any other service.

**Embedding Model:** OpenAI `text-embedding-3-small`  
**Dimensions:** 1536  
**Cost:** ~$0.00002 per 1K tokens (negligible — 1000 chunks = $0.002)

---

## 4. Phase 1 — Organization CRUD & Membership

### 4.1 Scope

- Create organization with profile
- Generate and manage invite codes
- Join organization via invite code
- List user's organizations
- Manage members (add, remove, change roles)
- Organization settings page

### 4.2 Backend Implementation

#### 4.2.1 New Service: `src/services/lira-org.service.ts`

```typescript
// Core operations
createOrganization(userId: string, data: CreateOrgInput): Promise<OrganizationProfile>
getOrganization(orgId: string): Promise<OrganizationProfile | null>
updateOrganization(orgId: string, data: UpdateOrgInput): Promise<OrganizationProfile>
deleteOrganization(orgId: string, userId: string): Promise<void>  // owner only

// Membership
joinOrganization(userId: string, inviteCode: string): Promise<OrgMembership>
leaveOrganization(orgId: string, userId: string): Promise<void>
getMembers(orgId: string): Promise<OrgMembership[]>
updateMemberRole(orgId: string, targetUserId: string, role: string, requesterId: string): Promise<void>
removeMember(orgId: string, targetUserId: string, requesterId: string): Promise<void>

// Invite codes
regenerateInviteCode(orgId: string, userId: string): Promise<string>
validateInviteCode(code: string): Promise<{ orgId: string; orgName: string } | null>

// Lookups
getUserOrganizations(userId: string): Promise<UserOrgLookup[]>
getOrganizationBySlug(slug: string): Promise<OrganizationProfile | null>
```

#### 4.2.2 New Route File: `src/routes/lira-org.routes.ts`

```
POST   /lira/v1/orgs                        → Create organization
GET    /lira/v1/orgs                        → List user's organizations
GET    /lira/v1/orgs/:orgId                 → Get organization details
PUT    /lira/v1/orgs/:orgId                 → Update organization profile
DELETE /lira/v1/orgs/:orgId                 → Delete organization (owner only)

POST   /lira/v1/orgs/join                   → Join via invite code
POST   /lira/v1/orgs/:orgId/leave           → Leave organization

GET    /lira/v1/orgs/:orgId/members         → List members
PUT    /lira/v1/orgs/:orgId/members/:userId → Update member role
DELETE /lira/v1/orgs/:orgId/members/:userId → Remove member

POST   /lira/v1/orgs/:orgId/invite-code/regenerate → Regenerate invite code
GET    /lira/v1/orgs/invite/:code/validate  → Validate invite code (public)
```

#### 4.2.3 Invite Code Generation

Format: `LRA-XXXX` where `XXXX` is 4 alphanumeric characters (uppercase + digits, excluding ambiguous: 0/O, 1/I/L).

Character set: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (29 chars)  
Possible codes: 29^4 = 707,281 — sufficient for early growth.  
Collision handling: Generate, check uniqueness in DynamoDB GSI, retry if collision.

#### 4.2.4 Authorization Model

| Action                   | Owner | Admin | Member |
| ------------------------ | ----- | ----- | ------ |
| View org profile         | ✅    | ✅    | ✅     |
| Edit org profile         | ✅    | ✅    | ❌     |
| Delete org               | ✅    | ❌    | ❌     |
| Manage members           | ✅    | ✅    | ❌     |
| Remove admin             | ✅    | ❌    | ❌     |
| Regenerate invite code   | ✅    | ✅    | ❌     |
| Upload documents         | ✅    | ✅    | ✅     |
| Delete documents         | ✅    | ✅    | ❌     |
| Deploy bot               | ✅    | ✅    | ✅     |
| Manage tasks             | ✅    | ✅    | ✅     |
| View knowledge base      | ✅    | ✅    | ✅     |
| Trigger website re-crawl | ✅    | ✅    | ❌     |

#### 4.2.5 DynamoDB GSI Required

```
GSI: inviteCode-index
  Partition Key: inviteCode (String)
  Projection: orgId, name, slug
  Purpose: Fast invite code lookup for join flow
```

### 4.3 Onboarding Flow

```
┌────────────────────────┐
│     User Signs Up      │
│  (Google OAuth / Email)│
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│  "Welcome to Lira AI"  │
│                        │
│  ┌──────────────────┐  │
│  │ Create a new     │  │
│  │ Organization     │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ Join an existing │  │
│  │ Organization     │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ Skip for now     │  │  ← allows personal use without org
│  │ (Personal mode)  │  │
│  └──────────────────┘  │
└───────────┬────────────┘
            ↓
     ┌──────┴──────┐
     ↓             ↓
┌──────────┐  ┌──────────┐
│  Create  │  │   Join   │
│  Form    │  │  Form    │
│          │  │          │
│ • Name   │  │ • Invite │
│ • Industry│ │   Code   │
│ • Desc   │  │          │
│ • Website│  │ Validate │
│ • Culture│  │ → Preview│
│          │  │ → Confirm│
└──────────┘  └──────────┘
     ↓             ↓
┌────────────────────────┐
│      Dashboard         │
│  (Org context loaded)  │
└────────────────────────┘
```

### 4.4 Files to Create / Modify

**New files:**

- `src/services/lira-org.service.ts`
- `src/routes/lira-org.routes.ts`
- `src/models/lira-org.models.ts`

**Modified files:**

- `src/index.ts` — register new routes
- `src/services/lira-store.service.ts` — add org table operations (or create dedicated `lira-org-store.service.ts`)

---

## 5. Phase 2 — Organization Profile & Context Injection

### 5.1 Scope

- Structured profile fields (industry, products, terminology, culture)
- Profile editing UI
- Basic context injection into `buildSystemPrompt()`
- Organization-aware bot deployment

### 5.2 Profile Fields — Detail

#### Products / Services

```typescript
// Input UI: Dynamic list with add/remove
products: [
  {
    name: 'PayStack API',
    description: 'Payment processing API for African markets',
    category: 'Core Product',
    status: 'active',
  },
  {
    name: 'Merchant Dashboard',
    description: 'Self-service portal for merchants',
    category: 'Core Product',
    status: 'active',
  },
  {
    name: 'KYC Module',
    description: 'Identity verification service',
    category: 'Compliance',
    status: 'beta',
  },
]
```

#### Terminology / Glossary

```typescript
// Input UI: Term + definition pairs with optional category tags
terminology: [
  {
    term: 'KYC',
    definition: 'Know Your Customer — identity verification process',
    category: 'Compliance',
  },
  {
    term: 'Settlement',
    definition: 'Transfer of funds from holding to merchant bank account',
    category: 'Payments',
  },
  {
    term: 'Chargeback',
    definition: 'Customer-initiated payment reversal through their bank',
    category: 'Payments',
  },
  {
    term: 'TPV',
    definition: 'Total Payment Volume — aggregate value of transactions processed',
    category: 'Metrics',
  },
]
```

#### Culture Profile

```typescript
// Input UI: Dropdowns + free-text
culture: {
  communicationStyle: "casual",          // dropdown: casual | professional | mixed
  meetingStyle: "freeform",              // dropdown: structured | freeform | hybrid
  decisionMaking: "data-driven",         // dropdown: consensus | top-down | data-driven | collaborative
  values: ["Move fast", "Customer-first", "Transparency"],  // tag input
  customNotes: "We always start standups with a fun question. Never call customers 'users.'"
}
```

### 5.3 Context Injection into System Prompt

Modify `buildSystemPrompt()` in `lira-sonic.service.ts` to accept an `organizationContext` parameter.

#### Token Budget

The Nova Sonic system prompt has a practical limit. Here's the budget:

```
Total available:               ~4,000 tokens
─────────────────────────────────────────────
Base Lira personality:           ~500 tokens
Wake word / mute rules:         ~200 tokens
Personality mode:                ~150 tokens
Participant awareness:           ~200 tokens
─────────────────────────────────────────────
Available for org context:     ~2,950 tokens
─────────────────────────────────────────────
Org profile (structured):        ~400 tokens
Relevant KB snippets (2-3):      ~600 tokens
Relevant RAG chunks (3-5):     ~1,000 tokens
Meeting-specific instructions:   ~200 tokens
Buffer:                          ~750 tokens
```

#### System Prompt Context Block Template

```
## Company Context

You are participating in a meeting for {org.name}, a {org.industry} company.
{org.description}

Communication style: {org.culture.communicationStyle}
Meeting style: {org.culture.meetingStyle}
Decision-making approach: {org.culture.decisionMaking}
{if org.culture.values} Company values: {org.culture.values.join(', ')} {/if}
{if org.culture.customNotes} Cultural notes: {org.culture.customNotes} {/if}

### Key Products/Services
{for product in org.products}
- {product.name}: {product.description} [{product.status}]
{/for}

### Domain Terminology
When people in this meeting use these terms, this is what they mean:
{for term in org.terminology}
- {term.term}: {term.definition}
{/for}

{if relevantKnowledge.length > 0}
### Relevant Company Knowledge
{for snippet in relevantKnowledge}
**{snippet.title}**: {snippet.summary}
{/for}
{/if}

{if relevantDocChunks.length > 0}
### From Company Documents
{for chunk in relevantDocChunks}
[{chunk.fileName}]: {chunk.text}
{/for}
{/if}
```

### 5.4 Bot Deployment Modification

Current `deployBot()` flow:

```
User calls POST /lira/v1/bot/deploy → botManager.deployBot(request, userId)
```

**Modified flow:**

```
User calls POST /lira/v1/bot/deploy
  → { meeting_url, session_id?, display_name?, settings?, org_id? }
  → If org_id provided:
      1. Validate user is member of org
      2. Load org profile from DynamoDB
      3. Build org context block
      4. Query vector search for meeting-relevant chunks (using meeting title / topic if available)
      5. Pass assembled context to startSession() → buildSystemPrompt()
  → If no org_id:
      1. Check if user belongs to exactly one org → auto-select
      2. If multiple orgs → use the one set as default, or omit context
      3. Proceed as today (no company context)
```

### 5.5 Files to Create / Modify

**New files:**

- `src/services/lira-context-builder.service.ts` — assembles context for a meeting session

**Modified files:**

- `src/services/lira-sonic.service.ts` — `buildSystemPrompt()` accepts org context
- `src/services/lira-bot/bot-manager.service.ts` — loads org context on deploy
- `src/models/lira-bot.models.ts` — `DeployBotRequest` gains `org_id` field
- `src/routes/lira-bot.routes.ts` — validate org_id in deploy request

---

## 6. Phase 3 — Website Crawl & Knowledge Base

### 6.1 Scope

- Accept website URL during org creation or profile update
- Crawl website pages (homepage, about, products, team, docs — max 50 pages)
- Extract text content from each page
- Summarize each page using LLM
- Extract keywords for relevance matching
- Store summaries in DynamoDB Knowledge Base records
- Store raw text backups in S3
- Support scheduled re-crawls (every 30 days) and manual re-crawl trigger
- Crawl additional URLs (docs site, blog, etc.)

### 6.2 Crawl Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Trigger     │ →   │  Discovery   │ →   │  Extraction  │ →   │  Summary     │
│  (API call   │     │  (Sitemap +  │     │  (HTML →     │     │  (LLM call   │
│   or cron)   │     │   Link crawl │     │   clean text)│     │   per page)  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                     ↓
                                                              ┌──────────────┐
                                                              │  Store       │
                                                              │  (DynamoDB + │
                                                              │   S3 + embed)│
                                                              └──────────────┘
```

### 6.3 Crawl Rules & Limits

| Parameter             | Value                                                                         | Rationale                                  |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Max pages per crawl   | 50                                                                            | Sufficient for most company sites          |
| Max depth             | 3 levels from root                                                            | Avoid deep crawling into unrelated content |
| Max page size         | 500KB HTML                                                                    | Skip large files (media, data dumps)       |
| Request delay         | 1 second between requests                                                     | Respectful crawling, avoid rate limits     |
| User-Agent            | `LiraAI-Crawler/1.0 (+https://lira.ai/crawler)`                               | Transparent identification                 |
| Respect robots.txt    | Yes                                                                           | Standard crawl etiquette                   |
| Timeout per page      | 10 seconds                                                                    | Avoid hanging on slow pages                |
| Allowed content types | `text/html` only                                                              | Skip PDFs, images, videos in crawl         |
| Excluded patterns     | `/login`, `/admin`, `/api/`, `/auth/`, `?session=`, query strings with tokens | Security — skip sensitive pages            |

### 6.4 Page Categories

The crawler auto-categorizes pages based on URL patterns and content:

| Category  | URL signals                                       | Content signals                      |
| --------- | ------------------------------------------------- | ------------------------------------ |
| `about`   | `/about`, `/company`, `/team`, `/our-story`       | "About us", "Our team", "Founded"    |
| `product` | `/product`, `/features`, `/solutions`, `/pricing` | "Features", "How it works", "Plans"  |
| `docs`    | `/docs`, `/help`, `/support`, `/faq`, `/guide`    | "Documentation", "Getting started"   |
| `blog`    | `/blog`, `/news`, `/updates`, `/changelog`        | Dates, author names                  |
| `careers` | `/careers`, `/jobs`, `/hiring`                    | "Open positions", "Join us"          |
| `legal`   | `/privacy`, `/terms`, `/legal`                    | "Privacy policy", "Terms of service" |
| `other`   | Anything else                                     | —                                    |

Priority for context injection: `about` > `product` > `docs` > `other` > `blog` > `careers` > `legal`

### 6.5 Summarization Prompt

```
You are a business analyst. Summarize the following webpage content in 200-400 words.
Focus on:
- What the company/product does
- Key features, services, or offerings mentioned
- Any specific data points, metrics, or claims
- Technical details relevant to understanding the business

Do NOT include:
- Navigation menus, footer text, cookie notices
- Marketing fluff without substance
- Content that is clearly boilerplate

Also extract 5-10 keywords that best represent this page's content.

Page Title: {title}
Page URL: {url}
Page Content:
{extracted_text}

Respond in JSON:
{
  "summary": "...",
  "keywords": ["...", "..."],
  "category": "about|product|docs|blog|careers|legal|other"
}
```

Model: `gpt-4o-mini` (cost-efficient, high quality for summarization)  
Fallback: `amazon.nova-lite-v1:0` via Bedrock

### 6.6 New Service: `src/services/lira-crawl.service.ts`

```typescript
// Core operations
crawlWebsite(orgId: string, url: string, options?: CrawlOptions): Promise<CrawlResult>
getCrawlStatus(orgId: string): Promise<CrawlStatus>
getKnowledgeBase(orgId: string): Promise<KnowledgeBaseEntry[]>
getKnowledgeBaseEntry(orgId: string, pageId: string): Promise<KnowledgeBaseEntry | null>
deleteKnowledgeBaseEntry(orgId: string, pageId: string): Promise<void>
clearKnowledgeBase(orgId: string): Promise<void>

// Scheduled
scheduleRecrawl(orgId: string, intervalDays: number): void
cancelRecrawl(orgId: string): void

// Retrieval
getRelevantKnowledge(orgId: string, query: string, maxResults?: number): Promise<KnowledgeBaseEntry[]>
```

### 6.7 Route Additions to `lira-org.routes.ts`

```
POST   /lira/v1/orgs/:orgId/crawl              → Trigger website crawl
GET    /lira/v1/orgs/:orgId/crawl/status        → Get crawl status
GET    /lira/v1/orgs/:orgId/knowledge-base      → List all KB entries
GET    /lira/v1/orgs/:orgId/knowledge-base/:id  → Get single KB entry
DELETE /lira/v1/orgs/:orgId/knowledge-base/:id  → Delete KB entry
DELETE /lira/v1/orgs/:orgId/knowledge-base      → Clear all KB entries
POST   /lira/v1/orgs/:orgId/crawl/schedule      → Set auto-recrawl interval
```

### 6.8 Crawl Processing — Async via SQS

Website crawling is a long-running operation. It should NOT block the API request.

```
POST /crawl → Enqueue SQS message → Return 202 Accepted + crawlJobId
                    ↓
            SQS Worker picks up job
                    ↓
            Crawl pages → Summarize → Store → Generate embeddings
                    ↓
            Update org.websiteCrawlStatus = "completed"
```

**SQS Queue:** `lira-crawl-jobs`  
**Message shape:**

```json
{
  "jobType": "website_crawl",
  "orgId": "uuid",
  "url": "https://abcompany.com",
  "options": { "maxPages": 50, "maxDepth": 3, "includeUrls": [] }
}
```

For initial implementation (single-server), the SQS consumer runs as an in-process worker within the Fastify server. For scale, it can be extracted to a separate ECS task.

### 6.9 Dependencies

```
cheerio              — HTML parsing and text extraction
robots-parser        — robots.txt parsing
```

---

## 7. Phase 4 — Document Upload, Parsing & RAG Pipeline

### 7.1 Scope

- File upload endpoint (multipart/form-data)
- Support formats: PDF, DOCX, TXT, MD, CSV, XLSX
- Upload to S3 with virus scanning
- Text extraction from each format
- Text chunking (512-token chunks with 50-token overlap)
- Embedding generation using OpenAI text-embedding-3-small (1536 dimensions)
- Store embeddings in Qdrant (self-hosted)
- Document management (list, view, delete)
- Google Drive URL ingestion (fetch shared doc → same pipeline)

### 7.2 Upload Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Upload   │ →   │  S3 Put  │ →   │  Extract │ →   │  Chunk   │ →   │  Embed   │
│  (multer) │     │  (store  │     │  (parse  │     │  (split  │     │ (OpenAI  │
│           │     │   orig)  │     │   text)  │     │  tokens) │     │  embed)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                                          ↓
                                                                    ┌──────────┐
                                                                    │  Qdrant  │
                                                                    │ (store   │
                                                                    │  vectors)│
                                                                    └──────────┘
```

### 7.3 File Size Limits

| Format   | Max Size | Rationale                    |
| -------- | -------- | ---------------------------- |
| PDF      | 50 MB    | Large reports, presentations |
| DOCX     | 25 MB    | Word documents               |
| TXT / MD | 10 MB    | Plain text files             |
| CSV      | 25 MB    | Data exports                 |
| XLSX     | 25 MB    | Spreadsheets                 |

**Total storage per organization:** 2 GB (all plans — gating is a frontend concern)

### 7.4 Text Extraction

| Format   | Library                     | Notes                                                     |
| -------- | --------------------------- | --------------------------------------------------------- |
| PDF      | `pdf-parse` (pdfjs wrapper) | Handles scanned PDFs via OCR fallback with `tesseract.js` |
| DOCX     | `mammoth`                   | Preserves structure, strips styling                       |
| TXT / MD | Direct read                 | UTF-8 assumed                                             |
| CSV      | `csv-parse`                 | Convert to readable table format                          |
| XLSX     | `xlsx` (SheetJS)            | Extract cell data per sheet                               |

### 7.5 Chunking Strategy

```typescript
interface ChunkingConfig {
  maxTokens: 512 // max tokens per chunk
  overlapTokens: 50 // overlap between consecutive chunks
  separator: 'paragraph' // split on paragraph boundaries first
  fallbackSeparator: 'sentence' // if paragraphs are too large
  minChunkTokens: 20 // discard tiny fragments
}
```

**Algorithm:**

1. Split document text by double newlines (paragraph boundaries)
2. If a paragraph exceeds 512 tokens, split by sentences (`. `, `? `, `! `)
3. If a sentence exceeds 512 tokens, split by token count with overlap
4. Merge adjacent tiny chunks (< 20 tokens) into previous chunk
5. Add 50-token overlap from previous chunk to start of each chunk (provides context continuity)

### 7.6 Embedding Generation

**Model:** OpenAI text-embedding-3-small  
**Dimensions:** 1536  
**Max input:** 8,191 tokens  
**Batch size:** 10 chunks per batch API call  
**Rate limit handling:** Exponential backoff with jitter

```typescript
// Embedding service interface
generateEmbedding(text: string): Promise<number[]>                    // single
generateEmbeddings(texts: string[]): Promise<number[][]>              // batch
```

Each chunk embedding is stored in Qdrant with metadata linking it back to the org, document, and chunk position.

### 7.7 New Service: `src/services/lira-document.service.ts`

```typescript
// Upload & processing
uploadDocument(orgId: string, file: MultipartFile, userId: string): Promise<DocumentRecord>
processDocument(orgId: string, docId: string): Promise<void>  // async — called by worker
getDocumentStatus(orgId: string, docId: string): Promise<DocumentRecord>
reprocessDocument(orgId: string, docId: string): Promise<void>

// Management
listDocuments(orgId: string): Promise<DocumentRecord[]>
getDocument(orgId: string, docId: string): Promise<DocumentRecord | null>
deleteDocument(orgId: string, docId: string): Promise<void>  // removes S3 + DynamoDB + vectors
getDocumentDownloadUrl(orgId: string, docId: string): Promise<string>  // presigned S3 URL

// External sources
ingestFromUrl(orgId: string, url: string, userId: string): Promise<DocumentRecord>  // Google Drive, Notion
```

### 7.8 New Service: `src/services/lira-embedding.service.ts`

```typescript
// Embedding operations
generateEmbedding(text: string): Promise<number[]>
generateEmbeddings(texts: string[]): Promise<number[][]>

// Chunk + embed pipeline
chunkAndEmbed(orgId: string, docId: string, text: string): Promise<{ chunkCount: number; embeddingCount: number }>

// Cleanup
deleteEmbeddingsForDocument(orgId: string, docId: string): Promise<void>
deleteEmbeddingsForOrg(orgId: string): Promise<void>
```

### 7.9 Route Additions

```
POST   /lira/v1/orgs/:orgId/documents              → Upload document (multipart)
GET    /lira/v1/orgs/:orgId/documents               → List documents
GET    /lira/v1/orgs/:orgId/documents/:docId         → Get document details + status
GET    /lira/v1/orgs/:orgId/documents/:docId/download → Get presigned download URL
DELETE /lira/v1/orgs/:orgId/documents/:docId         → Delete document + embeddings
POST   /lira/v1/orgs/:orgId/documents/:docId/reprocess → Re-extract + re-embed
POST   /lira/v1/orgs/:orgId/documents/ingest-url     → Ingest from external URL
```

### 7.10 Document Processing — Async via SQS

Same pattern as website crawl. Upload returns immediately, processing happens async.

```
POST /documents → Upload to S3 → Create DOC record (status: "uploaded")
               → Enqueue SQS message → Return 201 Created + docId
                       ↓
               Worker: Extract text → Chunk → Embed → Store in Qdrant
                       ↓
               Update DOC record (status: "indexed", chunkCount, embeddingCount)
```

**SQS Queue:** `lira-document-jobs` (or reuse `lira-crawl-jobs` with `jobType` discriminator)  
**Message shape:**

```json
{
  "jobType": "document_process",
  "orgId": "uuid",
  "docId": "uuid",
  "s3Key": "orgs/<orgId>/documents/<docId>/original.pdf",
  "fileType": "pdf"
}
```

### 7.11 Dependencies

```
@fastify/multipart   — file upload handling
pdf-parse            — PDF text extraction
mammoth              — DOCX to text
xlsx                 — spreadsheet parsing
csv-parse            — CSV parsing
tesseract.js         — OCR fallback for scanned PDFs (optional, heavy)
```

---

## 8. Phase 5 — Vector Search & Semantic Retrieval

### 8.1 Scope

- Qdrant self-hosted (Docker) OR Pinecone free tier setup
- Vector index/collection creation and management
- Semantic search queries (embed query → kNN search)
- Hybrid retrieval (vector + keyword)
- Context ranking & deduplication
- Integration with Context Builder service
- Pluggable adapter interface so the backend can be swapped (Qdrant → Pinecone → OpenSearch) with no changes to other services

### 8.2 Vector Store Setup

**Primary (Qdrant self-hosted):**

```bash
# Add to existing docker-compose.yml on your server
docker-compose up -d qdrant
# Qdrant is now available at http://localhost:6333
```

**Alternative (Pinecone free tier):**

1. Sign up at pinecone.io (free, no credit card needed for free tier)
2. Create a serverless index named `lira-org-embeddings`, dimension 1536, cosine distance
3. Add `PINECONE_API_KEY` to environment variables

**Upgrade path (OpenSearch Serverless):**  
Activate when revenue justifies it. Zero code changes required — only swap the adapter.

### 8.3 Vector Search Service: `src/services/lira-vector-search.service.ts`

```typescript
// Index management
createIndex(): Promise<void>                           // idempotent
deleteIndex(): Promise<void>

// Write operations
indexEmbedding(params: IndexEmbeddingParams): Promise<void>
bulkIndexEmbeddings(params: IndexEmbeddingParams[]): Promise<void>
deleteByDocId(orgId: string, docId: string): Promise<void>
deleteByOrgId(orgId: string): Promise<void>

// Search operations
semanticSearch(params: SemanticSearchParams): Promise<SearchResult[]>
hybridSearch(params: HybridSearchParams): Promise<SearchResult[]>

interface SemanticSearchParams {
  orgId: string;
  queryEmbedding: number[];          // pre-computed query embedding
  maxResults: number;                 // default: 5
  minScore: number;                   // default: 0.7
  filters?: {
    sourceType?: string[];            // ["document", "website"]
    category?: string[];
    docId?: string;
  };
}

interface HybridSearchParams extends SemanticSearchParams {
  queryText: string;                  // for keyword matching
  semanticWeight: number;             // 0.0 - 1.0 (default: 0.7)
  keywordWeight: number;              // 0.0 - 1.0 (default: 0.3)
}

interface SearchResult {
  text: string;
  score: number;
  sourceType: "document" | "website";
  sourceId: string;
  fileName?: string;
  pageTitle?: string;
  chunkIndex: number;
  category?: string;
  keywords?: string[];
}
```

### 8.4 Query Flow at Meeting Time

```
Bot deployment with org_id
  ↓
Context Builder receives meeting topic/title (if available)
  ↓
1. Load org profile from DynamoDB → structured context (~400 tokens)
2. If meeting title/topic exists:
     a. Generate embedding for query: embed(meeting_title + org.industry)
     b. Semantic search in Qdrant (filter: orgId, maxResults: 5, minScore: 0.7)
     c. Rank results by score
     d. Take top 3-5 chunks within token budget (~1000 tokens)
3. If no meeting title:
     a. Load top KB entries by category priority (about > product > docs)
     b. Limit to 2-3 entries (~600 tokens)
4. Assemble context block → inject into system prompt
```

### 8.5 Real-Time Context Refresh (During Meeting)

Once the meeting is underway and transcript accumulates:

1. Every 5 minutes (or when Lira detects a topic shift):
   - Take last 10 messages from transcript
   - Generate embedding of concatenated recent messages
   - Run semantic search against org knowledge
   - If new highly-relevant chunks found (score > 0.85) that differ from current context:
     - Stage the updated context text in memory (update the `orgContextText` variable held by the bot manager)
     - The refreshed context is applied on the **next Nova Sonic session restart** — Bedrock periodically ends Sonic sessions (due to timeout or transient errors), and the bot manager's `onSessionEnd` handler automatically restarts the session with the latest staged context. This is seamless to the user; there is no forced disconnect or audible gap.
     - **Definition of "natural restart":** A Sonic session restart triggered by Bedrock ending the current session (not by application code). The bot manager detects this via the `onSessionEnd` callback, waits a backoff delay (3s × retry count), and calls `sonic.startSession()` with the current `orgContextText` — which may have been refreshed by the 5-minute interval timer.
   - This is optional and can be toggled via `MeetingSettings.dynamic_context_refresh: boolean`

This ensures Lira's knowledge stays relevant as the conversation evolves.

### 8.6 Fallback: Keyword-Based Retrieval

If Qdrant is unavailable or not yet configured:

1. Fall back to DynamoDB keyword matching on KB entries
2. Match meeting title words against `keywords[]` array in KB records
3. Return matched entries sorted by keyword overlap count
4. This ensures the system degrades gracefully

---

## 9. Phase 6 — Context Injection into Nova Sonic

### 9.1 Scope

- Context Builder service that assembles final prompt context
- Dynamic context assembly based on available data
- Token counting and truncation
- Context caching (avoid re-building for session restarts)
- Integration with `buildSystemPrompt()` in Sonic service

### 9.2 Context Builder Service: `src/services/lira-context-builder.service.ts`

```typescript
interface ContextBuildParams {
  orgId: string;
  meetingTitle?: string;
  meetingTopic?: string;
  participantNames?: string[];
  recentTranscript?: string[];       // for mid-meeting refresh
}

interface BuiltContext {
  orgProfileBlock: string;           // structured company info
  knowledgeBlock: string;            // relevant KB summaries
  ragBlock: string;                  // relevant document chunks
  totalTokens: number;
  sources: ContextSource[];          // for attribution/citations
}

interface ContextSource {
  type: "profile" | "website" | "document";
  id: string;
  title: string;
  relevanceScore?: number;
}

// Main function
buildMeetingContext(params: ContextBuildParams): Promise<BuiltContext>

// Sub-functions
buildOrgProfileBlock(org: OrganizationProfile): string
selectRelevantKnowledge(orgId: string, query: string, maxTokens: number): Promise<string>
selectRelevantDocChunks(orgId: string, query: string, maxTokens: number): Promise<string>
countTokens(text: string): number
truncateToTokenLimit(text: string, maxTokens: number): string
```

### 9.3 Token Counting

Use a lightweight tokenizer. Options:

- `gpt-tokenizer` (npm) — fast, accurate for GPT-family models
- `tiktoken` — OpenAI's official tokenizer (WASM version for Node.js)

For Nova Sonic, token counts are approximate. GPT tokenizer gives a close-enough estimate.

### 9.4 Modified `buildSystemPrompt()` Signature

```typescript
// Current
function buildSystemPrompt(settings: MeetingSettings, participantNames?: string[]): string

// New
function buildSystemPrompt(
  settings: MeetingSettings,
  participantNames?: string[],
  organizationContext?: BuiltContext
): string
```

The function appends the org context blocks after the existing personality/wake-word sections. If `organizationContext` is undefined, the prompt is identical to today's behavior.

### 9.5 Context Caching

When a Sonic session restarts (auto-retry on disconnect), re-building context from scratch is wasteful. Cache the `BuiltContext` object in-memory keyed by `sessionId`:

```typescript
const contextCache = new Map<string, { context: BuiltContext; builtAt: number }>()

// Cache TTL: 10 minutes (context doesn't change often during a meeting)
// Invalidate on: org profile update, new document indexed, manual refresh
```

---

## 10. Phase 7 — Task Execution Engine

### 10.1 Scope

- Task extraction from meeting transcripts (AI-powered)
- Manual task creation during meetings
- Task types: action items, follow-ups, document drafts, research, summaries
- Task execution by Lira (for AI-executable tasks)
- Task notification via webhooks (Slack, email)
- Task management API (CRUD, status updates)
- Post-meeting task generation

### 10.2 Task Extraction Pipeline

```
Meeting ends (or manually triggered during meeting)
  ↓
Take full transcript
  ↓
LLM prompt: "Extract action items, decisions, follow-ups from this transcript"
  ↓
Structured output: [{ title, description, assignedTo, dueDate, priority, type, sourceQuote }]
  ↓
Create TaskRecord for each in DynamoDB
  ↓
If task.taskType is AI-executable → enqueue for execution
  ↓
Notify via webhook (if configured)
```

### 10.3 Task Extraction Prompt

```
You are analyzing a meeting transcript for a company called {org.name} in the {org.industry} industry.

Extract all actionable items from this transcript. For each, provide:
- title: Short, actionable title (5-10 words)
- description: Detailed description of what needs to be done
- assignedTo: Name of the person responsible (from the transcript, or "unassigned")
- priority: low | medium | high | urgent
- dueDate: If mentioned, in ISO-8601. If "by end of week" → next Friday. If not mentioned → null
- taskType: action_item | draft_document | research | follow_up_email | summary
- sourceQuote: The exact transcript snippet where this task was discussed

Also extract:
- Key decisions made (as "decision" type tasks with status "completed")
- Open questions that need follow-up

Participants in this meeting: {participantNames.join(', ')}

Transcript:
{transcript}

Respond in JSON array format.
```

Model: `gpt-4o` (needs strong reasoning for accurate extraction)

### 10.4 AI-Executable Task Types

| Task Type         | What Lira Does                            | Output                          |
| ----------------- | ----------------------------------------- | ------------------------------- |
| `summary`         | Generate meeting summary                  | Text (stored in meeting record) |
| `draft_document`  | Draft a document based on discussion      | Markdown file → S3              |
| `follow_up_email` | Draft follow-up email to participants     | Text with subject + body        |
| `research`        | Research a topic discussed in the meeting | Summary report text             |
| `action_item`     | Track only — not auto-executed            | N/A (manual completion)         |

### 10.5 Task Execution Worker

```
Task created with taskType in [draft_document, follow_up_email, research, summary]
  ↓
Enqueue execution job to SQS
  ↓
Worker picks up job:
  1. Load task record
  2. Load org context (for company-aware output)
  3. Load meeting transcript (for source material)
  4. Call LLM with task-specific prompt
  5. Store output (text in DynamoDB, files in S3)
  6. Update task: executionStatus = "completed", executionResult = output
  7. Send webhook notification
```

### 10.6 Webhook / Notification Service

```typescript
interface WebhookConfig {
  PK: `ORG#${string}`;
  SK: "WEBHOOK_CONFIG";
  slackWebhookUrl?: string;
  emailNotifications?: boolean;
  notifyOn: ("task_created" | "task_completed" | "meeting_ended" | "summary_ready")[];
}

// Notification service
sendSlackNotification(webhookUrl: string, payload: SlackPayload): Promise<void>
sendEmailNotification(to: string, subject: string, body: string): Promise<void>
notifyOrg(orgId: string, event: NotificationEvent): Promise<void>
```

### 10.7 New Services

- `src/services/lira-task.service.ts` — Task CRUD and extraction
- `src/services/lira-task-executor.service.ts` — AI task execution
- `src/services/lira-notification.service.ts` — Webhook/email notifications

### 10.8 Route Additions

```
POST   /lira/v1/orgs/:orgId/tasks               → Create task manually
GET    /lira/v1/orgs/:orgId/tasks               → List tasks (filterable by status, meeting, assignee)
GET    /lira/v1/orgs/:orgId/tasks/:taskId        → Get task details
PUT    /lira/v1/orgs/:orgId/tasks/:taskId        → Update task (status, assignment, etc.)
DELETE /lira/v1/orgs/:orgId/tasks/:taskId        → Delete task

POST   /lira/v1/meetings/:sessionId/extract-tasks → Extract tasks from meeting transcript
GET    /lira/v1/meetings/:sessionId/tasks         → Get tasks for a specific meeting

POST   /lira/v1/orgs/:orgId/tasks/:taskId/execute → Trigger AI execution of a task
GET    /lira/v1/orgs/:orgId/tasks/:taskId/result   → Get execution result

PUT    /lira/v1/orgs/:orgId/webhooks             → Configure webhook/notification settings
GET    /lira/v1/orgs/:orgId/webhooks             → Get webhook configuration
```

### 10.9 Real-Time Task Extraction (During Meeting)

Optional behavior: Lira can surface action items in real-time during the meeting.

When `MeetingSettings.proactive_suggest: true` and the conversation includes phrases like:

- "Let's make sure to..."
- "Can you handle..."
- "Action item:..."
- "We need to follow up on..."
- "By Friday, I need..."

Lira internally queues these as pending tasks. At meeting end, it confirms them:

> "I noted 3 action items from this meeting. Should I list them?"

If connected to the WebSocket frontend (not just bot mode), these tasks appear in real-time in the sidebar.

---

## 11. Phase 8 — Frontend Implementation

### 11.1 Scope

- Organization onboarding flow (create / join)
- Organization settings & profile management page
- Knowledge Base management page (view crawled pages, trigger re-crawl)
- Document upload & management page
- Task management page (list, filter, update status)
- Bot deployment integration (org selection)
- Org context indicator in meeting room

### 11.2 New Pages

| Page           | Route                | Description                                           |
| -------------- | -------------------- | ----------------------------------------------------- |
| Org Onboarding | `/onboarding`        | Create / Join flow (shown after first sign-up)        |
| Org Settings   | `/org/settings`      | Profile fields, culture, products, terminology        |
| Knowledge Base | `/org/knowledge`     | Crawled pages list, re-crawl button, delete entries   |
| Documents      | `/org/documents`     | Upload, list, status, delete, download                |
| Tasks          | `/org/tasks`         | Task board (pending, in-progress, completed), filters |
| Task Detail    | `/org/tasks/:taskId` | Task details, execution result, edit                  |
| Org Members    | `/org/members`       | Member list, role management, invite code display     |
| Webhooks       | `/org/webhooks`      | Notification configuration                            |

### 11.3 New Components

```
src/components/org/
├── OrgOnboarding.tsx               # Create / Join wizard
├── OrgOnboardingCreate.tsx         # Create form
├── OrgOnboardingJoin.tsx           # Join via invite code
├── OrgProfileForm.tsx              # Edit org profile fields
├── OrgCultureForm.tsx              # Culture settings
├── OrgProductsList.tsx             # Product/service list editor
├── OrgTerminologyList.tsx          # Glossary editor
├── OrgMembersList.tsx              # Member management
├── OrgInviteCode.tsx               # Display + copy + regenerate
├── index.ts

src/components/knowledge-base/
├── KnowledgeBaseList.tsx           # List of crawled pages
├── KnowledgeBaseEntry.tsx          # Single entry detail
├── CrawlStatusBanner.tsx           # Crawl in-progress indicator
├── CrawlTriggerButton.tsx          # Trigger re-crawl
├── index.ts

src/components/documents/
├── DocumentUpload.tsx              # Drag-and-drop upload
├── DocumentList.tsx                # List with status indicators
├── DocumentProcessingStatus.tsx    # Processing progress
├── index.ts

src/components/tasks/
├── TaskBoard.tsx                   # Kanban-style or list view
├── TaskCard.tsx                    # Individual task card
├── TaskDetail.tsx                  # Task detail panel
├── TaskCreateForm.tsx              # Manual task creation
├── TaskExecutionResult.tsx         # Display AI-generated output
├── index.ts
```

### 11.4 State Management Additions

```typescript
// New Zustand stores (or Redux slices)

interface OrgStore {
  currentOrg: OrganizationProfile | null
  userOrgs: UserOrgLookup[]
  members: OrgMembership[]
  isLoading: boolean

  // Actions
  fetchUserOrgs(): Promise<void>
  setCurrentOrg(orgId: string): Promise<void>
  createOrg(data: CreateOrgInput): Promise<void>
  joinOrg(inviteCode: string): Promise<void>
  updateOrgProfile(data: UpdateOrgInput): Promise<void>
}

interface KnowledgeBaseStore {
  entries: KnowledgeBaseEntry[]
  crawlStatus: CrawlStatus | null
  isLoading: boolean

  fetchKnowledgeBase(orgId: string): Promise<void>
  triggerCrawl(orgId: string): Promise<void>
  deleteEntry(orgId: string, pageId: string): Promise<void>
}

interface DocumentStore {
  documents: DocumentRecord[]
  uploadProgress: Map<string, number>
  isLoading: boolean

  fetchDocuments(orgId: string): Promise<void>
  uploadDocument(orgId: string, file: File): Promise<void>
  deleteDocument(orgId: string, docId: string): Promise<void>
}

interface TaskStore {
  tasks: TaskRecord[]
  filters: TaskFilters
  isLoading: boolean

  fetchTasks(orgId: string, filters?: TaskFilters): Promise<void>
  createTask(orgId: string, data: CreateTaskInput): Promise<void>
  updateTask(orgId: string, taskId: string, data: UpdateTaskInput): Promise<void>
  executeTask(orgId: string, taskId: string): Promise<void>
}
```

### 11.5 Bot Deployment UI Modification

Current deploy flow: User enters meeting URL → clicks Deploy.

**Modified flow:**

```
User enters meeting URL
  ↓
If user has 1 org → auto-selected, shown as badge: "Context: AB Company"
If user has multiple orgs → dropdown: "Deploy with context from:"
If user has no org → "Deploy without company context" (link to create org)
  ↓
Optional: Enter meeting topic/title (improves context relevance)
  ↓
Click Deploy → includes org_id in request
```

### 11.6 Meeting Room — Context Indicator

In the meeting room UI (when Lira is active), show a subtle indicator:

```
┌────────────────────────────────────────────────┐
│  🟢 Lira AI is active                          │
│  Context: AB Company · Fintech / Payments      │
│  Knowledge: 23 pages · 5 documents indexed     │
└────────────────────────────────────────────────┘
```

This reassures the user that Lira has the right company context loaded.

---

## 12. Phase 9 — Testing, Observability & Hardening

### 12.1 Testing Strategy

#### Unit Tests

| Area             | What to Test                                                                        |
| ---------------- | ----------------------------------------------------------------------------------- |
| Org Service      | CRUD operations, invite code generation/validation, membership roles, authorization |
| Context Builder  | Token counting, truncation, context assembly with various data combinations         |
| Crawl Service    | URL validation, robots.txt parsing, page categorization, text extraction            |
| Document Service | File type detection, chunking algorithm, embedding dimension validation             |
| Vector Search    | Query construction, filter application, score thresholds                            |
| Task Service     | Task extraction prompt formatting, task type classification                         |

#### Integration Tests

| Scenario               | Test                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| Full crawl pipeline    | Submit URL → crawl → summarize → store → verify retrieval                    |
| Full document pipeline | Upload PDF → extract → chunk → embed → verify search                         |
| Context injection      | Create org with profile → deploy bot → verify system prompt contains context |
| Task extraction        | Create meeting with transcript → extract tasks → verify task records         |
| Membership flow        | Create org → generate invite → join → verify membership                      |

#### Load Tests

| Test                        | Target                                                 |
| --------------------------- | ------------------------------------------------------ |
| Concurrent document uploads | 10 simultaneous uploads, all process successfully      |
| Vector search latency       | < 200ms p95 for kNN search with 100K embeddings        |
| Context building latency    | < 500ms for full context assembly (profile + KB + RAG) |
| Crawl throughput            | 50 pages crawled and summarized in < 5 minutes         |

### 12.2 Observability

#### Metrics (CloudWatch)

```
lira.org.created                    — Counter: organizations created
lira.org.joined                     — Counter: join-by-invite events
lira.crawl.pages_processed          — Counter: pages crawled
lira.crawl.duration_ms              — Histogram: crawl job duration
lira.document.uploaded              — Counter: documents uploaded
lira.document.processing_duration_ms — Histogram: document processing time
lira.embedding.generated            — Counter: embeddings created
lira.vector_search.latency_ms       — Histogram: search latency
lira.vector_search.results_count    — Histogram: results per query
lira.context.build_duration_ms      — Histogram: context assembly time
lira.context.token_count            — Histogram: tokens in assembled context
lira.task.extracted                  — Counter: tasks extracted from meetings
lira.task.executed                   — Counter: AI-executed tasks
```

#### Structured Logging

Every service operation logs:

```json
{
  "service": "lira-org",
  "operation": "crawlWebsite",
  "orgId": "uuid",
  "url": "https://...",
  "pagesFound": 23,
  "pagesCrawled": 20,
  "pagesSkipped": 3,
  "durationMs": 45000,
  "status": "completed"
}
```

### 12.3 Error Handling & Resilience

| Failure Mode              | Handling                                                      |
| ------------------------- | ------------------------------------------------------------- |
| Crawl fails mid-way       | Save progress, mark failed pages, allow retry of failed only  |
| OpenSearch unavailable    | Fall back to keyword-based KB retrieval from DynamoDB         |
| Embedding API rate limit  | Exponential backoff + jitter, max 5 retries                   |
| Document extraction fails | Mark document as "failed" with error message, allow reprocess |
| S3 upload fails           | Retry 3 times, then mark upload as failed                     |
| Invite code collision     | Regenerate up to 5 times, then use 6-char code                |

### 12.4 Data Cleanup & Retention

| Data                   | Retention                      | Cleanup                                                  |
| ---------------------- | ------------------------------ | -------------------------------------------------------- |
| Organization profiles  | Permanent                      | Only on explicit delete                                  |
| Knowledge base entries | Until re-crawl replaces them   | Old entries deleted when new crawl completes             |
| Uploaded documents     | Permanent (until user deletes) | S3 lifecycle policy for deleted docs: 30-day soft delete |
| Document embeddings    | Tied to document lifecycle     | Deleted when document is deleted                         |
| Tasks                  | Permanent                      | User can archive/delete                                  |
| Crawl raw text (S3)    | 90 days                        | S3 lifecycle policy                                      |
| Meeting transcripts    | 7 days (existing TTL)          | DynamoDB TTL (configurable per org in future)            |

---

## 13. API Reference

### 13.1 Organization Endpoints

| Method   | Path                                          | Auth         | Description                 |
| -------- | --------------------------------------------- | ------------ | --------------------------- |
| `POST`   | `/lira/v1/orgs`                               | JWT          | Create organization         |
| `GET`    | `/lira/v1/orgs`                               | JWT          | List user's organizations   |
| `GET`    | `/lira/v1/orgs/:orgId`                        | JWT + member | Get organization details    |
| `PUT`    | `/lira/v1/orgs/:orgId`                        | JWT + admin  | Update organization profile |
| `DELETE` | `/lira/v1/orgs/:orgId`                        | JWT + owner  | Delete organization         |
| `POST`   | `/lira/v1/orgs/join`                          | JWT          | Join org via invite code    |
| `POST`   | `/lira/v1/orgs/:orgId/leave`                  | JWT + member | Leave organization          |
| `GET`    | `/lira/v1/orgs/:orgId/members`                | JWT + member | List members                |
| `PUT`    | `/lira/v1/orgs/:orgId/members/:userId`        | JWT + admin  | Update member role          |
| `DELETE` | `/lira/v1/orgs/:orgId/members/:userId`        | JWT + admin  | Remove member               |
| `POST`   | `/lira/v1/orgs/:orgId/invite-code/regenerate` | JWT + admin  | Regenerate invite code      |
| `GET`    | `/lira/v1/orgs/invite/:code/validate`         | Public       | Validate invite code        |

### 13.2 Knowledge Base Endpoints

| Method   | Path                                      | Auth         | Description            |
| -------- | ----------------------------------------- | ------------ | ---------------------- |
| `POST`   | `/lira/v1/orgs/:orgId/crawl`              | JWT + admin  | Trigger website crawl  |
| `GET`    | `/lira/v1/orgs/:orgId/crawl/status`       | JWT + member | Get crawl status       |
| `GET`    | `/lira/v1/orgs/:orgId/knowledge-base`     | JWT + member | List KB entries        |
| `GET`    | `/lira/v1/orgs/:orgId/knowledge-base/:id` | JWT + member | Get single KB entry    |
| `DELETE` | `/lira/v1/orgs/:orgId/knowledge-base/:id` | JWT + admin  | Delete KB entry        |
| `DELETE` | `/lira/v1/orgs/:orgId/knowledge-base`     | JWT + admin  | Clear all KB entries   |
| `POST`   | `/lira/v1/orgs/:orgId/crawl/schedule`     | JWT + admin  | Configure auto-recrawl |

### 13.3 Document Endpoints

| Method   | Path                                              | Auth         | Description          |
| -------- | ------------------------------------------------- | ------------ | -------------------- |
| `POST`   | `/lira/v1/orgs/:orgId/documents`                  | JWT + member | Upload document      |
| `GET`    | `/lira/v1/orgs/:orgId/documents`                  | JWT + member | List documents       |
| `GET`    | `/lira/v1/orgs/:orgId/documents/:docId`           | JWT + member | Get document details |
| `GET`    | `/lira/v1/orgs/:orgId/documents/:docId/download`  | JWT + member | Get download URL     |
| `DELETE` | `/lira/v1/orgs/:orgId/documents/:docId`           | JWT + admin  | Delete document      |
| `POST`   | `/lira/v1/orgs/:orgId/documents/:docId/reprocess` | JWT + admin  | Reprocess document   |
| `POST`   | `/lira/v1/orgs/:orgId/documents/ingest-url`       | JWT + member | Ingest from URL      |

### 13.4 Task Endpoints

| Method   | Path                                         | Auth         | Description                |
| -------- | -------------------------------------------- | ------------ | -------------------------- |
| `POST`   | `/lira/v1/orgs/:orgId/tasks`                 | JWT + member | Create task manually       |
| `GET`    | `/lira/v1/orgs/:orgId/tasks`                 | JWT + member | List tasks                 |
| `GET`    | `/lira/v1/orgs/:orgId/tasks/:taskId`         | JWT + member | Get task details           |
| `PUT`    | `/lira/v1/orgs/:orgId/tasks/:taskId`         | JWT + member | Update task                |
| `DELETE` | `/lira/v1/orgs/:orgId/tasks/:taskId`         | JWT + admin  | Delete task                |
| `POST`   | `/lira/v1/orgs/:orgId/tasks/:taskId/execute` | JWT + member | Execute task via AI        |
| `GET`    | `/lira/v1/orgs/:orgId/tasks/:taskId/result`  | JWT + member | Get execution result       |
| `POST`   | `/lira/v1/meetings/:sessionId/extract-tasks` | JWT          | Extract tasks from meeting |
| `GET`    | `/lira/v1/meetings/:sessionId/tasks`         | JWT          | Get tasks for meeting      |

### 13.5 Webhook Endpoints

| Method | Path                                 | Auth        | Description            |
| ------ | ------------------------------------ | ----------- | ---------------------- |
| `GET`  | `/lira/v1/orgs/:orgId/webhooks`      | JWT + admin | Get webhook config     |
| `PUT`  | `/lira/v1/orgs/:orgId/webhooks`      | JWT + admin | Update webhook config  |
| `POST` | `/lira/v1/orgs/:orgId/webhooks/test` | JWT + admin | Send test notification |

### 13.6 Modified Existing Endpoints

| Endpoint                            | Change                                                    |
| ----------------------------------- | --------------------------------------------------------- |
| `POST /lira/v1/bot/deploy`          | Add optional `org_id` and `meeting_topic` to request body |
| `GET /lira/v1/meetings/:id`         | Response includes `orgId`, `orgName` if org-linked        |
| `GET /lira/v1/meetings/:id/summary` | Summary includes task count if tasks were extracted       |

---

## 14. Pricing Tiers & Feature Matrix

> **Implementation note:** ALL features below are fully implemented. Plan-based gating is enforced at the API middleware level (check `org.plan` before allowing operation) and at the frontend (hide/show UI elements). The underlying functionality exists regardless of plan.

### 14.1 Plans

| Feature                                   | Free            | Basic ($19/seat/mo)      | Pro ($49/seat/mo)          | Enterprise (Custom)            |
| ----------------------------------------- | --------------- | ------------------------ | -------------------------- | ------------------------------ |
| **Organization**                          |                 |                          |                            |                                |
| Create organization                       | 1 org           | 1 org                    | 3 orgs                     | Unlimited                      |
| Members per org                           | 3               | 10                       | 50                         | Unlimited                      |
| Org profile (name, industry, description) | ✅              | ✅                       | ✅                         | ✅                             |
| Culture & communication settings          | ✅              | ✅                       | ✅                         | ✅                             |
| Products / services list                  | 3 max           | 10 max                   | Unlimited                  | Unlimited                      |
| Terminology / glossary                    | 10 terms        | 50 terms                 | Unlimited                  | Unlimited                      |
| Custom AI personality notes               | ❌              | ✅                       | ✅                         | ✅                             |
|                                           |                 |                          |                            |                                |
| **Knowledge Base**                        |                 |                          |                            |                                |
| Website crawl                             | 1 URL, 10 pages | 1 URL, 25 pages          | 5 URLs, 50 pages each      | Unlimited URLs, 100 pages each |
| Auto re-crawl                             | ❌              | Every 30 days            | Every 7 days               | Custom interval                |
| Manual re-crawl                           | 1/month         | 4/month                  | Unlimited                  | Unlimited                      |
| Google Drive link ingestion               | ❌              | ❌                       | ✅                         | ✅                             |
| Notion link ingestion                     | ❌              | ❌                       | ✅                         | ✅                             |
|                                           |                 |                          |                            |                                |
| **Document Upload & RAG**                 |                 |                          |                            |                                |
| Document uploads                          | ❌              | 5 documents, 50 MB total | 50 documents, 500 MB total | Unlimited, 5 GB total          |
| Supported formats                         | —               | PDF, TXT, MD             | PDF, DOCX, TXT, MD, CSV    | All + XLSX                     |
| RAG retrieval in meetings                 | ❌              | ✅ (basic)               | ✅ (hybrid search)         | ✅ (hybrid + re-ranking)       |
| OCR for scanned PDFs                      | ❌              | ❌                       | ✅                         | ✅                             |
|                                           |                 |                          |                            |                                |
| **Meetings & Bot**                        |                 |                          |                            |                                |
| Bot deployments per month                 | 5               | 30                       | Unlimited                  | Unlimited                      |
| Meeting duration limit                    | 30 min          | 2 hours                  | 4 hours                    | 8 hours                        |
| Concurrent bots                           | 1               | 2                        | 3                          | 10                             |
| Meeting transcript retention              | 3 days          | 7 days                   | 30 days                    | 90 days (configurable)         |
| AI personality modes                      | Supportive only | All 4                    | All 4 + custom             | All + custom + per-meeting     |
| Wake word mode                            | ✅              | ✅                       | ✅                         | ✅                             |
| Mid-meeting context refresh               | ❌              | ❌                       | ✅                         | ✅                             |
| Audio recording storage                   | ❌              | 7 days                   | 30 days                    | 90 days                        |
|                                           |                 |                          |                            |                                |
| **Tasks & Execution**                     |                 |                          |                            |                                |
| Auto task extraction                      | ❌              | ✅ (action items only)   | ✅ (all types)             | ✅ (all types)                 |
| Manual task creation                      | ✅ (5/meeting)  | ✅                       | ✅                         | ✅                             |
| AI task execution                         | ❌              | Summary only             | All types                  | All types + custom             |
| Task notifications (webhook)              | ❌              | ❌                       | Slack                      | Slack + Email + Custom webhook |
|                                           |                 |                          |                            |                                |
| **Integrations**                          |                 |                          |                            |                                |
| Google Meet                               | ✅              | ✅                       | ✅                         | ✅                             |
| Zoom                                      | ❌              | ✅                       | ✅                         | ✅                             |
| Microsoft Teams                           | ❌              | ❌                       | ❌                         | ✅                             |
| Slack notifications                       | ❌              | ❌                       | ✅                         | ✅                             |
| Email notifications                       | ❌              | ❌                       | ❌                         | ✅                             |
| Custom webhook                            | ❌              | ❌                       | ❌                         | ✅                             |
| API access                                | ❌              | ❌                       | ✅                         | ✅                             |
| SSO (SAML/OIDC)                           | ❌              | ❌                       | ❌                         | ✅                             |
|                                           |                 |                          |                            |                                |
| **Support**                               |                 |                          |                            |                                |
| Community support                         | ✅              | ✅                       | ✅                         | ✅                             |
| Email support                             | ❌              | ✅                       | ✅                         | ✅                             |
| Priority support                          | ❌              | ❌                       | ✅                         | ✅                             |
| Dedicated account manager                 | ❌              | ❌                       | ❌                         | ✅                             |
| SLA                                       | None            | 99.5%                    | 99.9%                      | 99.95%                         |

### 14.2 Plan Enforcement Architecture

```typescript
// Middleware: src/middleware/plan-gate.middleware.ts

interface PlanLimits {
  maxOrgs: number
  maxMembersPerOrg: number
  maxProducts: number
  maxTerms: number
  maxCrawlUrls: number
  maxCrawlPagesPerUrl: number
  maxDocuments: number
  maxDocumentStorageMb: number
  maxBotsPerMonth: number
  maxMeetingDurationMs: number
  maxConcurrentBots: number
  meetingRetentionDays: number
  features: {
    customAiPersonality: boolean
    autoRecrawl: boolean
    googleDriveIngestion: boolean
    notionIngestion: boolean
    documentUpload: boolean
    ragRetrieval: boolean
    hybridSearch: boolean
    ocrPdf: boolean
    midMeetingContextRefresh: boolean
    taskExtraction: boolean
    taskExecution: boolean
    slackNotifications: boolean
    emailNotifications: boolean
    customWebhook: boolean
    apiAccess: boolean
    sso: boolean
  }
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { maxOrgs: 1, maxMembersPerOrg: 3 /* ... */ },
  basic: { maxOrgs: 1, maxMembersPerOrg: 10 /* ... */ },
  pro: { maxOrgs: 3, maxMembersPerOrg: 50 /* ... */ },
  enterprise: { maxOrgs: -1, maxMembersPerOrg: -1 /* ... */ }, // -1 = unlimited
}

// Usage in route handler
fastify.post('/lira/v1/orgs/:orgId/documents', {
  preHandler: [authenticate, requireOrgMember, requireFeature('documentUpload')],
  handler: async (req, reply) => {
    /* ... */
  },
})
```

---

## 15. Security & Data Isolation

### 15.1 Multi-Tenancy Isolation

```
┌────────────────────────────────────────┐
│          DynamoDB Queries              │
│                                        │
│  ALWAYS include PK = "ORG#<orgId>"     │
│  in every query. There is NO cross-org │
│  query path.                           │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│          OpenSearch Queries            │
│                                        │
│  ALWAYS include filter:               │
│    orgId = "<orgId>"                   │
│  in every vector search.              │
│  No query can return results from     │
│  a different org.                     │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│          S3 Access                     │
│                                        │
│  Objects are namespaced under:         │
│    orgs/<orgId>/...                    │
│  Presigned URLs are scoped to the      │
│  specific object. No directory listing.│
└────────────────────────────────────────┘
```

### 15.2 Authorization Flow

Every org-scoped request:

1. **Authenticate** — Verify JWT, extract userId
2. **Resolve org** — Extract orgId from URL path
3. **Check membership** — Query `ORG#<orgId> / MEMBER#<userId>` in DynamoDB
4. **Check role** — Compare user's role against required permission
5. **Proceed or reject** — 403 Forbidden if not authorized

```typescript
// Middleware chain
const orgAdminAuth = [authenticate, resolveOrg, requireOrgRole('admin')]
const orgMemberAuth = [authenticate, resolveOrg, requireOrgRole('member')]
const orgOwnerAuth = [authenticate, resolveOrg, requireOrgRole('owner')]
```

### 15.3 Data Privacy

- **Website crawl:** Only crawls public pages. Respects robots.txt. Identifies itself via User-Agent.
- **Document uploads:** Files encrypted at rest (S3 SSE-S3). Presigned URLs expire after 1 hour.
- **Embeddings:** Stored in OpenSearch with encryption at rest. Org-scoped queries only.
- **AI context:** Never stored in LLM provider logs. System prompts are not logged in plain text.
- **Invite codes:** Not guessable (29^4 = 707,281 combinations). Rate-limited validation endpoint.
- **Cross-org contamination:** Impossible by design — PK-scoped DynamoDB, filtered OpenSearch, namespaced S3.

### 15.4 Input Validation (Zod Schemas)

Every endpoint validates input with Zod:

```typescript
const CreateOrgSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  industry: z.string().min(2).max(100).trim(),
  description: z.string().max(2000).trim(),
  websiteUrl: z.string().url().optional(),
  culture: z
    .object({
      communicationStyle: z.enum(['casual', 'professional', 'mixed']),
      meetingStyle: z.enum(['structured', 'freeform', 'hybrid']),
      decisionMaking: z.enum(['consensus', 'top-down', 'data-driven', 'collaborative']),
      values: z.array(z.string().max(50)).max(10).optional(),
      customNotes: z.string().max(1000).optional(),
    })
    .optional(),
  products: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        category: z.string().max(50).optional(),
        status: z.enum(['active', 'beta', 'deprecated', 'planned']).optional(),
      })
    )
    .max(50)
    .optional(),
  terminology: z
    .array(
      z.object({
        term: z.string().min(1).max(50),
        definition: z.string().min(1).max(200),
        category: z.string().max(50).optional(),
      })
    )
    .max(200)
    .optional(),
})
```

### 15.5 Rate Limiting

| Endpoint                                   | Limit | Window   |
| ------------------------------------------ | ----- | -------- |
| `POST /orgs`                               | 5     | 1 hour   |
| `POST /orgs/join`                          | 10    | 1 hour   |
| `GET /orgs/invite/:code/validate`          | 20    | 1 minute |
| `POST /orgs/:orgId/crawl`                  | 5     | 1 hour   |
| `POST /orgs/:orgId/documents`              | 20    | 1 hour   |
| `POST /orgs/:orgId/tasks/:taskId/execute`  | 10    | 1 hour   |
| `POST /orgs/:orgId/invite-code/regenerate` | 5     | 1 hour   |

---

## 16. Infrastructure & AWS Resources

### 16.1 New AWS Resources Required

> **Cost philosophy:** Everything is pay-as-you-go. At testing stage with low usage, the total additional cost of this entire feature is **under $5/mo**. Your existing $300 AWS credits cover all AWS costs here for a long time.

#### AWS Resources (All covered by your $300 credits)

| Resource                                 | Purpose                                                 | Estimated Cost                                         |
| ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| **DynamoDB Table: `lira-organizations`** | Org profiles, memberships, KB entries, documents, tasks | ~$0-3/mo at low volume (on-demand, pay per read/write) |
| **S3 Bucket: `lira-organization-data`**  | Document storage, crawl backups, task outputs           | ~$0.023/GB/mo — 10GB = $0.23/mo                        |
| **SQS Queue: `lira-async-jobs`**         | Async processing (crawl, document, task execution)      | ~$0 (first 1M requests/mo free forever)                |
| **CloudWatch**                           | Basic logs                                              | ~$0 (within free tier)                                 |

#### Non-AWS Resources (Third-party)

| Resource                                      | Purpose                                          | Cost                                                        |
| --------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| **Qdrant (self-hosted Docker)**               | Vector embeddings for RAG                        | **$0** — runs on your existing server                       |
| **Pinecone Free Tier** (alternative)          | Vector embeddings if no persistent server        | **$0** — free tier, no credit card                          |
| **OpenAI — text-embedding-3-small**           | Generate embeddings before storing               | **~$0.00002/1K tokens** — indexing 1000 pages = $0.01 total |
| **OpenAI — GPT-4o-mini** (already integrated) | Page summarization, task extraction              | **~$0.001/meeting** — 200 meetings = $0.20/mo               |
| **OpenAI — GPT-4o**                           | High-quality task execution (draft docs, emails) | **~$0.01/task execution** — 50 tasks = $0.50/mo             |

#### Honest Cost Reality

| Stage                                 | Monthly Additional Cost | What's running                                                  |
| ------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| **Testing (you alone)**               | **~$0-1**               | DynamoDB + S3 at near-zero, Qdrant in Docker free, OpenAI cents |
| **Early users (< 20 orgs)**           | **~$2-5**               | Same infrastructure, slightly more DynamoDB reads               |
| **Growth (100+ orgs, 50+ docs each)** | **~$15-30**             | S3 storage grows, OpenAI API grows with usage                   |
| **Scale (500+ orgs)**                 | **~$50-100**            | Migrate vector store to OpenSearch at this point                |

**Total additional cost today: ~$0-1/mo.** Your $300 AWS credits will last months.

#### OpenSearch Serverless — Scale-Up Path

Document this for the future: When you have 500+ organizations with 50+ documents each, migrate the vector store from Qdrant/Pinecone to Amazon OpenSearch Serverless. At that point, you'll have enough paying customers to cover the ~$50-200/mo baseline cost easily. The migration is a configuration change in one service file.

### 16.2 Environment Variables (New)

```env
# Organization system
LIRA_DYNAMODB_ORGS_TABLE=lira-organizations
LIRA_S3_ORG_DATA_BUCKET=lira-organization-data

# Vector store (choose ONE — Qdrant OR Pinecone)
# --- Option A: Qdrant self-hosted (recommended)
LIRA_VECTOR_STORE_PROVIDER=qdrant
LIRA_QDRANT_URL=http://localhost:6333        # local Docker
# LIRA_QDRANT_URL=https://your-server:6333   # if on remote server
LIRA_QDRANT_COLLECTION=lira-org-embeddings

# --- Option B: Pinecone free tier
# LIRA_VECTOR_STORE_PROVIDER=pinecone
# PINECONE_API_KEY=pc-xxxx
# PINECONE_INDEX_NAME=lira-org-embeddings

# Embedding model (OpenAI — already have the key)
LIRA_EMBEDDING_MODEL=text-embedding-3-small
LIRA_EMBEDDING_DIMENSIONS=1536

# Async processing
LIRA_SQS_ASYNC_JOBS_URL=https://sqs.<region>.amazonaws.com/<account>/lira-async-jobs

# Crawl settings
LIRA_CRAWL_MAX_PAGES_DEFAULT=50
LIRA_CRAWL_DELAY_MS=1000
LIRA_CRAWL_USER_AGENT=LiraAI-Crawler/1.0

# Task execution (OpenAI — already integrated)
LIRA_TASK_EXECUTION_MODEL=gpt-4o
LIRA_TASK_EXTRACTION_MODEL=gpt-4o-mini
```

### 16.3 IAM Permissions (Additional)

> Note: No `aoss:*` (OpenSearch Serverless) or `bedrock:InvokeModel` for embeddings needed. Embeddings are generated via OpenAI (already integrated). Vector store (Qdrant/Pinecone) uses HTTP API keys, not IAM.

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:UpdateItem",
    "dynamodb:BatchWriteItem"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/lira-organizations*"
},
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::lira-organization-data",
    "arn:aws:s3:::lira-organization-data/*"
  ]
},
{
  "Effect": "Allow",
  "Action": [
    "sqs:SendMessage",
    "sqs:ReceiveMessage",
    "sqs:DeleteMessage",
    "sqs:GetQueueAttributes"
  ],
  "Resource": "arn:aws:sqs:*:*:lira-async-jobs"
}
```

---

## 17. Migration Strategy

### 17.1 Database Migration

This is a new feature — no existing data to migrate. Steps:

1. Create `lira-organizations` DynamoDB table with GSI
2. Create `lira-organization-data` S3 bucket with lifecycle policies
3. Add Qdrant to `docker-compose.yml` on your server (or create Pinecone free account)
4. Create `lira-async-jobs` SQS queue
5. Deploy backend with new routes and services
6. Deploy frontend with new pages

### 17.2 Existing User Migration

For users who already have accounts but no organization:

- On first login after feature launch, show onboarding modal: "Set up your Organization"
- Allow "Skip for now" — the app works without an org (same as today)
- Existing meetings remain unlinked to any organization
- Once an org is created, new meetings auto-link if bot is deployed with org_id

### 17.3 Backward Compatibility

- All existing API endpoints work unchanged
- Bot deployment without `org_id` works exactly as today
- `buildSystemPrompt()` without `organizationContext` produces identical output
- Meeting records without `orgId` are unaffected
- No breaking changes to the WebSocket protocol

---

## Implementation Order Summary

| Phase | Name                                     | Dependencies | Key Deliverables                                                      |
| ----- | ---------------------------------------- | ------------ | --------------------------------------------------------------------- |
| **1** | Organization CRUD & Membership           | None         | Org service, routes, models, invite codes, membership                 |
| **2** | Organization Profile & Context Injection | Phase 1      | Profile fields, context builder, modified system prompt               |
| **3** | Website Crawl & Knowledge Base           | Phases 1-2   | Crawler, summarizer, KB storage, SQS async processing                 |
| **4** | Document Upload, Parsing & RAG           | Phases 1-3   | S3 upload, text extraction, chunking, OpenAI embeddings               |
| **5** | Vector Search & Semantic Retrieval       | Phase 4      | Qdrant/Pinecone setup, kNN search, hybrid retrieval, keyword fallback |
| **6** | Context Injection into Nova Sonic        | Phases 2-5   | Full context assembly, token management, caching                      |
| **7** | Task Execution Engine                    | Phases 1-2   | Task extraction, AI execution, webhook notifications                  |
| **8** | Frontend Implementation                  | Phases 1-7   | All new pages, components, stores, modified deploy flow               |
| **9** | Testing, Observability & Hardening       | All phases   | Unit/integration/load tests, metrics, logging, error handling         |

Each phase is independently shippable and testable. Phase N can be deployed before Phase N+1 is started. The system degrades gracefully — missing phases simply mean less context available to Lira.

---

_End of specification._

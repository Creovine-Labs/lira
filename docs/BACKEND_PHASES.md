# Lira AI Backend — Implementation Phases
## Role 2: Backend Engineer — What to Build, What to Expect, What's Real

**Language:** Go 1.22+  
**Your Role:** Backend Engineer & Infrastructure Lead  
**Status:** Implementation-ready  

> This document is timeline-agnostic. It describes what to build, in what order,
> what you do yourself, what you need from others, and what you can proceed with
> independently. Every decision has a rationale.

---

## Table of Contents

1. [Reality Check: Is This Possible?](#reality-check)
2. [Cross-Role Dependency Map](#cross-role-dependency-map)
3. [Phase 0: Local Machine Setup](#phase-0-local-machine-setup)
4. [Phase 1: AWS Foundation & Nova Validation](#phase-1-aws-foundation--nova-validation)
5. [Phase 2: WebSocket Gateway](#phase-2-websocket-gateway)
6. [Phase 3: Meeting State & Context Storage](#phase-3-meeting-state--context-storage)
7. [Phase 4: Nova Sonic Integration (Speech)](#phase-4-nova-sonic-integration)
8. [Phase 5: Nova Lite Integration (Reasoning)](#phase-5-nova-lite-integration)
9. [Phase 6: Audio Pipeline & Orchestration](#phase-6-audio-pipeline--orchestration)
10. [Phase 7: End-to-End Flow](#phase-7-end-to-end-flow)
11. [Phase 8: Hardening](#phase-8-hardening)
12. [Phase 9: Observability & Monitoring](#phase-9-observability--monitoring)
13. [Phase 10: Production Deployment & Demo Readiness](#phase-10-production-deployment--demo-readiness)
14. [Appendix A: Manual Steps Checklist](#appendix-a-manual-steps-checklist)
15. [Appendix B: Exact Go Dependencies](#appendix-b-exact-go-dependencies)
16. [Appendix C: Complete SAM Template](#appendix-c-complete-sam-template)
17. [Appendix D: Environment Variables Reference](#appendix-d-environment-variables-reference)
18. [Appendix E: WebSocket Message Contract](#appendix-e-websocket-message-contract)

---

## Reality Check
<a id="reality-check"></a>

### Is this project possible?

**Yes.** Every component uses proven AWS services and a well-supported language. There is nothing research-grade here. The hardest part is the real-time audio ↔ AI loop, and Amazon built Nova Sonic specifically for this use case.

### What makes it hard (honestly)

| Challenge | Why It's Hard | Why It's Solvable |
|-----------|---------------|-------------------|
| Real-time bidirectional audio | Latency sensitivity, buffering, packet handling | Nova Sonic provides a bidirectional streaming WebSocket API designed for this |
| End-to-end latency < 2.5s | Multiple network hops: client → gateway → Lambda → Bedrock → Lambda → client | Streaming at every stage (never wait for full results), Lambda in same region as Bedrock |
| WebSocket state management | API Gateway WebSocket API is stateless per invocation — no persistent server memory | DynamoDB for durable state, connection table for routing |
| Audio format handling | Browser sends raw PCM/opus, Nova expects specific formats | Standard codec conversions, well-documented browser APIs |
| Nova Sonic API shape | It uses `InvokeModelWithBidirectionalStream` — a WebSocket-style bidirectional stream, NOT regular `InvokeModel` | AWS SDK Go v2 supports this; there are published examples |

### What can go wrong and what to do

| Scenario | Fallback |
|----------|----------|
| Nova Sonic not available in your region | Use `us-east-1`. All Bedrock models launch there first. |
| Nova Sonic API differs from expected format | You validate this in Phase 1 before building anything on top. Adjust wrapper accordingly. |
| Latency exceeds 3 seconds | Skip the separate Lambda hops — put audio processing + Nova calls in a single ECS container with a persistent WebSocket |
| Go SDK doesn't support bidirectional streaming yet | Use the raw HTTP/2 or WebSocket connection directly — Bedrock's bidirectional stream endpoint is a standard WebSocket |
| ElastiCache complexity too early | Skip it entirely — use DynamoDB only. Add caching later if latency proves it necessary (it probably won't for MVP) |

---

## Cross-Role Dependency Map
<a id="cross-role-dependency-map"></a>

This is the most important section. It defines exactly what you can build alone and where you're blocked.

### What You (Backend) Build Alone — No Dependencies

These you can start immediately and complete without anyone else:

| Component | Description |
|-----------|-------------|
| AWS account setup | IAM, Bedrock access, credentials |
| SAM/CloudFormation templates | All infrastructure as code |
| DynamoDB tables | Schema design, deployment, CRUD operations |
| S3 buckets | Audio storage with lifecycle rules |
| API Gateway WebSocket API | Routes, stages, deployment |
| Connection management Lambda | $connect, $disconnect, connection table |
| Context manager Lambda | Meeting state CRUD |
| Nova Lite integration | Text reasoning via Bedrock |
| Nova Sonic integration | Speech-to-text, text-to-speech via Bedrock |
| Response generator Lambda | Full AI response pipeline |
| CloudWatch dashboards | Metrics, alarms, logs |
| IAM roles & policies | Least-privilege security |
| Local testing infrastructure | SAM local, test events, mocks |
| CI/CD pipeline | GitHub Actions for backend |

### What You Need FROM Other Roles

| You Need | From Whom | What Exactly | Can You Proceed Without It? |
|----------|-----------|--------------|---------------------------|
| Audio format from browser | **Role 3 (Frontend)** | What format does WebAudio/WebRTC send? (PCM 16-bit? Opus? Sample rate?) | **YES** — assume PCM 16-bit, 16kHz mono. This is the standard for speech. Document the contract and let frontend conform to it. |
| WebSocket message schema agreement | **Role 3 (Frontend)** | JSON message structure for audio chunks, triggers, responses | **YES** — you define the contract (Appendix E). Frontend implements to it. |
| Prompt engineering & personality prompts | **Role 1 (AI/ML)** | Exact system prompts, temperature settings, personality definitions | **PARTIALLY** — write placeholder prompts yourself. Role 1 refines them later. The backend code doesn't change, only prompt strings. |
| Nova model IDs & API behavior | **Role 1 (AI/ML)** | Confirmed model IDs, request/response shapes | **YES** — you validate this yourself in Phase 1. You're calling the SDK directly. |
| CI/CD pipeline structure | **Role 4 (DevOps)** | GitHub Actions workflow, branch strategy | **YES** — create your own backend deployment workflow. DevOps can restructure later. |
| TURN/STUN server configuration | **Role 3 (Frontend)** | WebRTC signaling setup | **NOT YOUR PROBLEM** — WebRTC peer connections are frontend's domain. You only handle the WebSocket data channel. |

### What Other Roles Need FROM You

| They Need | Who Needs It | What Exactly | When They Need It |
|-----------|-------------|--------------|-------------------|
| WebSocket endpoint URL | **Role 3 (Frontend)** | `wss://xxx.execute-api.us-east-1.amazonaws.com/dev` | As soon as Phase 2 is done |
| Message contract | **Role 3 (Frontend)** | JSON schemas for all WebSocket messages (Appendix E) | Before they start WebSocket client work |
| REST API endpoints | **Role 3 (Frontend)** | Meeting CRUD, summary generation, AI settings | After Phase 3 |
| Mock responses | **Role 3 (Frontend)** | A mode where the backend returns fake AI responses without calling Nova | After Phase 2 — so they can build UI without waiting for AI |
| Deployed infrastructure | **Role 4 (DevOps)** | SAM template, deployment scripts, environment configs | After Phase 1 |
| Nova call wrappers | **Role 1 (AI/ML)** | Go functions that wrap Bedrock calls — they'll tune prompts, you provide the plumbing | After Phase 4 and 5 |

### The Critical Unblocking Action

**After completing Phase 2, deploy a mock WebSocket endpoint** that:
- Accepts connections
- Receives audio/text messages
- Returns hardcoded AI responses
- Sends fake transcription events

This unblocks the frontend completely. They don't need real Nova to build the UI.

---

## Phase 0: Local Machine Setup
<a id="phase-0-local-machine-setup"></a>

**Goal:** Your development machine has everything installed and verified.  
**Dependencies:** None. Do this first.  
**Proceed independently:** Yes.

### 0.1 Install Required Tools

This is manual work on your machine:

```bash
# 1. Go (must be 1.22+)
# macOS:
brew install go
# Verify:
go version
# Expected: go version go1.22.x darwin/arm64

# 2. AWS CLI v2
brew install awscli
aws --version
# Expected: aws-cli/2.x.x ...

# 3. AWS SAM CLI
brew install aws-sam-cli
sam --version
# Expected: SAM CLI, version 1.1xx.x

# 4. Docker Desktop (needed for sam local)
# Download from: https://www.docker.com/products/docker-desktop/
# Start Docker Desktop, verify:
docker --version

# 5. wscat (WebSocket testing)
npm install -g wscat

# 6. jq (JSON processing)
brew install jq

# 7. golangci-lint (code quality)
brew install golangci-lint

# 8. Git (should already be installed)
git --version
```

### 0.2 Configure AWS Credentials

```bash
# Option A: If you have an IAM user
aws configure
# Enter: Access Key ID, Secret Access Key, Region: us-east-1, Output: json

# Option B: If using SSO
aws configure sso
# Follow the prompts

# Verify access
aws sts get-caller-identity
# You should see your account ID, ARN, etc.
```

### 0.3 Enable Amazon Bedrock Model Access

**This is a manual step in the AWS Console:**

1. Go to **AWS Console** → **Amazon Bedrock** → **Model access** (us-east-1 region)
2. Click **Manage model access**
3. Enable:
   - `Amazon Nova Lite` (amazon.nova-lite-v1:0)
   - `Amazon Nova Sonic` (amazon.nova-sonic-v1:0)
   - Note: Model IDs may vary — check the Bedrock console for exact available models
4. Wait for access granted status (usually instant, sometimes up to 30 minutes)

**Why manual?** Bedrock model access cannot be enabled via CLI/API. This is a one-time console action.

### 0.4 Initialize Project

```bash
# Create workspace
mkdir -p ~/creovine_main/lira_ai/backend
cd ~/creovine_main/lira_ai/backend

# Initialize Go module
go mod init github.com/creovine/lira-ai-backend

# Create directory structure
mkdir -p cmd/{gateway,processor,responder}
mkdir -p internal/{wshandler,context,nova,audio,models,middleware}
mkdir -p pkg/{retry,logging,config}
mkdir -p deployments
mkdir -p tests/{unit,integration,events}
mkdir -p scripts
```

### 0.5 Install Go Dependencies

```bash
# AWS SDK v2 (core + services)
go get github.com/aws/aws-sdk-go-v2@latest
go get github.com/aws/aws-sdk-go-v2/config@latest
go get github.com/aws/aws-sdk-go-v2/service/bedrockruntime@latest
go get github.com/aws/aws-sdk-go-v2/service/dynamodb@latest
go get github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue@latest
go get github.com/aws/aws-sdk-go-v2/service/s3@latest
go get github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi@latest

# Lambda runtime
go get github.com/aws/aws-lambda-go@latest

# Utilities
go get github.com/google/uuid@latest
go get github.com/rs/zerolog@latest

# Testing
go get github.com/stretchr/testify@latest

# Tidy up
go mod tidy
```

### 0.6 Verify Everything Works

```bash
# Create a minimal main.go to verify compilation
cat > cmd/gateway/main.go << 'GOEOF'
package main

import (
	"fmt"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-lambda-go/events"
	"context"
)

func handler(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	fmt.Printf("Route: %s, ConnectionID: %s\n", event.RequestContext.RouteKey, event.RequestContext.ConnectionID)
	return events.APIGatewayProxyResponse{StatusCode: 200, Body: "ok"}, nil
}

func main() {
	lambda.Start(handler)
}
GOEOF

# Build it
cd cmd/gateway && go build -o bootstrap . && cd ../..

# If this compiles, your toolchain is correct
echo "✅ Phase 0 complete"
```

**Phase 0 Checklist:**

- [ ] Go 1.22+ installed and verified
- [ ] AWS CLI v2 installed and configured
- [ ] SAM CLI installed
- [ ] Docker Desktop running
- [ ] wscat installed
- [ ] AWS credentials verified (`aws sts get-caller-identity` works)
- [ ] Bedrock model access enabled for Nova Lite + Nova Sonic in console
- [ ] Go project compiles

---

## Phase 1: AWS Foundation & Nova Validation
<a id="phase-1-aws-foundation--nova-validation"></a>

**Goal:** Deploy base infrastructure. Make ONE successful call to each Nova model. Confirm the actual API request/response shapes.  
**Dependencies:** Phase 0 complete.  
**Proceed independently:** Yes.  
**This is the most important phase.** If Nova APIs don't work as expected, you find out here, not after building 2000 lines of code on wrong assumptions.

### 1.1 Deploy Base Infrastructure

Create the SAM template with DynamoDB tables and S3 bucket only. No Lambdas yet.

```yaml
# deployments/template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Lira AI Backend

Globals:
  Function:
    Runtime: provided.al2023
    Architectures: [arm64]
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        LOG_LEVEL: debug
        MEETINGS_TABLE: !Ref MeetingsTable
        CONNECTIONS_TABLE: !Ref ConnectionsTable
        AUDIO_BUCKET: !Ref AudioBucket

Parameters:
  Environment:
    Type: String
    Default: dev

Resources:

  # ── DynamoDB: Active Connections ──
  ConnectionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub lira-connections-${Environment}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: connection_id
          AttributeType: S
      KeySchema:
        - AttributeName: connection_id
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true

  # ── DynamoDB: Meeting State ──
  MeetingsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub lira-meetings-${Environment}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: session_id
          AttributeType: S
      KeySchema:
        - AttributeName: session_id
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true

  # ── S3: Audio Storage ──
  AudioBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub lira-audio-${Environment}-${AWS::AccountId}
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldAudio
            Status: Enabled
            ExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  ConnectionsTableName:
    Value: !Ref ConnectionsTable
  MeetingsTableName:
    Value: !Ref MeetingsTable
  AudioBucketName:
    Value: !Ref AudioBucket
```

Deploy:

```bash
cd deployments
sam build
sam deploy --guided \
  --stack-name lira-ai-dev \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Save the output values — you'll need them
```

### 1.2 Validate Nova Lite (Text Reasoning)

This is a standalone Go script. Not a Lambda. You run it from your machine.

```go
// cmd/validate/nova_lite_test.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

func main() {
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		log.Fatalf("AWS config: %v", err)
	}
	client := bedrockruntime.NewFromConfig(cfg)

	// ── Test: Nova Lite text generation ──
	// Try multiple model IDs in case naming differs
	modelIDs := []string{
		"amazon.nova-lite-v1:0",
		"us.amazon.nova-lite-v1:0",
		"amazon.nova-lite-v2:0",
	}

	for _, modelID := range modelIDs {
		fmt.Printf("\n🧪 Trying model: %s\n", modelID)
		err := testNovaLite(ctx, client, modelID)
		if err != nil {
			fmt.Printf("   ❌ Failed: %v\n", err)
		} else {
			fmt.Printf("   ✅ SUCCESS with model: %s\n", modelID)
			fmt.Println("\n📝 Save this model ID — this is what you'll use.")
			os.Exit(0)
		}
	}
	fmt.Println("\n❌ No Nova Lite model worked. Check Bedrock model access in console.")
}

func testNovaLite(ctx context.Context, client *bedrockruntime.Client, modelID string) error {
	body := map[string]interface{}{
		"messages": []map[string]interface{}{
			{
				"role": "user",
				"content": []map[string]string{
					{"text": "You are in a meeting. Someone just said 'Should we add dark mode to our app?' Respond in one sentence as a helpful meeting participant."},
				},
			},
		},
		"inferenceConfig": map[string]interface{}{
			"maxTokens":   100,
			"temperature": 0.7,
		},
	}

	bodyJSON, _ := json.Marshal(body)
	fmt.Printf("   Request body: %s\n", string(bodyJSON))

	output, err := client.InvokeModel(ctx, &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(modelID),
		Body:        bodyJSON,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	})
	if err != nil {
		return err
	}

	fmt.Printf("   Raw response: %s\n", string(output.Body))

	// Parse and show structure
	var resp map[string]interface{}
	json.Unmarshal(output.Body, &resp)
	pretty, _ := json.MarshalIndent(resp, "   ", "  ")
	fmt.Printf("   Parsed:\n   %s\n", string(pretty))
	return nil
}
```

Run it:

```bash
go run cmd/validate/nova_lite_test.go
```

**What you learn from this:**
1. The exact model ID that works
2. The exact response JSON structure (don't assume — read the actual output)
3. The latency of a single call
4. Whether your IAM permissions are correct

**Save the output.** You will reference the response structure when building the parser.

### 1.3 Validate Nova Sonic (Speech)

Nova Sonic uses **bidirectional streaming** — this is fundamentally different from regular `InvokeModel`. It opens a persistent WebSocket-like stream where you send audio in and receive audio/text back.

```go
// cmd/validate/nova_sonic_test.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

func main() {
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		log.Fatalf("AWS config: %v", err)
	}
	client := bedrockruntime.NewFromConfig(cfg)

	// ── Step 1: Check if model is available ──
	modelIDs := []string{
		"amazon.nova-sonic-v1:0",
		"us.amazon.nova-sonic-v1:0",
	}

	for _, modelID := range modelIDs {
		fmt.Printf("\n🧪 Trying Nova Sonic model: %s\n", modelID)
		err := testNovaSonicAvailability(ctx, client, modelID)
		if err != nil {
			fmt.Printf("   ❌ Failed: %v\n", err)
		} else {
			fmt.Printf("   ✅ Model %s is accessible\n", modelID)
		}
	}

	// ── Step 2: Test bidirectional streaming (if supported) ──
	fmt.Println("\n🧪 Testing bidirectional stream...")
	testBidirectionalStream(ctx, client)
}

func testNovaSonicAvailability(ctx context.Context, client *bedrockruntime.Client, modelID string) error {
	// Nova Sonic uses InvokeModelWithBidirectionalStream
	// First, let's see if we can at least reach the model
	// The actual implementation depends on the SDK version supporting bidirectional streams

	// Check if the model is listed
	fmt.Printf("   Checking model availability for: %s\n", modelID)

	// Try a simple converse call to see if the model endpoint responds
	// This may fail with a "wrong API" error — that's actually good,
	// it means the model exists but needs a different invocation method
	body := map[string]interface{}{
		"inputText": "Hello test",
	}
	bodyJSON, _ := json.Marshal(body)

	_, err := client.InvokeModel(ctx, &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(modelID),
		Body:        bodyJSON,
		ContentType: aws.String("application/json"),
	})

	if err != nil {
		// If error says "use bidirectional stream" or "wrong API", that's actually confirmation
		// the model exists — it just needs the right invocation method
		errStr := err.Error()
		fmt.Printf("   Error details: %s\n", errStr)
		return err
	}
	return nil
}

func testBidirectionalStream(ctx context.Context, client *bedrockruntime.Client) {
	// Nova Sonic bidirectional streaming setup
	// The exact API depends on the SDK version.
	//
	// As of aws-sdk-go-v2, check for:
	//   client.InvokeModelWithBidirectionalStream()
	//
	// If this method doesn't exist in your SDK version:
	//   go get github.com/aws/aws-sdk-go-v2/service/bedrockruntime@latest
	//
	// The bidirectional stream:
	//   1. Opens a persistent connection
	//   2. You send "events" (audio chunks, configuration)
	//   3. You receive "events" (transcriptions, audio responses)
	//
	// Session setup event structure (send first):
	sessionConfig := map[string]interface{}{
		"event": map[string]interface{}{
			"sessionConfiguration": map[string]interface{}{
				"instructionEvent": map[string]interface{}{
					"content": "You are Lira, an AI meeting participant. Respond briefly.",
				},
			},
		},
	}

	configJSON, _ := json.MarshalIndent(sessionConfig, "", "  ")
	fmt.Printf("   Session config structure:\n%s\n", string(configJSON))

	fmt.Println("\n   📝 IMPORTANT: Record the exact SDK method and event structure.")
	fmt.Println("   📝 If bidirectional streaming isn't in Go SDK yet,")
	fmt.Println("   📝 fallback plan: use AWS Transcribe (STT) + Polly (TTS) + Nova Lite (reasoning)")
	fmt.Println("   📝 This gives the same result with separate service calls.")
}
```

**Critical outcome of this test:**

| Result | What It Means | Next Action |
|--------|---------------|-------------|
| Bidirectional stream works | You can do speech-to-speech in a single call | Build Phase 4 around bidirectional streaming |
| Model exists but Go SDK doesn't support bidirectional streaming | Model is there but SDK lags | Use raw HTTP/WebSocket to call the Bedrock endpoint directly, or use the fallback |
| Model not available | Nova Sonic not yet in your region/account | **Use the fallback:** AWS Transcribe + Nova Lite + Amazon Polly. Same end result, three calls instead of one |
| Access denied | IAM permissions wrong | Fix IAM policy, add `bedrock:InvokeModelWithBidirectionalStream` permission |

### 1.4 Decide Your Audio Architecture

Based on Phase 1.3 results, pick your path:

**Path A: Nova Sonic bidirectional streaming works**

```
Browser audio → WebSocket → Lambda → Nova Sonic bidirectional stream
                                         ↓ (transcription + response audio)
                                      Lambda → WebSocket → Browser
```

**Path B: Fallback (separate services)**

```
Browser audio → WebSocket → Lambda → AWS Transcribe Streaming (STT)
                                         ↓ (transcription text)
                                      Nova Lite (reasoning → response text)  
                                         ↓
                                      Amazon Polly (TTS → response audio)
                                         ↓
                                      Lambda → WebSocket → Browser
```

**Path B is perfectly valid for the hackathon.** The judges won't know or care whether speech goes through one service or three. They'll see: user speaks → AI responds with voice. Same demo impact.

Path B also has an advantage: each service is independently testable and replaceable.

**Decision:** Document which path you're taking. Proceed with the rest of the phases — the internal wiring changes, but the external interfaces (WebSocket messages, DynamoDB schema, Lambda structure) remain identical.

**Phase 1 Checklist:**

- [ ] Base infrastructure deployed (DynamoDB tables, S3 bucket exist)
- [ ] Nova Lite model ID confirmed and working
- [ ] Nova Lite response structure documented (copy the raw JSON)
- [ ] Nova Sonic availability tested
- [ ] Audio architecture path decided (A or B)
- [ ] Fallback dependencies identified (if Path B: add Transcribe + Polly permissions)

---

## Phase 2: WebSocket Gateway
<a id="phase-2-websocket-gateway"></a>

**Goal:** Clients can connect via WebSocket, send messages, receive responses. A mock mode returns fake AI responses.  
**Dependencies:** Phase 1 complete.  
**Proceed independently:** Yes.  
**Unblocks:** Frontend (Role 3) — they can start building the WebSocket client and UI against your mock responses.

### 2.1 Why This Phase Matters

The WebSocket gateway is the **single integration point** between frontend and backend. Everything else (Nova, DynamoDB, audio processing) is internal. The frontend only knows about the WebSocket.

Getting this up and working — even with fake responses — means:
- Frontend can build independently
- You can test the full message flow
- You have a working deploy pipeline

### 2.2 Connection Handler Lambda

This single Lambda handles all WebSocket routes:

```go
// cmd/gateway/main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var (
	dynamoClient     *dynamodb.Client
	connectionsTable string
	meetingsTable    string
)

// ── DynamoDB row for active connections ──
type ConnectionRecord struct {
	ConnectionID string `dynamodbav:"connection_id"`
	SessionID    string `dynamodbav:"session_id"`
	UserID       string `dynamodbav:"user_id"`
	ConnectedAt  int64  `dynamodbav:"connected_at"`
	TTL          int64  `dynamodbav:"ttl"`
}

// ── Inbound WebSocket message envelope ──
type InboundMessage struct {
	Action    string          `json:"action"`    // "join_session", "audio", "text", "trigger_ai", "update_settings"
	SessionID string          `json:"session_id"`
	UserID    string          `json:"user_id"`
	Payload   json.RawMessage `json:"payload"`
}

// ── Outbound WebSocket message envelope ──
type OutboundMessage struct {
	Type      string      `json:"type"`       // "transcription", "ai_response", "ai_audio", "error", "session_joined", "participant_event"
	SessionID string      `json:"session_id"`
	Payload   interface{} `json:"payload"`
	Timestamp int64       `json:"timestamp"`
}

func init() {
	zerolog.SetGlobalLevel(zerolog.DebugLevel)
	log.Logger = zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion(os.Getenv("AWS_REGION")))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load AWS config")
	}
	dynamoClient = dynamodb.NewFromConfig(cfg)
	connectionsTable = os.Getenv("CONNECTIONS_TABLE")
	meetingsTable = os.Getenv("MEETINGS_TABLE")
}

func handler(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	route := event.RequestContext.RouteKey
	connID := event.RequestContext.ConnectionID

	log.Info().Str("route", route).Str("conn", connID).Msg("WebSocket event")

	switch route {
	case "$connect":
		return handleConnect(ctx, connID, event)
	case "$disconnect":
		return handleDisconnect(ctx, connID)
	case "$default":
		return handleMessage(ctx, connID, event)
	default:
		return respond(400, "unknown route"), nil
	}
}

// ── $connect ──
func handleConnect(ctx context.Context, connID string, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	now := time.Now()
	record := ConnectionRecord{
		ConnectionID: connID,
		ConnectedAt:  now.Unix(),
		TTL:          now.Add(24 * time.Hour).Unix(), // Auto-cleanup stale connections
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Err(err).Msg("Marshal connection")
		return respond(500, "internal error"), nil
	}

	_, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(connectionsTable),
		Item:      item,
	})
	if err != nil {
		log.Error().Err(err).Msg("Store connection")
		return respond(500, "internal error"), nil
	}

	log.Info().Str("conn", connID).Msg("Connected")
	return respond(200, "connected"), nil
}

// ── $disconnect ──
func handleDisconnect(ctx context.Context, connID string) (events.APIGatewayProxyResponse, error) {
	_, err := dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(connectionsTable),
		Key: map[string]types.AttributeValue{
			"connection_id": &types.AttributeValueMemberS{Value: connID},
		},
	})
	if err != nil {
		log.Error().Err(err).Msg("Delete connection")
	}
	log.Info().Str("conn", connID).Msg("Disconnected")
	return respond(200, "disconnected"), nil
}

// ── $default (all messages) ──
func handleMessage(ctx context.Context, connID string, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	var msg InboundMessage
	if err := json.Unmarshal([]byte(event.Body), &msg); err != nil {
		log.Error().Err(err).Str("body", event.Body).Msg("Invalid message")
		return respond(400, "bad request"), nil
	}

	log.Info().Str("action", msg.Action).Str("session", msg.SessionID).Msg("Message received")

	switch msg.Action {
	case "join_session":
		return handleJoinSession(ctx, connID, msg, event)
	case "text":
		return handleTextMessage(ctx, connID, msg, event)
	case "trigger_ai":
		return handleTriggerAI(ctx, connID, msg, event)
	case "audio":
		return handleAudioMessage(ctx, connID, msg, event)
	case "update_settings":
		return handleUpdateSettings(ctx, connID, msg, event)
	default:
		log.Warn().Str("action", msg.Action).Msg("Unknown action")
		return respond(400, "unknown action"), nil
	}
}

// ── Join a meeting session ──
func handleJoinSession(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Update connection record with session + user
	_, err := dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(connectionsTable),
		Key: map[string]types.AttributeValue{
			"connection_id": &types.AttributeValueMemberS{Value: connID},
		},
		UpdateExpression: aws.String("SET session_id = :sid, user_id = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":sid": &types.AttributeValueMemberS{Value: msg.SessionID},
			":uid": &types.AttributeValueMemberS{Value: msg.UserID},
		},
	})
	if err != nil {
		log.Error().Err(err).Msg("Update connection with session")
		return respond(500, "internal error"), nil
	}

	// Send confirmation back to this client
	apiClient := newAPIGWClient(event)
	outMsg := OutboundMessage{
		Type:      "session_joined",
		SessionID: msg.SessionID,
		Payload:   map[string]string{"status": "joined", "user_id": msg.UserID},
		Timestamp: time.Now().Unix(),
	}
	sendToConnection(ctx, apiClient, connID, outMsg)

	return respond(200, "joined"), nil
}

// ── Handle text message (for testing without audio) ──
func handleTextMessage(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	var textPayload struct {
		Speaker string `json:"speaker"`
		Text    string `json:"text"`
	}
	json.Unmarshal(msg.Payload, &textPayload)

	// Send transcription event to all session participants
	apiClient := newAPIGWClient(event)
	outMsg := OutboundMessage{
		Type:      "transcription",
		SessionID: msg.SessionID,
		Payload: map[string]interface{}{
			"speaker": textPayload.Speaker,
			"text":    textPayload.Text,
		},
		Timestamp: time.Now().Unix(),
	}
	broadcastToSession(ctx, apiClient, msg.SessionID, outMsg)

	return respond(200, "ok"), nil
}

// ── Trigger AI response (mock for now) ──
func handleTriggerAI(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	apiClient := newAPIGWClient(event)

	// MOCK RESPONSE — replaced with real Nova in Phase 5
	mockResponses := []string{
		"Well, I think that's an interesting point. Have you considered the user research on this?",
		"Um, I see both sides here. Maybe we could prototype both approaches and test with users?",
		"That's a solid idea. One thing I'd add — we should check if there's existing infrastructure we can reuse.",
		"You know, I think the key question is whether this aligns with our quarterly goals. What does the roadmap say?",
	}
	mockText := mockResponses[time.Now().UnixNano()%int64(len(mockResponses))]

	outMsg := OutboundMessage{
		Type:      "ai_response",
		SessionID: msg.SessionID,
		Payload: map[string]interface{}{
			"speaker": "lira",
			"text":    mockText,
			"is_mock": true,
		},
		Timestamp: time.Now().Unix(),
	}
	broadcastToSession(ctx, apiClient, msg.SessionID, outMsg)

	return respond(200, "ok"), nil
}

// ── Handle audio chunk ──
func handleAudioMessage(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Phase 4/6 will implement real audio processing
	// For now, acknowledge receipt
	log.Debug().Str("session", msg.SessionID).Int("payload_size", len(msg.Payload)).Msg("Audio chunk received")
	return respond(200, "ok"), nil
}

// ── Handle settings update ──
func handleUpdateSettings(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	var settings struct {
		Personality        string  `json:"personality"`
		ParticipationLevel float64 `json:"participation_level"`
		WakeWordEnabled    bool    `json:"wake_word_enabled"`
	}
	json.Unmarshal(msg.Payload, &settings)

	log.Info().Interface("settings", settings).Str("session", msg.SessionID).Msg("Settings updated")
	// Store in meetings table — implemented in Phase 3
	return respond(200, "ok"), nil
}

// ── Helpers ──

func newAPIGWClient(event events.APIGatewayWebsocketProxyRequest) *apigatewaymanagementapi.Client {
	cfg, _ := config.LoadDefaultConfig(context.Background())
	endpoint := fmt.Sprintf("https://%s/%s", event.RequestContext.DomainName, event.RequestContext.Stage)
	return apigatewaymanagementapi.NewFromConfig(cfg, func(o *apigatewaymanagementapi.Options) {
		o.BaseEndpoint = aws.String(endpoint)
	})
}

func sendToConnection(ctx context.Context, client *apigatewaymanagementapi.Client, connID string, msg OutboundMessage) {
	data, _ := json.Marshal(msg)
	_, err := client.PostToConnection(ctx, &apigatewaymanagementapi.PostToConnectionInput{
		ConnectionId: aws.String(connID),
		Data:         data,
	})
	if err != nil {
		log.Error().Err(err).Str("conn", connID).Msg("Failed to send to connection")
	}
}

func broadcastToSession(ctx context.Context, client *apigatewaymanagementapi.Client, sessionID string, msg OutboundMessage) {
	// Query all connections in this session
	result, err := dynamoClient.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(connectionsTable),
		FilterExpression: aws.String("session_id = :sid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":sid": &types.AttributeValueMemberS{Value: sessionID},
		},
	})
	if err != nil {
		log.Error().Err(err).Msg("Scan connections for broadcast")
		return
	}

	data, _ := json.Marshal(msg)
	for _, item := range result.Items {
		connID := item["connection_id"].(*types.AttributeValueMemberS).Value
		_, err := client.PostToConnection(ctx, &apigatewaymanagementapi.PostToConnectionInput{
			ConnectionId: aws.String(connID),
			Data:         data,
		})
		if err != nil {
			log.Warn().Err(err).Str("conn", connID).Msg("Stale connection, cleaning up")
			// Clean up stale connections
			dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
				TableName: aws.String(connectionsTable),
				Key: map[string]types.AttributeValue{
					"connection_id": &types.AttributeValueMemberS{Value: connID},
				},
			})
		}
	}
}

func respond(code int, body string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: code, Body: body}
}

func main() {
	lambda.Start(handler)
}
```

### 2.3 Add WebSocket API to SAM Template

Add these resources to your existing `template.yaml`:

```yaml
  # ── WebSocket API ──
  WebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub lira-ws-${Environment}
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: $request.body.action

  # ── Gateway Lambda ──
  GatewayFunction:
    Type: AWS::Serverless::Function
    Metadata:
      BuildMethod: go1.x
    Properties:
      FunctionName: !Sub lira-gateway-${Environment}
      CodeUri: ../cmd/gateway/
      Handler: bootstrap
      MemorySize: 256
      Timeout: 10
      Environment:
        Variables:
          CONNECTIONS_TABLE: !Ref ConnectionsTable
          MEETINGS_TABLE: !Ref MeetingsTable
          AUDIO_BUCKET: !Ref AudioBucket
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ConnectionsTable
        - DynamoDBCrudPolicy:
            TableName: !Ref MeetingsTable
        - Statement:
            - Effect: Allow
              Action: execute-api:ManageConnections
              Resource: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WebSocketApi}/*

  GatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref GatewayFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WebSocketApi}/*

  # ── Routes ──
  ConnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $connect
      AuthorizationType: NONE
      Target: !Sub integrations/${GatewayIntegration}

  DisconnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $disconnect
      Target: !Sub integrations/${GatewayIntegration}

  DefaultRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $default
      Target: !Sub integrations/${GatewayIntegration}

  GatewayIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GatewayFunction.Arn}/invocations

  WebSocketStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref WebSocketApi
      StageName: !Ref Environment
      AutoDeploy: true

  WebSocketDeployment:
    Type: AWS::ApiGatewayV2::Deployment
    DependsOn: [ConnectRoute, DisconnectRoute, DefaultRoute]
    Properties:
      ApiId: !Ref WebSocketApi

  # Add to Outputs:
  WebSocketURL:
    Value: !Sub wss://${WebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}
```

### 2.4 Build, Deploy, Test

```bash
# Build the Go binary
cd cmd/gateway
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap .
cd ../../deployments

# Deploy
sam build
sam deploy --no-confirm-changeset

# Get the WebSocket URL
WS_URL=$(aws cloudformation describe-stacks --stack-name lira-ai-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketURL`].OutputValue' --output text)
echo "WebSocket URL: $WS_URL"

# Test with wscat
wscat -c "$WS_URL"

# Once connected, paste these messages one at a time:

# 1) Join a session
{"action":"join_session","session_id":"test-meeting-1","user_id":"user-1"}

# 2) Send a text message
{"action":"text","session_id":"test-meeting-1","payload":{"speaker":"Alice","text":"Should we add dark mode?"}}

# 3) Trigger AI response (will be mock)
{"action":"trigger_ai","session_id":"test-meeting-1","payload":{}}
```

**Expected Results:**
- Connect succeeds (no error)
- `join_session` → you receive `{"type":"session_joined",...}`
- `text` → you receive `{"type":"transcription",...}` broadcast
- `trigger_ai` → you receive `{"type":"ai_response","payload":{"speaker":"lira","text":"...","is_mock":true}}`

### 2.5 Share With Frontend

Once working, give Role 3 (Frontend):

1. The WebSocket URL
2. The message contract (Appendix E of this document)
3. Instructions: "Connect, send join_session, then trigger_ai to get mock responses"

**They are now unblocked. They can build the entire UI.**

**Phase 2 Checklist:**

- [ ] Gateway Lambda deployed and handling all routes
- [ ] WebSocket connect/disconnect works (verified with wscat)
- [ ] Mock AI responses work
- [ ] Broadcast to session participants works
- [ ] Connection records in DynamoDB (verify in console)
- [ ] WebSocket URL shared with frontend team
- [ ] Message contract documented and shared

---

## Phase 3: Meeting State & Context Storage
<a id="phase-3-meeting-state--context-storage"></a>

**Goal:** Meetings have persistent state. Conversation history is stored. Context can be retrieved for AI reasoning.  
**Dependencies:** Phase 2 complete.  
**Proceed independently:** Yes.

### 3.1 Meeting Context Data Model

```go
// internal/models/meeting.go
package models

import "time"

type Meeting struct {
	SessionID   string          `json:"session_id" dynamodbav:"session_id"`
	Title       string          `json:"title" dynamodbav:"title"`
	CreatedAt   time.Time       `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" dynamodbav:"updated_at"`
	TTL         int64           `json:"ttl" dynamodbav:"ttl"`
	Settings    MeetingSettings `json:"settings" dynamodbav:"settings"`
	Messages    []Message       `json:"messages" dynamodbav:"messages"`
	Participants []string       `json:"participants" dynamodbav:"participants"`
	AIState     AIState         `json:"ai_state" dynamodbav:"ai_state"`
}

type MeetingSettings struct {
	Personality        string  `json:"personality" dynamodbav:"personality"`                 // "supportive", "critical", "technical", "business"
	ParticipationLevel float64 `json:"participation_level" dynamodbav:"participation_level"` // 0.0 to 1.0
	WakeWordEnabled    bool    `json:"wake_word_enabled" dynamodbav:"wake_word_enabled"`
	ProactiveSuggest   bool    `json:"proactive_suggest" dynamodbav:"proactive_suggest"`
}

type Message struct {
	ID        string    `json:"id" dynamodbav:"id"`
	Speaker   string    `json:"speaker" dynamodbav:"speaker"`
	Text      string    `json:"text" dynamodbav:"text"`
	Timestamp time.Time `json:"timestamp" dynamodbav:"timestamp"`
	IsAI      bool      `json:"is_ai" dynamodbav:"is_ai"`
}

type AIState struct {
	LastResponseTime time.Time `json:"last_response_time" dynamodbav:"last_response_time"`
	ResponseCount    int       `json:"response_count" dynamodbav:"response_count"`
}
```

### 3.2 Context Manager

```go
// internal/context/manager.go
package context

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/creovine/lira-ai-backend/internal/models"
)

const maxMessagesInContext = 50

type Manager struct {
	dynamo    *dynamodb.Client
	tableName string
}

func NewManager(dynamo *dynamodb.Client, tableName string) *Manager {
	return &Manager{dynamo: dynamo, tableName: tableName}
}

func (m *Manager) CreateMeeting(ctx context.Context, sessionID string) (*models.Meeting, error) {
	now := time.Now()
	meeting := &models.Meeting{
		SessionID:    sessionID,
		CreatedAt:    now,
		UpdatedAt:    now,
		TTL:          now.Add(30 * 24 * time.Hour).Unix(), // 30-day expiry
		Settings: models.MeetingSettings{
			Personality:        "supportive",
			ParticipationLevel: 0.6,
			WakeWordEnabled:    true,
			ProactiveSuggest:   true,
		},
		Messages:     []models.Message{},
		Participants: []string{},
		AIState:      models.AIState{},
	}

	item, err := attributevalue.MarshalMap(meeting)
	if err != nil {
		return nil, fmt.Errorf("marshal meeting: %w", err)
	}

	_, err = m.dynamo.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(m.tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(session_id)"), // Don't overwrite existing
	})
	if err != nil {
		return nil, fmt.Errorf("create meeting: %w", err)
	}

	return meeting, nil
}

func (m *Manager) GetMeeting(ctx context.Context, sessionID string) (*models.Meeting, error) {
	result, err := m.dynamo.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(m.tableName),
		Key: map[string]dtypes.AttributeValue{
			"session_id": &dtypes.AttributeValueMemberS{Value: sessionID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("get meeting: %w", err)
	}
	if result.Item == nil {
		return nil, fmt.Errorf("meeting not found: %s", sessionID)
	}

	var meeting models.Meeting
	if err := attributevalue.UnmarshalMap(result.Item, &meeting); err != nil {
		return nil, fmt.Errorf("unmarshal meeting: %w", err)
	}
	return &meeting, nil
}

func (m *Manager) AddMessage(ctx context.Context, sessionID string, speaker string, text string, isAI bool) error {
	meeting, err := m.GetMeeting(ctx, sessionID)
	if err != nil {
		return err
	}

	msg := models.Message{
		ID:        uuid.New().String(),
		Speaker:   speaker,
		Text:      text,
		Timestamp: time.Now(),
		IsAI:      isAI,
	}

	meeting.Messages = append(meeting.Messages, msg)

	// Keep only the last N messages
	if len(meeting.Messages) > maxMessagesInContext {
		meeting.Messages = meeting.Messages[len(meeting.Messages)-maxMessagesInContext:]
	}

	meeting.UpdatedAt = time.Now()

	item, err := attributevalue.MarshalMap(meeting)
	if err != nil {
		return fmt.Errorf("marshal meeting: %w", err)
	}

	_, err = m.dynamo.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(m.tableName),
		Item:      item,
	})
	return err
}

func (m *Manager) UpdateSettings(ctx context.Context, sessionID string, settings models.MeetingSettings) error {
	_, err := m.dynamo.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(m.tableName),
		Key: map[string]dtypes.AttributeValue{
			"session_id": &dtypes.AttributeValueMemberS{Value: sessionID},
		},
		UpdateExpression: aws.String("SET settings = :s, updated_at = :u"),
		ExpressionAttributeValues: map[string]dtypes.AttributeValue{
			":s": mustMarshal(settings),
			":u": mustMarshal(time.Now()),
		},
	})
	return err
}

// ShouldAIRespond evaluates whether Lira should speak based on the conversation.
func (m *Manager) ShouldAIRespond(meeting *models.Meeting, latestText string) bool {
	text := strings.ToLower(latestText)

	// 1. Wake word detection
	wakeWords := []string{"hey lira", "lira,", "lira ", "ask lira", "what do you think lira"}
	for _, w := range wakeWords {
		if strings.Contains(text, w) {
			return true
		}
	}

	// 2. Direct question ending with "?"
	if strings.HasSuffix(strings.TrimSpace(text), "?") && len(meeting.Messages) >= 3 {
		return true
	}

	// 3. Respect participation level — don't respond to every question
	// Higher participation_level = more likely to respond
	// (Full implementation would use a random check against participation_level)

	return false
}

// GetContextForPrompt builds a string of recent conversation for the AI prompt.
func (m *Manager) GetContextForPrompt(meeting *models.Meeting) string {
	var sb strings.Builder
	start := 0
	if len(meeting.Messages) > 20 {
		start = len(meeting.Messages) - 20
	}
	for _, msg := range meeting.Messages[start:] {
		sb.WriteString(fmt.Sprintf("%s: %s\n", msg.Speaker, msg.Text))
	}
	return sb.String()
}

func mustMarshal(v interface{}) dtypes.AttributeValue {
	av, err := attributevalue.Marshal(v)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to marshal")
	}
	return av
}
```

### 3.3 Wire Into Gateway

Update `handleJoinSession` and `handleTextMessage` in the gateway to use the context manager.

This is where the gateway goes from stateless message routing to actually maintaining meeting state. When someone joins, create the meeting if it doesn't exist. When someone speaks, store the message.

### 3.4 Add REST Endpoints

For operations that don't need real-time (meeting creation, summary retrieval, settings), add an HTTP API:

```yaml
  # Add to template.yaml
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: !Ref Environment

  MeetingsFunction:
    Type: AWS::Serverless::Function
    Metadata:
      BuildMethod: go1.x
    Properties:
      FunctionName: !Sub lira-meetings-${Environment}
      CodeUri: ../cmd/meetings/
      Handler: bootstrap
      Events:
        CreateMeeting:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Path: /meetings
            Method: POST
        GetMeeting:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Path: /meetings/{id}
            Method: GET
        GetSummary:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Path: /meetings/{id}/summary
            Method: GET
```

**Phase 3 Checklist:**

- [ ] Meeting CRUD operations work (create, get, update settings)
- [ ] Messages are stored in DynamoDB
- [ ] Context window management works (keeps last 50 messages)
- [ ] `ShouldAIRespond()` logic is tested with multiple scenarios
- [ ] REST API deployed for meeting management
- [ ] `GetContextForPrompt()` produces clean conversation history

---

## Phase 4: Nova Sonic Integration
<a id="phase-4-nova-sonic-integration"></a>

**Goal:** Speech-to-text and text-to-speech actually work via Nova Sonic (or the fallback path).  
**Dependencies:** Phase 1 validation results determine which path.  
**Proceed independently:** Yes.  
**What you need from Role 1 (AI/ML):** Nothing yet. You're building the transport layer. They'll tune parameters later.

### Path A: Nova Sonic Bidirectional Streaming

If Phase 1 confirmed bidirectional streaming works:

```go
// internal/nova/sonic.go
package nova

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/rs/zerolog/log"
)

type SonicClient struct {
	client  *bedrockruntime.Client
	modelID string
}

func NewSonicClient(client *bedrockruntime.Client, modelID string) *SonicClient {
	return &SonicClient{client: client, modelID: modelID}
}

// TranscribeAudio sends audio bytes to Nova Sonic and returns transcribed text.
// Adapt the request/response shapes based on what you observed in Phase 1.3.
func (s *SonicClient) TranscribeAudio(ctx context.Context, audioBytes []byte, format string) (string, error) {
	// Build request — ADJUST THIS based on actual API shape from Phase 1
	requestBody := map[string]interface{}{
		"inputAudio": map[string]interface{}{
			"audioData": base64.StdEncoding.EncodeToString(audioBytes),
			"format":    format, // "pcm" or "opus"
		},
		"taskType": "transcription",
		"configuration": map[string]interface{}{
			"language": "en-US",
		},
	}

	bodyJSON, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	output, err := s.client.InvokeModel(ctx, &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(s.modelID),
		Body:        bodyJSON,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	})
	if err != nil {
		return "", fmt.Errorf("invoke Nova Sonic: %w", err)
	}

	// Parse response — ADJUST based on actual response shape
	var resp map[string]interface{}
	if err := json.Unmarshal(output.Body, &resp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	transcript, ok := resp["transcript"].(string)
	if !ok {
		return "", fmt.Errorf("unexpected response structure: %v", resp)
	}

	return transcript, nil
}

// SynthesizeSpeech converts text to audio using Nova Sonic.
func (s *SonicClient) SynthesizeSpeech(ctx context.Context, text string) ([]byte, error) {
	requestBody := map[string]interface{}{
		"inputText": text,
		"taskType":  "synthesis",
		"voiceConfiguration": map[string]interface{}{
			"voiceId": "tiffany", // Adjust based on Nova Sonic available voices
		},
		"outputConfiguration": map[string]interface{}{
			"format":     "pcm",
			"sampleRate": 24000,
		},
	}

	bodyJSON, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	// Use streaming to get audio chunks as they're generated
	streamOutput, err := s.client.InvokeModelWithResponseStream(ctx, &bedrockruntime.InvokeModelWithResponseStreamInput{
		ModelId:     aws.String(s.modelID),
		Body:        bodyJSON,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/octet-stream"),
	})
	if err != nil {
		return nil, fmt.Errorf("invoke Nova Sonic TTS: %w", err)
	}

	var audioData []byte
	stream := streamOutput.GetStream()
	reader := stream.Reader
	for event := range reader.Events() {
		switch v := event.(type) {
		case *bedrockruntime.InvokeModelWithResponseStreamResponseEvent:
			// Collect chunks — adapt based on actual event type
			_ = v
		}
	}
	if err := reader.Err(); err != nil {
		log.Error().Err(err).Msg("Stream error")
	}

	return audioData, nil
}
```

### Path B: Fallback (Transcribe + Polly)

If Nova Sonic bidirectional streaming isn't available yet:

```go
// internal/nova/fallback.go
package nova

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/polly"
	ptypes "github.com/aws/aws-sdk-go-v2/service/polly/types"
	"github.com/aws/aws-sdk-go-v2/service/transcribestreaming"
)

type FallbackSpeechClient struct {
	transcribeClient *transcribestreaming.Client
	pollyClient      *polly.Client
}

func NewFallbackSpeechClient(transcribe *transcribestreaming.Client, pollyClient *polly.Client) *FallbackSpeechClient {
	return &FallbackSpeechClient{
		transcribeClient: transcribe,
		pollyClient:      pollyClient,
	}
}

// TranscribeAudio uses AWS Transcribe Streaming
func (f *FallbackSpeechClient) TranscribeAudio(ctx context.Context, audioBytes []byte, format string) (string, error) {
	// Use Transcribe streaming API
	// This is a well-documented, stable API
	// Implementation: send audio → receive transcript events
	//
	// For hackathon, a simpler approach:
	// Collect 2-3 seconds of audio, send as batch to Transcribe
	// Real production would use streaming

	// Placeholder — implement with actual Transcribe SDK calls
	return "", fmt.Errorf("implement Transcribe integration")
}

// SynthesizeSpeech uses Amazon Polly
func (f *FallbackSpeechClient) SynthesizeSpeech(ctx context.Context, text string) ([]byte, error) {
	output, err := f.pollyClient.SynthesizeSpeech(ctx, &polly.SynthesizeSpeechInput{
		Text:         aws.String(text),
		OutputFormat: ptypes.OutputFormatPcm,
		VoiceId:      ptypes.VoiceIdMatthew,
		Engine:       ptypes.EngineNeural,
		SampleRate:   aws.String("24000"),
	})
	if err != nil {
		return nil, fmt.Errorf("Polly synthesis: %w", err)
	}
	defer output.AudioStream.Close()

	audioBytes, err := io.ReadAll(output.AudioStream)
	if err != nil {
		return nil, fmt.Errorf("read audio: %w", err)
	}

	return audioBytes, nil
}
```

### 4.1 Define a Common Interface

Regardless of path, wrap speech operations behind an interface so you can swap implementations:

```go
// internal/nova/speech.go
package nova

import "context"

// SpeechService abstracts STT and TTS operations.
// Implemented by SonicClient (Path A) or FallbackSpeechClient (Path B).
type SpeechService interface {
	TranscribeAudio(ctx context.Context, audioBytes []byte, format string) (string, error)
	SynthesizeSpeech(ctx context.Context, text string) ([]byte, error)
}
```

**Phase 4 Checklist:**

- [ ] SpeechService interface defined
- [ ] Path A or Path B implementation complete
- [ ] Can transcribe a test audio file → get text back
- [ ] Can synthesize text → get audio bytes back
- [ ] Latency measured for both operations
- [ ] If Path B: add `transcribe:*` and `polly:*` to IAM policy

---

## Phase 5: Nova Lite Integration
<a id="phase-5-nova-lite-integration"></a>

**Goal:** Given conversation context, generate an intelligent text response.  
**Dependencies:** Phase 1 (confirmed model ID), Phase 3 (context manager provides conversation history).  
**Proceed independently:** Yes.  
**What you need from Role 1 (AI/ML):** They can refine prompts later. You write a working baseline now.

### 5.1 AI Response Generator

```go
// internal/nova/reasoning.go
package nova

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/rs/zerolog/log"

	"github.com/creovine/lira-ai-backend/internal/models"
)

type ReasoningClient struct {
	client  *bedrockruntime.Client
	modelID string
}

func NewReasoningClient(client *bedrockruntime.Client, modelID string) *ReasoningClient {
	return &ReasoningClient{client: client, modelID: modelID}
}

// GenerateResponse produces an AI meeting response based on conversation context.
func (r *ReasoningClient) GenerateResponse(ctx context.Context, meeting *models.Meeting, conversationContext string) (string, error) {
	systemPrompt := r.buildSystemPrompt(meeting.Settings.Personality)

	userPrompt := fmt.Sprintf(
		"Here is the meeting conversation so far:\n\n%s\n\nAs Lira, provide a helpful response to the ongoing discussion. Be concise (under 60 words).",
		conversationContext,
	)

	// Build request body for Nova Lite
	// ADJUST message format based on actual response from Phase 1.2
	requestBody := map[string]interface{}{
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": []map[string]string{{"text": systemPrompt}},
			},
			{
				"role":    "user",
				"content": []map[string]string{{"text": userPrompt}},
			},
		},
		"inferenceConfig": map[string]interface{}{
			"maxTokens":   150,
			"temperature": 0.7,
			"topP":        0.9,
		},
	}

	bodyJSON, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	log.Debug().Str("model", r.modelID).Int("body_size", len(bodyJSON)).Msg("Invoking Nova Lite")

	output, err := r.client.InvokeModel(ctx, &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(r.modelID),
		Body:        bodyJSON,
		ContentType: aws.String("application/json"),
		Accept:      aws.String("application/json"),
	})
	if err != nil {
		return "", fmt.Errorf("invoke Nova Lite: %w", err)
	}

	// Parse response — ADJUST based on actual Nova Lite response structure
	text, err := r.extractResponseText(output.Body)
	if err != nil {
		return "", err
	}

	// Add natural speech patterns
	naturalText := r.addHumanElements(text)
	return naturalText, nil
}

func (r *ReasoningClient) extractResponseText(body []byte) (string, error) {
	// Adjust this parser based on what you actually saw in Phase 1.2
	var resp struct {
		Output struct {
			Message struct {
				Content []struct {
					Text string `json:"text"`
				} `json:"content"`
			} `json:"message"`
		} `json:"output"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w (raw: %s)", err, string(body))
	}
	if len(resp.Output.Message.Content) == 0 {
		return "", fmt.Errorf("empty content in response: %s", string(body))
	}
	return resp.Output.Message.Content[0].Text, nil
}

func (r *ReasoningClient) buildSystemPrompt(personality string) string {
	base := `You are Lira, an AI participant in a meeting. Rules:
- Keep responses under 60 words (30 seconds of speech)
- Speak naturally as if talking aloud in a meeting
- Reference what others have said by name
- Be constructive — don't just agree or disagree, add value
- If you don't have enough context, ask a clarifying question
- Never start with "As an AI" or break character`

	personalityAddons := map[string]string{
		"supportive": "\n- Find strengths in ideas before suggesting improvements\n- Be encouraging but honest",
		"critical":   "\n- Play devil's advocate\n- Point out risks, gaps, and assumptions\n- Challenge ideas constructively",
		"technical":  "\n- Focus on implementation feasibility\n- Mention specific technologies, patterns, or constraints\n- Ask about technical requirements",
		"business":   "\n- Focus on ROI, customer value, market fit\n- Ask about metrics and success criteria\n- Consider resource costs",
	}

	if addon, ok := personalityAddons[personality]; ok {
		return base + addon
	}
	return base
}

func (r *ReasoningClient) addHumanElements(text string) string {
	words := strings.Fields(text)
	if len(words) == 0 {
		return text
	}

	fillers := []string{"um,", "well,", "you know,", "I think", "honestly,", "actually,"}
	starters := []string{"Well, ", "So, ", "Hmm, ", "Yeah, ", "Right, "}

	var result []string

	// Sometimes add a natural starter
	if rand.Float64() < 0.5 {
		result = append(result, starters[rand.Intn(len(starters))])
	}

	for i, word := range words {
		result = append(result, word)
		// Insert filler after roughly every 12-15 words with 25% probability
		if i > 0 && i%13 == 0 && rand.Float64() < 0.25 {
			result = append(result, fillers[rand.Intn(len(fillers))])
		}
	}

	return strings.Join(result, " ")
}
```

### 5.2 Wire Into Gateway

Replace the mock `handleTriggerAI` from Phase 2:

```go
func handleTriggerAI(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	// 1. Get meeting context
	meeting, err := contextManager.GetMeeting(ctx, msg.SessionID)
	if err != nil {
		log.Error().Err(err).Msg("Get meeting failed")
		return respond(500, "no meeting context"), nil
	}

	// 2. Check if AI should respond
	lastMsg := ""
	if len(meeting.Messages) > 0 {
		lastMsg = meeting.Messages[len(meeting.Messages)-1].Text
	}
	if !contextManager.ShouldAIRespond(meeting, lastMsg) {
		log.Info().Msg("AI chose not to respond")
		return respond(200, "no response needed"), nil
	}

	// 3. Build context string
	conversationContext := contextManager.GetContextForPrompt(meeting)

	// 4. Generate response via Nova Lite
	responseText, err := reasoningClient.GenerateResponse(ctx, meeting, conversationContext)
	if err != nil {
		log.Error().Err(err).Msg("AI generation failed")
		// Graceful degradation: send error status, don't crash
		apiClient := newAPIGWClient(event)
		sendToConnection(ctx, apiClient, connID, OutboundMessage{
			Type:    "error",
			Payload: map[string]string{"message": "Lira is having trouble thinking right now."},
		})
		return respond(200, "generation failed gracefully"), nil
	}

	// 5. Store AI message in context
	contextManager.AddMessage(ctx, msg.SessionID, "Lira", responseText, true)

	// 6. Send text response immediately (audio follows in Phase 6)
	apiClient := newAPIGWClient(event)
	broadcastToSession(ctx, apiClient, msg.SessionID, OutboundMessage{
		Type:      "ai_response",
		SessionID: msg.SessionID,
		Payload: map[string]interface{}{
			"speaker": "lira",
			"text":    responseText,
		},
		Timestamp: time.Now().Unix(),
	})

	return respond(200, "ok"), nil
}
```

**Phase 5 Checklist:**

- [ ] Nova Lite generates meeting-appropriate responses
- [ ] System prompt with personality switching works
- [ ] Response length stays under 60 words
- [ ] Natural filler words are added
- [ ] Gateway sends real (not mock) AI responses
- [ ] Response stored in meeting context
- [ ] Error handling: graceful degradation if Nova Lite fails

---

## Phase 6: Audio Pipeline & Orchestration
<a id="phase-6-audio-pipeline--orchestration"></a>

**Goal:** Complete the audio loop — browser audio in → transcription → AI response → audio response out.  
**Dependencies:** Phase 4 (speech services), Phase 5 (reasoning).  
**Proceed independently:** Yes, but test with frontend when possible.  
**This is the hardest phase.** Audio is finicky. Budget extra time.

### 6.1 Audio Flow Architecture

```
Browser (mic capture, PCM 16-bit 16kHz mono)
    ↓ WebSocket (base64 encoded chunks, ~100ms each)
Gateway Lambda
    ↓ buffer chunks until speech pause detected
Audio Processing
    ↓ collected audio buffer
SpeechService.TranscribeAudio()
    ↓ transcription text
ContextManager.AddMessage() + ShouldAIRespond()
    ↓ if AI should respond
ReasoningClient.GenerateResponse()
    ↓ response text
SpeechService.SynthesizeSpeech()
    ↓ audio bytes
    ↓ WebSocket → Browser (plays audio)
```

### 6.2 Audio Buffer & Voice Activity Detection

```go
// internal/audio/processor.go
package audio

import (
	"encoding/binary"
	"math"
	"sync"
	"time"
)

// SessionBuffer accumulates audio chunks for a session and detects speech pauses.
type SessionBuffer struct {
	mu            sync.Mutex
	chunks        [][]byte
	lastChunkTime time.Time
	isSpeaking    bool
	silenceStart  time.Time
}

type Processor struct {
	mu       sync.RWMutex
	sessions map[string]*SessionBuffer
	silenceThresholdMS int // How long silence before we consider speech finished
	energyThreshold    float64
}

func NewProcessor() *Processor {
	return &Processor{
		sessions:           make(map[string]*SessionBuffer),
		silenceThresholdMS: 800, // 800ms of silence = end of utterance
		energyThreshold:    300,
	}
}

func (p *Processor) AddChunk(sessionID string, audioData []byte) (speechFinished bool, collectedAudio []byte) {
	p.mu.Lock()
	buf, exists := p.sessions[sessionID]
	if !exists {
		buf = &SessionBuffer{}
		p.sessions[sessionID] = buf
	}
	p.mu.Unlock()

	buf.mu.Lock()
	defer buf.mu.Unlock()

	now := time.Now()
	energy := calculateRMSEnergy(audioData)
	isSpeech := energy > p.energyThreshold

	if isSpeech {
		buf.chunks = append(buf.chunks, audioData)
		buf.lastChunkTime = now
		buf.isSpeaking = true
		buf.silenceStart = time.Time{}
		return false, nil
	}

	// Silence detected
	if buf.isSpeaking {
		if buf.silenceStart.IsZero() {
			buf.silenceStart = now
		}

		silenceDuration := now.Sub(buf.silenceStart).Milliseconds()
		if silenceDuration >= int64(p.silenceThresholdMS) && len(buf.chunks) > 0 {
			// Speech finished! Collect all buffered audio
			var collected []byte
			for _, chunk := range buf.chunks {
				collected = append(collected, chunk...)
			}

			// Reset buffer
			buf.chunks = nil
			buf.isSpeaking = false
			buf.silenceStart = time.Time{}

			return true, collected
		}
	}

	return false, nil
}

func (p *Processor) ClearSession(sessionID string) {
	p.mu.Lock()
	delete(p.sessions, sessionID)
	p.mu.Unlock()
}

// calculateRMSEnergy computes the root-mean-square energy of PCM 16-bit audio.
func calculateRMSEnergy(pcmData []byte) float64 {
	if len(pcmData) < 2 {
		return 0
	}

	var sumSquares float64
	sampleCount := len(pcmData) / 2

	for i := 0; i < len(pcmData)-1; i += 2 {
		sample := int16(binary.LittleEndian.Uint16(pcmData[i : i+2]))
		sumSquares += float64(sample) * float64(sample)
	}

	return math.Sqrt(sumSquares / float64(sampleCount))
}
```

### 6.3 Update Gateway Audio Handler

```go
func handleAudioMessage(ctx context.Context, connID string, msg InboundMessage, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	var audioPayload struct {
		AudioData string `json:"audio_data"` // base64 encoded PCM
		Format    string `json:"format"`      // "pcm16"
	}
	json.Unmarshal(msg.Payload, &audioPayload)

	// Decode audio
	audioBytes, err := base64.StdEncoding.DecodeString(audioPayload.AudioData)
	if err != nil {
		return respond(400, "invalid audio data"), nil
	}

	// Add to processor buffer, detect speech completion
	speechFinished, collectedAudio := audioProcessor.AddChunk(msg.SessionID, audioBytes)
	if !speechFinished {
		return respond(200, "buffering"), nil
	}

	// Speech finished — process the utterance
	// 1. Transcribe
	transcript, err := speechService.TranscribeAudio(ctx, collectedAudio, "pcm16")
	if err != nil {
		log.Error().Err(err).Msg("Transcription failed")
		return respond(200, "transcription failed"), nil
	}

	if strings.TrimSpace(transcript) == "" {
		return respond(200, "empty transcript"), nil
	}

	log.Info().Str("transcript", transcript).Msg("Speech transcribed")

	// 2. Store in context
	contextMgr.AddMessage(ctx, msg.SessionID, msg.UserID, transcript, false)

	// 3. Broadcast transcription to all participants
	apiClient := newAPIGWClient(event)
	broadcastToSession(ctx, apiClient, msg.SessionID, OutboundMessage{
		Type:      "transcription",
		SessionID: msg.SessionID,
		Payload: map[string]interface{}{
			"speaker": msg.UserID,
			"text":    transcript,
		},
		Timestamp: time.Now().Unix(),
	})

	// 4. Check if AI should respond
	meeting, _ := contextMgr.GetMeeting(ctx, msg.SessionID)
	if meeting != nil && contextMgr.ShouldAIRespond(meeting, transcript) {
		// 5. Generate AI text response
		conversationCtx := contextMgr.GetContextForPrompt(meeting)
		aiText, err := reasoningClient.GenerateResponse(ctx, meeting, conversationCtx)
		if err != nil {
			log.Error().Err(err).Msg("AI generation failed")
			return respond(200, "ai generation failed"), nil
		}

		// 6. Store AI response
		contextMgr.AddMessage(ctx, msg.SessionID, "Lira", aiText, true)

		// 7. Send text response immediately
		broadcastToSession(ctx, apiClient, msg.SessionID, OutboundMessage{
			Type:      "ai_response",
			SessionID: msg.SessionID,
			Payload: map[string]interface{}{
				"speaker": "lira",
				"text":    aiText,
			},
			Timestamp: time.Now().Unix(),
		})

		// 8. Synthesize speech and send audio
		aiAudio, err := speechService.SynthesizeSpeech(ctx, aiText)
		if err != nil {
			log.Error().Err(err).Msg("TTS failed — text response was already sent")
			return respond(200, "tts failed"), nil
		}

		if len(aiAudio) > 0 {
			broadcastToSession(ctx, apiClient, msg.SessionID, OutboundMessage{
				Type:      "ai_audio",
				SessionID: msg.SessionID,
				Payload: map[string]interface{}{
					"audio_data":  base64.StdEncoding.EncodeToString(aiAudio),
					"format":      "pcm16",
					"sample_rate": 24000,
					"duration_ms": len(aiAudio) / (24000 * 2 / 1000), // rough estimate
				},
				Timestamp: time.Now().Unix(),
			})
		}
	}

	return respond(200, "ok"), nil
}
```

### 6.4 Lambda Timeout Consideration

The full audio flow (transcribe → reason → synthesize) may take 2-5 seconds. Lambda timeout must accommodate this.

```yaml
# In template.yaml, set GatewayFunction timeout higher for audio processing:
GatewayFunction:
  Properties:
    Timeout: 30  # 30 seconds — enough for full audio loop
    MemorySize: 1024  # More memory = more CPU = faster processing
```

**If Lambda 30s timeout is too tight:** Consider splitting audio processing into a separate Lambda invoked asynchronously. The gateway receives audio, triggers the processor asynchronously, and the processor sends responses back via API Gateway Management API.

### 6.5 Audio Format Contract With Frontend

**Document this and share with Role 3 (Frontend):**

```
AUDIO INPUT (Browser → Backend):
  Format: PCM 16-bit signed little-endian
  Sample rate: 16000 Hz
  Channels: 1 (mono)
  Chunk size: ~100ms (~3200 bytes per chunk)
  Encoding: base64 in JSON payload

AUDIO OUTPUT (Backend → Browser):
  Format: PCM 16-bit signed little-endian
  Sample rate: 24000 Hz
  Channels: 1 (mono)
  Encoding: base64 in JSON payload

Frontend must:
  - Use Web Audio API AudioWorklet to capture mic at 16kHz mono
  - Convert Float32 samples to Int16
  - Base64 encode chunks
  - Send via WebSocket every ~100ms
  - Receive ai_audio messages
  - Decode base64, convert to Float32, play via AudioContext
```

**Phase 6 Checklist:**

- [ ] Audio chunks received and buffered correctly
- [ ] VAD detects speech start/end
- [ ] Transcription returns text from audio
- [ ] AI response generated from transcription
- [ ] Audio synthesized from AI text
- [ ] Full audio loop works: speak → hear AI respond
- [ ] Audio format contract shared with frontend
- [ ] Lambda timeout and memory configured for full loop

---

## Phase 7: End-to-End Flow
<a id="phase-7-end-to-end-flow"></a>

**Goal:** All pieces work together. A human can have a conversation with Lira.  
**Dependencies:** Phases 2-6 complete.  
**Proceed independently:** Yes for backend. End-to-end demo needs frontend.

### 7.1 Integration Test Script

```bash
#!/bin/bash
# scripts/e2e-test.sh — End-to-end test via wscat and curl

WS_URL="wss://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev"
HTTP_URL="https://YOUR_HTTP_API.execute-api.us-east-1.amazonaws.com/dev"

echo "1️⃣  Creating meeting..."
SESSION_ID=$(curl -s -X POST "$HTTP_URL/meetings" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Meeting"}' | jq -r '.session_id')
echo "   Session: $SESSION_ID"

echo "2️⃣  Connect to WebSocket and run these commands:"
echo ""
echo "   wscat -c '$WS_URL'"
echo ""
echo '   {"action":"join_session","session_id":"'$SESSION_ID'","user_id":"alice"}'
echo ""
echo '   {"action":"text","session_id":"'$SESSION_ID'","payload":{"speaker":"Alice","text":"Hey Lira, should we add dark mode to our app?"}}'
echo ""
echo '   {"action":"trigger_ai","session_id":"'$SESSION_ID'","payload":{}}'
echo ""
echo "3️⃣  Verify you receive:"
echo "   - session_joined message"
echo "   - transcription broadcast"
echo "   - ai_response with Lira's response (not mock)"
echo ""
echo "4️⃣  Check DynamoDB for stored messages:"
echo "   aws dynamodb get-item --table-name lira-meetings-dev --key '{\"session_id\":{\"S\":\"$SESSION_ID\"}}' | jq '.Item.messages'"
```

### 7.2 What to Verify

| Step | Check | How |
|------|-------|-----|
| WebSocket connect | Connection record in DynamoDB | AWS Console → DynamoDB → lira-connections-dev |
| Join session | Connection updated with session_id | Same table |
| Text message | Message stored in meetings table | DynamoDB → lira-meetings-dev |
| AI trigger | Nova Lite called, response received | CloudWatch Logs |
| Audio (if testing) | Transcription + response audio | WebSocket output |
| Broadcast | All connected clients receive events | Open 2 wscat terminals |
| Disconnect | Connection record deleted | DynamoDB |

**Phase 7 Checklist:**

- [ ] Full text-based flow works (text in → AI text out)
- [ ] Full audio-based flow works (audio in → transcription + AI audio out)
- [ ] Multiple clients receive broadcasts
- [ ] Meeting state persists across messages
- [ ] AI personality affects responses
- [ ] No crashes or unhandled errors

---

## Phase 8: Hardening
<a id="phase-8-hardening"></a>

**Goal:** The system doesn't crash under edge cases. Errors are handled gracefully.  
**Dependencies:** Phase 7 complete.  
**Proceed independently:** Yes.

### 8.1 What to Harden

| Area | Implementation |
|------|---------------|
| **Retry logic** | Wrap all Bedrock calls with exponential backoff (3 retries, 100ms/500ms/2s delays) |
| **Timeout handling** | Context with timeout on every external call (`context.WithTimeout(ctx, 10*time.Second)`) |
| **Connection cleanup** | TTL on connections table + cleanup on broadcast failure |
| **Input validation** | Validate message structure, session_id format, audio size limits |
| **Rate limiting** | Max 10 AI triggers per minute per session (prevent spam) |
| **Graceful degradation** | If Nova fails → send "Lira is having trouble" message, don't kill the session |
| **Payload size** | API Gateway WebSocket limit is 128KB per frame. Audio chunks must stay under this. |
| **Concurrent requests** | DynamoDB conditional writes to prevent race conditions on meeting state updates |

### 8.2 Retry Wrapper

```go
// pkg/retry/retry.go
package retry

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
)

func WithRetry(ctx context.Context, maxAttempts int, operation string, fn func() error) error {
	delays := []time.Duration{100 * time.Millisecond, 500 * time.Millisecond, 2 * time.Second}

	for attempt := 0; attempt < maxAttempts; attempt++ {
		err := fn()
		if err == nil {
			return nil
		}

		if attempt == maxAttempts-1 {
			return fmt.Errorf("%s failed after %d attempts: %w", operation, maxAttempts, err)
		}

		delay := delays[attempt]
		if attempt >= len(delays) {
			delay = delays[len(delays)-1]
		}

		log.Warn().Err(err).Str("op", operation).Int("attempt", attempt+1).Dur("retry_in", delay).Msg("Retrying")

		select {
		case <-time.After(delay):
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}
```

**Phase 8 Checklist:**

- [ ] All external calls wrapped with retry logic
- [ ] All external calls have context timeouts
- [ ] Input validation on all WebSocket messages
- [ ] Rate limiting on AI triggers
- [ ] Stale connections cleaned up automatically
- [ ] Large payload handling (reject > 100KB audio chunks)
- [ ] Graceful error messages sent to clients

---

## Phase 9: Observability & Monitoring
<a id="phase-9-observability--monitoring"></a>

**Goal:** You can see what's happening in production. Problems are detected before users report them.  
**Dependencies:** Phase 7+ (need a working system to observe).  
**Proceed independently:** Yes.

### 9.1 Structured Logging

Already using zerolog from Phase 2. Ensure every log line includes:

```go
log.Info().
    Str("session_id", sessionID).
    Str("conn_id", connID).
    Str("action", action).
    Dur("latency", duration).
    Msg("Request processed")
```

### 9.2 CloudWatch Alarms

Add to SAM template:

```yaml
  # Lambda error rate alarm
  GatewayErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub lira-gateway-errors-${Environment}
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref GatewayFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold

  # Lambda duration alarm (latency)
  GatewayLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub lira-gateway-latency-${Environment}
      MetricName: Duration
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref GatewayFunction
      Statistic: p99
      Period: 300
      EvaluationPeriods: 1
      Threshold: 15000
      ComparisonOperator: GreaterThanThreshold
```

### 9.3 Quick Debug Commands

```bash
# Tail Lambda logs
aws logs tail /aws/lambda/lira-gateway-dev --follow --format short

# Count errors in last hour
aws logs filter-log-events \
  --log-group-name /aws/lambda/lira-gateway-dev \
  --start-time $(date -v-1H +%s000) \
  --filter-pattern "ERROR" \
  --query 'events[].message' --output text | wc -l

# Check active WebSocket connections
aws dynamodb scan --table-name lira-connections-dev --select COUNT

# Check meeting count
aws dynamodb scan --table-name lira-meetings-dev --select COUNT
```

**Phase 9 Checklist:**

- [ ] Structured logging on all operations
- [ ] CloudWatch alarms for errors and latency
- [ ] Dashboard with key metrics
- [ ] Debug commands documented and tested
- [ ] X-Ray tracing enabled (optional but helpful)

---

## Phase 10: Production Deployment & Demo Readiness
<a id="phase-10-production-deployment--demo-readiness"></a>

**Goal:** The backend is stable, deployed, and ready for the hackathon demo.  
**Dependencies:** All previous phases.  
**What you need from others:** Frontend connected and working. DevOps for final CI/CD.

### 10.1 Pre-Demo Checklist

- [ ] Deploy to production environment (`sam deploy --parameter-overrides Environment=prod`)
- [ ] Test with real multi-participant meeting (you + 1 teammate minimum)
- [ ] Verify AI responses are coherent and appropriate
- [ ] Verify audio loop works (if audio is in scope for demo)
- [ ] Verify latency is under 3 seconds
- [ ] Set up billing alarm ($50 threshold)
- [ ] Test WebSocket reconnection (kill connection, reconnect, rejoin session)
- [ ] Pre-warm Lambdas (invoke once before demo to avoid cold start)

### 10.2 Demo Playbook

Prepare for the demo:

```bash
# Pre-warm Lambda (run 5 minutes before demo)
aws lambda invoke --function-name lira-gateway-prod \
  --payload '{"requestContext":{"routeKey":"$connect","connectionId":"warmup"}}' \
  /dev/null

# Watch logs during demo
aws logs tail /aws/lambda/lira-gateway-prod --follow --format short

# Quick health check
WS_URL="wss://YOUR_PROD_API.execute-api.us-east-1.amazonaws.com/prod"
wscat -c "$WS_URL" -x '{"action":"join_session","session_id":"demo","user_id":"test"}' -w 2
```

### 10.3 Rollback Plan

If something breaks during demo:

1. **WebSocket down:** Redeploy previous version: `sam deploy --resolve-s3 --force-upload`
2. **Nova errors:** Switch to mock mode (environment variable `MOCK_AI=true`)
3. **DynamoDB throttled:** Won't happen with PAY_PER_REQUEST billing
4. **Total failure:** Have a pre-recorded demo video as backup (coordinate with Role 4)

---

## Appendix A: Manual Steps Checklist
<a id="appendix-a-manual-steps-checklist"></a>

These are things that **cannot be automated** — you must do them in the AWS Console or CLI manually.

| Step | Where | When | Notes |
|------|-------|------|-------|
| Create AWS account (if new) | aws.amazon.com | Before anything | Need credit card, email |
| Enable MFA on root account | IAM Console | Immediately after account creation | Security requirement |
| Create IAM user for development | IAM Console | Before Phase 0 | Don't use root for development |
| Enable Bedrock model access | Bedrock Console → Model Access | Phase 0 | Must be done per-model, per-region |
| Request Bedrock quota increase | Service Quotas Console | If hitting limits | Default may be low for some models |
| Set up billing alarm | Billing Console → Budgets | Phase 0 | Set $50 and $100 thresholds |
| Create GitHub repository | github.com | Phase 0 | Invite team members |
| Configure GitHub Secrets | GitHub repo → Settings → Secrets | Before CI/CD | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY |
| Review CloudWatch logs | CloudWatch Console | Continuously | Check after every deployment |
| Verify DynamoDB data | DynamoDB Console → Explore Items | After each phase | Confirm records are correct |

---

## Appendix B: Exact Go Dependencies
<a id="appendix-b-exact-go-dependencies"></a>

```go
// go.mod
module github.com/creovine/lira-ai-backend

go 1.22

require (
	// AWS SDK v2 — core
	github.com/aws/aws-sdk-go-v2 v1.30.0
	github.com/aws/aws-sdk-go-v2/config v1.27.0

	// AWS SDK v2 — services
	github.com/aws/aws-sdk-go-v2/service/bedrockruntime v1.15.0
	github.com/aws/aws-sdk-go-v2/service/dynamodb v1.34.0
	github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue v1.14.0
	github.com/aws/aws-sdk-go-v2/service/s3 v1.58.0
	github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi v1.19.0
	github.com/aws/aws-sdk-go-v2/service/polly v1.43.0           // Only if using fallback Path B
	github.com/aws/aws-sdk-go-v2/service/transcribestreaming v1.17.0 // Only if using fallback Path B

	// Lambda runtime
	github.com/aws/aws-lambda-go v1.47.0

	// Utilities
	github.com/google/uuid v1.6.0
	github.com/rs/zerolog v1.33.0

	// Testing
	github.com/stretchr/testify v1.9.0
)
```

**Install command:**

```bash
# Core (always needed)
go get github.com/aws/aws-sdk-go-v2@latest \
       github.com/aws/aws-sdk-go-v2/config@latest \
       github.com/aws/aws-sdk-go-v2/service/bedrockruntime@latest \
       github.com/aws/aws-sdk-go-v2/service/dynamodb@latest \
       github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue@latest \
       github.com/aws/aws-sdk-go-v2/service/s3@latest \
       github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi@latest \
       github.com/aws/aws-lambda-go@latest \
       github.com/google/uuid@latest \
       github.com/rs/zerolog@latest \
       github.com/stretchr/testify@latest

# Fallback speech services (only if Nova Sonic not available)
go get github.com/aws/aws-sdk-go-v2/service/polly@latest \
       github.com/aws/aws-sdk-go-v2/service/transcribestreaming@latest

go mod tidy
```

---

## Appendix C: Complete SAM Template
<a id="appendix-c-complete-sam-template"></a>

The full SAM template is built incrementally across phases. By Phase 10, it should contain:

| Resource | Type | Added In |
|----------|------|----------|
| ConnectionsTable | DynamoDB | Phase 1 |
| MeetingsTable | DynamoDB | Phase 1 |
| AudioBucket | S3 | Phase 1 |
| WebSocketApi | API Gateway v2 | Phase 2 |
| GatewayFunction | Lambda (Go) | Phase 2 |
| ConnectRoute, DisconnectRoute, DefaultRoute | API Gateway routes | Phase 2 |
| HttpApi | API Gateway HTTP | Phase 3 |
| MeetingsFunction | Lambda (Go) | Phase 3 |
| GatewayErrorAlarm | CloudWatch Alarm | Phase 9 |
| GatewayLatencyAlarm | CloudWatch Alarm | Phase 9 |

---

## Appendix D: Environment Variables Reference
<a id="appendix-d-environment-variables-reference"></a>

| Variable | Value | Used By |
|----------|-------|---------|
| `AWS_REGION` | `us-east-1` | All Lambdas |
| `ENVIRONMENT` | `dev` / `prod` | All Lambdas |
| `LOG_LEVEL` | `debug` / `info` | All Lambdas |
| `CONNECTIONS_TABLE` | `lira-connections-{env}` | Gateway |
| `MEETINGS_TABLE` | `lira-meetings-{env}` | Gateway, Meetings |
| `AUDIO_BUCKET` | `lira-audio-{env}-{account}` | Gateway |
| `NOVA_LITE_MODEL_ID` | `amazon.nova-lite-v1:0` (confirm in Phase 1) | Gateway |
| `NOVA_SONIC_MODEL_ID` | `amazon.nova-sonic-v1:0` (confirm in Phase 1) | Gateway |
| `MOCK_AI` | `true` / `false` | Gateway — for demo fallback |

---

## Appendix E: WebSocket Message Contract
<a id="appendix-e-websocket-message-contract"></a>

**Share this with Role 3 (Frontend) as soon as Phase 2 is deployed.**

### Client → Server (Inbound)

Every message has this envelope:

```json
{
  "action": "<action_name>",
  "session_id": "<uuid>",
  "user_id": "<string>",
  "payload": { ... }
}
```

| Action | Payload | Description |
|--------|---------|-------------|
| `join_session` | `{}` | Join a meeting room. Creates session if it doesn't exist. |
| `text` | `{"speaker": "Alice", "text": "..."}` | Send a text message (for testing or chat). |
| `audio` | `{"audio_data": "<base64>", "format": "pcm16"}` | Send an audio chunk (~100ms of PCM 16-bit 16kHz mono). |
| `trigger_ai` | `{}` | Manually trigger an AI response (for testing). |
| `update_settings` | `{"personality": "critical", "participation_level": 0.8, "wake_word_enabled": true}` | Update AI settings for this session. |

### Server → Client (Outbound)

Every message has this envelope:

```json
{
  "type": "<message_type>",
  "session_id": "<uuid>",
  "payload": { ... },
  "timestamp": 1708700000
}
```

| Type | Payload | Description |
|------|---------|-------------|
| `session_joined` | `{"status": "joined", "user_id": "alice"}` | Confirmation of joining. |
| `transcription` | `{"speaker": "Alice", "text": "Should we add dark mode?"}` | Real-time transcription of a participant. Broadcast to all. |
| `ai_response` | `{"speaker": "lira", "text": "Well, I think..."}` | AI text response. Broadcast to all. |
| `ai_audio` | `{"audio_data": "<base64>", "format": "pcm16", "sample_rate": 24000, "duration_ms": 3500}` | AI audio response. Broadcast to all. |
| `participant_event` | `{"event": "joined"/"left", "user_id": "bob"}` | Someone joined or left the session. |
| `error` | `{"code": "GENERATION_FAILED", "message": "Lira is having trouble..."}` | Error message. Sent to individual client. |

### Audio Format Specification

```
INPUT (Browser → Server):
  Encoding:    PCM signed 16-bit little-endian
  Sample rate: 16000 Hz
  Channels:    1 (mono)
  Chunk size:  3200 bytes (~100ms of audio)
  Transport:   base64 encoded string in JSON

OUTPUT (Server → Browser):
  Encoding:    PCM signed 16-bit little-endian
  Sample rate: 24000 Hz
  Channels:    1 (mono)
  Transport:   base64 encoded string in JSON
```

### Frontend Implementation Notes

**Capturing audio:**
```javascript
// Use AudioWorklet for low-latency capture at 16kHz mono
// Convert Float32 → Int16 → base64
// Send every ~100ms via WebSocket
```

**Playing AI audio:**
```javascript
// Receive ai_audio message
// base64 decode → Int16Array → Float32Array
// Play via AudioContext.createBufferSource()
```

---

*End of Backend Implementation Phases Document*

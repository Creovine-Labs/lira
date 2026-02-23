# Lira AI — Pending Work (Requires AWS Credentials)

> **Context:** All backend code is complete and 103 unit tests pass locally.
> The items below are blocked on team AWS credentials / account access.
> Run `make deploy` once credentials are configured.

---

## 🔑 Credential Setup (Do First)

```bash
# 1. Configure AWS CLI with team credentials
aws configure
# AWS Access Key ID:     <from team>
# AWS Secret Access Key: <from team>
# Default region:        us-east-1
# Output format:         json

# 2. Verify access
aws sts get-caller-identity

# 3. Request Nova model access (one-time, ~5 min approval)
# AWS Console → Bedrock → Model Access → Request:
#   - Amazon Nova Lite   (amazon.nova-lite-v1:0)
#   - Amazon Nova Sonic  (us.amazon.nova-sonic-v1:0)
# Also request: Amazon Polly (enabled by default in most accounts)
```

---

## 🚀 Immediate Deploy Sequence

Once credentials are ready, run these in order:

```bash
cd backend

# 1. Build + deploy SAM stack
make deploy STACK_NAME=lira-ai-dev AWS_REGION=us-east-1

# 2. Capture outputs
aws cloudformation describe-stacks \
  --stack-name lira-ai-dev \
  --query "Stacks[0].Outputs"

# 3. Smoke test WebSocket endpoint
wscat -c wss://<ApiGatewayId>.execute-api.us-east-1.amazonaws.com/dev
# Send: {"action":"message","payload":{"type":"join","session_id":"test-001","payload":{"user_id":"alice","user_name":"Alice"}}}
```

---

## 📋 Pending Work Items

### 1. Infrastructure Deploy
| Task | Command | Notes |
|------|---------|-------|
| Deploy SAM stack | `make deploy` | Creates API GW, Lambdas, DynamoDB, S3 |
| Verify DynamoDB tables | AWS Console | `lira-connections`, `lira-meetings` |
| Verify S3 bucket | AWS Console | `lira-audio-<accountId>` |
| Retrieve WebSocket URL | CloudFormation Outputs | Set as `WEBSOCKET_ENDPOINT` |

### 2. Nova Bedrock — Live Test
| Task | Env Var | Value |
|------|---------|-------|
| Enable real Nova Lite | `MOCK_AI=false` | In Lambda env vars |
| Set model ID | `NOVA_LITE_MODEL_ID` | `amazon.nova-lite-v1:0` |
| Enable Nova Sonic TTS | `TTS_ENABLED=true` | Activates Sonic → Polly fallback |
| Set Sonic model | `NOVA_SONIC_MODEL_ID` | `us.amazon.nova-sonic-v1:0` |
| Set Polly voice | `POLLY_VOICE_ID` | `Joanna` (default) or `Matthew` |

```bash
# Update Lambda environment variables after deploy
aws lambda update-function-configuration \
  --function-name lira-ai-dev-GatewayFunction \
  --environment "Variables={MOCK_AI=false,TTS_ENABLED=true,NOVA_LITE_MODEL_ID=amazon.nova-lite-v1:0,NOVA_SONIC_MODEL_ID=us.amazon.nova-sonic-v1:0}"
```

### 3. IAM Permissions to Verify
The SAM template already defines these — confirm they're active post-deploy:

```
GatewayFunction needs:
  bedrock:InvokeModel                  → Nova Lite text
  bedrock:InvokeModelWithResponseStream → Nova Sonic audio
  polly:SynthesizeSpeech               → Polly fallback TTS
  dynamodb:GetItem / PutItem / Query   → lira-connections, lira-meetings
  execute-api:ManageConnections        → WebSocket broadcast

AudioProcessorFunction needs:
  s3:GetObject                         → audio bucket
  transcribe:StartTranscriptionJob     → AWS Transcribe
  transcribe:GetTranscriptionJob       → poll for result
  dynamodb:GetItem / UpdateItem        → lira-meetings
  execute-api:ManageConnections        → WebSocket broadcast

MeetingsFunction needs:
  dynamodb:GetItem / PutItem / DeleteItem / Query → lira-meetings
```

### 4. End-to-End Integration Tests
Run after successful deploy:

```bash
# Full local suite against real AWS (set real env vars)
ENVIRONMENT=dev MOCK_AI=false bash scripts/local_test.sh

# WebSocket flow test
wscat -c wss://<WS_URL>
# 1. join session
# 2. "hey lira what do you think about our sprint plan?"
# 3. Expect ai_response with text + audio_base64
```

### 5. AWS Transcribe — Real Audio Test
```bash
# Upload a real WebM audio file to S3 to trigger AudioProcessorFunction
aws s3 cp test.webm s3://lira-audio-<accountId>/audio/test-session-001/chunk-001.webm

# Watch Lambda logs
aws logs tail /aws/lambda/lira-ai-dev-AudioProcessorFunction --follow
```

### 6. Nova Sonic Validation
Nova Sonic's bidirectional streaming requires real credentials to test.
After deploy:
- Set `TTS_ENABLED=true` in GatewayFunction environment
- Send a text message to the WebSocket
- Inspect `ai_response.audio_base64` in the response — non-empty means Sonic worked
- If empty/error, check logs: Polly fallback will have been used

---

## 🏗️ Work We Can Do While Waiting

These items do **not** require AWS credentials:

| Item | Description | Status |
|------|-------------|--------|
| CI/CD pipeline | GitHub Actions: `go test` + `sam build` on PR | ⬜ Ready to build |
| Sentiment tagging | Keyword-based sentiment on messages (no Comprehend needed) | ⬜ Ready to build |
| Meeting summary endpoint | `GET /meetings/{id}/summary` — runs Nova Lite locally with MockAI | ⬜ Ready to build |
| WebSocket load test | `k6` or Artillery script for concurrent session testing | ⬜ Ready to build |
| SAM template validation | `sam validate --lint` — no creds needed | ✅ Can run now |
| `make deploy` dry-run | `sam deploy --no-execute-changeset` — shows what will deploy | ⬜ Needs creds |
| Frontend WebSocket client | Connect to mock local-ws (`make local-ws`) | ⬜ Role 3 dependency |

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `deployments/template.yaml` | SAM template — all Lambda + IAM definitions |
| `cmd/gateway/main.go` | Gateway Lambda entry — Sonic+Polly wired here |
| `cmd/audio/main.go` | S3 audio Lambda entry |
| `cmd/meetings/main.go` | Meetings HTTP CRUD Lambda entry |
| `Makefile` | `make deploy`, `make local-ws`, `make invoke-*` |
| `scripts/local_test.sh` | Full local integration suite (103 tests + 3 SAM invokes) |
| `pkg/config/config.go` | All env vars with defaults |

### Environment Variables Cheat Sheet
```
ENVIRONMENT          dev | staging | prod
MOCK_AI              true | false
TTS_ENABLED          true | false
NOVA_LITE_MODEL_ID   amazon.nova-lite-v1:0
NOVA_SONIC_MODEL_ID  us.amazon.nova-sonic-v1:0
POLLY_VOICE_ID       Joanna | Matthew | Salli
NOVA_MODEL_ID        (fallback if NOVA_LITE_MODEL_ID not set)
WEBSOCKET_ENDPOINT   wss://xxx.execute-api.us-east-1.amazonaws.com/dev
CONNECTIONS_TABLE    lira-connections
MEETINGS_TABLE       lira-meetings
AUDIO_BUCKET         lira-audio-<accountId>
AWS_REGION           us-east-1
```

---

## ✅ Already Done (No Creds Required)

| Component | Tests |
|-----------|-------|
| WebSocket gateway Lambda (connect/disconnect/join/text/settings/leave) | 75 → 103 ✅ |
| Nova Lite Bedrock client (Converse API) | ✅ |
| ShouldAIRespond policy (wake word, cooldown, participation rate) | ✅ |
| Filler words injector (per-personality) | ✅ |
| Prompt builder (topics, action items, context header) | ✅ |
| 4-personality system (supportive/analytical/facilitator/devil's advocate) | ✅ |
| Nova Sonic wrapper (`SonicClient`) with Polly fallback | ✅ |
| Polly TTS client (`PollyClient`) | ✅ |
| Audio processor Lambda (S3 → Transcribe → broadcast) | ✅ |
| Meetings HTTP CRUD (create/get/update/delete) | ✅ |
| SAM local testing (all 3 Lambdas invoking on linux/amd64) | ✅ |
| `cmd/gateway/main.go` wired: Nova Lite + Sonic + Polly | ✅ |

---

*Last updated: 2026-02-23*

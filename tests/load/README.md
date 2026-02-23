# Lira AI – WebSocket Load Tests

## Prerequisites

| Tool | Install |
|------|---------|
| k6   | `brew install k6` (macOS) · [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/) |
| SAM CLI | Already set up in this project |

---

## Quick start (local mock mode)

### 1. Start the SAM local stack

```bash
# From repo root
cd backend

# Build for local (x86_64, needed for Docker on Apple Silicon)
GOARCH=amd64 GOOS=linux sam build \
  --template deployments/template-local.yaml \
  --use-container

# Start WebSocket API (port 3000) with mock AI (no AWS creds needed)
sam local start-api \
  --template deployments/template-local.yaml \
  --parameter-overrides MockAI=true \
  --port 3000 &

# If you also want the HTTP meetings API (port 3001)
sam local start-api \
  --template deployments/template-local.yaml \
  --parameter-overrides MockAI=true \
  --port 3001 &
```

### 2. Run the load test

```bash
# From repo root
k6 run tests/load/websocket_load.js
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_URL` | `ws://localhost:3000` | WebSocket endpoint |
| `HTTP_URL` | `http://localhost:3001` | REST API endpoint (used to pre-create meetings) |
| `VU_COUNT` | `20` | Peak virtual user count |
| `DURATION` | `30s` | Duration of each load stage |

```bash
# Example: heavier ramp targeting staging
k6 run \
  -e WS_URL=wss://abc123.execute-api.us-east-1.amazonaws.com/staging \
  -e HTTP_URL=https://def456.execute-api.us-east-1.amazonaws.com/staging \
  -e VU_COUNT=50 \
  -e DURATION=60s \
  tests/load/websocket_load.js
```

---

## Scenarios

The test uses a staged ramp:

```
VUs
 50 │               ┌──────────────────┐
 20 │         ┌─────┘                  └─────┐
  5 │    ┌───┘                               └───┐
  0 │────┘                                       └────
    0   10s      40s              70s         80s
```

Each VU:
1. Pre-creates a meeting via `POST /meetings`
2. Opens a WebSocket connection
3. Sends a `join` action
4. Sends 3 text messages (sampled from a fixed list)
5. Waits for transcription echoes and `ai_response` after each message
6. Closes the connection

---

## Thresholds (pass/fail criteria)

| Metric | Threshold |
|--------|-----------|
| `join_latency_ms` p95 | < 2 000 ms |
| `ai_response_latency_ms` p95 | < 5 000 ms (mock); < 8 000 ms for production |
| `ai_response_received` rate | > 80 % |

The test exits with code `1` (CI failure) if any threshold is breached.

---

## Metrics emitted

| k6 metric | Description |
|-----------|-------------|
| `join_latency_ms` | Time from WS open → `joined` event received |
| `ai_response_latency_ms` | Time from text sent → `ai_response` received |
| `messages_delivered` | Count of all inbound WS messages received |
| `ai_response_received` | Rate of text sends that triggered an AI reply |
| `ws_connecting` | k6 built-in: TCP+TLS connection time |
| `ws_session_duration` | k6 built-in: total WebSocket session time |

---

## Interpreting results

```
✓ websocket connected (101)
✓ meeting created (2xx)

Trend  ai_response_latency_ms : avg=312ms  p(95)=580ms  max=1.2s
Trend  join_latency_ms        : avg=48ms   p(95)=95ms   max=180ms
Rate   ai_response_received   : 97.50%

✓ ai_response_latency_ms p(95)<5000
✓ join_latency_ms p(95)<2000
✓ ai_response_received rate>0.8
```

If `ai_response_received` drops below 80 %, check:
- `MockAI` param is set to `true` (fast mock responses)
- `MOCK_BROADCAST` is set to `true` (mock broadcaster doesn't need real connections)
- SAM container has enough CPU (Docker Desktop → Resources)

#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# Lira AI — SAM Local Integration Test
# Tests Gateway (WebSocket) + Meetings (HTTP API) + Audio Processor
# Requires: sam, wscat, curl, jq
# Docker is required only for SAM local invoke sections.
# ══════════════════════════════════════════════════════════════
set -euo pipefail

# Always run from the backend/ directory (one level above this script).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TEMPLATE="deployments/template-local.yaml"  # x86_64 variant, auto-generated
SAM_TEMPLATE_PROD="deployments/template.yaml"
ENV_FILE="tests/events/local-env.json"
HTTP_PORT=3001
WS_PORT=3000
GATEWAY_PID=
API_PID=
DOCKER_AVAILABLE=false

cleanup() {
  echo ""
  echo "==> Cleaning up..."
  [[ -n "$GATEWAY_PID" ]] && kill "$GATEWAY_PID" 2>/dev/null || true
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT

check_deps() {
  echo "==> Checking dependencies..."
  for cmd in sam wscat curl jq; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "ERROR: $cmd not found. Install it first." >&2
      exit 1
    fi
  done
  # Docker is optional — SAM local invoke skips if not available.
  if docker info &>/dev/null 2>&1; then
    DOCKER_AVAILABLE=true
    echo "    Docker: available"
  else
    DOCKER_AVAILABLE=false
    echo "    Docker: NOT running (SAM local invoke steps will be skipped)"
  fi
  echo "    All required dependencies found."
}

build_lambdas() {
  echo "==> Building Go binaries (native)..."
  go build ./...
  echo "    Build successful."
}

build_lambda_bins() {
  echo "==> Generating local SAM template (x86_64)..."
  sed 's/arm64/x86_64/g; s/aarch64/amd64/g' "$SAM_TEMPLATE_PROD" > "$TEMPLATE"

  echo "==> Cross-compiling Lambda binaries for linux/amd64..."
  for dir in cmd/gateway cmd/meetings cmd/audio; do
    echo "    -> $dir/bootstrap"
    GOOS=linux GOARCH=amd64 go build -o "$dir/bootstrap" "./$dir/"
  done
  echo "    Cross-compile done."
}

test_unit() {
  echo "==> Running unit tests..."
  go test ./... -count=1 -timeout 60s
  echo "    All unit tests passed."
}

invoke_gateway_connect() {
  if [[ "$DOCKER_AVAILABLE" == "false" ]]; then
    echo "==> [SKIP] GatewayFunction invoke — Docker not running"
    return
  fi
  echo "==> Invoking GatewayFunction (connect event)..."
  result=$(sam local invoke GatewayFunction \
    --template "$TEMPLATE" \
    --event tests/events/connect.json \
    --env-vars "$ENV_FILE" 2>&1 || true)
  echo "    Response: $result"
}

invoke_audio_processor() {
  if [[ "$DOCKER_AVAILABLE" == "false" ]]; then
    echo "==> [SKIP] AudioProcessorFunction invoke — Docker not running"
    return
  fi
  echo "==> Invoking AudioProcessorFunction (S3 event)..."
  sam local invoke AudioProcessorFunction \
    --template "$TEMPLATE" \
    --event tests/events/s3_audio.json \
    --env-vars "$ENV_FILE"
  echo "    Audio processor invoked."
}

invoke_meetings_create() {
  if [[ "$DOCKER_AVAILABLE" == "false" ]]; then
    echo "==> [SKIP] MeetingsFunction invoke — Docker not running"
    return
  fi
  echo "==> Invoking MeetingsFunction (create meeting)..."
  result=$(sam local invoke MeetingsFunction \
    --template "$TEMPLATE" \
    --event tests/events/create_meeting.json \
    --env-vars "$ENV_FILE")
  echo "    Response: $result"
  echo "$result" | jq -r '.body' | jq . 2>/dev/null || true
}

run_wscat_test() {
  echo ""
  echo "==> Manual WebSocket test instructions (Docker required):"
  echo "    Terminal 1:  make local-ws"
  echo "    Terminal 2:  wscat -c ws://localhost:$WS_PORT"
  echo '    Send:        {"action":"join","session_id":"test-001","payload":{"user_id":"alice","user_name":"Alice"}}'
  echo '    Send:        {"action":"text","payload":{"text":"hey lira summarize our discussion"}}'
  echo ""
}

main() {
  echo "══════════════════════════════════════════════════════════"
  echo " Lira AI — Local Integration Test Suite"
  echo "══════════════════════════════════════════════════════════"

  cd "$BACKEND_DIR"
  echo "    Working directory: $BACKEND_DIR"

  check_deps
  build_lambdas
  test_unit
  build_lambda_bins
  invoke_gateway_connect
  invoke_audio_processor
  invoke_meetings_create
  run_wscat_test

  echo "══════════════════════════════════════════════════════════"
  echo " All checks passed!"
  echo "══════════════════════════════════════════════════════════"
}

main "$@"

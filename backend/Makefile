# ══════════════════════════════════════════════════════════════════
# Lira AI Backend — Makefile
# ══════════════════════════════════════════════════════════════════

BINARY_DIR   := bin
SAM_TEMPLATE := deployments/template.yaml
STACK_NAME   := lira-ai-dev
AWS_REGION   := us-east-1

.PHONY: all build test lint clean sam-build local-api local-ws deploy

# ── Default ────────────────────────────────────────────────────
all: build test

# ── Go build ───────────────────────────────────────────────────
build:
	@echo "==> Building Go binaries..."
	go build ./...

build-lambdas:
	@echo "==> Building Lambda binaries (linux/arm64) into bin/..."
	@for dir in cmd/gateway cmd/meetings cmd/audio; do \
		name=$$(basename $$dir); \
		echo "  -> $$name"; \
		GOOS=linux GOARCH=arm64 go build -o $(BINARY_DIR)/$$name/bootstrap ./$$dir/; \
	done

# ── SAM local template (x86_64 arch, for Mac Docker running amd64 VM) ─────────
SAM_LOCAL_TEMPLATE := deployments/template-local.yaml

template-local:
	@sed 's/arm64/x86_64/g; s/aarch64/amd64/g' $(SAM_TEMPLATE) > $(SAM_LOCAL_TEMPLATE)
	@echo "==> Generated $(SAM_LOCAL_TEMPLATE) (x86_64 for local invoke)"

# Build linux/amd64 bootstrap binaries into each cmd/ dir (required for sam local invoke)
build-local: template-local
	@echo "==> Cross-compiling for linux/amd64 (sam local invoke)..."
	@for dir in cmd/gateway cmd/meetings cmd/audio; do \
		echo "  -> $$dir/bootstrap"; \
		GOOS=linux GOARCH=amd64 go build -o $$dir/bootstrap ./$$dir/; \
	done
	@echo "    Done."

# ── Tests ──────────────────────────────────────────────────────
test:
	@echo "==> Running unit tests..."
	go test ./... -count=1 -race -timeout 60s

test-verbose:
	go test ./... -count=1 -v -timeout 60s

test-coverage:
	@echo "==> Running tests with coverage..."
	go test ./... -count=1 -coverprofile=coverage.out -covermode=atomic
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

# ── Lint ───────────────────────────────────────────────────────
lint:
	golangci-lint run ./...

# ── SAM ────────────────────────────────────────────────────────
sam-build:
	@echo "==> SAM build..."
	sam build --template $(SAM_TEMPLATE) --use-container

# Start HTTP API locally (meetings Lambda)
local-api: build-local
	@echo "==> Starting SAM local HTTP API on :3001..."
	@echo "    Meetings endpoint: http://localhost:3001"
	MOCK_AI=true sam local start-api \
		--template $(SAM_LOCAL_TEMPLATE) \
		--port 3001 \
		--env-vars tests/events/local-env.json \
		--warm-containers EAGER

# Start WebSocket API locally (gateway Lambda)
local-ws: build-local
	@echo "==> Starting SAM local WebSocket API on :3000..."
	@echo "    Connect with: wscat -c ws://localhost:3000"
	MOCK_AI=true sam local start-api \
		--template $(SAM_LOCAL_TEMPLATE) \
		--port 3000 \
		--env-vars tests/events/local-env.json

# Invoke a single Lambda with a test event
invoke-gateway: build-local
	sam local invoke GatewayFunction \
		--template $(SAM_LOCAL_TEMPLATE) \
		--event tests/events/connect.json \
		--env-vars tests/events/local-env.json

invoke-audio: build-local
	sam local invoke AudioProcessorFunction \
		--template $(SAM_LOCAL_TEMPLATE) \
		--event tests/events/s3_audio.json \
		--env-vars tests/events/local-env.json

invoke-meetings: build-local
	sam local invoke MeetingsFunction \
		--template $(SAM_LOCAL_TEMPLATE) \
		--event tests/events/create_meeting.json \
		--env-vars tests/events/local-env.json

# ── Deploy ─────────────────────────────────────────────────────
deploy: sam-build
	sam deploy \
		--template $(SAM_TEMPLATE) \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--parameter-overrides Environment=dev MockAI=false \
		--resolve-s3 \
		--no-fail-on-empty-changeset

# ── Clean ──────────────────────────────────────────────────────
clean:
	@echo "==> Cleaning..."
	rm -rf $(BINARY_DIR) .aws-sam coverage.out coverage.html $(SAM_LOCAL_TEMPLATE)
	find cmd -name bootstrap -delete
	go clean -testcache

# ── Helpers ────────────────────────────────────────────────────
tidy:
	go mod tidy

fmt:
	gofmt -w .
	goimports -w . 2>/dev/null || true

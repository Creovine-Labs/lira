# Lira AI - Pragmatic Backend Implementation Guide
## Role 2: Backend Engineer & Infrastructure Lead

**Version:** 2.0 (Revised for Reality)  
**Language:** Go 1.21+  
**Timeline:** 20 days with built-in buffers  
**Philosophy:** Working today > Perfect tomorrow

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Development Environment Setup](#development-environment-setup)
5. [Phase 1: Foundation (Days 1-5)](#phase-1-foundation-days-1-5)
6. [Phase 2: Core Integration (Days 6-12)](#phase-2-core-integration-days-6-12)
7. [Phase 3: Optimization (Days 13-17)](#phase-3-optimization-days-13-17)
8. [Phase 4: Production Ready (Days 18-20)](#phase-4-production-ready-days-18-20)
9. [Project Structure](#project-structure)
10. [API Specifications](#api-specifications)
11. [Database Schema](#database-schema)
12. [Testing Strategy](#testing-strategy)
13. [Monitoring & Debugging](#monitoring--debugging)
14. [Risk Mitigation](#risk-mitigation)
15. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Executive Summary
<a id="executive-summary"></a>

### What Changed From Original Plan?

**Original Issues:**
- ❌ Too aggressive timeline (2-day milestones)
- ❌ ECS complexity upfront
- ❌ Missing error handling and retry logic
- ❌ No local development strategy
- ❌ Assumed Nova API formats without validation
- ❌ Security and monitoring at the end
- ❌ No buffer for debugging real-time audio

**New Approach:**
- ✅ Realistic 3-5 day milestones with validation gates
- ✅ Start with Lambda-only (add ECS if needed)
- ✅ Error handling and observability from Day 1
- ✅ Local development with mocks
- ✅ Validate Nova APIs on Day 1
- ✅ Security built-in throughout
- ✅ Multiple buffer days for audio debugging

### Success Criteria

**Week 1:** End-to-end flow working (even if slow)  
**Week 2:** Nova integration complete with acceptable latency  
**Week 3:** Production-ready with monitoring and tests

---

## 🏗️ Architecture Overview
<a id="architecture-overview"></a>

### MVP Architecture (Weeks 1-2)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│         WebSocket Connection + Audio Streaming               │
└─────────────────────────────────────────────────────────────┘
                            ↕ WSS
┌─────────────────────────────────────────────────────────────┐
│              AWS API Gateway (WebSocket API)                 │
│  Routes: $connect | $disconnect | audio | message           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│ Connection Lambda│                  │ Message Lambda   │
│  (Go - connect)  │                  │ (Go - routing)   │
└──────────────────┘                  └──────────────────┘
                                              ↓
                         ┌────────────────────┼────────────────────┐
                         ↓                    ↓                    ↓
                ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
                │ Audio Processor│   │Context Manager │   │Response Generator│
                │ Lambda (Go)    │   │ Lambda (Go)    │   │  Lambda (Go)    │
                └────────────────┘   └────────────────┘   └────────────────┘
                         ↓                    ↓                    ↓
                         └────────────────────┼────────────────────┘
                                              ↓
                              ┌───────────────────────────┐
                              │   Amazon Bedrock (Nova)   │
                              │ - Nova 2 Sonic (STT/TTS)  │
                              │ - Nova 2 Lite (Reasoning) │
                              └───────────────────────────┘
                                              ↓
                ┌─────────────────────────────┴─────────────────────────┐
                ↓                             ↓                         ↓
        ┌──────────────┐            ┌──────────────┐         ┌──────────────┐
        │  DynamoDB    │            │      S3      │         │ CloudWatch   │
        │  (Context)   │            │   (Audio)    │         │   (Logs)     │
        └──────────────┘            └──────────────┘         └──────────────┘
```

**Key Simplifications:**
- ✅ All processing in Lambda (no ECS initially)
- ✅ No ElastiCache until proven necessary
- ✅ Direct Bedrock integration (no intermediate queues)
- ✅ CloudWatch for monitoring from Day 1

### Future Scaling Path (Post-MVP)

When Lambda limits are hit:
1. Move audio processing to ECS/Fargate
2. Add ElastiCache for session state
3. Add SQS for async processing
4. Add CloudFront for audio CDN

---

## 🛠️ Technology Stack
<a id="technology-stack"></a>

### Core Technologies

| Component | Technology | Version | Why? |
|-----------|-----------|---------|------|
| **Language** | Go | 1.21+ | Performance, low latency, single binary |
| **Runtime** | AWS Lambda Custom Runtime | AL2023 | Serverless, auto-scaling |
| **API Gateway** | AWS API Gateway v2 | - | Native WebSocket support |
| **Database** | DynamoDB | - | Serverless, low latency |
| **Storage** | S3 | - | Audio file storage |
| **Monitoring** | CloudWatch + X-Ray | - | AWS native observability |
| **IaC** | AWS SAM | 1.100+ | Simpler than CDK for Lambda |

### Go Dependencies

```go
// go.mod
module github.com/yourteam/lira-ai-backend

go 1.21

require (
    // AWS SDK v2
    github.com/aws/aws-sdk-go-v2 v1.24.0
    github.com/aws/aws-sdk-go-v2/config v1.26.0
    github.com/aws/aws-sdk-go-v2/service/bedrockruntime v1.5.0
    github.com/aws/aws-sdk-go-v2/service/dynamodb v1.26.0
    github.com/aws/aws-sdk-go-v2/service/s3 v1.48.0
    github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue v1.12.0
    
    // Lambda
    github.com/aws/aws-lambda-go v1.42.0
    github.com/awslabs/aws-lambda-go-api-proxy v0.16.0
    
    // WebSocket & HTTP
    github.com/gorilla/websocket v1.5.1
    github.com/gin-gonic/gin v1.9.1
    
    // Utilities
    github.com/google/uuid v1.5.0
    github.com/rs/zerolog v1.31.0
    
    // Testing
    github.com/stretchr/testify v1.8.4
    github.com/golang/mock v1.6.0
)
```

---

## 🚀 Development Environment Setup
<a id="development-environment-setup"></a>

### Prerequisites

```bash
# Required installations
- Go 1.21+ (https://go.dev/dl/)
- AWS CLI v2 (https://aws.amazon.com/cli/)
- AWS SAM CLI (https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Docker Desktop (for local Lambda testing)
- jq (for JSON parsing)
- Git
```

### Day 1 Setup Script

```bash
#!/bin/bash
# setup.sh - Run this on Day 1

set -e

echo "🚀 Lira AI Backend Setup"

# 1. Check prerequisites
echo "📋 Checking prerequisites..."
command -v go >/dev/null 2>&1 || { echo "❌ Go not installed"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not installed"; exit 1; }
command -v sam >/dev/null 2>&1 || { echo "❌ SAM CLI not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }

echo "✅ All prerequisites installed"

# 2. Create project structure
echo "📁 Creating project structure..."
mkdir -p lira-ai-backend/{cmd,internal,pkg,deployments,tests,scripts}
cd lira-ai-backend

# 3. Initialize Go module
echo "🔧 Initializing Go module..."
go mod init github.com/yourteam/lira-ai-backend

# 4. Install dependencies
echo "📦 Installing dependencies..."
cat > go.mod << 'EOF'
module github.com/yourteam/lira-ai-backend

go 1.21

require (
    github.com/aws/aws-sdk-go-v2 v1.24.0
    github.com/aws/aws-sdk-go-v2/config v1.26.0
    github.com/aws/aws-sdk-go-v2/service/bedrockruntime v1.5.0
    github.com/aws/aws-sdk-go-v2/service/dynamodb v1.26.0
    github.com/aws/aws-sdk-go-v2/service/s3 v1.48.0
    github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue v1.12.0
    github.com/aws/aws-lambda-go v1.42.0
    github.com/gorilla/websocket v1.5.1
    github.com/google/uuid v1.5.0
    github.com/rs/zerolog v1.31.0
    github.com/stretchr/testify v1.8.4
)
EOF

go mod tidy

# 5. Configure AWS
echo "☁️  Configuring AWS..."
aws configure list || aws configure

# 6. Validate AWS credentials
echo "🔑 Validating AWS credentials..."
aws sts get-caller-identity

# 7. Check Bedrock access
echo "🧠 Checking Amazon Bedrock access..."
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `nova`)].modelId' || {
    echo "⚠️  Warning: Bedrock access not confirmed. Request access at:"
    echo "   https://console.aws.amazon.com/bedrock"
}

# 8. Create .env file
echo "📝 Creating environment file..."
cat > .env << 'EOF'
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ENVIRONMENT=dev
LOG_LEVEL=debug

# Bedrock
NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v2
NOVA_LITE_MODEL_ID=amazon.nova-lite-v2

# DynamoDB
DYNAMODB_TABLE_NAME=lira-ai-meetings-dev

# S3
S3_AUDIO_BUCKET=lira-ai-audio-dev

# WebSocket
WEBSOCKET_API_ENDPOINT=http://localhost:3001
EOF

source .env

# 9. Create initial SAM template
echo "📄 Creating SAM template..."
cat > deployments/template.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Lira AI Backend - MVP

Globals:
  Function:
    Runtime: provided.al2023
    Architectures:
      - arm64
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        LOG_LEVEL: info

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Resources:
  # DynamoDB Table
  MeetingContextTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub lira-ai-meetings-${Environment}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: session_id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: session_id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  # S3 Bucket for Audio
  AudioStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub lira-ai-audio-${Environment}
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAudio
            Status: Enabled
            ExpirationInDays: 30

  # WebSocket API (will add later)
  # Lambdas (will add as we build)

Outputs:
  TableName:
    Value: !Ref MeetingContextTable
  BucketName:
    Value: !Ref AudioStorageBucket
EOF

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review .env file and update if needed"
echo "2. Run: sam build && sam deploy --guided"
echo "3. Start building Day 1 milestone: Nova API validation"
```

### Local Development Setup

```bash
# Create Makefile for common tasks
cat > Makefile << 'EOF'
.PHONY: build test deploy local clean

build:
	sam build

test:
	go test -v ./...

deploy:
	sam deploy --no-confirm-changeset

local:
	sam local start-api --port 3001

invoke-local:
	sam local invoke ConnectionHandler --event tests/events/connect.json

clean:
	rm -rf .aws-sam/
	go clean

lint:
	golangci-lint run

deps:
	go mod tidy
	go mod download
EOF
```

---

## 📅 Phase 1: Foundation (Days 1-5)
<a id="phase-1-foundation-days-1-5"></a>

### **Milestone 1: Environment Setup & Nova Validation (Days 1-2)**

**Goal:** Validate all AWS services and make first Nova API call

#### Day 1: Project Setup

```bash
# Run setup script
chmod +x setup.sh
./setup.sh

# Deploy initial infrastructure
cd deployments
sam build
sam deploy --guided \
  --stack-name lira-ai-backend-dev \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### Day 2: Nova API Validation

Create a test script to validate Nova access:

```go
// cmd/validate-nova/main.go
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

    // Load AWS config
    cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
    if err != nil {
        log.Fatalf("Failed to load AWS config: %v", err)
    }

    client := bedrockruntime.NewFromConfig(cfg)

    // Test 1: Nova 2 Lite (Text Generation)
    fmt.Println("🧪 Testing Nova 2 Lite...")
    if err := testNovaLite(ctx, client); err != nil {
        log.Printf("❌ Nova Lite failed: %v", err)
    } else {
        fmt.Println("✅ Nova Lite working!")
    }

    // Test 2: Nova 2 Sonic (if supported)
    fmt.Println("\n🧪 Testing Nova 2 Sonic...")
    if err := testNovaSonic(ctx, client); err != nil {
        log.Printf("⚠️  Nova Sonic check failed: %v", err)
        log.Println("   This might not be available yet - will use alternatives")
    } else {
        fmt.Println("✅ Nova Sonic working!")
    }
}

func testNovaLite(ctx context.Context, client *bedrockruntime.Client) error {
    requestBody := map[string]interface{}{
        "messages": []map[string]string{
            {
                "role":    "user",
                "content": "Say 'Nova 2 Lite is working' if you can read this.",
            },
        },
        "inferenceConfig": map[string]interface{}{
            "maxTokens":   50,
            "temperature": 0.7,
        },
    }

    bodyJSON, _ := json.Marshal(requestBody)

    input := &bedrockruntime.InvokeModelInput{
        ModelId:     aws.String("amazon.nova-lite-v2:0"),
        Body:        bodyJSON,
        ContentType: aws.String("application/json"),
    }

    output, err := client.InvokeModel(ctx, input)
    if err != nil {
        return fmt.Errorf("invoke failed: %w", err)
    }

    var response map[string]interface{}
    if err := json.Unmarshal(output.Body, &response); err != nil {
        return fmt.Errorf("unmarshal failed: %w", err)
    }

    fmt.Printf("Response: %+v\n", response)
    return nil
}

func testNovaSonic(ctx context.Context, client *bedrockruntime.Client) error {
    // Note: Adjust based on actual Nova Sonic API when available
    requestBody := map[string]interface{}{
        "text": "Hello, this is a test.",
        "task": "synthesis",
    }

    bodyJSON, _ := json.Marshal(requestBody)

    input := &bedrockruntime.InvokeModelInput{
        ModelId:     aws.String("amazon.nova-sonic-v2:0"),
        Body:        bodyJSON,
        ContentType: aws.String("application/json"),
    }

    _, err := client.InvokeModel(ctx, input)
    return err
}
```

**Run validation:**

```bash
# Test Nova APIs
go run cmd/validate-nova/main.go

# Expected output:
# ✅ Nova Lite working!
# ⚠️ Nova Sonic check failed (might not be released yet)
```

**📊 Checkpoint:** Can make successful Bedrock API calls

---

### **Milestone 2: WebSocket API Echo Server (Days 3-4)**

**Goal:** Working WebSocket that echoes messages back

#### Step 1: Create Connection Handler

```go
// cmd/connection-handler/main.go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "os"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

var (
    dynamoClient *dynamodb.Client
    tableName    string
)

type Connection struct {
    ConnectionID string `dynamodbav:"connection_id"`
    Timestamp    int64  `dynamodbav:"timestamp"`
    UserID       string `dynamodbav:"user_id,omitempty"`
    SessionID    string `dynamodbav:"session_id,omitempty"`
}

func init() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
    log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

    cfg, err := config.LoadDefaultConfig(context.Background())
    if err != nil {
        log.Fatal().Err(err).Msg("Failed to load AWS config")
    }

    dynamoClient = dynamodb.NewFromConfig(cfg)
    tableName = os.Getenv("CONNECTIONS_TABLE")
    if tableName == "" {
        tableName = "lira-ai-connections-dev"
    }
}

func handler(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    log.Info().
        Str("route", event.RequestContext.RouteKey).
        Str("connection_id", event.RequestContext.ConnectionID).
        Msg("WebSocket event received")

    switch event.RequestContext.RouteKey {
    case "$connect":
        return handleConnect(ctx, event)
    case "$disconnect":
        return handleDisconnect(ctx, event)
    case "message":
        return handleMessage(ctx, event)
    default:
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }
}

func handleConnect(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    conn := Connection{
        ConnectionID: event.RequestContext.ConnectionID,
        Timestamp:    event.RequestContext.RequestTimeEpoch,
    }

    // Store connection in DynamoDB
    item, err := attributevalue.MarshalMap(conn)
    if err != nil {
        log.Error().Err(err).Msg("Failed to marshal connection")
        return events.APIGatewayProxyResponse{StatusCode: 500}, err
    }

    _, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(tableName),
        Item:      item,
    })
    if err != nil {
        log.Error().Err(err).Msg("Failed to store connection")
        return events.APIGatewayProxyResponse{StatusCode: 500}, err
    }

    log.Info().Str("connection_id", conn.ConnectionID).Msg("Connection stored")
    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}

func handleDisconnect(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    _, err := dynamoClient.DeleteItem(ctx, &dynamodb.DeleteItemInput{
        TableName: aws.String(tableName),
        Key: map[string]types.AttributeValue{
            "connection_id": &types.AttributeValueMemberS{Value: event.RequestContext.ConnectionID},
        },
    })
    if err != nil {
        log.Error().Err(err).Msg("Failed to delete connection")
    }

    log.Info().Str("connection_id", event.RequestContext.ConnectionID).Msg("Connection removed")
    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}

func handleMessage(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    var msg map[string]interface{}
    if err := json.Unmarshal([]byte(event.Body), &msg); err != nil {
        log.Error().Err(err).Msg("Invalid message format")
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }

    log.Info().Interface("message", msg).Msg("Message received")

    // Echo back for now
    response := map[string]interface{}{
        "type":    "echo",
        "message": fmt.Sprintf("Server received: %v", msg),
    }

    responseJSON, _ := json.Marshal(response)

    // Send back via WebSocket (we'll implement this in the next section)
    log.Info().Str("response", string(responseJSON)).Msg("Echoing message")

    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}

func main() {
    lambda.Start(handler)
}
```

#### Step 2: Update SAM Template

```yaml
# deployments/template.yaml (add to Resources section)

  # Connection Handler Lambda
  ConnectionHandler:
    Type: AWS::Serverless::Function
    Metadata:
      BuildMethod: go1.x
    Properties:
      FunctionName: !Sub lira-ai-connection-handler-${Environment}
      CodeUri: ../cmd/connection-handler/
      Handler: bootstrap
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ConnectionsTable
      Environment:
        Variables:
          CONNECTIONS_TABLE: !Ref ConnectionsTable

  # WebSocket API
  WebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub lira-ai-websocket-${Environment}
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: $request.body.action

  # Connect Route
  ConnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $connect
      AuthorizationType: NONE
      Target: !Sub integrations/${ConnectIntegration}

  ConnectIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ConnectionHandler.Arn}/invocations

  # Disconnect Route
  DisconnectRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: $disconnect
      Target: !Sub integrations/${DisconnectIntegration}

  DisconnectIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ConnectionHandler.Arn}/invocations

  # Message Route
  MessageRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref WebSocketApi
      RouteKey: message
      Target: !Sub integrations/${MessageIntegration}

  MessageIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref WebSocketApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ConnectionHandler.Arn}/invocations

  # Deployment
  WebSocketDeployment:
    Type: AWS::ApiGatewayV2::Deployment
    DependsOn:
      - ConnectRoute
      - DisconnectRoute
      - MessageRoute
    Properties:
      ApiId: !Ref WebSocketApi

  WebSocketStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref WebSocketApi
      DeploymentId: !Ref WebSocketDeployment
      StageName: !Ref Environment

  # Lambda permissions
  ConnectionHandlerPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ConnectionHandler
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WebSocketApi}/*

  # Connections Table
  ConnectionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub lira-ai-connections-${Environment}
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

Outputs:
  WebSocketURL:
    Description: WebSocket API endpoint
    Value: !Sub wss://${WebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}
```

#### Step 3: Build and Deploy

```bash
# Build Go binary for Lambda
cd cmd/connection-handler
GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap main.go
cd ../..

# Use SAM to build and deploy
sam build
sam deploy

# Get WebSocket URL
aws cloudformation describe-stacks \
  --stack-name lira-ai-backend-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketURL`].OutputValue' \
  --output text
```

#### Step 4: Test WebSocket

```bash
# Install wscat for testing
npm install -g wscat

# Connect to WebSocket
WEBSOCKET_URL=$(aws cloudformation describe-stacks --stack lira-ai-backend-dev --query 'Stacks[0].Outputs[?OutputKey==`WebSocketURL`].OutputValue' --output text)

wscat -c "$WEBSOCKET_URL"

# Send test message
> {"action": "message", "data": "Hello Lira!"}

# Expected response:
< {"type":"echo","message":"Server received: map[action:message data:Hello Lira!]"}
```

**📊 Checkpoint:** WebSocket echo server working

---

### **Milestone 3: DynamoDB Context Storage (Day 5)**

**Goal:** Store and retrieve conversation context

#### Create Context Manager

```go
// internal/context/manager.go
package context

import (
    "context"
    "fmt"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
    "github.com/google/uuid"
)

type Manager struct {
    client    *dynamodb.Client
    tableName string
}

type Message struct {
    Speaker   string    `json:"speaker" dynamodbav:"speaker"`
    Text      string    `json:"text" dynamodbav:"text"`
    Timestamp time.Time `json:"timestamp" dynamodbav:"timestamp"`
    Sentiment string    `json:"sentiment,omitempty" dynamodbav:"sentiment,omitempty"`
}

type MeetingContext struct {
    SessionID string    `json:"session_id" dynamodbav:"session_id"`
    Timestamp int64     `json:"timestamp" dynamodbav:"timestamp"`
    Messages  []Message `json:"messages" dynamodbav:"messages"`
    CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"`
    UpdatedAt time.Time `json:"updated_at" dynamodbav:"updated_at"`
}

func NewManager(client *dynamodb.Client, tableName string) *Manager {
    return &Manager{
        client:    client,
        tableName: tableName,
    }
}

func (m *Manager) CreateSession(ctx context.Context) (*MeetingContext, error) {
    sessionID := uuid.New().String()
    now := time.Now()

    meetingCtx := &MeetingContext{
        SessionID: sessionID,
        Timestamp: now.Unix(),
        Messages:  []Message{},
        CreatedAt: now,
        UpdatedAt: now,
    }

    item, err := attributevalue.MarshalMap(meetingCtx)
    if err != nil {
        return nil, fmt.Errorf("marshal failed: %w", err)
    }

    _, err = m.client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(m.tableName),
        Item:      item,
    })
    if err != nil {
        return nil, fmt.Errorf("put item failed: %w", err)
    }

    return meetingCtx, nil
}

func (m *Manager) AddMessage(ctx context.Context, sessionID string, message Message) error {
    message.Timestamp = time.Now()

    // Get existing context
    meetingCtx, err := m.GetContext(ctx, sessionID)
    if err != nil {
        return fmt.Errorf("get context failed: %w", err)
    }

    // Append message
    meetingCtx.Messages = append(meetingCtx.Messages, message)
    meetingCtx.UpdatedAt = time.Now()

    // Keep only last 50 messages
    if len(meetingCtx.Messages) > 50 {
        meetingCtx.Messages = meetingCtx.Messages[len(meetingCtx.Messages)-50:]
    }

    // Update DynamoDB
    item, err := attributevalue.MarshalMap(meetingCtx)
    if err != nil {
        return fmt.Errorf("marshal failed: %w", err)
    }

    _, err = m.client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(m.tableName),
        Item:      item,
    })
    if err != nil {
        return fmt.Errorf("update failed: %w", err)
    }

    return nil
}

func (m *Manager) GetContext(ctx context.Context, sessionID string) (*MeetingContext, error) {
    result, err := m.client.Query(ctx, &dynamodb.QueryInput{
        TableName:              aws.String(m.tableName),
        KeyConditionExpression: aws.String("session_id = :sid"),
        ExpressionAttributeValues: map[string]types.AttributeValue{
            ":sid": &types.AttributeValueMemberS{Value: sessionID},
        },
        ScanIndexForward: aws.Bool(false), // Get latest first
        Limit:            aws.Int32(1),
    })
    if err != nil {
        return nil, fmt.Errorf("query failed: %w", err)
    }

    if len(result.Items) == 0 {
        return nil, fmt.Errorf("session not found: %s", sessionID)
    }

    var meetingCtx MeetingContext
    err = attributevalue.UnmarshalMap(result.Items[0], &meetingCtx)
    if err != nil {
        return nil, fmt.Errorf("unmarshal failed: %w", err)
    }

    return &meetingCtx, nil
}

func (m *Manager) ShouldAIRespond(ctx *MeetingContext, utterance Message) bool {
    text := strings.ToLower(utterance.Text)

    // Wake word detection
    wakeWords := []string{"hey lira", "lira", "what do you think"}
    for _, word := range wakeWords {
        if strings.Contains(text, word) {
            return true
        }
    }

    // Question detection
    if strings.HasSuffix(text, "?") && len(ctx.Messages) > 3 {
        return true
    }

    return false
}
```

**Write tests:**

```go
// internal/context/manager_test.go
package context

import (
    "context"
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestCreateSession(t *testing.T) {
    // Mock DynamoDB or use testcontainers
    // For now, skip if no AWS credentials
    if testing.Short() {
        t.Skip("Skipping integration test")
    }

    // Test implementation
}

func TestShouldAIRespond(t *testing.T) {
    tests := []struct {
        name     string
        text     string
        expected bool
    }{
        {"wake word", "Hey Lira, what's up?", true},
        {"question", "Should we do this?", true},
        {"statement", "I think we should proceed.", false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            ctx := &MeetingContext{Messages: make([]Message, 5)}
            msg := Message{Text: tt.text}
            manager := &Manager{}
            
            result := manager.ShouldAIRespond(ctx, msg)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

**📊 Checkpoint:** Can store and retrieve meeting context

---

## 📅 Phase 2: Core Integration (Days 6-12)
<a id="phase-2-core-integration-days-6-12"></a>

### **Milestone 4: Nova 2 Lite Response Generation (Days 6-8)**

**Goal:** AI can generate intelligent text responses

#### Create AI Response Generator

```go
// internal/ai/generator.go
package ai

import (
    "context"
    "encoding/json"
    "fmt"
    "strings"
    "math/rand"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
    "github.com/yourteam/lira-ai-backend/internal/context"
)

type Generator struct {
    client         *bedrockruntime.Client
    novaLiteModel  string
    novaSonicModel string
}

type AIResponse struct {
    Text      string `json:"text"`
    Reasoning string `json:"reasoning,omitempty"`
}

func NewGenerator(client *bedrockruntime.Client) *Generator {
    return &Generator{
        client:         client,
        novaLiteModel:  "amazon.nova-lite-v2:0",
        novaSonicModel: "amazon.nova-sonic-v2:0",
    }
}

func (g *Generator) GenerateResponse(ctx context.Context, meetingCtx *context.MeetingContext, personality string) (*AIResponse, error) {
    // Build conversation history
    messages := g.buildMessages(meetingCtx, personality)

    // Call Nova 2 Lite
    requestBody := map[string]interface{}{
        "messages": messages,
        "inferenceConfig": map[string]interface{}{
            "temperature": 0.7,
            "maxTokens":   200,
            "topP":        0.9,
        },
    }

    bodyJSON, err := json.Marshal(requestBody)
    if err != nil {
        return nil, fmt.Errorf("marshal request: %w", err)
    }

    input := &bedrockruntime.InvokeModelInput{
        ModelId:     aws.String(g.novaLiteModel),
        Body:        bodyJSON,
        ContentType: aws.String("application/json"),
    }

    output, err := g.client.InvokeModel(ctx, input)
    if err != nil {
        return nil, fmt.Errorf("invoke model: %w", err)
    }

    // Parse response
    var response map[string]interface{}
    if err := json.Unmarshal(output.Body, &response); err != nil {
        return nil, fmt.Errorf("unmarshal response: %w", err)
    }

    // Extract text (adjust based on actual Nova Lite response format)
    aiText := g.extractText(response)

    // Add human-like elements
    naturalText := g.addFillerWords(aiText)

    return &AIResponse{
        Text:      naturalText,
        Reasoning: fmt.Sprintf("%v", response),
    }, nil
}

func (g *Generator) buildMessages(meetingCtx *context.MeetingContext, personality string) []map[string]string {
    messages := []map[string]string{
        {
            "role":    "system",
            "content": g.getSystemPrompt(personality),
        },
    }

    // Add recent conversation (last 20 messages)
    startIdx := 0
    if len(meetingCtx.Messages) > 20 {
        startIdx = len(meetingCtx.Messages) - 20
    }

    for _, msg := range meetingCtx.Messages[startIdx:] {
        role := "user"
        if msg.Speaker == "lira" {
            role = "assistant"
        }
        messages = append(messages, map[string]string{
            "role":    role,
            "content": fmt.Sprintf("%s: %s", msg.Speaker, msg.Text),
        })
    }

    return messages
}

func (g *Generator) getSystemPrompt(personality string) string {
    basePrompt := `You are Lira, an AI meeting participant. You:
- Speak naturally with occasional filler words (um, well, you know)
- Keep responses under 30 seconds of speech (~60 words)
- Challenge bad ideas constructively
- Build on good ideas with specific suggestions
- Ask clarifying questions when needed
- Reference previous conversation points
- Show personality and emotion

Important: Respond as if you're speaking aloud in a meeting.`

    personalities := map[string]string{
        "supportive": "\n- Be encouraging and find positives in ideas.",
        "critical":   "\n- Be a devil's advocate and find potential issues.",
        "technical":  "\n- Focus on implementation details and feasibility.",
        "business":   "\n- Focus on ROI, market fit, and business value.",
    }

    if addon, ok := personalities[personality]; ok {
        return basePrompt + addon
    }
    return basePrompt
}

func (g *Generator) extractText(response map[string]interface{}) string {
    // Adjust based on actual Nova Lite response structure
    // This is a placeholder
    if output, ok := response["output"].(map[string]interface{}); ok {
        if message, ok := output["message"].(map[string]interface{}); ok {
            if content, ok := message["content"].([]interface{}); ok && len(content) > 0 {
                if textObj, ok := content[0].(map[string]interface{}); ok {
                    if text, ok := textObj["text"].(string); ok {
                        return text
                    }
                }
            }
        }
    }
    return "I'm having trouble formulating a response right now."
}

func (g *Generator) addFillerWords(text string) string {
    words := strings.Fields(text)
    fillers := []string{"um", "uh", "well", "you know", "I think", "sort of", "actually"}

    var enhanced []string
    for i, word := range words {
        // Add filler at natural pause points (every 8-12 words)
        if i > 0 && i%10 == 0 && rand.Float64() < 0.3 {
            enhanced = append(enhanced, fillers[rand.Intn(len(fillers))])
        }
        enhanced = append(enhanced, word)
    }

    return strings.Join(enhanced, " ")
}
```

#### Create Lambda Function

```go
// cmd/response-generator/main.go
package main

import (
    "context"
    "encoding/json"
    "os"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/rs/zerolog/log"
    "github.com/yourteam/lira-ai-backend/internal/ai"
    "github.com/yourteam/lira-ai-backend/internal/context"
)

var (
    aiGenerator    *ai.Generator
    contextManager *context.Manager
)

type RequestPayload struct {
    SessionID   string `json:"session_id"`
    Personality string `json:"personality"`
}

func init() {
    cfg, err := config.LoadDefaultConfig(context.Background())
    if err != nil {
        log.Fatal().Err(err).Msg("Failed to load config")
    }

    bedrockClient := bedrockruntime.NewFromConfig(cfg)
    dynamoClient := dynamodb.NewFromConfig(cfg)

    aiGenerator = ai.NewGenerator(bedrockClient)
    contextManager = context.NewManager(dynamoClient, os.Getenv("DYNAMODB_TABLE"))
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    var payload RequestPayload
    if err := json.Unmarshal([]byte(event.Body), &payload); err != nil {
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }

    // Get meeting context
    meetingCtx, err := contextManager.GetContext(ctx, payload.SessionID)
    if err != nil {
        log.Error().Err(err).Msg("Failed to get context")
        return events.APIGatewayProxyResponse{StatusCode: 500}, nil
    }

    // Generate AI response
    response, err := aiGenerator.GenerateResponse(ctx, meetingCtx, payload.Personality)
    if err != nil {
        log.Error().Err(err).Msg("Failed to generate response")
        return events.APIGatewayProxyResponse{StatusCode: 500}, nil
    }

    // Store AI response in context
    aiMessage := context.Message{
        Speaker: "lira",
        Text:    response.Text,
    }
    if err := contextManager.AddMessage(ctx, payload.SessionID, aiMessage); err != nil {
        log.Error().Err(err).Msg("Failed to store AI message")
    }

    responseJSON, _ := json.Marshal(response)
    return events.APIGatewayProxyResponse{
        StatusCode: 200,
        Body:       string(responseJSON),
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
    }, nil
}

func main() {
    lambda.Start(handler)
}
```

**Test locally:**

```bash
# Create test event
cat > tests/events/generate-response.json << 'EOF'
{
  "body": "{\"session_id\":\"test-123\",\"personality\":\"supportive\"}"
}
EOF

# Invoke locally
sam local invoke ResponseGenerator --event tests/events/generate-response.json
```

**📊 Checkpoint:** AI generates text responses using Nova 2 Lite

---

### **Milestone 5: Audio Processing Pipeline (Days 9-12)**

**Goal:** Handle audio streaming and transcription

#### Audio Buffer Manager

```go
// internal/audio/buffer.go
package audio

import (
    "sync"
    "time"
)

type AudioChunk struct {
    Data      []byte
    Timestamp time.Time
    SessionID string
}

type BufferManager struct {
    mu      sync.RWMutex
    buffers map[string][]AudioChunk
    maxAge  time.Duration
}

func NewBufferManager(maxAge time.Duration) *BufferManager {
    bm := &BufferManager{
        buffers: make(map[string][]AudioChunk),
        maxAge:  maxAge,
    }
    
    // Start cleanup goroutine
    go bm.cleanup()
    
    return bm
}

func (bm *BufferManager) AddChunk(sessionID string, data []byte) {
    bm.mu.Lock()
    defer bm.mu.Unlock()

    chunk := AudioChunk{
        Data:      data,
        Timestamp: time.Now(),
        SessionID: sessionID,
    }

    bm.buffers[sessionID] = append(bm.buffers[sessionID], chunk)

    // Keep only last 5 seconds of audio (assuming 20ms chunks)
    if len(bm.buffers[sessionID]) > 250 {
        bm.buffers[sessionID] = bm.buffers[sessionID][len(bm.buffers[sessionID])-250:]
    }
}

func (bm *BufferManager) GetBuffer(sessionID string) []AudioChunk {
    bm.mu.RLock()
    defer bm.mu.RUnlock()

    if chunks, exists := bm.buffers[sessionID]; exists {
        // Return copy
        result := make([]AudioChunk, len(chunks))
        copy(result, chunks)
        return result
    }
    return nil
}

func (bm *BufferManager) ClearBuffer(sessionID string) {
    bm.mu.Lock()
    defer bm.mu.Unlock()
    delete(bm.buffers, sessionID)
}

func (bm *BufferManager) cleanup() {
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()

    for range ticker.C {
        bm.mu.Lock()
        now := time.Now()
        for sessionID, chunks := range bm.buffers {
            if len(chunks) == 0 {
                continue
            }
            // Remove sessions with no activity for maxAge
            lastChunk := chunks[len(chunks)-1]
            if now.Sub(lastChunk.Timestamp) > bm.maxAge {
                delete(bm.buffers, sessionID)
            }
        }
        bm.mu.Unlock()
    }
}
```

#### Voice Activity Detection (Simplified)

```go
// internal/audio/vad.go
package audio

import (
    "math"
)

type VoiceActivityDetector struct {
    threshold float64
}

func NewVAD(threshold float64) *VoiceActivityDetector {
    return &VoiceActivityDetector{
        threshold: threshold,
    }
}

func (vad *VoiceActivityDetector) IsSpeechActive(audioData []byte) bool {
    // Simple energy-based VAD
    // Convert bytes to samples (assuming 16-bit PCM)
    var energy float64
    for i := 0; i < len(audioData)-1; i += 2 {
        sample := int16(audioData[i]) | int16(audioData[i+1])<<8
        energy += float64(sample * sample)
    }
    
    rms := math.Sqrt(energy / float64(len(audioData)/2))
    return rms > vad.threshold
}
```

#### Audio Processor Lambda

```go
// cmd/audio-processor/main.go
package main

import (
    "context"
    "encoding/base64"
    "encoding/json"
    "os"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
    "github.com/rs/zerolog/log"
    "github.com/yourteam/lira-ai-backend/internal/audio"
    "github.com/yourteam/lira-ai-backend/internal/context"
)

var (
    bufferManager  *audio.BufferManager
    vad            *audio.VoiceActivityDetector
    bedrockClient  *bedrockruntime.Client
    contextManager *context.Manager
)

type AudioPayload struct {
    SessionID string `json:"session_id"`
    AudioData string `json:"audio_data"` // base64 encoded
}

func init() {
    bufferManager = audio.NewBufferManager(5 * time.Minute)
    vad = audio.NewVAD(500.0) // Threshold for speech detection

    cfg, err := config.LoadDefaultConfig(context.Background())
    if err != nil {
        log.Fatal().Err(err).Msg("Failed to load config")
    }

    bedrockClient = bedrockruntime.NewFromConfig(cfg)
    // Initialize context manager...
}

func handler(ctx context.Context, event events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    var payload AudioPayload
    if err := json.Unmarshal([]byte(event.Body), &payload); err != nil {
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }

    // Decode audio data
    audioData, err := base64.StdEncoding.DecodeString(payload.AudioData)
    if err != nil {
        log.Error().Err(err).Msg("Failed to decode audio")
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }

    // Add to buffer
    bufferManager.AddChunk(payload.SessionID, audioData)

    // Check for speech activity
    if vad.IsSpeechActive(audioData) {
        // Transcribe (will implement with Nova Sonic)
        transcript, err := transcribeAudio(ctx, audioData)
        if err != nil {
            log.Error().Err(err).Msg("Transcription failed")
            return events.APIGatewayProxyResponse{StatusCode: 500}, nil
        }

        // Add to context
        message := context.Message{
            Speaker: "participant",
            Text:    transcript,
        }
        if err := contextManager.AddMessage(ctx, payload.SessionID, message); err != nil {
            log.Error().Err(err).Msg("Failed to add message")
        }

        log.Info().
            Str("session_id", payload.SessionID).
            Str("transcript", transcript).
            Msg("Audio transcribed")
    }

    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}

func transcribeAudio(ctx context.Context, audioData []byte) (string, error) {
    // TODO: Implement Nova 2 Sonic transcription
    // For now, return placeholder
    return "[Transcription pending Nova Sonic setup]", nil
}

func main() {
    lambda.Start(handler)
}
```

**📊 Checkpoint:** Audio pipeline receives and buffers audio

---

## 📅 Phase 3: Optimization (Days 13-17)
<a id="phase-3-optimization-days-13-17"></a>

### **Milestone 6: End-to-End Integration (Days 13-14)**

**Goal:** Connect all components for complete flow

#### Update WebSocket Handler to Route

```go
// Update cmd/connection-handler/main.go handleMessage function

func handleMessage(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    var msg map[string]interface{}
    if err := json.Unmarshal([]byte(event.Body), &msg); err != nil {
        log.Error().Err(err).Msg("Invalid message format")
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }

    messageType, ok := msg["type"].(string)
    if !ok {
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }

    switch messageType {
    case "audio":
        return handleAudioMessage(ctx, event, msg)
    case "trigger_ai":
        return handleAITrigger(ctx, event, msg)
    default:
        log.Warn().Str("type", messageType).Msg("Unknown message type")
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }
}

func handleAudioMessage(ctx context.Context, event events.APIGatewayWebsocketProxyRequest, msg map[string]interface{}) (events.APIGatewayProxyResponse, error) {
    // Forward to audio processor Lambda
    // Implementation depends on invocation pattern
    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}

func handleAITrigger(ctx context.Context, event events.APIGatewayWebsocketProxyRequest, msg map[string]interface{}) (events.APIGatewayProxyResponse, error) {
    // Trigger AI response generation
    // Send response back via WebSocket
    return events.APIGatewayProxyResponse{StatusCode: 200}, nil
}
```

### **Milestone 7: Latency Optimization (Days 15-16)**

**Performance targets:**
- Audio capture → transcription: < 500ms
- Transcription → AI thinking: < 1000ms
- AI response → speech synthesis: < 800ms
- **Total: < 2.3 seconds**

#### Optimizations:

1. **Stream responses instead of waiting for complete generation**
2. **Use Lambda SnapStart** (Java only, but Go has fast cold starts)
3. **Increase Lambda memory** (more CPU allocated)
4. **Parallel processing** where possible
5. **Connection pooling** for AWS SDK clients

```go
// internal/ai/generator.go - Add streaming support

func (g *Generator) GenerateResponseStream(ctx context.Context, meetingCtx *context.MeetingContext, personality string) (<-chan string, error) {
    responseChan := make(chan string)

    go func() {
        defer close(responseChan)

        // Use InvokeModelWithResponseStream for streaming
        input := &bedrockruntime.InvokeModelWithResponseStreamInput{
            ModelId: aws.String(g.novaLiteModel),
            Body:    buildRequestBody(),
        }

        output, err := g.client.InvokeModelWithResponseStream(ctx, input)
        if err != nil {
            log.Error().Err(err).Msg("Streaming failed")
            return
        }

        stream := output.GetStream()
        for event := range stream.Events() {
            if chunk, ok := event.(*types.ResponseStreamMemberChunk); ok {
                // Parse and send chunks as they arrive
                text := parseChunk(chunk.Value.Bytes)
                responseChan <- text
            }
        }
    }()

    return responseChan, nil
}
```

**📊 Checkpoint:** End-to-end flow working with acceptable latency

---

### **Milestone 8: Error Handling & Resilience (Day 17)**

**Add retry logic, circuit breakers, and graceful degradation**

```go
// pkg/retry/retry.go
package retry

import (
    "context"
    "fmt"
    "time"
)

type Backoff struct {
    InitialDelay time.Duration
    MaxDelay     time.Duration
    MaxRetries   int
}

func (b *Backoff) Retry(ctx context.Context, fn func() error) error {
    delay := b.InitialDelay

    for attempt := 0; attempt <= b.MaxRetries; attempt++ {
        if err := fn(); err == nil {
            return nil
        } else if attempt == b.MaxRetries {
            return fmt.Errorf("max retries exceeded: %w", err)
        }

        select {
        case <-time.After(delay):
            delay *= 2
            if delay > b.MaxDelay {
                delay = b.MaxDelay
            }
        case <-ctx.Done():
            return ctx.Err()
        }
    }

    return nil
}
```

**Use in Bedrock calls:**

```go
backoff := &retry.Backoff{
    InitialDelay: 100 * time.Millisecond,
    MaxDelay:     5 * time.Second,
    MaxRetries:   3,
}

var response *AIResponse
err := backoff.Retry(ctx, func() error {
    var err error
    response, err = g.GenerateResponse(ctx, meetingCtx, personality)
    return err
})
```

**📊 Checkpoint:** Robust error handling implemented

---

## 📅 Phase 4: Production Ready (Days 18-20)
<a id="phase-4-production-ready-days-18-20"></a>

### **Milestone 9: Monitoring & Observability (Day 18)**

#### CloudWatch Metrics

```go
// pkg/metrics/cloudwatch.go
package metrics

import (
    "context"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/cloudwatch"
    "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
)

type CloudWatchMetrics struct {
    client    *cloudwatch.Client
    namespace string
}

func NewCloudWatchMetrics(client *cloudwatch.Client, namespace string) *CloudWatchMetrics {
    return &CloudWatchMetrics{
        client:    client,
        namespace: namespace,
    }
}

func (m *CloudWatchMetrics) RecordLatency(ctx context.Context, operation string, duration time.Duration) error {
    _, err := m.client.PutMetricData(ctx, &cloudwatch.PutMetricDataInput{
        Namespace: aws.String(m.namespace),
        MetricData: []types.MetricDatum{
            {
                MetricName: aws.String("Latency"),
                Value:      aws.Float64(float64(duration.Milliseconds())),
                Unit:       types.StandardUnitMilliseconds,
                Timestamp:  aws.Time(time.Now()),
                Dimensions: []types.Dimension{
                    {
                        Name:  aws.String("Operation"),
                        Value: aws.String(operation),
                    },
                },
            },
        },
    })
    return err
}

func (m *CloudWatchMetrics) RecordError(ctx context.Context, errorType string) error {
    _, err := m.client.PutMetricData(ctx, &cloudwatch.PutMetricDataInput{
        Namespace: aws.String(m.namespace),
        MetricData: []types.MetricDatum{
            {
                MetricName: aws.String("Errors"),
                Value:      aws.Float64(1),
                Unit:       types.StandardUnitCount,
                Timestamp:  aws.Time(time.Now()),
                Dimensions: []types.Dimension{
                    {
                        Name:  aws.String("ErrorType"),
                        Value: aws.String(errorType),
                    },
                },
            },
        },
    })
    return err
}
```

#### Structured Logging

```go
// Use throughout codebase
log.Info().
    Str("session_id", sessionID).
    Str("operation", "transcribe").
    Dur("latency_ms", duration).
    Int("audio_size_bytes", len(audioData)).
    Msg("Audio transcribed successfully")
```

#### CloudWatch Dashboard (via SAM)

```yaml
# Add to template.yaml
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub lira-ai-${Environment}
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["LiraAI", "Latency", {"stat": "Average"}],
                  [".", ".", {"stat": "p99"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Response Latency"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                  [".", "Errors", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Lambda Metrics"
              }
            }
          ]
        }
```

**📊 Checkpoint:** Full observability in place

---

### **Milestone 10: Testing & Documentation (Days 19-20)**

#### Integration Tests

```bash
# tests/integration/websocket_test.go
package integration

import (
    "testing"
    "github.com/gorilla/websocket"
)

func TestWebSocketConnection(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test")
    }

    wsURL := os.Getenv("WEBSOCKET_URL")
    conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
    if err != nil {
        t.Fatalf("Failed to connect: %v", err)
    }
    defer conn.Close()

    // Test message flow
    testMsg := map[string]interface{}{
        "action": "message",
        "type":   "test",
        "data":   "Hello",
    }

    if err := conn.WriteJSON(testMsg); err != nil {
        t.Fatalf("Failed to send message: %v", err)
    }

    var response map[string]interface{}
    if err := conn.ReadJSON(&response); err != nil {
        t.Fatalf("Failed to read response: %v", err)
    }

    t.Logf("Response: %+v", response)
}
```

#### Load Testing

```bash
# scripts/load-test.sh
#!/bin/bash

echo "🔥 Running load test..."

# Use artillery or k6 for load testing
cat > load-test.yaml << 'EOF'
config:
  target: 'wss://your-api.execute-api.us-east-1.amazonaws.com/dev'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
  
scenarios:
  - name: "WebSocket conversation"
    engine: ws
    flow:
      - connect:
          url: "{{ target }}"
      - send:
          payload: '{"action":"message","type":"audio","data":"SGVsbG8="}'
      - think: 2
      - send:
          payload: '{"action":"trigger_ai","session_id":"test"}'
      - think: 3
EOF

artillery run load-test.yaml
```

#### API Documentation

```markdown
# API Documentation

## WebSocket API

### Connection
wss://api.lira-ai.com/dev

### Routes

#### $connect
Establish WebSocket connection

**Response:**
```json
{
  "status": "connected",
  "connection_id": "abc123"
}
```

#### message
Send audio or trigger AI

**Audio Message:**
```json
{
  "action": "message",
  "type": "audio",
  "session_id": "session-123",
  "audio_data": "base64-encoded-audio"
}
```

**AI Trigger:**
```json
{
  "action": "message",
  "type": "trigger_ai",
  "session_id": "session-123",
  "personality": "supportive"
}
```

**Response:**
```json
{
  "type": "ai_response",
  "text": "Well, I think that's a great idea...",
  "audio_data": "base64-encoded-audio"
}
```
```

**📊 Final Checkpoint:** Production-ready backend with tests and documentation

---

## 📁 Project Structure
<a id="project-structure"></a>

```
lira-ai-backend/
├── cmd/
│   ├── connection-handler/       # WebSocket connection Lambda
│   │   ├── main.go
│   │   └── bootstrap
│   ├── audio-processor/          # Audio processing Lambda
│   │   ├── main.go
│   │   └── bootstrap
│   ├── response-generator/       # AI response Lambda
│   │   ├── main.go
│   │   └── bootstrap
│   └── validate-nova/            # Validation script
│       └── main.go
├── internal/
│   ├── ai/
│   │   ├── generator.go          # AI response generation
│   │   └── generator_test.go
│   ├── audio/
│   │   ├── buffer.go             # Audio buffering
│   │   ├── vad.go                # Voice activity detection
│   │   └── processor.go
│   ├── context/
│   │   ├── manager.go            # Context management
│   │   └── manager_test.go
│   └── models/
│       └── types.go              # Shared types
├── pkg/
│   ├── retry/
│   │   └── retry.go              # Retry logic
│   └── metrics/
│       └── cloudwatch.go         # Metrics
├── deployments/
│   ├── template.yaml             # SAM template
│   ├── parameters.json           # Parameters
│   └── buildspec.yml             # CI/CD build spec
├── tests/
│   ├── integration/
│   │   └── websocket_test.go
│   ├── unit/
│   │   └── context_test.go
│   └── events/
│       ├── connect.json
│       └── audio. json
├── scripts/
│   ├── setup.sh                  # Initial setup
│   ├── deploy.sh                 # Deployment script
│   └── load-test.sh              # Load testing
├── docs/
│   ├── API.md                    # API documentation
│   ├── ARCHITECTURE.md           # Architecture details
│   └── RUNBOOK.md                # Operations guide
├── go.mod
├── go.sum
├── Makefile
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Specifications
<a id="api-specifications"></a>

### WebSocket Messages

#### Client → Server

```typescript
// Audio Stream
{
  "action": "message",
  "type": "audio",
  "session_id": string,
  "audio_data": string (base64),
  "format": "opus" | "pcm",
  "sample_rate": number
}

// Trigger AI Response
{
  "action": "message",
  "type": "trigger_ai",
  "session_id": string,
  "personality": "supportive" | "critical" | "technical" | "business"
}

// Text Message (for testing)
{
  "action": "message",
  "type": "text",
  "session_id": string,
  "speaker": string,
  "text": string
}
```

#### Server → Client

```typescript
// Transcription Result
{
  "type": "transcription",
  "session_id": string,
  "speaker": string,
  "text": string,
  "confidence": number
}

// AI Response (streaming)
{
  "type": "ai_response_chunk",
  "session_id": string,
  "text_chunk": string,
  "is_final": boolean
}

// AI Audio Response
{
  "type": "ai_audio",
  "session_id": string,
  "audio_data": string (base64),
  "format": "opus",
  "duration_ms": number
}

// Error
{
  "type": "error",
  "code": string,
  "message": string
}
```

---

## 🗄️ Database Schema
<a id="database-schema"></a>

### DynamoDB Tables

#### MeetingContextTable

```
Partition Key: session_id (String)
Sort Key: timestamp (Number)

Attributes:
{
  "session_id": "uuid",
  "timestamp": 1234567890,
  "messages": [
    {
      "speaker": "user1",
      "text": "Should we add dark mode?",
      "timestamp": "2026-02-23T10:30:00Z",
      "sentiment": "neutral"
    }
  ],
  "created_at": "2026-02-23T10:00:00Z",
  "updated_at": "2026-02-23T10:30:00Z",
  "ttl": 1234567890  // Auto-delete after 30 days
}
```

#### ConnectionsTable

```
Partition Key: connection_id (String)

Attributes:
{
  "connection_id": "abc123",
  "timestamp": 1234567890,
  "user_id": "user-uuid",
  "session_id": "session-uuid",
  "ttl": 1234567890  // Auto-delete after disconnect
}
```

---

## 🧪 Testing Strategy
<a id="testing-strategy"></a>

### Unit Tests

```bash
# Run all unit tests
go test -v ./...

# Run with coverage
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run specific package
go test -v ./internal/ai/...
```

### Integration Tests

```bash
# Set environment variables
export WEBSOCKET_URL="wss://your-api.execute-api.us-east-1.amazonaws.com/dev"
export AWS_REGION="us-east-1"

# Run integration tests
go test -v ./tests/integration/...
```

### Load Tests

```bash
# Install artillery
npm install -g artillery

# Run load test
./scripts/load-test.sh

# Expected: 
# - < 2.5s p95 latency
# - < 1% error rate
# - Handle 50 concurrent connections
```

---

## 📊 Monitoring & Debugging
<a id="monitoring--debugging"></a>

### CloudWatch Logs

```bash
# Tail logs for a Lambda function
aws logs tail /aws/lambda/lira-ai-connection-handler-dev --follow

# Query logs with Insights
aws logs start-query \
  --log-group-name /aws/lambda/lira-ai-connection-handler-dev \
  --start-time $(date -u -d '5 minutes ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20'
```

### X-Ray Tracing

Enable in SAM template:

```yaml
Globals:
  Function:
    Tracing: Active

Resources:
  ConnectionHandler:
    Properties:
      Tracing: Active
```

View traces:

```bash
# Get trace summaries
aws xray get-trace-summaries --start-time $(date -u -d '1 hour ago' +%s) --end-time $(date -u +%s)
```

### Custom Metrics

```bash
# View custom metrics
aws cloudwatch get-metric-statistics \
  --namespace LiraAI \
  --metric-name Latency \
  --dimensions Name=Operation,Value=transcribe \
  --statistics Average,Maximum,Minimum \
  --start-time $(date -u -d '1 hour ago' --iso-8601) \
  --end-time $(date -u --iso-8601) \
  --period 300
```

---

## ⚠️ Risk Mitigation
<a id="risk-mitigation"></a>

### Critical Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Nova API quota exceeded | High | High | Request limit increase early, implement caching, rate limiting | Backend Lead |
| High latency (>3s) | Medium | High | Stream responses, optimize Lambda config, profile bottlenecks | Backend Lead |
| WebSocket disconnects | Medium | Medium | Implement reconnection logic, store partial state in DynamoDB | Backend Lead |
| DynamoDB throttling | Low | Medium | Use on-demand billing, implement exponential backoff | Backend Lead |
| Lambda cold starts | Medium | Low | Pre-warm functions, use Provisioned Concurrency if needed | Backend Lead |
| No Nova Sonic access | High | High | **Fallback:** Use AWS Transcribe + Polly temporarily | Backend Lead |

### Fallback Strategy (If Nova Sonic Not Available)

```go
// internal/fallback/transcribe.go
package fallback

import (
    "context"
    "github.com/aws/aws-sdk-go-v2/service/transcribe"
    "github.com/aws/aws-sdk-go-v2/service/polly"
)

// Use AWS Transcribe for STT
func TranscribeWithAWSTranscribe(ctx context.Context, audioData []byte) (string, error) {
    // Implementation using Transcribe streaming
}

// Use AWS Polly for TTS
func SynthesizeWithPolly(ctx context.Context, text string) ([]byte, error) {
    // Implementation using Polly
}
```

---

## ✅ Deployment Checklist
<a id="deployment-checklist"></a>

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Load tests meet thresholds
- [ ] Security scan completed (AWS Inspector)
- [ ] IAM roles follow least privilege
- [ ] Environment variables configured
- [ ] Secrets stored in Secrets Manager (not .env)
- [ ] Cost estimates reviewed
- [ ] Monitoring dashboards created
- [ ] Alarms configured

### Deployment

```bash
# 1. Lint and test
make lint
make test

# 2. Build
sam build

# 3. Validate template
sam validate

# 4. Deploy to dev
sam deploy \
  --stack-name lira-ai-backend-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# 5. Smoke test
./scripts/smoke-test.sh

# 6. Monitor for 30 minutes
watch -n 60 'aws cloudwatch get-metric-statistics ...'
```

### Post-Deployment

- [ ] WebSocket connection successful
- [ ] Nova API calls working
- [ ] DynamoDB writes successful
- [ ] CloudWatch metrics appearing
- [ ] No critical errors in logs
- [ ] Latency within thresholds
- [ ] Load test passes

### Rollback Plan

```bash
# If issues detected, rollback:
aws cloudformation update-stack \
  --stack-name lira-ai-backend-dev \
  --use-previous-template \
  --capabilities CAPABILITY_IAM
```

---

## 🎯 Success Metrics

### Technical Metrics

- ✅ **Latency:** p95 < 2.5 seconds (target: 2.3s)
- ✅ **Availability:** 99.5% uptime
- ✅ **Error Rate:** < 1%
- ✅ **Concurrent Users:** Support 50+ simultaneous connections
- ✅ **Cost:** < $150 for 20-day development period

### Quality Metrics

- ✅ **Test Coverage:** > 70%
- ✅ **Code Quality:** No critical linting issues
- ✅ **Documentation:** All APIs documented
- ✅ **Security:** No high/critical vulnerabilities

---

## 📚 Resources

### Go & AWS

- [AWS SDK for Go v2](https://aws.github.io/aws-sdk-go-v2/docs/)
- [AWS Lambda Go](https://github.com/aws/aws-lambda-go)
- [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/)

### Amazon Bedrock

- [Bedrock Developer Guide](https://docs.aws.amazon.com/bedrock/)
- [Nova Model Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-nova.html)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

### WebSocket & Audio

- [API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Opus Codec](https://opus-codec.org/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-20 | Initial overly ambitious plan |
| 2.0 | 2026-02-23 | **Pragmatic revision** - Addressed concerns, added buffers, simplified architecture |

---

**Next Steps:**

1. Run `setup.sh` to initialize project
2. Execute `validate-nova` to confirm Bedrock access
3. Follow Phase 1 milestones
4. Daily standup to track progress
5. Adjust timeline if blockers emerge

**Remember:** Working > Perfect. Ship early, iterate fast. 🚀

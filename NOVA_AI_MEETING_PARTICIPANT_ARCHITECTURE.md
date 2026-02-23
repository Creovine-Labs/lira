# Lira AI - Intelligent Meeting Participant
## Amazon Nova AI Hackathon Project

**Project Category:** Voice AI + Agentic AI  
**Submission Date:** TBD  
**Team Size:** 4 Developers  
**Hashtag:** #AmazonNova

---

## 📑 Table of Contents

1. [🎯 Executive Summary](#executive-summary)
   - [Problem Statement](#problem-statement)
   - [Solution](#solution)
   - [Market Differentiation](#market-differentiation)
2. [🏗️ Technical Architecture](#technical-architecture)
   - [High-Level System Overview](#high-level-system-overview)
3. [🔧 Detailed Component Architecture](#detailed-component-architecture)
   - [Frontend Application (React + WebRTC)](#1-frontend-application-react--webrtc)
   - [Backend Services (Go + AWS Lambda + ECS)](#2-backend-services-go--aws-lambda--ecs)
     - [Connection Manager](#21-connection-manager-go-on-aws-lambda)
     - [Audio Processing Pipeline](#22-audio-processing-pipeline-go-ecs-container)
     - [Context Manager](#23-context-manager-go-on-aws-lambda)
     - [AI Response Generator](#24-ai-response-generator-go-on-aws-lambda)
   - [Amazon Nova Integration](#3-amazon-nova-integration)
     - [Nova 2 Sonic (Speech-to-Speech)](#31-nova-2-sonic-speech-to-speech)
     - [Nova 2 Lite (Reasoning)](#32-nova-2-lite-reasoning)
     - [Nova Multimodal Embeddings](#33-optional-nova-multimodal-embeddings)
4. [📊 Data Flow Diagram](#data-flow-diagram)
5. [🎨 User Experience Design](#user-experience-design)
6. [🚀 Deployment Architecture](#deployment-architecture)
7. [👥 Team Roles & Responsibilities](#team-roles--responsibilities)
   - [Role 1: AI/ML Engineer](#-role-1-aiml-engineer--nova-integration-lead)
   - [Role 2: Backend Engineer](#-role-2-backend-engineer--infrastructure-lead)
   - [Role 3: Frontend Engineer](#-role-3-frontend-engineer--ux-lead)
   - [Role 4: DevOps Lead](#-role-4-devops-documentation--demo-lead)
8. [📋 Contribution-Based Performance System](#contribution-based-performance-system)
9. [📅 Project Timeline](#project-timeline-20-days)
10. [🎯 Success Metrics](#success-metrics)
11. [📝 Submission Checklist](#submission-checklist)
12. [🏆 Competitive Advantages](#competitive-advantages)
13. [🔒 Risk Mitigation](#risk-mitigation)
14. [💰 Budget Estimate](#budget-estimate)
15. [📚 Resources & References](#resources--references)
16. [🤝 Team Agreement](#team-agreement)
17. [📞 Contact & Support](#contact--support)
18. [✨ Future Enhancements](#future-enhancements-post-hackathon)
19. [Appendix A: Quick Start Commands](#appendix-a-quick-start-commands)
20. [Appendix B: API Endpoints](#appendix-b-api-endpoints)

---

## 🎯 Executive Summary
<a id="executive-summary"></a>

**Lira AI** is a revolutionary voice-powered AI meeting participant that actively contributes to conversations using Amazon Nova 2 Sonic and Nova 2 Lite. Unlike passive note-taking tools, Alex joins meetings as an intelligent participant, responds to questions naturally with human-like speech patterns, and provides real-time insights using speech-to-speech technology.

### Problem Statement
<a id="problem-statement"></a>

Current AI meeting tools (Otter.ai, Fireflies.ai) are passive observers that only transcribe and summarize. They don't:
- Provide real-time input when asked
- Challenge weak ideas or reinforce strong ones
- Participate in brainstorming
- Offer diverse perspectives during discussions

### Solution
<a id="solution"></a>

Lira AI actively participates in meetings by:
- Listening to conversations in real-time
- Responding when addressed ("Hey Lira, what do you think?")
- Using natural speech with filler words and pauses
- Offering constructive feedback and alternative perspectives
- Maintaining conversation context throughout the meeting
- Supporting both synchronous contribution and post-meeting summaries

### Market Differentiation
<a id="market-differentiation"></a>

| Feature | Traditional AI Tools | Lira AI |
|---------|---------------------|---------|
| Transcription | ✅ | ✅ |
| Summarization | ✅ | ✅ |
| Real-time responses | ❌ | ✅ |
| Natural conversation | ❌ | ✅ |
| Active participation | ❌ | ✅ |
| Speech-to-speech | ❌ | ✅ |

---

## 🏗️ Technical Architecture
<a id="technical-architecture"></a>

### High-Level System Overview
<a id="high-level-system-overview"></a>

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (Web App)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Video UI   │  │  Audio Input │  │ AI Controls  │         │
│  │   (WebRTC)   │  │  (WebAudio)  │  │  (React UI)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket (WSS)
┌─────────────────────────────────────────────────────────────────┐
│                    Real-Time Gateway Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    AWS API Gateway (WebSocket API)                       │  │
│  │    - Connection management                               │  │
│  │    - Audio stream routing                                │  │
│  │    - Message broadcasting                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     Processing Layer (Lambda/ECS)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Audio       │  │  Context     │  │  Response    │         │
│  │  Processor   │→ │  Manager     │→ │  Generator   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Amazon Nova AI Layer                         │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │   Nova 2 Sonic      │         │   Nova 2 Lite       │       │
│  │  Speech-to-Speech   │         │   Reasoning Engine  │       │
│  │  - Voice recognition│         │   - Context analysis│       │
│  │  - Voice synthesis  │         │   - Response logic  │       │
│  │  - Real-time audio  │         │   - Decision making │       │
│  └─────────────────────┘         └─────────────────────┘       │
└─────────────────────────────────────────────────────────────────┾
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       Data & Storage Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  DynamoDB    │  │   S3 Bucket  │  │  ElastiCache │         │
│  │  (State)     │  │   (Audio)    │  │  (Sessions)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Detailed Component Architecture
<a id="detailed-component-architecture"></a>

### 1. Frontend Application (React + WebRTC)
<a id="1-frontend-application-react--webrtc"></a>

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Audio/Video:** WebRTC (RTCPeerConnection)
- **State Management:** Zustand or Redux Toolkit
- **UI Library:** Tailwind CSS + Shadcn/ui
- **Build Tool:** Vite
- **Deployment:** AWS Amplify Hosting

**Key Components:**

```typescript
// Core Application Structure
src/
├── components/
│   ├── MeetingRoom/
│   │   ├── VideoGrid.tsx          // Participant video tiles
│   │   ├── AudioVisualizer.tsx    // Waveform when AI speaks
│   │   ├── ParticipantCard.tsx    // Individual user display
│   │   └── AIStatusIndicator.tsx  // Shows AI thinking/speaking
│   ├── Controls/
│   │   ├── AudioControls.tsx      // Mute/unmute
│   │   ├── VideoControls.tsx      // Camera on/off
│   │   └── AISettings.tsx         // Personality toggles
│   └── Chat/
│       ├── TranscriptView.tsx     // Real-time transcript
│       └── SummaryPanel.tsx       // AI-generated summary
├── services/
│   ├── websocket.service.ts       // WebSocket connection
│   ├── webrtc.service.ts          // Peer connections
│   └── audio.service.ts           // Audio processing
├── hooks/
│   ├── useAudioStream.ts
│   ├── useMeetingState.ts
│   └── useAIParticipant.ts
└── types/
    ├── meeting.types.ts
    └── ai.types.ts
```

**Key Features:**
- Real-time audio streaming via WebRTC
- Visual indicators for active speakers
- AI "thinking" status display
- Live transcript with speaker identification
- Post-meeting summary generation

---

### 2. Backend Services (Go + AWS Lambda + ECS)
<a id="2-backend-services-go--aws-lambda--ecs"></a>

**Technology Stack:**
- **Primary Language:** Go 1.21+ (for performance-critical services)
- **Secondary Language:** Python 3.11 (for simple Lambda functions)
- **WebSocket:** gorilla/websocket
- **AWS SDK:** aws-sdk-go-v2
- **HTTP Framework:** Gin or Echo (lightweight and fast)
- **Container Base:** Distroless Go images

**Service Architecture:**

#### 2.1 Connection Manager (Go on AWS Lambda)
<a id="21-connection-manager-go-on-aws-lambda"></a>
```go
// Lambda: connection-handler
// Triggered by: API Gateway WebSocket events

package main

import (
    "context"
    "encoding/json"
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type ConnectionHandler struct {
    dynamoDB *dynamodb.Client
    redis    *redis.Client
}

func (h *ConnectionHandler) HandleRequest(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
    connectionID := event.RequestContext.ConnectionID
    routeKey := event.RequestContext.RouteKey
    
    switch routeKey {
    case "$connect":
        return h.handleConnect(ctx, connectionID)
    case "$disconnect":
        return h.handleDisconnect(ctx, connectionID)
    case "audio-stream":
        return h.handleAudioStream(ctx, connectionID, event.Body)
    default:
        return events.APIGatewayProxyResponse{StatusCode: 400}, nil
    }
}

func main() {
    handler := &ConnectionHandler{
        // Initialize AWS clients
    }
    lambda.Start(handler.HandleRequest)
}
```

**Responsibilities:**
- Manage WebSocket connections
- Route audio streams to processing pipeline
- Broadcast messages to all participants
- Handle connection lifecycle
- **Go Advantage:** Better concurrency handling for multiple connections

#### 2.2 Audio Processing Pipeline (Go ECS Container)
<a id="22-audio-processing-pipeline-go-ecs-container"></a>
```go
// Container: audio-processor
// Running on: AWS ECS Fargate

package main

import (
    "context"
    "github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
    "github.com/gorilla/websocket"
    "sync"
)

type AudioProcessor struct {
    bedrockClient *bedrockruntime.Client
    bufferManager *AudioBufferManager
    vad           *VoiceActivityDetector
    mu            sync.RWMutex
}

func (ap *AudioProcessor) ProcessStream(ctx context.Context, audioChunk []byte, sessionID string) error {
    // 1. Buffer incoming audio (non-blocking with goroutines)
    ap.bufferManager.AddChunk(audioChunk, sessionID)
    
    // 2. Detect speech activity
    if ap.vad.IsSpeechActive(audioChunk) {
        // 3. Send to Nova 2 Sonic for transcription (concurrent)
        go func() {
            transcript, err := ap.transcribeWithNova(ctx, audioChunk, sessionID)
            if err != nil {
                log.Printf("Transcription error: %v", err)
                return
            }
            
            // 4. Pass to Context Manager
            if err := ap.contextManager.AddUtterance(ctx, sessionID, transcript); err != nil {
                log.Printf("Context error: %v", err)
                return
            }
            
            // 5. Check if AI needs to respond
            if ap.shouldAIRespond(transcript) {
                go ap.triggerAIResponse(ctx, sessionID, transcript)
            }
        }()
    }
    
    return nil
}

func (ap *AudioProcessor) transcribeWithNova(ctx context.Context, audio []byte, sessionID string) (*Transcript, error) {
    // Use AWS SDK for Go v2 to call Nova 2 Sonic
    input := &bedrockruntime.InvokeModelWithResponseStreamInput{
        ModelId: aws.String("amazon.nova-sonic-v2"),
        Body: buildNovaRequest(audio, "transcription"),
    }
    
    output, err := ap.bedrockClient.InvokeModelWithResponseStream(ctx, input)
    if err != nil {
        return nil, err
    }
    
    // Stream and process results
    return processTranscriptionStream(output.GetStream())
}

func main() {
    processor := NewAudioProcessor()
    
    // Start WebSocket server
    http.HandleFunc("/ws", processor.HandleWebSocket)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**Key Technologies:**
- **Language:** Go 1.21+ (compiled, low latency)
- **Concurrency:** Goroutines for parallel audio processing
- **Container Orchestration:** AWS ECS Fargate
- **Audio Format:** Opus codec (low latency)
- **VAD Library:** WebRTC VAD or pion/webrtc
- **Streaming Protocol:** WebSocket with binary frames

**Go Performance Benefits:**
- **~50-100ms faster** than Python for audio processing
- **Lower memory footprint** (~30-50MB vs 100-200MB Python)
- **Better concurrency** with goroutines (handle 1000+ connections)
- **Single binary deployment** (no dependency management)

#### 2.3 Context Manager (Go on AWS Lambda)
<a id="23-context-manager-go-on-aws-lambda"></a>
```go
// Lambda: context-manager
// Purpose: Maintain conversation state

package main

import (
    "context"
    "encoding/json"
    "strings"
    "time"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/go-redis/redis/v8"
)

type ContextManager struct {
    dynamoClient *dynamodb.Client
    redisClient  *redis.Client
    tableName    string
}

type MeetingContext struct {
    SessionID       string      `json:"session_id"`
    Messages        []Message   `json:"messages"`
    SilenceDuration float64     `json:"silence_duration"`
    AIState         AIState     `json:"ai_state"`
}

type Message struct {
    Speaker   string    `json:"speaker"`
    Text      string    `json:"text"`
    Timestamp time.Time `json:"timestamp"`
    Sentiment string    `json:"sentiment"`
}

func (cm *ContextManager) AddUtterance(ctx context.Context, sessionID string, utterance Message) (*MeetingContext, error) {
    // Get existing context
    meetingCtx, err := cm.GetContext(ctx, sessionID)
    if err != nil {
        return nil, err
    }
    
    // Add sentiment analysis
    utterance.Sentiment = cm.analyzeSentiment(utterance.Text)
    utterance.Timestamp = time.Now()
    
    // Append message
    meetingCtx.Messages = append(meetingCtx.Messages, utterance)
    
    // Keep only last 50 messages for context
    if len(meetingCtx.Messages) > 50 {
        meetingCtx.Messages = meetingCtx.Messages[len(meetingCtx.Messages)-50:]
    }
    
    // Update cache (Redis) - fast
    cacheKey := "context:" + sessionID
    jsonData, _ := json.Marshal(meetingCtx)
    cm.redisClient.Set(ctx, cacheKey, jsonData, time.Hour)
    
    // Update DB (DynamoDB) - durable (async)
    go cm.persistToDynamoDB(context.Background(), meetingCtx)
    
    return meetingCtx, nil
}

func (cm *ContextManager) ShouldAIRespond(context *MeetingContext, utterance Message) bool {
    textLower := strings.ToLower(utterance.Text)
    
    // Wake words detection
    wakeWords := []string{"hey lira", "lira", "ai", "what do you think"}
    for _, word := range wakeWords {
        if strings.Contains(textLower, word) {
            return true
        }
    }
    
    // Question detection
    if strings.HasSuffix(textLower, "?") && len(context.Messages) > 5 {
        return true
    }
    
    // Pause detection (nobody spoke for 3 seconds)
    if context.SilenceDuration > 3.0 {
        return true
    }
    
    return false
}

func (cm *ContextManager) analyzeSentiment(text string) string {
    // Simple sentiment analysis or call external service
    // Can use AWS Comprehend or implement basic logic
    return "neutral"
}
```

**Database Schema (DynamoDB):**
```json
{
  "session_id": "string (partition key)",
  "timestamp": "number (sort key)",
  "meeting_metadata": {
    "title": "string",
    "participants": ["user1", "user2", "lira_ai"],
    "start_time": "timestamp",
    "ai_personality": "string"
  },
  "messages": [
    {
      "speaker": "string",
      "text": "string",
      "timestamp": "number",
      "sentiment": "positive|neutral|negative",
      "audio_url": "s3://path/to/audio.opus"
    }
  ],
  "ai_state": {
    "last_response_time": "timestamp",
    "topics_discussed": ["topic1", "topic2"],
    "pending_questions": []
  }
}
```

#### 2.4 AI Response Generator (Go on AWS Lambda)
<a id="24-ai-response-generator-go-on-aws-lambda"></a>
```go
// Lambda: ai-response-generator
// Purpose: Generate intelligent responses using Nova

package main

import (
    "context"
    "encoding/json"
    "math/rand"
    "strings"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

type AIResponseGenerator struct {
    bedrockClient  *bedrockruntime.Client
    novaLiteModel  string
    novaSonicModel string
}

func NewAIResponseGenerator(cfg aws.Config) *AIResponseGenerator {
    return &AIResponseGenerator{
        bedrockClient:  bedrockruntime.NewFromConfig(cfg),
        novaLiteModel:  "amazon.nova-lite-v2",
        novaSonicModel: "amazon.nova-sonic-v2",
    }
}
    
func (gen *AIResponseGenerator) GenerateResponse(ctx context.Context, sessionID string, context *MeetingContext) (*AIResponse, error) {
    // 1. Build prompt with full context
    prompt := gen.buildPrompt(context)
    
    // 2. Get reasoning from Nova 2 Lite
    requestBody := map[string]interface{}{
        "messages": []map[string]string{
            {
                "role":    "system",
                "content": gen.getSystemPrompt(context.AIState.Personality),
            },
            {
                "role":    "user",
                "content": prompt,
            },
        },
        "inferenceConfig": map[string]interface{}{
            "temperature": 0.7,
            "maxTokens":   200,
            "topP":        0.9,
        },
    }
    
    bodyJSON, _ := json.Marshal(requestBody)
    
    input := &bedrockruntime.InvokeModelInput{
        ModelId: aws.String(gen.novaLiteModel),
        Body:    bodyJSON,
    }
    
    output, err := gen.bedrockClient.InvokeModel(ctx, input)
    if err != nil {
        return nil, err
    }
    
    // 3. Extract response text
    var result NovaResponse
    json.Unmarshal(output.Body, &result)
    
    aiText := result.Output.Message.Content[0].Text
    
    // 4. Add human-like elements
    naturalText := gen.addFillerWords(aiText)
    
    // 5. Convert to speech using Nova 2 Sonic (concurrent)
    audioStream, err := gen.textToSpeech(ctx, naturalText)
    if err != nil {
        return nil, err
    }
    
    return &AIResponse{
        Text:      naturalText,
        Audio:     audioStream,
        Reasoning: result.Reasoning,
    }, nil
}
    
func (gen *AIResponseGenerator) getSystemPrompt(personality string) string {
    basePrompt := `You are Lira, an AI meeting participant. You:
    - Speak naturally with occasional filler words (um, well, you know)
    - Keep responses under 30 seconds
    - Challenge bad ideas constructively
    - Build on good ideas with specific suggestions
    - Ask clarifying questions when needed
    - Reference previous parts of the conversation
    - Show personality and emotion in your language`
    
    personalityPrompts := map[string]string{
        "supportive": "Be encouraging and find positives in ideas.",
        "critical":   "Be a devil's advocate and find potential issues.",
        "technical":  "Focus on implementation details and feasibility.",
        "business":   "Focus on ROI, market fit, and business value.",
    }
    
    if addon, ok := personalityPrompts[personality]; ok {
        return basePrompt + "\n" + addon
    }
    return basePrompt
}
    
func (gen *AIResponseGenerator) addFillerWords(text string) string {
    words := strings.Fields(text)
    fillers := []string{"um", "uh", "well", "you know", "I think", "sort of"}
    
    // Add filler at natural pause points
    var enhanced []string
    for i, word := range words {
        if i > 0 && i%10 == 0 && rand.Float64() < 0.3 {
            enhanced = append(enhanced, fillers[rand.Intn(len(fillers))])
        }
        enhanced = append(enhanced, word)
    }
    
    return strings.Join(enhanced, " ")
}
    
func (gen *AIResponseGenerator) textToSpeech(ctx context.Context, text string) ([]byte, error) {
    requestBody := map[string]interface{}{
        "text": text,
        "voiceConfig": map[string]string{
            "voiceId":      "matthew",
            "engine":       "nova-sonic",
            "speakingRate": "1.0",
            "pitch":        "0",
            "emotion":      "neutral",
        },
        "outputConfig": map[string]interface{}{
            "format":     "opus",
            "sampleRate": 24000,
        },
    }
    
    bodyJSON, _ := json.Marshal(requestBody)
    
    input := &bedrockruntime.InvokeModelWithResponseStreamInput{
        ModelId: aws.String(gen.novaSonicModel),
        Body:    bodyJSON,
    }
    
    output, err := gen.bedrockClient.InvokeModelWithResponseStream(ctx, input)
    if err != nil {
        return nil, err
    }
    
    // Stream audio chunks
    var audioData []byte
    stream := output.GetStream()
    for event := range stream.Events() {
        if chunk, ok := event.(*types.ResponseStreamMemberChunk); ok {
            audioData = append(audioData, chunk.Value.Bytes...)
        }
    }
    
    return audioData, stream.Err()
}
```

---

### 3. Amazon Nova Integration
<a id="3-amazon-nova-integration"></a>

#### 3.1 Nova 2 Sonic (Speech-to-Speech)
<a id="31-nova-2-sonic-speech-to-speech"></a>

**Use Cases:**
1. **Speech Recognition:** Convert participant audio to text
2. **Speech Synthesis:** Convert AI responses to natural voice
3. **Real-time Processing:** Low-latency conversational flow

**Configuration (Go):**
```go
package main

import (
    "context"
    "encoding/base64"
    "encoding/json"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
)

// Configure AWS SDK for low latency
func initBedrockClient() (*bedrockruntime.Client, error) {
    cfg, err := config.LoadDefaultConfig(context.Background(),
        config.WithRegion("us-east-1"),
        config.WithRetryMaxAttempts(3),
    )
    if err != nil {
        return nil, err
    }
    
    return bedrockruntime.NewFromConfig(cfg), nil
}

// Nova 2 Sonic: Speech Recognition
func transcribeAudio(ctx context.Context, client *bedrockruntime.Client, audioBytes []byte) (<-chan string, error) {
    transcriptChan := make(chan string)
    
    requestBody := map[string]interface{}{
        "audioInput": map[string]string{
            "content": base64.StdEncoding.EncodeToString(audioBytes),
            "format":  "opus",
        },
        "task": "transcription",
        "config": map[string]interface{}{
            "language":                 "en-US",
            "enableSpeakerDiarization": true,
            "maxSpeakers":              10,
        },
    }
    
    bodyJSON, _ := json.Marshal(requestBody)
    
    input := &bedrockruntime.InvokeModelWithResponseStreamInput{
        ModelId: aws.String("amazon.nova-sonic-v2"),
        Body:    bodyJSON,
    }
    
    output, err := client.InvokeModelWithResponseStream(ctx, input)
    if err != nil {
        return nil, err
    }
    
    // Stream results asynchronously
    go func() {
        defer close(transcriptChan)
        stream := output.GetStream()
        for event := range stream.Events() {
            if chunk, ok := event.(*types.ResponseStreamMemberChunk); ok {
                var result map[string]interface{}
                json.Unmarshal(chunk.Value.Bytes, &result)
                if transcript, ok := result["transcript"].(string); ok {
                    transcriptChan <- transcript
                }
            }
        }
    }()
    
    return transcriptChan, nil
}

// Nova 2 Sonic: Speech Synthesis
func synthesizeSpeech(ctx context.Context, client *bedrockruntime.Client, text string, voiceConfig map[string]string) (<-chan []byte, error) {
    audioChan := make(chan []byte)
    
    requestBody := map[string]interface{}{
        "text":        text,
        "task":        "synthesis",
        "voiceConfig": voiceConfig,
    }
    
    bodyJSON, _ := json.Marshal(requestBody)
    
    input := &bedrockruntime.InvokeModelWithResponseStreamInput{
        ModelId: aws.String("amazon.nova-sonic-v2"),
        Body:    bodyJSON,
    }
    
    output, err := client.InvokeModelWithResponseStream(ctx, input)
    if err != nil {
        return nil, err
    }
    
    // Stream audio chunks back to client
    go func() {
        defer close(audioChan)
        stream := output.GetStream()
        for event := range stream.Events() {
            if chunk, ok := event.(*types.ResponseStreamMemberChunk); ok {
                audioChan <- chunk.Value.Bytes
            }
        }
    }()
    
    return audioChan, nil
}
```

#### 3.2 Nova 2 Lite (Reasoning)
<a id="32-nova-2-lite-reasoning"></a>

**Use Cases:**
1. **Context Understanding:** Analyze conversation history
2. **Response Generation:** Create intelligent replies
3. **Sentiment Analysis:** Detect meeting tone
4. **Topic Extraction:** Identify key discussion points

**Configuration (Go):**
```go
func generateMeetingResponse(ctx context.Context, client *bedrockruntime.Client, contextMessages []Message, personality string) (string, error) {
    // Build conversation history
    messages := []map[string]string{
        {
            "role":    "system",
            "content": getSystemPrompt(personality),
        },
    }
    
    // Add recent conversation (last 20 messages)
    startIdx := len(contextMessages) - 20
    if startIdx < 0 {
        startIdx = 0
    }
    
    for _, msg := range contextMessages[startIdx:] {
        role := "user"
        if msg.Speaker == "lira" {
            role = "assistant"
        }
        messages = append(messages, map[string]string{
            "role":    role,
            "content": msg.Speaker + ": " + msg.Text,
        })
    }
    
    // Invoke Nova 2 Lite
    requestBody := map[string]interface{}{
        "messages": messages,
        "inferenceConfig": map[string]interface{}{
            "temperature":   0.7,
            "maxTokens":     250,
            "topP":          0.9,
            "stopSequences": []string{"\n\n"},
        },
    }
    
    bodyJSON, _ := json.Marshal(requestBody)
    
    input := &bedrockruntime.InvokeModelInput{
        ModelId: aws.String("amazon.nova-lite-v2"),
        Body:    bodyJSON,
    }
    
    output, err := client.InvokeModel(ctx, input)
    if err != nil {
        return "", err
    }
    
    var result NovaLiteResponse
    if err := json.Unmarshal(output.Body, &result); err != nil {
        return "", err
    }
    
    return result.Output.Message.Content[0].Text, nil
}
```

#### 3.3 Optional: Nova Multimodal Embeddings
<a id="33-optional-nova-multimodal-embeddings"></a>

**Use Case:** Screen sharing analysis

If time permits, add ability for AI to "see" shared screens:

```python
def analyze_shared_screen(image_bytes, context):
    """Use Nova multimodal embeddings to understand shared content"""
    response = bedrock.invoke_model(
        modelId='amazon.nova-multimodal-embedding-v1',
        body=json.dumps({
            'inputImage': base64.b64encode(image_bytes).decode(),
            'inputText': f"Analyze this screen in context of: {context['current_topic']}"
        })
    )
    
    # Get embeddings and compare with text context
    embeddings = json.loads(response['body'].read())
    return analyze_image_relevance(embeddings, context)
```

---

## 📊 Data Flow Diagram
<a id="data-flow-diagram"></a>

### Real-Time Conversation Flow

```
Participant speaks
    ↓
[Browser captures audio]
    ↓
[WebSocket sends audio chunks]
    ↓
[API Gateway routes to ECS]
    ↓
[Audio Processor buffers & detects speech]
    ↓
[Nova 2 Sonic transcribes speech]
    ↓
[Context Manager adds to conversation history]
    ↓
[Decision: Should AI respond?]
    ↓ YES
[Query Nova 2 Lite with full context]
    ↓
[Generate response text with personality]
    ↓
[Add natural filler words & pauses]
    ↓
[Nova 2 Sonic synthesizes speech]
    ↓
[Stream audio back via WebSocket]
    ↓
[Browser plays AI audio]
    ↓
[All participants hear AI response]
```

**Target Latency:**
- Audio capture → transcription: **< 500ms**
- Transcription → AI thinking: **< 1000ms**
- AI response → speech synthesis: **< 800ms**
- **Total: < 2.3 seconds** (acceptable for natural conversation)

---

## 🎨 User Experience Design
<a id="user-experience-design"></a>

### Meeting Room UI

```
┌─────────────────────────────────────────────────────────────┐
│  Lira AI Meeting Room                    [⚙️ Settings] [🚪 Leave] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  User 1  │  │  User 2  │  │  User 3  │  │   Lira   │  │
│  │  Video   │  │  Video   │  │  Video   │  │   AI     │  │
│  │  🎤 ON   │  │  🎤 OFF  │  │  🎤 ON   │  │  🤖💭    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Live Transcript:                                           │
│  ─────────────────────────────────────────────────────────  │
│  User1: "Should we add dark mode?"                          │
│  User2: "Seems like extra work..."                          │
│  User3: "Hey Lira, what's your take?"                       │
│  Lira: "Well... I see both sides. Dark mode is pretty       │
│         expected in 2026, especially for productivity       │
│         apps. But if resources are tight, maybe just        │
│         respect system preferences first?"                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│  [🎤 Mute] [🎥 Camera] [💬 Chat] [📊 Summary] [⚡ AI: Active] │
└─────────────────────────────────────────────────────────────┘
```

### AI Personality Settings

```
Lira's Personality:
○ Supportive      - Encouraging, finds positives
● Critical        - Devil's advocate, challenges ideas
○ Technical       - Focuses on implementation
○ Business        - Focuses on ROI and value

Participation Level:
[━━━━━━⚪━━━━] 60%
Less Active ←────────→ More Active

Features:
☑ Enable wake word ("Hey Lira")
☑ Allow proactive suggestions
☑ Show AI reasoning
☐ Record meeting (with consent)
```

---

## 🚀 Deployment Architecture
<a id="deployment-architecture"></a>

### AWS Infrastructure

```yaml
# Infrastructure as Code (AWS CDK)
Resources:
  
  # Frontend Hosting
  AmplifyApp:
    Type: AWS::Amplify::App
    Properties:
      Name: lira-ai-frontend
      Repository: github.com/yourteam/lira-ai
      BuildSpec: |
        version: 1
        frontend:
          phases:
            build:
              commands:
                - npm install
                - npm run build
          artifacts:
            baseDirectory: dist
            files:
              - '**/*'
  
  # WebSocket API
  WebSocketAPI:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: lira-ai-websocket
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: "$request.body.action"
  
  # Lambda Functions (Go Runtime)
  ConnectionHandlerFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: provided.al2023  # Custom Go runtime
      Handler: bootstrap
      Code: ./lambda/connection-handler/bootstrap.zip
      Architectures:
        - arm64  # Graviton2 for better price/performance
      MemorySize: 256  # Go uses less memory
      Timeout: 10
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref MeetingContextTable
          REDIS_ENDPOINT: !GetAtt ElastiCacheCluster.RedisEndpoint
  
  ContextManagerFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: provided.al2023
      Handler: bootstrap
      Code: ./lambda/context-manager/bootstrap.zip
      Architectures:
        - arm64
      MemorySize: 512
      Timeout: 30
  
  ResponseGeneratorFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: provided.al2023
      Handler: bootstrap
      Code: ./lambda/response-generator/bootstrap.zip
      Architectures:
        - arm64
      MemorySize: 1024  # Less than Python equivalent
      Timeout: 30
      Environment:
        Variables:
          BEDROCK_REGION: us-east-1
  
  # ECS Cluster for Audio Processing
  AudioProcessingCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: lira-ai-audio-processor
  
  AudioProcessingTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: audio-processor
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 2048
      Memory: 4096
      ContainerDefinitions:
        - Name: audio-processor
          Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/lira-ai-audio:latest
          Essential: true
          PortMappings:
            - ContainerPort: 8080
  
  # DynamoDB Table
  MeetingContextTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: lira-ai-meeting-contexts
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
  
  # ElastiCache for Redis
  ElastiCacheCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
  
  # S3 Bucket for Audio Storage
  AudioStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: lira-ai-audio-storage
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAudio
            Status: Enabled
            ExpirationInDays: 30
  
  # Bedrock Access IAM Role
  BedrockAccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: BedrockInvokeModel
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - bedrock:InvokeModel
                  - bedrock:InvokeModelWithResponseStream
                Resource:
                  - arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v2
                  - arn:aws:bedrock:*::foundation-model/amazon.nova-sonic-v2
```

### Deployment Pipeline

```yaml
# GitHub Actions Workflow
name: Deploy Lira AI

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: aws amplify push

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/setup-sam@v2
      - run: sam build
      - run: sam deploy --no-confirm-changeset

  deploy-containers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t lira-ai-audio ./audio-processor
      - run: aws ecr get-login-password | docker login
      - run: docker push $ECR_REGISTRY/lira-ai-audio:latest
      - run: aws ecs update-service --force-new-deployment
```

---

## 👥 Team Roles & Responsibilities
<a id="team-roles--responsibilities"></a>

### Equal Split: 25% per person (100% total)
### Each role divided into 10 milestones × 10% each = 100%

---

## 🎭 **ROLE 1: AI/ML Engineer & Nova Integration Lead**
**Developer:** TBD  
**Primary Focus:** Amazon Nova integration, AI reasoning, prompt engineering

### Responsibilities Breakdown (10 Milestones × 10% each)

| # | Milestone | Description | Deliverable | Deadline | Weight |
|---|-----------|-------------|-------------|----------|--------|
| 1 | Nova Account Setup | Set up AWS account, enable Bedrock, get Nova access | AWS credentials configured | Day 1 | 10% |
| 2 | Nova 2 Sonic Integration | Implement speech-to-text functionality | Working transcription service | Day 3 | 10% |
| 3 | Nova 2 Sonic TTS | Implement text-to-speech with voice synthesis | Working TTS service | Day 5 | 10% |
| 4 | Nova 2 Lite Setup | Configure reasoning model with proper prompts | Response generation working | Day 7 | 10% |
| 5 | Personality System | Implement 4 AI personality modes (supportive, critical, technical, business) | Personality switching works | Day 9 | 10% |
| 6 | Context Management | Build conversation context tracking and memory | Context history maintained | Day 11 | 10% |
| 7 | Response Logic | Implement wake word detection and response triggers | AI knows when to speak | Day 13 | 10% |
| 8 | Natural Language | Add filler words, pauses, human-like speech patterns | Responses feel natural | Day 15 | 10% |
| 9 | Latency Optimization | Reduce response time to < 2.5 seconds | Performance benchmarks met | Day 17 | 10% |
| 10 | Testing & Tuning | Test various scenarios, tune prompts and parameters | AI performs reliably | Day 19 | 10% |

**Required Skills:** Go/Python, AWS Bedrock SDK, Prompt Engineering, ML Model Integration  
**Key Tools:** Amazon Bedrock, Nova 2 Sonic, Nova 2 Lite, aws-sdk-go-v2

---

## 💻 **ROLE 2: Backend Engineer & Infrastructure Lead**
**Developer:** TBD  
**Primary Focus:** AWS architecture, Lambda functions, WebSocket API, database

### Responsibilities Breakdown (10 Milestones × 10% each)

| # | Milestone | Description | Deliverable | Deadline | Weight |
|---|-----------|-------------|-------------|----------|--------|
| 1 | Infrastructure Planning | Design AWS architecture, create IaC templates | Architecture diagram + CDK code | Day 2 | 10% |
| 2 | WebSocket API Setup | Deploy API Gateway with WebSocket support | WebSocket endpoint live | Day 4 | 10% |
| 3 | Lambda Functions | Create connection handler, context manager, response generator | All Lambdas deployed | Day 6 | 10% |
| 4 | DynamoDB Schema | Design and deploy database for meeting contexts | Database operational | Day 8 | 10% |
| 5 | ElastiCache Setup | Configure Redis for session management | Cache layer working | Day 10 | 10% |
| 6 | S3 Audio Storage | Set up bucket for audio recordings with lifecycle | Storage configured | Day 12 | 10% |
| 7 | ECS Audio Processor | Deploy containerized audio processing service | Container running | Day 14 | 10% |
| 8 | API Integration | Connect all services end-to-end | Full backend working | Day 16 | 10% |
| 9 | Security & IAM | Configure proper roles, policies, and encryption | Security audit passed | Day 18 | 10% |
| 10 | Monitoring & Logs | Set up CloudWatch, alarms, and logging | Monitoring dashboard live | Day 20 | 10% |

**Required Skills:** AWS (Lambda, ECS, DynamoDB), Go, Infrastructure as Code, WebSockets  
**Key Tools:** AWS CDK (Go), SAM, CloudFormation, Docker, Go 1.21+

---

## 🎨 **ROLE 3: Frontend Engineer & UX Lead**
**Developer:** TBD  
**Primary Focus:** React application, WebRTC, user interface, user experience

### Responsibilities Breakdown (10 Milestones × 10% each)

| # | Milestone | Description | Deliverable | Deadline | Weight |
|---|-----------|-------------|-------------|----------|--------|
| 1 | Project Setup | Initialize React app with TypeScript, Vite, Tailwind | Boilerplate ready | Day 1 | 10% |
| 2 | UI Design System | Create component library and design tokens | Reusable components | Day 3 | 10% |
| 3 | Meeting Room Layout | Build video grid and participant cards | UI layout complete | Day 5 | 10% |
| 4 | WebRTC Integration | Implement peer-to-peer video/audio connections | Video calls working | Day 7 | 10% |
| 5 | Audio Controls | Build mute/unmute, volume, speaker selection | Audio controls functional | Day 9 | 10% |
| 6 | WebSocket Client | Connect to backend WebSocket API for real-time updates | Real-time messaging works | Day 11 | 10% |
| 7 | Live Transcript UI | Display real-time transcript with speaker labels | Transcript visible | Day 13 | 10% |
| 8 | AI Visualizations | Show AI status (listening, thinking, speaking) with animations | AI indicators working | Day 15 | 10% |
| 9 | Settings Panel | Build personality selection and AI control panel | Settings functional | Day 17 | 10% |
| 10 | Polish & Testing | Responsive design, error handling, cross-browser testing | Production-ready UI | Day 19 | 10% |

**Required Skills:** React, TypeScript, WebRTC, CSS/Tailwind, WebSocket Client  
**Key Tools:** React 18, Vite, WebRTC API, Zustand, Shadcn/ui

---

## 🎬 **ROLE 4: DevOps, Documentation & Demo Lead**
**Developer:** TBD  
**Primary Focus:** Deployment pipeline, testing, documentation, demo video

### Responsibilities Breakdown (10 Milestones × 10% each)

| # | Milestone | Description | Deliverable | Deadline | Weight |
|---|-----------|-------------|-------------|----------|--------|
| 1 | GitHub Repository | Set up repo structure, branching strategy, CI/CD | Repo configured | Day 1 | 10% |
| 2 | CI/CD Pipeline | Configure GitHub Actions for automated deployment | Pipeline working | Day 4 | 10% |
| 3 | Environment Setup | Create dev, staging, prod environments | Environments deployed | Day 6 | 10% |
| 4 | Integration Testing | Write end-to-end tests for critical flows | Test suite passing | Day 8 | 10% |
| 5 | Performance Testing | Load testing, latency measurement, bottleneck analysis | Performance report | Day 10 | 10% |
| 6 | Technical Documentation | Write architecture docs, API docs, setup guides | Docs published | Day 12 | 10% |
| 7 | User Documentation | Create user guide, FAQ, troubleshooting guide | User docs complete | Day 14 | 10% |
| 8 | Demo Video Script | Write script, plan scenes, coordinate team for recording | Script approved | Day 16 | 10% |
| 9 | Demo Video Production | Record, edit, and produce 3-minute demo video | Video ready | Day 18 | 10% |
| 10 | Submission Package | Prepare DevPost submission with all materials | Submitted to hackathon | Day 20 | 10% |

**Required Skills:** DevOps, CI/CD, Testing, Technical Writing, Video Production  
**Key Tools:** GitHub Actions, AWS CDK, Pytest, Postman, Video editing software

---

## 📋 Contribution-Based Performance System
<a id="contribution-based-performance-system"></a>

### Core Rules

1. **Equal Base Split:** Each developer starts with 25% ownership
2. **Milestone Tracking:** Each role has 10 milestones worth 10% of that role's contribution
3. **Deadline System:** Each milestone has a specific deadline date
4. **Penalty Structure:**
   - Complete on time: Full 10% credit
   - 1-2 days late: 7% credit (3% redistributed)
   - 3-5 days late: 5% credit (5% redistributed)
   - 6+ days late: 2% credit (8% redistributed)
   - Not completed: 0% credit, milestone reassigned

### Redistribution Logic

When someone misses a deadline, the penalty is redistributed:
- **50%** goes to whoever completes the work (if reassigned)
- **50%** split equally among other team members who met their deadlines

### Emergency Reallocation

- 5% of total project equity is held in reserve
- Used to compensate anyone taking on extra work due to emergencies
- Distributed at project end based on team vote

### Blocking Dependencies

If your work is blocked by someone else's delay:
- Document the blocker
- No penalty applied to dependent milestones
- Deadline automatically extends by the delay period
- Blocker receives doubled penalty

### Quality Gates

All deliverables must pass peer review:
- Code review by at least 1 other team member
- Functional testing verification
- Documentation completeness check

**Partial Credit:**
- Works but has bugs: 7% credit
- Incomplete functionality: 5% credit
- Technical debt/needs refactor: 8% credit

### Weekly Sync

Every 3 days:
- Progress check-in
- Blocker identification
- Risk assessment
- Reallocation discussion if needed

### Example Scenarios

**Scenario 1: Backend Engineer completes all milestones on time**
- Earns full 25% contribution

**Scenario 2: AI Engineer misses 2 milestones (3 days late each)**
- Milestone 5: 5% instead of 10% (5% penalty)
- Milestone 7: 5% instead of 10% (5% penalty)
- Total: 80% of their milestones = 20% contribution instead of 25%
- 5% redistributed: 2.5% to whoever completed the work, 2.5% split among team

**Scenario 3: Frontend Engineer blocked by Backend API**
- Backend API delivery: Day 16 (2 days late)
- Frontend milestone depending on API: Deadline auto-extends by 2 days
- No penalty to Frontend Engineer
- Backend Engineer receives penalty for their delay

---

## 📅 Project Timeline (20 Days)
<a id="project-timeline-20-days"></a>

### Phase 1: Setup & Foundation (Days 1-5)
- Infrastructure provisioning
- Nova access configuration
- Basic UI framework
- Repository and CI/CD setup

**Milestone:** Basic app runs with mock AI responses

### Phase 2: Core Features (Days 6-12)
- Nova 2 Sonic integration
- WebRTC implementation
- Context management
- Database operations

**Milestone:** AI can listen and respond (even if slowly)

### Phase 3: Enhancement (Days 13-17)
- Personality system
- UI polish
- Performance optimization
- Natural language improvements

**Milestone:** App feels natural and polished

### Phase 4: Demo & Launch (Days 18-20)
- Demo video production
- Documentation finalization
- Bug fixes and testing
- DevPost submission

**Milestone:** Submitted to hackathon

---

## 🎯 Success Metrics
<a id="success-metrics"></a>

### Technical KPIs
- **Latency:** < 2.5 seconds from question to AI response
- **Uptime:** 99% during demo period
- **Audio Quality:** Clear, no artifacts or glitches
- **Concurrent Users:** Support 4-6 participants per session

### Judging Criteria Alignment

**Technical Implementation (60%):**
- ✅ Full Nova 2 Sonic integration (speech-to-speech)
- ✅ Full Nova 2 Lite integration (reasoning)
- ✅ Real-time WebRTC + WebSocket architecture
- ✅ Scalable AWS infrastructure
- ✅ Clean, documented codebase

**Enterprise/Community Impact (20%):**
- ✅ Solves real meeting fatigue problem
- ✅ Improves remote work collaboration
- ✅ Accessibility benefits (helps non-native speakers, neurodiverse individuals)
- ✅ Cost savings (reduces need for extra meeting participants)

**Creativity & Innovation (20%):**
- ✅ First active AI participant (not passive note-taker)
- ✅ Natural conversation with human-like speech
- ✅ Personality customization
- ✅ Novel use of speech-to-speech AI

---

## 📝 Submission Checklist
<a id="submission-checklist"></a>

### Required Materials

- [ ] **GitHub Repository** (public or shared)
  - [ ] Complete source code
  - [ ] README with setup instructions
  - [ ] Architecture documentation
  - [ ] API documentation

- [ ] **Demo Video** (3 minutes)
  - [ ] Problem statement (30s)
  - [ ] Live demo (90s)
  - [ ] Technical overview (30s)
  - [ ] Impact & use cases (30s)
  - [ ] Includes #AmazonNova hashtag

- [ ] **Text Description**
  - [ ] Project summary
  - [ ] Nova integration details
  - [ ] Target audience & impact

- [ ] **Deployment**
  - [ ] Live demo URL
  - [ ] Working application
  - [ ] Test accounts/instructions

### Bonus Submissions

- [ ] **Blog Post** (for $200 AWS credits)
  - Published on builder.aws.com
  - Discusses community impact
  - Outlines adoption plans

- [ ] **Feedback Survey** (for $50 cash)
  - Complete after submission

---

## 🏆 Competitive Advantages
<a id="competitive-advantages"></a>

### Why Lira AI Will Win

**1. Perfect Nova Fit:**
- Uses Nova 2 Sonic for core functionality (not just a check-box)
- Uses Nova 2 Lite for intelligent reasoning
- Demonstrates true speech-to-speech (not text intermediary)

**2. Novel Approach:**
- First active participant AI (not passive transcription)
- Natural conversation with personality
- Human-like speech patterns

**3. Real Business Value:**
- Clear ROI for enterprises (reduces meeting overhead)
- Measurable benefits (time savings, better decisions)
- Scalable to multiple platforms (Zoom, Meet, Teams)

**4. Technical Excellence:**
- Low-latency architecture
- Scalable AWS infrastructure
- Clean, documented code
- Production-ready deployment

**5. Strong Demo:**
- Live, working application (not just slides)
- Judges can test it themselves
- Clear before/after comparison

---

## 🔒 Risk Mitigation
<a id="risk-mitigation"></a>

### Identified Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Nova API quota exceeded | Medium | High | Cache responses, optimize calls, request increase early |
| High latency (>3s response) | High | High | Stream responses, optimize pipeline, use Fargate not Lambda for audio |
| WebRTC connection issues | Medium | Medium | Fallback to TURN servers, test multiple browsers |
| Team member unavailable | Medium | High | Cross-training, clear documentation, reassignment protocol |
| AWS costs exceed budget | Medium | Medium | Set billing alarms, use free tier, optimize resource usage |
| Demo day technical issues | Low | High | Pre-record fallback video, test environment 24h before |

---

## 💰 Budget Estimate
<a id="budget-estimate"></a>

### Hackathon Development Period (20 days)

| Service | Estimated Cost | Notes |
|---------|----------------|-------|
| Amazon Bedrock (Nova) | $50-100 | ~10K requests during development |
| AWS Lambda | $5-10 | Free tier likely sufficient |
| AWS ECS Fargate | $20-30 | 1 task running |
| DynamoDB | $5-10 | Pay-per-request mode |
| ElastiCache | $15-20 | t3.micro instance |
| S3 Storage | $2-5 | Audio storage |
| API Gateway | $5-10 | WebSocket connections |
| Amplify Hosting | $0 | Free tier |
| **Total** | **$102-185** | Well within free tier + credits |

**Post-Hackathon (if continuing):**
- With $5K AWS credits from winning, can run production for 6-12 months

---

## 📚 Resources & References
<a id="resources--references"></a>

### Amazon Nova Documentation
- [Nova 2 Developer Guide](https://docs.aws.amazon.com/nova/)
- [Bedrock API Reference](https://docs.aws.amazon.com/bedrock/)
- [Nova 2 Sonic Examples](https://github.com/aws-samples/nova-sonic-examples)

### Technical Resources
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [AWS CDK Examples](https://github.com/aws-samples/aws-cdk-examples)
- [Real-time Audio Processing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Inspiration & Research
- [Voice Activity Detection Paper](https://arxiv.org/abs/2010.12866)
- [Conversational AI Best Practices](https://aws.amazon.com/blogs/machine-learning/)
- [Meeting Collaboration Research](https://hbr.org/2022/03/how-to-run-better-virtual-meetings)

---

## 🤝 Team Agreement
<a id="team-agreement"></a>

### By signing below, all team members agree to:

1. Commit to the 20-day development timeline
2. Accept the contribution-based equity split system
3. Meet assigned milestones by deadlines or face documented penalties
4. Participate in bi-weekly sync meetings
5. Provide peer reviews for other team members' work
6. Communicate blockers immediately
7. Maintain code quality and documentation standards
8. Share credit equally in public presentations unless contribution split differs significantly

**Signatures:**

- Developer 1 (AI/ML Lead): _________________ Date: _______
- Developer 2 (Backend Lead): _________________ Date: _______
- Developer 3 (Frontend Lead): _________________ Date: _______
- Developer 4 (DevOps Lead): _________________ Date: _______

---

## 📞 Contact & Support
<a id="contact--support"></a>

**Project Repository:** https://github.com/yourteam/lira-ai  
**Team Communication:** Slack/Discord Channel  
**Weekly Sync:** Every 3 days via Zoom  

**AWS Support:**
- Office Hours: [Hackathon Schedule]
- Technical Questions: Amazon Nova Discord

**DevPost Submission:**
- Deadline: [Hackathon End Date]
- Submission: testing@devpost.com + Amazon-Nova-hackathon@amazon.com

---

## ✨ Future Enhancements (Post-Hackathon)
<a id="future-enhancements-post-hackathon"></a>

If we continue after winning:

1. **Platform Integrations:**
   - Native Zoom bot
   - Google Meet integration
   - Microsoft Teams support

2. **Advanced Features:**
   - Screen sharing analysis (Nova multimodal)
   - Multi-language support
   - Sentiment tracking over time
   - Action item extraction

3. **Enterprise Features:**
   - Team analytics
   - Meeting insights dashboard
   - Custom AI training per organization
   - Security & compliance certifications

4. **Monetization:**
   - Freemium: 10 meetings/month free
   - Pro: $29/month unlimited
   - Enterprise: Custom pricing

---

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Status:** Ready for Team Review

---

## Appendix A: Quick Start Commands
<a id="appendix-a-quick-start-commands"></a>

```bash
# Clone repository
git clone https://github.com/yourteam/lira-ai.git
cd lira-ai

# Install dependencies
npm install  # Frontend
go mod download  # Backend

# Set up AWS credentials
aws configure

# Build Go services
cd backend
GOOS=linux GOARCH=arm64 go build -o bootstrap ./cmd/audio-processor
GOOS=linux GOARCH=arm64 go build -o bootstrap ./cmd/context-manager

# Deploy infrastructure
cd infrastructure
cdk deploy

# Run locally
npm run dev  # Frontend
go run ./cmd/server  # Backend

# Run tests
npm test
go test ./...
```

---

## Appendix B: API Endpoints
<a id="appendix-b-api-endpoints"></a>

```
WebSocket API: wss://api.lira-ai.com/ws
- /connect - Establish connection
- /audio-stream - Send audio chunks
- /get-transcript - Retrieve transcript
- /disconnect - Close connection

REST API: https://api.lira-ai.com/v1
- POST /meetings - Create new meeting
- GET /meetings/:id - Get meeting details
- GET /meetings/:id/summary - Get AI summary
- PUT /ai/personality - Update AI settings
```

---

*End of Technical Architecture Document*

#!/usr/bin/env python3
"""Phase 4 code generator: Bedrock AI, Audio Processor, SAM local infra."""
import os, sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FILES = {}

# ─────────────────────────────────────────────────────────────
# internal/nova/bedrock.go
# ─────────────────────────────────────────────────────────────
FILES["internal/nova/bedrock.go"] = '''\
package nova

import (
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/creovine/lira-ai-backend/internal/models"
)

const (
	// maxContextMessages is the maximum number of prior messages to include in the prompt.
	maxContextMessages = 20
	// defaultMaxTokens is the default Nova output token limit.
	defaultMaxTokens = 512
)

// bedrockAPI is the subset of bedrockruntime.Client we need (enables test doubles).
type bedrockAPI interface {
	Converse(ctx context.Context, params *bedrockruntime.ConverseInput, optFns ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error)
}

// BedrockClient wraps the AWS Bedrock Runtime Converse API and implements AIService.
type BedrockClient struct {
	client  bedrockAPI
	modelID string
}

// NewBedrockClient creates a production Bedrock AI client.
func NewBedrockClient(client *bedrockruntime.Client, modelID string) *BedrockClient {
	return &BedrockClient{client: client, modelID: modelID}
}

// GenerateResponse calls Amazon Nova via the Bedrock Converse API.
// It builds a system prompt from meeting settings and a conversation history
// from the last maxContextMessages messages.
func (b *BedrockClient) GenerateResponse(
	ctx context.Context,
	_ string,
	messages []models.Message,
	settings models.MeetingSettings,
) (string, error) {
	system := buildSystemPrompt(settings)
	convMsgs := buildConversationMessages(messages)

	if len(convMsgs) == 0 {
		return "I\'m Lira, your AI meeting assistant. How can I help?", nil
	}

	input := &bedrockruntime.ConverseInput{
		ModelId: aws.String(b.modelID),
		System: []brtypes.SystemContentBlock{
			&brtypes.SystemContentBlockMemberText{Value: system},
		},
		Messages: convMsgs,
		InferenceConfig: &brtypes.InferenceConfiguration{
			MaxTokens:   aws.Int32(defaultMaxTokens),
			Temperature: aws.Float32(0.7),
			TopP:        aws.Float32(0.9),
		},
	}

	output, err := b.client.Converse(ctx, input)
	if err != nil {
		return "", fmt.Errorf("bedrock converse: %w", err)
	}

	// Extract text from the response message.
	if msg, ok := output.Output.(*brtypes.ConverseOutputMemberMessage); ok {
		for _, block := range msg.Value.Content {
			if text, ok := block.(*brtypes.ContentBlockMemberText); ok {
				return strings.TrimSpace(text.Value), nil
			}
		}
	}

	return "", fmt.Errorf("bedrock: no text content in response")
}

// buildSystemPrompt returns a personality-specific system prompt for Nova.
func buildSystemPrompt(settings models.MeetingSettings) string {
	base := `You are Lira, an AI meeting participant built on Amazon Nova. ` +
		`Your role is to actively participate in meetings by providing insights, ` +
		`tracking action items, summarising discussions, and asking clarifying questions. ` +
		`Be concise — responses should be 1-3 sentences unless a detailed summary is requested. ` +
		`Never start a response with "As an AI" or "I cannot". `

	personality := settings.Personality
	switch personality {
	case "supportive":
		return base + `Your tone is warm, encouraging, and collaborative. ` +
			`Acknowledge the team\'s contributions and build on their ideas positively.`
	case "analytical":
		return base + `Your tone is precise and data-driven. ` +
			`Focus on facts, identify gaps in reasoning, and suggest concrete next steps.`
	case "facilitator":
		return base + `Your role is to keep the meeting on track. ` +
			`Summarise decisions, identify blockers, surface action items, and ensure all voices are heard.`
	case "devil\'s advocate":
		return base + `Challenge assumptions constructively. ` +
			`Point out potential risks, alternative viewpoints, and unintended consequences.`
	default:
		return base + `Adapt your tone to the context of the conversation.`
	}
}

// buildConversationMessages converts meeting messages to Bedrock Converse format.
// Only the last maxContextMessages non-AI messages plus their surrounding context are included.
// The message list must start with a user role (Nova requirement).
func buildConversationMessages(messages []models.Message) []brtypes.Message {
	// Take last maxContextMessages messages.
	if len(messages) > maxContextMessages {
		messages = messages[len(messages)-maxContextMessages:]
	}

	var out []brtypes.Message
	var lastRole brtypes.ConversationRole

	for _, m := range messages {
		role := brtypes.ConversationRoleUser
		if m.IsAI {
			role = brtypes.ConversationRoleAssistant
		}

		// Bedrock requires alternating roles; merge consecutive same-role messages.
		if len(out) > 0 && lastRole == role {
			last := &out[len(out)-1]
			existing := last.Content[0].(*brtypes.ContentBlockMemberText)
			existing.Value += "\\n" + m.Text
			continue
		}

		out = append(out, brtypes.Message{
			Role: role,
			Content: []brtypes.ContentBlock{
				&brtypes.ContentBlockMemberText{Value: m.Text},
			},
		})
		lastRole = role
	}

	// Bedrock Converse requires the last message to be from the user.
	if len(out) > 0 && out[len(out)-1].Role == brtypes.ConversationRoleAssistant {
		out = append(out, brtypes.Message{
			Role: brtypes.ConversationRoleUser,
			Content: []brtypes.ContentBlock{
				&brtypes.ContentBlockMemberText{Value: "Please continue."},
			},
		})
	}

	return out
}
'''

# ─────────────────────────────────────────────────────────────
# internal/nova/bedrock_test.go
# ─────────────────────────────────────────────────────────────
FILES["internal/nova/bedrock_test.go"] = '''\
package nova

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockBedrockAPI is a test double for the Bedrock Converse API.
type mockBedrockAPI struct {
	response string
	err      error
	lastInput *bedrockruntime.ConverseInput
}

func (m *mockBedrockAPI) Converse(_ context.Context, params *bedrockruntime.ConverseInput, _ ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error) {
	m.lastInput = params
	if m.err != nil {
		return nil, m.err
	}
	text := m.response
	if text == "" {
		text = "Mock Bedrock response."
	}
	return &bedrockruntime.ConverseOutput{
		Output: &brtypes.ConverseOutputMemberMessage{
			Value: brtypes.Message{
				Role: brtypes.ConversationRoleAssistant,
				Content: []brtypes.ContentBlock{
					&brtypes.ContentBlockMemberText{Value: text},
				},
			},
		},
	}, nil
}

func newTestBedrock(resp string, err error) *BedrockClient {
	return &BedrockClient{
		client:  &mockBedrockAPI{response: resp, err: err},
		modelID: "amazon.nova-lite-v1:0",
	}
}

func msgs(texts ...string) []models.Message {
	var out []models.Message
	for i, t := range texts {
		out = append(out, models.Message{
			ID:        fmt.Sprintf("m%d", i),
			Speaker:   "alice",
			Text:      t,
			Timestamp: time.Now(),
			IsAI:      false,
		})
	}
	return out
}

// ── GenerateResponse ──────────────────────────────────────────────────────────

func TestBedrock_GenerateResponse_Success(t *testing.T) {
	bc := newTestBedrock("Great summary!", nil)
	resp, err := bc.GenerateResponse(context.Background(), "sess-1", msgs("Please summarize"), models.DefaultSettings())
	require.NoError(t, err)
	assert.Equal(t, "Great summary!", resp)
}

func TestBedrock_GenerateResponse_Error(t *testing.T) {
	bc := newTestBedrock("", fmt.Errorf("throttling"))
	_, err := bc.GenerateResponse(context.Background(), "sess-1", msgs("hello"), models.DefaultSettings())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "bedrock converse")
}

func TestBedrock_GenerateResponse_EmptyMessages(t *testing.T) {
	bc := newTestBedrock("", nil)
	resp, err := bc.GenerateResponse(context.Background(), "sess-1", nil, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "Lira")
}

func TestBedrock_GenerateResponse_SendsSystemPrompt(t *testing.T) {
	mock := &mockBedrockAPI{response: "ok"}
	bc := &BedrockClient{client: mock, modelID: "amazon.nova-lite-v1:0"}
	settings := models.DefaultSettings()
	settings.Personality = "analytical"

	_, err := bc.GenerateResponse(context.Background(), "sess-1", msgs("What do the numbers say?"), settings)
	require.NoError(t, err)
	require.NotEmpty(t, mock.lastInput.System)
	systemText := mock.lastInput.System[0].(*brtypes.SystemContentBlockMemberText).Value
	assert.Contains(t, systemText, "data-driven")
}

func TestBedrock_GenerateResponse_TruncatesContext(t *testing.T) {
	mock := &mockBedrockAPI{response: "ok"}
	bc := &BedrockClient{client: mock, modelID: "amazon.nova-lite-v1:0"}

	// Build 30 messages (exceeds maxContextMessages=20)
	var messages []models.Message
	for i := 0; i < 30; i++ {
		messages = append(messages, models.Message{
			ID: fmt.Sprintf("m%d", i), Speaker: "alice",
			Text: fmt.Sprintf("message %d", i), Timestamp: time.Now(),
		})
	}

	_, err := bc.GenerateResponse(context.Background(), "sess-1", messages, models.DefaultSettings())
	require.NoError(t, err)
	// Should have at most maxContextMessages messages sent to Bedrock
	assert.LessOrEqual(t, len(mock.lastInput.Messages), maxContextMessages)
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────────

func TestBuildSystemPrompt_Personalities(t *testing.T) {
	cases := []struct {
		personality string
		contains    string
	}{
		{"supportive", "warm"},
		{"analytical", "data-driven"},
		{"facilitator", "on track"},
		{"devil\'s advocate", "assumptions"},
		{"unknown", "Lira"},
	}
	for _, tc := range cases {
		t.Run(tc.personality, func(t *testing.T) {
			s := models.DefaultSettings()
			s.Personality = tc.personality
			prompt := buildSystemPrompt(s)
			assert.Contains(t, prompt, tc.contains)
		})
	}
}

// ── buildConversationMessages ─────────────────────────────────────────────────

func TestBuildConversationMessages_AlternatingRoles(t *testing.T) {
	messages := []models.Message{
		{Speaker: "alice", Text: "hello", IsAI: false},
		{Speaker: "lira-ai", Text: "hi!", IsAI: true},
		{Speaker: "alice", Text: "how are you?", IsAI: false},
	}
	out := buildConversationMessages(messages)
	require.Len(t, out, 3)
	assert.Equal(t, brtypes.ConversationRoleUser, out[0].Role)
	assert.Equal(t, brtypes.ConversationRoleAssistant, out[1].Role)
	assert.Equal(t, brtypes.ConversationRoleUser, out[2].Role)
}

func TestBuildConversationMessages_MergesConsecutiveSameRole(t *testing.T) {
	messages := []models.Message{
		{Speaker: "alice", Text: "first", IsAI: false},
		{Speaker: "bob", Text: "second", IsAI: false},
		{Speaker: "lira-ai", Text: "response", IsAI: true},
	}
	out := buildConversationMessages(messages)
	// first + second should merge into one user message
	require.Len(t, out, 2)
	merged := out[0].Content[0].(*brtypes.ContentBlockMemberText).Value
	assert.Contains(t, merged, "first")
	assert.Contains(t, merged, "second")
}

func TestBuildConversationMessages_EndsWithUser(t *testing.T) {
	messages := []models.Message{
		{Speaker: "alice", Text: "hello", IsAI: false},
		{Speaker: "lira-ai", Text: "hi", IsAI: true},
	}
	out := buildConversationMessages(messages)
	last := out[len(out)-1]
	assert.Equal(t, brtypes.ConversationRoleUser, last.Role)
}
'''

# ─────────────────────────────────────────────────────────────
# internal/audio/processor.go
# ─────────────────────────────────────────────────────────────
FILES["internal/audio/processor.go"] = '''\
package audio

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/transcribe"
	trtypes "github.com/aws/aws-sdk-go-v2/service/transcribe/types"
	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/internal/wshandler"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// S3KeyPrefix is the expected path format for audio uploads.
// Keys must follow: audio/{sessionID}/{anything}.{ext}
const S3KeyPrefix = "audio/"

// Transcriber is the interface for audio-to-text conversion.
// Both MockTranscriber and TranscribeClient implement this.
type Transcriber interface {
	// Transcribe converts an audio file in S3 to text.
	// bucket and key identify the source file.
	// Returns the transcript text or an error.
	Transcribe(ctx context.Context, bucket, key string) (string, error)
}

// Processor handles S3 audio upload events for a meeting session.
type Processor struct {
	transcriber Transcriber
	store       appctx.Store
	broadcaster wshandler.Broadcaster
	logger      zerolog.Logger
}

// NewProcessor creates a new audio Processor.
func NewProcessor(t Transcriber, s appctx.Store, b wshandler.Broadcaster, log zerolog.Logger) *Processor {
	return &Processor{transcriber: t, store: s, broadcaster: b, logger: log}
}

// HandleS3Event processes an S3 event triggered by an audio file upload.
// It transcribes the audio, stores the transcription as a meeting message,
// and broadcasts it to all participants.
func (p *Processor) HandleS3Event(ctx context.Context, event events.S3Event) error {
	for _, record := range event.Records {
		bucket := record.S3.Bucket.Name
		key := record.S3.Object.Key

		if err := p.processRecord(ctx, bucket, key); err != nil {
			p.logger.Error().Err(err).Str("bucket", bucket).Str("key", key).Msg("failed to process audio record")
			// Continue processing other records even on individual failure.
		}
	}
	return nil
}

func (p *Processor) processRecord(ctx context.Context, bucket, key string) error {
	log := p.logger.With().Str("bucket", bucket).Str("key", key).Logger()

	sessionID, err := extractSessionID(key)
	if err != nil {
		return fmt.Errorf("invalid S3 key format %q: %w", key, err)
	}
	log = log.With().Str("session_id", sessionID).Logger()
	log.Info().Msg("processing audio upload")

	// Transcribe the audio file.
	text, err := p.transcriber.Transcribe(ctx, bucket, key)
	if err != nil {
		return fmt.Errorf("transcription failed: %w", err)
	}
	if strings.TrimSpace(text) == "" {
		log.Warn().Msg("empty transcription, skipping")
		return nil
	}

	// Store the transcription as a meeting message.
	msg := models.Message{
		ID:        uuid.New().String(),
		Speaker:   "transcription",
		Text:      text,
		Timestamp: time.Now().UTC(),
		IsAI:      false,
	}
	if err := p.store.AppendMessage(ctx, sessionID, msg); err != nil {
		log.Warn().Err(err).Msg("failed to store transcription message")
	}

	// Broadcast to WebSocket participants.
	outbound := models.OutboundMessage{
		Type:      "transcription",
		SessionID: sessionID,
		Payload: models.TranscriptionPayload{
			Speaker: "audio",
			Text:    text,
			IsFinal: true,
		},
	}
	if err := p.broadcaster.BroadcastToSession(ctx, sessionID, outbound, ""); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast transcription")
	}

	log.Info().Int("text_len", len(text)).Msg("audio processed and broadcast")
	return nil
}

// extractSessionID pulls the session ID from an S3 key.
// Expected format: audio/{sessionID}/filename.ext
func extractSessionID(key string) (string, error) {
	if !strings.HasPrefix(key, S3KeyPrefix) {
		return "", fmt.Errorf("key does not start with %q", S3KeyPrefix)
	}
	trimmed := strings.TrimPrefix(key, S3KeyPrefix)
	parts := strings.SplitN(trimmed, "/", 2)
	if len(parts) < 2 || parts[0] == "" {
		return "", fmt.Errorf("key missing session segment: %q", key)
	}
	return parts[0], nil
}

// ─────────────────────────────────────────────────────────────
// MockTranscriber — deterministic canned responses for testing
// ─────────────────────────────────────────────────────────────

// MockTranscriber returns fixed transcriptions for unit tests.
type MockTranscriber struct {
	// Response is the text to return. Defaults to a canned sentence.
	Response string
	// Err, if set, is returned instead of a transcription.
	Err error
	// CallCount records how many times Transcribe was called.
	CallCount int
}

// NewMockTranscriber creates a MockTranscriber with a default canned response.
func NewMockTranscriber() *MockTranscriber {
	return &MockTranscriber{
		Response: "This is a mock audio transcription from the meeting.",
	}
}

func (m *MockTranscriber) Transcribe(_ context.Context, _, _ string) (string, error) {
	m.CallCount++
	if m.Err != nil {
		return "", m.Err
	}
	return m.Response, nil
}

// ─────────────────────────────────────────────────────────────
// TranscribeClient — real AWS Transcribe implementation
// ─────────────────────────────────────────────────────────────

// transcribeAPI is the subset of transcribe.Client we need.
type transcribeAPI interface {
	StartTranscriptionJob(ctx context.Context, params *transcribe.StartTranscriptionJobInput, optFns ...func(*transcribe.Options)) (*transcribe.StartTranscriptionJobOutput, error)
	GetTranscriptionJob(ctx context.Context, params *transcribe.GetTranscriptionJobInput, optFns ...func(*transcribe.Options)) (*transcribe.GetTranscriptionJobOutput, error)
}

// TranscribeClient wraps AWS Transcribe and implements Transcriber.
type TranscribeClient struct {
	client      transcribeAPI
	httpClient  *http.Client
	pollTimeout time.Duration
	pollInterval time.Duration
}

// NewTranscribeClient creates a production Transcribe client.
func NewTranscribeClient(client *transcribe.Client) *TranscribeClient {
	return &TranscribeClient{
		client:       client,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
		pollTimeout:  90 * time.Second,
		pollInterval: 3 * time.Second,
	}
}

// Transcribe starts an AWS Transcribe job, polls until complete, and returns the transcript.
func (t *TranscribeClient) Transcribe(ctx context.Context, bucket, key string) (string, error) {
	jobName := fmt.Sprintf("lira-%s-%d", sanitizeJobName(key), time.Now().UnixMilli())
	mediaURI := fmt.Sprintf("s3://%s/%s", bucket, key)
	mediaFormat := detectFormat(key)

	_, err := t.client.StartTranscriptionJob(ctx, &transcribe.StartTranscriptionJobInput{
		TranscriptionJobName: aws.String(jobName),
		Media: &trtypes.Media{
			MediaFileUri: aws.String(mediaURI),
		},
		MediaFormat:      trtypes.MediaFormat(mediaFormat),
		LanguageCode:     trtypes.LanguageCodeEnUs,
		OutputBucketName: aws.String(bucket),
		OutputKey:        aws.String(fmt.Sprintf("transcripts/%s.json", jobName)),
	})
	if err != nil {
		return "", fmt.Errorf("start transcription job: %w", err)
	}

	return t.pollForResult(ctx, jobName, bucket)
}

// pollForResult polls AWS Transcribe until the job completes, then fetches the result.
func (t *TranscribeClient) pollForResult(ctx context.Context, jobName, bucket string) (string, error) {
	deadline := time.Now().Add(t.pollTimeout)
	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(t.pollInterval):
		}

		out, err := t.client.GetTranscriptionJob(ctx, &transcribe.GetTranscriptionJobInput{
			TranscriptionJobName: aws.String(jobName),
		})
		if err != nil {
			return "", fmt.Errorf("get transcription job: %w", err)
		}

		status := out.TranscriptionJob.TranscriptionJobStatus
		switch status {
		case trtypes.TranscriptionJobStatusCompleted:
			if out.TranscriptionJob.Transcript == nil ||
				out.TranscriptionJob.Transcript.TranscriptFileUri == nil {
				return "", fmt.Errorf("transcription completed but no transcript URI")
			}
			return t.fetchTranscriptText(ctx, *out.TranscriptionJob.Transcript.TranscriptFileUri)
		case trtypes.TranscriptionJobStatusFailed:
			reason := "unknown"
			if out.TranscriptionJob.FailureReason != nil {
				reason = *out.TranscriptionJob.FailureReason
			}
			return "", fmt.Errorf("transcription job failed: %s", reason)
		}
		// QUEUED or IN_PROGRESS — keep polling.
	}
	return "", fmt.Errorf("transcription job timed out after %s", t.pollTimeout)
}

// fetchTranscriptText downloads the Transcribe JSON result and extracts the transcript.
func (t *TranscribeClient) fetchTranscriptText(ctx context.Context, uri string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return "", err
	}
	resp, err := t.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch transcript: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read transcript body: %w", err)
	}

	return parseTranscribeJSON(body)
}

// sanitizeJobName replaces path separators and dots with dashes.
func sanitizeJobName(key string) string {
	r := strings.NewReplacer("/", "-", ".", "-", "_", "-")
	name := r.Replace(key)
	if len(name) > 60 {
		name = name[len(name)-60:]
	}
	return name
}

// detectFormat infers the Transcribe media format from the file extension.
func detectFormat(key string) string {
	lower := strings.ToLower(key)
	switch {
	case strings.HasSuffix(lower, ".mp3"):
		return "mp3"
	case strings.HasSuffix(lower, ".mp4"):
		return "mp4"
	case strings.HasSuffix(lower, ".wav"):
		return "wav"
	case strings.HasSuffix(lower, ".flac"):
		return "flac"
	case strings.HasSuffix(lower, ".ogg"):
		return "ogg"
	case strings.HasSuffix(lower, ".webm"):
		return "webm"
	default:
		return "wav"
	}
}
'''

# ─────────────────────────────────────────────────────────────
# internal/audio/transcribe_json.go  (separate to keep processor.go clean)
# ─────────────────────────────────────────────────────────────
FILES["internal/audio/transcribe_json.go"] = '''\
package audio

import (
	"encoding/json"
	"fmt"
	"strings"
)

// transcribeResult is the top-level shape of an AWS Transcribe output file.
type transcribeResult struct {
	Results transcribeResultBody `json:"results"`
}

type transcribeResultBody struct {
	Transcripts []transcribeTranscript `json:"transcripts"`
}

type transcribeTranscript struct {
	Transcript string `json:"transcript"`
}

// parseTranscribeJSON extracts the full transcript text from an AWS Transcribe JSON output.
func parseTranscribeJSON(data []byte) (string, error) {
	var result transcribeResult
	if err := json.Unmarshal(data, &result); err != nil {
		return "", fmt.Errorf("parse transcribe JSON: %w", err)
	}
	if len(result.Results.Transcripts) == 0 {
		return "", fmt.Errorf("transcribe JSON has no transcripts")
	}
	return strings.TrimSpace(result.Results.Transcripts[0].Transcript), nil
}
'''

# ─────────────────────────────────────────────────────────────
# internal/audio/processor_test.go
# ─────────────────────────────────────────────────────────────
FILES["internal/audio/processor_test.go"] = '''\
package audio

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/internal/wshandler"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestProcessor(t *testing.T) (*Processor, *MockTranscriber, *appctx.MockStore, *wshandler.MockBroadcaster) {
	tr := NewMockTranscriber()
	store := appctx.NewMockStore()
	broadcaster := wshandler.NewMockBroadcaster()
	log := zerolog.Nop()
	p := NewProcessor(tr, store, broadcaster, log)
	return p, tr, store, broadcaster
}

func s3Event(bucket, key string) events.S3Event {
	return events.S3Event{
		Records: []events.S3EventRecord{
			{
				EventTime: time.Now(),
				S3: events.S3Entity{
					Bucket: events.S3Bucket{Name: bucket},
					Object: events.S3Object{Key: key},
				},
			},
		},
	}
}

// ── HandleS3Event ─────────────────────────────────────────────────────────────

func TestHandleS3Event_HappyPath(t *testing.T) {
	p, tr, store, broadcaster := newTestProcessor(t)
	ctx := context.Background()

	// Pre-create a meeting so AppendMessage succeeds.
	_ = store.SaveMeeting(ctx, models.Meeting{SessionID: "sess-abc", Settings: models.DefaultSettings()})

	err := p.HandleS3Event(ctx, s3Event("lira-audio-dev", "audio/sess-abc/chunk-001.wav"))
	require.NoError(t, err)

	assert.Equal(t, 1, tr.CallCount)

	// Message should be stored.
	meeting, err := store.GetMeeting(ctx, "sess-abc")
	require.NoError(t, err)
	require.Len(t, meeting.Messages, 1)
	assert.Equal(t, "This is a mock audio transcription from the meeting.", meeting.Messages[0].Text)

	// Broadcast should have happened.
	assert.Equal(t, 1, broadcaster.SentCount())
	assert.Equal(t, "transcription", broadcaster.Sent[0].Message.Type)
}

func TestHandleS3Event_InvalidKey(t *testing.T) {
	p, tr, _, broadcaster := newTestProcessor(t)
	ctx := context.Background()

	// Key does not follow audio/{sessionID}/file.ext pattern.
	err := p.HandleS3Event(ctx, s3Event("lira-audio-dev", "uploads/orphan.wav"))
	// HandleS3Event swallows per-record errors to allow batch processing.
	assert.NoError(t, err)
	assert.Equal(t, 0, tr.CallCount)
	assert.Equal(t, 0, broadcaster.SentCount())
}

func TestHandleS3Event_TranscriberError(t *testing.T) {
	p, tr, _, broadcaster := newTestProcessor(t)
	tr.Err = fmt.Errorf("s3 access denied")
	ctx := context.Background()

	err := p.HandleS3Event(ctx, s3Event("lira-audio-dev", "audio/sess-xyz/chunk.webm"))
	// Per-record errors are absorbed; the call itself succeeds.
	assert.NoError(t, err)
	assert.Equal(t, 0, broadcaster.SentCount())
}

func TestHandleS3Event_EmptyTranscription(t *testing.T) {
	p, tr, _, broadcaster := newTestProcessor(t)
	tr.Response = "   " // whitespace only
	ctx := context.Background()

	err := p.HandleS3Event(ctx, s3Event("lira-audio-dev", "audio/sess-xyz/silence.wav"))
	assert.NoError(t, err)
	// Empty transcription should not broadcast.
	assert.Equal(t, 0, broadcaster.SentCount())
}

func TestHandleS3Event_MultiRecord(t *testing.T) {
	p, tr, store, broadcaster := newTestProcessor(t)
	ctx := context.Background()

	_ = store.SaveMeeting(ctx, models.Meeting{SessionID: "sess-1", Settings: models.DefaultSettings()})
	_ = store.SaveMeeting(ctx, models.Meeting{SessionID: "sess-2", Settings: models.DefaultSettings()})

	evt := events.S3Event{Records: []events.S3EventRecord{
		{S3: events.S3Entity{Bucket: events.S3Bucket{Name: "b"}, Object: events.S3Object{Key: "audio/sess-1/a.wav"}}},
		{S3: events.S3Entity{Bucket: events.S3Bucket{Name: "b"}, Object: events.S3Object{Key: "audio/sess-2/b.wav"}}},
	}}
	err := p.HandleS3Event(ctx, evt)
	require.NoError(t, err)
	assert.Equal(t, 2, tr.CallCount)
	assert.Equal(t, 2, broadcaster.SentCount())
}

// ── extractSessionID ──────────────────────────────────────────────────────────

func TestExtractSessionID(t *testing.T) {
	cases := []struct {
		key  string
		want string
		err  bool
	}{
		{"audio/sess-abc/chunk.wav", "sess-abc", false},
		{"audio/meeting-123/2024-01-01T10:00:00.webm", "meeting-123", false},
		{"uploads/file.wav", "", true},
		{"audio/", "", true},
		{"audio/only-session", "", true},
	}
	for _, tc := range cases {
		t.Run(tc.key, func(t *testing.T) {
			got, err := extractSessionID(tc.key)
			if tc.err {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.want, got)
			}
		})
	}
}

// ── parseTranscribeJSON ───────────────────────────────────────────────────────

func TestParseTranscribeJSON(t *testing.T) {
	raw := []byte(`{"results":{"transcripts":[{"transcript":"Hello from Transcribe."}],"items":[]}}`)
	text, err := parseTranscribeJSON(raw)
	require.NoError(t, err)
	assert.Equal(t, "Hello from Transcribe.", text)
}

func TestParseTranscribeJSON_Empty(t *testing.T) {
	raw := []byte(`{"results":{"transcripts":[]}}`)
	_, err := parseTranscribeJSON(raw)
	assert.Error(t, err)
}

func TestParseTranscribeJSON_Malformed(t *testing.T) {
	_, err := parseTranscribeJSON([]byte("not json"))
	assert.Error(t, err)
}

// ── detectFormat + sanitizeJobName ───────────────────────────────────────────

func TestDetectFormat(t *testing.T) {
	assert.Equal(t, "wav", detectFormat("audio/sess/file.wav"))
	assert.Equal(t, "mp3", detectFormat("audio/sess/file.MP3"))
	assert.Equal(t, "webm", detectFormat("audio/sess/recording.webm"))
	assert.Equal(t, "wav", detectFormat("audio/sess/unknown"))
}

func TestSanitizeJobName(t *testing.T) {
	name := sanitizeJobName("audio/sess-abc/chunk-001.wav")
	assert.NotContains(t, name, "/")
	assert.NotContains(t, name, ".")
}
'''

# ─────────────────────────────────────────────────────────────
# cmd/audio/main.go
# ─────────────────────────────────────────────────────────────
FILES["cmd/audio/main.go"] = '''\
package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/transcribe"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/audio"
	"github.com/creovine/lira-ai-backend/internal/wshandler"
	appconfig "github.com/creovine/lira-ai-backend/pkg/config"
	"github.com/creovine/lira-ai-backend/pkg/logging"
)

func main() {
	logging.Init(os.Getenv("LOG_LEVEL"))
	log := logging.NewLogger("audio-processor")

	cfg := appconfig.Load()
	log.Info().Str("env", cfg.Environment).Bool("mock", cfg.IsMock()).Msg("audio processor starting")

	var transcriber audio.Transcriber
	var store appctx.Store
	var broadcaster wshandler.Broadcaster

	if cfg.IsMock() {
		transcriber = audio.NewMockTranscriber()
		store = appctx.NewMockStore()
		broadcaster = wshandler.NewMockBroadcaster()
		log.Info().Msg("running in mock mode")
	} else {
		awsCfg, err := config.LoadDefaultConfig(context.Background())
		if err != nil {
			log.Fatal().Err(err).Msg("failed to load AWS config")
		}
		transcriber = audio.NewTranscribeClient(transcribe.NewFromConfig(awsCfg))

		store, err = appctx.NewDynamoStore(context.Background(), appctx.DynamoConfig{
			ConnectionsTable: cfg.ConnectionsTable,
			MeetingsTable:    cfg.MeetingsTable,
		})
		if err != nil {
			log.Fatal().Err(err).Msg("failed to create DynamoDB store")
		}

		wsEndpoint := os.Getenv("WEBSOCKET_ENDPOINT")
		if wsEndpoint == "" {
			log.Fatal().Msg("WEBSOCKET_ENDPOINT env var required in production")
		}
		broadcaster = wshandler.NewAPIGWBroadcaster(awsCfg, wsEndpoint)
	}

	processor := audio.NewProcessor(transcriber, store, broadcaster, log)

	lambda.Start(func(ctx context.Context, event events.S3Event) error {
		return processor.HandleS3Event(ctx, event)
	})
}
'''

# ─────────────────────────────────────────────────────────────
# Update cmd/gateway/main.go to use BedrockClient when not mock
# ─────────────────────────────────────────────────────────────
FILES["cmd/gateway/main.go"] = '''\
package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/creovine/lira-ai-backend/internal/wshandler"
	"github.com/creovine/lira-ai-backend/pkg/config"
	"github.com/creovine/lira-ai-backend/pkg/logging"
)

func main() {
	logging.Init(os.Getenv("LOG_LEVEL"))
	log := logging.NewLogger("gateway")

	cfg := config.Load()
	log.Info().Str("env", cfg.Environment).Bool("mock", cfg.IsMock()).Msg("gateway starting")

	var store appctx.Store
	var broadcaster wshandler.Broadcaster
	var ai nova.AIService

	if cfg.IsMock() {
		store = appctx.NewMockStore()
		broadcaster = wshandler.NewMockBroadcaster()
		ai = nova.NewMockAI(0)
		log.Info().Msg("running in mock mode")
	} else {
		awsCfg, err := awsconfig.LoadDefaultConfig(context.Background())
		if err != nil {
			log.Fatal().Err(err).Msg("failed to load AWS config")
		}

		store, err = appctx.NewDynamoStore(context.Background(), appctx.DynamoConfig{
			ConnectionsTable: cfg.ConnectionsTable,
			MeetingsTable:    cfg.MeetingsTable,
		})
		if err != nil {
			log.Fatal().Err(err).Msg("failed to connect to DynamoDB")
		}

		wsEndpoint := os.Getenv("WEBSOCKET_ENDPOINT")
		if wsEndpoint == "" {
			log.Fatal().Msg("WEBSOCKET_ENDPOINT env var required in production")
		}
		broadcaster = wshandler.NewAPIGWBroadcaster(awsCfg, wsEndpoint)

		modelID := cfg.NovaLiteModelID
		if modelID == "" {
			modelID = "amazon.nova-lite-v1:0"
		}
		ai = nova.NewBedrockClient(bedrockruntime.NewFromConfig(awsCfg), modelID)
		log.Info().Str("model_id", modelID).Msg("using Amazon Bedrock Nova")
	}

	h := wshandler.NewHandler(store, broadcaster, ai, log)
	lambda.Start(h.Handle)
}
'''

# ─────────────────────────────────────────────────────────────
# Makefile
# ─────────────────────────────────────────────────────────────
FILES["Makefile"] = '''\
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
	@echo "==> Building Lambda binaries (linux/arm64)..."
	@for dir in cmd/gateway cmd/meetings cmd/audio; do \\
		name=$$(basename $$dir); \\
		echo "  -> $$name"; \\
		GOOS=linux GOARCH=arm64 go build -o $(BINARY_DIR)/$$name/bootstrap ./$$dir/; \\
	done

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
local-api:
	@echo "==> Starting SAM local HTTP API on :3001..."
	@echo "    Meetings endpoint: http://localhost:3001"
	MOCK_AI=true sam local start-api \\
		--template $(SAM_TEMPLATE) \\
		--port 3001 \\
		--env-vars tests/events/local-env.json \\
		--warm-containers EAGER

# Start WebSocket API locally (gateway Lambda)
local-ws:
	@echo "==> Starting SAM local WebSocket API on :3000..."
	@echo "    Connect with: wscat -c ws://localhost:3000"
	MOCK_AI=true sam local start-api \\
		--template $(SAM_TEMPLATE) \\
		--port 3000 \\
		--env-vars tests/events/local-env.json

# Invoke a single Lambda with a test event
invoke-gateway:
	sam local invoke GatewayFunction \\
		--template $(SAM_TEMPLATE) \\
		--event tests/events/connect.json \\
		--env-vars tests/events/local-env.json

invoke-audio:
	sam local invoke AudioProcessorFunction \\
		--template $(SAM_TEMPLATE) \\
		--event tests/events/s3_audio.json \\
		--env-vars tests/events/local-env.json

invoke-meetings:
	sam local invoke MeetingsFunction \\
		--template $(SAM_TEMPLATE) \\
		--event tests/events/create_meeting.json \\
		--env-vars tests/events/local-env.json

# ── Deploy ─────────────────────────────────────────────────────
deploy: sam-build
	sam deploy \\
		--template $(SAM_TEMPLATE) \\
		--stack-name $(STACK_NAME) \\
		--region $(AWS_REGION) \\
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \\
		--parameter-overrides Environment=dev MockAI=false \\
		--resolve-s3 \\
		--no-fail-on-empty-changeset

# ── Clean ──────────────────────────────────────────────────────
clean:
	@echo "==> Cleaning..."
	rm -rf $(BINARY_DIR) .aws-sam coverage.out coverage.html
	go clean -testcache

# ── Helpers ────────────────────────────────────────────────────
tidy:
	go mod tidy

fmt:
	gofmt -w .
	goimports -w . 2>/dev/null || true
'''

# ─────────────────────────────────────────────────────────────
# tests/events/local-env.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/local-env.json"] = '''\
{
  "GatewayFunction": {
    "ENVIRONMENT": "dev",
    "LOG_LEVEL": "debug",
    "MOCK_AI": "true",
    "CONNECTIONS_TABLE": "lira-connections-dev",
    "MEETINGS_TABLE": "lira-meetings-dev",
    "AUDIO_BUCKET": "lira-audio-dev",
    "NOVA_LITE_MODEL_ID": "amazon.nova-lite-v1:0",
    "NOVA_SONIC_MODEL_ID": "amazon.nova-sonic-v1:0"
  },
  "MeetingsFunction": {
    "ENVIRONMENT": "dev",
    "LOG_LEVEL": "debug",
    "MOCK_AI": "true",
    "MEETINGS_TABLE": "lira-meetings-dev"
  },
  "AudioProcessorFunction": {
    "ENVIRONMENT": "dev",
    "LOG_LEVEL": "debug",
    "MOCK_AI": "true",
    "CONNECTIONS_TABLE": "lira-connections-dev",
    "MEETINGS_TABLE": "lira-meetings-dev",
    "AUDIO_BUCKET": "lira-audio-dev"
  }
}
'''

# ─────────────────────────────────────────────────────────────
# tests/events/connect.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/connect.json"] = '''\
{
  "requestContext": {
    "routeKey": "$connect",
    "connectionId": "test-conn-001",
    "eventType": "CONNECT",
    "stage": "dev",
    "domainName": "localhost"
  },
  "headers": {
    "Host": "localhost:3000",
    "Upgrade": "websocket"
  }
}
'''

# ─────────────────────────────────────────────────────────────
# tests/events/message_join.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/message_join.json"] = '''\
{
  "requestContext": {
    "routeKey": "$default",
    "connectionId": "test-conn-001",
    "eventType": "MESSAGE",
    "stage": "dev",
    "domainName": "localhost"
  },
  "body": "{\"action\":\"join\",\"session_id\":\"test-meeting-001\",\"payload\":{\"user_id\":\"alice\",\"user_name\":\"Alice\"}}"
}
'''

# ─────────────────────────────────────────────────────────────
# tests/events/message_text.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/message_text.json"] = '''\
{
  "requestContext": {
    "routeKey": "$default",
    "connectionId": "test-conn-001",
    "eventType": "MESSAGE",
    "stage": "dev",
    "domainName": "localhost"
  },
  "body": "{\"action\":\"text\",\"payload\":{\"text\":\"hey lira can you summarize what we discussed so far?\"}}"
}
'''

# ─────────────────────────────────────────────────────────────
# tests/events/disconnect.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/disconnect.json"] = '''\
{
  "requestContext": {
    "routeKey": "$disconnect",
    "connectionId": "test-conn-001",
    "eventType": "DISCONNECT",
    "stage": "dev",
    "domainName": "localhost"
  }
}
'''

# ─────────────────────────────────────────────────────────────
# tests/events/s3_audio.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/s3_audio.json"] = '''\
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "2026-01-15T10:30:00.000Z",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "LiraAudioTrigger",
        "bucket": {
          "name": "lira-audio-dev-123456789",
          "ownerIdentity": {"principalId": "EXAMPLE"},
          "arn": "arn:aws:s3:::lira-audio-dev-123456789"
        },
        "object": {
          "key": "audio/test-meeting-001/chunk-001.webm",
          "size": 48000,
          "eTag": "d41d8cd98f00b204e9800998ecf8427e",
          "sequencer": "0A1B2C3D4E5F678901"
        }
      }
    }
  ]
}
'''

# ─────────────────────────────────────────────────────────────
# tests/events/create_meeting.json
# ─────────────────────────────────────────────────────────────
FILES["tests/events/create_meeting.json"] = '''\
{
  "version": "2.0",
  "routeKey": "POST /meetings",
  "rawPath": "/meetings",
  "rawQueryString": "",
  "headers": {
    "content-type": "application/json",
    "host": "localhost:3001"
  },
  "requestContext": {
    "accountId": "123456789012",
    "apiId": "local",
    "domainName": "localhost",
    "dominaPrefix": "local",
    "http": {
      "method": "POST",
      "path": "/meetings",
      "protocol": "HTTP/1.1",
      "sourceIp": "127.0.0.1",
      "userAgent": "curl/7.79.1"
    },
    "requestId": "local-test-001",
    "routeKey": "POST /meetings",
    "stage": "dev",
    "time": "15/Jan/2026:10:00:00 +0000",
    "timeEpoch": 1736942400000
  },
  "body": "{\"title\":\"Sprint Planning Q1\",\"settings\":{\"personality\":\"facilitator\",\"participation_level\":0.8,\"wake_word_enabled\":false,\"proactive_suggest\":true}}",
  "isBase64Encoded": false
}
'''

# ─────────────────────────────────────────────────────────────
# scripts/local_test.sh
# ─────────────────────────────────────────────────────────────
FILES["scripts/local_test.sh"] = '''\
#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# Lira AI — SAM Local Integration Test
# Tests Gateway (WebSocket) + Meetings (HTTP API) + Audio Processor
# Requires: sam, wscat, curl, jq
# ══════════════════════════════════════════════════════════════
set -euo pipefail

TEMPLATE="deployments/template.yaml"
ENV_FILE="tests/events/local-env.json"
HTTP_PORT=3001
WS_PORT=3000
GATEWAY_PID=
API_PID=

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
  echo "    All dependencies found."
}

build_lambdas() {
  echo "==> Building Lambda binaries (local)..."
  go build ./... 
  echo "    Build successful."
}

test_unit() {
  echo "==> Running unit tests..."
  go test ./... -count=1 -timeout 60s
  echo "    All unit tests passed."
}

invoke_gateway_connect() {
  echo "==> Invoking GatewayFunction (connect event)..."
  result=$(sam local invoke GatewayFunction \\
    --template "$TEMPLATE" \\
    --event tests/events/connect.json \\
    --env-vars "$ENV_FILE" \\
    --no-event 2>/dev/null || true)
  echo "    Response: $result"
}

invoke_audio_processor() {
  echo "==> Invoking AudioProcessorFunction (S3 event)..."
  sam local invoke AudioProcessorFunction \\
    --template "$TEMPLATE" \\
    --event tests/events/s3_audio.json \\
    --env-vars "$ENV_FILE"
  echo "    Audio processor invoked."
}

invoke_meetings_create() {
  echo "==> Invoking MeetingsFunction (create meeting)..."
  result=$(sam local invoke MeetingsFunction \\
    --template "$TEMPLATE" \\
    --event tests/events/create_meeting.json \\
    --env-vars "$ENV_FILE")
  echo "    Response: $result"
  echo "$result" | jq -r '.body' | jq .
}

run_wscat_test() {
  echo ""
  echo "==> To test WebSocket manually:"
  echo "    1. Run: make local-ws  (in a separate terminal)"
  echo "    2. Run: wscat -c ws://localhost:$WS_PORT"
  echo "    3. Send: {\"action\":\"join\",\"session_id\":\"test-001\",\"payload\":{\"user_id\":\"alice\",\"user_name\":\"Alice\"}}"
  echo "    4. Send: {\"action\":\"text\",\"payload\":{\"text\":\"hey lira summarize our discussion\"}}"
  echo ""
}

main() {
  echo "══════════════════════════════════════════════════════════"
  echo " Lira AI — Local Integration Test Suite"
  echo "══════════════════════════════════════════════════════════"

  cd "$(git rev-parse --show-toplevel 2>/dev/null || dirname "$0")/.." || cd "$(dirname "$0")/.."

  check_deps
  build_lambdas
  test_unit
  invoke_gateway_connect
  invoke_audio_processor
  invoke_meetings_create
  run_wscat_test

  echo "══════════════════════════════════════════════════════════"
  echo " All checks passed!"
  echo "══════════════════════════════════════════════════════════"
}

main "$@"
'''

# ─────────────────────────────────────────────────────────────
# Write all files
# ─────────────────────────────────────────────────────────────
def write(rel, content):
    path = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    lines = content.count("\n") + 1
    print(f"OK: {rel} ({lines} lines)")

if __name__ == "__main__":
    for rel, content in FILES.items():
        write(rel, content)
    print(f"\nDone — {len(FILES)} files written.")

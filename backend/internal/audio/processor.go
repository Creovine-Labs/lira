package audio

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/transcribe"
	trtypes "github.com/aws/aws-sdk-go-v2/service/transcribe/types"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/creovine/lira-ai-backend/internal/sentiment"
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
	broadcaster appctx.Broadcaster
	aiService   nova.AIService // optional; nil skips AI response generation
	logger      zerolog.Logger
}

// NewProcessor creates a new audio Processor.
func NewProcessor(t Transcriber, s appctx.Store, b appctx.Broadcaster, log zerolog.Logger) *Processor {
	return &Processor{transcriber: t, store: s, broadcaster: b, logger: log}
}

// WithAI attaches an AI service so the processor generates an AI response after
// each transcription (mirrors the WebSocket text flow).
func (p *Processor) WithAI(ai nova.AIService) *Processor {
	p.aiService = ai
	return p
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
		Sentiment: sentiment.Tag(text),
	}
	if err := p.store.AppendMessage(ctx, sessionID, msg); err != nil {
		log.Warn().Err(err).Msg("failed to store transcription message")
	}

	// Broadcast transcription to WebSocket participants.
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

	// Optionally generate an AI response if an AI service is wired in.
	if p.aiService != nil {
		p.generateAIResponse(ctx, sessionID, msg, log)
	}

	log.Info().Int("text_len", len(text)).Msg("audio processed and broadcast")
	return nil
}

// generateAIResponse checks the ShouldAIRespond policy and, if appropriate,
// generates a response, stores it, and broadcasts it to the session.
func (p *Processor) generateAIResponse(ctx context.Context, sessionID string, userMsg models.Message, log zerolog.Logger) {
	meeting, err := p.store.GetMeeting(ctx, sessionID)
	if err != nil {
		log.Warn().Err(err).Msg("could not load meeting for AI response")
		return
	}

	if !nova.ShouldAIRespond(nova.DecisionInput{Meeting: meeting, NewMessage: userMsg}) {
		log.Debug().Msg("AI response suppressed by policy (audio path)")
		return
	}

	aiText, err := p.aiService.GenerateResponse(ctx, sessionID, meeting.Messages, meeting.Settings)
	if err != nil {
		log.Warn().Err(err).Msg("AI response generation failed (audio path)")
		return
	}

	aiMsg := models.Message{
		ID:        uuid.New().String(),
		Speaker:   "lira-ai",
		Text:      aiText,
		Timestamp: time.Now().UTC(),
		IsAI:      true,
	}
	if err := p.store.AppendMessage(ctx, sessionID, aiMsg); err != nil {
		log.Warn().Err(err).Msg("failed to store AI message (audio path)")
	}

	// Update cooldown state.
	meeting.AIState.LastResponseTime = time.Now().UTC()
	meeting.AIState.ResponseCount++
	_ = p.store.SaveMeeting(ctx, meeting)

	aiOutbound := models.OutboundMessage{
		Type:      "ai_response",
		SessionID: sessionID,
		Payload: models.AIResponsePayload{
			Text:       aiText,
			Confidence: 1.0,
		},
	}
	if err := p.broadcaster.BroadcastToSession(ctx, sessionID, aiOutbound, ""); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast AI response (audio path)")
	}
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
	client       transcribeAPI
	httpClient   *http.Client
	pollTimeout  time.Duration
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
func (t *TranscribeClient) pollForResult(ctx context.Context, jobName, _ string) (string, error) {
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

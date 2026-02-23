package audio

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestProcessor(_ *testing.T) (*Processor, *MockTranscriber, *appctx.MockStore, *appctx.MockBroadcaster) {
	tr := NewMockTranscriber()
	store := appctx.NewMockStore()
	broadcaster := appctx.NewMockBroadcaster(store)
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

	// Pre-create a meeting and a connection so broadcast reaches someone.
	_ = store.SaveMeeting(ctx, models.Meeting{SessionID: "sess-abc", Settings: models.DefaultSettings()})
	_ = store.SaveConnection(ctx, models.Connection{ConnectionID: "conn-001", SessionID: "sess-abc", UserID: "alice"})

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
	_ = store.SaveConnection(ctx, models.Connection{ConnectionID: "conn-1", SessionID: "sess-1", UserID: "alice"})
	_ = store.SaveConnection(ctx, models.Connection{ConnectionID: "conn-2", SessionID: "sess-2", UserID: "bob"})

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

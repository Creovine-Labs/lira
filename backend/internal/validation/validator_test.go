package validation

import (
	"strings"
	"testing"

	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── JoinPayload ──────────────────────────────────────────────────────────────

func TestJoinPayload_Valid(t *testing.T) {
	p := models.JoinPayload{
		UserID:   "user-123",
		UserName: "Alice",
		Settings: models.MeetingSettings{ParticipationLevel: 0.5, Personality: "supportive"},
	}
	assert.NoError(t, JoinPayload(p))
}

func TestJoinPayload_MissingUserID(t *testing.T) {
	p := models.JoinPayload{UserID: ""}
	err := JoinPayload(p)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "MISSING_USER_ID", ve.Code)
}

func TestJoinPayload_BlankUserID(t *testing.T) {
	p := models.JoinPayload{UserID: "   "}
	err := JoinPayload(p)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "MISSING_USER_ID", ve.Code)
}

func TestJoinPayload_UserIDTooLong(t *testing.T) {
	p := models.JoinPayload{UserID: strings.Repeat("a", MaxUserIDLen+1)}
	err := JoinPayload(p)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "USER_ID_TOO_LONG", ve.Code)
}

func TestJoinPayload_InvalidSettings(t *testing.T) {
	p := models.JoinPayload{
		UserID:   "user-1",
		Settings: models.MeetingSettings{ParticipationLevel: 2.0},
	}
	err := JoinPayload(p)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_PARTICIPATION_LEVEL", ve.Code)
}

func TestTextPayload_Valid(t *testing.T) {
	assert.NoError(t, TextPayload(models.TextPayload{Text: "hello"}))
}

func TestTextPayload_Empty(t *testing.T) {
	err := TextPayload(models.TextPayload{Text: ""})
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "MISSING_TEXT", ve.Code)
}

func TestTextPayload_WhitespaceOnly(t *testing.T) {
	err := TextPayload(models.TextPayload{Text: "   "})
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "MISSING_TEXT", ve.Code)
}

func TestTextPayload_TooLong(t *testing.T) {
	err := TextPayload(models.TextPayload{Text: strings.Repeat("x", MaxTextLen+1)})
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "TEXT_TOO_LONG", ve.Code)
}

func TestTextPayload_ExactLimit(t *testing.T) {
	assert.NoError(t, TextPayload(models.TextPayload{Text: strings.Repeat("x", MaxTextLen)}))
}

func TestAudioPayload_Valid(t *testing.T) {
	p := models.AudioPayload{Data: "AAAA", Format: "pcm16", SampleRate: 16000}
	assert.NoError(t, AudioPayload(p))
}

func TestAudioPayload_EmptyData(t *testing.T) {
	err := AudioPayload(models.AudioPayload{Data: ""})
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "MISSING_DATA", ve.Code)
}

func TestAudioPayload_InvalidFormat(t *testing.T) {
	err := AudioPayload(models.AudioPayload{Data: "AAAA", Format: "flac"})
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_FORMAT", ve.Code)
}

func TestAudioPayload_AllValidFormats(t *testing.T) {
	for _, f := range []string{"", "pcm16", "wav", "mp3", "ogg", "webm"} {
		err := AudioPayload(models.AudioPayload{Data: "AAAA", Format: f})
		assert.NoError(t, err, "format %q should be valid", f)
	}
}

func TestAudioPayload_NegativeSampleRate(t *testing.T) {
	err := AudioPayload(models.AudioPayload{Data: "AAAA", SampleRate: -1})
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_SAMPLE_RATE", ve.Code)
}

func TestMeetingSettings_Valid(t *testing.T) {
	s := models.MeetingSettings{Personality: "analytical", ParticipationLevel: 0.7}
	assert.NoError(t, MeetingSettings(s))
}

func TestMeetingSettings_ParticipationTooHigh(t *testing.T) {
	s := models.MeetingSettings{Personality: "supportive", ParticipationLevel: 1.1}
	err := MeetingSettings(s)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_PARTICIPATION_LEVEL", ve.Code)
}

func TestMeetingSettings_ParticipationNegative(t *testing.T) {
	s := models.MeetingSettings{Personality: "supportive", ParticipationLevel: -0.1}
	err := MeetingSettings(s)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_PARTICIPATION_LEVEL", ve.Code)
}

func TestMeetingSettings_InvalidPersonality(t *testing.T) {
	s := models.MeetingSettings{Personality: "aggressive", ParticipationLevel: 0.5}
	err := MeetingSettings(s)
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_PERSONALITY", ve.Code)
}

func TestMeetingSettings_EmptyPersonalityAllowed(t *testing.T) {
	s := models.MeetingSettings{Personality: "", ParticipationLevel: 0.5}
	assert.NoError(t, MeetingSettings(s))
}

func TestSessionID_EmptyAllowed(t *testing.T) {
	assert.NoError(t, SessionID(""))
}

func TestSessionID_ValidUUID(t *testing.T) {
	assert.NoError(t, SessionID("550e8400-e29b-41d4-a716-446655440000"))
}

func TestSessionID_InvalidFormat(t *testing.T) {
	err := SessionID("not-a-uuid")
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "INVALID_SESSION_ID", ve.Code)
}

func TestSessionID_TooLong(t *testing.T) {
	err := SessionID(strings.Repeat("a", MaxSessionIDLen+1))
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "SESSION_ID_TOO_LONG", ve.Code)
}

func TestMeetingTitle_Valid(t *testing.T) {
	assert.NoError(t, MeetingTitle("Q1 Planning"))
}

func TestMeetingTitle_Empty(t *testing.T) {
	err := MeetingTitle("")
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "MISSING_TITLE", ve.Code)
}

func TestMeetingTitle_TooLong(t *testing.T) {
	err := MeetingTitle(strings.Repeat("t", MaxTitleLen+1))
	require.Error(t, err)
	var ve *ValidationError
	require.ErrorAs(t, err, &ve)
	assert.Equal(t, "TITLE_TOO_LONG", ve.Code)
}

func TestValidationError_Error(t *testing.T) {
	ve := &ValidationError{Code: "MISSING_TEXT", Detail: "text is required"}
	assert.Equal(t, "MISSING_TEXT: text is required", ve.Error())
}

// Package validation provides input validation helpers for all inbound
// WebSocket and HTTP payloads. All validators return a *ValidationError
// so callers can distinguish domain constraints from unexpected errors.
package validation

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/creovine/lira-ai-backend/internal/models"
)

// ─── constants ────────────────────────────────────────────────────────────────

const (
	MaxTextLen        = 4000
	MaxUserIDLen      = 128
	MaxUserNameLen    = 128
	MaxSessionIDLen   = 64
	MaxPersonalityLen = 64
	MaxTitleLen       = 256
	MaxFormatLen      = 16
)

// validAudioFormats lists the formats the server accepts for audio_chunk.
var validAudioFormats = map[string]bool{
	"":      true, // empty = default (pcm16)
	"pcm16": true,
	"wav":   true,
	"mp3":   true,
	"ogg":   true,
	"webm":  true,
}

// validPersonalities lists the supported AI personalities.
var validPersonalities = map[string]bool{
	"":            true, // empty = default (supportive)
	"supportive":  true,
	"analytical":  true,
	"concise":     true,
	"encouraging": true,
	"formal":      true,
}

// uuidRE matches a canonical lower-case UUID v4 string.
var uuidRE = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// ─── ValidationError ──────────────────────────────────────────────────────────

// ValidationError is returned when a payload fails a constraint. It carries a
// short machine-readable Code alongside a human-readable Detail so that
// callers can surface it directly as a WebSocket "error" event.
type ValidationError struct {
	Code   string
	Detail string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Detail)
}

func vErr(code, msg string) *ValidationError {
	return &ValidationError{Code: code, Detail: msg}
}

// ─── public validators ────────────────────────────────────────────────────────

// JoinPayload validates the payload for a "join" WebSocket action.
func JoinPayload(p models.JoinPayload) error {
	if strings.TrimSpace(p.UserID) == "" {
		return vErr("MISSING_USER_ID", "user_id is required")
	}
	if len(p.UserID) > MaxUserIDLen {
		return vErr("USER_ID_TOO_LONG",
			fmt.Sprintf("user_id must be at most %d characters", MaxUserIDLen))
	}
	if len(p.UserName) > MaxUserNameLen {
		return vErr("USER_NAME_TOO_LONG",
			fmt.Sprintf("user_name must be at most %d characters", MaxUserNameLen))
	}
	return MeetingSettings(p.Settings)
}

// TextPayload validates the payload for a "text" WebSocket action.
func TextPayload(p models.TextPayload) error {
	trimmed := strings.TrimSpace(p.Text)
	if trimmed == "" {
		return vErr("MISSING_TEXT", "text field is required and must not be blank")
	}
	if len(p.Text) > MaxTextLen {
		return vErr("TEXT_TOO_LONG",
			fmt.Sprintf("text must be at most %d characters", MaxTextLen))
	}
	return nil
}

// AudioPayload validates the payload for an "audio_chunk" WebSocket action.
func AudioPayload(p models.AudioPayload) error {
	if strings.TrimSpace(p.Data) == "" {
		return vErr("MISSING_DATA", "data field is required (base64-encoded audio)")
	}
	if !validAudioFormats[strings.ToLower(p.Format)] {
		return vErr("INVALID_FORMAT",
			fmt.Sprintf("format %q is not supported; valid values: pcm16, wav, mp3, ogg, webm", p.Format))
	}
	if p.SampleRate < 0 {
		return vErr("INVALID_SAMPLE_RATE", "sample_rate must be non-negative")
	}
	return nil
}

// SettingsPayload validates the payload for a "settings" WebSocket action.
func SettingsPayload(p models.SettingsPayload) error {
	return MeetingSettings(p.Settings)
}

// MeetingSettings validates meeting settings values.
func MeetingSettings(s models.MeetingSettings) error {
	if s.ParticipationLevel < 0 || s.ParticipationLevel > 1 {
		return vErr("INVALID_PARTICIPATION_LEVEL",
			"participation_level must be between 0.0 and 1.0")
	}
	if len(s.Personality) > MaxPersonalityLen {
		return vErr("PERSONALITY_TOO_LONG",
			fmt.Sprintf("personality must be at most %d characters", MaxPersonalityLen))
	}
	if !validPersonalities[strings.ToLower(s.Personality)] {
		return vErr("INVALID_PERSONALITY",
			fmt.Sprintf("personality %q is not supported; valid values: supportive, analytical, concise, encouraging, formal",
				s.Personality))
	}
	return nil
}

// SessionID validates that a session ID looks like a canonical UUID.
// An empty string is allowed (server will generate a new ID).
func SessionID(s string) error {
	if s == "" {
		return nil
	}
	if len(s) > MaxSessionIDLen {
		return vErr("SESSION_ID_TOO_LONG",
			fmt.Sprintf("session_id must be at most %d characters", MaxSessionIDLen))
	}
	if !uuidRE.MatchString(s) {
		return vErr("INVALID_SESSION_ID", "session_id must be a valid UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)")
	}
	return nil
}

// MeetingTitle validates the title for a meeting creation request.
func MeetingTitle(title string) error {
	if strings.TrimSpace(title) == "" {
		return vErr("MISSING_TITLE", "title is required")
	}
	if len(title) > MaxTitleLen {
		return vErr("TITLE_TOO_LONG",
			fmt.Sprintf("title must be at most %d characters", MaxTitleLen))
	}
	return nil
}

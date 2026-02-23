package models

// InboundMessage is the envelope for all client-to-server WebSocket messages.
type InboundMessage struct {
	Action    string `json:"action"`
	SessionID string `json:"session_id,omitempty"`
	Payload   any    `json:"payload,omitempty"`
}

// OutboundMessage is the envelope for all server-to-client WebSocket messages.
type OutboundMessage struct {
	Type      string `json:"type"`
	SessionID string `json:"session_id,omitempty"`
	Payload   any    `json:"payload,omitempty"`
}

// --- Inbound payloads ---

// JoinPayload is sent when a user joins a meeting.
type JoinPayload struct {
	UserID   string          `json:"user_id"`
	UserName string          `json:"user_name"`
	Settings MeetingSettings `json:"settings,omitempty"`
}

// TextPayload carries a text message from a participant.
type TextPayload struct {
	Text string `json:"text"`
}

// AudioPayload carries a base64-encoded audio chunk.
type AudioPayload struct {
	Data       string `json:"data"`
	SampleRate int    `json:"sample_rate"`
	Format     string `json:"format"`
	IsFinal    bool   `json:"is_final"`
}

// SettingsPayload allows runtime setting changes.
type SettingsPayload struct {
	Settings MeetingSettings `json:"settings"`
}

// --- Outbound payloads ---

// TranscriptionPayload is a real-time transcription event.
type TranscriptionPayload struct {
	Speaker string `json:"speaker"`
	Text    string `json:"text"`
	IsFinal bool   `json:"is_final"`
}

// AIResponsePayload carries an AI text response and optional synthesised audio.
type AIResponsePayload struct {
	Text       string  `json:"text"`
	Confidence float64 `json:"confidence"`
	// AudioBase64 is a base64-encoded PCM or MP3 audio clip (empty when TTS is disabled).
	AudioBase64 string `json:"audio_base64,omitempty"`
	AudioFormat string `json:"audio_format,omitempty"`
}

// AIAudioPayload carries AI-generated speech audio.
type AIAudioPayload struct {
	Data       string `json:"data"`
	SampleRate int    `json:"sample_rate"`
	Format     string `json:"format"`
}

// ParticipantEventPayload signals joins/leaves.
type ParticipantEventPayload struct {
	UserID   string `json:"user_id"`
	UserName string `json:"user_name"`
	Event    string `json:"event"`
}

// ErrorPayload communicates errors to the client.
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ChunkAckPayload is sent after each processed audio_chunk message.
type ChunkAckPayload struct {
	Buffered int    `json:"buffered"`         // current buffer size in bytes
	Uploaded bool   `json:"uploaded"`         // true when utterance was flushed to S3
	S3Key    string `json:"s3_key,omitempty"` // set when Uploaded is true
}

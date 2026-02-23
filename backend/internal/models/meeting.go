package models

import "time"

// Meeting represents a meeting session with all its state.
type Meeting struct {
	SessionID    string          `json:"session_id" dynamodbav:"session_id"`
	Title        string          `json:"title" dynamodbav:"title"`
	CreatedAt    time.Time       `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at" dynamodbav:"updated_at"`
	TTL          int64           `json:"ttl" dynamodbav:"ttl"`
	Settings     MeetingSettings `json:"settings" dynamodbav:"settings"`
	Messages     []Message       `json:"messages" dynamodbav:"messages"`
	Participants []string        `json:"participants" dynamodbav:"participants"`
	AIState      AIState         `json:"ai_state" dynamodbav:"ai_state"`
}

// MeetingSettings controls how Lira behaves in this session.
type MeetingSettings struct {
	Personality        string  `json:"personality" dynamodbav:"personality"`
	ParticipationLevel float64 `json:"participation_level" dynamodbav:"participation_level"`
	WakeWordEnabled    bool    `json:"wake_word_enabled" dynamodbav:"wake_word_enabled"`
	ProactiveSuggest   bool    `json:"proactive_suggest" dynamodbav:"proactive_suggest"`
}

// DefaultSettings returns sensible defaults for a new meeting.
func DefaultSettings() MeetingSettings {
	return MeetingSettings{
		Personality:        "supportive",
		ParticipationLevel: 0.6,
		WakeWordEnabled:    true,
		ProactiveSuggest:   true,
	}
}

// Message represents a single utterance in the meeting.
type Message struct {
	ID        string    `json:"id" dynamodbav:"id"`
	Speaker   string    `json:"speaker" dynamodbav:"speaker"`
	Text      string    `json:"text" dynamodbav:"text"`
	Timestamp time.Time `json:"timestamp" dynamodbav:"timestamp"`
	IsAI      bool      `json:"is_ai" dynamodbav:"is_ai"`
	Sentiment string    `json:"sentiment,omitempty" dynamodbav:"sentiment"`
}

// AIState tracks Lira AI behavior within a meeting.
type AIState struct {
	LastResponseTime time.Time `json:"last_response_time" dynamodbav:"last_response_time"`
	ResponseCount    int       `json:"response_count" dynamodbav:"response_count"`
}

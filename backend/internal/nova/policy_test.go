package nova

import (
	"testing"
	"time"

	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func baseDecision(text string) DecisionInput {
	return DecisionInput{
		Meeting: models.Meeting{
			Settings: models.MeetingSettings{
				Personality:        "supportive",
				ParticipationLevel: 0.8,
				WakeWordEnabled:    false,
				ProactiveSuggest:   true,
			},
			AIState: models.AIState{},
		},
		NewMessage: models.Message{
			ID:        "m1",
			Speaker:   "alice",
			Text:      text,
			Timestamp: time.Now(),
			IsAI:      false,
		},
	}
}

func TestShouldAIRespond_AIMessage_AlwaysFalse(t *testing.T) {
	input := baseDecision("This is an AI response")
	input.NewMessage.IsAI = true
	assert.False(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_WakeWord_AlwaysTrue(t *testing.T) {
	// Even with wake_word_enabled=true and participation_level=0, wake words win.
	input := baseDecision("Hey Lira, can you summarize?")
	input.Meeting.Settings.WakeWordEnabled = true
	input.Meeting.Settings.ParticipationLevel = 0
	assert.True(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_WakeWordMode_NoWakeWord_False(t *testing.T) {
	input := baseDecision("Let's move on to the next topic")
	input.Meeting.Settings.WakeWordEnabled = true
	assert.False(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_Cooldown_False(t *testing.T) {
	input := baseDecision("What do you think about this?")
	input.Meeting.AIState = models.AIState{
		LastResponseTime: time.Now().Add(-5 * time.Second), // only 5s ago
		ResponseCount:    3,
	}
	assert.False(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_CooldownExpired_True(t *testing.T) {
	input := baseDecision("What do you think about this approach?")
	input.Meeting.Settings.ParticipationLevel = 1.0 // always respond
	input.Meeting.AIState = models.AIState{
		LastResponseTime: time.Now().Add(-30 * time.Second), // 30s ago
		ResponseCount:    3,
	}
	assert.True(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_ShortMessage_False(t *testing.T) {
	input := baseDecision("ok")
	input.Meeting.Settings.ParticipationLevel = 1.0
	assert.False(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_ZeroParticipation_False(t *testing.T) {
	input := baseDecision("This is a sufficiently long message for the AI to respond to")
	input.Meeting.Settings.ParticipationLevel = 0
	assert.False(t, ShouldAIRespond(input))
}

func TestShouldAIRespond_FullParticipation_True(t *testing.T) {
	input := baseDecision("This is a sufficiently long message for the AI to respond to")
	input.Meeting.Settings.ParticipationLevel = 1.0
	assert.True(t, ShouldAIRespond(input))
}

func TestContainsWakeWord(t *testing.T) {
	cases := []struct {
		text     string
		expected bool
	}{
		{"Hey Lira, what do you think?", true},
		{"@lira please summarize", true},
		{"Lira, can you help?", true},
		{"lira?", true},
		{"lira", true},
		{"Let's talk about the migration", false},
		{"We need a library for this", false},
		{"Deliver the results", false},
		{"HEY LIRA summarize this", true},
	}
	for _, c := range cases {
		assert.Equal(t, c.expected, ContainsWakeWord(c.text), "text: %q", c.text)
	}
}

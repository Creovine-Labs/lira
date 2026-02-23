package nova

import (
	"math/rand"
	"strings"
	"time"

	"github.com/creovine/lira-ai-backend/internal/models"
)

const (
	// WakeWords are phrases that always trigger Lira regardless of participation level.
	wakeWordLira      = "hey lira"
	wakeWordAt        = "@lira"
	wakeWordLiraComma = "lira,"
	wakeWordLiraQ     = "lira?"

	// MinMessageLen is the minimum character length to consider for AI response.
	MinMessageLen = 8

	// DefaultCooldownSec is the minimum seconds between AI responses (unless wake word).
	DefaultCooldownSec = 15
)

// DecisionInput holds everything ShouldAIRespond needs to make its decision.
type DecisionInput struct {
	Meeting    models.Meeting
	NewMessage models.Message
}

// ShouldAIRespond returns true when Lira should generate a response.
//
// Decision logic (in order):
//  1. Always skip if the message is from the AI itself.
//  2. If wake word detected → always respond (skip all other gates).
//  3. If wake_word_enabled and no wake word → skip (Lira only speaks when addressed).
//  4. Cooldown gate: skip if AI responded within DefaultCooldownSec seconds.
//  5. Message length gate: skip very short messages.
//  6. Participation probability gate: respond participation_level % of the time.
func ShouldAIRespond(input DecisionInput) bool {
	msg := input.NewMessage
	settings := input.Meeting.Settings
	aiState := input.Meeting.AIState

	// 1. Never respond to own messages.
	if msg.IsAI {
		return false
	}

	// 2. Wake word always wins.
	if ContainsWakeWord(msg.Text) {
		return true
	}

	// 3. If wake-word-only mode, stop here.
	if settings.WakeWordEnabled {
		return false
	}

	// 4. Cooldown: don't respond more than once per DefaultCooldownSec seconds.
	if !aiState.LastResponseTime.IsZero() {
		elapsed := time.Since(aiState.LastResponseTime).Seconds()
		if elapsed < DefaultCooldownSec {
			return false
		}
	}

	// 5. Ignore very short messages.
	if len(strings.TrimSpace(msg.Text)) < MinMessageLen {
		return false
	}

	// 6. Participation probability gate.
	level := settings.ParticipationLevel
	if level <= 0 {
		return false
	}
	if level >= 1.0 {
		return true
	}
	return rand.Float64() < level
}

// ContainsWakeWord returns true if the text contains any Lira wake word (case-insensitive).
func ContainsWakeWord(text string) bool {
	lower := strings.ToLower(strings.TrimSpace(text))
	return strings.Contains(lower, wakeWordLira) ||
		strings.Contains(lower, wakeWordAt) ||
		strings.HasPrefix(lower, wakeWordLiraComma) ||
		strings.HasPrefix(lower, wakeWordLiraQ) ||
		lower == "lira"
}

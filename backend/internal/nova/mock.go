package nova

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/creovine/lira-ai-backend/internal/models"
)

// AIService defines the interface for AI response generation.
type AIService interface {
	GenerateResponse(ctx context.Context, sessionID string, messages []models.Message, settings models.MeetingSettings) (string, error)
}

// MockAI returns canned responses based on keyword matching.
type MockAI struct {
	Delay time.Duration
}

// NewMockAI creates a mock AI with configurable delay.
func NewMockAI(delay time.Duration) *MockAI {
	return &MockAI{Delay: delay}
}

func (m *MockAI) GenerateResponse(ctx context.Context, _ string, messages []models.Message, settings models.MeetingSettings) (string, error) {
	if m.Delay > 0 {
		select {
		case <-time.After(m.Delay):
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}

	if len(messages) == 0 {
		return "I'm Lira, your AI meeting assistant. How can I help?", nil
	}

	lastMsg := messages[len(messages)-1].Text
	lower := strings.ToLower(lastMsg)

	switch {
	case strings.Contains(lower, "summarize") || strings.Contains(lower, "summary"):
		return m.summarize(messages), nil
	case strings.Contains(lower, "action item") || strings.Contains(lower, "todo"):
		return "Based on the discussion, here are the action items I've identified:\n1. Follow up on the key points discussed\n2. Schedule a follow-up meeting\n3. Share meeting notes with the team", nil
	case strings.Contains(lower, "help"):
		return "I can help with: summarizing discussions, tracking action items, answering questions, and providing suggestions. Just ask!", nil
	case strings.Contains(lower, "hello") || strings.Contains(lower, "hi ") || lower == "hi":
		return fmt.Sprintf("Hello! I'm Lira, running in %s mode. I'm here to help with your meeting.", settings.Personality), nil
	case strings.Contains(lower, "agree") || strings.Contains(lower, "good point"):
		return "That's a great point. I'd also suggest considering the broader implications for the team.", nil
	case strings.Contains(lower, "disagree") || strings.Contains(lower, "but"):
		return "I see different perspectives here. It might be helpful to list the pros and cons to reach consensus.", nil
	case strings.Contains(lower, "schedule") || strings.Contains(lower, "meeting"):
		return "I can note that scheduling request. Would you like me to track this as an action item?", nil
	case strings.Contains(lower, "thank"):
		return "You're welcome! Let me know if there's anything else I can help with.", nil
	case len(lastMsg) < 10:
		return "Could you elaborate on that? I want to make sure I understand correctly.", nil
	default:
		return fmt.Sprintf("That's an interesting point about \"%s\". Let me note that for the meeting summary.", truncate(lastMsg, 50)), nil
	}
}

func (m *MockAI) summarize(messages []models.Message) string {
	if len(messages) <= 1 {
		return "The meeting just started. I'll provide a summary as the discussion progresses."
	}
	var speakers []string
	seen := make(map[string]bool)
	topics := 0
	for _, msg := range messages {
		if !msg.IsAI {
			if !seen[msg.Speaker] {
				speakers = append(speakers, msg.Speaker)
				seen[msg.Speaker] = true
			}
			topics++
		}
	}
	return fmt.Sprintf("Meeting summary so far:\n- %d participants have contributed\n- %d messages exchanged\n- Key discussion points are being tracked\n- Participants: %s",
		len(speakers), topics, strings.Join(speakers, ", "))
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

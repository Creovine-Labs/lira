package nova

import (
	"testing"

	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func msg(text string, isAI bool) models.Message {
	return models.Message{Text: text, IsAI: isAI, Speaker: "alice"}
}

func TestContextHeader_TitleOnly(t *testing.T) {
	pb := NewPromptBuilder()
	header := pb.ContextHeader(models.Meeting{Title: "Sprint Planning"})
	assert.Contains(t, header, "Sprint Planning")
}

func TestContextHeader_WithParticipants(t *testing.T) {
	pb := NewPromptBuilder()
	header := pb.ContextHeader(models.Meeting{
		Title:        "Q1 Review",
		Participants: []string{"Alice", "Bob"},
	})
	assert.Contains(t, header, "Alice")
	assert.Contains(t, header, "Bob")
}

func TestExtractTopics_FrequencyThreshold(t *testing.T) {
	msgs := []models.Message{
		msg("we need to discuss deployment pipeline issues", false),
		msg("deployment is blocked by infra pipeline", false),
	}
	topics := ExtractTopics(msgs, 5)
	assert.Contains(t, topics, "deployment")
	assert.Contains(t, topics, "pipeline")
}

func TestExtractTopics_SkipsAIMessages(t *testing.T) {
	msgs := []models.Message{
		msg("lira lira lira lira lira says hello there", true),
		msg("human says something here today", false),
	}
	assert.NotContains(t, ExtractTopics(msgs, 5), "lira")
}

func TestExtractTopics_RespectsMax(t *testing.T) {
	msgs := []models.Message{
		msg("alpha alpha beta beta gamma gamma delta delta epsilon epsilon zeta zeta", false),
		msg("alpha alpha beta beta gamma gamma delta delta epsilon epsilon zeta zeta", false),
	}
	assert.LessOrEqual(t, len(ExtractTopics(msgs, 3)), 3)
}

func TestExtractActionItems_DetectsSignals(t *testing.T) {
	msgs := []models.Message{
		msg("I will finish the report by Friday", false),
		msg("We need to schedule a follow up meeting", false),
		msg("Just discussing things here today", false),
	}
	assert.Len(t, ExtractActionItems(msgs, 5), 2)
}

func TestExtractActionItems_RespectsMax(t *testing.T) {
	msgs := []models.Message{
		msg("will do task a", false),
		msg("will do task b", false),
		msg("will do task c", false),
		msg("will do task d", false),
	}
	assert.Len(t, ExtractActionItems(msgs, 3), 3)
}

func TestExtractActionItems_SkipsAI(t *testing.T) {
	msgs := []models.Message{
		msg("I will do this and that tomorrow afternoon", true),
	}
	assert.Empty(t, ExtractActionItems(msgs, 5))
}

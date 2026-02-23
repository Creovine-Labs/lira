package nova

import (
	"context"
	"testing"
	"time"

	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMockAI_EmptyMessages(t *testing.T) {
	ai := NewMockAI(0)
	resp, err := ai.GenerateResponse(context.Background(), "sess-1", nil, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "Lira")
}

func TestMockAI_HelloResponse(t *testing.T) {
	ai := NewMockAI(0)
	msgs := []models.Message{
		{ID: "1", Speaker: "Alice", Text: "Hello everyone!", Timestamp: time.Now()},
	}
	resp, err := ai.GenerateResponse(context.Background(), "sess-1", msgs, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "Hello")
	assert.Contains(t, resp, "Lira")
}

func TestMockAI_SummarizeResponse(t *testing.T) {
	ai := NewMockAI(0)
	msgs := []models.Message{
		{ID: "1", Speaker: "Alice", Text: "Let's discuss the roadmap", Timestamp: time.Now()},
		{ID: "2", Speaker: "Bob", Text: "I think we should prioritize mobile", Timestamp: time.Now()},
		{ID: "3", Speaker: "Alice", Text: "Can you summarize?", Timestamp: time.Now()},
	}
	resp, err := ai.GenerateResponse(context.Background(), "sess-1", msgs, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "summary")
	assert.Contains(t, resp, "2 participants")
}

func TestMockAI_ActionItems(t *testing.T) {
	ai := NewMockAI(0)
	msgs := []models.Message{
		{ID: "1", Speaker: "Alice", Text: "What are the action items?", Timestamp: time.Now()},
	}
	resp, err := ai.GenerateResponse(context.Background(), "sess-1", msgs, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "action items")
}

func TestMockAI_ContextCancellation(t *testing.T) {
	ai := NewMockAI(5 * time.Second)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := ai.GenerateResponse(ctx, "sess-1", nil, models.DefaultSettings())
	assert.ErrorIs(t, err, context.Canceled)
}

func TestMockAI_DefaultResponse(t *testing.T) {
	ai := NewMockAI(0)
	msgs := []models.Message{
		{ID: "1", Speaker: "Alice", Text: "We should consider the performance implications of the new architecture", Timestamp: time.Now()},
	}
	resp, err := ai.GenerateResponse(context.Background(), "sess-1", msgs, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "interesting point")
}

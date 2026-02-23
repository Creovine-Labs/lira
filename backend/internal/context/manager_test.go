package context

import (
	"context"
	"testing"
	"time"

	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMockStore_ConnectionLifecycle(t *testing.T) {
	store := NewMockStore()
	ctx := context.Background()

	conn := models.Connection{
		ConnectionID: "conn-1",
		SessionID:    "sess-1",
		UserID:       "user-1",
		ConnectedAt:  time.Now(),
		TTL:          time.Now().Add(24 * time.Hour).Unix(),
	}

	// Save
	err := store.SaveConnection(ctx, conn)
	require.NoError(t, err)
	assert.Equal(t, 1, store.ConnectionCount())

	// Get by ID
	got, err := store.GetConnectionByID(ctx, "conn-1")
	require.NoError(t, err)
	assert.Equal(t, "sess-1", got.SessionID)

	// Get by session
	conns, err := store.GetConnectionsBySession(ctx, "sess-1")
	require.NoError(t, err)
	assert.Len(t, conns, 1)

	// Delete
	err = store.DeleteConnection(ctx, "conn-1")
	require.NoError(t, err)
	assert.Equal(t, 0, store.ConnectionCount())

	// Get not found
	_, err = store.GetConnectionByID(ctx, "conn-1")
	assert.Error(t, err)
}

func TestMockStore_MeetingLifecycle(t *testing.T) {
	store := NewMockStore()
	ctx := context.Background()

	meeting := models.Meeting{
		SessionID: "sess-1",
		Title:     "Test Meeting",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Settings:  models.DefaultSettings(),
		Messages:  []models.Message{},
	}

	// Save
	err := store.SaveMeeting(ctx, meeting)
	require.NoError(t, err)
	assert.Equal(t, 1, store.MeetingCount())

	// Get
	got, err := store.GetMeeting(ctx, "sess-1")
	require.NoError(t, err)
	assert.Equal(t, "Test Meeting", got.Title)

	// Append message
	msg := models.Message{
		ID:        "msg-1",
		Speaker:   "user-1",
		Text:      "Hello!",
		Timestamp: time.Now(),
		IsAI:      false,
	}
	err = store.AppendMessage(ctx, "sess-1", msg)
	require.NoError(t, err)

	got, err = store.GetMeeting(ctx, "sess-1")
	require.NoError(t, err)
	assert.Len(t, got.Messages, 1)
	assert.Equal(t, "Hello!", got.Messages[0].Text)

	// Not found
	_, err = store.GetMeeting(ctx, "nonexistent")
	assert.Error(t, err)
}

func TestMockStore_MultipleConnectionsPerSession(t *testing.T) {
	store := NewMockStore()
	ctx := context.Background()

	for i := 0; i < 3; i++ {
		err := store.SaveConnection(ctx, models.Connection{
			ConnectionID: "conn-" + string(rune('a'+i)),
			SessionID:    "sess-1",
			UserID:       "user-" + string(rune('a'+i)),
			ConnectedAt:  time.Now(),
		})
		require.NoError(t, err)
	}

	// Also add a connection for a different session
	err := store.SaveConnection(ctx, models.Connection{
		ConnectionID: "conn-other",
		SessionID:    "sess-2",
		UserID:       "user-other",
		ConnectedAt:  time.Now(),
	})
	require.NoError(t, err)

	conns, err := store.GetConnectionsBySession(ctx, "sess-1")
	require.NoError(t, err)
	assert.Len(t, conns, 3)

	conns, err = store.GetConnectionsBySession(ctx, "sess-2")
	require.NoError(t, err)
	assert.Len(t, conns, 1)
}

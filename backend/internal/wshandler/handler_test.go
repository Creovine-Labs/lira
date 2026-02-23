package wshandler

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestHandler() (*Handler, *appctx.MockStore, *MockBroadcaster) {
	store := appctx.NewMockStore()
	broadcaster := NewMockBroadcaster(store)
	ai := nova.NewMockAI(0)
	logger := zerolog.Nop()
	handler := NewHandler(store, broadcaster, ai, logger)
	return handler, store, broadcaster
}

func makeEvent(routeKey, connID, body string) events.APIGatewayWebsocketProxyRequest {
	return events.APIGatewayWebsocketProxyRequest{
		RequestContext: events.APIGatewayWebsocketProxyRequestContext{
			RouteKey:     routeKey,
			ConnectionID: connID,
		},
		Body: body,
	}
}

func TestHandle_Connect(t *testing.T) {
	h, store, _ := newTestHandler()
	ctx := context.Background()

	resp, err := h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
	assert.Equal(t, 1, store.ConnectionCount())
}

func TestHandle_Disconnect(t *testing.T) {
	h, store, _ := newTestHandler()
	ctx := context.Background()

	// Connect first
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	assert.Equal(t, 1, store.ConnectionCount())

	// Disconnect
	resp, err := h.Handle(ctx, makeEvent("$disconnect", "conn-1", ""))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
	assert.Equal(t, 0, store.ConnectionCount())
}

func TestHandle_Join_NewSession(t *testing.T) {
	h, store, broadcaster := newTestHandler()
	ctx := context.Background()

	// Connect
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))

	// Join
	body := `{"action":"join","payload":{"user_id":"alice","user_name":"Alice"}}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", body))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Verify meeting was created
	assert.Equal(t, 1, store.MeetingCount())

	// Verify join confirmation + AI greeting were sent
	assert.GreaterOrEqual(t, broadcaster.SentCount(), 2) // join confirm + AI greeting
}

func TestHandle_Join_ExistingSession(t *testing.T) {
	h, store, _ := newTestHandler()
	ctx := context.Background()

	// First user connects and joins
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	body1 := `{"action":"join","session_id":"test-sess","payload":{"user_id":"alice","user_name":"Alice"}}`
	_, _ = h.Handle(ctx, makeEvent("message", "conn-1", body1))
	assert.Equal(t, 1, store.MeetingCount())

	// Second user connects and joins same session
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-2", ""))
	body2 := `{"action":"join","session_id":"test-sess","payload":{"user_id":"bob","user_name":"Bob"}}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-2", body2))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Still only 1 meeting
	assert.Equal(t, 1, store.MeetingCount())
}

func TestHandle_Text_WithAIResponse(t *testing.T) {
	h, store, broadcaster := newTestHandler()
	ctx := context.Background()

	// Connect + Join
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	joinBody := `{"action":"join","session_id":"sess-1","payload":{"user_id":"alice","user_name":"Alice"}}`
	_, _ = h.Handle(ctx, makeEvent("message", "conn-1", joinBody))

	broadcaster.Reset()

	// Send text
	textBody := `{"action":"text","payload":{"text":"Hello everyone, can you summarize?"}}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", textBody))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Verify messages were stored
	meeting, err := store.GetMeeting(ctx, "sess-1")
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(meeting.Messages), 1) // at least user message

	// Verify broadcast happened (transcription + AI response)
	assert.GreaterOrEqual(t, broadcaster.SentCount(), 1)
}

func TestHandle_Text_NotInSession(t *testing.T) {
	h, _, broadcaster := newTestHandler()
	ctx := context.Background()

	// Connect but don't join
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))

	textBody := `{"action":"text","payload":{"text":"Hello"}}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", textBody))
	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	// Error message should have been sent
	assert.GreaterOrEqual(t, broadcaster.SentCount(), 1)
	lastMsg := broadcaster.Sent[len(broadcaster.Sent)-1].Message
	assert.Equal(t, "error", lastMsg.Type)
}

func TestHandle_Settings(t *testing.T) {
	h, store, broadcaster := newTestHandler()
	ctx := context.Background()

	// Connect + Join
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	joinBody := `{"action":"join","session_id":"sess-1","payload":{"user_id":"alice","user_name":"Alice"}}`
	_, _ = h.Handle(ctx, makeEvent("message", "conn-1", joinBody))

	broadcaster.Reset()

	// Update settings
	settingsBody := `{"action":"settings","payload":{"settings":{"personality":"analytical","participation_level":0.8,"wake_word_enabled":false,"proactive_suggest":true}}}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", settingsBody))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Verify settings were updated
	meeting, err := store.GetMeeting(ctx, "sess-1")
	require.NoError(t, err)
	assert.Equal(t, "analytical", meeting.Settings.Personality)
	assert.Equal(t, 0.8, meeting.Settings.ParticipationLevel)

	// Verify broadcast
	found := false
	for _, s := range broadcaster.Sent {
		if s.Message.Type == "settings_updated" {
			found = true
			break
		}
	}
	assert.True(t, found, "settings_updated should be broadcast")
}

func TestHandle_Leave(t *testing.T) {
	h, store, _ := newTestHandler()
	ctx := context.Background()

	// Connect + Join
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	joinBody := `{"action":"join","session_id":"sess-1","payload":{"user_id":"alice","user_name":"Alice"}}`
	_, _ = h.Handle(ctx, makeEvent("message", "conn-1", joinBody))

	// Leave
	leaveBody := `{"action":"leave","session_id":"sess-1"}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", leaveBody))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Connection should still exist but not bound to session
	conn, err := store.GetConnectionByID(ctx, "conn-1")
	require.NoError(t, err)
	assert.Equal(t, "", conn.SessionID)
}

func TestHandle_InvalidJSON(t *testing.T) {
	h, _, broadcaster := newTestHandler()
	ctx := context.Background()

	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))

	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", "not json"))
	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	// Error message sent
	assert.GreaterOrEqual(t, broadcaster.SentCount(), 1)
}

func TestHandle_UnknownAction(t *testing.T) {
	h, _, broadcaster := newTestHandler()
	ctx := context.Background()

	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))

	body := `{"action":"unknown_action"}`
	resp, err := h.Handle(ctx, makeEvent("message", "conn-1", body))
	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	// Error message sent
	assert.GreaterOrEqual(t, broadcaster.SentCount(), 1)
}

func TestHandle_UnknownRoute(t *testing.T) {
	h, _, _ := newTestHandler()
	ctx := context.Background()

	resp, err := h.Handle(ctx, makeEvent("$badroute", "conn-1", ""))
	require.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}

func TestHandle_DisconnectNotifiesSession(t *testing.T) {
	h, _, broadcaster := newTestHandler()
	ctx := context.Background()

	// Connect + Join
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-1", ""))
	joinBody := `{"action":"join","session_id":"sess-1","payload":{"user_id":"alice","user_name":"Alice"}}`
	_, _ = h.Handle(ctx, makeEvent("message", "conn-1", joinBody))

	// Second user
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-2", ""))
	joinBody2 := `{"action":"join","session_id":"sess-1","payload":{"user_id":"bob","user_name":"Bob"}}`
	_, _ = h.Handle(ctx, makeEvent("message", "conn-2", joinBody2))

	broadcaster.Reset()

	// conn-1 disconnects
	resp, err := h.Handle(ctx, makeEvent("$disconnect", "conn-1", ""))
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Verify leave event was broadcast to conn-2
	found := false
	for _, s := range broadcaster.Sent {
		if s.Message.Type == "participant_event" {
			payload, err := json.Marshal(s.Message.Payload)
			require.NoError(t, err)
			var pe models.ParticipantEventPayload
			_ = json.Unmarshal(payload, &pe)
			if pe.Event == "left" {
				found = true
				break
			}
		}
	}
	assert.True(t, found, "leave event should be broadcast on disconnect")
}

func TestHandle_FullConversationFlow(t *testing.T) {
	h, store, broadcaster := newTestHandler()
	ctx := context.Background()

	// 1. Alice connects and joins
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-alice", ""))
	aliceJoin := `{"action":"join","session_id":"meeting-1","payload":{"user_id":"alice","user_name":"Alice"}}`
	_, err := h.Handle(ctx, makeEvent("message", "conn-alice", aliceJoin))
	require.NoError(t, err)

	// 2. Bob connects and joins same meeting
	_, _ = h.Handle(ctx, makeEvent("$connect", "conn-bob", ""))
	bobJoin := `{"action":"join","session_id":"meeting-1","payload":{"user_id":"bob","user_name":"Bob"}}`
	_, err = h.Handle(ctx, makeEvent("message", "conn-bob", bobJoin))
	require.NoError(t, err)

	broadcaster.Reset()

	// 3. Alice sends text
	aliceText := `{"action":"text","payload":{"text":"Let's discuss the project roadmap"}}`
	_, err = h.Handle(ctx, makeEvent("message", "conn-alice", aliceText))
	require.NoError(t, err)

	// 4. Bob sends text
	bobText := `{"action":"text","payload":{"text":"I agree, we should start with the backend"}}`
	_, err = h.Handle(ctx, makeEvent("message", "conn-bob", bobText))
	require.NoError(t, err)

	// 5. Verify meeting state
	meeting, err := store.GetMeeting(ctx, "meeting-1")
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(meeting.Messages), 2) // at least the 2 user messages

	// 6. Alice asks for summary (wake word ensures deterministic AI response regardless of participation level/cooldown)
	summaryText := `{"action":"text","payload":{"text":"hey lira can you summarize the discussion?"}}`
	_, err = h.Handle(ctx, makeEvent("message", "conn-alice", summaryText))
	require.NoError(t, err)

	// 7. Verify AI responses were generated and broadcast
	aiResponses := 0
	for _, s := range broadcaster.Sent {
		if s.Message.Type == "ai_response" {
			aiResponses++
		}
	}
	assert.GreaterOrEqual(t, aiResponses, 1, "AI should have responded")

	// 8. Alice disconnects
	_, err = h.Handle(ctx, makeEvent("$disconnect", "conn-alice", ""))
	require.NoError(t, err)

	// 9. Bob disconnects
	_, err = h.Handle(ctx, makeEvent("$disconnect", "conn-bob", ""))
	require.NoError(t, err)

	assert.Equal(t, 0, store.ConnectionCount())
}

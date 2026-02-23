package meetings

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestHandler() (*Handler, *appctx.MockStore) {
	store := appctx.NewMockStore()
	h := NewHandler(store, zerolog.Nop())
	return h, store
}

func httpReq(method, path, body string) events.APIGatewayV2HTTPRequest {
	return events.APIGatewayV2HTTPRequest{
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			HTTP: events.APIGatewayV2HTTPRequestContextHTTPDescription{
				Method: method,
				Path:   path,
			},
		},
		Body: body,
	}
}

func TestCreateMeeting_Basic(t *testing.T) {
	h, store := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodPost, "/meetings", `{"title":"Sprint Planning","settings":{"personality":"analytical","participation_level":0.7,"wake_word_enabled":false,"proactive_suggest":true}}`)
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var meeting models.Meeting
	err = json.Unmarshal([]byte(resp.Body), &meeting)
	require.NoError(t, err)
	assert.Equal(t, "Sprint Planning", meeting.Title)
	assert.Equal(t, "analytical", meeting.Settings.Personality)
	assert.NotEmpty(t, meeting.SessionID)
	assert.Equal(t, 1, store.MeetingCount())
}

func TestCreateMeeting_DefaultsApplied(t *testing.T) {
	h, _ := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodPost, "/meetings", `{}`)
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var meeting models.Meeting
	require.NoError(t, json.Unmarshal([]byte(resp.Body), &meeting))
	assert.Equal(t, "New Meeting", meeting.Title)
	assert.Equal(t, "supportive", meeting.Settings.Personality)
}

func TestCreateMeeting_InvalidBody(t *testing.T) {
	h, _ := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodPost, "/meetings", `not json`)
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestGetMeeting_Found(t *testing.T) {
	h, store := newTestHandler()
	ctx := context.Background()

	// Create a meeting first
	meeting := models.Meeting{
		SessionID: "test-sess-1",
		Title:     "Q1 Review",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Settings:  models.DefaultSettings(),
		Messages:  []models.Message{},
	}
	require.NoError(t, store.SaveMeeting(ctx, meeting))

	req := httpReq(http.MethodGet, "/meetings/test-sess-1", "")
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var got models.Meeting
	require.NoError(t, json.Unmarshal([]byte(resp.Body), &got))
	assert.Equal(t, "Q1 Review", got.Title)
	assert.Equal(t, "test-sess-1", got.SessionID)
}

func TestGetMeeting_NotFound(t *testing.T) {
	h, _ := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodGet, "/meetings/nonexistent", "")
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestUpdateSettings(t *testing.T) {
	h, store := newTestHandler()
	ctx := context.Background()

	// Create meeting
	meeting := models.Meeting{
		SessionID: "sess-upd",
		Title:     "Daily Standup",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Settings:  models.DefaultSettings(),
	}
	require.NoError(t, store.SaveMeeting(ctx, meeting))

	// Update settings
	newSettings := `{"personality":"analytical","participation_level":0.3,"wake_word_enabled":true,"proactive_suggest":false}`
	req := httpReq(http.MethodPut, "/meetings/sess-upd/settings", newSettings)
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Verify persisted
	updated, err := store.GetMeeting(ctx, "sess-upd")
	require.NoError(t, err)
	assert.Equal(t, "analytical", updated.Settings.Personality)
	assert.Equal(t, 0.3, updated.Settings.ParticipationLevel)
	assert.True(t, updated.Settings.WakeWordEnabled)
	assert.False(t, updated.Settings.ProactiveSuggest)
}

func TestUpdateSettings_NotFound(t *testing.T) {
	h, _ := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodPut, "/meetings/ghost/settings", `{"personality":"analytical","participation_level":0.5,"wake_word_enabled":false,"proactive_suggest":true}`)
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestGetMeetingSummary(t *testing.T) {
	h, store := newTestHandler()
	ctx := context.Background()

	now := time.Now()
	meeting := models.Meeting{
		SessionID: "sess-sum",
		Title:     "Design Review",
		CreatedAt: now.Add(-20 * time.Minute),
		UpdatedAt: now,
		Settings:  models.DefaultSettings(),
		Messages: []models.Message{
			{ID: "1", Speaker: "alice", Text: "Let's review the API design", Timestamp: now.Add(-18 * time.Minute), IsAI: false},
			{ID: "2", Speaker: "bob", Text: "I have concerns about rate limiting", Timestamp: now.Add(-15 * time.Minute), IsAI: false},
			{ID: "3", Speaker: "lira-ai", Text: "That's a great point about rate limiting", Timestamp: now.Add(-14 * time.Minute), IsAI: true},
			{ID: "4", Speaker: "alice", Text: "Agreed, let's add throttling", Timestamp: now.Add(-10 * time.Minute), IsAI: false},
		},
	}
	require.NoError(t, store.SaveMeeting(ctx, meeting))

	req := httpReq(http.MethodGet, "/meetings/sess-sum/summary", "")
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var summary map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(resp.Body), &summary))
	assert.Equal(t, "sess-sum", summary["session_id"])
	assert.Equal(t, "Design Review", summary["title"])
	assert.Equal(t, float64(2), summary["participant_count"]) // alice + bob
	assert.Equal(t, float64(3), summary["message_count"])     // 3 user messages
	assert.Equal(t, float64(1), summary["ai_response_count"]) // 1 AI message
	assert.GreaterOrEqual(t, summary["duration_minutes"].(float64), float64(19))
}

func TestDeleteMeeting(t *testing.T) {
	h, store := newTestHandler()
	ctx := context.Background()

	meeting := models.Meeting{
		SessionID: "sess-del",
		Title:     "Old Meeting",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Settings:  models.DefaultSettings(),
		TTL:       time.Now().Add(24 * time.Hour).Unix(),
	}
	require.NoError(t, store.SaveMeeting(ctx, meeting))

	req := httpReq(http.MethodDelete, "/meetings/sess-del", "")
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// TTL should be in the past now (soft delete)
	updated, err := store.GetMeeting(ctx, "sess-del")
	require.NoError(t, err)
	assert.Less(t, updated.TTL, time.Now().Unix())
}

func TestDeleteMeeting_NotFound(t *testing.T) {
	h, _ := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodDelete, "/meetings/ghost", "")
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestUnknownRoute(t *testing.T) {
	h, _ := newTestHandler()
	ctx := context.Background()

	req := httpReq(http.MethodPost, "/unknown", "")
	resp, err := h.Handle(ctx, req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestExtractID(t *testing.T) {
	assert.Equal(t, "abc-123", extractID("/meetings/abc-123", ""))
	assert.Equal(t, "abc-123", extractID("/meetings/abc-123/settings", "/settings"))
	assert.Equal(t, "abc-123", extractID("/meetings/abc-123/summary", "/summary"))
	assert.Equal(t, "", extractID("/meetings", ""))
}

func TestMatchesMeetingID(t *testing.T) {
	assert.True(t, matchesMeetingID("/meetings/abc"))
	assert.False(t, matchesMeetingID("/meetings"))
	assert.False(t, matchesMeetingID("/meetings/abc/settings"))
}

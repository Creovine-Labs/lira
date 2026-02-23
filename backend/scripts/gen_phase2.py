#!/usr/bin/env python3
"""Generate Go source files for Lira AI phase 2: policy + meetings CRUD."""
import os, sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# internal/nova/policy.go
# ─────────────────────────────────────────────────────────────────────────────
files["internal/nova/policy.go"] = r'''package nova

import (
	"math/rand"
	"strings"
	"time"

	"github.com/creovine/lira-ai-backend/internal/models"
)

const (
	// WakeWords are phrases that always trigger Lira regardless of participation level.
	wakeWordLira       = "hey lira"
	wakeWordAt         = "@lira"
	wakeWordLiraComma  = "lira,"
	wakeWordLiraQ      = "lira?"

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
		strings.HasPrefix(lower, "lira,") ||
		strings.HasPrefix(lower, "lira?") ||
		lower == "lira"
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# internal/nova/policy_test.go
# ─────────────────────────────────────────────────────────────────────────────
files["internal/nova/policy_test.go"] = r'''package nova

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
'''

# ─────────────────────────────────────────────────────────────────────────────
# internal/meetings/handler.go
# ─────────────────────────────────────────────────────────────────────────────
files["internal/meetings/handler.go"] = r'''package meetings

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/rs/zerolog"
	"golang.org/x/net/context"
)

// Handler handles HTTP API requests for meeting CRUD.
type Handler struct {
	store  appctx.Store
	logger zerolog.Logger
}

// NewHandler creates a new meetings HTTP handler.
func NewHandler(store appctx.Store, logger zerolog.Logger) *Handler {
	return &Handler{store: store, logger: logger}
}

// Handle routes an HTTP API v2 request to the correct operation.
func (h *Handler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	method := req.RequestContext.HTTP.Method
	path := req.RequestContext.HTTP.Path

	// Strip trailing slash
	path = strings.TrimRight(path, "/")

	h.logger.Info().Str("method", method).Str("path", path).Msg("meetings request")

	switch {
	case method == http.MethodPost && path == "/meetings":
		return h.createMeeting(ctx, req)

	case method == http.MethodGet && strings.HasSuffix(path, "/summary"):
		// GET /meetings/{id}/summary
		id := extractID(path, "/summary")
		return h.getMeetingSummary(ctx, id)

	case method == http.MethodGet && matchesMeetingID(path):
		// GET /meetings/{id}
		id := extractID(path, "")
		return h.getMeeting(ctx, id)

	case method == http.MethodPut && strings.HasSuffix(path, "/settings"):
		// PUT /meetings/{id}/settings
		id := extractID(path, "/settings")
		return h.updateSettings(ctx, id, req)

	case method == http.MethodDelete && matchesMeetingID(path):
		// DELETE /meetings/{id}
		id := extractID(path, "")
		return h.deleteMeeting(ctx, id)

	case method == http.MethodGet && path == "/meetings":
		return h.listMeetings(ctx, req)

	default:
		return jsonResp(http.StatusNotFound, map[string]string{"error": "not found"}), nil
	}
}

// createMeeting handles POST /meetings
func (h *Handler) createMeeting(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var body struct {
		Title    string                `json:"title"`
		Settings models.MeetingSettings `json:"settings"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "invalid request body"}), nil
	}

	now := time.Now().UTC()
	meeting := models.Meeting{
		SessionID:    fmt.Sprintf("mtg-%d", now.UnixNano()),
		Title:        body.Title,
		CreatedAt:    now,
		UpdatedAt:    now,
		TTL:          now.Add(7 * 24 * time.Hour).Unix(),
		Settings:     body.Settings,
		Messages:     []models.Message{},
		Participants: []string{},
	}

	// Apply defaults for zero values
	if meeting.Title == "" {
		meeting.Title = "New Meeting"
	}
	if meeting.Settings.Personality == "" {
		meeting.Settings = models.DefaultSettings()
	}

	if err := h.store.SaveMeeting(ctx, meeting); err != nil {
		h.logger.Error().Err(err).Msg("failed to create meeting")
		return jsonResp(http.StatusInternalServerError, map[string]string{"error": "failed to create meeting"}), nil
	}

	h.logger.Info().Str("session_id", meeting.SessionID).Msg("meeting created")
	return jsonResp(http.StatusCreated, meeting), nil
}

// getMeeting handles GET /meetings/{id}
func (h *Handler) getMeeting(ctx context.Context, id string) (events.APIGatewayV2HTTPResponse, error) {
	if id == "" {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "missing meeting id"}), nil
	}

	meeting, err := h.store.GetMeeting(ctx, id)
	if err != nil {
		h.logger.Warn().Err(err).Str("id", id).Msg("meeting not found")
		return jsonResp(http.StatusNotFound, map[string]string{"error": "meeting not found"}), nil
	}

	return jsonResp(http.StatusOK, meeting), nil
}

// updateSettings handles PUT /meetings/{id}/settings
func (h *Handler) updateSettings(ctx context.Context, id string, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if id == "" {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "missing meeting id"}), nil
	}

	var settings models.MeetingSettings
	if err := json.Unmarshal([]byte(req.Body), &settings); err != nil {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "invalid settings body"}), nil
	}

	meeting, err := h.store.GetMeeting(ctx, id)
	if err != nil {
		return jsonResp(http.StatusNotFound, map[string]string{"error": "meeting not found"}), nil
	}

	meeting.Settings = settings
	meeting.UpdatedAt = time.Now().UTC()

	if err := h.store.SaveMeeting(ctx, meeting); err != nil {
		h.logger.Error().Err(err).Str("id", id).Msg("failed to update settings")
		return jsonResp(http.StatusInternalServerError, map[string]string{"error": "failed to update settings"}), nil
	}

	return jsonResp(http.StatusOK, map[string]interface{}{
		"session_id": id,
		"settings":   settings,
	}), nil
}

// getMeetingSummary handles GET /meetings/{id}/summary
func (h *Handler) getMeetingSummary(ctx context.Context, id string) (events.APIGatewayV2HTTPResponse, error) {
	if id == "" {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "missing meeting id"}), nil
	}

	meeting, err := h.store.GetMeeting(ctx, id)
	if err != nil {
		return jsonResp(http.StatusNotFound, map[string]string{"error": "meeting not found"}), nil
	}

	// Build summary
	speakers := uniqueSpeakers(meeting.Messages)
	userMsgs := countUserMessages(meeting.Messages)
	aiMsgs := countAIMessages(meeting.Messages)
	durationMin := 0
	if !meeting.CreatedAt.IsZero() {
		durationMin = int(time.Since(meeting.CreatedAt).Minutes())
	}

	summary := map[string]interface{}{
		"session_id":        meeting.SessionID,
		"title":             meeting.Title,
		"created_at":        meeting.CreatedAt,
		"duration_minutes":  durationMin,
		"participant_count": len(speakers),
		"participants":      speakers,
		"message_count":     userMsgs,
		"ai_response_count": aiMsgs,
		"settings":          meeting.Settings,
	}

	return jsonResp(http.StatusOK, summary), nil
}

// deleteMeeting handles DELETE /meetings/{id}
// Soft-delete: sets TTL to now so DynamoDB expires it.
func (h *Handler) deleteMeeting(ctx context.Context, id string) (events.APIGatewayV2HTTPResponse, error) {
	if id == "" {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "missing meeting id"}), nil
	}

	meeting, err := h.store.GetMeeting(ctx, id)
	if err != nil {
		return jsonResp(http.StatusNotFound, map[string]string{"error": "meeting not found"}), nil
	}

	// Set TTL to past so DynamoDB TTL expires it quickly
	meeting.TTL = time.Now().Add(-1 * time.Second).Unix()
	meeting.UpdatedAt = time.Now().UTC()

	if err := h.store.SaveMeeting(ctx, meeting); err != nil {
		h.logger.Error().Err(err).Str("id", id).Msg("failed to delete meeting")
		return jsonResp(http.StatusInternalServerError, map[string]string{"error": "failed to delete meeting"}), nil
	}

	return jsonResp(http.StatusOK, map[string]string{"status": "deleted", "session_id": id}), nil
}

// listMeetings handles GET /meetings (basic scan, paginated by nextToken)
func (h *Handler) listMeetings(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// For now we don't support full list scan without an owner index.
	// Return 501 with a clear message so the frontend knows it's not implemented yet.
	return jsonResp(http.StatusNotImplemented, map[string]string{
		"error":  "list meetings requires a user index - coming in next phase",
		"hint":   "use GET /meetings/{id} to fetch a specific meeting",
	}), nil
}

// ─── helpers ──────────────────────────────────────────────────────────────────

func jsonResp(status int, body interface{}) events.APIGatewayV2HTTPResponse {
	b, _ := json.Marshal(body)
	return events.APIGatewayV2HTTPResponse{
		StatusCode: status,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(b),
	}
}

// matchesMeetingID returns true if the path is /meetings/{something} with no further sub-path.
func matchesMeetingID(path string) bool {
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	return len(parts) == 2 && parts[0] == "meetings" && parts[1] != ""
}

// extractID pulls the meeting ID from paths like /meetings/{id} or /meetings/{id}/settings.
func extractID(path, suffix string) string {
	if suffix != "" {
		path = strings.TrimSuffix(path, suffix)
	}
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	if len(parts) >= 2 {
		return parts[1]
	}
	return ""
}

func uniqueSpeakers(messages []models.Message) []string {
	seen := make(map[string]bool)
	var result []string
	for _, m := range messages {
		if !m.IsAI && !seen[m.Speaker] {
			seen[m.Speaker] = true
			result = append(result, m.Speaker)
		}
	}
	return result
}

func countUserMessages(messages []models.Message) int {
	n := 0
	for _, m := range messages {
		if !m.IsAI {
			n++
		}
	}
	return n
}

func countAIMessages(messages []models.Message) int {
	n := 0
	for _, m := range messages {
		if m.IsAI {
			n++
		}
	}
	return n
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# internal/meetings/handler_test.go
# ─────────────────────────────────────────────────────────────────────────────
files["internal/meetings/handler_test.go"] = r'''package meetings

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
'''

# ─────────────────────────────────────────────────────────────────────────────
# cmd/meetings/main.go
# ─────────────────────────────────────────────────────────────────────────────
files["cmd/meetings/main.go"] = r'''package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/meetings"
	"github.com/creovine/lira-ai-backend/pkg/config"
	"github.com/creovine/lira-ai-backend/pkg/logging"
)

func main() {
	logging.Init()
	cfg := config.Load()
	logger := logging.NewLogger("meetings")

	ctx := context.Background()
	var handler *meetings.Handler

	if cfg.IsMock() {
		logger.Info().Msg("meetings Lambda starting in MOCK mode")
		store := appctx.NewMockStore()
		handler = meetings.NewHandler(store, logger)
	} else {
		logger.Info().Str("region", cfg.AWSRegion).Msg("meetings Lambda starting in AWS mode")
		store, err := appctx.NewDynamoStore(ctx, cfg)
		if err != nil {
			logger.Fatal().Err(err).Msg("failed to create DynamoDB store")
			os.Exit(1)
		}
		handler = meetings.NewHandler(store, logger)
	}

	lambda.Start(func(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
		return handler.Handle(ctx, req)
	})
}
'''

# Write all files
for relpath, content in files.items():
    fullpath = os.path.join(BASE, relpath)
    os.makedirs(os.path.dirname(fullpath), exist_ok=True)
    if content.startswith('\n'):
        content = content[1:]
    with open(fullpath, 'w', newline='\n') as f:
        f.write(content)
    lines = content.count('\n')
    print(f"OK: {relpath} ({lines} lines)")

print("All files written.")

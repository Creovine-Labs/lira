package meetings

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/creovine/lira-ai-backend/internal/sentiment"
	"github.com/creovine/lira-ai-backend/internal/validation"
	"github.com/creovine/lira-ai-backend/pkg/ratelimit"
	"github.com/rs/zerolog"
)

// Handler handles HTTP API requests for meeting CRUD.
type Handler struct {
	store       appctx.Store
	rateLimiter *ratelimit.Limiter
	logger      zerolog.Logger
}

// NewHandler creates a new meetings HTTP handler.
func NewHandler(store appctx.Store, logger zerolog.Logger) *Handler {
	return &Handler{store: store, rateLimiter: ratelimit.NewHTTPLimiter(), logger: logger}
}

// Handle routes an HTTP API v2 request to the correct operation.
func (h *Handler) Handle(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	method := req.RequestContext.HTTP.Method
	path := req.RequestContext.HTTP.Path

	// Strip trailing slash
	path = strings.TrimRight(path, "/")

	// Rate limit per source IP: 10 req/s, burst 30.
	if ip := req.RequestContext.HTTP.SourceIP; ip != "" {
		if !h.rateLimiter.Allow(ip) {
			return jsonResp(http.StatusTooManyRequests, map[string]string{"error": "rate limit exceeded"}), nil
		}
	}

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
		Title    string                 `json:"title"`
		Settings models.MeetingSettings `json:"settings"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return jsonResp(http.StatusBadRequest, map[string]string{"error": "invalid request body"}), nil
	}

	if err := validation.MeetingSettings(body.Settings); err != nil {
		var ve *validation.ValidationError
		if errors.As(err, &ve) {
			return jsonResp(http.StatusBadRequest, map[string]string{"error": ve.Detail, "code": ve.Code}), nil
		}
		return jsonResp(http.StatusBadRequest, map[string]string{"error": err.Error()}), nil
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

	if err := validation.MeetingSettings(settings); err != nil {
		var ve *validation.ValidationError
		if errors.As(err, &ve) {
			return jsonResp(http.StatusBadRequest, map[string]string{"error": ve.Detail, "code": ve.Code}), nil
		}
		return jsonResp(http.StatusBadRequest, map[string]string{"error": err.Error()}), nil
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

	// Enrich with NLP signals
	keyTopics := nova.ExtractTopics(meeting.Messages, 8)
	actionItems := nova.ExtractActionItems(meeting.Messages, 5)
	sentimentBreakdown := sentimentBreakdown(meeting.Messages)

	summary := map[string]interface{}{
		"session_id":          meeting.SessionID,
		"title":               meeting.Title,
		"created_at":          meeting.CreatedAt,
		"duration_minutes":    durationMin,
		"participant_count":   len(speakers),
		"participants":        speakers,
		"message_count":       userMsgs,
		"ai_response_count":   aiMsgs,
		"key_topics":          keyTopics,
		"action_items":        actionItems,
		"sentiment_breakdown": sentimentBreakdown,
		"settings":            meeting.Settings,
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
func (h *Handler) listMeetings(_ context.Context, _ events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// For now we don't support full list scan without an owner index.
	// Return 501 with a clear message so the frontend knows it's not implemented yet.
	return jsonResp(http.StatusNotImplemented, map[string]string{
		"error": "list meetings requires a user index - coming in next phase",
		"hint":  "use GET /meetings/{id} to fetch a specific meeting",
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

// sentimentBreakdown counts user messages by their Sentiment label.
// AI messages are excluded (they don't carry a sentiment label).
func sentimentBreakdown(messages []models.Message) map[string]int {
	counts := map[string]int{
		"positive": 0,
		"negative": 0,
		"neutral":  0,
		"question": 0,
	}
	for _, m := range messages {
		if m.IsAI {
			continue
		}
		label := m.Sentiment
		if label == "" {
			// Legacy messages stored before sentiment tagging was introduced
			label = sentiment.Tag(m.Text)
		}
		if _, ok := counts[label]; ok {
			counts[label]++
		}
	}
	return counts
}

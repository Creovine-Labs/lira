package wshandler

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/creovine/lira-ai-backend/internal/audio"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/creovine/lira-ai-backend/internal/sentiment"
	"github.com/creovine/lira-ai-backend/internal/tts"
	"github.com/creovine/lira-ai-backend/internal/validation"
	"github.com/creovine/lira-ai-backend/pkg/logging"
	"github.com/creovine/lira-ai-backend/pkg/ratelimit"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// Handler processes WebSocket events from API Gateway.
type Handler struct {
	store       appctx.Store
	broadcaster Broadcaster
	ai          nova.AIService
	speech      tts.TTSService       // optional; nil disables audio synthesis
	buffers     *audio.BufferManager // optional; nil disables audio buffering
	uploader    audio.Uploader       // optional; nil disables audio upload
	rateLimiter *ratelimit.Limiter
	logger      zerolog.Logger
}

// NewHandler creates a new WebSocket event handler (text-only, no TTS).
func NewHandler(store appctx.Store, broadcaster Broadcaster, ai nova.AIService, logger zerolog.Logger) *Handler {
	return &Handler{
		store:       store,
		broadcaster: broadcaster,
		ai:          ai,
		rateLimiter: ratelimit.NewWSLimiter(),
		logger:      logger,
	}
}

// NewHandlerWithTTS creates a Handler with speech synthesis enabled.
func NewHandlerWithTTS(store appctx.Store, broadcaster Broadcaster, ai nova.AIService, speech tts.TTSService, logger zerolog.Logger) *Handler {
	h := NewHandler(store, broadcaster, ai, logger)
	h.speech = speech
	return h
}

// WithAudio enables audio buffering and S3 upload for audio_chunk messages.
// Call after construction: h = NewHandlerWithTTS(...).WithAudio(uploader)
func (h *Handler) WithAudio(uploader audio.Uploader) *Handler {
	h.uploader = uploader
	h.buffers = audio.NewBufferManager()
	return h
}

// Handle routes the event to the appropriate handler based on route key.
func (h *Handler) Handle(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	connID := event.RequestContext.ConnectionID
	routeKey := event.RequestContext.RouteKey
	log := logging.WithConnection(h.logger, connID)

	log.Info().Str("route", routeKey).Msg("handling event")

	switch routeKey {
	case "$connect":
		return h.handleConnect(ctx, connID, event)
	case "$disconnect":
		return h.handleDisconnect(ctx, connID)
	case "message":
		return h.handleMessage(ctx, connID, event)
	default:
		log.Warn().Str("route", routeKey).Msg("unknown route")
		return response(400, "unknown route: "+routeKey), nil
	}
}

// handleConnect stores the new connection. Session binding happens on "join".
func (h *Handler) handleConnect(ctx context.Context, connID string, _ events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	log := logging.WithConnection(h.logger, connID)

	conn := models.Connection{
		ConnectionID: connID,
		ConnectedAt:  time.Now().UTC(),
		TTL:          time.Now().Add(24 * time.Hour).Unix(),
	}

	if err := h.store.SaveConnection(ctx, conn); err != nil {
		log.Error().Err(err).Msg("failed to save connection")
		return response(500, "internal error"), nil
	}

	log.Info().Msg("connected")
	return response(200, "connected"), nil
}

// handleDisconnect cleans up the connection and notifies the session.
func (h *Handler) handleDisconnect(ctx context.Context, connID string) (events.APIGatewayProxyResponse, error) {
	log := logging.WithConnection(h.logger, connID)

	// Look up connection to find session
	conn, err := h.store.GetConnectionByID(ctx, connID)
	if err != nil {
		log.Warn().Err(err).Msg("connection not found on disconnect")
		// Still delete even if lookup fails
		_ = h.store.DeleteConnection(ctx, connID)
		return response(200, "disconnected"), nil
	}

	// Delete the connection
	if err := h.store.DeleteConnection(ctx, connID); err != nil {
		log.Error().Err(err).Msg("failed to delete connection")
	}

	// Discard any buffered audio for this connection.
	if h.buffers != nil {
		h.buffers.Delete(connID)
	}

	// Notify session participants if connection was bound to a session
	if conn.SessionID != "" {
		leaveMsg := models.OutboundMessage{
			Type:      "participant_event",
			SessionID: conn.SessionID,
			Payload: models.ParticipantEventPayload{
				UserID: conn.UserID,
				Event:  "left",
			},
		}
		if err := h.broadcaster.BroadcastToSession(ctx, conn.SessionID, leaveMsg, connID); err != nil {
			log.Warn().Err(err).Msg("failed to broadcast leave")
		}
	}

	log.Info().Str("session_id", conn.SessionID).Msg("disconnected")
	return response(200, "disconnected"), nil
}

// handleMessage parses the inbound message and routes by action.
func (h *Handler) handleMessage(ctx context.Context, connID string, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	log := logging.WithConnection(h.logger, connID)

	var msg models.InboundMessage
	if err := json.Unmarshal([]byte(event.Body), &msg); err != nil {
		log.Warn().Err(err).Str("body", event.Body).Msg("invalid message format")
		h.sendError(ctx, connID, "INVALID_FORMAT", "message must be valid JSON with 'action' field")
		return response(400, "invalid format"), nil
	}

	log = logging.WithAction(log, msg.Action)

	// Rate limit per connection: 2 messages/sec, burst 10.
	if !h.rateLimiter.Allow(connID) {
		h.sendError(ctx, connID, "RATE_LIMITED", "too many requests, slow down")
		return response(429, "rate limited"), nil
	}

	switch msg.Action {
	case "join":
		return h.handleJoin(ctx, connID, msg, log)
	case "text":
		return h.handleText(ctx, connID, msg, log)
	case "audio_chunk":
		return h.handleAudioChunk(ctx, connID, msg, log)
	case "settings":
		return h.handleSettings(ctx, connID, msg, log)
	case "leave":
		return h.handleLeave(ctx, connID, msg, log)
	default:
		log.Warn().Msg("unknown action")
		h.sendError(ctx, connID, "UNKNOWN_ACTION", "unknown action: "+msg.Action)
		return response(400, "unknown action"), nil
	}
}

// handleJoin binds the connection to a session and creates the meeting if new.
func (h *Handler) handleJoin(ctx context.Context, connID string, msg models.InboundMessage, log zerolog.Logger) (events.APIGatewayProxyResponse, error) {
	payloadBytes, err := json.Marshal(msg.Payload)
	if err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid join payload")
		return response(400, "invalid payload"), nil
	}
	var join models.JoinPayload
	if err := json.Unmarshal(payloadBytes, &join); err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid join payload")
		return response(400, "invalid payload"), nil
	}

	if err := validation.JoinPayload(join); err != nil {
		var ve *validation.ValidationError
		if errors.As(err, &ve) {
			h.sendError(ctx, connID, ve.Code, ve.Detail)
		} else {
			h.sendError(ctx, connID, "INVALID_PAYLOAD", err.Error())
		}
		return response(400, "invalid payload"), nil
	}

	sessionID := msg.SessionID
	if sessionID == "" {
		sessionID = uuid.New().String()
	}

	log = logging.WithSession(log, sessionID)

	// Update connection with session + user info
	conn := models.Connection{
		ConnectionID: connID,
		SessionID:    sessionID,
		UserID:       join.UserID,
		ConnectedAt:  time.Now().UTC(),
		TTL:          time.Now().Add(24 * time.Hour).Unix(),
	}
	if err := h.store.SaveConnection(ctx, conn); err != nil {
		log.Error().Err(err).Msg("failed to update connection")
		return response(500, "internal error"), nil
	}

	// Create or get meeting
	meeting, err := h.store.GetMeeting(ctx, sessionID)
	if err != nil {
		// Meeting doesn't exist, create it
		settings := models.DefaultSettings()
		if join.Settings.Personality != "" {
			settings = join.Settings
		}
		titleSuffix := sessionID
		if len(titleSuffix) > 8 {
			titleSuffix = titleSuffix[:8]
		}
		meeting = models.Meeting{
			SessionID:    sessionID,
			Title:        "Meeting " + titleSuffix,
			CreatedAt:    time.Now().UTC(),
			UpdatedAt:    time.Now().UTC(),
			TTL:          time.Now().Add(24 * time.Hour).Unix(),
			Settings:     settings,
			Messages:     []models.Message{},
			Participants: []string{join.UserID},
		}
		if err := h.store.SaveMeeting(ctx, meeting); err != nil {
			log.Error().Err(err).Msg("failed to create meeting")
			return response(500, "internal error"), nil
		}
		log.Info().Msg("created new meeting")
	}

	// Send join confirmation to the joining user
	joinConfirm := models.OutboundMessage{
		Type:      "joined",
		SessionID: sessionID,
		Payload: map[string]interface{}{
			"session_id":   sessionID,
			"user_id":      join.UserID,
			"settings":     meeting.Settings,
			"participants": meeting.Participants,
		},
	}
	if err := h.broadcaster.SendToConnection(ctx, connID, joinConfirm); err != nil {
		log.Warn().Err(err).Msg("failed to send join confirmation")
	}

	// Broadcast join event to others
	joinEvent := models.OutboundMessage{
		Type:      "participant_event",
		SessionID: sessionID,
		Payload: models.ParticipantEventPayload{
			UserID:   join.UserID,
			UserName: join.UserName,
			Event:    "joined",
		},
	}
	if err := h.broadcaster.BroadcastToSession(ctx, sessionID, joinEvent, connID); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast join")
	}

	// AI greeting
	greeting, err := h.ai.GenerateResponse(ctx, sessionID, nil, meeting.Settings)
	if err != nil {
		log.Warn().Err(err).Msg("failed to generate AI greeting")
	} else {
		aiMsg := models.OutboundMessage{
			Type:      "ai_response",
			SessionID: sessionID,
			Payload: models.AIResponsePayload{
				Text:       greeting,
				Confidence: 1.0,
			},
		}
		if err := h.broadcaster.SendToConnection(ctx, connID, aiMsg); err != nil {
			log.Warn().Err(err).Msg("failed to send AI greeting")
		}
	}

	log.Info().Str("user_id", join.UserID).Msg("user joined session")
	return response(200, "joined"), nil
}

// handleText processes a text message, stores it, and triggers AI response.
func (h *Handler) handleText(ctx context.Context, connID string, msg models.InboundMessage, log zerolog.Logger) (events.APIGatewayProxyResponse, error) {
	// Get connection to find session
	conn, err := h.store.GetConnectionByID(ctx, connID)
	if err != nil {
		h.sendError(ctx, connID, "NOT_IN_SESSION", "join a session first")
		return response(400, "not in session"), nil
	}
	if conn.SessionID == "" {
		h.sendError(ctx, connID, "NOT_IN_SESSION", "join a session first")
		return response(400, "not in session"), nil
	}

	log = logging.WithSession(log, conn.SessionID)

	payloadBytes, err := json.Marshal(msg.Payload)
	if err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid text payload")
		return response(400, "invalid payload"), nil
	}
	var text models.TextPayload
	if err := json.Unmarshal(payloadBytes, &text); err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid text payload")
		return response(400, "invalid payload"), nil
	}
	if err := validation.TextPayload(text); err != nil {
		var ve *validation.ValidationError
		if errors.As(err, &ve) {
			h.sendError(ctx, connID, ve.Code, ve.Detail)
		} else {
			h.sendError(ctx, connID, "INVALID_PAYLOAD", err.Error())
		}
		return response(400, "invalid payload"), nil
	}

	// Store the message
	userMsg := models.Message{
		ID:        uuid.New().String(),
		Speaker:   conn.UserID,
		Text:      text.Text,
		Timestamp: time.Now().UTC(),
		IsAI:      false,
		Sentiment: sentiment.Tag(text.Text),
	}
	if err := h.store.AppendMessage(ctx, conn.SessionID, userMsg); err != nil {
		log.Error().Err(err).Msg("failed to store message")
	}

	// Broadcast transcription to all participants
	transcription := models.OutboundMessage{
		Type:      "transcription",
		SessionID: conn.SessionID,
		Payload: models.TranscriptionPayload{
			Speaker: conn.UserID,
			Text:    text.Text,
			IsFinal: true,
		},
	}
	if err := h.broadcaster.BroadcastToSession(ctx, conn.SessionID, transcription, ""); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast transcription")
	}

	// Get meeting for context and generate AI response
	meeting, err := h.store.GetMeeting(ctx, conn.SessionID)
	if err != nil {
		log.Warn().Err(err).Msg("failed to get meeting for AI")
		return response(200, "sent"), nil
	}

	// Policy gate: decide whether Lira should respond
	if !nova.ShouldAIRespond(nova.DecisionInput{Meeting: meeting, NewMessage: userMsg}) {
		log.Debug().Msg("AI response suppressed by policy")
		return response(200, "sent"), nil
	}

	aiText, err := h.ai.GenerateResponse(ctx, conn.SessionID, meeting.Messages, meeting.Settings)
	if err != nil {
		log.Warn().Err(err).Msg("AI response failed")
		return response(200, "sent"), nil
	}

	// Store AI message
	aiMessage := models.Message{
		ID:        uuid.New().String(),
		Speaker:   "lira-ai",
		Text:      aiText,
		Timestamp: time.Now().UTC(),
		IsAI:      true,
	}
	if err := h.store.AppendMessage(ctx, conn.SessionID, aiMessage); err != nil {
		log.Warn().Err(err).Msg("failed to store AI message")
	}

	// Update AI state for cooldown tracking
	meeting.AIState.LastResponseTime = time.Now().UTC()
	meeting.AIState.ResponseCount++
	_ = h.store.SaveMeeting(ctx, meeting)

	// Optional: synthesise speech and bundle with the text response.
	audioB64, audioFmt := "", ""
	if h.speech != nil {
		synRes, synErr := h.speech.Synthesize(ctx, tts.DefaultRequest(aiText))
		if synErr != nil {
			log.Warn().Err(synErr).Msg("TTS synthesis failed, sending text only")
		} else {
			audioB64 = base64.StdEncoding.EncodeToString(synRes.AudioBytes)
			audioFmt = string(synRes.Format)
		}
	}

	// Broadcast AI response
	aiResp := models.OutboundMessage{
		Type:      "ai_response",
		SessionID: conn.SessionID,
		Payload: models.AIResponsePayload{
			Text:        aiText,
			Confidence:  0.85,
			AudioBase64: audioB64,
			AudioFormat: audioFmt,
		},
	}
	if err := h.broadcaster.BroadcastToSession(ctx, conn.SessionID, aiResp, ""); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast AI response")
	}

	log.Info().Str("user_id", conn.UserID).Int("text_len", len(text.Text)).Msg("text processed")
	return response(200, "sent"), nil
}

// handleSettings updates meeting settings.
func (h *Handler) handleSettings(ctx context.Context, connID string, msg models.InboundMessage, log zerolog.Logger) (events.APIGatewayProxyResponse, error) {
	conn, err := h.store.GetConnectionByID(ctx, connID)
	if err != nil || conn.SessionID == "" {
		h.sendError(ctx, connID, "NOT_IN_SESSION", "join a session first")
		return response(400, "not in session"), nil
	}

	log = logging.WithSession(log, conn.SessionID)

	payloadBytes, err := json.Marshal(msg.Payload)
	if err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid settings payload")
		return response(400, "invalid payload"), nil
	}
	var settings models.SettingsPayload
	if err := json.Unmarshal(payloadBytes, &settings); err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid settings payload")
		return response(400, "invalid payload"), nil
	}
	if err := validation.SettingsPayload(settings); err != nil {
		var ve *validation.ValidationError
		if errors.As(err, &ve) {
			h.sendError(ctx, connID, ve.Code, ve.Detail)
		} else {
			h.sendError(ctx, connID, "INVALID_PAYLOAD", err.Error())
		}
		return response(400, "invalid payload"), nil
	}

	// Get current meeting and update settings
	meeting, err := h.store.GetMeeting(ctx, conn.SessionID)
	if err != nil {
		log.Error().Err(err).Msg("meeting not found")
		return response(500, "internal error"), nil
	}

	meeting.Settings = settings.Settings
	meeting.UpdatedAt = time.Now().UTC()

	if err := h.store.SaveMeeting(ctx, meeting); err != nil {
		log.Error().Err(err).Msg("failed to update meeting settings")
		return response(500, "internal error"), nil
	}

	// Confirm to all participants
	settingsMsg := models.OutboundMessage{
		Type:      "settings_updated",
		SessionID: conn.SessionID,
		Payload:   settings.Settings,
	}
	if err := h.broadcaster.BroadcastToSession(ctx, conn.SessionID, settingsMsg, ""); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast settings update")
	}

	log.Info().Msg("settings updated")
	return response(200, "settings updated"), nil
}

// handleLeave removes the user from the session.
func (h *Handler) handleLeave(ctx context.Context, connID string, msg models.InboundMessage, log zerolog.Logger) (events.APIGatewayProxyResponse, error) {
	conn, err := h.store.GetConnectionByID(ctx, connID)
	if err != nil || conn.SessionID == "" {
		return response(200, "ok"), nil
	}

	log = logging.WithSession(log, conn.SessionID)

	// Clear session from connection (but keep connection alive)
	conn.SessionID = ""
	conn.UserID = ""
	if err := h.store.SaveConnection(ctx, conn); err != nil {
		log.Warn().Err(err).Msg("failed to clear connection session")
	}

	// Notify others
	leaveEvent := models.OutboundMessage{
		Type:      "participant_event",
		SessionID: msg.SessionID,
		Payload: models.ParticipantEventPayload{
			UserID: conn.UserID,
			Event:  "left",
		},
	}
	if err := h.broadcaster.BroadcastToSession(ctx, msg.SessionID, leaveEvent, connID); err != nil {
		log.Warn().Err(err).Msg("failed to broadcast leave")
	}

	log.Info().Msg("user left session")
	return response(200, "left"), nil
}

// handleAudioChunk processes an incremental audio chunk from the client.
// It accumulates PCM16-LE (or other format) bytes in a per-connection Buffer and
// runs the VAD to detect utterance boundaries. When an utterance is complete (or
// the client sets is_final=true), the buffer is flushed and uploaded to S3 so
// that the audio-processor Lambda can pick it up for transcription and AI response.
func (h *Handler) handleAudioChunk(ctx context.Context, connID string, msg models.InboundMessage, log zerolog.Logger) (events.APIGatewayProxyResponse, error) {
	if h.uploader == nil || h.buffers == nil {
		h.sendError(ctx, connID, "AUDIO_DISABLED", "audio streaming is not configured on this server")
		return response(400, "audio disabled"), nil
	}

	payloadBytes, err := json.Marshal(msg.Payload)
	if err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid audio_chunk payload")
		return response(400, "invalid payload"), nil
	}

	var chunk models.AudioPayload
	if err := json.Unmarshal(payloadBytes, &chunk); err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "invalid audio_chunk payload")
		return response(400, "invalid payload"), nil
	}
	if err := validation.AudioPayload(chunk); err != nil {
		var ve *validation.ValidationError
		if errors.As(err, &ve) {
			h.sendError(ctx, connID, ve.Code, ve.Detail)
		} else {
			h.sendError(ctx, connID, "INVALID_PAYLOAD", err.Error())
		}
		return response(400, "invalid payload"), nil
	}

	raw, err := base64.StdEncoding.DecodeString(chunk.Data)
	if err != nil {
		h.sendError(ctx, connID, "INVALID_PAYLOAD", "data must be base64-encoded")
		return response(400, "invalid payload"), nil
	}

	buf := h.buffers.GetOrCreate(connID)
	if chunk.Format != "" {
		buf.Format = chunk.Format
	}

	shouldFlush := buf.Feed(raw) || chunk.IsFinal

	if !shouldFlush {
		ack := models.OutboundMessage{
			Type: "chunk_ack",
			Payload: models.ChunkAckPayload{
				Buffered: buf.Len(),
				Uploaded: false,
			},
		}
		_ = h.broadcaster.SendToConnection(ctx, connID, ack)
		return response(200, "buffered"), nil
	}

	// Utterance complete — flush buffer and upload.
	data := buf.Flush()
	if len(data) == 0 {
		return response(200, "empty"), nil
	}

	format := chunk.Format
	if format == "" {
		format = "pcm16"
	}

	conn, err := h.store.GetConnectionByID(ctx, connID)
	if err != nil {
		log.Warn().Err(err).Msg("could not get connection for audio upload")
		return response(200, "no session"), nil
	}

	s3Key, uploadErr := h.uploader.Upload(ctx, conn.SessionID, data, format)
	if uploadErr != nil {
		log.Error().Err(uploadErr).Str("session", conn.SessionID).Msg("audio upload to S3 failed")
		// Best-effort: don't fail the WebSocket call on upload error.
		return response(200, "upload failed"), nil
	}

	log.Info().
		Str("session", conn.SessionID).
		Str("key", s3Key).
		Int("bytes", len(data)).
		Msg("audio utterance uploaded")

	ack := models.OutboundMessage{
		Type: "chunk_ack",
		Payload: models.ChunkAckPayload{
			Uploaded: true,
			S3Key:    s3Key,
		},
	}
	_ = h.broadcaster.SendToConnection(ctx, connID, ack)
	return response(200, "uploaded"), nil
}

// sendError sends an error message to a specific connection.
func (h *Handler) sendError(ctx context.Context, connID string, code string, message string) {
	errMsg := models.OutboundMessage{
		Type: "error",
		Payload: models.ErrorPayload{
			Code:    code,
			Message: message,
		},
	}
	_ = h.broadcaster.SendToConnection(ctx, connID, errMsg)
}

func response(statusCode int, body string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       fmt.Sprintf(`{"message":"%s"}`, body),
	}
}

#!/usr/bin/env python3
"""Generate Go source files for Lira AI backend."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

files = {}

# --- internal/context/manager.go ---
files["internal/context/manager.go"] = r'''package context

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/pkg/config"
)

// Store defines the persistence interface for connections and meetings.
type Store interface {
	SaveConnection(ctx context.Context, conn models.Connection) error
	DeleteConnection(ctx context.Context, connectionID string) error
	GetConnectionsBySession(ctx context.Context, sessionID string) ([]models.Connection, error)
	GetConnectionByID(ctx context.Context, connectionID string) (models.Connection, error)
	SaveMeeting(ctx context.Context, meeting models.Meeting) error
	GetMeeting(ctx context.Context, sessionID string) (models.Meeting, error)
	AppendMessage(ctx context.Context, sessionID string, msg models.Message) error
}

// DynamoStore implements Store using DynamoDB.
type DynamoStore struct {
	client    *dynamodb.Client
	connTable string
	meetTable string
}

// NewDynamoStore creates a DynamoDB-backed store.
func NewDynamoStore(ctx context.Context, cfg config.Config) (*DynamoStore, error) {
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(cfg.AWSRegion))
	if err != nil {
		return nil, fmt.Errorf("load AWS config: %w", err)
	}
	return &DynamoStore{
		client:    dynamodb.NewFromConfig(awsCfg),
		connTable: cfg.ConnectionsTableName,
		meetTable: cfg.MeetingsTableName,
	}, nil
}

func (s *DynamoStore) SaveConnection(ctx context.Context, conn models.Connection) error {
	item, err := attributevalue.MarshalMap(conn)
	if err != nil {
		return fmt.Errorf("marshal connection: %w", err)
	}
	_, err = s.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.connTable),
		Item:      item,
	})
	return err
}

func (s *DynamoStore) DeleteConnection(ctx context.Context, connectionID string) error {
	_, err := s.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(s.connTable),
		Key: map[string]types.AttributeValue{
			"connection_id": &types.AttributeValueMemberS{Value: connectionID},
		},
	})
	return err
}

func (s *DynamoStore) GetConnectionsBySession(ctx context.Context, sessionID string) ([]models.Connection, error) {
	result, err := s.client.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(s.connTable),
		FilterExpression: aws.String("session_id = :sid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":sid": &types.AttributeValueMemberS{Value: sessionID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("scan connections: %w", err)
	}
	var conns []models.Connection
	err = attributevalue.UnmarshalListOfMaps(result.Items, &conns)
	return conns, err
}

func (s *DynamoStore) GetConnectionByID(ctx context.Context, connectionID string) (models.Connection, error) {
	result, err := s.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.connTable),
		Key: map[string]types.AttributeValue{
			"connection_id": &types.AttributeValueMemberS{Value: connectionID},
		},
	})
	if err != nil {
		return models.Connection{}, fmt.Errorf("get connection: %w", err)
	}
	if result.Item == nil {
		return models.Connection{}, fmt.Errorf("connection %s not found", connectionID)
	}
	var conn models.Connection
	err = attributevalue.UnmarshalMap(result.Item, &conn)
	return conn, err
}

func (s *DynamoStore) SaveMeeting(ctx context.Context, meeting models.Meeting) error {
	item, err := attributevalue.MarshalMap(meeting)
	if err != nil {
		return fmt.Errorf("marshal meeting: %w", err)
	}
	_, err = s.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.meetTable),
		Item:      item,
	})
	return err
}

func (s *DynamoStore) GetMeeting(ctx context.Context, sessionID string) (models.Meeting, error) {
	result, err := s.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.meetTable),
		Key: map[string]types.AttributeValue{
			"session_id": &types.AttributeValueMemberS{Value: sessionID},
		},
	})
	if err != nil {
		return models.Meeting{}, fmt.Errorf("get meeting: %w", err)
	}
	if result.Item == nil {
		return models.Meeting{}, fmt.Errorf("meeting %s not found", sessionID)
	}
	var meeting models.Meeting
	err = attributevalue.UnmarshalMap(result.Item, &meeting)
	return meeting, err
}

func (s *DynamoStore) AppendMessage(ctx context.Context, sessionID string, msg models.Message) error {
	msgAV, err := attributevalue.MarshalMap(msg)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}
	_, err = s.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(s.meetTable),
		Key: map[string]types.AttributeValue{
			"session_id": &types.AttributeValueMemberS{Value: sessionID},
		},
		UpdateExpression: aws.String("SET messages = list_append(if_not_exists(messages, :empty), :msg), updated_at = :now"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":msg":   &types.AttributeValueMemberL{Value: []types.AttributeValue{&types.AttributeValueMemberM{Value: msgAV}}},
			":empty": &types.AttributeValueMemberL{Value: []types.AttributeValue{}},
			":now":   &types.AttributeValueMemberS{Value: time.Now().UTC().Format(time.RFC3339)},
		},
	})
	return err
}

// MockStore implements Store in memory.
type MockStore struct {
	mu          sync.RWMutex
	connections map[string]models.Connection
	meetings    map[string]models.Meeting
}

// NewMockStore creates an in-memory store.
func NewMockStore() *MockStore {
	return &MockStore{
		connections: make(map[string]models.Connection),
		meetings:    make(map[string]models.Meeting),
	}
}

func (m *MockStore) SaveConnection(_ context.Context, conn models.Connection) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connections[conn.ConnectionID] = conn
	return nil
}

func (m *MockStore) DeleteConnection(_ context.Context, connectionID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.connections, connectionID)
	return nil
}

func (m *MockStore) GetConnectionsBySession(_ context.Context, sessionID string) ([]models.Connection, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var result []models.Connection
	for _, c := range m.connections {
		if c.SessionID == sessionID {
			result = append(result, c)
		}
	}
	return result, nil
}

func (m *MockStore) GetConnectionByID(_ context.Context, connectionID string) (models.Connection, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	conn, ok := m.connections[connectionID]
	if !ok {
		return models.Connection{}, fmt.Errorf("connection %s not found", connectionID)
	}
	return conn, nil
}

func (m *MockStore) SaveMeeting(_ context.Context, meeting models.Meeting) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.meetings[meeting.SessionID] = meeting
	return nil
}

func (m *MockStore) GetMeeting(_ context.Context, sessionID string) (models.Meeting, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	meeting, ok := m.meetings[sessionID]
	if !ok {
		return models.Meeting{}, fmt.Errorf("meeting %s not found", sessionID)
	}
	return meeting, nil
}

func (m *MockStore) AppendMessage(_ context.Context, sessionID string, msg models.Message) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	meeting, ok := m.meetings[sessionID]
	if !ok {
		return fmt.Errorf("meeting %s not found", sessionID)
	}
	meeting.Messages = append(meeting.Messages, msg)
	meeting.UpdatedAt = time.Now().UTC()
	m.meetings[sessionID] = meeting
	return nil
}

// ConnectionCount returns the number of stored connections (for testing).
func (m *MockStore) ConnectionCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.connections)
}

// MeetingCount returns the number of stored meetings (for testing).
func (m *MockStore) MeetingCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.meetings)
}
'''

# --- internal/nova/mock.go ---
files["internal/nova/mock.go"] = r'''package nova

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
'''

# --- internal/nova/mock_test.go ---
files["internal/nova/mock_test.go"] = r'''package nova

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
'''

# --- internal/wshandler/broadcast.go ---
files["internal/wshandler/broadcast.go"] = r'''package wshandler

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/apigatewaymanagementapi"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/rs/zerolog"
)

// Broadcaster sends messages to WebSocket connections.
type Broadcaster interface {
	SendToConnection(ctx context.Context, connectionID string, msg models.OutboundMessage) error
	BroadcastToSession(ctx context.Context, sessionID string, msg models.OutboundMessage, excludeConnID string) error
}

// APIGWBroadcaster sends messages via API Gateway Management API.
type APIGWBroadcaster struct {
	client *apigatewaymanagementapi.Client
	store  appctx.Store
	logger zerolog.Logger
}

// NewAPIGWBroadcaster creates a broadcaster backed by API Gateway.
func NewAPIGWBroadcaster(ctx context.Context, endpoint string, region string, store appctx.Store, logger zerolog.Logger) (*APIGWBroadcaster, error) {
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithRegion(region))
	if err != nil {
		return nil, fmt.Errorf("load AWS config: %w", err)
	}
	client := apigatewaymanagementapi.NewFromConfig(awsCfg, func(o *apigatewaymanagementapi.Options) {
		o.BaseEndpoint = aws.String(endpoint)
	})
	return &APIGWBroadcaster{
		client: client,
		store:  store,
		logger: logger,
	}, nil
}

func (b *APIGWBroadcaster) SendToConnection(ctx context.Context, connectionID string, msg models.OutboundMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}
	_, err = b.client.PostToConnection(ctx, &apigatewaymanagementapi.PostToConnectionInput{
		ConnectionId: aws.String(connectionID),
		Data:         data,
	})
	if err != nil {
		b.logger.Warn().Str("connection_id", connectionID).Err(err).Msg("failed to send to connection")
		return err
	}
	return nil
}

func (b *APIGWBroadcaster) BroadcastToSession(ctx context.Context, sessionID string, msg models.OutboundMessage, excludeConnID string) error {
	conns, err := b.store.GetConnectionsBySession(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("get connections: %w", err)
	}
	for _, conn := range conns {
		if conn.ConnectionID == excludeConnID {
			continue
		}
		if sendErr := b.SendToConnection(ctx, conn.ConnectionID, msg); sendErr != nil {
			b.logger.Warn().Str("connection_id", conn.ConnectionID).Err(sendErr).Msg("broadcast send failed")
		}
	}
	return nil
}

// SentMessage records a message sent to a specific connection.
type SentMessage struct {
	ConnectionID string
	Message      models.OutboundMessage
}

// MockBroadcaster records messages for testing.
type MockBroadcaster struct {
	mu       sync.Mutex
	Sent     []SentMessage
	store    appctx.Store
	FailFunc func(connectionID string) error
}

// NewMockBroadcaster creates a mock broadcaster.
func NewMockBroadcaster(store appctx.Store) *MockBroadcaster {
	return &MockBroadcaster{
		Sent:  []SentMessage{},
		store: store,
	}
}

func (m *MockBroadcaster) SendToConnection(_ context.Context, connectionID string, msg models.OutboundMessage) error {
	if m.FailFunc != nil {
		if err := m.FailFunc(connectionID); err != nil {
			return err
		}
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.Sent = append(m.Sent, SentMessage{ConnectionID: connectionID, Message: msg})
	return nil
}

func (m *MockBroadcaster) BroadcastToSession(ctx context.Context, sessionID string, msg models.OutboundMessage, excludeConnID string) error {
	conns, err := m.store.GetConnectionsBySession(ctx, sessionID)
	if err != nil {
		return err
	}
	for _, conn := range conns {
		if conn.ConnectionID == excludeConnID {
			continue
		}
		if err := m.SendToConnection(ctx, conn.ConnectionID, msg); err != nil {
			continue
		}
	}
	return nil
}

// SentCount returns the total number of sent messages (thread-safe).
func (m *MockBroadcaster) SentCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.Sent)
}

// Reset clears all recorded messages.
func (m *MockBroadcaster) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.Sent = []SentMessage{}
}
'''

# Write all files
for relpath, content in files.items():
    fullpath = os.path.join(BASE, relpath)
    os.makedirs(os.path.dirname(fullpath), exist_ok=True)
    # Strip leading newline from raw strings
    if content.startswith('\n'):
        content = content[1:]
    with open(fullpath, 'w', newline='\n') as f:
        f.write(content)
    print(f"OK: {relpath} ({content.count(chr(10))} lines)")

print("Done!")

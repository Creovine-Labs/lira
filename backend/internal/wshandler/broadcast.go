package wshandler

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

// Broadcaster is an alias for appctx.Broadcaster so callers can continue to use
// wshandler.Broadcaster — the canonical definition now lives in internal/context.
type Broadcaster = appctx.Broadcaster

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

package context

import (
	"context"
	"sync"

	"github.com/creovine/lira-ai-backend/internal/models"
)

// SentMessage records one SendToConnection call.
type SentMessage struct {
	ConnectionID string
	Message      models.OutboundMessage
}

// MockBroadcaster records outbound messages for unit tests.
// It lives in the appctx package so both internal/audio and internal/wshandler
// can use it without creating an import cycle.
// Safe for concurrent use.
type MockBroadcaster struct {
	mu       sync.Mutex
	Sent     []SentMessage
	store    Store
	FailFunc func(connectionID string) error
}

// NewMockBroadcaster creates a mock broadcaster backed by store.
func NewMockBroadcaster(store Store) *MockBroadcaster {
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
		_ = m.SendToConnection(ctx, conn.ConnectionID, msg)
	}
	return nil
}

// SentCount returns the number of messages recorded (thread-safe).
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

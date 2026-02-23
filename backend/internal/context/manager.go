package context

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
	"github.com/creovine/lira-ai-backend/pkg/retry"
)

// Broadcaster sends messages to WebSocket connections.
// Defined here (rather than in wshandler) so that the audio package can depend
// on it without creating an import cycle with wshandler.
type Broadcaster interface {
	SendToConnection(ctx context.Context, connectionID string, msg models.OutboundMessage) error
	BroadcastToSession(ctx context.Context, sessionID string, msg models.OutboundMessage, excludeConnID string) error
}

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
	return retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		_, err = s.client.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(s.connTable),
			Item:      item,
		})
		return err
	})
}

func (s *DynamoStore) DeleteConnection(ctx context.Context, connectionID string) error {
	return retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		_, err := s.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
			TableName: aws.String(s.connTable),
			Key: map[string]types.AttributeValue{
				"connection_id": &types.AttributeValueMemberS{Value: connectionID},
			},
		})
		return err
	})
}

func (s *DynamoStore) GetConnectionsBySession(ctx context.Context, sessionID string) ([]models.Connection, error) {
	var conns []models.Connection
	err := retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		result, err := s.client.Scan(ctx, &dynamodb.ScanInput{
			TableName:        aws.String(s.connTable),
			FilterExpression: aws.String("session_id = :sid"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":sid": &types.AttributeValueMemberS{Value: sessionID},
			},
		})
		if err != nil {
			return fmt.Errorf("scan connections: %w", err)
		}
		return attributevalue.UnmarshalListOfMaps(result.Items, &conns)
	})
	return conns, err
}

func (s *DynamoStore) GetConnectionByID(ctx context.Context, connectionID string) (models.Connection, error) {
	var conn models.Connection
	err := retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		result, err := s.client.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(s.connTable),
			Key: map[string]types.AttributeValue{
				"connection_id": &types.AttributeValueMemberS{Value: connectionID},
			},
		})
		if err != nil {
			return fmt.Errorf("get connection: %w", err)
		}
		if result.Item == nil {
			return fmt.Errorf("connection %s not found", connectionID)
		}
		return attributevalue.UnmarshalMap(result.Item, &conn)
	})
	return conn, err
}

func (s *DynamoStore) SaveMeeting(ctx context.Context, meeting models.Meeting) error {
	item, err := attributevalue.MarshalMap(meeting)
	if err != nil {
		return fmt.Errorf("marshal meeting: %w", err)
	}
	return retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		_, err = s.client.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(s.meetTable),
			Item:      item,
		})
		return err
	})
}

func (s *DynamoStore) GetMeeting(ctx context.Context, sessionID string) (models.Meeting, error) {
	var meeting models.Meeting
	err := retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		result, err := s.client.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(s.meetTable),
			Key: map[string]types.AttributeValue{
				"session_id": &types.AttributeValueMemberS{Value: sessionID},
			},
		})
		if err != nil {
			return fmt.Errorf("get meeting: %w", err)
		}
		if result.Item == nil {
			return fmt.Errorf("meeting %s not found", sessionID)
		}
		return attributevalue.UnmarshalMap(result.Item, &meeting)
	})
	return meeting, err
}

func (s *DynamoStore) AppendMessage(ctx context.Context, sessionID string, msg models.Message) error {
	msgAV, err := attributevalue.MarshalMap(msg)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}
	return retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
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
	})
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

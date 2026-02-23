package models

import "time"

// Connection represents a WebSocket connection stored in DynamoDB.
type Connection struct {
	ConnectionID string    `json:"connection_id" dynamodbav:"connection_id"`
	SessionID    string    `json:"session_id" dynamodbav:"session_id"`
	UserID       string    `json:"user_id" dynamodbav:"user_id"`
	ConnectedAt  time.Time `json:"connected_at" dynamodbav:"connected_at"`
	TTL          int64     `json:"ttl" dynamodbav:"ttl"`
}

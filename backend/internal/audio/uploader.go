package audio

import (
	"bytes"
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/creovine/lira-ai-backend/pkg/retry"
)

// Uploader stores a completed audio utterance and returns its S3 key.
type Uploader interface {
	// Upload persists data for the given sessionID and returns the S3 key
	// (or equivalent identifier) on success.
	Upload(ctx context.Context, sessionID string, data []byte, format string) (string, error)
}

// ─── S3Uploader ───────────────────────────────────────────────────────────────

// s3PutAPI is the subset of s3.Client we need; lets us inject a fake in tests.
type s3PutAPI interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

// S3Uploader writes audio blobs to an S3 bucket under the
// prefix audio/{sessionID}/{timestamp}.{format}.
// The resulting key follows the same convention expected by audio/processor.go
// so that the S3-trigger Lambda picks it up automatically.
type S3Uploader struct {
	client s3PutAPI
	bucket string
}

// NewS3Uploader creates a production uploader backed by the given S3 client.
func NewS3Uploader(client *s3.Client, bucket string) *S3Uploader {
	return &S3Uploader{client: client, bucket: bucket}
}

// Upload writes data to S3 and returns the object key.
func (u *S3Uploader) Upload(ctx context.Context, sessionID string, data []byte, format string) (string, error) {
	if format == "" {
		format = "wav"
	}
	key := fmt.Sprintf("audio/%s/%d.%s", sessionID, time.Now().UnixMilli(), format)

	err := retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		_, e := u.client.PutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(u.bucket),
			Key:         aws.String(key),
			Body:        bytes.NewReader(data),
			ContentType: aws.String(contentType(format)),
		})
		return e
	})
	if err != nil {
		return "", fmt.Errorf("s3 upload audio: %w", err)
	}
	return key, nil
}

func contentType(format string) string {
	switch format {
	case "mp3":
		return "audio/mpeg"
	case "ogg":
		return "audio/ogg"
	case "webm":
		return "audio/webm"
	case "wav":
		return "audio/wav"
	default:
		return "application/octet-stream"
	}
}

// ─── MockUploader ────────────────────────────────────────────────────────────

// UploadRecord captures one call to MockUploader.Upload.
type UploadRecord struct {
	SessionID string
	DataLen   int
	Format    string
	Key       string
}

// MockUploader records uploads in memory; safe for concurrent use in tests.
type MockUploader struct {
	mu      sync.Mutex
	Uploads []UploadRecord
	Err     error // if set, Upload returns this error
}

// NewMockUploader creates an empty MockUploader.
func NewMockUploader() *MockUploader { return &MockUploader{} }

// Upload records the call and optionally returns an error.
func (m *MockUploader) Upload(_ context.Context, sessionID string, data []byte, format string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.Err != nil {
		return "", m.Err
	}
	key := fmt.Sprintf("audio/%s/%d.%s", sessionID, time.Now().UnixMilli(), format)
	m.Uploads = append(m.Uploads, UploadRecord{
		SessionID: sessionID,
		DataLen:   len(data),
		Format:    format,
		Key:       key,
	})
	return key, nil
}

// Count returns the number of uploads recorded.
func (m *MockUploader) Count() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.Uploads)
}

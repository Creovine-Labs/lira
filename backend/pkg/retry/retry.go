package retry

import (
	"context"
	"errors"
	"math/rand"
	"strings"
	"time"

	"github.com/aws/smithy-go"
)

// DefaultBackoffs is the default set of backoff durations.
var DefaultBackoffs = []time.Duration{
	100 * time.Millisecond,
	500 * time.Millisecond,
	2 * time.Second,
}

// Do retries fn up to len(backoffs) times with exponential backoff.
// It respects context cancellation.
func Do(ctx context.Context, backoffs []time.Duration, fn func() error) error {
	if backoffs == nil {
		backoffs = DefaultBackoffs
	}
	var err error
	maxAttempts := len(backoffs) + 1

	for attempt := 0; attempt < maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}
		if attempt < len(backoffs) {
			wait := backoffs[attempt]
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(wait):
			}
		}
	}
	return err
}

// WithJitter adds random jitter (up to +50%) to each backoff duration.
// A new random source is seeded from the current nanosecond clock.
func WithJitter(backoffs []time.Duration) []time.Duration {
	//nolint:gosec — non-crypto jitter is fine
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	jittered := make([]time.Duration, len(backoffs))
	for i, b := range backoffs {
		scale := 1.0 + 0.5*rng.Float64() // [1.0, 1.5)
		jittered[i] = time.Duration(float64(b) * scale)
	}
	return jittered
}

// DoRetryable is like Do but only retries when IsRetryable(err) returns true.
// A non-retryable error is returned immediately without further attempts.
func DoRetryable(ctx context.Context, backoffs []time.Duration, fn func() error) error {
	if backoffs == nil {
		backoffs = DefaultBackoffs
	}
	var err error
	maxAttempts := len(backoffs) + 1

	for attempt := 0; attempt < maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}
		if !IsRetryable(err) {
			return err
		}
		if attempt < len(backoffs) {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoffs[attempt]):
			}
		}
	}
	return err
}

// IsRetryable returns true for transient AWS and network errors that are safe
// to retry — throttling, provisioned-throughput exceeded, 5xx service errors,
// and common network transients (EOF, connection reset, dial timeout).
func IsRetryable(err error) bool {
	if err == nil {
		return false
	}
	// context errors are never retryable
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return false
	}

	// Check smithy API error codes (used by all AWS SDK v2 services)
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		switch apiErr.ErrorCode() {
		case "ThrottlingException",
			"ThrottledException",
			"Throttling",
			"TooManyRequestsException",
			"ProvisionedThroughputExceededException",
			"RequestLimitExceeded",
			"RequestThrottled",
			"ServiceUnavailableException",
			"InternalServerError",
			"InternalFailure",
			"ServiceException",
			"SlowDown",
			"TransactionConflict":
			return true
		}
		// Treat any server-fault as retryable
		return apiErr.ErrorFault() == smithy.FaultServer
	}

	// Fallback: inspect error message for common transient patterns
	msg := strings.ToLower(err.Error())
	for _, snippet := range []string{
		"connection reset",
		"connection refused",
		"eof",
		"i/o timeout",
		"dial tcp",
		"temporary failure",
		"service unavailable",
		"throttl",
		"rate exceeded",
	} {
		if strings.Contains(msg, snippet) {
			return true
		}
	}
	return false
}

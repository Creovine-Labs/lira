package retry

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestDo_ImmediateSuccess(t *testing.T) {
	calls := 0
	err := Do(context.Background(), DefaultBackoffs, func() error {
		calls++
		return nil
	})
	assert.NoError(t, err)
	assert.Equal(t, 1, calls)
}

func TestDo_RetryThenSuccess(t *testing.T) {
	calls := 0
	err := Do(context.Background(), []time.Duration{10 * time.Millisecond}, func() error {
		calls++
		if calls < 2 {
			return errors.New("transient")
		}
		return nil
	})
	assert.NoError(t, err)
	assert.Equal(t, 2, calls)
}

func TestDo_ExhaustRetries(t *testing.T) {
	calls := 0
	backoffs := []time.Duration{5 * time.Millisecond, 5 * time.Millisecond}
	err := Do(context.Background(), backoffs, func() error {
		calls++
		return errors.New("persistent")
	})
	assert.Error(t, err)
	assert.Equal(t, "persistent", err.Error())
	assert.Equal(t, 3, calls) // 1 initial + 2 retries
}

func TestDo_ContextCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately
	calls := 0
	err := Do(ctx, []time.Duration{1 * time.Second}, func() error {
		calls++
		return errors.New("fail")
	})
	assert.Error(t, err)
	assert.Equal(t, context.Canceled, err)
	assert.Equal(t, 1, calls)
}

func TestDo_SingleAttemptNoBackoffs(t *testing.T) {
	calls := 0
	err := Do(context.Background(), []time.Duration{}, func() error {
		calls++
		return errors.New("only-once")
	})
	assert.Error(t, err)
	assert.Equal(t, 1, calls)
}

// ─── DoRetryable ──────────────────────────────────────────────────────────────

func TestDoRetryable_SucceedsImmediately(t *testing.T) {
	calls := 0
	err := DoRetryable(context.Background(), DefaultBackoffs, func() error {
		calls++
		return nil
	})
	assert.NoError(t, err)
	assert.Equal(t, 1, calls)
}

func TestDoRetryable_NonRetryableFailsFast(t *testing.T) {
	calls := 0
	nonRetryable := errors.New("validation error")
	err := DoRetryable(context.Background(), []time.Duration{
		10 * time.Millisecond,
		10 * time.Millisecond,
	}, func() error {
		calls++
		return nonRetryable
	})
	assert.Equal(t, nonRetryable, err)
	assert.Equal(t, 1, calls) // must NOT retry non-retryable error
}

func TestDoRetryable_RetryableIsRetried(t *testing.T) {
	calls := 0
	retryableErr := errors.New("throttl: too many requests")
	err := DoRetryable(context.Background(), []time.Duration{
		5 * time.Millisecond,
	}, func() error {
		calls++
		if calls < 2 {
			return retryableErr
		}
		return nil
	})
	assert.NoError(t, err)
	assert.Equal(t, 2, calls)
}

func TestDoRetryable_ContextCancelledDuringRetry(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	calls := 0
	err := DoRetryable(ctx, []time.Duration{time.Second}, func() error {
		calls++
		return errors.New("throttl")
	})
	assert.ErrorIs(t, err, context.Canceled)
	assert.Equal(t, 1, calls)
}

// ─── IsRetryable ──────────────────────────────────────────────────────────────

func TestIsRetryable_NilError(t *testing.T) {
	assert.False(t, IsRetryable(nil))
}

func TestIsRetryable_ContextCanceled(t *testing.T) {
	assert.False(t, IsRetryable(context.Canceled))
}

func TestIsRetryable_ContextDeadlineExceeded(t *testing.T) {
	assert.False(t, IsRetryable(context.DeadlineExceeded))
}

func TestIsRetryable_ThrottlingKeyword(t *testing.T) {
	err := errors.New("service throttl-rate exceeded")
	assert.True(t, IsRetryable(err))
}

func TestIsRetryable_EOFKeyword(t *testing.T) {
	err := errors.New("unexpected eof from server")
	assert.True(t, IsRetryable(err))
}

func TestIsRetryable_ServiceUnavailable(t *testing.T) {
	err := errors.New("service unavailable 503")
	assert.True(t, IsRetryable(err))
}

func TestIsRetryable_GenericAppError(t *testing.T) {
	err := errors.New("invalid user_id format")
	assert.False(t, IsRetryable(err))
}

// ─── WithJitter ───────────────────────────────────────────────────────────────

func TestWithJitter_ProducesLongerDurations(t *testing.T) {
	base := []time.Duration{100 * time.Millisecond, 1 * time.Second}
	jittered := WithJitter(base)
	assert.Len(t, jittered, len(base))
	for i, j := range jittered {
		assert.GreaterOrEqual(t, int64(j), int64(base[i]),
			"jitter must not shorten duration")
		assert.LessOrEqual(t, int64(j), int64(float64(base[i])*1.51),
			"jitter must not exceed +51%%")
	}
}

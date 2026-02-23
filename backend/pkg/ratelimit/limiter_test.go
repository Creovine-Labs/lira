package ratelimit

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestAllow_BurstThenDeny(t *testing.T) {
	l := NewLimiter(0, 3) // rate=0 means no refill; burst=3
	assert.True(t, l.Allow("key"))
	assert.True(t, l.Allow("key"))
	assert.True(t, l.Allow("key"))
	assert.False(t, l.Allow("key")) // bucket exhausted
}

func TestAllow_RefillOverTime(t *testing.T) {
	l := NewLimiter(100, 1) // 100 tokens/second, burst=1
	assert.True(t, l.Allow("k"))
	assert.False(t, l.Allow("k")) // empty

	time.Sleep(20 * time.Millisecond) // refill ~2 tokens
	assert.True(t, l.Allow("k"))
}

func TestAllow_IndependentKeys(t *testing.T) {
	l := NewLimiter(0, 1)
	assert.True(t, l.Allow("a"))
	assert.False(t, l.Allow("a"))
	assert.True(t, l.Allow("b")) // b has its own bucket
}

func TestAllowN_Burst(t *testing.T) {
	l := NewLimiter(0, 5)
	assert.True(t, l.AllowN("k", 5))
	assert.False(t, l.AllowN("k", 1)) // nothing left
}

func TestAllowN_PartialNotConsumed(t *testing.T) {
	l := NewLimiter(0, 3)
	assert.False(t, l.AllowN("k", 5)) // can't afford 5; bucket unchanged
	assert.True(t, l.AllowN("k", 3))  // 3 tokens still there
}

func TestNewWSLimiter(t *testing.T) {
	l := NewWSLimiter()
	// Burst of 10: first 10 should all succeed
	for i := 0; i < 10; i++ {
		assert.True(t, l.Allow("conn"), "request %d should be allowed", i+1)
	}
	assert.False(t, l.Allow("conn"))
}

func TestNewHTTPLimiter(t *testing.T) {
	l := NewHTTPLimiter()
	for i := 0; i < 30; i++ {
		assert.True(t, l.Allow("ip"), "request %d should be allowed", i+1)
	}
	assert.False(t, l.Allow("ip"))
}

func TestLen(t *testing.T) {
	l := NewLimiter(1, 10)
	assert.Equal(t, 0, l.Len())
	l.Allow("a")
	l.Allow("b")
	assert.Equal(t, 2, l.Len())
}

func TestCleanup_RemovesIdleKeys(t *testing.T) {
	l := NewLimiter(0, 5)
	l.Allow("old")
	// Force lastRefil to be 10 minutes ago
	l.mu.Lock()
	l.buckets["old"].lastRefil = time.Now().Add(-10 * time.Minute)
	l.mu.Unlock()

	l.Cleanup(5 * time.Minute)
	assert.Equal(t, 0, l.Len())
}

func TestCleanup_KeepsActiveKeys(t *testing.T) {
	l := NewLimiter(1, 5)
	l.Allow("active")
	l.Cleanup(5 * time.Minute)
	assert.Equal(t, 1, l.Len()) // recent, should not be removed
}

func TestAllow_Concurrent(t *testing.T) {
	l := NewLimiter(0, 100)
	var wg sync.WaitGroup
	allowed := make([]bool, 150)
	for i := 0; i < 150; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			allowed[idx] = l.Allow("key")
		}(i)
	}
	wg.Wait()

	count := 0
	for _, ok := range allowed {
		if ok {
			count++
		}
	}
	assert.Equal(t, 100, count, "exactly burst=100 should be allowed")
}

package ratelimit

import (
	"sync"
	"time"
)

type bucket struct {
	tokens    float64
	lastRefil time.Time
}

type Limiter struct {
	mu           sync.Mutex
	rate         float64
	burst        float64
	buckets      map[string]*bucket
	cleanupEvery time.Duration
	lastCleanup  time.Time
}

func NewLimiter(rate float64, burst int) *Limiter {
	return &Limiter{
		rate:         rate,
		burst:        float64(burst),
		buckets:      make(map[string]*bucket),
		cleanupEvery: 5 * time.Minute,
		lastCleanup:  time.Now(),
	}
}

func NewWSLimiter() *Limiter   { return NewLimiter(2, 10) }
func NewHTTPLimiter() *Limiter { return NewLimiter(10, 30) }

func (l *Limiter) Allow(key string) bool { return l.AllowN(key, 1) }

func (l *Limiter) AllowN(key string, n int) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.maybeCleanup()
	b := l.getOrCreate(key)
	l.refill(b)
	if b.tokens < float64(n) {
		return false
	}
	b.tokens -= float64(n)
	return true
}

func (l *Limiter) Cleanup(idle time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	threshold := time.Now().Add(-idle)
	for key, b := range l.buckets {
		if b.lastRefil.Before(threshold) {
			delete(l.buckets, key)
		}
	}
}

func (l *Limiter) Len() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.buckets)
}

func (l *Limiter) getOrCreate(key string) *bucket {
	b := l.buckets[key]
	if b == nil {
		b = &bucket{tokens: l.burst, lastRefil: time.Now()}
		l.buckets[key] = b
	}
	return b
}

func (l *Limiter) refill(b *bucket) {
	now := time.Now()
	elapsed := now.Sub(b.lastRefil).Seconds()
	b.tokens += elapsed * l.rate
	if b.tokens > l.burst {
		b.tokens = l.burst
	}
	b.lastRefil = now
}

func (l *Limiter) maybeCleanup() {
	if time.Since(l.lastCleanup) < l.cleanupEvery {
		return
	}
	l.lastCleanup = time.Now()
	threshold := l.lastCleanup.Add(-l.cleanupEvery)
	for key, b := range l.buckets {
		if b.lastRefil.Before(threshold) {
			delete(l.buckets, key)
		}
	}
}

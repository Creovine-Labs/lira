package audio

import (
	"sync"
)

const (
	// defaultMaxBufferBytes caps a single utterance buffer at 300 KB
	// (~9 seconds of PCM16 at 16 kHz mono before a forced flush).
	defaultMaxBufferBytes = 300 * 1024
)

// Buffer accumulates raw audio bytes for a single WebSocket connection and
// uses a VAD to detect utterance boundaries.
//
// Safe for concurrent use.
type Buffer struct {
	mu       sync.Mutex
	data     []byte
	vad      *VAD
	maxBytes int
	// Format is informational (e.g. "pcm16", "wav", "webm").
	Format string
}

// NewBuffer creates a Buffer that uses vad for utterance detection.
// Pass a nil vad to disable VAD (flush only on is_final / max-size).
func NewBuffer(vad *VAD) *Buffer {
	return &Buffer{
		vad:      vad,
		maxBytes: defaultMaxBufferBytes,
	}
}

// Feed appends chunk to the buffer and runs the VAD (if configured).
// Returns true if the buffer should be flushed (utterance end detected or
// the buffer is full).
func (b *Buffer) Feed(chunk []byte) bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.data = append(b.data, chunk...)

	// Force flush if we exceed the safety cap.
	if len(b.data) >= b.maxBytes {
		return true
	}

	// Only run VAD on PCM16 data.
	if b.vad != nil && (b.Format == "" || b.Format == "pcm16") {
		events := b.vad.Feed(chunk)
		for _, e := range events {
			if e == VADSpeechEnd {
				return true
			}
		}
	}
	return false
}

// Flush returns all buffered bytes and resets the buffer.
// Returns nil when the buffer is empty.
func (b *Buffer) Flush() []byte {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.flushLocked()
}

// ForceFlush returns any remaining bytes even if no utterance was detected.
func (b *Buffer) ForceFlush() []byte {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.flushLocked()
}

func (b *Buffer) flushLocked() []byte {
	if len(b.data) == 0 {
		return nil
	}
	out := make([]byte, len(b.data))
	copy(out, b.data)
	b.data = b.data[:0]
	if b.vad != nil {
		b.vad.Reset()
	}
	return out
}

// Len returns the current number of buffered bytes (thread-safe).
func (b *Buffer) Len() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return len(b.data)
}

// Reset discards all buffered audio and resets the VAD state.
func (b *Buffer) Reset() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.data = b.data[:0]
	if b.vad != nil {
		b.vad.Reset()
	}
}

// ─── BufferManager ────────────────────────────────────────────────────────────

// BufferManager maintains one Buffer per WebSocket connection ID.
// Safe for concurrent use.
type BufferManager struct {
	mu      sync.Mutex
	entries map[string]*Buffer
}

// NewBufferManager creates an empty BufferManager.
func NewBufferManager() *BufferManager {
	return &BufferManager{entries: make(map[string]*Buffer)}
}

// GetOrCreate returns the existing Buffer for connID or creates a new one.
// It attaches a fresh DefaultVAD to each new buffer.
func (m *BufferManager) GetOrCreate(connID string) *Buffer {
	m.mu.Lock()
	defer m.mu.Unlock()
	if b, ok := m.entries[connID]; ok {
		return b
	}
	b := NewBuffer(DefaultVAD())
	m.entries[connID] = b
	return b
}

// Get returns the buffer for connID, or nil if none exists.
func (m *BufferManager) Get(connID string) *Buffer {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.entries[connID]
}

// Delete removes the buffer for connID (e.g. on disconnect).
func (m *BufferManager) Delete(connID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.entries, connID)
}

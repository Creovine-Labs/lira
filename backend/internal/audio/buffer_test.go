package audio

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuffer_FeedAndFlush(t *testing.T) {
	b := NewBuffer(nil) // no VAD

	should := b.Feed([]byte{1, 2, 3})
	assert.False(t, should)
	assert.Equal(t, 3, b.Len())

	data := b.Flush()
	require.Equal(t, []byte{1, 2, 3}, data)
	assert.Equal(t, 0, b.Len())
}

func TestBuffer_ForceFlushEmpty(t *testing.T) {
	b := NewBuffer(nil)
	assert.Nil(t, b.ForceFlush())
}

func TestBuffer_MaxBytesFlush(t *testing.T) {
	b := NewBuffer(nil)
	b.maxBytes = 10

	// Feed 9 bytes -> not yet full.
	assert.False(t, b.Feed(make([]byte, 9)))
	// Feed 2 more -> now exceeds cap.
	assert.True(t, b.Feed(make([]byte, 2)))
}

func TestBuffer_VAD_TriggersSpeechEnd(t *testing.T) {
	v := DefaultVAD()
	b := NewBuffer(v)
	b.Format = "pcm16"

	speech := makeSpeechPCM(v.SpeechFrames)
	silence := makeSilencePCM(v.SilenceFrames)

	// Feed speech frames -> speech starts, no flush yet.
	flush := b.Feed(speech)
	assert.False(t, flush, "flush should NOT trigger on speech start alone")

	// Feed silence -> utterance end -> flush.
	flush = b.Feed(silence)
	assert.True(t, flush, "flush should trigger on utterance end")
}

func TestBuffer_Reset(t *testing.T) {
	b := NewBuffer(DefaultVAD())
	b.Feed([]byte{0, 1, 2})
	b.Reset()
	assert.Equal(t, 0, b.Len())
	assert.Nil(t, b.ForceFlush())
}

func TestBufferManager_GetOrCreate(t *testing.T) {
	m := NewBufferManager()
	b1 := m.GetOrCreate("conn-a")
	b2 := m.GetOrCreate("conn-a")
	assert.Same(t, b1, b2, "same connID should return same buffer")

	b3 := m.GetOrCreate("conn-b")
	assert.NotSame(t, b1, b3)
}

func TestBufferManager_Delete(t *testing.T) {
	m := NewBufferManager()
	m.GetOrCreate("conn-a")
	m.Delete("conn-a")
	assert.Nil(t, m.Get("conn-a"))
}

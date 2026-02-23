package audio

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMockUploader_Upload(t *testing.T) {
	m := NewMockUploader()
	ctx := context.Background()

	key, err := m.Upload(ctx, "sess-1", []byte("audio-data"), "wav")
	require.NoError(t, err)
	assert.Contains(t, key, "sess-1")
	assert.Contains(t, key, ".wav")
	assert.Equal(t, 1, m.Count())

	rec := m.Uploads[0]
	assert.Equal(t, "sess-1", rec.SessionID)
	assert.Equal(t, 10, rec.DataLen)
	assert.Equal(t, "wav", rec.Format)
}

func TestMockUploader_Error(t *testing.T) {
	m := NewMockUploader()
	m.Err = assert.AnError

	_, err := m.Upload(context.Background(), "s", []byte("x"), "pcm16")
	require.Error(t, err)
	assert.Equal(t, 0, m.Count())
}

func TestContentType(t *testing.T) {
	assert.Equal(t, "audio/mpeg", contentType("mp3"))
	assert.Equal(t, "audio/wav", contentType("wav"))
	assert.Equal(t, "audio/webm", contentType("webm"))
	assert.Equal(t, "audio/ogg", contentType("ogg"))
	assert.Equal(t, "application/octet-stream", contentType("unknown"))
}

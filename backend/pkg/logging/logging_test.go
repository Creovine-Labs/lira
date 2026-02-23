package logging

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func TestNewLogger(t *testing.T) {
	var buf bytes.Buffer
	logger := zerolog.New(&buf).With().
		Str("function", "test-func").
		Logger()

	logger.Info().Msg("hello")

	var out map[string]interface{}
	err := json.Unmarshal(buf.Bytes(), &out)
	assert.NoError(t, err)
	assert.Equal(t, "hello", out["message"])
	assert.Equal(t, "test-func", out["function"])
}

func TestWithSession(t *testing.T) {
	var buf bytes.Buffer
	base := zerolog.New(&buf)
	logger := WithSession(base, "sess-123")

	logger.Info().Msg("test")

	var out map[string]interface{}
	err := json.Unmarshal(buf.Bytes(), &out)
	assert.NoError(t, err)
	assert.Equal(t, "sess-123", out["session_id"])
}

func TestWithAction(t *testing.T) {
	var buf bytes.Buffer
	base := zerolog.New(&buf)
	logger := WithAction(base, "connect")

	logger.Info().Msg("test")

	var out map[string]interface{}
	err := json.Unmarshal(buf.Bytes(), &out)
	assert.NoError(t, err)
	assert.Equal(t, "connect", out["action"])
}

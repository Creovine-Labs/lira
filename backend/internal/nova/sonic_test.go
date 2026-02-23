package nova

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/creovine/lira-ai-backend/internal/tts"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── stubs ────────────────────────────────────────────────────────────────────

type fakeSonicAPI struct{ err error }

func (f *fakeSonicAPI) InvokeModelWithResponseStream(
	_ context.Context,
	_ *bedrockruntime.InvokeModelWithResponseStreamInput,
	_ ...func(*bedrockruntime.Options),
) (*bedrockruntime.InvokeModelWithResponseStreamOutput, error) {
	return nil, f.err
}

// ─── helpers ─────────────────────────────────────────────────────────────────

func encodedPCM(raw []byte) string {
	return base64.StdEncoding.EncodeToString(raw)
}

func sonicChunkEvent(audioB64 string) *brtypes.ResponseStreamMemberChunk {
	c := sonicChunk{Delta: &sonicDelta{Audio: audioB64}}
	b, _ := json.Marshal(c)
	return &brtypes.ResponseStreamMemberChunk{
		Value: brtypes.PayloadPart{Bytes: b},
	}
}

// ─── tests ────────────────────────────────────────────────────────────────────

func TestSonicClient_FallbackOnInvokeError(t *testing.T) {
	mock := tts.NewMockTTS()
	client := &SonicClient{
		client:   &fakeSonicAPI{err: errors.New("nova not available")},
		modelID:  DefaultSonicModel,
		fallback: mock,
	}
	res, err := client.Synthesize(context.Background(), tts.DefaultRequest("hello"))
	require.NoError(t, err, "should fall back to mock TTS")
	assert.Equal(t, 1, mock.CallCount)
	assert.NotEmpty(t, res.AudioBytes)
}

func TestSonicClient_NoFallbackReturnsError(t *testing.T) {
	client := &SonicClient{
		client:   &fakeSonicAPI{err: errors.New("unavailable")},
		modelID:  DefaultSonicModel,
		fallback: nil,
	}
	_, err := client.Synthesize(context.Background(), tts.DefaultRequest("hi"))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no fallback")
}

func TestNewSonicClient_DefaultModelID(t *testing.T) {
	c := NewSonicClient(nil, "", tts.NewMockTTS())
	assert.Equal(t, DefaultSonicModel, c.modelID)
}

func TestNewSonicClient_CustomModelID(t *testing.T) {
	c := NewSonicClient(nil, "my-custom-model", tts.NewMockTTS())
	assert.Equal(t, "my-custom-model", c.modelID)
}

func TestSonicDelta_Base64RoundTrip(t *testing.T) {
	pcm := []byte{0x00, 0x01, 0x02, 0x03}
	event := sonicChunkEvent(encodedPCM(pcm))
	var c sonicChunk
	require.NoError(t, json.Unmarshal(event.Value.Bytes, &c))
	require.NotNil(t, c.Delta)
	decoded, err := base64.StdEncoding.DecodeString(c.Delta.Audio)
	require.NoError(t, err)
	assert.Equal(t, pcm, decoded)
}

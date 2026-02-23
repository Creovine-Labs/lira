package tts

import (
	"context"
	"errors"
	"io"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/polly"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── stub ─────────────────────────────────────────────────────────────────────

type pollyStub struct {
	audio string
	err   error
}

func (s *pollyStub) SynthesizeSpeech(_ context.Context, _ *polly.SynthesizeSpeechInput, _ ...func(*polly.Options)) (*polly.SynthesizeSpeechOutput, error) {
	if s.err != nil {
		return nil, s.err
	}
	return &polly.SynthesizeSpeechOutput{AudioStream: io.NopCloser(strings.NewReader(s.audio))}, nil
}

// ─── tests ─────────────────────────────────────────────────────────────────────

func TestPollyClient_Success(t *testing.T) {
	client := &PollyClient{client: &pollyStub{audio: "FAKEMP3"}}
	res, err := client.Synthesize(context.Background(), DefaultRequest("Hello Lira"))
	require.NoError(t, err)
	assert.Equal(t, []byte("FAKEMP3"), res.AudioBytes)
	assert.Equal(t, FormatMP3, res.Format)
}

func TestPollyClient_UpstreamError(t *testing.T) {
	client := &PollyClient{client: &pollyStub{err: errors.New("quota exceeded")}}
	_, err := client.Synthesize(context.Background(), DefaultRequest("Hello"))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "polly synthesize")
}

func TestPollyClient_DefaultVoiceAndFormat(t *testing.T) {
	// Empty voice + format — should default to Joanna + MP3 without panic.
	client := &PollyClient{client: &pollyStub{audio: "X"}}
	res, err := client.Synthesize(context.Background(), SynthesisRequest{Text: "hi"})
	require.NoError(t, err)
	assert.Equal(t, FormatMP3, res.Format)
}

func TestToPollyFormat_Valid(t *testing.T) {
	for _, f := range []AudioFormat{FormatMP3, FormatPCM, FormatOGG} {
		_, err := toPollyFormat(f)
		assert.NoError(t, err, "format %s should be valid", f)
	}
}

func TestToPollyFormat_Invalid(t *testing.T) {
	_, err := toPollyFormat("flac")
	assert.Error(t, err)
}

func TestMockTTS_CallCount(t *testing.T) {
	m := NewMockTTS()
	res, err := m.Synthesize(context.Background(), DefaultRequest("hello world"))
	require.NoError(t, err)
	assert.Equal(t, 1, m.CallCount)
	assert.Contains(t, string(res.AudioBytes), "hello world")
}

func TestMockTTS_ForceError(t *testing.T) {
	m := NewMockTTS()
	m.ForceError = errors.New("tts down")
	_, err := m.Synthesize(context.Background(), DefaultRequest("hello"))
	assert.Error(t, err)
}

func TestDefaultRequest(t *testing.T) {
	req := DefaultRequest("test")
	assert.Equal(t, VoiceJoanna, req.Voice)
	assert.Equal(t, FormatMP3, req.Format)
}

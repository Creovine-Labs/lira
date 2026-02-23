package tts

import "context"

// MockTTS is a no-op TTSService for unit tests.
type MockTTS struct {
	CallCount   int
	LastRequest SynthesisRequest
	ForceError  error
}

// NewMockTTS creates a MockTTS.
func NewMockTTS() *MockTTS { return &MockTTS{} }

// Synthesize records the call and returns a stub audio payload.
func (m *MockTTS) Synthesize(_ context.Context, req SynthesisRequest) (*SynthesisResult, error) {
	m.CallCount++
	m.LastRequest = req
	if m.ForceError != nil {
		return nil, m.ForceError
	}
	return &SynthesisResult{
		AudioBytes: []byte("MOCK_AUDIO:" + req.Text),
		Format:     req.Format,
		Characters: len(req.Text),
	}, nil
}

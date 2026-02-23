// Package tts defines the text-to-speech abstraction used by Lira AI.
// PollyClient is the production backend; MockTTS is used in tests.
package tts

import "context"

// AudioFormat represents the output audio encoding.
type AudioFormat string

const (
	FormatMP3 AudioFormat = "mp3"
	FormatPCM AudioFormat = "pcm"
	FormatOGG AudioFormat = "ogg_vorbis"
)

// VoiceID is an Amazon Polly voice identifier.
type VoiceID string

const (
	// VoiceJoanna is US English Neural female — default for Lira.
	VoiceJoanna  VoiceID = "Joanna"
	VoiceMatthew VoiceID = "Matthew"
	VoiceSalli   VoiceID = "Salli"
)

// SynthesisRequest is the input to the TTSService.
type SynthesisRequest struct {
	Text       string
	Voice      VoiceID
	Format     AudioFormat
	// SampleRate is required only for PCM output (e.g. "16000").
	SampleRate string
}

// SynthesisResult holds audio bytes and metadata from the TTS service.
type SynthesisResult struct {
	AudioBytes []byte
	Format     AudioFormat
	Characters int
}

// TTSService is implemented by every speech-synthesis backend.
type TTSService interface {
	Synthesize(ctx context.Context, req SynthesisRequest) (*SynthesisResult, error)
}

// DefaultRequest returns a SynthesisRequest with Joanna/MP3 defaults.
func DefaultRequest(text string) SynthesisRequest {
	return SynthesisRequest{Text: text, Voice: VoiceJoanna, Format: FormatMP3}
}

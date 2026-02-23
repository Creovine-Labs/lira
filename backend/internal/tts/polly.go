package tts

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/polly"
	pollytypes "github.com/aws/aws-sdk-go-v2/service/polly/types"
)

// pollyAPI is the subset of the Polly client used here (enables test doubles).
type pollyAPI interface {
	SynthesizeSpeech(
		ctx context.Context,
		params *polly.SynthesizeSpeechInput,
		optFns ...func(*polly.Options),
	) (*polly.SynthesizeSpeechOutput, error)
}

// PollyClient implements TTSService using Amazon Polly Neural voices.
type PollyClient struct {
	client pollyAPI
}

// NewPollyClient creates a production Polly TTS client.
func NewPollyClient(c *polly.Client) *PollyClient {
	return &PollyClient{client: c}
}

// Synthesize converts text to speech with Amazon Polly.
// Defaults: VoiceJoanna, FormatMP3, Neural engine, en-US.
func (p *PollyClient) Synthesize(ctx context.Context, req SynthesisRequest) (*SynthesisResult, error) {
	voice := req.Voice
	if voice == "" {
		voice = VoiceJoanna
	}
	fmt := req.Format
	if fmt == "" {
		fmt = FormatMP3
	}

	outputFormat, err := toPollyFormat(fmt)
	if err != nil {
		return nil, err
	}

	input := &polly.SynthesizeSpeechInput{
		Text:         aws.String(req.Text),
		VoiceId:      pollytypes.VoiceId(voice),
		OutputFormat: outputFormat,
		Engine:       pollytypes.EngineNeural,
		LanguageCode: pollytypes.LanguageCodeEnUs,
	}
	if fmt == FormatPCM && req.SampleRate != "" {
		input.SampleRate = aws.String(req.SampleRate)
	}

	out, err := p.client.SynthesizeSpeech(ctx, input)
	if err != nil {
		return nil, errorf("polly synthesize: %w", err)
	}
	defer out.AudioStream.Close()

	audioBytes, err := io.ReadAll(out.AudioStream)
	if err != nil {
		return nil, errorf("polly read stream: %w", err)
	}

	return &SynthesisResult{AudioBytes: audioBytes, Format: fmt, Characters: int(out.RequestCharacters)}, nil
}

func toPollyFormat(f AudioFormat) (pollytypes.OutputFormat, error) {
	switch f {
	case FormatMP3:
		return pollytypes.OutputFormatMp3, nil
	case FormatPCM:
		return pollytypes.OutputFormatPcm, nil
	case FormatOGG:
		return pollytypes.OutputFormatOggVorbis, nil
	default:
		return "", errorf("unsupported audio format: %s", f)
	}
}

// errorf is a helper that avoids shadowing the "fmt" import with a local var.
func errorf(format string, args ...any) error {
	return fmt.Errorf(format, args...)
}

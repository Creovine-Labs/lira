// Package nova — SonicClient implements tts.TTSService via Amazon Nova Sonic
// (amazon.nova-sonic-v1:0) using the Bedrock InvokeModelWithResponseStream API.
//
// Flow:
//  1. Marshal a structured JSON payload (system prompt + user text + audio config).
//  2. Stream the response via InvokeModelWithResponseStream.
//  3. Decode base64 PCM audio chunks from ResponseStreamMemberChunk events.
//  4. On any error fall back to the configured tts.TTSService (Polly / MockTTS).
package nova

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/creovine/lira-ai-backend/internal/tts"
)

const (
	// DefaultSonicModel is the Nova Sonic cross-region inference profile.
	DefaultSonicModel = "us.amazon.nova-sonic-v1:0"
	// sonicSampleRate is the PCM sample rate requested from Nova Sonic.
	sonicSampleRate = "16000"
)

// sonicStreamAPI abstracts the BedrockRuntime streaming call for testing.
type sonicStreamAPI interface {
	InvokeModelWithResponseStream(
		ctx context.Context,
		params *bedrockruntime.InvokeModelWithResponseStreamInput,
		optFns ...func(*bedrockruntime.Options),
	) (*bedrockruntime.InvokeModelWithResponseStreamOutput, error)
}

// SonicClient implements tts.TTSService using Amazon Nova Sonic with Polly fallback.
type SonicClient struct {
	client   sonicStreamAPI
	modelID  string
	fallback tts.TTSService
}

// NewSonicClient creates a SonicClient.
//   - brClient — production BedrockRuntime client.
//   - modelID  — override the model ID (empty → DefaultSonicModel).
//   - fallback — TTSService used on Nova Sonic errors (PollyClient or MockTTS).
func NewSonicClient(brClient *bedrockruntime.Client, modelID string, fallback tts.TTSService) *SonicClient {
	if modelID == "" {
		modelID = DefaultSonicModel
	}
	return &SonicClient{client: brClient, modelID: modelID, fallback: fallback}
}

// Synthesize converts text to PCM speech via Nova Sonic, or falls back to Polly.
func (s *SonicClient) Synthesize(ctx context.Context, req tts.SynthesisRequest) (*tts.SynthesisResult, error) {
	audio, err := s.invokeSonic(ctx, req.Text)
	if err != nil {
		if s.fallback != nil {
			return s.fallback.Synthesize(ctx, req)
		}
		return nil, fmt.Errorf("nova sonic (no fallback): %w", err)
	}
	return &tts.SynthesisResult{
		AudioBytes: audio,
		Format:     tts.FormatPCM,
		Characters: len(req.Text),
	}, nil
}

// ─── streaming payload ────────────────────────────────────────────────────────

type sonicPayload struct {
	SchemaVersion string         `json:"schemaVersion"`
	System        []sonicSystem  `json:"system"`
	Messages      []sonicMessage `json:"messages"`
	AudioOutput   sonicAudioConf `json:"audioOutput"`
}

type sonicSystem  struct{ Text string `json:"text"` }
type sonicMessage struct {
	Role    string       `json:"role"`
	Content []sonicBlock `json:"content"`
}
type sonicBlock    struct{ Text string `json:"text"` }
type sonicAudioConf struct {
	MediaType  string `json:"mediaType"`
	SampleRate string `json:"sampleRate"`
}

// sonicChunk is the structure extracted from each stream event.
type sonicChunk struct {
	Delta *sonicDelta `json:"delta,omitempty"`
}
type sonicDelta struct {
	Audio string `json:"audio,omitempty"` // base64-encoded raw PCM
}

func (s *SonicClient) invokeSonic(ctx context.Context, text string) ([]byte, error) {
	payload := sonicPayload{
		SchemaVersion: "messages-v1",
		System: []sonicSystem{
			{Text: "You are Lira, a helpful AI meeting participant. Speak naturally and concisely."},
		},
		Messages: []sonicMessage{
			{Role: "user", Content: []sonicBlock{{Text: text}}},
		},
		AudioOutput: sonicAudioConf{MediaType: "audio/lpcm", SampleRate: sonicSampleRate},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal sonic payload: %w", err)
	}

	out, err := s.client.InvokeModelWithResponseStream(ctx,
		&bedrockruntime.InvokeModelWithResponseStreamInput{
			ModelId:     aws.String(s.modelID),
			ContentType: aws.String("application/json"),
			Body:        body,
		})
	if err != nil {
		return nil, fmt.Errorf("invoke response stream: %w", err)
	}

	stream := out.GetStream()
	defer stream.Close()

	var buf bytes.Buffer
	for event := range stream.Events() {
		chunk, ok := event.(*brtypes.ResponseStreamMemberChunk)
		if !ok {
			continue
		}
		var c sonicChunk
		if json.Unmarshal(chunk.Value.Bytes, &c) != nil || c.Delta == nil || c.Delta.Audio == "" {
			continue
		}
		pcm, decErr := base64.StdEncoding.DecodeString(c.Delta.Audio)
		if decErr == nil {
			buf.Write(pcm)
		}
	}

	if streamErr := stream.Err(); streamErr != nil && streamErr != io.EOF {
		return nil, fmt.Errorf("sonic stream: %w", streamErr)
	}
	if buf.Len() == 0 {
		return nil, fmt.Errorf("nova sonic: empty audio response")
	}
	return buf.Bytes(), nil
}

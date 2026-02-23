package audio

import (
	"encoding/json"
	"fmt"
	"strings"
)

// transcribeResult is the top-level shape of an AWS Transcribe output file.
type transcribeResult struct {
	Results transcribeResultBody `json:"results"`
}

type transcribeResultBody struct {
	Transcripts []transcribeTranscript `json:"transcripts"`
}

type transcribeTranscript struct {
	Transcript string `json:"transcript"`
}

// parseTranscribeJSON extracts the full transcript text from an AWS Transcribe JSON output.
func parseTranscribeJSON(data []byte) (string, error) {
	var result transcribeResult
	if err := json.Unmarshal(data, &result); err != nil {
		return "", fmt.Errorf("parse transcribe JSON: %w", err)
	}
	if len(result.Results.Transcripts) == 0 {
		return "", fmt.Errorf("transcribe JSON has no transcripts")
	}
	return strings.TrimSpace(result.Results.Transcripts[0].Transcript), nil
}

package config

import "os"

// Config holds all environment-driven configuration for the backend.
type Config struct {
	Environment          string
	ConnectionsTableName string
	MeetingsTableName    string
	AudioBucketName      string
	WebSocketEndpoint    string
	NovaModelID          string
	NovaSonicModelID     string
	PollyVoiceID         string // Amazon Polly voice used as TTS fallback (default: Joanna)
	TTSEnabled           bool   // set TTS_ENABLED=true to attach speech synthesis to responses
	AWSRegion            string
	MockAI               bool
}

// Load reads configuration from environment variables with sensible defaults.
func Load() Config {
	return Config{
		Environment:          getEnv("ENVIRONMENT", "dev"),
		ConnectionsTableName: getEnv("CONNECTIONS_TABLE", "lira-connections"),
		MeetingsTableName:    getEnv("MEETINGS_TABLE", "lira-meetings"),
		AudioBucketName:      getEnv("AUDIO_BUCKET", "lira-audio"),
		WebSocketEndpoint:    getEnv("WEBSOCKET_ENDPOINT", ""),
		NovaModelID:          getEnv("NOVA_LITE_MODEL_ID", getEnv("NOVA_MODEL_ID", "amazon.nova-lite-v1:0")),
		NovaSonicModelID:     getEnv("NOVA_SONIC_MODEL_ID", "us.amazon.nova-sonic-v1:0"),
		PollyVoiceID:         getEnv("POLLY_VOICE_ID", "Joanna"),
		TTSEnabled:           getEnv("TTS_ENABLED", "false") == "true",
		AWSRegion:            getEnv("AWS_REGION", "us-east-1"),
		MockAI:               getEnv("MOCK_AI", "false") == "true",
	}
}

// IsMock returns true when running in local/test mode or when MOCK_AI=true.
func (c Config) IsMock() bool {
	return c.MockAI || c.Environment == "mock" || c.Environment == "test"
}

// IsProd returns true when running in production.
func (c Config) IsProd() bool {
	return c.Environment == "prod"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

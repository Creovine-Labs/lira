package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad_Defaults(t *testing.T) {
	// Clear any env vars that might interfere
	os.Unsetenv("ENVIRONMENT")
	os.Unsetenv("CONNECTIONS_TABLE")
	os.Unsetenv("MEETINGS_TABLE")

	cfg := Load()
	assert.Equal(t, "dev", cfg.Environment)
	assert.Equal(t, "lira-connections", cfg.ConnectionsTableName)
	assert.Equal(t, "lira-meetings", cfg.MeetingsTableName)
	assert.Equal(t, "lira-audio", cfg.AudioBucketName)
	assert.Equal(t, "amazon.nova-lite-v1:0", cfg.NovaModelID)
	assert.Equal(t, "us-east-1", cfg.AWSRegion)
	assert.False(t, cfg.IsMock())
	assert.False(t, cfg.IsProd())
}

func TestLoad_EnvOverrides(t *testing.T) {
	t.Setenv("ENVIRONMENT", "prod")
	t.Setenv("CONNECTIONS_TABLE", "custom-conn")
	t.Setenv("AWS_REGION", "eu-west-1")

	cfg := Load()
	assert.Equal(t, "prod", cfg.Environment)
	assert.Equal(t, "custom-conn", cfg.ConnectionsTableName)
	assert.Equal(t, "eu-west-1", cfg.AWSRegion)
	assert.True(t, cfg.IsProd())
	assert.False(t, cfg.IsMock())
}

func TestIsMock(t *testing.T) {
	cfg := Config{Environment: "mock"}
	assert.True(t, cfg.IsMock())

	cfg.Environment = "test"
	assert.True(t, cfg.IsMock())

	cfg.Environment = "dev"
	assert.False(t, cfg.IsMock())
}

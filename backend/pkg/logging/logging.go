package logging

import (
	"os"

	"github.com/rs/zerolog"
)

// Init configures zerolog globally for Lambda (JSON, UTC, unix time).
func Init() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	level := zerolog.InfoLevel
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(level)
}

// NewLogger creates a base logger for a Lambda function.
func NewLogger(functionName string) zerolog.Logger {
	return zerolog.New(os.Stdout).With().
		Timestamp().
		Str("function", functionName).
		Logger()
}

// WithSession returns a logger enriched with session context.
func WithSession(logger zerolog.Logger, sessionID string) zerolog.Logger {
	return logger.With().Str("session_id", sessionID).Logger()
}

// WithAction returns a logger enriched with the current action.
func WithAction(logger zerolog.Logger, action string) zerolog.Logger {
	return logger.With().Str("action", action).Logger()
}

// WithConnection returns a logger enriched with connection ID.
func WithConnection(logger zerolog.Logger, connID string) zerolog.Logger {
	return logger.With().Str("connection_id", connID).Logger()
}

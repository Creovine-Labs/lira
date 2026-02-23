package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/polly"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/creovine/lira-ai-backend/internal/audio"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/creovine/lira-ai-backend/internal/tts"
	"github.com/creovine/lira-ai-backend/internal/wshandler"
	"github.com/creovine/lira-ai-backend/pkg/config"
	"github.com/creovine/lira-ai-backend/pkg/logging"
)

func main() {
	logging.Init()
	log := logging.NewLogger("gateway")

	cfg := config.Load()
	log.Info().Str("env", cfg.Environment).Bool("mock", cfg.IsMock()).Msg("gateway starting")

	var store appctx.Store
	var broadcaster wshandler.Broadcaster
	var ai nova.AIService
	var speech tts.TTSService   // nil → text-only responses
	var uploader audio.Uploader // nil → audio_chunk disabled

	if cfg.IsMock() {
		store = appctx.NewMockStore()
		broadcaster = wshandler.NewMockBroadcaster(store)
		ai = nova.NewMockAI(0)
		log.Info().Msg("running in mock mode")
	} else {
		var err error
		store, err = appctx.NewDynamoStore(context.Background(), cfg)
		if err != nil {
			log.Fatal().Err(err).Msg("failed to connect to DynamoDB")
		}

		wsEndpoint := cfg.WebSocketEndpoint
		if wsEndpoint == "" {
			log.Fatal().Msg("WEBSOCKET_ENDPOINT env var required in production")
		}
		broadcaster, err = wshandler.NewAPIGWBroadcaster(context.Background(), wsEndpoint, cfg.AWSRegion, store, log)
		if err != nil {
			log.Fatal().Err(err).Msg("failed to create broadcaster")
		}

		awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(), awsconfig.WithRegion(cfg.AWSRegion))
		if err != nil {
			log.Fatal().Err(err).Msg("failed to load AWS config")
		}

		ai = nova.NewBedrockClient(bedrockruntime.NewFromConfig(awsCfg), cfg.NovaModelID)
		log.Info().Str("model_id", cfg.NovaModelID).Msg("using Amazon Bedrock Nova")

		// TTS: wire Nova Sonic → Polly fallback when TTS_ENABLED=true.
		if cfg.TTSEnabled {
			pollyClient := tts.NewPollyClient(polly.NewFromConfig(awsCfg))
			speech = nova.NewSonicClient(
				bedrockruntime.NewFromConfig(awsCfg),
				cfg.NovaSonicModelID,
				pollyClient,
			)
			log.Info().
				Str("sonic_model", cfg.NovaSonicModelID).
				Str("polly_voice", cfg.PollyVoiceID).
				Msg("TTS enabled: Nova Sonic with Polly fallback")
		} else {
			log.Info().Msg("TTS disabled (set TTS_ENABLED=true to enable speech synthesis)")
		}

		// Wire audio streaming uploader (audio_chunk WebSocket action).
		if cfg.AudioBucketName != "" {
			uploader = audio.NewS3Uploader(s3.NewFromConfig(awsCfg), cfg.AudioBucketName)
			log.Info().Str("bucket", cfg.AudioBucketName).Msg("audio streaming enabled")
		} else {
			log.Warn().Msg("AUDIO_BUCKET not set — audio_chunk action disabled")
		}
	}

	// Build handler — speech / uploader may be nil (disabled modes).
	h := wshandler.NewHandlerWithTTS(store, broadcaster, ai, speech, log)
	if uploader != nil {
		h.WithAudio(uploader)
	}
	lambda.Start(h.Handle)
}

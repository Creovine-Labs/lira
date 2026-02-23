package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/transcribe"
	"github.com/creovine/lira-ai-backend/internal/audio"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/nova"
	"github.com/creovine/lira-ai-backend/internal/wshandler"
	appconfig "github.com/creovine/lira-ai-backend/pkg/config"
	"github.com/creovine/lira-ai-backend/pkg/logging"
)

func main() {
	logging.Init()
	log := logging.NewLogger("audio-processor")

	cfg := appconfig.Load()
	log.Info().Str("env", cfg.Environment).Bool("mock", cfg.IsMock()).Msg("audio processor starting")

	var transcriber audio.Transcriber
	var store appctx.Store
	var broadcaster wshandler.Broadcaster
	var aiService nova.AIService

	if cfg.IsMock() {
		transcriber = audio.NewMockTranscriber()
		store = appctx.NewMockStore()
		broadcaster = wshandler.NewMockBroadcaster(store)
		aiService = nova.NewMockAI(0)
		log.Info().Msg("running in mock mode")
	} else {
		var err error
		store, err = appctx.NewDynamoStore(context.Background(), cfg)
		if err != nil {
			log.Fatal().Err(err).Msg("failed to create DynamoDB store")
		}

		awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(), awsconfig.WithRegion(cfg.AWSRegion))
		if err != nil {
			log.Fatal().Err(err).Msg("failed to load AWS config")
		}
		transcriber = audio.NewTranscribeClient(transcribe.NewFromConfig(awsCfg))

		// Wire Bedrock AI so the processor can generate responses after transcription.
		aiService = nova.NewBedrockClient(bedrockruntime.NewFromConfig(awsCfg), cfg.NovaModelID)
		log.Info().Str("model", cfg.NovaModelID).Msg("AI wired for audio path")

		wsEndpoint := cfg.WebSocketEndpoint
		if wsEndpoint == "" {
			log.Fatal().Msg("WEBSOCKET_ENDPOINT env var required in production")
		}
		broadcaster, err = wshandler.NewAPIGWBroadcaster(context.Background(), wsEndpoint, cfg.AWSRegion, store, log)
		if err != nil {
			log.Fatal().Err(err).Msg("failed to create broadcaster")
		}
	}

	processor := audio.NewProcessor(transcriber, store, broadcaster, log).WithAI(aiService)

	lambda.Start(func(ctx context.Context, event events.S3Event) error {
		return processor.HandleS3Event(ctx, event)
	})
}

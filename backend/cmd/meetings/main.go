package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	appctx "github.com/creovine/lira-ai-backend/internal/context"
	"github.com/creovine/lira-ai-backend/internal/meetings"
	"github.com/creovine/lira-ai-backend/pkg/config"
	"github.com/creovine/lira-ai-backend/pkg/logging"
)

func main() {
	logging.Init()
	cfg := config.Load()
	logger := logging.NewLogger("meetings")

	ctx := context.Background()
	var handler *meetings.Handler

	if cfg.IsMock() {
		logger.Info().Msg("meetings Lambda starting in MOCK mode")
		store := appctx.NewMockStore()
		handler = meetings.NewHandler(store, logger)
	} else {
		logger.Info().Str("region", cfg.AWSRegion).Msg("meetings Lambda starting in AWS mode")
		store, err := appctx.NewDynamoStore(ctx, cfg)
		if err != nil {
			logger.Fatal().Err(err).Msg("failed to create DynamoDB store")
			os.Exit(1)
		}
		handler = meetings.NewHandler(store, logger)
	}

	lambda.Start(func(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
		return handler.Handle(ctx, req)
	})
}

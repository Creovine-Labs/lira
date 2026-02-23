package nova

import (
	"context"
	"fmt"
	"math/rand"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/creovine/lira-ai-backend/pkg/retry"
)

const (
	// maxContextMessages is the maximum number of prior messages to include in the prompt.
	maxContextMessages = 20
	// defaultMaxTokens is the default Nova output token limit.
	defaultMaxTokens = 512
)

// bedrockAPI is the subset of bedrockruntime.Client we need (enables test doubles).
type bedrockAPI interface {
	Converse(ctx context.Context, params *bedrockruntime.ConverseInput, optFns ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error)
}

// BedrockClient wraps the AWS Bedrock Runtime Converse API and implements AIService.
type BedrockClient struct {
	client  bedrockAPI
	modelID string
	pb      *PromptBuilder
	rng     *rand.Rand
}

// NewBedrockClient creates a production Bedrock AI client.
func NewBedrockClient(client *bedrockruntime.Client, modelID string) *BedrockClient {
	return &BedrockClient{
		client:  client,
		modelID: modelID,
		pb:      NewPromptBuilder(),
		rng:     rand.New(rand.NewSource(rand.Int63())), //nolint:gosec
	}
}

// GenerateResponse calls Amazon Nova via the Bedrock Converse API.
// It builds a system prompt from meeting settings and a conversation history
// from the last maxContextMessages messages.
func (b *BedrockClient) GenerateResponse(
	ctx context.Context,
	_ string,
	messages []models.Message,
	settings models.MeetingSettings,
) (string, error) {
	system := buildSystemPrompt(settings)

	// Greeting shortcut: no human messages yet.
	if len(messages) == 0 {
		return "I'm Lira, your AI meeting assistant. How can I help?", nil
	}

	// Prepend a context header (title, participants, topics, action items) as the
	// first user message so Nova has rich meeting context without bloating the
	// system prompt.
	var enriched []models.Message
	if b.pb != nil {
		header := b.pb.ContextHeader(models.Meeting{Messages: messages, Settings: settings})
		if header != "" {
			enriched = append([]models.Message{{Text: header, IsAI: false, Speaker: "system"}}, messages...)
		} else {
			enriched = messages
		}
	} else {
		enriched = messages
	}

	convMsgs := buildConversationMessages(enriched)

	if len(convMsgs) == 0 {
		return "I'm Lira, your AI meeting assistant. How can I help?", nil
	}

	input := &bedrockruntime.ConverseInput{
		ModelId: aws.String(b.modelID),
		System: []brtypes.SystemContentBlock{
			&brtypes.SystemContentBlockMemberText{Value: system},
		},
		Messages: convMsgs,
		InferenceConfig: &brtypes.InferenceConfiguration{
			MaxTokens:   aws.Int32(defaultMaxTokens),
			Temperature: aws.Float32(0.7),
			TopP:        aws.Float32(0.9),
		},
	}

	var output *bedrockruntime.ConverseOutput
	err := retry.DoRetryable(ctx, retry.DefaultBackoffs, func() error {
		var e error
		output, e = b.client.Converse(ctx, input)
		return e
	})
	if err != nil {
		return "", fmt.Errorf("bedrock converse: %w", err)
	}

	// Extract text from the response message.
	if msg, ok := output.Output.(*brtypes.ConverseOutputMemberMessage); ok {
		for _, block := range msg.Value.Content {
			if text, ok := block.(*brtypes.ContentBlockMemberText); ok {
				raw := strings.TrimSpace(text.Value)
				return InjectFillers(raw, settings.Personality, b.rng), nil
			}
		}
	}

	return "", fmt.Errorf("bedrock: no text content in response")
}

// buildSystemPrompt returns a personality-specific system prompt for Nova.
func buildSystemPrompt(settings models.MeetingSettings) string {
	base := `You are Lira, an AI meeting participant built on Amazon Nova. ` +
		`Your role is to actively participate in meetings by providing insights, ` +
		`tracking action items, summarising discussions, and asking clarifying questions. ` +
		`Be concise — responses should be 1-3 sentences unless a detailed summary is requested. ` +
		`Never start a response with "As an AI" or "I cannot". `

	personality := settings.Personality
	switch personality {
	case "supportive":
		return base + `Your tone is warm, encouraging, and collaborative. ` +
			`Acknowledge the team's contributions and build on their ideas positively.`
	case "analytical":
		return base + `Your tone is precise and data-driven. ` +
			`Focus on facts, identify gaps in reasoning, and suggest concrete next steps.`
	case "facilitator":
		return base + `Your role is to keep the meeting on track. ` +
			`Summarise decisions, identify blockers, surface action items, and ensure all voices are heard.`
	case "devil's advocate":
		return base + `Challenge assumptions constructively. ` +
			`Point out potential risks, alternative viewpoints, and unintended consequences.`
	default:
		return base + `Adapt your tone to the context of the conversation.`
	}
}

// buildConversationMessages converts meeting messages to Bedrock Converse format.
// Only the last maxContextMessages non-AI messages plus their surrounding context are included.
// The message list must start with a user role (Nova requirement).
func buildConversationMessages(messages []models.Message) []brtypes.Message {
	// Take last maxContextMessages messages.
	if len(messages) > maxContextMessages {
		messages = messages[len(messages)-maxContextMessages:]
	}

	var out []brtypes.Message
	var lastRole brtypes.ConversationRole

	for _, m := range messages {
		role := brtypes.ConversationRoleUser
		if m.IsAI {
			role = brtypes.ConversationRoleAssistant
		}

		// Bedrock requires alternating roles; merge consecutive same-role messages.
		if len(out) > 0 && lastRole == role {
			last := &out[len(out)-1]
			existing := last.Content[0].(*brtypes.ContentBlockMemberText)
			existing.Value += "\n" + m.Text
			continue
		}

		out = append(out, brtypes.Message{
			Role: role,
			Content: []brtypes.ContentBlock{
				&brtypes.ContentBlockMemberText{Value: m.Text},
			},
		})
		lastRole = role
	}

	// Bedrock Converse requires the last message to be from the user.
	if len(out) > 0 && out[len(out)-1].Role == brtypes.ConversationRoleAssistant {
		out = append(out, brtypes.Message{
			Role: brtypes.ConversationRoleUser,
			Content: []brtypes.ContentBlock{
				&brtypes.ContentBlockMemberText{Value: "Please continue."},
			},
		})
	}

	return out
}

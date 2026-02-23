package nova

import (
	"context"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	brtypes "github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/creovine/lira-ai-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockBedrockAPI is a test double for the Bedrock Converse API.
type mockBedrockAPI struct {
	response  string
	err       error
	lastInput *bedrockruntime.ConverseInput
}

func (m *mockBedrockAPI) Converse(_ context.Context, params *bedrockruntime.ConverseInput, _ ...func(*bedrockruntime.Options)) (*bedrockruntime.ConverseOutput, error) {
	m.lastInput = params
	if m.err != nil {
		return nil, m.err
	}
	text := m.response
	if text == "" {
		text = "Mock Bedrock response."
	}
	return &bedrockruntime.ConverseOutput{
		Output: &brtypes.ConverseOutputMemberMessage{
			Value: brtypes.Message{
				Role: brtypes.ConversationRoleAssistant,
				Content: []brtypes.ContentBlock{
					&brtypes.ContentBlockMemberText{Value: text},
				},
			},
		},
	}, nil
}

func newTestBedrock(resp string, err error) *BedrockClient {
	return &BedrockClient{
		client:  &mockBedrockAPI{response: resp, err: err},
		modelID: "amazon.nova-lite-v1:0",
		pb:      NewPromptBuilder(),
		rng:     rand.New(rand.NewSource(0)), //nolint:gosec
	}
}

func msgs(texts ...string) []models.Message {
	var out []models.Message
	for i, t := range texts {
		out = append(out, models.Message{
			ID:        fmt.Sprintf("m%d", i),
			Speaker:   "alice",
			Text:      t,
			Timestamp: time.Now(),
			IsAI:      false,
		})
	}
	return out
}

// ── GenerateResponse ──────────────────────────────────────────────────────────

func TestBedrock_GenerateResponse_Success(t *testing.T) {
	bc := newTestBedrock("Great summary!", nil)
	resp, err := bc.GenerateResponse(context.Background(), "sess-1", msgs("Please summarize"), models.DefaultSettings())
	require.NoError(t, err)
	// InjectFillers may or may not prepend a starter; the original text must be present.
	assert.Contains(t, resp, "reat summary!")
}

func TestBedrock_GenerateResponse_Error(t *testing.T) {
	bc := newTestBedrock("", fmt.Errorf("throttling"))
	_, err := bc.GenerateResponse(context.Background(), "sess-1", msgs("hello"), models.DefaultSettings())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "bedrock converse")
}

func TestBedrock_GenerateResponse_EmptyMessages(t *testing.T) {
	bc := newTestBedrock("", nil)
	resp, err := bc.GenerateResponse(context.Background(), "sess-1", nil, models.DefaultSettings())
	require.NoError(t, err)
	assert.Contains(t, resp, "Lira")
}

func TestBedrock_GenerateResponse_SendsSystemPrompt(t *testing.T) {
	mock := &mockBedrockAPI{response: "ok"}
	bc := &BedrockClient{client: mock, modelID: "amazon.nova-lite-v1:0"}
	settings := models.DefaultSettings()
	settings.Personality = "analytical"

	_, err := bc.GenerateResponse(context.Background(), "sess-1", msgs("What do the numbers say?"), settings)
	require.NoError(t, err)
	require.NotEmpty(t, mock.lastInput.System)
	systemText := mock.lastInput.System[0].(*brtypes.SystemContentBlockMemberText).Value
	assert.Contains(t, systemText, "data-driven")
}

func TestBedrock_GenerateResponse_TruncatesContext(t *testing.T) {
	mock := &mockBedrockAPI{response: "ok"}
	bc := &BedrockClient{client: mock, modelID: "amazon.nova-lite-v1:0"}

	// Build 30 messages (exceeds maxContextMessages=20)
	var messages []models.Message
	for i := 0; i < 30; i++ {
		messages = append(messages, models.Message{
			ID: fmt.Sprintf("m%d", i), Speaker: "alice",
			Text: fmt.Sprintf("message %d", i), Timestamp: time.Now(),
		})
	}

	_, err := bc.GenerateResponse(context.Background(), "sess-1", messages, models.DefaultSettings())
	require.NoError(t, err)
	// Should have at most maxContextMessages messages sent to Bedrock
	assert.LessOrEqual(t, len(mock.lastInput.Messages), maxContextMessages)
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────────

func TestBuildSystemPrompt_Personalities(t *testing.T) {
	cases := []struct {
		personality string
		contains    string
	}{
		{"supportive", "warm"},
		{"analytical", "data-driven"},
		{"facilitator", "on track"},
		{"devil's advocate", "assumptions"},
		{"unknown", "Lira"},
	}
	for _, tc := range cases {
		t.Run(tc.personality, func(t *testing.T) {
			s := models.DefaultSettings()
			s.Personality = tc.personality
			prompt := buildSystemPrompt(s)
			assert.Contains(t, prompt, tc.contains)
		})
	}
}

// ── buildConversationMessages ─────────────────────────────────────────────────

func TestBuildConversationMessages_AlternatingRoles(t *testing.T) {
	messages := []models.Message{
		{Speaker: "alice", Text: "hello", IsAI: false},
		{Speaker: "lira-ai", Text: "hi!", IsAI: true},
		{Speaker: "alice", Text: "how are you?", IsAI: false},
	}
	out := buildConversationMessages(messages)
	require.Len(t, out, 3)
	assert.Equal(t, brtypes.ConversationRoleUser, out[0].Role)
	assert.Equal(t, brtypes.ConversationRoleAssistant, out[1].Role)
	assert.Equal(t, brtypes.ConversationRoleUser, out[2].Role)
}

func TestBuildConversationMessages_MergesConsecutiveSameRole(t *testing.T) {
	messages := []models.Message{
		{Speaker: "alice", Text: "first", IsAI: false},
		{Speaker: "bob", Text: "second", IsAI: false},
		{Speaker: "lira-ai", Text: "response", IsAI: true},
	}
	out := buildConversationMessages(messages)
	// first + second merge into one user message; then assistant; then synthetic
	// "Please continue." because Bedrock requires the last message to be from user.
	require.Len(t, out, 3)
	merged := out[0].Content[0].(*brtypes.ContentBlockMemberText).Value
	assert.Contains(t, merged, "first")
	assert.Contains(t, merged, "second")
	assert.Equal(t, brtypes.ConversationRoleAssistant, out[1].Role)
	assert.Equal(t, brtypes.ConversationRoleUser, out[2].Role)
}

func TestBuildConversationMessages_EndsWithUser(t *testing.T) {
	messages := []models.Message{
		{Speaker: "alice", Text: "hello", IsAI: false},
		{Speaker: "lira-ai", Text: "hi", IsAI: true},
	}
	out := buildConversationMessages(messages)
	last := out[len(out)-1]
	assert.Equal(t, brtypes.ConversationRoleUser, last.Role)
}

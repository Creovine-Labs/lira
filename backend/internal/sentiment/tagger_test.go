package sentiment

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTag_Question(t *testing.T) {
	cases := []string{
		"What should we prioritise next?",
		"How does this integration work?",
		"Why is the latency so high?",
		"When can we ship this?",
		"Could you elaborate on that?",
		"Should we add rate limiting?",
		"Is there a better approach?",
		"Can we revisit this later",
	}
	for _, text := range cases {
		assert.Equal(t, "question", Tag(text), "text: %q", text)
	}
}

func TestTag_Positive(t *testing.T) {
	cases := []string{
		"That's a great point!",
		"I absolutely agree with you.",
		"Thanks for clarifying that.",
		"Looks good to me.",
		"Sounds good, let's ship it.",
		"I love this direction.",
		"Well done everyone.",
		"That makes sense.",
	}
	for _, text := range cases {
		assert.Equal(t, "positive", Tag(text), "text: %q", text)
	}
}

func TestTag_Negative(t *testing.T) {
	cases := []string{
		"There's a bug in the auth flow.",
		"I have concerns about performance.",
		"The service is broken in staging.",
		"I disagree with this approach.",
		"Unfortunately we can't do that.",
		"It's not working as expected.",
		"This is missing a test.",
		"I'm not sure this is correct.",
	}
	for _, text := range cases {
		assert.Equal(t, "negative", Tag(text), "text: %q", text)
	}
}

func TestTag_Neutral(t *testing.T) {
	cases := []string{
		"Let me pull up the diagram.",
		"The deployment is scheduled for Friday.",
		"We use DynamoDB for persistence.",
		"",
		"  ",
	}
	for _, text := range cases {
		assert.Equal(t, "neutral", Tag(text), "text: %q", text)
	}
}

func TestTag_QuestionTakesPriorityOverPositive(t *testing.T) {
	// "Is this a great idea?" -> question wins even though "great" is positive
	assert.Equal(t, "question", Tag("Is this a great idea?"))
}

func TestTag_NegativeBeforeNeutral(t *testing.T) {
	// Contains a negative keyword - not a question, not positive
	assert.Equal(t, "negative", Tag("There is an error in production"))
}

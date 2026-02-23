package nova

import (
	"fmt"
	"sort"
	"strings"

	"github.com/creovine/lira-ai-backend/internal/models"
)

// PromptBuilder enriches the Bedrock context with meeting metadata,
// participant info, and extracted topic/action signals.
type PromptBuilder struct{}

// NewPromptBuilder returns a PromptBuilder.
func NewPromptBuilder() *PromptBuilder { return &PromptBuilder{} }

// ContextHeader builds a plain-text block injected as the first user message
// so Nova has the meeting title, participants, trending topics, and pending
// action items without bloating the system prompt.
func (pb *PromptBuilder) ContextHeader(m models.Meeting) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[Meeting: %s]\n", m.Title))

	if len(m.Participants) > 0 {
		sb.WriteString(fmt.Sprintf("Participants: %s\n", strings.Join(m.Participants, ", ")))
	}

	if topics := ExtractTopics(m.Messages, 5); len(topics) > 0 {
		sb.WriteString(fmt.Sprintf("Topics discussed so far: %s\n", strings.Join(topics, ", ")))
	}

	if actions := ExtractActionItems(m.Messages, 3); len(actions) > 0 {
		sb.WriteString("Pending action items:\n")
		for i, a := range actions {
			sb.WriteString(fmt.Sprintf("  %d. %s\n", i+1, a))
		}
	}

	return sb.String()
}

// ExtractTopics performs a word-frequency pass on human messages and returns
// recurring non-stop-words (min 2 occurrences), sorted by frequency, capped at maxTopics.
func ExtractTopics(messages []models.Message, maxTopics int) []string {
	stop := buildStopSet()
	freq := make(map[string]int)
	for _, msg := range messages {
		if msg.IsAI {
			continue
		}
		for _, word := range strings.Fields(strings.ToLower(msg.Text)) {
			word = strings.Trim(word, `.,!?;:"'()`)
			if len(word) > 4 && !stop[word] {
				freq[word]++
			}
		}
	}

	type kv struct{ word string; count int }
	var pairs []kv
	for w, c := range freq {
		if c >= 2 {
			pairs = append(pairs, kv{w, c})
		}
	}
	sort.Slice(pairs, func(i, j int) bool { return pairs[i].count > pairs[j].count })

	topics := make([]string, 0, maxTopics)
	for i := 0; i < len(pairs) && i < maxTopics; i++ {
		topics = append(topics, pairs[i].word)
	}
	return topics
}

// ExtractActionItems scans human messages for action-signal keywords and
// returns up to maxItems truncated excerpts (most recent first).
func ExtractActionItems(messages []models.Message, maxItems int) []string {
	signals := []string{
		"will ", "going to ", "need to ", "should ", "must ",
		"action item", "todo", "follow up", "follow-up",
	}
	var items []string
	for _, msg := range messages {
		if msg.IsAI {
			continue
		}
		lower := strings.ToLower(msg.Text)
		for _, sig := range signals {
			if strings.Contains(lower, sig) {
				excerpt := msg.Text
				if len(excerpt) > 80 {
					excerpt = excerpt[:80] + "..."
				}
				items = append(items, excerpt)
				break
			}
		}
	}
	if len(items) > maxItems {
		items = items[len(items)-maxItems:]
	}
	return items
}

func buildStopSet() map[string]bool {
	words := []string{
		"the", "a", "an", "is", "was", "are", "were", "be", "been", "being",
		"i", "we", "you", "it", "this", "that", "and", "or", "but", "so",
		"to", "of", "in", "on", "at", "for", "with", "do", "can", "not",
		"have", "has", "had", "will", "would", "should", "could", "just",
		"like", "get", "its", "our", "your", "they", "them", "their",
		"what", "when", "where", "which", "who", "how", "there",
	}
	set := make(map[string]bool, len(words))
	for _, w := range words {
		set[w] = true
	}
	return set
}

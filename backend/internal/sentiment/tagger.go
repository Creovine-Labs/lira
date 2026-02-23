// Package sentiment provides lightweight keyword-based sentiment tagging
// for meeting messages. No external API is required; this deliberately trades
// precision for zero-latency and zero-cost inline tagging.
//
// Labels:
//
//	"question"  – the speaker is asking something
//	"positive"  – enthusiastic / agreeable tone
//	"negative"  – concern / disagreement / problem report
//	"neutral"   – factual / informational (default)
package sentiment

import "strings"

// Tag returns a sentiment label for the given text.
// Priority: question → negative → positive → neutral.
func Tag(text string) string {
	low := strings.ToLower(strings.TrimSpace(text))
	if low == "" {
		return "neutral"
	}

	if isQuestion(low) {
		return "question"
	}
	if isNegative(low) {
		return "negative"
	}
	if isPositive(low) {
		return "positive"
	}
	return "neutral"
}

// ─── helpers ──────────────────────────────────────────────────────────────────

var questionStarters = []string{
	"what ", "why ", "how ", "when ", "where ", "who ", "which ",
	"could you", "would you", "can we", "can you", "do we", "is there",
	"are there", "should we", "did you", "does this", "have you",
	"will this", "would this",
}

func isQuestion(low string) bool {
	if strings.HasSuffix(low, "?") {
		return true
	}
	for _, prefix := range questionStarters {
		if strings.HasPrefix(low, prefix) {
			return true
		}
	}
	return false
}

var positiveKeywords = []string{
	"great", "love", "excellent", "perfect", "agree", "agreed",
	"good point", "good idea", "wonderful", "awesome", "helpful",
	"thank you", "thanks", "nice", "well done", "brilliant",
	"fantastic", "happy", "solid", "absolutely", "looks good",
	"sounds good", "makes sense", "i like", "that works",
}

func isPositive(low string) bool {
	for _, kw := range positiveKeywords {
		if strings.Contains(low, kw) {
			return true
		}
	}
	return false
}

var negativeKeywords = []string{
	"problem", "issue", "bug", "error", "fail", "failure", "broken",
	"concern", "worried", "worry", "difficult", "struggle", "disagree",
	"unfortunately", "not working", "doesn't work", "doesn't seem",
	"can't", "cannot", "can not", "unable", "missing", "wrong",
	"incorrect", "terrible", "horrible", "bad ", "hate ", "not sure",
	"not clear", "confused", "doesn't make sense",
}

func isNegative(low string) bool {
	for _, kw := range negativeKeywords {
		if strings.Contains(low, kw) {
			return true
		}
	}
	return false
}

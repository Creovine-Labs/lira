package nova

import (
	"math/rand"
	"strings"
	"unicode"
)

// fillerProfile defines the natural-speech characteristics for a personality.
type fillerProfile struct {
	starters []string // phrases prepended to the response
	rate     float64  // probability (0–1) of injecting a starter
}

var personalityFillers = map[string]fillerProfile{
	"supportive": {
		starters: []string{"Well, ", "You know, ", "I think ", "I feel like "},
		rate:     0.40,
	},
	"analytical": {
		starters: []string{"Actually, ", "In fact, ", "To be precise, ", "Notably, "},
		rate:     0.20,
	},
	"facilitator": {
		starters: []string{"So, ", "Right, ", "Okay, ", "Let's see — "},
		rate:     0.30,
	},
	"devil's advocate": {
		starters: []string{"But, ", "However, ", "Wait — ", "Hmm, "},
		rate:     0.35,
	},
}

var defaultFillerProfile = fillerProfile{
	starters: []string{"Well, ", "So, ", "Right, "},
	rate:     0.25,
}

// InjectFillers prepends a personality-appropriate filler phrase to a response.
// rng may be nil (a local source is used). Pass rate=0 in the profile to disable.
func InjectFillers(text, personality string, rng *rand.Rand) string {
	if rng == nil {
		rng = rand.New(rand.NewSource(rand.Int63())) //nolint:gosec
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return text
	}
	profile, ok := personalityFillers[personality]
	if !ok {
		profile = defaultFillerProfile
	}
	if profile.rate == 0 || rng.Float64() >= profile.rate {
		return text
	}
	starter := profile.starters[rng.Intn(len(profile.starters))]
	runes := []rune(text)
	if len(runes) > 0 {
		runes[0] = unicode.ToLower(runes[0])
	}
	return starter + string(runes)
}

// SplitSentences splits text on sentence-ending punctuation (.!?).
// Exported so prompt builder and tests can reuse it.
func SplitSentences(text string) []string {
	var sentences []string
	var cur strings.Builder
	runes := []rune(text)
	for i, r := range runes {
		cur.WriteRune(r)
		if (r == '.' || r == '!' || r == '?') && i < len(runes)-1 {
			if s := strings.TrimSpace(cur.String()); s != "" {
				sentences = append(sentences, s)
			}
			cur.Reset()
		}
	}
	if s := strings.TrimSpace(cur.String()); s != "" {
		sentences = append(sentences, s)
	}
	return sentences
}

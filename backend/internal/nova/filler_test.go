package nova

import (
	"math/rand"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func fixedRng(seed int64) *rand.Rand {
	return rand.New(rand.NewSource(seed)) //nolint:gosec
}

func TestInjectFillers_CanInject(t *testing.T) {
	// Over 100 seeds, at ~40% rate we expect many injections.
	injected := 0
	for seed := int64(0); seed < 100; seed++ {
		out := InjectFillers("That is a good idea.", "supportive", fixedRng(seed))
		hasStarter := false
		for _, s := range personalityFillers["supportive"].starters {
			if strings.HasPrefix(out, s) {
				hasStarter = true
				break
			}
		}
		if hasStarter {
			injected++
		}
	}
	// With 40% rate, expected ~40 injections; we accept ≥ 15 to avoid flakiness.
	assert.GreaterOrEqual(t, injected, 15, "expected filler injection across seeds, got %d/100", injected)
}

func TestInjectFillers_EmptyText(t *testing.T) {
	out := InjectFillers("", "supportive", fixedRng(1))
	assert.Equal(t, "", out)
}

func TestInjectFillers_UnknownPersonality_NoePanic(t *testing.T) {
	out := InjectFillers("Something happened.", "unknown", fixedRng(1))
	assert.NotEmpty(t, out)
}

func TestInjectFillers_NilRng_NoPanic(t *testing.T) {
	assert.NotPanics(t, func() {
		InjectFillers("Hello.", "supportive", nil)
	})
}

func TestSplitSentences_Three(t *testing.T) {
	s := SplitSentences("Hello. How are you? I am fine!")
	assert.Len(t, s, 3)
	assert.Equal(t, "Hello.", s[0])
	assert.Equal(t, "How are you?", s[1])
	assert.Equal(t, "I am fine!", s[2])
}

func TestSplitSentences_NoTerminator(t *testing.T) {
	s := SplitSentences("No terminator here")
	assert.Len(t, s, 1)
	assert.Equal(t, "No terminator here", s[0])
}

func TestSplitSentences_Empty(t *testing.T) {
	assert.Empty(t, SplitSentences(""))
}

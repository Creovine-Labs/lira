package audio

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// makeSpeechPCM produces n frames of PCM16-LE samples with energy above the
// default VAD threshold.
func makeSpeechPCM(nFrames int) []byte {
	const sampleVal = int16(2000) // well above EnergyThresh=500
	samples := 320 * nFrames
	b := make([]byte, samples*2)
	for i := 0; i < samples; i++ {
		// alternate positive/negative to avoid clipping-like dc offset
		v := sampleVal
		if i%2 == 0 {
			v = -sampleVal
		}
		b[i*2] = byte(uint16(v))
		b[i*2+1] = byte(uint16(v) >> 8)
	}
	return b
}

// makeSilencePCM produces n frames of near-zero (silent) PCM16-LE samples.
func makeSilencePCM(nFrames int) []byte {
	return make([]byte, 320*2*nFrames)
}

func TestVAD_SpeechStart(t *testing.T) {
	v := DefaultVAD()
	// Feed fewer than SpeechFrames=3 consecutive speech frames -> no start yet.
	evs := v.Feed(makeSpeechPCM(2))
	assert.NotContains(t, evs, VADSpeechStart)
	assert.False(t, v.InSpeech())

	// One more frame pushes us over the threshold.
	evs = v.Feed(makeSpeechPCM(1))
	assert.Contains(t, evs, VADSpeechStart)
	assert.True(t, v.InSpeech())
}

func TestVAD_SpeechEnd(t *testing.T) {
	v := DefaultVAD()

	// Start speech first.
	v.Feed(makeSpeechPCM(v.SpeechFrames))
	require.True(t, v.InSpeech())

	// Feed fewer than SilenceFrames=25 silence frames -> no end yet.
	evs := v.Feed(makeSilencePCM(10))
	assert.NotContains(t, evs, VADSpeechEnd)

	// Feed remaining silence to trigger end.
	evs = v.Feed(makeSilencePCM(v.SilenceFrames - 10))
	assert.Contains(t, evs, VADSpeechEnd)
	assert.False(t, v.InSpeech())
}

func TestVAD_NoSpeechEnd_WithoutSpeechStart(t *testing.T) {
	v := DefaultVAD()
	// Pure silence never triggers SpeechEnd.
	evs := v.Feed(makeSilencePCM(100))
	for _, e := range evs {
		assert.NotEqual(t, VADSpeechEnd, e)
	}
}

func TestVAD_Reset(t *testing.T) {
	v := DefaultVAD()
	v.Feed(makeSpeechPCM(v.SpeechFrames))
	require.True(t, v.InSpeech())

	v.Reset()
	assert.False(t, v.InSpeech())

	// After reset, speech must be re-detected from scratch.
	evs := v.Feed(makeSpeechPCM(v.SpeechFrames))
	assert.Contains(t, evs, VADSpeechStart)
}

func TestVAD_PartialFrameAccumulation(t *testing.T) {
	v := DefaultVAD()
	pcm := makeSpeechPCM(v.SpeechFrames)

	// Feed one byte at a time; VAD should accumulate and eventually fire.
	var gotStart bool
	for i := 0; i < len(pcm); i++ {
		for _, e := range v.Feed(pcm[i : i+1]) {
			if e == VADSpeechStart {
				gotStart = true
			}
		}
	}
	assert.True(t, gotStart, "expected VADSpeechStart when feeding one byte at a time")
}

func TestDecodePCM16LE(t *testing.T) {
	// Little-endian encoding of int16(1000) is [0xE8, 0x03]
	b := []byte{0xE8, 0x03, 0x18, 0xFC} // 1000, -1000
	samples := decodePCM16LE(b)
	require.Len(t, samples, 2)
	assert.Equal(t, int16(1000), samples[0])
	assert.Equal(t, int16(-1000), samples[1])
}

func TestRMSEnergy(t *testing.T) {
	// rms of [0,0,0] == 0
	assert.Equal(t, float64(0), rmsEnergy([]int16{0, 0, 0}))

	// rms of [1000, -1000] == 1000
	energy := rmsEnergy([]int16{1000, -1000})
	assert.InDelta(t, 1000.0, energy, 0.01)

	// empty slice
	assert.Equal(t, float64(0), rmsEnergy(nil))
}

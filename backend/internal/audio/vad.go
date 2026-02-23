// Package audio – voice-activity detection (VAD) for raw PCM16-LE audio.
//
// Algorithm:
//  1. Bytes are fed in arbitrary chunks; the VAD maintains an internal
//     sample accumulator until a complete frame is available.
//  2. Per frame, the root-mean-square (RMS) energy is computed over the
//     signed int16 samples.  A frame is "speech" if energy > EnergyThresh.
//  3. VADSpeechStart fires after SpeechFrames consecutive speech frames.
//  4. VADSpeechEnd  fires after SilenceFrames consecutive silence frames
//     that follow an active speech segment.
//
// Default tuning (16 kHz, 20 ms frames):
//   EnergyThresh  = 500    (~1.5 % of full-scale int16)
//   SpeechFrames  = 3      (60 ms onset)
//   SilenceFrames = 25     (500 ms tail → end of utterance)
package audio

import (
	"encoding/binary"
	"math"
)

// VADEvent is the result of feeding a frame into the VAD.
type VADEvent int

const (
	VADNone        VADEvent = iota // no state change
	VADSpeechStart                 // speech segment started
	VADSpeechEnd                   // utterance complete (silence after speech)
)

// VAD performs energy-based voice-activity detection on raw PCM16-LE audio.
// It is NOT safe for concurrent use; wrap with a mutex when sharing.
type VAD struct {
	// Configurable parameters (set before first call to Feed).
	SampleRate    int     // samples per second, default 16000
	FrameSamples  int     // samples per analysis frame, default 320 (20 ms)
	EnergyThresh  float64 // RMS threshold to classify a frame as speech
	SpeechFrames  int     // consecutive speech frames needed to declare speech start
	SilenceFrames int     // consecutive silence frames after speech to declare end

	// Internal state.
	fragment   []byte // leftover bytes that don't yet form a complete frame
	speechRun  int    // how many consecutive speech frames seen
	silenceRun int    // how many consecutive silence frames after speech
	inSpeech   bool   // currently inside a speech segment
}

// DefaultVAD creates a VAD pre-configured for 16 kHz mono PCM16-LE speech.
func DefaultVAD() *VAD {
	return &VAD{
		SampleRate:    16000,
		FrameSamples:  320,
		EnergyThresh:  500,
		SpeechFrames:  3,
		SilenceFrames: 25,
	}
}

// frameSizeBytes returns the byte length of a single analysis frame.
func (v *VAD) frameSizeBytes() int {
	return v.FrameSamples * 2 // 2 bytes per int16 sample
}

// Feed accepts raw PCM16-LE bytes and returns zero or more VADEvents.
// The data may span multiple frames; each frame generates at most one event.
// Partial frames are buffered internally until the next call.
func (v *VAD) Feed(data []byte) []VADEvent {
	v.fragment = append(v.fragment, data...)
	frameBytes := v.frameSizeBytes()

	var events []VADEvent
	for len(v.fragment) >= frameBytes {
		frame := v.fragment[:frameBytes]
		v.fragment = v.fragment[frameBytes:]

		samples := decodePCM16LE(frame)
		energy := rmsEnergy(samples)

		if energy >= v.EnergyThresh {
			// Speech frame
			v.speechRun++
			v.silenceRun = 0
			if !v.inSpeech && v.speechRun >= v.SpeechFrames {
				v.inSpeech = true
				events = append(events, VADSpeechStart)
			}
		} else {
			// Silence frame
			v.silenceRun++
			v.speechRun = 0
			if v.inSpeech && v.silenceRun >= v.SilenceFrames {
				v.inSpeech = false
				v.silenceRun = 0
				events = append(events, VADSpeechEnd)
			}
		}
	}
	if len(events) == 0 {
		return []VADEvent{VADNone}
	}
	return events
}

// Reset clears all internal VAD state.
func (v *VAD) Reset() {
	v.fragment = v.fragment[:0]
	v.speechRun = 0
	v.silenceRun = 0
	v.inSpeech = false
}

// InSpeech reports whether the VAD currently considers itself inside a speech segment.
func (v *VAD) InSpeech() bool { return v.inSpeech }

// ─── helpers ─────────────────────────────────────────────────────────────────

// decodePCM16LE interprets b as little-endian signed 16-bit samples.
func decodePCM16LE(b []byte) []int16 {
	samples := make([]int16, len(b)/2)
	for i := range samples {
		samples[i] = int16(binary.LittleEndian.Uint16(b[i*2:]))
	}
	return samples
}

// rmsEnergy computes the root-mean-square energy of a sample slice.
func rmsEnergy(samples []int16) float64 {
	if len(samples) == 0 {
		return 0
	}
	var sum float64
	for _, s := range samples {
		f := float64(s)
		sum += f * f
	}
	return math.Sqrt(sum / float64(len(samples)))
}

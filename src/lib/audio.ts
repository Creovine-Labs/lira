/**
 * Audio capture (mic → PCM 16kHz 16-bit mono) and playback (PCM 24kHz → speaker).
 *
 * Uses ScriptProcessorNode for maximum browser compat in the hackathon demo.
 */

// ── Mic Capture ───────────────────────────────────────────────────────────────

export type OnAudioChunk = (pcm16: ArrayBuffer) => void

interface CaptureState {
  stream: MediaStream
  audioCtx: AudioContext
  source: MediaStreamAudioSourceNode
  processor: ScriptProcessorNode
  analyser: AnalyserNode
}

let captureState: CaptureState | null = null

/**
 * Request mic permission and start capturing PCM 16kHz 16-bit mono.
 * `onChunk` is called with raw PCM ArrayBuffer ~every 100ms.
 */
export async function startCapture(onChunk: OnAudioChunk): Promise<void> {
  if (captureState) return

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  const audioCtx = new AudioContext()
  const source = audioCtx.createMediaStreamSource(stream)

  // Analyser for mic level visualization
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)

  // ScriptProcessor to grab raw samples and convert to PCM16 @ 16kHz
  const bufferSize = 4096
  const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1)

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0)
    const pcm16 = downsampleToPcm16(inputData, audioCtx.sampleRate, 16000)
    onChunk(pcm16.buffer as ArrayBuffer)
  }

  source.connect(processor)
  // ScriptProcessorNode must be connected to destination to fire events
  processor.connect(audioCtx.destination)

  captureState = { stream, audioCtx, source, processor, analyser }
}

/** Stop capturing. Releases mic and cleans up audio nodes. */
export function stopCapture(): void {
  if (!captureState) return

  captureState.processor.disconnect()
  captureState.source.disconnect()
  captureState.analyser.disconnect()
  captureState.stream.getTracks().forEach((t) => t.stop())
  void captureState.audioCtx.close()
  captureState = null
}

/** Returns RMS level [0, 1] for mic visualisation. Returns 0 if not capturing. */
export function getMicLevel(): number {
  if (!captureState) return 0
  const data = new Uint8Array(captureState.analyser.frequencyBinCount)
  captureState.analyser.getByteTimeDomainData(data)
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128
    sum += v * v
  }
  return Math.sqrt(sum / data.length)
}

// ── PCM Playback ──────────────────────────────────────────────────────────────

let playbackCtx: AudioContext | null = null
let nextPlayTime = 0
/** Track all scheduled audio sources so we can stop them on interruption. */
const activeSources: AudioBufferSourceNode[] = []

/** Initialise playback AudioContext (call after user gesture). */
export function initPlayback(): void {
  if (!playbackCtx) {
    playbackCtx = new AudioContext({ sampleRate: 24000 })
  }
}

/** Enqueue a PCM 24kHz 16-bit mono buffer for gapless playback. */
export function playPcmChunk(pcmData: ArrayBuffer): void {
  if (!playbackCtx) initPlayback()
  if (!playbackCtx) return

  // PCM 16-bit requires even byte count — trim trailing odd byte if present
  const byteLen = pcmData.byteLength & ~1
  if (byteLen === 0) return
  const int16 = new Int16Array(pcmData, 0, byteLen / 2)

  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] < 0 ? int16[i] / 0x8000 : int16[i] / 0x7fff
  }

  const buffer = playbackCtx.createBuffer(1, float32.length, 24000)
  buffer.getChannelData(0).set(float32)

  const source = playbackCtx.createBufferSource()
  source.buffer = buffer
  source.connect(playbackCtx.destination)

  // Track this source for interruption
  activeSources.push(source)
  source.onended = () => {
    const idx = activeSources.indexOf(source)
    if (idx !== -1) activeSources.splice(idx, 1)
  }

  const now = playbackCtx.currentTime
  const startTime = Math.max(now + 0.01, nextPlayTime)
  source.start(startTime)
  nextPlayTime = startTime + buffer.duration
}

/**
 * Immediately stop all queued/playing AI audio and reset the playback queue.
 * Called on barge-in (user interrupts AI).
 */
export function flushPlayback(): void {
  // Stop all scheduled and currently-playing audio sources
  for (const source of activeSources) {
    try {
      source.stop()
      source.disconnect()
    } catch {
      // Already stopped or not started — ignore
    }
  }
  activeSources.length = 0
  nextPlayTime = 0
}

/** Reset playback queue (e.g. when AI stops speaking). */
export function resetPlayback(): void {
  flushPlayback()
}

/** Destroy playback context entirely. */
export function destroyPlayback(): void {
  flushPlayback()
  if (playbackCtx) {
    void playbackCtx.close()
    playbackCtx = null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function downsampleToPcm16(float32: Float32Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) {
    return float32ToInt16(float32)
  }

  const ratio = fromRate / toRate
  const length = Math.round(float32.length / ratio)
  const result = new Int16Array(length)

  for (let i = 0; i < length; i++) {
    // Simple linear interpolation
    const srcIdx = i * ratio
    const low = Math.floor(srcIdx)
    const high = Math.min(low + 1, float32.length - 1)
    const frac = srcIdx - low
    const sample = float32[low] * (1 - frac) + float32[high] * frac
    const clamped = Math.max(-1, Math.min(1, sample))
    result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }

  return result
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const result = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    result[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return result
}

/**
 * Lira Support Widget — Voice Call Module
 *
 * Handles real-time voice calls between widget visitors and Lira AI.
 * Uses Nova Sonic via WebSocket for bidirectional audio streaming.
 *
 * Audio protocol:
 *   Mic → PCM 16kHz 16-bit mono → WebSocket binary frames → Nova Sonic
 *   Nova Sonic → PCM 24kHz 16-bit mono → WebSocket binary frames → Speaker
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'connecting' | 'active' | 'ended'

export interface VoiceCallbacks {
  onStateChange: (state: VoiceState) => void
  onTranscript: (text: string, role: 'customer' | 'lira') => void
  onError: (message: string) => void
  onMicLevel: (level: number) => void
}

// ── Mic Capture ───────────────────────────────────────────────────────────────

interface CaptureContext {
  stream: MediaStream
  audioCtx: AudioContext
  source: MediaStreamAudioSourceNode
  workletNode: AudioWorkletNode
}

function downsampleToPcm16(float32: Float32Array, fromRate: number, toRate: number): Int16Array {
  const ratio = fromRate / toRate
  const length = Math.round(float32.length / ratio)
  const result = new Int16Array(length)
  for (let i = 0; i < length; i++) {
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

// ── PCM Playback ──────────────────────────────────────────────────────────────

class PcmPlayer {
  private ctx: AudioContext
  private nextPlayTime = 0
  private sources: AudioBufferSourceNode[] = []
  // Per-stream jitter buffer. Nova Sonic emits PCM in ~20-40ms chunks; the
  // network + WS decode + JS thread can stall 50ms+ at a time, especially on
  // first audio frame after a tool round-trip. A leadtime smaller than that
  // window causes the audio scheduler to start chunks in the past, which
  // either drops them silently or plays them with a click.
  //
  // 2026-05-23: Nova Sonic V2 emits audio in noticeably more bursty patterns
  // than V1 — short utterances arrive smoothly, but longer model outputs
  // (multi-sentence answers, anything that involves the KB) arrive in
  // bursts separated by 200-400ms gaps as the model thinks through more
  // tokens before flushing audio. The previous 120ms leadtime was tuned for
  // V1 and was too tight for V2: gaps exceeded the buffer and the scheduler
  // played chunks late, producing the audible cracks the user reported on
  // longer answers. 350ms comfortably absorbs V2's worst observed jitter.
  // The tradeoff is a one-time ~230ms delay before audio starts on each
  // utterance — perceptible but not bad for a support call.
  private static readonly LEADTIME_SEC = 0.35

  // ── Smoothness instrumentation (Voice V2, Phase 1) ──────────────────────
  // Measurement-only. Pairs with the server-side metrics in
  // lira-sonic.service.ts: if the server reports smooth gaps but the browser
  // underruns here, the stutter is transport/playback, not Bedrock.
  // See docs VOICE_V2_IMPLEMENTATION_PLAN.md §4.1. Always collected (cheap);
  // only logged when debug is enabled (window.LIRA_VOICE_DEBUG === true or
  // localStorage 'lira_voice_debug' === '1') since this widget ships on
  // customer sites.
  private createdAt = performance.now()
  private firstPlayAt = 0
  private lastPlayAt = 0
  private chunkCount = 0
  private arrivalGapsMs: number[] = []
  private underruns = 0
  private flushes = 0

  constructor() {
    this.ctx = new AudioContext({ sampleRate: 24000 })
    // AudioContext starts in `suspended` state on Chrome (and sometimes
    // Safari) unless explicitly resumed. The mic-click handler that builds
    // PcmPlayer IS a user gesture, but the gesture window can close before
    // the first audio frame arrives, leaving us silent forever. Calling
    // resume() unconditionally is harmless when already running.
    void this.ctx.resume().catch(() => {
      /* will retry on next play() */
    })
  }

  play(pcmData: ArrayBuffer): void {
    // PCM 16-bit requires even byte count — trim trailing odd byte if present
    const byteLen = pcmData.byteLength & ~1
    if (byteLen === 0) return

    // Instrumentation: chunk arrival timing (Phase 1).
    const arrival = performance.now()
    if (this.firstPlayAt === 0) this.firstPlayAt = arrival
    if (this.lastPlayAt !== 0) this.arrivalGapsMs.push(arrival - this.lastPlayAt)
    this.lastPlayAt = arrival
    this.chunkCount++
    const int16 = new Int16Array(pcmData, 0, byteLen / 2)

    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] < 0 ? int16[i] / 0x8000 : int16[i] / 0x7fff
    }

    const buffer = this.ctx.createBuffer(1, float32.length, 24000)
    buffer.getChannelData(0).set(float32)

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)

    this.sources.push(source)
    source.onended = () => {
      const idx = this.sources.indexOf(source)
      if (idx !== -1) this.sources.splice(idx, 1)
    }

    // Safety net: if the context suspended (page hidden, OS audio change),
    // try resuming before scheduling. Cheap when already running.
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {
        /* ignore */
      })
    }

    const now = this.ctx.currentTime
    // Instrumentation: underrun = the scheduled queue fully drained before
    // this chunk arrived, i.e. an audible gap (Phase 1).
    if (this.nextPlayTime > 0 && now >= this.nextPlayTime) this.underruns++
    const startTime = Math.max(now + PcmPlayer.LEADTIME_SEC, this.nextPlayTime)
    source.start(startTime)
    this.nextPlayTime = startTime + buffer.duration
  }

  flush(): void {
    this.flushes++
    for (const s of this.sources) {
      try {
        s.stop()
        s.disconnect()
      } catch {
        /* already stopped */
      }
    }
    this.sources.length = 0
    this.nextPlayTime = 0
  }

  /** Snapshot of smoothness metrics for this call (Phase 1). */
  getMetrics(): {
    ttfpMs: number
    chunks: number
    gapP50: number
    gapP95: number
    gapP99: number
    gapMax: number
    underruns: number
    flushes: number
  } {
    const gaps = [...this.arrivalGapsMs].sort((a, b) => a - b)
    const pct = (p: number) =>
      gaps.length
        ? Math.round(gaps[Math.min(gaps.length - 1, Math.floor((p / 100) * gaps.length))])
        : 0
    return {
      ttfpMs: this.firstPlayAt ? Math.round(this.firstPlayAt - this.createdAt) : -1,
      chunks: this.chunkCount,
      gapP50: pct(50),
      gapP95: pct(95),
      gapP99: pct(99),
      gapMax: gaps.length ? Math.round(gaps[gaps.length - 1]) : 0,
      underruns: this.underruns,
      flushes: this.flushes,
    }
  }

  private logMetrics(): void {
    let debug = false
    try {
      debug =
        (window as unknown as { LIRA_VOICE_DEBUG?: boolean }).LIRA_VOICE_DEBUG === true ||
        localStorage.getItem('lira_voice_debug') === '1'
    } catch {
      /* storage blocked — stay silent */
    }
    if (!debug) return
    const m = this.getMetrics()
    console.log(
      `[voice][metrics] ttfp_ms=${m.ttfpMs} chunks=${m.chunks} ` +
        `arrival_gap_p50_ms=${m.gapP50} p95_ms=${m.gapP95} p99_ms=${m.gapP99} ` +
        `max_ms=${m.gapMax} underruns=${m.underruns} flushes=${m.flushes}`
    )
  }

  destroy(): void {
    this.logMetrics()
    this.flush()
    void this.ctx.close()
  }
}

// ── Voice Call Manager ────────────────────────────────────────────────────────

export class WidgetVoiceCall {
  private state: VoiceState = 'idle'
  private ws: WebSocket | null = null
  private capture: CaptureContext | null = null
  private player: PcmPlayer | null = null
  private callbacks: VoiceCallbacks
  private orgId: string
  private visitorId: string
  private demoContext: Record<string, unknown> | undefined
  private identity: { email?: string; sig?: string; sessionToken?: string } | undefined
  private publishableKey: string | undefined
  private connectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    orgId: string,
    visitorId: string,
    demoContext: Record<string, unknown> | undefined,
    callbacks: VoiceCallbacks,
    identity?: { email?: string; sig?: string; sessionToken?: string },
    publishableKey?: string
  ) {
    this.orgId = orgId
    this.visitorId = visitorId
    this.demoContext = demoContext
    this.callbacks = callbacks
    this.identity = identity
    this.publishableKey = publishableKey
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') return
    this.setState('connecting')

    try {
      // 1. Request mic permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })

      // 2. Set up audio capture
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)

      // AudioWorklet processor — runs off the main thread (no ScriptProcessorNode deprecation)
      const processorCode = `
        class PcmCaptureProcessor extends AudioWorkletProcessor {
          constructor() { super(); this._buffer = new Float32Array(0); }
          process(inputs) {
            const input = inputs[0];
            if (input && input[0] && input[0].length > 0) {
              const nb = new Float32Array(this._buffer.length + input[0].length);
              nb.set(this._buffer);
              nb.set(input[0], this._buffer.length);
              this._buffer = nb;
              while (this._buffer.length >= 4096) {
                this.port.postMessage(this._buffer.slice(0, 4096));
                this._buffer = this._buffer.slice(4096);
              }
            }
            return true;
          }
        }
        registerProcessor('pcm-capture', PcmCaptureProcessor);
      `
      const blob = new Blob([processorCode], { type: 'application/javascript' })
      const blobUrl = URL.createObjectURL(blob)
      await audioCtx.audioWorklet.addModule(blobUrl)
      URL.revokeObjectURL(blobUrl)

      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-capture')
      source.connect(workletNode)

      workletNode.port.onmessage = (e: MessageEvent) => {
        if (this.state !== 'active' || !this.ws || this.ws.readyState !== WebSocket.OPEN) return
        const float32 = e.data as Float32Array
        const pcm16 = downsampleToPcm16(float32, audioCtx.sampleRate, 16000)
        const audioFrame = new ArrayBuffer(pcm16.byteLength)
        new Uint8Array(audioFrame).set(
          new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength)
        )
        this.ws.send(audioFrame)
      }

      this.capture = { stream, audioCtx, source, workletNode }

      // 3. Set up audio playback
      this.player = new PcmPlayer()

      // 5. Connect WebSocket to backend voice endpoint
      let wsUrl = `wss://api.creovine.com/lira/v1/support/chat/voice/${this.orgId}?visitorId=${encodeURIComponent(this.visitorId)}`
      if (this.publishableKey) {
        wsUrl += `&pk=${encodeURIComponent(this.publishableKey)}`
      }
      // Voice inherits verified identity (P4): pass email+sig so the caller gets
      // verified_customer scope and can confirm account actions.
      if (this.identity?.email && this.identity?.sig) {
        wsUrl += `&email=${encodeURIComponent(this.identity.email)}&sig=${encodeURIComponent(this.identity.sig)}`
      }
      if (this.identity?.sessionToken) {
        wsUrl += `&sessionToken=${encodeURIComponent(this.identity.sessionToken)}`
      }
      this.ws = new WebSocket(wsUrl)
      this.ws.binaryType = 'arraybuffer'

      // Connect timeout — if the socket never opens (dead network, backend
      // down), don't sit on "Connecting…" forever. Tear down and surface it.
      this.connectTimer = setTimeout(() => {
        if (this.state === 'connecting') {
          this.callbacks.onError('Could not connect — please try again')
          this.end()
        }
      }, 10000)

      this.ws.onopen = () => {
        if (this.connectTimer) {
          clearTimeout(this.connectTimer)
          this.connectTimer = null
        }
        this.setState('active')
        // Demo embeds: push the visitor's local dashboard snapshot so the AI
        // can answer account-aware questions and the demo tools have context.
        // No-op for production embeds (demoContext is undefined).
        if (this.demoContext && this.ws?.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'demo_context', profile: this.demoContext }))
          } catch {
            /* ignore */
          }
        }
      }

      this.ws.onmessage = (event) => {
        // Binary = AI audio output
        if (event.data instanceof ArrayBuffer) {
          this.player?.play(event.data)
          return
        }
        // JSON = control messages
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'transcript' && msg.text) {
            this.callbacks.onTranscript(msg.text, msg.role || 'lira')
          } else if (msg.type === 'interruption') {
            this.player?.flush()
          } else if (msg.type === 'call_ended') {
            this.end()
          } else if (msg.type === 'error') {
            this.callbacks.onError(msg.message || 'Voice call error')
            this.end()
          } else if (msg.type === 'demo_action_executed' && msg.action_type) {
            // Voice equivalent of the chat WS demo_action_executed message.
            // Mirror it to the same CustomEvent the chat path uses so the
            // host page (React dashboard) re-renders via one shared handler.
            try {
              window.dispatchEvent(
                new CustomEvent('lira-demo-action', {
                  detail: { type: msg.action_type, payload: msg.payload ?? {} },
                })
              )
            } catch {
              /* ignore */
            }
          } else if (
            msg.type === 'pin_required' ||
            msg.type === 'action_started' ||
            msg.type === 'action_completed' ||
            msg.type === 'action_failed' ||
            msg.type === 'confirm' || // in-call confirmation card (Voice V2 P4)
            msg.type === 'confirm_ack'
          ) {
            // Voice tools (Sonic-fired tool calls) emit these on the voice
            // WS. The chat widget renders the action card + PIN modal via
            // its own onmessage handler — to share that logic, forward
            // these messages to it via a CustomEvent. The widget listener
            // calls back into this voice call (sendJson) when the user
            // submits the PIN so the response goes over the correct WS.
            try {
              window.dispatchEvent(
                new CustomEvent('lira-voice-widget-event', {
                  detail: { msg, voice: this },
                })
              )
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      }

      this.ws.onclose = () => {
        if (this.state === 'active') this.end()
      }

      this.ws.onerror = () => {
        this.callbacks.onError('Connection lost')
        this.end()
      }
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied'
          : 'Failed to start voice call'
      this.callbacks.onError(msg)
      this.cleanup()
      this.setState('idle')
    }
  }

  /**
   * Public send method so the parent widget can route pin_response /
   * pin_cancel messages back over the SAME voice WS that issued the
   * pin_required event. The chat WS has its own socket; we keep them
   * separate so a voice-issued PIN can't be answered on the chat channel
   * (or vice versa).
   */
  sendJson(msg: Record<string, unknown>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false
    try {
      this.ws.send(JSON.stringify(msg))
      return true
    } catch {
      return false
    }
  }

  end(): void {
    if (this.state === 'idle' || this.state === 'ended') return

    // Tell server to end the call
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ action: 'end_call' }))
      } catch {
        /* ignore */
      }
    }

    this.cleanup()
    // Synchronous, idempotent teardown — mirrors the landing-concierge flow.
    // NO delayed idle timer: a pending setTimeout could fire on a stale call
    // instance after a newer call had started, orphaning the new call's live
    // mic + WebSocket (mic stays on, overlay gone). Reset immediately so the
    // button is usable again with no dead window.
    this.setState('ended')
    this.setState('idle')
  }

  private cleanup(): void {
    // Cancel any pending connect timeout
    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
    // Stop mic capture
    if (this.capture) {
      this.capture.workletNode.port.close()
      this.capture.workletNode.disconnect()
      this.capture.source.disconnect()
      this.capture.stream.getTracks().forEach((t) => t.stop())
      void this.capture.audioCtx.close()
      this.capture = null
    }
    // Stop playback
    if (this.player) {
      this.player.destroy()
      this.player = null
    }
    // Close WebSocket
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        /* ignore */
      }
      this.ws = null
    }
  }

  private setState(state: VoiceState): void {
    this.state = state
    this.callbacks.onStateChange(state)
  }

  getState(): VoiceState {
    return this.state
  }
}

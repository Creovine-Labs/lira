/**
 * Lira AI — Pipecat client transport for the support widget.
 *
 * Wraps `@pipecat-ai/client-js` + `@pipecat-ai/websocket-transport` for
 * Phase 2 of the Pipecat migration. Lives alongside the legacy `socket.ts`
 * (chat WS) and `voice.ts` (voice WS) — the widget picks which transport
 * to use based on the `LIRA_USE_PIPECAT` feature flag.
 *
 * Once Phase 4 ships, the legacy files are deleted and this becomes the
 * sole transport for both chat and voice (one connection, one protocol).
 *
 * Connection contract — the widget passes these as query params on the
 * WS URL so the Pipecat agent can build per-session context:
 *   • orgId
 *   • conversationId
 *   • visitorId    (optional)
 *   • channel      ("voice" | "chat")
 */

import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js'
import {
  WavMediaManager,
  WebSocketTransport,
  ProtobufFrameSerializer,
} from '@pipecat-ai/websocket-transport'

/**
 * SDK PATCH: two problems with WavMediaManager.initialize that we fix here.
 *
 * 1) Mic leak for chat sessions. The SDK's initialize() unconditionally
 *    calls `_wavRecorder.begin()` — which requests `getUserMedia({audio})`
 *    and opens a live MediaStream — REGARDLESS of whether enableMic was
 *    set false. For our chat-only sessions, this means Chrome's tab
 *    "recording" indicator turns on for chat too, and the stream lingers
 *    after the session ends (we only stop the *voice* recorder in our
 *    stop()). When the customer chats then voices, we leave one stream
 *    open forever.
 *
 *    Fix: if `_micEnabled` is false, skip begin() entirely. Mark the
 *    manager initialized so the rest of the connect flow proceeds.
 *
 * 2) Silent error swallowing. Even when mic IS enabled, the original
 *    initialize() wraps begin() in a try/catch with an empty body, so
 *    audio worklet failures, AudioWorkletNode construction failures, etc.
 *    surface as the cryptic "Session ended: please call .begin() first"
 *    later — with no clue what actually broke. We log and re-throw.
 */
const _origInitialize = (
  WavMediaManager.prototype as unknown as { initialize: () => Promise<void> }
).initialize
;(WavMediaManager.prototype as unknown as {
  initialize: () => Promise<void>
}).initialize = async function () {
  const micEnabled = (this as unknown as { _micEnabled?: boolean })._micEnabled
  if (!micEnabled) {
    // Chat session — never open the mic. Mark initialized so connect()'s
    // mediaManager.connect() doesn't try to re-run this on us.
    ;(this as unknown as { _initialized?: boolean })._initialized = true
    // eslint-disable-next-line no-console
    console.log('[Lira voice] chat session — skipping mic init')
    return
  }
  try {
    return await _origInitialize.call(this)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Lira voice] WavMediaManager.initialize threw:', err)
    throw err
  }
}

// Patch WavRecorder.begin too — the swallow happens inside the AWAIT, so
// the throw we observe at WavMediaManager.initialize may be from a later
// step. Also wrap begin so we see *which* line in it actually fails.
const _wavRecorderProto = (
  WavMediaManager.prototype as unknown as {
    _wavRecorder?: { constructor?: { prototype?: Record<string, unknown> } }
  }
)
type RecorderProto = { begin?: (deviceId?: string) => Promise<true> }
// We can only reach WavRecorder's prototype lazily — but installing on the
// first WavMediaManager instance's `_wavRecorder.constructor.prototype` is
// idempotent enough; the patch runs at module load and applies for every
// session created afterwards. Defensive: only patch if not already done.
const installRecorderPatch = (instance: { _wavRecorder?: RecorderProto }) => {
  const recorder = instance._wavRecorder
  const proto = recorder
    ? (Object.getPrototypeOf(recorder) as RecorderProto & { __liraPatched?: true })
    : null
  if (!proto || proto.__liraPatched) return
  const origBegin = proto.begin
  if (typeof origBegin !== 'function') return
  proto.begin = async function (deviceId?: string) {
    try {
      // eslint-disable-next-line no-console
      console.log('[Lira voice] WavRecorder.begin() starting…')
      const result = await origBegin.call(this, deviceId)
      // eslint-disable-next-line no-console
      console.log('[Lira voice] WavRecorder.begin() completed OK')
      return result
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Lira voice] WavRecorder.begin() threw:', err)
      throw err
    }
  }
  proto.__liraPatched = true
}
// Hook into WavMediaManager constructor via initialize so we patch the
// recorder prototype on first use.
const _wrappedInit = (
  WavMediaManager.prototype as unknown as { initialize: () => Promise<void> }
).initialize
;(WavMediaManager.prototype as unknown as {
  initialize: () => Promise<void>
}).initialize = async function () {
  installRecorderPatch(this as { _wavRecorder?: RecorderProto })
  return _wrappedInit.call(this)
}

// Silence unused warning (we needed _wavRecorderProto only for the type info).
void _wavRecorderProto

export interface PipecatTransportConfig {
  /** Base WS URL of the Pipecat agent (e.g. `wss://api.creovine.com/pipecat`). */
  agentWsBase: string
  orgId: string
  conversationId: string
  visitorId?: string
  channel: 'voice' | 'chat'
}

export interface PipecatTransportCallbacks {
  /** Bot finished handshake and is ready for input. */
  onBotReady: () => void
  /** Connection state transitions for UI. */
  onConnected: () => void
  onDisconnected: () => void
  /** Lira's reply transcribed text (incremental). Chat path renders this. */
  onAssistantTranscript: (text: string) => void
  /** Local user's transcript (from STT, for voice). */
  onUserTranscript: (text: string) => void
  /**
   * Typed server message — covers our action lifecycle protocol:
   * action_started / pin_required / action_completed / action_failed /
   * demo_action_executed. Widget dispatches each to the appropriate UI.
   */
  onServerMessage: (msg: { type: string; [key: string]: unknown }) => void
  /** Catch-all for transport errors so we can show a banner. */
  onError: (err: string) => void
}

/**
 * Encapsulates one Pipecat WS session. The widget creates one instance
 * per conversation; calling `start()` opens the connection, `sendMessage`
 * pushes typed client messages (e.g. PIN response, `client_ready`), and
 * `stop()` closes cleanly.
 */
export class PipecatTransport {
  private client: PipecatClient | null = null
  private config: PipecatTransportConfig
  private callbacks: PipecatTransportCallbacks
  // Per-turn accumulator: Pipecat streams the bot's response as a sequence
  // of `onBotTranscript` chunks; we buffer them between
  // `onBotLlmStarted` and `onBotLlmStopped` so the widget receives one
  // aggregated transcript instead of N micro-bubbles.
  private pendingBotText = ''

  constructor(config: PipecatTransportConfig, callbacks: PipecatTransportCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  async start(): Promise<void> {
    if (this.client) return

    const params = new URLSearchParams({
      orgId: this.config.orgId,
      conversationId: this.config.conversationId,
      channel: this.config.channel,
    })
    if (this.config.visitorId) params.set('visitorId', this.config.visitorId)
    const wsUrl = `${this.config.agentWsBase}?${params.toString()}`

    // Voice sessions need microphone; chat sessions only the data channel.
    const enableMic = this.config.channel === 'voice'
    const enableCam = false

    // Pre-flight mic check for voice. The SDK swallows getUserMedia errors
    // in WavMediaManager.initialize() try/catch (see the SDK source), so a
    // denied/blocked mic ends up surfacing as the cryptic "Session ended:
    // please call .begin() first" later. Doing the request ourselves first
    // gives the user a clear, immediate error and ensures the browser
    // permission prompt has been shown by the time the SDK gets there.
    if (enableMic) {
      try {
        const status = await navigator.permissions
          ?.query?.({ name: 'microphone' as PermissionName })
          ?.catch(() => null)
        // eslint-disable-next-line no-console
        console.log(`[Lira voice] mic permission state: ${status?.state ?? 'unknown'}`)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Release the stream — the SDK will request its own when it begins.
        stream.getTracks().forEach((t) => t.stop())
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const name = err instanceof Error ? err.name : ''
        // eslint-disable-next-line no-console
        console.error(`[Lira voice] mic pre-flight failed: ${name} ${msg}`)
        this.callbacks.onError(
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? 'Microphone permission denied. Allow mic access in your browser and try again.'
            : `Could not access microphone: ${msg}`,
        )
        throw err
      }

      // The SDK's WavMediaManager creates an AudioContext at 24000Hz inside
      // `_wavRecorder.begin()`. If the device/browser rejects that sampleRate
      // the SDK silently swallows the error (the catch in initialize() has
      // no body), leaving the recorder uninitialised. Pre-create one
      // ourselves to surface the failure with a real error message.
      try {
        const ctx = new AudioContext({ sampleRate: 24000 })
        // eslint-disable-next-line no-console
        console.log(
          `[Lira voice] AudioContext OK: state=${ctx.state} sampleRate=${ctx.sampleRate}`,
        )
        await ctx.close().catch(() => {})
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        // eslint-disable-next-line no-console
        console.error(`[Lira voice] AudioContext(24000) failed:`, err)
        this.callbacks.onError(
          `Audio system rejected 24kHz sample rate: ${msg}. ` +
            `This is a known SDK quirk we'll need to patch around.`,
        )
        throw err
      }
    }

    // SDK QUIRK: WebSocketTransport defaults to DailyMediaManager, which
    // wraps @daily-co/daily-js — even when the transport itself is plain
    // WebSocket. For our self-hosted Pipecat agent (no Daily.co room) the
    // Daily-backed media manager's `startCamera` flow fails silently and
    // we end up with the cryptic "Session ended: please call .begin()
    // first". The SDK also ships a WS-native `WavMediaManager` that uses
    // raw WebAudio APIs and is the right choice here. Pass it explicitly.
    const transport = new WebSocketTransport({
      serializer: new ProtobufFrameSerializer(),
      mediaManager: new WavMediaManager(
        undefined, // default chunk size
        24000,     // recorder sample rate (matches Nova Sonic input rate)
      ),
    } as unknown as ConstructorParameters<typeof WebSocketTransport>[0])

    this.client = new PipecatClient({
      transport,
      enableMic,
      enableCam,
      callbacks: {
        onConnected: () => this.callbacks.onConnected(),
        onDisconnected: () => this.callbacks.onDisconnected(),
        onBotReady: () => {
          // Workaround for @pipecat-ai/websocket-transport@1.6.4: for
          // chat-only sessions (enableMic=false), `_mediaManager.connect()`
          // inside the transport's _connect() never resolves — the audio
          // worklet bootstrap is gated on devices we explicitly disabled.
          // As a result, `state` never transitions to "ready" and the
          // SDK's @requiresReady decorator blocks `appendToContext` /
          // `sendText`. Because the WS message handler IS wired before
          // `_mediaManager.connect()` runs, bot-ready DOES arrive — so
          // when it does, we flip the state ourselves.
          try {
            const t = (this.client as unknown as {
              transport?: { state?: string }
            } | null)?.transport
            if (t && t.state !== 'ready') t.state = 'ready'
          } catch {
            // best-effort — if the SDK changes shape, the error path
            // catches it and the user just won't send messages.
          }
          this.callbacks.onBotReady()
        },
        onError: (err) => {
          const msg = err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err)
          this.callbacks.onError(msg)
        },
        // Surface mic / cam permission and device-init errors. The SDK's
        // WavMediaManager swallows recorder.begin() errors in its
        // try/catch, so without this callback you get a downstream "Session
        // ended: please call .begin() first" with no clue why. With this
        // wired we get the real cause (permission denied, no audio device,
        // worklet failed, etc.).
        onDeviceError: (err) => {
          const e = err as { devices?: string[]; type?: string; message?: string }
          const what = e?.devices?.join('+') ?? 'device'
          const why = e?.type ?? e?.message ?? 'unknown'
          // eslint-disable-next-line no-console
          console.error(`[Lira voice] ${what} error: ${why}`, err)
          this.callbacks.onError(`Voice setup failed: ${what} — ${why}`)
        },
        // Pipecat streams the bot's reply as a sequence of per-chunk
        // `onBotTranscript` events bracketed by `onBotLlmStarted` and
        // `onBotLlmStopped`. If we forwarded each chunk to the widget
        // verbatim, every sentence / bullet would render as its own
        // message bubble (we saw exactly that on first run). Instead we
        // buffer the chunks and emit ONE aggregated transcript per turn.
        onBotLlmStarted: () => {
          this.pendingBotText = ''
        },
        onBotTranscript: (data) => {
          const text = (data as { text?: string }).text ?? ''
          if (text) this.pendingBotText += text
        },
        onBotLlmStopped: () => {
          const text = this.pendingBotText
          this.pendingBotText = ''
          if (text.trim()) this.callbacks.onAssistantTranscript(text)
        },
        onUserTranscript: (data) => {
          const text = (data as { text?: string }).text ?? ''
          if (text) this.callbacks.onUserTranscript(text)
        },
      },
    })

    // Server-typed messages — the channel we use for action lifecycle +
    // PIN flow. The agent calls `rtvi.send_server_message({type, ...})`
    // on every action event, and we re-dispatch via onServerMessage.
    this.client.on(RTVIEvent.ServerMessage, (msg: unknown) => {
      if (msg && typeof msg === 'object') {
        this.callbacks.onServerMessage(msg as { type: string; [key: string]: unknown })
      }
    })

    try {
      await this.client.connect({ wsUrl })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.callbacks.onError(`Failed to connect: ${msg}`)
      this.client = null
      throw err
    }
  }

  /**
   * Send a user message to the LLM context. The chat path uses this
   * (text-in/text-out). Voice does not — audio flows through the transport
   * automatically once the mic is enabled.
   *
   * We use `sendText()` rather than the deprecated `appendToContext()`:
   * Pipecat 1.x server's RTVIProcessor only handles the `send-text` message
   * type. `append-to-context` is recognised by the JS SDK but rejected by
   * the server (`Unsupported type append-to-context`).
   */
  async appendUserMessage(text: string): Promise<void> {
    if (!this.client) return
    try {
      const c = this.client as unknown as {
        sendText?: (content: string, options?: Record<string, unknown>) => Promise<void>
      }
      if (typeof c.sendText === 'function') {
        await c.sendText(text, { run_immediately: true })
      } else {
        // Fallback for older SDKs that only expose appendToContext.
        await this.client.appendToContext({
          role: 'user',
          content: text,
          run_immediately: true,
        })
      }
    } catch (err) {
      this.callbacks.onError(
        `Failed to send chat message: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  /**
   * Send a typed message to the agent. Used for PIN responses,
   * client_ready acknowledgment, and any future widget→server signal.
   */
  async sendMessage(data: Record<string, unknown>): Promise<void> {
    if (!this.client) return
    // PipecatClient exposes `sendClientMessage(type, data)` — we wrap it
    // so the widget can pass a single object and we extract the type.
    const { type, ...rest } = data as { type: string }
    try {
      await this.client.sendClientMessage(type, rest)
    } catch (err) {
      this.callbacks.onError(
        `Failed to send message: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  /** Acknowledge the agent's bot-ready so the conversation starts. */
  async signalClientReady(): Promise<void> {
    if (!this.client) return
    // PipecatClient provides this as a typed convenience; on transports
    // that need an explicit message it sends `client-ready` upstream.
    // If the method is missing in older SDKs, fall back to a typed
    // server message — the agent listens for both.
    const c = this.client as unknown as { sendClientMessage?: (t: string, d: unknown) => Promise<void> }
    if (typeof c.sendClientMessage === 'function') {
      await c.sendClientMessage('client_ready', {})
    }
  }

  async stop(): Promise<void> {
    if (!this.client) return
    // eslint-disable-next-line no-console
    console.log(`[Lira voice] PipecatTransport.stop() called (channel=${this.config.channel})`)
    try {
      // The SDK's disconnect() should release the mic + close the audio
      // context, but in practice the MediaStream tracks linger and Chrome
      // keeps the tab's "recording" indicator on. Force the cleanup by
      // reaching into the transport's internals BEFORE calling disconnect.
      const internals = this.client as unknown as {
        transport?: {
          _mediaManager?: {
            _wavRecorder?: {
              stream?: MediaStream | null
              context?: AudioContext | null
              processor?: AudioWorkletNode | null
              end?: () => Promise<unknown>
            }
            _wavStreamPlayer?: {
              context?: AudioContext | null
            }
          }
        }
      }
      const mm = internals.transport?._mediaManager
      const recorder = mm?._wavRecorder
      const player = mm?._wavStreamPlayer
      // eslint-disable-next-line no-console
      console.log(
        `[Lira voice] stop() internals: recorder=${!!recorder} ` +
          `stream=${!!recorder?.stream} tracks=${recorder?.stream?.getTracks().length ?? 0} ` +
          `ctx=${recorder?.context?.state ?? 'none'} player.ctx=${player?.context?.state ?? 'none'}`,
      )
      // 1) Stop every track on the recorder's MediaStream — this is the
      //    only way Chrome's "recording" tab indicator turns off.
      try {
        let stopped = 0
        recorder?.stream?.getTracks().forEach((t) => {
          try {
            t.stop()
            stopped++
          } catch {
            /* ignore */
          }
        })
        // eslint-disable-next-line no-console
        if (stopped) console.log(`[Lira voice] stopped ${stopped} MediaStream track(s)`)
      } catch {
        /* ignore */
      }
      // 2) Close both audio contexts (recorder + player). Browsers limit
      //    AudioContexts per page (~6) so leaking them eventually breaks
      //    repeated voice sessions.
      for (const ctx of [recorder?.context, player?.context]) {
        if (ctx && ctx.state !== 'closed') {
          try {
            await ctx.close()
          } catch {
            /* ignore */
          }
        }
      }
      // 3) Now ask the SDK to tear down the WebSocket and its own state.
      this.client.disconnect()
    } finally {
      this.client = null
      this.pendingBotText = ''
    }
  }

  /** Pipecat client's current transport state. */
  isConnected(): boolean {
    return this.client !== null
  }
}

/**
 * Feature flag used by the widget to decide whether to use Pipecat or the
 * legacy voice/chat WS code paths. Defaults to OFF so existing production
 * traffic is untouched. Opt in via any one of:
 *   • `?pipecat=1` URL query param (easiest for ad-hoc demos)
 *   • `window.__LIRA_USE_PIPECAT = true` set before the bubble is clicked
 *   • `data-use-pipecat="true"` on the widget script tag
 *
 * Once we cut over (Phase 4 of the migration plan) the flag is deleted
 * along with the legacy paths.
 */
export function isPipecatEnabled(): boolean {
  if (typeof window === 'undefined') return false
  // URL query param opt-in: ?pipecat=1 (or ?pipecat=true / ?pipecat=on).
  // Once set, we persist it on `window` so an in-page <a> navigation
  // away-and-back without the param keeps the flag for the session.
  const w = window as unknown as Record<string, unknown>
  try {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('pipecat')?.toLowerCase()
    if (v === '1' || v === 'true' || v === 'on') {
      w.__LIRA_USE_PIPECAT = true
      return true
    }
  } catch {
    /* malformed URL — fall through */
  }
  if (w.__LIRA_USE_PIPECAT === true) return true
  // Script-tag opt-in
  const scripts = document.querySelectorAll('script[data-use-pipecat]')
  for (const s of scripts) {
    const v = (s as HTMLScriptElement).dataset.usePipecat
    if (v === 'true' || v === '1') return true
  }
  return false
}

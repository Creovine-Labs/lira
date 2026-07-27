import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Microphone, X, PaperPlaneRight, DotsSixVertical } from '@phosphor-icons/react'
import { env } from '@/env'

/**
 * Landing-page voice concierge on Nova Sonic (Amazon speech-to-speech) — the
 * same low-latency, natural engine the product's support voice uses. A
 * center-bottom launcher opens a draggable panel; opening starts a live voice
 * call. Navigation is driven by intent in the visitor's live transcript (say
 * "show me pricing" → routes to /pricing). Typing falls back to the fast text
 * concierge endpoint.
 *
 * Voice protocol (wss …/support/chat/voice/:orgId): send 16 kHz mono PCM (mic);
 * receive 24 kHz PCM audio frames + JSON { type:'transcript'|'interruption'|
 * 'call_started'|'call_ended'|'error' }.
 */

const API = `${env.VITE_API_URL}/lira/v1`
const ORG = env.VITE_LIRA_PUBLIC_ORG_ID
const VOICE_WS = `${API.replace(/^http/, 'ws')}/support/chat/voice/${ORG}`

type Msg = { role: 'me' | 'lira'; text: string }
type Corner =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'

const SOFT_NAV =
  /^\/(pricing|features?|products?|contact|book-demo|blog|about(-us)?|resources|docs|security|for\/|careers|$)/

function esc(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string
  )
}
function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}
function renderMd(md: string): string {
  return esc(md)
    .split('\n')
    .map((l) => inline(l))
    .join('<br>')
}

// Map what the visitor SAYS to a page (voice-intent navigation).
function navFromText(text: string): string | null {
  const t = text.toLowerCase()
  if (/\b(pricing|price|prices|cost|costs|how much|plan|plans|subscription)\b/.test(t))
    return '/pricing'
  if (/\b(book|schedule|get|see)\b.*\bdemo\b|\bdemo\b.*\b(call|booking)\b/.test(t))
    return '/book-demo'
  if (/\bcontact|reach (you|someone)|talk to (a|someone|sales|human)|get in touch\b/.test(t))
    return '/contact'
  if (/\bfeature/.test(t)) return '/features'
  if (/\bsecurity|secure|compliance\b/.test(t)) return '/security'
  if (/\bblog\b/.test(t)) return '/blog'
  if (/\babout (you|lira|the company)\b/.test(t)) return '/about'
  if (/\bcareer|jobs?|hiring\b/.test(t)) return '/careers'
  if (
    /\b(home ?page|landing page|main page|back home|take me home|go home|the home page)\b/.test(t)
  )
    return '/'
  return null
}

// ── Audio helpers (ported from the working voice client) ─────────────────────
function downsampleToPcm16(float32: Float32Array, fromRate: number, toRate: number): Int16Array {
  const ratio = fromRate / toRate
  const length = Math.round(float32.length / ratio)
  const result = new Int16Array(length)
  for (let i = 0; i < length; i++) {
    const srcIdx = i * ratio
    const low = Math.floor(srcIdx)
    const high = Math.min(low + 1, float32.length - 1)
    const frac = srcIdx - low
    const s = float32[low] * (1 - frac) + float32[high] * frac
    const c = Math.max(-1, Math.min(1, s))
    result[i] = c < 0 ? c * 0x8000 : c * 0x7fff
  }
  return result
}

const WORKLET_CODE = `
  class PcmCaptureProcessor extends AudioWorkletProcessor {
    constructor(){ super(); this._b = new Float32Array(0); }
    process(inputs){
      const input = inputs[0];
      if (input && input[0] && input[0].length > 0){
        const nb = new Float32Array(this._b.length + input[0].length);
        nb.set(this._b); nb.set(input[0], this._b.length); this._b = nb;
        while (this._b.length >= 4096){ this.port.postMessage(this._b.slice(0,4096)); this._b = this._b.slice(4096); }
      }
      return true;
    }
  }
  registerProcessor('pcm-capture', PcmCaptureProcessor);`

export function LandingVoiceConcierge() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Tap to start talking')
  const [live, setLive] = useState(false)
  const [corner, setCorner] = useState<Corner>('bottom-center')
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

  const R = useRef({
    ws: null as WebSocket | null,
    micCtx: null as AudioContext | null,
    playCtx: null as AudioContext | null,
    worklet: null as AudioWorkletNode | null,
    micStream: null as MediaStream | null,
    nextPlayTime: 0,
    lastNav: '',
    history: [] as { role: string; content: string }[],
    visitorId: `web-${Math.random().toString(36).slice(2)}`,
  }).current

  const logRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, thinking])

  const pushMsg = useCallback((role: Msg['role'], text: string) => {
    setMessages((m) => [...m, { role, text }])
  }, [])

  const handleNavigate = useCallback(
    (url: string) => {
      if (!url || R.lastNav === url) return
      R.lastNav = url
      // Slide out of the way (bottom-right) whenever we route the visitor.
      setCorner('bottom-right')
      setDragPos(null)
      if (url.startsWith('/') && SOFT_NAV.test(url)) navigate(url)
      else if (url.startsWith('/')) window.location.assign(url)
      else window.open(url, '_blank', 'noopener')
    },
    [R, navigate]
  )

  const playPcm = useCallback(
    (buf: ArrayBuffer) => {
      const ctx = R.playCtx
      if (!ctx) return
      const byteLen = buf.byteLength & ~1
      if (byteLen === 0) return
      const int16 = new Int16Array(buf, 0, byteLen / 2)
      const f32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++)
        f32[i] = int16[i] < 0 ? int16[i] / 0x8000 : int16[i] / 0x7fff
      const buffer = ctx.createBuffer(1, f32.length, 24000)
      buffer.getChannelData(0).set(f32)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.connect(ctx.destination)
      const startAt = Math.max(ctx.currentTime + 0.25, R.nextPlayTime)
      src.start(startAt)
      R.nextPlayTime = startAt + buffer.duration
    },
    [R]
  )

  // ── Nova Sonic voice call ─────────────────────────────────────────────────
  const endCall = useCallback(() => {
    try {
      if (R.ws && R.ws.readyState === WebSocket.OPEN)
        R.ws.send(JSON.stringify({ action: 'end_call' }))
    } catch {
      /* noop */
    }
    try {
      R.ws?.close()
    } catch {
      /* noop */
    }
    try {
      R.worklet?.disconnect()
      R.micStream?.getTracks().forEach((t) => t.stop())
      R.micCtx?.close()
      R.playCtx?.close()
    } catch {
      /* noop */
    }
    R.ws = null
    R.worklet = null
    R.micStream = null
    R.micCtx = null
    R.playCtx = null
    R.nextPlayTime = 0
    setLive(false)
    setStatus('Tap the mic to talk again')
  }, [R])

  const startCall = useCallback(async () => {
    if (R.ws) return
    setStatus('Connecting…')
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      R.micStream = micStream
      const micCtx = new AudioContext()
      R.micCtx = micCtx
      const playCtx = new AudioContext({ sampleRate: 24000 })
      R.playCtx = playCtx
      await playCtx.resume().catch(() => {})
      const source = micCtx.createMediaStreamSource(micStream)
      const blobUrl = URL.createObjectURL(
        new Blob([WORKLET_CODE], { type: 'application/javascript' })
      )
      await micCtx.audioWorklet.addModule(blobUrl)
      URL.revokeObjectURL(blobUrl)
      const worklet = new AudioWorkletNode(micCtx, 'pcm-capture')
      R.worklet = worklet
      source.connect(worklet)

      const ws = new WebSocket(`${VOICE_WS}?visitorId=${encodeURIComponent(R.visitorId)}`)
      ws.binaryType = 'arraybuffer'
      R.ws = ws

      worklet.port.onmessage = (e: MessageEvent) => {
        if (!R.ws || R.ws.readyState !== WebSocket.OPEN) return
        const pcm16 = downsampleToPcm16(e.data as Float32Array, micCtx.sampleRate, 16000)
        R.ws.send(pcm16.buffer as ArrayBuffer)
      }

      ws.onopen = () => {
        setLive(true)
        setStatus('Listening — say or type something')
      }
      ws.onmessage = (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          playPcm(event.data)
          return
        }
        try {
          const msg = JSON.parse(event.data as string)
          if (msg.type === 'transcript' && msg.text) {
            const role = msg.role === 'customer' ? 'me' : 'lira'
            pushMsg(role, msg.text)
            if (role === 'me') {
              const target = navFromText(msg.text)
              if (target) handleNavigate(target)
            }
          } else if (msg.type === 'interruption') {
            R.nextPlayTime = 0 // barge-in: drop queued audio
          } else if (msg.type === 'call_ended') {
            endCall()
          } else if (msg.type === 'error') {
            setStatus('Voice error — tap to retry')
          }
        } catch {
          /* ignore */
        }
      }
      ws.onclose = () => {
        if (R.ws) endCall()
      }
      ws.onerror = () => setStatus('Connection error — tap to retry')
    } catch {
      setStatus('Allow the microphone to talk, or type below')
      endCall()
    }
  }, [R, playPcm, pushMsg, handleNavigate, endCall])

  // ── Typed fallback (fast text concierge) ──────────────────────────────────
  const askText = useCallback(
    async (text: string) => {
      const t = (text || '').trim()
      if (!t) return
      pushMsg('me', t)
      setThinking(true)
      R.history.push({ role: 'user', content: t })
      const ctrl = new AbortController()
      const to = setTimeout(() => ctrl.abort(), 20000)
      try {
        const r = await fetch(`${API}/voice-demo/concierge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: t, history: R.history.slice(-8) }),
          signal: ctrl.signal,
        })
        clearTimeout(to)
        const j = (await r.json()) as { say?: string; navigate?: string | null }
        setThinking(false)
        const say = (j.say || '').trim()
        if (say) {
          pushMsg('lira', say)
          R.history.push({ role: 'assistant', content: say })
        }
        if (j.navigate) {
          R.lastNav = '' // typed nav is explicit; always honor
          handleNavigate(j.navigate)
        }
      } catch {
        clearTimeout(to)
        setThinking(false)
        pushMsg('lira', 'Sorry, that took too long. Please try again.')
      }
    },
    [R, pushMsg, handleNavigate]
  )

  // ── Open / close ──────────────────────────────────────────────────────────
  const openPanel = useCallback(() => {
    setOpen(true)
    void startCall() // opening starts the live voice call
  }, [startCall])

  const closePanel = useCallback(() => {
    setOpen(false)
    endCall()
  }, [endCall])

  const onMicTap = useCallback(() => {
    if (live || R.ws) endCall()
    else void startCall()
  }, [R, live, startCall, endCall])

  useEffect(() => {
    return () => {
      try {
        R.ws?.close()
        R.micStream?.getTracks().forEach((t) => t.stop())
        R.micCtx?.close()
        R.playCtx?.close()
      } catch {
        /* noop */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Drag + magnetic corner snap ───────────────────────────────────────────
  const dragRef = useRef<{ gx: number; gy: number; w: number; h: number } | null>(null)
  const startDrag = useCallback((e: React.PointerEvent) => {
    const root = (e.currentTarget as HTMLElement).closest(
      '[data-concierge-root]'
    ) as HTMLElement | null
    if (!root) return
    const rect = root.getBoundingClientRect()
    dragRef.current = {
      gx: e.clientX - rect.left,
      gy: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    }
    setDragPos({ x: rect.left, y: rect.top })
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }, [])
  const moveDrag = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const x = Math.max(8, Math.min(window.innerWidth - d.w - 8, e.clientX - d.gx))
    const y = Math.max(8, Math.min(window.innerHeight - d.h - 8, e.clientY - d.gy))
    setDragPos({ x, y })
  }, [])
  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    // Snap to the nearest of 6 magnets: {top,bottom} × {left,center,right}.
    const third = window.innerWidth / 3
    const xzone = e.clientX < third ? 'left' : e.clientX > 2 * third ? 'right' : 'center'
    const vzone = e.clientY < window.innerHeight / 2 ? 'top' : 'bottom'
    setCorner(`${vzone}-${xzone}` as Corner)
    dragRef.current = null
    setDragPos(null)
  }, [])

  const posStyle: React.CSSProperties = (() => {
    if (dragPos) {
      return {
        left: dragPos.x,
        top: dragPos.y,
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
        transition: 'none',
      }
    }
    const isTop = corner.startsWith('top-')
    const v: React.CSSProperties = isTop ? { top: 24, bottom: 'auto' } : { bottom: 24, top: 'auto' }
    const h: React.CSSProperties = corner.endsWith('-left')
      ? { left: 16, right: 'auto', transform: 'none' }
      : corner.endsWith('-right')
        ? { right: 16, left: 'auto', transform: 'none' }
        : { left: '50%', right: 'auto', transform: 'translateX(-50%)' }
    return {
      ...v,
      ...h,
      transition: 'left .18s ease, right .18s ease, top .18s ease, bottom .18s ease',
    }
  })()

  const dragHandlers = { onPointerDown: startDrag, onPointerMove: moveDrag, onPointerUp: endDrag }

  return (
    <>
      {!open && (
        <div data-concierge-root className="fixed z-[900] flex items-center" style={posStyle}>
          <div className="flex items-center gap-1 rounded-full bg-[#111418] py-1.5 pl-1.5 pr-1 text-white shadow-2xl ring-1 ring-white/10">
            <button
              type="button"
              className="flex h-8 w-6 cursor-grab touch-none items-center justify-center text-white/40 hover:text-white/70 active:cursor-grabbing"
              aria-label="Move"
              {...dragHandlers}
            >
              <DotsSixVertical size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={openPanel}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/5"
              aria-label="Talk to Lira"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              Talk to Lira
              <Microphone size={17} weight="fill" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          data-concierge-root
          className="fixed z-[900] flex h-[400px] w-[480px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-3xl bg-white/20 shadow-2xl ring-1 ring-white/40 backdrop-blur-xl"
          style={posStyle}
        >
          <div
            className="flex touch-none items-center gap-2 bg-[#111418]/85 px-4 py-3 text-white backdrop-blur"
            {...dragHandlers}
            style={{ cursor: 'grab' }}
          >
            <DotsSixVertical size={16} className="opacity-50" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight">Lira</div>
              <div className="truncate text-[11px] text-white/60">{status}</div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={logRef} className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {messages.length === 0 && !thinking && (
              <div className="mt-8 flex flex-col items-center gap-1 text-center">
                <div className="text-[14px] font-semibold text-gray-700">
                  {live ? 'Say something to start' : 'Connecting…'}
                </div>
                {live && (
                  <div className="text-[12px] text-gray-500">
                    Talk to Lira, or type below. She's listening.
                  </div>
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'me' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'me' ? (
                  <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#111418] px-3.5 py-2 text-[14px] leading-relaxed text-white">
                    {m.text}
                  </div>
                ) : (
                  <div
                    className="max-w-[82%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[14px] leading-relaxed text-gray-900 ring-1 ring-black/5 [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: renderMd(m.text) }}
                  />
                )}
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-black/5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-white/30 bg-white/25 p-3 backdrop-blur">
            <button
              type="button"
              onClick={onMicTap}
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-white transition ${
                live ? 'animate-pulse bg-red-500' : 'bg-[#111418]'
              }`}
              aria-label={live ? 'Stop the call' : 'Start talking'}
            >
              <Microphone size={20} weight="fill" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void askText(input)
                  setInput('')
                }
              }}
              placeholder="Or type a message…"
              className="min-w-0 flex-1 rounded-full border border-white/50 bg-white/70 px-4 py-2.5 text-[14px] outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => {
                void askText(input)
                setInput('')
              }}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#111418] text-white"
              aria-label="Send"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

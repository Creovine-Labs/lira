import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Microphone, X, PaperPlaneRight, DotsSixVertical } from '@phosphor-icons/react'
import { env } from '@/env'

/**
 * Landing-page voice concierge — a center-bottom launcher that opens a
 * draggable panel (magnetically snaps to bottom-left / center / right).
 * Visitors talk or type; Lira answers in a neutral voice from the public
 * marketing org's KB and can actively navigate them to pages via the
 * lira_open_site_page tool → `navigate` WS message.
 *
 * The greeting is a fixed line, pre-generated on intent so it plays instantly
 * on open. Reuses the deployed voice endpoints (STT + neutral OpenAI TTS under
 * /lira/v1/voice-demo) and the support chat WS (anonymous visitor).
 */

const API = `${env.VITE_API_URL}/lira/v1`
const ORG = env.VITE_LIRA_PUBLIC_ORG_ID
const VOICE = 'openai:nova' // neutral, global English voice
const GREETING = 'Hi! How can I help you today?'
const SILENCE_MS = 900
const MIN_SPEECH_MS = 350
const RMS_THRESH = 0.03

type Msg = { role: 'me' | 'lira'; text: string }
type Corner = 'bottom-center' | 'bottom-left' | 'bottom-right'

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
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}
function renderMd(md: string): string {
  const lines = esc(md).split('\n')
  let html = ''
  let inList = false
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.*)$/)
    if (m) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      html += '<li>' + inline(m[1]) + '</li>'
    } else {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += (line.trim() ? inline(line) : '') + '<br>'
    }
  }
  if (inList) html += '</ul>'
  return html.replace(/(<br>)+$/, '')
}
function stripForSpeech(md: string): string {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[–—]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function LandingVoiceConcierge() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [streaming, setStreaming] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Tap the mic and just talk')
  const [micOn, setMicOn] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [corner, setCorner] = useState<Corner>('bottom-center')
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

  const R = useRef({
    ws: null as WebSocket | null,
    wsOpen: null as Promise<void> | null,
    micStream: null as MediaStream | null,
    audioCtx: null as AudioContext | null,
    analyser: null as AnalyserNode | null,
    recorder: null as MediaRecorder | null,
    chunks: [] as Blob[],
    recording: false,
    lastVoiceAt: 0,
    speechMs: 0,
    vadTimer: 0 as number | ReturnType<typeof setInterval>,
    busy: false,
    micReady: false,
    sessionOn: false,
    player: null as HTMLAudioElement | null,
    ttsQueue: [] as Promise<string | null>[],
    ttsPlaying: false,
    curText: '',
    pendingSpeech: '',
    replyDone: true,
    greeted: false,
    greetingUrl: null as Promise<string | null> | null,
    replyTimer: 0 as number | ReturnType<typeof setTimeout>,
    visitorId: `web-${Math.random().toString(36).slice(2)}`,
  }).current

  const logRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, streaming, thinking, suggestions])

  const pushMsg = useCallback((role: Msg['role'], text: string) => {
    setMessages((m) => [...m, { role, text }])
  }, [])

  // ── TTS queue (sentence streaming, prefetch = gapless) ────────────────────
  const fetchTts = useCallback((text: string) => {
    return fetch(
      `${API}/voice-demo/tts?id=${encodeURIComponent(VOICE)}&text=${encodeURIComponent(text)}`
    )
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null)
  }, [])

  const resumeListening = useCallback(() => {
    if (!R.micReady || !R.sessionOn) {
      setStatus('Tap the mic to talk, or type')
      return
    }
    setStatus('Listening… just talk')
  }, [R])

  // Never let the UI hang if a reply never lands (LLM/tool stall).
  const armReplyTimeout = useCallback(() => {
    clearTimeout(R.replyTimer as ReturnType<typeof setTimeout>)
    R.replyTimer = setTimeout(() => {
      setThinking(false)
      setStreaming(null)
      R.busy = false
      pushMsg('lira', 'Sorry, that took too long. Please try again.')
      resumeListening()
    }, 22000)
  }, [R, pushMsg, resumeListening])

  const playUrl = useCallback(
    (url: string | null) =>
      new Promise<void>((res) => {
        if (!url) return res()
        const a = new Audio(url)
        R.player = a
        a.onended = () => res()
        a.onerror = () => res()
        a.play().catch(() => res())
      }),
    [R]
  )

  const drainQueue = useCallback(async () => {
    R.ttsPlaying = true
    R.busy = true
    setSpeaking(true)
    setStatus('Lira is speaking…')
    while (R.ttsQueue.length) {
      const url = (await R.ttsQueue.shift()) ?? null
      await playUrl(url)
      if (url) {
        try {
          URL.revokeObjectURL(url)
        } catch {
          /* noop */
        }
      }
      R.player = null
    }
    R.ttsPlaying = false
    setSpeaking(false)
    if (R.replyDone) {
      R.busy = false
      resumeListening()
    }
  }, [R, playUrl, resumeListening])

  const enqueueSpeech = useCallback(
    (text: string) => {
      const t = stripForSpeech(text)
      if (!t) return
      R.ttsQueue.push(fetchTts(t))
      if (!R.ttsPlaying) void drainQueue()
    },
    [R, fetchTts, drainQueue]
  )

  const flushSentences = useCallback(
    (final: boolean) => {
      const re = /[^.!?]*[.!?]+[\s"')\]]*/g
      let m: RegExpExecArray | null
      let consumed = 0
      while ((m = re.exec(R.pendingSpeech)) !== null) {
        enqueueSpeech(m[0])
        consumed = re.lastIndex
      }
      R.pendingSpeech = R.pendingSpeech.slice(consumed)
      if (final && R.pendingSpeech.trim()) {
        enqueueSpeech(R.pendingSpeech)
        R.pendingSpeech = ''
      }
    },
    [R, enqueueSpeech]
  )

  // ── Navigation from the agent ─────────────────────────────────────────────
  const handleNavigate = useCallback(
    (url: string, target?: string) => {
      if (!url) return
      if (target === '_blank') return void window.open(url, '_blank', 'noopener')
      if (url.startsWith('/') && SOFT_NAV.test(url)) navigate(url)
      else if (url.startsWith('/')) window.location.assign(url)
      else window.open(url, '_blank', 'noopener')
    },
    [navigate]
  )

  // ── Chat WebSocket ────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (R.ws && (R.ws.readyState === 0 || R.ws.readyState === 1)) return R.wsOpen
    const url = `${API.replace(/^http/, 'ws')}/support/chat/ws/${ORG}?visitorId=${encodeURIComponent(
      R.visitorId
    )}&newCase=1`
    const ws = new WebSocket(url)
    R.ws = ws
    R.wsOpen = new Promise<void>((res) => {
      ws.onopen = () => res()
    })
    ws.onmessage = (ev) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(ev.data as string)
      } catch {
        return
      }
      switch (msg.type as string) {
        case 'welcome':
          // Greeting is played instantly client-side on open; ignore server one.
          break
        case 'reply_start':
          R.replyDone = false
          R.curText = ''
          R.pendingSpeech = ''
          setSuggestions([])
          setThinking(true)
          setStreaming('')
          armReplyTimeout()
          break
        case 'reply_chunk': {
          const b = (msg.body as string) || ''
          R.curText += b
          R.pendingSpeech += b
          setThinking(false)
          setStreaming(R.curText)
          flushSentences(false)
          armReplyTimeout()
          break
        }
        case 'reply_end': {
          clearTimeout(R.replyTimer as ReturnType<typeof setTimeout>)
          const t = (msg.body !== undefined ? (msg.body as string) : R.curText).trim()
          setThinking(false)
          setStreaming(null)
          if (t) pushMsg('lira', t)
          flushSentences(true)
          R.replyDone = true
          if (!R.ttsPlaying && R.ttsQueue.length === 0) {
            R.busy = false
            resumeListening()
          }
          break
        }
        case 'navigate':
          handleNavigate(msg.url as string, msg.target as string)
          break
        case 'suggestions':
          if (Array.isArray(msg.suggestions))
            setSuggestions((msg.suggestions as string[]).slice(0, 4))
          break
        case 'error':
          clearTimeout(R.replyTimer as ReturnType<typeof setTimeout>)
          setThinking(false)
          setStreaming(null)
          R.busy = false
          resumeListening()
          break
      }
    }
    ws.onclose = () => setStatus('Disconnected — reopen to restart')
    return R.wsOpen
  }, [R, pushMsg, flushSentences, resumeListening, handleNavigate, armReplyTimeout])

  const sendText = useCallback(
    async (text: string) => {
      const t = (text || '').trim()
      if (!t) return
      await connect()
      await R.wsOpen
      setSuggestions([])
      pushMsg('me', t)
      setThinking(true)
      R.busy = true
      setStatus('Lira is thinking…')
      try {
        R.ws?.send(JSON.stringify({ type: 'message', body: t }))
        armReplyTimeout()
      } catch {
        /* noop */
      }
    },
    [R, connect, pushMsg, armReplyTimeout]
  )

  // ── Mic + VAD ─────────────────────────────────────────────────────────────
  const rms = useCallback(() => {
    if (!R.analyser) return 0
    const buf = new Uint8Array(R.analyser.fftSize)
    R.analyser.getByteTimeDomainData(buf)
    let s = 0
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128
      s += v * v
    }
    return Math.sqrt(s / buf.length)
  }, [R])

  const finishTurn = useCallback(async () => {
    const blob = new Blob(R.chunks, { type: 'audio/webm' })
    R.chunks = []
    if (R.speechMs < MIN_SPEECH_MS || blob.size < 2000) {
      resumeListening()
      return
    }
    R.busy = true
    setStatus('Transcribing…')
    try {
      const r = await fetch(`${API}/voice-demo/stt`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/webm' },
        body: blob,
      })
      const j = (await r.json()) as { text?: string }
      const text = (j.text || '').trim()
      if (!text) {
        R.busy = false
        resumeListening()
        return
      }
      await connect()
      await R.wsOpen
      setSuggestions([])
      pushMsg('me', text)
      setThinking(true)
      setStatus('Lira is thinking…')
      R.ws?.send(JSON.stringify({ type: 'message', body: text }))
      armReplyTimeout()
    } catch {
      R.busy = false
      resumeListening()
    }
  }, [R, connect, pushMsg, resumeListening, armReplyTimeout])

  const startRecorder = useCallback(() => {
    if (!R.micStream) return
    R.chunks = []
    R.recording = true
    R.speechMs = 0
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const rec = new MediaRecorder(R.micStream, { mimeType: mime })
    R.recorder = rec
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) R.chunks.push(e.data)
    }
    rec.onstop = () => void finishTurn()
    rec.start()
    setStatus('Listening…')
  }, [R, finishTurn])

  const stopRecorder = useCallback(
    (discard: boolean) => {
      if (R.recorder && R.recorder.state !== 'inactive') {
        if (discard) R.recorder.onstop = null
        R.recorder.stop()
      }
      R.recording = false
    },
    [R]
  )

  const vadTick = useCallback(() => {
    if (!R.sessionOn || R.busy || !R.analyser) return
    const lvl = rms()
    if (!R.recording) {
      if (lvl > RMS_THRESH) {
        startRecorder()
        R.lastVoiceAt = performance.now()
      }
    } else if (lvl > RMS_THRESH) {
      R.lastVoiceAt = performance.now()
      R.speechMs += 60
    } else if (performance.now() - R.lastVoiceAt > SILENCE_MS) {
      stopRecorder(false)
    }
  }, [R, rms, startRecorder, stopRecorder])

  const startMic = useCallback(async () => {
    setStatus('Starting…')
    try {
      await connect()
      R.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      R.audioCtx = new Ctx()
      const src = R.audioCtx.createMediaStreamSource(R.micStream)
      R.analyser = R.audioCtx.createAnalyser()
      R.analyser.fftSize = 1024
      src.connect(R.analyser)
      R.micReady = true
      R.sessionOn = true
      setMicOn(true)
      if (!R.vadTimer) R.vadTimer = setInterval(vadTick, 60)
      resumeListening()
    } catch {
      setStatus('Allow the microphone to talk, or just type')
    }
  }, [R, connect, vadTick, resumeListening])

  // STOP everything (mic session off, kill any playback/recording). No pause.
  const stopAll = useCallback(() => {
    R.ttsQueue.length = 0
    R.ttsPlaying = false
    if (R.player) {
      try {
        R.player.pause()
      } catch {
        /* noop */
      }
      R.player = null
    }
    setSpeaking(false)
    if (R.recording) stopRecorder(true)
    R.busy = false
    R.sessionOn = false
    setMicOn(false)
    resumeListening()
  }, [R, stopRecorder, resumeListening])

  const onMicTap = useCallback(() => {
    if (!R.micReady) {
      void startMic()
      return
    }
    // Active in any way (listening / speaking / recording) → STOP.
    if (R.sessionOn || R.busy || R.ttsPlaying || R.recording) {
      stopAll()
    } else {
      R.sessionOn = true
      setMicOn(true)
      resumeListening()
    }
  }, [R, startMic, stopAll, resumeListening])

  // ── Open / close (instant greeting) ───────────────────────────────────────
  const prefetchGreeting = useCallback(() => {
    if (!R.greetingUrl) R.greetingUrl = fetchTts(GREETING)
  }, [R, fetchTts])

  const openPanel = useCallback(() => {
    setOpen(true)
    R.greeted = true
    void connect()
    // Play the pre-generated greeting immediately (user gesture → autoplay ok).
    ;(async () => {
      prefetchGreeting()
      pushMsg('lira', GREETING)
      R.busy = true
      setSpeaking(true)
      setStatus('…')
      const url = await R.greetingUrl
      await playUrl(url)
      R.player = null
      setSpeaking(false)
      R.busy = false
      resumeListening()
    })()
  }, [R, connect, prefetchGreeting, pushMsg, playUrl, resumeListening])

  const closePanel = useCallback(() => {
    setOpen(false)
    stopAll()
  }, [stopAll])

  useEffect(() => {
    return () => {
      if (R.vadTimer) clearInterval(R.vadTimer as ReturnType<typeof setInterval>)
      try {
        R.ws?.close()
        R.micStream?.getTracks().forEach((t) => t.stop())
        R.audioCtx?.close()
      } catch {
        /* noop */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Drag + magnetic corner snap (shared by launcher grip & panel header) ──
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
    const d = dragRef.current
    if (!d) return
    const cx = e.clientX
    const third = window.innerWidth / 3
    setCorner(cx < third ? 'bottom-left' : cx > 2 * third ? 'bottom-right' : 'bottom-center')
    dragRef.current = null
    setDragPos(null)
  }, [])

  const posStyle: React.CSSProperties = dragPos
    ? {
        left: dragPos.x,
        top: dragPos.y,
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
        transition: 'none',
      }
    : corner === 'bottom-left'
      ? {
          left: 16,
          bottom: 24,
          right: 'auto',
          transform: 'none',
          transition: 'left .18s ease, bottom .18s ease',
        }
      : corner === 'bottom-right'
        ? {
            right: 16,
            bottom: 24,
            left: 'auto',
            transform: 'none',
            transition: 'right .18s ease, bottom .18s ease',
          }
        : {
            left: '50%',
            bottom: 24,
            right: 'auto',
            transform: 'translateX(-50%)',
            transition: 'left .18s ease',
          }

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
              onPointerEnter={prefetchGreeting}
              onPointerDown={prefetchGreeting}
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
          className="fixed z-[900] flex h-[540px] w-[380px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
          style={posStyle}
        >
          <div
            className="flex touch-none items-center gap-2 bg-[#111418] px-3 py-3 text-white"
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

          <div ref={logRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#f6f7f9] p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'me' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'me' ? (
                  <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#111418] px-3.5 py-2 text-[14px] leading-relaxed text-white">
                    {m.text}
                  </div>
                ) : (
                  <div
                    className="max-w-[82%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[14px] leading-relaxed text-gray-900 ring-1 ring-black/5 [&_a]:underline [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_li]:ml-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: renderMd(m.text) }}
                  />
                )}
              </div>
            ))}
            {streaming !== null && (
              <div className="flex justify-start">
                <div
                  className="max-w-[82%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[14px] leading-relaxed text-gray-900 ring-1 ring-black/5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: renderMd(streaming || '…') }}
                />
              </div>
            )}
            {thinking && streaming === null && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-black/5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void sendText(s)}
                    className="rounded-full border border-[#111418]/20 bg-white px-3 py-1.5 text-[13px] font-medium text-[#111418] hover:bg-gray-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-black/5 bg-white p-3">
            <button
              type="button"
              onClick={onMicTap}
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-white transition ${
                speaking ? 'bg-emerald-600' : micOn ? 'animate-pulse bg-red-500' : 'bg-[#111418]'
              }`}
              aria-label={micOn || speaking ? 'Stop' : 'Talk'}
            >
              <Microphone size={20} weight="fill" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void sendText(input)
                  setInput('')
                }
              }}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-[14px] outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => {
                void sendText(input)
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

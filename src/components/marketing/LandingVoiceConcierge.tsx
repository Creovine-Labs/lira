import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Microphone, X, PaperPlaneRight, DotsSixVertical } from '@phosphor-icons/react'
import { env } from '@/env'

/**
 * Landing-page voice concierge — a Cartesia-style center-bottom launcher that
 * opens a draggable panel. Visitors talk or type; Lira answers in a neutral
 * voice using the public marketing org's knowledge base and can actively
 * navigate them to pages (e.g. "what's your pricing" → routes to /pricing via
 * the lira_open_site_page tool → `navigate` WS message).
 *
 * Reuses the deployed voice endpoints: STT (Deepgram) + TTS (neutral OpenAI
 * voice) under /lira/v1/voice-demo, and the support chat WS (anonymous visitor).
 */

const API = `${env.VITE_API_URL}/lira/v1`
const ORG = env.VITE_LIRA_PUBLIC_ORG_ID
const VOICE = 'openai:nova' // neutral, global English voice
const SILENCE_MS = 900
const MIN_SPEECH_MS = 350
const RMS_THRESH = 0.03

type Msg = { role: 'me' | 'lira'; text: string }

// Marketing paths the concierge may soft-navigate to (same-host). Anything else
// falls back to a full-page navigation.
const SOFT_NAV =
  /^\/(pricing|features?|products?|contact|book-demo|blog|about(-us)?|resources|docs|security|for\/|careers|$)/

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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null) // null = bottom-center

  // Mutable voice-loop state (avoids re-renders).
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

  const drainQueue = useCallback(async () => {
    R.ttsPlaying = true
    R.busy = true
    setSpeaking(true)
    setStatus('Lira is speaking…')
    while (R.ttsQueue.length) {
      const url = await R.ttsQueue.shift()
      if (url) {
        await new Promise<void>((res) => {
          const a = new Audio(url)
          R.player = a
          a.onended = () => res()
          a.onerror = () => res()
          a.play().catch(() => res())
        })
        try {
          URL.revokeObjectURL(url)
        } catch {
          /* noop */
        }
        R.player = null
      }
    }
    R.ttsPlaying = false
    setSpeaking(false)
    if (R.replyDone) {
      R.busy = false
      resumeListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const resumeListening = useCallback(() => {
    if (!R.micReady) {
      setStatus('Type a message, or tap the mic to talk')
      return
    }
    if (!R.sessionOn) {
      setStatus('Paused — tap the mic')
      return
    }
    setStatus('Listening… just talk')
  }, [R])

  // ── Navigation from the agent ─────────────────────────────────────────────
  const handleNavigate = useCallback(
    (url: string, target?: string) => {
      if (!url) return
      if (target === '_blank') {
        window.open(url, '_blank', 'noopener')
        return
      }
      if (url.startsWith('/') && SOFT_NAV.test(url)) {
        navigate(url)
      } else if (url.startsWith('/')) {
        window.location.assign(url) // cross-host (app pages) — let host routing handle it
      } else {
        window.open(url, '_blank', 'noopener')
      }
    },
    [navigate]
  )

  // ── Chat WebSocket ────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (R.ws && (R.ws.readyState === 0 || R.ws.readyState === 1)) return R.wsOpen
    const wsBase = API.replace(/^http/, 'ws')
    const url = `${wsBase}/support/chat/ws/${ORG}?visitorId=${encodeURIComponent(R.visitorId)}&newCase=1`
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
      const type = msg.type as string
      switch (type) {
        case 'welcome': {
          const body =
            (msg.body as string) ||
            'Hi, I’m Lira. Ask me anything, or tell me where you’d like to go.'
          if (!R.greeted) {
            R.greeted = true
            pushMsg('lira', body)
            R.replyDone = true
            enqueueSpeech(body)
          }
          break
        }
        case 'reply_start':
          R.replyDone = false
          R.curText = ''
          R.pendingSpeech = ''
          setSuggestions([])
          setThinking(true)
          setStreaming('')
          break
        case 'reply_chunk': {
          const b = (msg.body as string) || ''
          R.curText += b
          R.pendingSpeech += b
          setThinking(false)
          setStreaming(R.curText)
          flushSentences(false)
          break
        }
        case 'reply_end': {
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
          setThinking(false)
          setStreaming(null)
          R.busy = false
          resumeListening()
          break
      }
    }
    ws.onclose = () => setStatus('Disconnected — reopen to restart')
    return R.wsOpen
  }, [R, pushMsg, enqueueSpeech, flushSentences, resumeListening, handleNavigate])

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
      } catch {
        /* noop */
      }
    },
    [R, connect, pushMsg]
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
    } catch {
      R.busy = false
      resumeListening()
    }
  }, [R, connect, pushMsg, resumeListening])

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
    } else {
      if (lvl > RMS_THRESH) {
        R.lastVoiceAt = performance.now()
        R.speechMs += 60
      } else if (performance.now() - R.lastVoiceAt > SILENCE_MS) {
        stopRecorder(false)
      }
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

  const stopEverything = useCallback(
    (keepListening: boolean) => {
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
      R.sessionOn = keepListening
      setMicOn(keepListening && R.micReady)
      resumeListening()
    },
    [R, stopRecorder, resumeListening]
  )

  const onMicTap = useCallback(() => {
    if (!R.micReady) {
      void startMic()
      return
    }
    if (R.busy || R.ttsPlaying) {
      stopEverything(true) // interrupt Lira, keep listening
    } else if (R.sessionOn) {
      R.sessionOn = false
      if (R.recording) stopRecorder(true)
      setMicOn(false)
      resumeListening()
    } else {
      R.sessionOn = true
      setMicOn(true)
      resumeListening()
    }
  }, [R, startMic, stopEverything, stopRecorder, resumeListening])

  // ── Open / close ──────────────────────────────────────────────────────────
  const openPanel = useCallback(() => {
    setOpen(true)
    void connect() // greeting arrives via welcome and auto-speaks (user gesture = autoplay ok)
  }, [connect])

  const closePanel = useCallback(() => {
    setOpen(false)
    stopEverything(false)
    R.sessionOn = false
    setMicOn(false)
  }, [R, stopEverything])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (R.vadTimer) clearInterval(R.vadTimer as ReturnType<typeof setInterval>)
      try {
        R.ws?.close()
      } catch {
        /* noop */
      }
      try {
        R.micStream?.getTracks().forEach((t) => t.stop())
        R.audioCtx?.close()
      } catch {
        /* noop */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Drag (move the panel to any corner) ───────────────────────────────────
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      const start = pos ?? { x: window.innerWidth / 2 - 190, y: window.innerHeight - 560 }
      dragRef.current = { dx: e.clientX - start.x, dy: e.clientY - start.y }
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [pos]
  )
  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const x = Math.max(8, Math.min(window.innerWidth - 388, e.clientX - dragRef.current.dx))
    const y = Math.max(8, Math.min(window.innerHeight - 120, e.clientY - dragRef.current.dy))
    setPos({ x, y })
  }, [])
  const onDragEnd = useCallback(() => {
    dragRef.current = null
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, bottom: 'auto' }
    : { left: '50%', bottom: 24, transform: 'translateX(-50%)' }

  return (
    <div className="lira-concierge">
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          className="fixed bottom-6 left-1/2 z-[900] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-[#111418] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10 transition hover:bg-[#1c2127]"
          aria-label="Talk to Lira"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          Talk to Lira
          <Microphone size={17} weight="fill" />
        </button>
      )}

      {open && (
        <div
          className="fixed z-[900] flex h-[540px] w-[380px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
          style={panelStyle}
        >
          {/* header / drag handle */}
          <div
            className="flex cursor-grab items-center gap-2 bg-[#111418] px-4 py-3 text-white active:cursor-grabbing"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
          >
            <DotsSixVertical size={16} className="opacity-50" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight">Lira</div>
              <div className="truncate text-[11px] text-white/60">{status}</div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* transcript */}
          <div ref={logRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#f6f7f9] p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
                    m.role === 'me'
                      ? 'rounded-br-md bg-[#111418] text-white'
                      : 'rounded-bl-md bg-white text-gray-900 ring-1 ring-black/5'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {streaming !== null && (
              <div className="flex justify-start">
                <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[14px] leading-relaxed text-gray-900 ring-1 ring-black/5">
                  {streaming || '…'}
                </div>
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

          {/* controls */}
          <div className="flex items-center gap-2 border-t border-black/5 bg-white p-3">
            <button
              type="button"
              onClick={onMicTap}
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-white transition ${
                speaking ? 'bg-emerald-600' : micOn ? 'animate-pulse bg-red-500' : 'bg-[#111418]'
              }`}
              aria-label="Talk"
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
    </div>
  )
}

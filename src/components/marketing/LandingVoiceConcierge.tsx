import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Microphone, X, PaperPlaneRight, DotsSixVertical } from '@phosphor-icons/react'
import { env } from '@/env'

/**
 * Landing-page voice concierge — a center-bottom launcher that opens a
 * draggable panel (magnetically snaps to bottom-left / center / right).
 * Visitors talk or type; Lira answers in a neutral voice and can navigate them
 * to pages.
 *
 * Uses the fast single-call concierge endpoint (`/lira/v1/voice-demo/concierge`,
 * gpt-4o-mini, facts + sitemap in the prompt → { say, navigate } in ~1-2s) plus
 * STT + neutral OpenAI TTS. The greeting is a fixed line pre-generated on intent
 * so it plays instantly on open.
 */

const API = `${env.VITE_API_URL}/lira/v1`
const VOICE = 'openai:nova'
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
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Tap the mic and just talk')
  const [micOn, setMicOn] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [corner, setCorner] = useState<Corner>('bottom-center')
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

  const R = useRef({
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
    greetingUrl: null as Promise<string | null> | null,
    history: [] as { role: string; content: string }[],
  }).current

  const logRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, thinking])

  const pushMsg = useCallback((role: Msg['role'], text: string) => {
    setMessages((m) => [...m, { role, text }])
  }, [])

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
    R.busy = false
    resumeListening()
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

  const handleNavigate = useCallback(
    (url: string) => {
      if (!url) return
      if (url.startsWith('/') && SOFT_NAV.test(url)) navigate(url)
      else if (url.startsWith('/')) window.location.assign(url)
      else window.open(url, '_blank', 'noopener')
    },
    [navigate]
  )

  // ── Ask Lira (fast single-call endpoint) ──────────────────────────────────
  const askLira = useCallback(
    async (text: string) => {
      const t = (text || '').trim()
      if (!t) return
      pushMsg('me', t)
      setThinking(true)
      R.busy = true
      setStatus('Lira is thinking…')
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
          enqueueSpeech(say)
        }
        if (j.navigate) handleNavigate(j.navigate)
        if (!R.ttsPlaying && R.ttsQueue.length === 0) {
          R.busy = false
          resumeListening()
        }
      } catch {
        clearTimeout(to)
        setThinking(false)
        R.busy = false
        pushMsg('lira', 'Sorry, that took too long. Please try again.')
        resumeListening()
      }
    },
    [R, pushMsg, enqueueSpeech, handleNavigate, resumeListening]
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
      void askLira(text)
    } catch {
      R.busy = false
      resumeListening()
    }
  }, [R, askLira, resumeListening])

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
  }, [R, vadTick, resumeListening])

  // STOP = full teardown so the browser's mic/recording indicator actually
  // turns off (nothing is listening). Re-tapping re-acquires the mic.
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
    if (R.vadTimer) {
      clearInterval(R.vadTimer as ReturnType<typeof setInterval>)
      R.vadTimer = 0
    }
    try {
      R.micStream?.getTracks().forEach((t) => t.stop())
      R.audioCtx?.close()
    } catch {
      /* noop */
    }
    R.micStream = null
    R.audioCtx = null
    R.analyser = null
    R.busy = false
    R.sessionOn = false
    R.micReady = false
    setMicOn(false)
    setStatus('Tap the mic to talk, or type')
  }, [R, stopRecorder])

  const onMicTap = useCallback(() => {
    if (R.micReady) stopAll()
    else void startMic()
  }, [R, startMic, stopAll])

  // ── Open / close (instant greeting) ───────────────────────────────────────
  const prefetchGreeting = useCallback(() => {
    if (!R.greetingUrl) R.greetingUrl = fetchTts(GREETING)
  }, [R, fetchTts])

  const openPanel = useCallback(() => {
    setOpen(true)
    void startMic() // opening the panel starts the conversation → mic on, listening
    ;(async () => {
      prefetchGreeting()
      pushMsg('lira', GREETING)
      R.history.push({ role: 'assistant', content: GREETING })
      R.busy = true // gate VAD so we don't record the greeting itself
      setSpeaking(true)
      setStatus('…')
      const url = await R.greetingUrl
      await playUrl(url)
      R.player = null
      setSpeaking(false)
      R.busy = false
      resumeListening()
    })()
  }, [R, startMic, prefetchGreeting, pushMsg, playUrl, resumeListening])

  const closePanel = useCallback(() => {
    setOpen(false)
    stopAll()
  }, [stopAll])

  useEffect(() => {
    return () => {
      if (R.vadTimer) clearInterval(R.vadTimer as ReturnType<typeof setInterval>)
      try {
        R.micStream?.getTracks().forEach((t) => t.stop())
        R.audioCtx?.close()
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
    const third = window.innerWidth / 3
    setCorner(
      e.clientX < third ? 'bottom-left' : e.clientX > 2 * third ? 'bottom-right' : 'bottom-center'
    )
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
                  void askLira(input)
                  setInput('')
                }
              }}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-[14px] outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => {
                void askLira(input)
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

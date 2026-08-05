import { useCallback, useEffect, useRef, useState } from 'react'

import { voiceTrialApi, type VoiceTrialStatus } from '@/services/api'

// The proven Amber/LiraCall engine (ElevenLabs Nigerian voice), embedded as a
// hidden iframe and driven over postMessage. It is org-scoped to the demo
// restaurant "Amber", so the trial lets a user hear + talk to a real sample AI
// in the Nigerian voice.
const ENGINE_URL = 'https://widget.liraintelligence.com/amber-engine-v1.html'

const fmt = (sec: number) =>
  `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`

type Phase = 'loading' | 'ready' | 'exhausted' | 'connecting' | 'live' | 'ended' | 'error'

export function NigerianVoiceTrialCard() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [status, setStatus] = useState<VoiceTrialStatus | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [speaking, setSpeaking] = useState(false)

  const cardRef = useRef<HTMLElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const startMsRef = useRef(0) // when the call actually connected
  const lastConsumedRef = useRef(0) // seconds already reported to the meter
  const allowanceRef = useRef(0) // seconds available when this call began

  const post = (type: string) =>
    iframeRef.current?.contentWindow?.postMessage({ source: 'lira-call', type, payload: {} }, '*')

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const refreshStatus = useCallback(async (): Promise<VoiceTrialStatus | null> => {
    try {
      const s = await voiceTrialApi.status()
      setStatus(s)
      return s
    } catch {
      return null
    }
  }, [])

  const consume = useCallback(async (seconds: number) => {
    if (seconds <= 0) return
    try {
      setStatus(await voiceTrialApi.consume(seconds))
    } catch {
      /* best-effort metering */
    }
  }, [])

  const stopCall = useCallback(
    async (finalPhase: Phase = 'ended') => {
      clearTimer()
      post('disconnect')
      const elapsed = startMsRef.current ? Math.round((Date.now() - startMsRef.current) / 1000) : 0
      const tail = Math.max(0, elapsed - lastConsumedRef.current)
      lastConsumedRef.current = elapsed
      startMsRef.current = 0
      setSpeaking(false)
      setPhase(finalPhase)
      await consume(tail)
      const s = await refreshStatus()
      if (s) {
        setRemaining(s.remaining)
        if (s.exhausted && finalPhase !== 'error') setPhase('exhausted')
      }
    },
    [consume, refreshStatus]
  )

  // Initial load.
  useEffect(() => {
    void (async () => {
      const s = await refreshStatus()
      if (!s) return setPhase('error')
      setRemaining(s.remaining)
      setPhase(s.exhausted ? 'exhausted' : 'ready')
    })()
  }, [refreshStatus])

  // One-time message bridge from the engine iframe.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { source?: string; type?: string } | null
      if (!d || d.source !== 'amber-engine') return
      if (d.type === 'ready') {
        post('connect') // engine finished loading → start the call
      } else if (d.type === 'connected') {
        if (startMsRef.current) return // already counting
        startMsRef.current = Date.now()
        lastConsumedRef.current = 0
        setPhase('live')
        timerRef.current = window.setInterval(() => {
          const elapsed = Math.round((Date.now() - startMsRef.current) / 1000)
          const left = Math.max(0, allowanceRef.current - elapsed)
          setRemaining(left)
          if (elapsed - lastConsumedRef.current >= 15) {
            const chunk = elapsed - lastConsumedRef.current
            lastConsumedRef.current = elapsed
            void consume(chunk)
          }
          if (left <= 0) void stopCall('exhausted')
        }, 1000)
      } else if (d.type === 'bot-started-speaking') {
        setSpeaking(true)
      } else if (d.type === 'bot-stopped-speaking') {
        setSpeaking(false)
      } else if (d.type === 'closed') {
        void stopCall('ended')
      }
    }
    window.addEventListener('message', onMsg)
    return () => {
      window.removeEventListener('message', onMsg)
      clearTimer()
    }
  }, [consume, stopCall])

  const start = useCallback(async () => {
    try {
      const r = await voiceTrialApi.canStart()
      setStatus(r.status)
      setRemaining(r.status.remaining)
      if (!r.allowed) {
        setPhase('exhausted')
        return
      }
      allowanceRef.current = r.status.remaining
    } catch {
      setPhase('error')
      return
    }
    startMsRef.current = 0
    lastConsumedRef.current = 0
    setPhase('connecting') // renders the iframe → 'ready' → 'connect'
  }, [])

  // The dashboard AI can open + start the trial in one tap: it calls the
  // `lira_open_nigerian_voice` tool → the widget dispatches this event.
  useEffect(() => {
    const onAction = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type?: string } | undefined
      if (detail?.type !== 'open_nigerian_voice') return
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      void start()
    }
    window.addEventListener('lira-demo-action', onAction)
    return () => window.removeEventListener('lira-demo-action', onAction)
  }, [start])

  const inCall = phase === 'connecting' || phase === 'live'

  return (
    <section
      ref={cardRef}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#0d1512] p-6 text-white shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          New
        </span>
        <h3 className="text-lg font-bold">Hear Lira in a Nigerian voice</h3>
      </div>

      {phase === 'loading' && <p className="text-sm text-white/50">Loading your free trial…</p>}

      {phase === 'error' && (
        <div className="text-sm text-white/70">
          Couldn&apos;t load the trial.{' '}
          <button
            onClick={() => void refreshStatus().then(() => setPhase('ready'))}
            className="text-emerald-400 underline"
          >
            Retry
          </button>
        </div>
      )}

      {(phase === 'ready' || phase === 'ended') && (
        <>
          <p className="mb-4 text-sm leading-relaxed text-white/70">
            Talk to a live sample assistant (Amber, a Lagos restaurant) in our natural Nigerian
            voice.
            {status ? (
              <>
                {' '}
                You have <b className="text-white">{fmt(status.remaining)}</b> of free trial left.
              </>
            ) : null}
          </p>
          <button
            onClick={() => void start()}
            disabled={!!status && status.remaining <= 0}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#04140d] transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {phase === 'ended' ? 'Call again' : 'Start the call'}
          </button>
        </>
      )}

      {phase === 'exhausted' && (
        <p className="text-sm leading-relaxed text-white/70">
          You&apos;ve used your free Nigerian-voice trial. The Nigerian and custom voices are part
          of our paid plans — reach out or upgrade to keep using them for your own AI.
        </p>
      )}

      {inCall && (
        <div className="flex items-center gap-4">
          <div
            className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-emerald-600 text-xl font-black text-[#04140d] transition ${
              speaking ? 'ring-4 ring-emerald-400/60' : ''
            }`}
          >
            A
          </div>
          <div className="flex-1">
            <div className="font-semibold">Amber · Nigerian voice</div>
            <div className="text-sm text-white/60">
              {phase === 'connecting' ? 'Connecting…' : `Live · ${fmt(remaining)} left`}
            </div>
          </div>
          <button
            onClick={() => void stopCall('ended')}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
          >
            End
          </button>
          <iframe
            ref={iframeRef}
            src={ENGINE_URL}
            title="Nigerian voice engine"
            allow="microphone; autoplay"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0.01,
              border: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}
    </section>
  )
}

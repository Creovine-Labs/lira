import { useCallback, useEffect, useRef, useState } from 'react'

import { buildWsUrl, createMeeting as apiCreateMeeting } from '@/services/api'
import type { MeetingSettings } from '@/services/api'
import { useAuthStore, useMeetingStore } from '@/app/store'
import {
  startCapture,
  stopCapture,
  getMicLevel,
  initPlayback,
  playPcmChunk,
  resetPlayback,
  flushPlayback,
  destroyPlayback,
} from '@/lib/audio'

type SessionPhase = 'idle' | 'connecting' | 'joined' | 'live' | 'error'

/**
 * useAudioMeeting — full lifecycle hook for a Lira voice meeting.
 *
 * Uses the backend's native protocol:
 *   - JSON text frames with `{ action, session_id?, payload }`
 *   - Binary frames for PCM audio (16 kHz send, 24 kHz receive)
 */
export function useAudioMeeting() {
  const { token, userEmail, userName } = useAuthStore()
  const store = useMeetingStore()

  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const micActiveRef = useRef(false)
  /** When true, drop incoming binary audio (user interrupted the AI). */
  const audioMutedRef = useRef(false)

  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [micOn, setMicOn] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastTaskCreated, setLastTaskCreated] = useState<{
    task_id: string
    title: string
    org_id: string
  } | null>(null)

  // Mic level polling
  const levelIntervalRef = useRef<number | undefined>(undefined)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cleanup() {
    stopMic()
    if (wsRef.current) {
      wsRef.current.close(1000, 'unmount')
      wsRef.current = null
    }
    destroyPlayback()
    store.clearMeeting()
  }

  // ── Send JSON message with backend envelope ────────────────────────────────

  function sendAction(action: string, payload: Record<string, unknown> = {}) {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const msg: Record<string, unknown> = { action, payload }
    if (sessionIdRef.current) {
      msg.session_id = sessionIdRef.current
    }
    ws.send(JSON.stringify(msg))
  }

  // ── Start Meeting ──────────────────────────────────────────────────────────

  const startMeeting = useCallback(
    async (title: string, settings?: MeetingSettings, orgId?: string) => {
      if (!token) throw new Error('Not signed in')
      setPhase('connecting')
      setError(null)

      // 1. REST: Create meeting
      const meeting = await apiCreateMeeting(title, settings)
      store.setMeeting(meeting.session_id, meeting.title)
      store.clearTranscript()
      sessionIdRef.current = meeting.session_id

      // 2. Open raw WebSocket
      const wsUrl = buildWsUrl({ token })
      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        store.setConnected(true)
        // 3. Send join
        const userId = userEmail ?? 'user'
        sendAction('join', {
          user_id: userId,
          user_name: userName ?? userEmail ?? 'User',
          session_id: meeting.session_id,
          settings: settings ?? {},
          ...(orgId ? { org_id: orgId } : {}),
        })
      }

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Drop audio if the user interrupted the AI
          if (audioMutedRef.current) return
          // Binary: AI audio playback
          playPcmChunk(event.data)
          return
        }

        // JSON text frame
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string
            [key: string]: unknown
          }
          handleServerMessage(msg)
        } catch {
          console.warn('[Lira WS] Non-JSON message', event.data)
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        setPhase('error')
      }

      ws.onclose = (e) => {
        store.setConnected(false)
        if (!e.wasClean && phase !== 'idle') {
          setError(`Connection lost (code ${e.code})`)
          setPhase('error')
        }
      }

      // Init playback context (needs user gesture — we're in a click handler)
      initPlayback()

      return meeting
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, userEmail, userName]
  )

  // ── Handle inbound server messages ─────────────────────────────────────────

  function handleServerMessage(msg: Record<string, unknown>) {
    const type = msg.type as string

    switch (type) {
      case 'joined': {
        setPhase('joined')
        // Update session id from server (if different)
        if (msg.session_id) {
          sessionIdRef.current = msg.session_id as string
        }
        break
      }

      case 'transcript': {
        // Server sends transcript inside payload: { speaker, text, is_ai, timestamp, ... }
        const p = (msg.payload as Record<string, unknown>) ?? {}
        const isAiMsg = p.is_ai === true
        const speaker = (p.speaker as string) ?? (isAiMsg ? 'AI' : 'You')
        const text = (p.text as string) ?? ''
        if (!text.trim()) break
        store.addTranscriptLine({
          speaker,
          text,
          isFinal: true,
          isAi: isAiMsg,
          at: (p.timestamp as string) ?? new Date().toISOString(),
        })
        if (isAiMsg) {
          audioMutedRef.current = false // AI is speaking again — accept audio
          store.setAiStatus('speaking')
          store.setLastAiResponse(text)
        }
        break
      }

      case 'ai_response': {
        const p = (msg.payload as Record<string, unknown>) ?? {}
        const text = (p.text as string) ?? ''
        audioMutedRef.current = false // New AI response — accept audio
        store.setLastAiResponse(text)
        store.setAiStatus('speaking')
        break
      }

      case 'ai_response_end': {
        store.setAiStatus('listening')
        resetPlayback()
        break
      }

      case 'interruption': {
        // User barged in — immediately stop all queued AI audio
        audioMutedRef.current = true
        flushPlayback()
        store.setAiStatus('listening')
        console.info('[Lira] Barge-in: stopped AI audio playback')
        break
      }

      case 'audio_ready': {
        const p = (msg.payload as Record<string, unknown>) ?? {}
        console.info('[Lira] Recording available:', p.audio_url)
        break
      }

      case 'participant_event': {
        console.info('[Lira] Participant event:', msg)
        break
      }

      case 'settings_updated': {
        console.info('[Lira] Settings updated:', msg)
        break
      }

      case 'task_created': {
        const p = (msg.payload as Record<string, unknown>) ?? {}
        const task = {
          task_id: (p.task_id as string) ?? '',
          title: (p.title as string) ?? 'New task',
          org_id: (p.org_id as string) ?? '',
        }
        setLastTaskCreated(task)
        setTimeout(() => setLastTaskCreated(null), 4000)
        break
      }

      case 'error': {
        const p = (msg.payload as Record<string, unknown>) ?? {}
        const errMsg = (p.message as string) ?? 'Unknown server error'
        console.error('[Lira WS Error]', errMsg)
        setError(errMsg)
        break
      }

      default:
        console.info('[Lira WS] Unhandled message type:', type, msg)
    }
  }

  // ── Mic control ────────────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    if (micActiveRef.current) {
      stopMic()
    } else {
      await startMic()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startMic() {
    try {
      // Start browser mic capture first (requests permission)
      await startCapture((pcmBuffer) => {
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(pcmBuffer)
        }
      })

      // Only after mic is granted, tell backend to open Nova Sonic stream
      sendAction('audio_start', {})
      setPhase('live')
      store.setAiStatus('listening')

      micActiveRef.current = true
      setMicOn(true)

      // Start polling mic level for visualisation
      levelIntervalRef.current = window.setInterval(() => {
        setMicLevel(getMicLevel())
      }, 50)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setError(msg)
      console.error('[Lira Mic]', err)
    }
  }

  function stopMic() {
    if (levelIntervalRef.current) {
      window.clearInterval(levelIntervalRef.current)
      levelIntervalRef.current = undefined
    }

    stopCapture()
    micActiveRef.current = false
    setMicOn(false)
    setMicLevel(0)

    // Tell backend to close Nova Sonic stream
    sendAction('audio_stop', {})
  }

  // ── Send text (fallback for non-mic usage) ────────────────────────────────

  const sendText = useCallback((text: string) => {
    sendAction('text', { text })
  }, [])

  // ── End Meeting ────────────────────────────────────────────────────────────

  const endMeeting = useCallback(() => {
    stopMic()
    sendAction('leave', {})

    if (wsRef.current) {
      wsRef.current.close(1000, 'meeting_ended')
      wsRef.current = null
    }

    destroyPlayback()
    sessionIdRef.current = null
    setPhase('idle')
    store.clearMeeting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // State
    phase,
    micOn,
    micLevel,
    error,
    lastTaskCreated,
    // Meeting store
    meetingId: store.meetingId,
    meetingTitle: store.meetingTitle,
    isConnected: store.isConnected,
    aiStatus: store.aiStatus,
    transcript: store.transcript,
    lastAiResponse: store.lastAiResponse,
    // Actions
    startMeeting,
    endMeeting,
    toggleMic,
    sendText,
    isReady: Boolean(token),
  }
}

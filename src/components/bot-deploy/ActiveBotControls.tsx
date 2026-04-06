import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChatBubbleLeftEllipsisIcon,
  RadioIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useBotStore } from '@/app/store'
import {
  getBotStatus,
  listActiveBots,
  muteBotApi,
  unmuteBotApi,
  terminateBot,
  triggerBotSpeakApi,
} from '@/services/api'
import { cn } from '@/lib'

/**
 * Shared active-bot controls: mute/unmute, speak, end.
 * Renders nothing when no bot is active.
 * Restores state from backend on mount (survives page refresh).
 */
function ActiveBotControls({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { botId, botState, platform, setBotDeployed, setBotState, setBotError, clearBot } =
    useBotStore()

  const [isMuted, setIsMuted] = useState(true)
  const [muteLoading, setMuteLoading] = useState(false)
  const [speakLoading, setSpeakLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling ────────────────────────────────────────────────────────────────

  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const status = await getBotStatus(id)
          setBotState(status.state)
          if (status.is_muted !== undefined) setIsMuted(status.is_muted)
          if (status.state === 'terminated' || status.state === 'error') {
            if (status.error) setBotError(status.error)
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
          }
        } catch {
          setBotState('terminated')
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 2_000)
    },
    [setBotState, setBotError]
  )

  // Restore active bot on mount
  useEffect(() => {
    if (botId && botState && botState !== 'terminated' && botState !== 'error') {
      startPolling(botId)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const bots = await listActiveBots()
        if (cancelled) return
        const active = bots.find((b) => b.state !== 'terminated' && b.state !== 'error')
        if (!active) return
        setBotDeployed(active.bot_id, '', active.platform as 'google_meet' | 'zoom', active.state)
        startPolling(active.bot_id)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up on unmount
  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current)
    },
    []
  )

  // Auto-clear terminated state after 4s
  useEffect(() => {
    if (botState !== 'terminated') return
    const t = setTimeout(clearBot, 4_000)
    return () => clearTimeout(t)
  }, [botState, clearBot])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleMuteToggle() {
    if (!botId || muteLoading) return
    setMuteLoading(true)
    try {
      if (isMuted) {
        await unmuteBotApi(botId)
        setIsMuted(false)
      } else {
        await muteBotApi(botId)
        setIsMuted(true)
      }
    } catch {
      // polling will reconcile
    } finally {
      setMuteLoading(false)
    }
  }

  async function handleSpeak() {
    if (!botId || speakLoading) return
    setSpeakLoading(true)
    try {
      await triggerBotSpeakApi(botId)
      setIsMuted(false)
    } catch {
      // ignore
    } finally {
      setSpeakLoading(false)
    }
  }

  async function handleTerminate() {
    if (!botId) return
    try {
      await terminateBot(botId)
      setBotState('terminated')
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    } catch {
      /* ignore */
    }
  }

  // ── Render nothing if no active bot ────────────────────────────────────────

  const isActive = botId && botState && botState !== 'terminated' && botState !== 'error'
  if (!isActive) return null

  const stateLabel: Record<string, string> = {
    launching: 'Launching Lira…',
    navigating: 'Opening meeting…',
    in_lobby: 'Waiting in lobby',
    joining: 'Joining meeting…',
    active: 'Lira is in the meeting',
    leaving: 'Leaving meeting…',
  }

  const platformLabel =
    platform === 'google_meet' ? 'Google Meet' : platform === 'zoom' ? 'Zoom' : ''

  // ── Compact variant ────────────────────────────────────────────────────────

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {/* Status banner */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold',
            botState === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          )}
        >
          {botState === 'active' ? (
            <RadioIcon className="h-4 w-4 animate-pulse" />
          ) : (
            <img
              src="/lira_black.png"
              alt="Loading"
              className="h-4 w-4 animate-spin opacity-50"
              style={{ animationDuration: '1.2s' }}
            />
          )}
          <span>{stateLabel[botState] ?? botState}</span>
          {botState === 'active' && isMuted && (
            <span className="text-xs text-amber-400">(muted)</span>
          )}
          {platformLabel && <span className="text-xs opacity-60">· {platformLabel}</span>}
        </div>

        {/* Buttons */}
        {botState === 'active' && (
          <div className="flex gap-2">
            <button
              onClick={handleMuteToggle}
              disabled={muteLoading}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                isMuted
                  ? 'bg-white text-[#3730a3] hover:bg-gray-100'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              )}
            >
              {isMuted ? (
                <>
                  <SpeakerWaveIcon className="h-3.5 w-3.5" />
                  Unmute
                </>
              ) : (
                <>
                  <SpeakerXMarkIcon className="h-3.5 w-3.5" />
                  Mute
                </>
              )}
            </button>
            <button
              onClick={handleSpeak}
              disabled={speakLoading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3730a3] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#312e81]"
            >
              <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5" />
              Speak
            </button>
            <button
              onClick={handleTerminate}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              End
            </button>
          </div>
        )}

        {/* Non-active but still running (launching, lobby, etc) — just End button */}
        {botState !== 'active' && (
          <button
            onClick={handleTerminate}
            className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  // ── Default variant ────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Status banner */}
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
          botState === 'active'
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-amber-500/30 bg-amber-500/10'
        )}
      >
        <div className="flex items-center gap-2.5">
          {botState === 'active' ? (
            <RadioIcon className="h-5 w-5 animate-pulse text-emerald-400" />
          ) : (
            <img
              src="/lira_black.png"
              alt="Loading"
              className="h-5 w-5 animate-spin opacity-50"
              style={{ animationDuration: '1.2s' }}
            />
          )}
          <div>
            <p
              className={cn(
                'text-sm font-semibold',
                botState === 'active' ? 'text-emerald-400' : 'text-amber-400'
              )}
            >
              {stateLabel[botState] ?? botState}
              {botState === 'active' && isMuted && (
                <span className="ml-1.5 text-xs font-normal text-amber-400">(muted)</span>
              )}
            </p>
            {platformLabel && <p className="text-xs text-white/40">{platformLabel}</p>}
          </div>
        </div>
      </div>

      {/* Control buttons */}
      {botState === 'active' && (
        <div className="flex gap-2">
          <button
            onClick={handleMuteToggle}
            disabled={muteLoading}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              isMuted
                ? 'bg-white text-[#3730a3] hover:bg-gray-100'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            )}
          >
            {isMuted ? (
              <>
                <SpeakerWaveIcon className="h-4 w-4" />
                Unmute Lira
              </>
            ) : (
              <>
                <SpeakerXMarkIcon className="h-4 w-4" />
                Mute Lira
              </>
            )}
          </button>
          <button
            onClick={handleSpeak}
            disabled={speakLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81]"
          >
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
            Lira, Speak
          </button>
        </div>
      )}

      {/* End / Remove button */}
      <button
        onClick={handleTerminate}
        className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        {botState === 'active' ? 'Remove Lira from Meeting' : 'Cancel'}
      </button>
    </div>
  )
}

export { ActiveBotControls }

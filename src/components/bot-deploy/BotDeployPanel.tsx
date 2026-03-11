import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Radio,
  Square,
  Video,
  CheckCircle2,
} from 'lucide-react'

import { useBotStore, useUserPrefsStore, useOrgStore } from '@/app/store'
import {
  deployBot,
  getBotStatus,
  listActiveBots,
  terminateBot,
  terminateAllBots,
  type BotState,
} from '@/services/api'
import { cn } from '@/lib'

// ── Helpers ──────────────────────────────────────────────────────────────────

const GOOGLE_MEET_RE = /^https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i
const ZOOM_RE = /^https?:\/\/[\w.-]*zoom\.us\/(j|my)\//i

function detectPlatform(url: string): 'google_meet' | 'zoom' | null {
  if (GOOGLE_MEET_RE.test(url)) return 'google_meet'
  if (ZOOM_RE.test(url)) return 'zoom'
  return null
}

const STATE_LABELS: Record<BotState, string> = {
  launching: 'Launching browser…',
  navigating: 'Opening meeting link…',
  in_lobby: 'Waiting in lobby…',
  joining: 'Joining meeting…',
  active: 'Active in meeting',
  leaving: 'Leaving meeting…',
  terminated: 'Meeting ended',
  error: 'Something went wrong',
}

const STATE_COLORS: Record<BotState, string> = {
  launching: 'text-amber-400',
  navigating: 'text-amber-400',
  in_lobby: 'text-sky-400',
  joining: 'text-sky-400',
  active: 'text-emerald-400',
  leaving: 'text-slate-400',
  terminated: 'text-slate-400',
  error: 'text-red-400',
}

// ── Component ────────────────────────────────────────────────────────────────

function BotDeployPanel() {
  const [meetingLink, setMeetingLink] = useState('')
  const [meetingTopic, setMeetingTopic] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  const { aiName, voiceId, personality } = useUserPrefsStore()
  const { currentOrgId, organizations } = useOrgStore()
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  // Auto-select org
  useEffect(() => {
    if (organizations.length === 1) {
      setSelectedOrgId(organizations[0].org_id)
    } else if (currentOrgId) {
      setSelectedOrgId(currentOrgId)
    }
  }, [organizations, currentOrgId])

  const {
    botId,
    botState,
    platform,
    error: storeError,
    setBotDeployed,
    setBotState,
    setBotError,
    clearBot,
  } = useBotStore()

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Auto-reset timer — fires after botState reaches 'terminated'
  const autoResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Progress value (0–100) driving the shrinking bar during auto-reset countdown
  const [resetProgress, setResetProgress] = useState(100)

  // ── Status polling ──────────────────────────────────────────────────────

  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current)

      pollRef.current = setInterval(async () => {
        try {
          const status = await getBotStatus(id)
          setBotState(status.state)

          // Stop polling on terminal states
          if (status.state === 'terminated' || status.state === 'error') {
            if (status.error) setBotError(status.error)
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
          }
        } catch (err) {
          // If JWT expired, apiFetch clears the token and throws.
          // Stop polling — the auth-expired event handler in App will redirect.
          const msg = err instanceof Error ? err.message : ''
          if (msg.includes('Session expired') || msg.includes('401')) {
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
            setBotError('Session expired — please sign in again.')
            return
          }
          // If bot no longer found, stop polling
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 2000)
    },
    [setBotState, setBotError]
  )

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // On mount: check backend for active bots (survives page refresh)
  useEffect(() => {
    // If the store already knows about a bot, just resume polling
    if (botId && botState && botState !== 'terminated' && botState !== 'error') {
      startPolling(botId)
      return
    }

    // Otherwise, ask the server if this user has any active bots
    let cancelled = false
    async function restoreActiveBot() {
      try {
        const bots = await listActiveBots()
        if (cancelled) return

        // Find the first bot that's still running
        const active = bots.find((b) => b.state !== 'terminated' && b.state !== 'error')
        if (!active) return

        // Restore the store state and start polling
        const plat = active.platform as 'google_meet' | 'zoom'
        setBotDeployed(active.bot_id, '', plat, active.state)
        startPolling(active.bot_id)
      } catch {
        // Silently ignore — user will just see the deploy form
      }
    }

    restoreActiveBot()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reset to deploy form when bot terminates (not on error — user should see that)
  useEffect(() => {
    if (botState !== 'terminated') return

    const RESET_DELAY_MS = 5_000
    const TICK_MS = 50
    setResetProgress(100)

    // Shrink the progress bar over RESET_DELAY_MS
    const tickInterval = setInterval(() => {
      setResetProgress((p) => Math.max(0, p - (TICK_MS / RESET_DELAY_MS) * 100))
    }, TICK_MS)

    autoResetRef.current = setTimeout(() => {
      clearInterval(tickInterval)
      handleReset()
    }, RESET_DELAY_MS)

    return () => {
      clearInterval(tickInterval)
      if (autoResetRef.current) clearTimeout(autoResetRef.current)
    }
  }, [botState]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Deploy handler ──────────────────────────────────────────────────────

  async function handleDeploy() {
    const url = meetingLink.trim()
    if (!url) return

    const plat = detectPlatform(url)
    if (!plat) {
      setLocalError('Please paste a valid Google Meet or Zoom link.')
      return
    }

    setLocalError(null)
    setDeploying(true)

    try {
      const res = await deployBot(
        url,
        aiName,
        { ai_name: aiName, voice_id: voiceId, personality },
        selectedOrgId ?? undefined,
        meetingTopic.trim() || undefined
      )
      setBotDeployed(res.bot_id, url, res.platform, res.state)
      setMeetingLink('')
      setMeetingTopic('')
      startPolling(res.bot_id)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to deploy bot')
    } finally {
      setDeploying(false)
    }
  }

  // ── Terminate handler ───────────────────────────────────────────────────

  async function handleTerminate() {
    if (!botId) return
    try {
      await terminateBot(botId)
      setBotState('terminated')
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    } catch {
      // ignore
    }
  }

  // ── Reset to deploy another ─────────────────────────────────────────────

  function handleReset() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
    clearBot()
  }

  // ── Platform icon ───────────────────────────────────────────────────────

  const detectedPlatform = meetingLink.trim() ? detectPlatform(meetingLink.trim()) : null

  const isActive = botState && botState !== 'terminated' && botState !== 'error'
  const isTerminal = botState === 'terminated' || botState === 'error'
  const isInProgress =
    botState === 'launching' ||
    botState === 'navigating' ||
    botState === 'in_lobby' ||
    botState === 'joining'

  const error = localError ?? storeError

  // ── Terminated: "Lira has left" auto-reset card ────────────────────────

  if (botId && botState === 'terminated') {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-400">Lira has left the meeting</p>
              <p className="mt-0.5 text-xs text-slate-400">Returning to deploy screen…</p>
            </div>
            <button
              onClick={() => {
                if (autoResetRef.current) clearTimeout(autoResetRef.current)
                handleReset()
              }}
              className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            >
              Deploy Now
            </button>
          </div>

          {/* Countdown progress bar */}
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500/60 transition-all"
              style={{ width: `${resetProgress}%`, transitionDuration: '50ms' }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Active bot view (launching / active / leaving / error) ──────────────

  if (botId && botState) {
    return (
      <div className="space-y-5">
        {/* Status card */}
        <div
          className={cn(
            'rounded-xl border px-5 py-4',
            botState === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : botState === 'error'
                ? 'border-red-500/30 bg-red-500/5'
                : isTerminal
                  ? 'border-white/10 bg-white/5'
                  : 'border-amber-500/20 bg-amber-500/5'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Animated icon */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                botState === 'active'
                  ? 'bg-emerald-500/20'
                  : botState === 'error'
                    ? 'bg-red-500/20'
                    : isTerminal
                      ? 'bg-slate-500/20'
                      : 'bg-amber-500/20'
              )}
            >
              {isInProgress ? (
                <Loader2 className={cn('h-5 w-5 animate-spin', STATE_COLORS[botState])} />
              ) : botState === 'active' ? (
                <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
              ) : (
                <Square className="h-5 w-5 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', STATE_COLORS[botState])}>
                {STATE_LABELS[botState]}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                {platform === 'google_meet' ? (
                  <Video className="h-3 w-3" />
                ) : (
                  <Video className="h-3 w-3" />
                )}
                {platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
              </p>
            </div>
          </div>

          {/* Error detail */}
          {storeError && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {storeError}
            </p>
          )}
        </div>

        {/* Live hint */}
        {botState === 'active' && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 leading-relaxed">
            <span className="font-medium text-white">Lira is in the meeting.</span> Open your
            meeting — you'll see Lira as a participant. Say{' '}
            <span className="font-medium text-violet-400">"Lira"</span> to get her attention.
            {selectedOrgId && (
              <span className="mt-1 block text-xs text-slate-400">
                Using context from:{' '}
                {organizations.find((o) => o.org_id === selectedOrgId)?.name ?? 'organization'}
              </span>
            )}
          </div>
        )}

        {botState === 'in_lobby' && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-300 leading-relaxed">
            Lira is waiting in the lobby. <span className="font-medium text-white">Admit her</span>{' '}
            from your meeting to let her join.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isActive && (
            <button
              onClick={handleTerminate}
              className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              Remove Lira from Meeting
            </button>
          )}

          {isTerminal && (
            <button
              onClick={handleReset}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Deploy to Another Meeting
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Deploy form ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="meeting-link" className="mb-1.5 block text-sm font-medium text-foreground">
          Meeting link
        </label>
        <div className="relative">
          <input
            id="meeting-link"
            type="url"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            placeholder="Paste Google Meet or Zoom link…"
            value={meetingLink}
            onChange={(e) => {
              setMeetingLink(e.target.value)
              setLocalError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
            disabled={deploying}
          />
          {/* Platform indicator */}
          {detectedPlatform && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {detectedPlatform === 'google_meet' ? (
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Meet
                </span>
              ) : (
                <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                  Zoom
                </span>
              )}
            </div>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Lira will join as a participant and respond in real-time.
        </p>
      </div>

      {/* Organization context */}
      {organizations.length > 0 && (
        <div>
          <label
            htmlFor="bot-deploy-org-select"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Organization context
          </label>
          <select
            id="bot-deploy-org-select"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            value={selectedOrgId ?? ''}
            onChange={(e) => setSelectedOrgId(e.target.value || null)}
            disabled={deploying}
          >
            <option value="">None — no org context</option>
            {organizations.map((org) => (
              <option key={org.org_id} value={org.org_id}>
                {org.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Lira will use this organization's knowledge in the meeting.
          </p>
        </div>
      )}

      {/* Meeting topic */}
      <div>
        <label
          htmlFor="bot-deploy-topic-input"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Meeting topic <span className="text-xs text-muted-foreground">(optional)</span>
        </label>
        <input
          id="bot-deploy-topic-input"
          type="text"
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          placeholder="e.g. Q4 Planning, Product Review"
          value={meetingTopic}
          onChange={(e) => setMeetingTopic(e.target.value)}
          disabled={deploying}
          maxLength={500}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-red-400">{error}</p>
              {error.includes('active bot') && (
                <button
                  type="button"
                  className="mt-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                  disabled={terminatingAll}
                  onClick={async () => {
                    setTerminatingAll(true)
                    try {
                      await terminateAllBots()
                      setLocalError(null)
                      clearBot()
                    } catch {
                      setLocalError('Failed to terminate bots. Please try again.')
                    } finally {
                      setTerminatingAll(false)
                    }
                  }}
                >
                  {terminatingAll ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Terminating…
                    </span>
                  ) : (
                    'Terminate All Active Bots'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        onClick={handleDeploy}
        disabled={deploying || !meetingLink.trim()}
      >
        {deploying ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Deploying Lira…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Send Lira to Meeting
          </span>
        )}
      </button>
    </div>
  )
}

export { BotDeployPanel }

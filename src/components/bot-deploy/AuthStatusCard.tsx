import { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { getBotAuthStatus, refreshBotAuth, type PlatformAuthStatus } from '@/services/api'
import { cn } from '@/lib'

// ── Config ────────────────────────────────────────────────────────────────────

const URGENCY_STYLES = {
  ok: {
    icon: CheckCircleIcon,
    iconColor: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'text-emerald-400',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'text-amber-400',
  },
  critical: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'text-red-400',
  },
  expired: {
    icon: XCircleIcon,
    iconColor: 'text-red-500',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    label: 'text-red-400',
  },
  not_configured: {
    icon: XCircleIcon,
    iconColor: 'text-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    label: 'text-slate-400',
  },
}

function urgencyLabel(status: PlatformAuthStatus): string {
  if (status.urgency === 'not_configured') return 'Not set up'
  if (status.urgency === 'expired') return 'Expired — resetting…'
  if (status.daysRemaining === null) return 'Unknown'
  if (status.daysRemaining === 0) return 'Expires today'
  if (status.daysRemaining === 1) return '1 day remaining'
  return `${status.daysRemaining} days remaining`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthStatusCard() {
  const [status, setStatus] = useState<PlatformAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getBotAuthStatus()
      setStatus(res.google)
    } catch {
      // If API isn't running yet, show nothing
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  async function handleRefresh() {
    setRefreshing(true)
    setMessage(null)
    try {
      const res = await refreshBotAuth()
      setStatus(res.status.google)
      setMessage({ text: res.message, ok: res.success })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Refresh failed', ok: false })
    } finally {
      setRefreshing(false)
    }
  }

  // Don't render at all during initial load or if API isn't reachable
  if (loading || status === null) return null

  const styles = URGENCY_STYLES[status.urgency] ?? URGENCY_STYLES.ok
  const Icon = styles.icon
  const showCard = status.urgency !== 'ok' // only show banner when action needed

  // Always show, but collapse to a minimal row when everything is fine
  return (
    <div className={cn('rounded-xl border px-4 py-3 transition-all', styles.bg, styles.border)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-4 w-4 shrink-0', styles.iconColor)} />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">
            Lira's Google access
            {status.urgency === 'ok' && (
              <span className="ml-1 font-normal text-muted-foreground">
                — refreshes automatically
              </span>
            )}
          </p>
          <p className={cn('text-xs', styles.label)}>
            {urgencyLabel(status)}
            {status.refreshedAt && status.urgency !== 'not_configured' && (
              <span className="ml-1.5 text-muted-foreground">
                · last refreshed {formatDate(status.refreshedAt)}
              </span>
            )}
          </p>
        </div>

        {/* Refresh button */}
        {status.urgency !== 'not_configured' && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              showCard
                ? 'bg-foreground/10 text-foreground hover:bg-foreground/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Silently refresh the Google session (no browser window)"
          >
            {refreshing ? (
              <span className="flex items-center gap-1.5">
                <img
                  src="/lira_black.png"
                  alt="Loading"
                  className="h-3 w-3 animate-spin opacity-50"
                  style={{ animationDuration: '1.2s' }}
                />
                Refreshing…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ArrowPathIcon className="h-3 w-3" />
                Refresh
              </span>
            )}
          </button>
        )}
      </div>

      {/* Feedback message */}
      {message && (
        <p
          className={cn(
            'mt-2 rounded-lg px-3 py-1.5 text-xs',
            message.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          )}
        >
          {message.text}
        </p>
      )}

      {/* Expired — show re-run instructions */}
      {status.urgency === 'expired' && (
        <div className="mt-2 rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
          The session has expired. Run in a terminal:
          <code className="mt-1 flex items-center gap-1.5 font-mono text-foreground">
            <ClockIcon className="h-3 w-3 shrink-0" />
            npx tsx scripts/setup-bot-auth.ts --google
          </code>
        </div>
      )}
    </div>
  )
}

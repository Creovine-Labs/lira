import { useEffect, useState } from 'react'
import { env } from '@/env'

/**
 * Admin · Demo Ops — Phase 0 cost/quota monitoring for the public Lira demo.
 *
 * Reads from GET /lira/v1/demo-ops/spend (admin-only, JWT-gated).
 * Shows daily spend with status (ok / alert / paused / hard_capped) and the
 * locked quota configuration. Auto-refreshes every 60s.
 *
 * Backend source of truth:
 *   creovine-backend/src/services/lira-demo-quota.service.ts
 *   creovine-backend/src/routes/lira-demo-ops.routes.ts
 *
 * Spec reference:
 *   docs/platform/customer-support/INTERACTIVE_DEMO_PLATFORM.md §6.3
 */

const TOKEN_KEY = 'lira_token'

interface SpendSnapshot {
  org_id?: string
  date?: string
  total_usd?: number
  text_usd?: number
  voice_usd?: number
  profiles_created?: number
  soft_alert_usd?: number
  auto_pause_usd?: number
  voice_sub_budget_usd?: number
  hard_cap_usd?: number
  status?: 'ok' | 'alert' | 'paused' | 'hard_capped'
  quotas?: {
    VISITOR_MAX_MESSAGES: number
    VISITOR_MAX_VOICE_SECONDS: number
    VISITOR_MAX_OUTPUT_TOKENS: number
    IP_MAX_SESSIONS_PER_HOUR: number
    IP_MAX_REQUESTS_PER_HOUR: number
    SOFT_ALERT_USD: number
    AUTO_PAUSE_USD: number
    VOICE_SUB_BUDGET_USD: number
    HARD_GLOBAL_CAP_USD: number
  }
  error?: string
}

const REFRESH_MS = 60_000

export function AdminDemoOpsPage() {
  const [snapshot, setSnapshot] = useState<SpendSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const fetchSnapshot = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${env.VITE_API_URL}/lira/v1/demo-ops/spend`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = (await res.json()) as SpendSnapshot
      setSnapshot(json)
      setError(null)
      setLastFetched(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSnapshot()
    const id = setInterval(() => void fetchSnapshot(), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Demo Ops</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daily spend + quota status for the public Lira demo. Auto-refresh every 60s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSnapshot()}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh now
        </button>
      </header>

      {loading && !snapshot && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading…
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <strong>Could not load demo ops data.</strong> {error}
        </div>
      )}

      {snapshot?.error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Configuration warning.</strong> {snapshot.error}
        </div>
      )}

      {snapshot && !snapshot.error && (
        <>
          <StatusBanner status={snapshot.status ?? 'ok'} />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SpendCard
              label="Total today"
              value={snapshot.total_usd}
              cap={snapshot.auto_pause_usd}
              accent="primary"
            />
            <SpendCard label="Text" value={snapshot.text_usd} accent="muted" />
            <SpendCard
              label="Voice"
              value={snapshot.voice_usd}
              cap={snapshot.voice_sub_budget_usd}
              accent="muted"
            />
            <CountCard
              label="Profiles created"
              value={snapshot.profiles_created}
              detail="visitors who minted a synthetic Nimbus profile today"
            />
          </section>

          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Daily ceilings (locked)</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Stat label="Soft alert" value={`$${snapshot.soft_alert_usd ?? 0}`} />
              <Stat
                label="Auto-pause"
                value={`$${snapshot.auto_pause_usd ?? 0}`}
                emphasis="warning"
              />
              <Stat
                label="Voice sub-budget"
                value={`$${snapshot.voice_sub_budget_usd ?? 0}`}
              />
              <Stat
                label="Hard cap"
                value={`$${snapshot.hard_cap_usd ?? 0}`}
                emphasis="danger"
              />
            </dl>
          </section>

          {snapshot.quotas && (
            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Per-visitor & per-IP quotas</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Stat
                  label="Messages / visitor / 24h"
                  value={snapshot.quotas.VISITOR_MAX_MESSAGES}
                />
                <Stat
                  label="Voice seconds / visitor / 24h"
                  value={snapshot.quotas.VISITOR_MAX_VOICE_SECONDS}
                />
                <Stat
                  label="Output tokens / visitor / 24h"
                  value={snapshot.quotas.VISITOR_MAX_OUTPUT_TOKENS.toLocaleString()}
                />
                <Stat
                  label="Sessions / IP / hour"
                  value={snapshot.quotas.IP_MAX_SESSIONS_PER_HOUR}
                />
                <Stat
                  label="Requests / IP / hour"
                  value={snapshot.quotas.IP_MAX_REQUESTS_PER_HOUR}
                />
              </dl>
            </section>
          )}

          <footer className="mt-6 text-xs text-gray-400">
            Org ID: <code className="font-mono">{snapshot.org_id ?? '(unset)'}</code> · UTC date:{' '}
            <code className="font-mono">{snapshot.date}</code>
            {lastFetched && (
              <span>
                {' '}
                · Last refreshed {lastFetched.toLocaleTimeString()}
              </span>
            )}
          </footer>
        </>
      )}
    </div>
  )
}

function StatusBanner({ status }: { status: 'ok' | 'alert' | 'paused' | 'hard_capped' }) {
  const styles = {
    ok: {
      bg: 'bg-emerald-50 border-emerald-200',
      dot: 'bg-emerald-500',
      text: 'text-emerald-800',
      title: 'Healthy',
      detail: 'Spend is below the soft alert threshold. Demo is serving traffic normally.',
    },
    alert: {
      bg: 'bg-amber-50 border-amber-200',
      dot: 'bg-amber-500',
      text: 'text-amber-900',
      title: 'Alert — watch for spike',
      detail: 'Daily spend has crossed the soft alert threshold. Still serving; monitor closely.',
    },
    paused: {
      bg: 'bg-rose-50 border-rose-200',
      dot: 'bg-rose-500',
      text: 'text-rose-900',
      title: 'Auto-paused',
      detail:
        'Demo inference is paused for the day. Visitors see the static "demo paused" reply. Resumes automatically at UTC midnight.',
    },
    hard_capped: {
      bg: 'bg-red-50 border-red-300',
      dot: 'bg-red-600',
      text: 'text-red-900',
      title: 'Hard cap hit — manual override required',
      detail:
        'Daily spend has hit the hard global cap. All demo traffic is blocked until ops manually resumes.',
    },
  }[status]

  return (
    <div className={`rounded-xl border ${styles.bg} p-4 ${styles.text}`}>
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{styles.title}</div>
          <div className="mt-1 text-xs">{styles.detail}</div>
        </div>
      </div>
    </div>
  )
}

function SpendCard({
  label,
  value,
  cap,
  accent,
}: {
  label: string
  value: number | undefined
  cap?: number
  accent: 'primary' | 'muted' | 'threshold'
}) {
  const tone =
    accent === 'primary'
      ? 'border-violet-200 bg-violet-50'
      : accent === 'threshold'
        ? 'border-gray-200 bg-gray-50'
        : 'border-gray-200 bg-white'
  const valueStr = typeof value === 'number' ? `$${value.toFixed(2)}` : '—'
  const pct = cap && cap > 0 && typeof value === 'number' ? Math.min(100, (value / cap) * 100) : null

  return (
    <div className={`rounded-xl border ${tone} p-4`}>
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{valueStr}</div>
      {cap !== undefined && (
        <div className="mt-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full ${pct && pct >= 100 ? 'bg-rose-500' : pct && pct >= 50 ? 'bg-amber-500' : 'bg-violet-500'}`}
              style={{ width: pct !== null ? `${pct}%` : '0%' }}
            />
          </div>
          <div className="mt-1 text-[10px] text-gray-500">of ${cap.toFixed(0)} cap</div>
        </div>
      )}
    </div>
  )
}

function CountCard({
  label,
  value,
  detail,
}: {
  label: string
  value: number | undefined
  detail?: string
}) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : '—'
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-violet-700">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{displayValue}</div>
      {detail && <div className="mt-2 text-[10px] text-gray-500">{detail}</div>}
    </div>
  )
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string | number
  emphasis?: 'warning' | 'danger'
}) {
  const valueClass =
    emphasis === 'danger'
      ? 'text-red-700'
      : emphasis === 'warning'
        ? 'text-amber-700'
        : 'text-gray-900'
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-base font-medium ${valueClass}`}>{value}</dd>
    </div>
  )
}

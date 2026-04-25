import { useEffect, useState, useCallback } from 'react'
import type { PortalConfig, PortalTicket, CustomerSession } from '../types'
import { listMyTickets } from '../api'
import { AuthGate } from '../components/AuthGate'

interface MyTicketsProps {
  config: PortalConfig
  session: CustomerSession | null
  onSession: (s: CustomerSession | null) => void
}

function statusBadge(status: string, _accent: string) {
  const styles: Record<string, { bg: string; text: string }> = {
    open: { bg: '#dbeafe', text: '#1d4ed8' },
    pending: { bg: '#fef3c7', text: '#b45309' },
    escalated: { bg: '#fce7f3', text: '#be185d' },
    resolved: { bg: '#d1fae5', text: '#047857' },
  }
  const s = styles[status] ?? { bg: '#f3f4f6', text: '#374151' }
  return (
    <span className="lp-badge" style={{ backgroundColor: s.bg, color: s.text }}>
      {status}
    </span>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function MyTickets({ config, session, onSession }: MyTicketsProps) {
  const accent = config.portalColor || '#3730a3'
  const [tickets, setTickets] = useState<PortalTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTickets = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const data = await listMyTickets(config.orgSlug, session.token)
      setTickets(data)
    } catch (err) {
      if (err instanceof Error && err.message === 'Session expired') {
        onSession(null)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load tickets')
      }
    } finally {
      setLoading(false)
    }
  }, [config.orgSlug, session, onSession])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  if (!session) {
    return (
      <div className="lp-page">
        <AuthGate config={config} session={session} onSession={onSession} />
      </div>
    )
  }

  return (
    <div className="lp-page">
      <div className="lp-tickets-header">
        <h2>My Tickets</h2>
        <a
          href={`/${config.orgSlug}/submit`}
          className="lp-btn-primary lp-btn-sm"
          style={{ backgroundColor: accent }}
        >
          + New ticket
        </a>
      </div>

      {loading && <div className="lp-loading">Loading your tickets…</div>}

      {error && <p className="lp-error">{error}</p>}

      {!loading && !error && tickets.length === 0 && (
        <div className="lp-empty">
          <p>You don&apos;t have any tickets yet.</p>
          <a
            href={`/${config.orgSlug}/submit`}
            className="lp-btn-primary"
            style={{ backgroundColor: accent }}
          >
            Submit your first request
          </a>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="lp-ticket-list">
          {tickets.map((t) => {
            const lastMsg = t.messages[t.messages.length - 1]
            const hasNewReply =
              lastMsg && (lastMsg.role === 'agent' || lastMsg.role === 'lira') &&
              t.status !== 'resolved'
            return (
              <a
                key={t.conv_id}
                href={`/${config.orgSlug}/tickets/${t.conv_id}`}
                className={`lp-ticket-row${hasNewReply ? ' lp-ticket-row--unread' : ''}`}
              >
                <div className="lp-ticket-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    {hasNewReply && <span className="lp-unread-dot" />}
                    <span className="lp-ticket-subject">{t.subject || 'No subject'}</span>
                  </div>
                  <span className="lp-ticket-meta">
                    {timeAgo(t.updated_at)} · {t.channel}
                    {hasNewReply && <span className="lp-unread-label" style={{ marginLeft: '8px' }}>New reply</span>}
                  </span>
                </div>
                <div className="lp-ticket-right">{statusBadge(t.status, accent)}</div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

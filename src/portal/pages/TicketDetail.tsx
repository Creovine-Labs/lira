import { useEffect, useState, useCallback } from 'react'
import type { PortalConfig, PortalTicket, CustomerSession } from '../types'
import { getMyTicket, replyToTicket } from '../api'
import { AuthGate } from '../components/AuthGate'

interface TicketDetailProps {
  config: PortalConfig
  ticketId: string
  session: CustomerSession | null
  onSession: (s: CustomerSession | null) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TicketDetail({ config, ticketId, session, onSession }: TicketDetailProps) {
  const accent = config.portalColor || '#3730a3'
  const [ticket, setTicket] = useState<PortalTicket | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTicket = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const data = await getMyTicket(config.orgSlug, ticketId, session.token)
      setTicket(data)
    } catch (err) {
      if (err instanceof Error && err.message === 'Session expired') {
        onSession(null)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load ticket')
      }
    } finally {
      setLoading(false)
    }
  }, [config.orgSlug, ticketId, session, onSession])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  const handleReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!session || !reply.trim()) return
      setSending(true)
      try {
        await replyToTicket(config.orgSlug, ticketId, reply, session.token)
        setReply('')
        // Refresh to get the new message
        await fetchTicket()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reply')
      } finally {
        setSending(false)
      }
    },
    [config.orgSlug, ticketId, reply, session, fetchTicket]
  )

  if (!session) {
    return (
      <div className="lp-page">
        <AuthGate config={config} session={session} onSession={onSession} />
      </div>
    )
  }

  if (loading && !ticket) {
    return (
      <div className="lp-page">
        <div className="lp-loading">Loading ticket…</div>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="lp-page">
        <p className="lp-error">{error}</p>
        <a href={`/${config.orgSlug}/tickets`} className="lp-btn-link">
          ← Back to tickets
        </a>
      </div>
    )
  }

  if (!ticket) return null

  const statusColors: Record<string, { bg: string; text: string }> = {
    open: { bg: '#dbeafe', text: '#1d4ed8' },
    pending: { bg: '#fef3c7', text: '#b45309' },
    escalated: { bg: '#fce7f3', text: '#be185d' },
    resolved: { bg: '#d1fae5', text: '#047857' },
  }
  const sc = statusColors[ticket.status] ?? { bg: '#f3f4f6', text: '#374151' }

  return (
    <div className="lp-page">
      <a href={`/${config.orgSlug}/tickets`} className="lp-back-link">
        ← All tickets
      </a>

      <div className="lp-detail-header">
        <h2>{ticket.subject || 'Ticket'}</h2>
        <span className="lp-badge" style={{ backgroundColor: sc.bg, color: sc.text }}>
          {ticket.status}
        </span>
      </div>

      {/* Message thread */}
      <div className="lp-thread">
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            className={`lp-message ${m.role === 'customer' ? 'lp-message-customer' : 'lp-message-agent'}`}
          >
            <div className="lp-message-header">
              <span className="lp-message-sender">
                {m.role === 'customer'
                  ? 'You'
                  : m.sender_name || (m.role === 'lira' ? 'Lira AI' : 'Support Agent')}
              </span>
              <span className="lp-message-time">{formatTime(m.timestamp)}</span>
            </div>
            <div className="lp-message-body">{m.body}</div>
          </div>
        ))}
      </div>

      {/* Reply box — only for non-resolved tickets */}
      {ticket.status !== 'resolved' && (
        <form onSubmit={handleReply} className="lp-reply-form">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            rows={3}
            className="lp-input lp-textarea"
            required
          />
          {error && <p className="lp-error">{error}</p>}
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="lp-btn-primary"
            style={{ backgroundColor: accent }}
          >
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </form>
      )}

      {ticket.status === 'resolved' && (
        <div className="lp-resolved-notice">
          This ticket has been resolved. Need more help?{' '}
          <a href={`/${config.orgSlug}/submit`} style={{ color: accent }}>
            Submit a new request
          </a>
        </div>
      )}
    </div>
  )
}

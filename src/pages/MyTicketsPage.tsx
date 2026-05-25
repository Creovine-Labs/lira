import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  TicketIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listTicketsForVisitor,
  getTicketByNumber,
  type SupportTicketRecord,
  type SupportTicketMessageRecord,
} from '@/services/api/support-api'

/**
 * "My Tickets" — the visitor-facing list + thread view for tickets the
 * current user has opened. Lives in the Lira admin dashboard (so when
 * the Lemonpay admin opens a ticket with Lira's team, they see it here).
 *
 * The same component shape will eventually serve the customer's portal
 * (a Lemonpay end-user seeing tickets they opened with Lemonpay) — for
 * now this is dashboard-only.
 */

export function MyTicketsPage() {
  const { userEmail } = useAuthStore()
  const { currentOrgId } = useOrgStore()
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentOrgId || !userEmail) return
    setLoading(true)
    try {
      const data = await listTicketsForVisitor(currentOrgId, userEmail)
      setTickets(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, userEmail])

  useEffect(() => {
    void load()
  }, [load])

  if (!userEmail) {
    return <div className="p-6 text-sm text-slate-500">Sign in to see your tickets.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">My tickets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Async questions for the Lira team. Each ticket lives on its own thread; you'll get an
          email when someone replies.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          Loading…
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <TicketIcon className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No tickets yet</p>
          <p className="mt-1 text-xs text-slate-500">
            When you ask Lira something the team needs to answer directly, a ticket will open here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.ticket_id}>
              <Link
                to={`/tickets/${encodeURIComponent(t.ticket_number ?? t.ticket_id)}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                    {t.ticket_number ?? t.ticket_id.slice(0, 8)}
                  </code>
                  <StatusBadge status={t.status} />
                  <span className="ml-auto text-[11px] text-slate-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900">{t.subject}</p>
                {t.summary && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t.summary}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function MyTicketDetailPage() {
  const { ticketNumber } = useParams<{ ticketNumber: string }>()
  const { userEmail } = useAuthStore()
  const { currentOrgId } = useOrgStore()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<SupportTicketRecord | null>(null)
  const [messages, setMessages] = useState<SupportTicketMessageRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentOrgId || !ticketNumber) return
    setLoading(true)
    try {
      const data = await getTicketByNumber(currentOrgId, ticketNumber)
      setTicket(data.ticket)
      setMessages(data.messages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ticket not found')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, ticketNumber])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <div className="p-6 text-sm text-slate-400">Loading…</div>
  }
  if (!ticket) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← All tickets
        </button>
        <p className="mt-4 text-sm text-slate-500">
          This ticket does not exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <button
        onClick={() => navigate('/tickets')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" /> All tickets
      </button>

      <div>
        <div className="flex items-center gap-3">
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
            {ticket.ticket_number ?? ticket.ticket_id.slice(0, 8)}
          </code>
          <StatusBadge status={ticket.status} />
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-950">{ticket.subject}</h1>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.message_id}
            className={
              m.sender === 'visitor'
                ? 'flex justify-end'
                : m.sender === 'system'
                  ? 'flex justify-center'
                  : 'flex justify-start'
            }
          >
            <div
              className={
                m.sender === 'visitor'
                  ? 'max-w-[80%] rounded-2xl bg-slate-950 px-4 py-2.5 text-[14px] leading-6 text-white'
                  : m.sender === 'system'
                    ? 'rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500'
                    : 'max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] leading-6 text-slate-800'
              }
            >
              {m.sender !== 'system' && (
                <div className="mb-0.5 text-[11px] font-semibold text-slate-500">
                  {m.sender === 'visitor' ? 'You' : (m.sender_name ?? 'Lira team')}
                  <span className="ml-2 font-normal text-slate-400">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          </div>
        ))}
      </div>

      {ticket.status === 'resolved' || ticket.status === 'closed' ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          This ticket is {ticket.status}. Open a new one if you have another question.
        </div>
      ) : (
        <VisitorReplyForm
          onSent={(msg) => setMessages((prev) => [...prev, msg])}
          ticketNumber={ticket.ticket_number ?? ticket.ticket_id.slice(0, 8)}
          orgId={ticket.org_id}
          visitorEmail={userEmail ?? ''}
        />
      )}
    </div>
  )
}

function VisitorReplyForm({
  ticketNumber,
  orgId,
  visitorEmail,
  onSent,
}: {
  ticketNumber: string
  orgId: string
  visitorEmail: string
  onSent: (msg: SupportTicketMessageRecord) => void
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = body.trim()
    if (!text) return
    setSending(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/lira/v1/support/tickets/by-number/${encodeURIComponent(ticketNumber)}/reply?org_id=${encodeURIComponent(orgId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: text, visitor_email: visitorEmail }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Reply failed')
      }
      const data = (await res.json()) as { message: SupportTicketMessageRecord }
      onSent(data.message)
      setBody('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Add to this thread…"
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={send}
          disabled={sending || !body.trim()}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {sending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: SupportTicketRecord['status'] }) {
  const map: Record<
    SupportTicketRecord['status'],
    { cls: string; label: string; Icon: typeof ClockIcon }
  > = {
    open: { cls: 'bg-amber-50 text-amber-700', label: 'Open', Icon: ClockIcon },
    in_progress: {
      cls: 'bg-blue-50 text-blue-700',
      label: 'In progress',
      Icon: ChatBubbleLeftRightIcon,
    },
    resolved: { cls: 'bg-emerald-50 text-emerald-700', label: 'Resolved', Icon: CheckCircleIcon },
    closed: { cls: 'bg-slate-100 text-slate-600', label: 'Closed', Icon: CheckCircleIcon },
  }
  const { cls, label, Icon } = map[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

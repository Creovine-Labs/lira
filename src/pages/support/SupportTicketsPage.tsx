import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  TicketIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listTicketsForOrg,
  getTicketForOrg,
  replyToTicket,
  resolveTicket,
  type SupportTicketRecord,
  type SupportTicketMessageRecord,
} from '@/services/api/support-api'
import { cn } from '@/lib'

/**
 * Operator-facing tickets surface. Sister to the visitor-facing
 * MyTicketsPage — this view lists tickets across the org so a teammate
 * can reply / resolve them. Conversations (raw AI chat threads) live in
 * `/support/inbox`; tickets are the things that actually need a human.
 */

type StatusFilter = 'all' | SupportTicketRecord['status']

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function SupportTicketsPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')

  const load = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const data = await listTicketsForOrg(currentOrgId)
      setTickets(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    void load()
  }, [load])

  // Poll while page is open
  useEffect(() => {
    if (!currentOrgId) return
    const id = setInterval(() => {
      listTicketsForOrg(currentOrgId)
        .then(setTickets)
        .catch(() => {})
    }, 10_000)
    return () => clearInterval(id)
  }, [currentOrgId])

  const filtered = useMemo(() => {
    const subset = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)
    return [...subset].sort((a, b) => {
      // Active first (open > in_progress > resolved > closed), then newest
      const rank = (s: SupportTicketRecord['status']) =>
        s === 'open' ? 0 : s === 'in_progress' ? 1 : s === 'resolved' ? 2 : 3
      const r = rank(a.status) - rank(b.status)
      if (r !== 0) return r
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [tickets, filter])

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Tickets</h1>
          <p className="mt-1 text-sm text-gray-400">
            Human-handled threads. The AI keeps chatting in parallel — these are the questions it
            couldn't answer alone.
          </p>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl border border-white/60 bg-white p-1 shadow-sm w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                filter === tab.value ? 'bg-[#020308] text-white' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
            <TicketIcon className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">No tickets yet</p>
            <p className="mt-1 text-xs text-gray-300">
              Lira opens a ticket when a question needs a real teammate
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => (
              <li key={t.ticket_id}>
                <button
                  onClick={() => navigate(`/support/tickets/${t.ticket_id}`)}
                  className="block w-full rounded-2xl border border-white/60 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {t.ticket_number ?? t.ticket_id.slice(0, 8)}
                    </code>
                    <StatusBadge status={t.status} />
                    {t.priority !== 'medium' && <PriorityChip priority={t.priority} />}
                    <span className="ml-auto text-[11px] text-gray-400">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900">{t.subject}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t.visitor_name ?? t.visitor_email ?? 'unknown visitor'}
                    {t.source ? ` · via ${t.source.replace(/_/g, ' ')}` : ''}
                  </p>
                  {t.summary && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-400">{t.summary}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { currentOrgId } = useOrgStore()
  const { userName } = useAuthStore()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<SupportTicketRecord | null>(null)
  const [messages, setMessages] = useState<SupportTicketMessageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrgId || !ticketId) return
    setLoading(true)
    try {
      const data = await getTicketForOrg(currentOrgId, ticketId)
      setTicket(data.ticket)
      setMessages(data.messages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ticket not found')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, ticketId])

  useEffect(() => {
    void load()
  }, [load])

  const handleResolve = async () => {
    if (!currentOrgId || !ticket) return
    setResolving(true)
    try {
      const updated = await resolveTicket(currentOrgId, ticket.ticket_id)
      setTicket(updated)
      toast.success('Ticket resolved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }
  if (!ticket) {
    return (
      <div className="min-h-full bg-[#ebebeb] p-6">
        <button
          onClick={() => navigate('/support/tickets')}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← All tickets
        </button>
        <p className="mt-4 text-sm text-gray-500">
          This ticket does not exist or has been removed.
        </p>
      </div>
    )
  }

  const ticketNumber = ticket.ticket_number ?? ticket.ticket_id.slice(0, 8)
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          onClick={() => navigate('/support/tickets')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" /> All tickets
        </button>

        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {ticketNumber}
            </code>
            <StatusBadge status={ticket.status} />
            {ticket.priority !== 'medium' && <PriorityChip priority={ticket.priority} />}
            {!isClosed && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {resolving ? 'Resolving…' : 'Mark resolved'}
              </button>
            )}
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-gray-950">{ticket.subject}</h1>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-gray-700">Visitor:</span>{' '}
              {ticket.visitor_name ?? ticket.visitor_email ?? '—'}
            </div>
            {ticket.visitor_email && (
              <div>
                <span className="font-semibold text-gray-700">Email:</span> {ticket.visitor_email}
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-700">Source:</span>{' '}
              {ticket.source ?? 'unknown'}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Opened:</span>{' '}
              {new Date(ticket.created_at).toLocaleString()}
            </div>
            {ticket.resolved_at && (
              <div>
                <span className="font-semibold text-gray-700">Resolved:</span>{' '}
                {new Date(ticket.resolved_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.message_id}
              className={
                m.sender === 'agent'
                  ? 'flex justify-end'
                  : m.sender === 'system'
                    ? 'flex justify-center'
                    : 'flex justify-start'
              }
            >
              <div
                className={
                  m.sender === 'agent'
                    ? 'max-w-[80%] rounded-2xl bg-slate-950 px-4 py-2.5 text-[14px] leading-6 text-white'
                    : m.sender === 'system'
                      ? 'rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500'
                      : 'max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] leading-6 text-slate-800'
                }
              >
                {m.sender !== 'system' && (
                  <div className="mb-0.5 text-[11px] font-semibold text-slate-500">
                    {m.sender === 'agent' ? (m.sender_name ?? 'You') : (m.sender_name ?? 'Visitor')}
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

        {isClosed ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            This ticket is {ticket.status}.
          </div>
        ) : (
          <AgentReplyForm
            ticketId={ticket.ticket_id}
            orgId={ticket.org_id}
            senderName={userName ?? 'Teammate'}
            onSent={(msg, status) => {
              setMessages((prev) => [...prev, msg])
              if (status) setTicket((prev) => (prev ? { ...prev, status } : prev))
            }}
          />
        )}
      </div>
    </div>
  )
}

function AgentReplyForm({
  ticketId,
  orgId,
  onSent,
}: {
  ticketId: string
  orgId: string
  senderName: string
  onSent: (msg: SupportTicketMessageRecord, newStatus?: SupportTicketRecord['status']) => void
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = body.trim()
    if (!text) return
    setSending(true)
    try {
      const msg = await replyToTicket(orgId, ticketId, text)
      // Server auto-transitions open → in_progress on first agent reply
      onSent(msg, 'in_progress')
      setBody('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Reply to the visitor — they'll get an email."
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Visitor will be notified by email.</p>
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

function PriorityChip({ priority }: { priority: SupportTicketRecord['priority'] }) {
  const map: Record<SupportTicketRecord['priority'], string> = {
    low: 'bg-slate-50 text-slate-500',
    medium: 'bg-slate-50 text-slate-500',
    high: 'bg-orange-50 text-orange-700',
    urgent: 'bg-red-50 text-red-700',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[priority]}`}
    >
      {priority}
    </span>
  )
}

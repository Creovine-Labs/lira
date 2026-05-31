import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EnvelopeIcon,
  LinkIcon,
  LightBulbIcon,
  PaperClipIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
  TicketIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listTicketsForOrg,
  getTicketForOrg,
  replyToTicket,
  resolveTicket,
  regenerateHandoffBrief,
  requestCsat,
  createManualTicket,
  uploadTicketAttachment,
  listExternalLinks,
  createExternalLink,
  forceSyncTicket,
  downloadTicketAudit,
  markTicketPending,
  markTicketOnHold,
  reopenTicket,
  closeTicket,
  classifyTicket,
  routeTicket,
  ackEscalation,
  setTicketPriority,
  setTicketCategory,
  setTicketQueue,
  assignTicket,
  listQueues,
  listTicketCategories,
  type SupportTicketRecord,
  type SupportTicketMessageRecord,
  type TicketAttachmentRecord,
  type ResolveTicketFeedback,
  type ExternalLink,
  type OutboxProvider,
  type SupportQueue,
  type TicketCategoryRecord,
} from '@/services/api/support-api'
import { SlaPill } from './SlaPill'
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
  { value: 'pending', label: 'Pending' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function SupportTicketsPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [showNew, setShowNew] = useState(false)
  // Capture once at mount so the SLA pill computation stays pure across
  // renders (react-hooks/purity disallows Date.now() during render).
  const [nowSnapshot] = useState(() => Date.now())

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
      // Sort order: most-actionable first. Escalated/pending need attention
      // sooner than passively-open tickets; terminal states drift to the
      // bottom in the order resolved → closed → merged/snoozed.
      const rank = (s: SupportTicketRecord['status']): number => {
        switch (s) {
          case 'escalated':
            return 0
          case 'pending':
            return 1
          case 'open':
            return 2
          case 'in_progress':
            return 3
          case 'on_hold':
            return 4
          case 'resolved':
            return 5
          case 'closed':
            return 6
          case 'merged':
          case 'snoozed':
            return 7
          default:
            return 8
        }
      }
      const r = rank(a.status) - rank(b.status)
      if (r !== 0) return r
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [tickets, filter])

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Tickets</h1>
            <p className="mt-1 text-sm text-gray-400">
              Human-handled threads. The AI keeps chatting in parallel — these are the questions it
              couldn't answer alone.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#020308] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            New ticket
          </button>
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
                    <SlaPill ticket={t} now={nowSnapshot} compact />
                    <span
                      className="ml-auto text-[11px] text-gray-400"
                      title={new Date(t.updated_at).toLocaleString()}
                    >
                      {relativeTimeShort(t.updated_at, nowSnapshot)}
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

      {showNew && currentOrgId && (
        <NewTicketModal
          orgId={currentOrgId}
          onClose={() => setShowNew(false)}
          onCreated={(ticket) => {
            setShowNew(false)
            navigate(`/support/tickets/${ticket.ticket_id}`)
          }}
        />
      )}
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
  const [replyDraft, setReplyDraft] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [csatRequesting, setCsatRequesting] = useState(false)
  // Tracks whether the operator already fired Request CSAT this session.
  // The backend is idempotent so re-sending is safe, but a quiet "Sent"
  // state confirms the action without forcing them to dig through email.
  const [csatRequested, setCsatRequested] = useState(false)

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

  const handleResolve = async (feedback?: ResolveTicketFeedback) => {
    if (!currentOrgId || !ticket) return
    setResolving(true)
    try {
      const updated = await resolveTicket(currentOrgId, ticket.ticket_id, feedback)
      setTicket(updated)
      setShowResolveModal(false)
      toast.success(
        feedback?.knowledge_gap ||
          feedback?.ai_assessment === 'wrong' ||
          feedback?.ai_assessment === 'partial'
          ? 'Resolved — a KB draft was queued for review'
          : 'Ticket resolved'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  const handleRegenerateBrief = async () => {
    if (!currentOrgId || !ticket) return
    setRegenerating(true)
    try {
      const brief = await regenerateHandoffBrief(currentOrgId, ticket.ticket_id)
      setTicket((prev) => (prev ? { ...prev, handoff_brief: brief } : prev))
      toast.success('Brief regenerated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate brief')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRequestCsat = async () => {
    if (!currentOrgId || !ticket) return
    setCsatRequesting(true)
    try {
      await requestCsat(currentOrgId, ticket.ticket_id)
      setCsatRequested(true)
      toast.success(`CSAT survey emailed to ${ticket.visitor_email ?? 'the customer'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send CSAT survey')
    } finally {
      setCsatRequesting(false)
    }
  }

  // Lifecycle action runner — shared optimistic-update + rollback flow for
  // all the discrete POST endpoints (pending/on-hold/reopen/close/classify/
  // route/escalation-ack). The acting prop disables the bar while one is
  // in flight.
  const [actingLifecycle, setActingLifecycle] = useState<string | null>(null)
  const runLifecycle = useCallback(
    async (
      label: string,
      action: (orgId: string, ticketId: string) => Promise<SupportTicketRecord>,
      successMessage?: string
    ) => {
      if (!currentOrgId || !ticket) return
      setActingLifecycle(label)
      try {
        const updated = await action(currentOrgId, ticket.ticket_id)
        setTicket(updated)
        toast.success(successMessage ?? `${label} done`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `${label} failed`)
      } finally {
        setActingLifecycle(null)
      }
    },
    [currentOrgId, ticket]
  )

  // `now` captured at mount so the SLA pill stays pure across renders.
  const [now] = useState(() => Date.now())

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
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {ticketNumber}
            </code>
            <StatusBadge status={ticket.status} />
            {ticket.priority !== 'medium' && <PriorityChip priority={ticket.priority} />}
            <SlaPill ticket={ticket} now={now} />
            {!isClosed && (
              <button
                onClick={() => setShowResolveModal(true)}
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
            <div title={new Date(ticket.created_at).toLocaleString()}>
              <span className="font-semibold text-gray-700">Opened:</span>{' '}
              {relativeTimeShort(ticket.created_at, now)}
            </div>
            {ticket.resolved_at && (
              <div title={new Date(ticket.resolved_at).toLocaleString()}>
                <span className="font-semibold text-gray-700">Resolved:</span>{' '}
                {relativeTimeShort(ticket.resolved_at, now)}
              </div>
            )}
          </div>

          {currentOrgId && (
            <TicketPropertyControls
              orgId={currentOrgId}
              ticket={ticket}
              onTicketUpdate={(t) => setTicket(t)}
            />
          )}

          <LifecycleBar
            ticket={ticket}
            acting={actingLifecycle}
            disabled={!currentOrgId}
            onMarkPending={() =>
              currentOrgId && runLifecycle('pending', markTicketPending, 'Marked pending')
            }
            onMarkOnHold={() =>
              currentOrgId && runLifecycle('on-hold', markTicketOnHold, 'Put on hold')
            }
            onReopen={() => currentOrgId && runLifecycle('reopen', reopenTicket, 'Ticket reopened')}
            onClose={() => currentOrgId && runLifecycle('close', closeTicket, 'Ticket closed')}
            onClassify={() =>
              currentOrgId && runLifecycle('classify', classifyTicket, 'AI re-classified')
            }
            onRoute={() => currentOrgId && runLifecycle('route', routeTicket, 'Re-routed to queue')}
            onAckEscalation={() =>
              currentOrgId &&
              runLifecycle('ack-escalation', ackEscalation, 'Escalation acknowledged')
            }
          />

          {ticket.status === 'resolved' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                Customer satisfaction
              </div>
              <button
                type="button"
                onClick={handleRequestCsat}
                disabled={csatRequesting || csatRequested}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                  csatRequested
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                  csatRequesting && 'cursor-wait opacity-70'
                )}
                title={
                  ticket.visitor_email
                    ? `Email a 5-star CSAT survey to ${ticket.visitor_email}`
                    : 'Email a CSAT survey to the customer'
                }
              >
                {csatRequested ? (
                  <>
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Survey sent
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-3.5 w-3.5" />
                    {csatRequesting ? 'Sending…' : 'Request CSAT'}
                  </>
                )}
              </button>
              <span className="text-[11px] text-gray-400">
                Customer rates 1–5 stars. Backend deduplicates on re-send.
              </span>
            </div>
          )}
        </div>

        <HandoffBriefCard
          ticket={ticket}
          regenerating={regenerating}
          onRegenerate={handleRegenerateBrief}
          onUseSuggestion={(text) => {
            setReplyDraft(text)
            toast.success('Suggested reply loaded — edit before sending')
          }}
        />

        {currentOrgId && <IntegrationsPanel orgId={currentOrgId} ticketId={ticket.ticket_id} />}

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
                    <span
                      className="ml-2 font-normal text-slate-400"
                      title={new Date(m.created_at).toLocaleString()}
                    >
                      {relativeTimeShort(m.created_at, now)}
                    </span>
                  </div>
                )}
                {m.body && <div className="whitespace-pre-wrap">{m.body}</div>}
                {m.attachments && m.attachments.length > 0 && (
                  <AttachmentList attachments={m.attachments} dark={m.sender === 'agent'} />
                )}
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
            body={replyDraft}
            onBodyChange={setReplyDraft}
            onSent={(msg, status) => {
              setMessages((prev) => [...prev, msg])
              if (status) setTicket((prev) => (prev ? { ...prev, status } : prev))
            }}
          />
        )}
      </div>

      {showResolveModal && (
        <ResolveModal
          resolving={resolving}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolve}
        />
      )}
    </div>
  )
}

function AgentReplyForm({
  ticketId,
  orgId,
  body,
  onBodyChange,
  onSent,
}: {
  ticketId: string
  orgId: string
  senderName: string
  body: string
  onBodyChange: (v: string) => void
  onSent: (msg: SupportTicketMessageRecord, newStatus?: SupportTicketRecord['status']) => void
}) {
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<TicketAttachmentRecord[]>([])
  const [uploading, setUploading] = useState(false)

  const send = async () => {
    const text = body.trim()
    if (!text && attachments.length === 0) return
    setSending(true)
    try {
      const msg = await replyToTicket(
        orgId,
        ticketId,
        text,
        attachments.length ? attachments : undefined
      )
      // Server auto-transitions open → in_progress on first agent reply
      onSent(msg, 'in_progress')
      onBodyChange('')
      setAttachments([])
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
        onChange={(e) => onBodyChange(e.target.value)}
        rows={4}
        placeholder="Reply to the visitor — they'll get an email."
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
      />
      <AttachmentPicker
        attachments={attachments}
        uploading={uploading}
        onUpload={async (file) => {
          setUploading(true)
          try {
            const a = await uploadTicketAttachment(orgId, file)
            setAttachments((prev) => [...prev, a])
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed')
          } finally {
            setUploading(false)
          }
        }}
        onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Visitor will be notified by email.</p>
        <button
          type="button"
          onClick={send}
          disabled={sending || uploading || (!body.trim() && attachments.length === 0)}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {sending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </div>
  )
}

// ── Attachment UI (shared) ────────────────────────────────────────────────────

const MAX_ATTACHMENT_MB = 10

function AttachmentList({
  attachments,
  dark,
}: {
  attachments: TicketAttachmentRecord[]
  dark?: boolean
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => {
        const isImage = a.content_type.startsWith('image/') && a.url
        if (isImage) {
          return (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={a.url}
                alt={a.name}
                className="max-h-40 max-w-[200px] rounded-lg border border-black/10 object-cover"
              />
            </a>
          )
        }
        return (
          <a
            key={a.id}
            href={a.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              dark
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            )}
          >
            <PaperClipIcon className="h-3.5 w-3.5" />
            <span className="max-w-[160px] truncate">{a.name}</span>
          </a>
        )
      })}
    </div>
  )
}

function AttachmentPicker({
  attachments,
  uploading,
  onUpload,
  onRemove,
}: {
  attachments: TicketAttachmentRecord[]
  uploading: boolean
  onUpload: (file: File) => void | Promise<void>
  onRemove: (id: string) => void
}) {
  return (
    <div className="mt-2">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
            >
              <PaperClipIcon className="h-3 w-3" />
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="ml-0.5 text-slate-400 hover:text-slate-700"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800">
        <PaperClipIcon className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : 'Attach file'}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          accept="image/*,application/pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
              toast.error(`File too large (max ${MAX_ATTACHMENT_MB} MB)`)
              return
            }
            void onUpload(file)
          }}
        />
      </label>
    </div>
  )
}

// ── New ticket modal (operator) ───────────────────────────────────────────────

function NewTicketModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string
  onClose: () => void
  onCreated: (ticket: SupportTicketRecord) => void
}) {
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [priority, setPriority] = useState<SupportTicketRecord['priority']>('medium')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [attachments, setAttachments] = useState<TicketAttachmentRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!subject.trim() || !details.trim()) {
      toast.error('Subject and details are required')
      return
    }
    setSaving(true)
    try {
      const ticket = await createManualTicket(orgId, {
        subject: subject.trim(),
        details: details.trim(),
        priority,
        visitor_email: email.trim() || undefined,
        visitor_name: name.trim() || undefined,
        attachments: attachments.length ? attachments : undefined,
      })
      toast.success(`Ticket ${ticket.ticket_number ?? ''} created`)
      onCreated(ticket)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">New ticket</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          Opens a ticket for your team. If you add a customer email, they'll be notified and can
          reply by email.
        </p>

        <div className="space-y-3">
          <Field label="Subject">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          </Field>
          <Field label="Details">
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="What's the issue?"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SupportTicketRecord['priority'])}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Customer name (optional)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
              />
            </Field>
          </div>
          <Field label="Customer email (optional)">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          </Field>
          <AttachmentPicker
            attachments={attachments}
            uploading={uploading}
            onUpload={async (file) => {
              setUploading(true)
              try {
                const a = await uploadTicketAttachment(orgId, file)
                setAttachments((prev) => [...prev, a])
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Upload failed')
              } finally {
                setUploading(false)
              }
            }}
            onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || uploading || !subject.trim() || !details.trim()}
            className="rounded-lg bg-[#020308] px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? 'Creating…' : 'Create ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </label>
      {children}
    </div>
  )
}

// Aligned with the cross-cutting status palette in SUPPORT_TICKETING_API.md
// §7. Identical color choices to the portal StatusBadge — operators and
// customers see the same colors per status, only the icon row differs.
function StatusBadge({ status }: { status: SupportTicketRecord['status'] }) {
  const map: Record<
    SupportTicketRecord['status'],
    { cls: string; label: string; Icon: typeof ClockIcon }
  > = {
    open: { cls: 'bg-sky-50 text-sky-700', label: 'Open', Icon: ClockIcon },
    in_progress: {
      cls: 'bg-sky-50 text-sky-700',
      label: 'In progress',
      Icon: ChatBubbleLeftRightIcon,
    },
    pending: { cls: 'bg-amber-50 text-amber-800', label: 'Pending', Icon: ClockIcon },
    on_hold: { cls: 'bg-slate-100 text-slate-700', label: 'On hold', Icon: ClockIcon },
    escalated: {
      cls: 'bg-orange-50 text-orange-700',
      label: 'Escalated',
      Icon: ChatBubbleLeftRightIcon,
    },
    resolved: {
      cls: 'bg-emerald-50 text-emerald-700',
      label: 'Resolved',
      Icon: CheckCircleIcon,
    },
    closed: { cls: 'bg-slate-100 text-slate-600', label: 'Closed', Icon: CheckCircleIcon },
    merged: { cls: 'bg-slate-50 text-slate-500', label: 'Merged', Icon: CheckCircleIcon },
    snoozed: { cls: 'bg-slate-50 text-slate-500', label: 'Snoozed', Icon: ClockIcon },
  }
  const entry = map[status] ?? map.open
  const { cls, label, Icon } = entry
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

// ── Handoff brief (§6.3) ──────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  vip_auto: 'VIP customer',
  sentiment: 'Negative sentiment',
  repeated_failure: 'Repeated failure',
  multi_turn_confusion: 'Going in circles',
  sla_pressure: 'SLA pressure',
  force_escalate: 'Sensitive intent',
  agent: 'AI handed off',
  ai_unknown: 'AI unsure',
  usage_cap: 'Reply cap reached',
  manual: 'Manually escalated',
  error: 'AI error',
}

function HandoffBriefCard({
  ticket,
  regenerating,
  onRegenerate,
  onUseSuggestion,
}: {
  ticket: SupportTicketRecord
  regenerating: boolean
  onRegenerate: () => void
  onUseSuggestion: (text: string) => void
}) {
  const brief = ticket.handoff_brief

  // No brief yet (still generating async, or generation failed) — offer to make one.
  if (!brief) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-semibold text-indigo-900">Handoff brief</p>
          </div>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60"
          >
            <ArrowPathIcon className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
            {regenerating ? 'Generating…' : 'Generate'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-indigo-700/70">
          Lira can summarize who this is, what they need, and a suggested reply so you can act fast.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-semibold text-indigo-900">Handoff brief</p>
          {ticket.handoff_trigger && TRIGGER_LABELS[ticket.handoff_trigger] && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
              {TRIGGER_LABELS[ticket.handoff_trigger]}
            </span>
          )}
        </div>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-white disabled:opacity-60"
        >
          <ArrowPathIcon className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      <div className="space-y-4 p-4">
        <BriefRow label="Customer">{brief.customer_summary}</BriefRow>
        <BriefRow label="Issue">{brief.issue_summary}</BriefRow>

        {brief.what_agent_tried.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              What Lira tried
            </p>
            <ul className="space-y-1">
              {brief.what_agent_tried.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-300">→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            What you need to do
          </p>
          <p className="text-sm font-medium text-amber-900">{brief.what_human_needs_to_do}</p>
        </div>

        {brief.suggested_response && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Suggested reply
              </p>
              <button
                onClick={() => onUseSuggestion(brief.suggested_response)}
                className="rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-800"
              >
                Use this reply
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
              {brief.suggested_response}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function BriefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  )
}

// ── Resolve + round-trip learning (§6.4) ──────────────────────────────────────

function ResolveModal({
  resolving,
  onClose,
  onResolve,
}: {
  resolving: boolean
  onClose: () => void
  onResolve: (feedback?: ResolveTicketFeedback) => void
}) {
  const [assessment, setAssessment] = useState<ResolveTicketFeedback['ai_assessment']>()
  const [knowledgeGap, setKnowledgeGap] = useState(false)
  const [gapNote, setGapNote] = useState('')
  const [outcomeNote, setOutcomeNote] = useState('')

  const willDraft = knowledgeGap || assessment === 'wrong' || assessment === 'partial'

  const submit = () => {
    onResolve({
      ai_assessment: assessment,
      knowledge_gap: knowledgeGap || undefined,
      gap_note: gapNote.trim() || undefined,
      outcome_note: outcomeNote.trim() || undefined,
    })
  }

  const assessmentOptions: {
    value: NonNullable<ResolveTicketFeedback['ai_assessment']>
    label: string
    cls: string
  }[] = [
    { value: 'correct', label: 'AI was right', cls: 'data-[on=true]:bg-emerald-600' },
    { value: 'partial', label: 'Partly right', cls: 'data-[on=true]:bg-amber-500' },
    { value: 'wrong', label: 'AI was wrong', cls: 'data-[on=true]:bg-red-600' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Resolve ticket</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          Tell Lira how this went — it's optional, and it's how Lira gets better at handling this
          next time.
        </p>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              How did the AI do?
            </p>
            <div className="flex gap-1.5">
              {assessmentOptions.map((opt) => (
                <button
                  key={opt.value}
                  data-on={assessment === opt.value}
                  onClick={() => setAssessment(assessment === opt.value ? undefined : opt.value)}
                  className={cn(
                    'flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 transition data-[on=true]:border-transparent data-[on=true]:text-white',
                    opt.cls
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              What did you do to resolve it?
            </p>
            <textarea
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              rows={3}
              placeholder="e.g. Issued the refund and confirmed the new plan price."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={knowledgeGap}
              onChange={(e) => setKnowledgeGap(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Knowledge was missing that should be added to the KB</span>
          </label>

          {knowledgeGap && (
            <textarea
              value={gapNote}
              onChange={(e) => setGapNote(e.target.value)}
              rows={2}
              placeholder="What was missing? (optional)"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          )}

          {willDraft && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
              <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Lira will draft a KB entry from your answer and queue it for review.</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => onResolve()}
            disabled={resolving}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 disabled:opacity-60"
          >
            Skip &amp; resolve
          </button>
          <button
            onClick={submit}
            disabled={resolving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {resolving ? 'Resolving…' : 'Resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Integrations panel (Phase 6 §4.4 + §4.5 + Phase 7 §5.5) ──────────────
//
// Three operator surfaces glued into one card on the ticket detail:
//   • External links — list of Slack/Linear/webhook back-pointers + manual
//     add form (operator pasted a Linear URL after a side-conversation).
//   • Force sync — small button group, one per provider. Enqueues a fresh
//     delivery (useful after fixing a Slack channel id or Linear team).
//   • Audit export — JSON / CSV download of the immutable event timeline.

const PROVIDER_OPTIONS: { value: OutboxProvider; label: string }[] = [
  { value: 'slack', label: 'Slack' },
  { value: 'linear', label: 'Linear' },
  { value: 'webhook', label: 'Webhook' },
]

function IntegrationsPanel({ orgId, ticketId }: { orgId: string; ticketId: string }) {
  const [links, setLinks] = useState<ExternalLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<OutboxProvider | null>(null)
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null)

  const loadLinks = useCallback(async () => {
    setLoadingLinks(true)
    try {
      const next = await listExternalLinks(orgId, ticketId)
      setLinks(next)
    } catch {
      // External links are non-critical — fail quietly. The empty-state copy
      // covers both "none yet" and "couldn't load".
      setLinks([])
    } finally {
      setLoadingLinks(false)
    }
  }, [orgId, ticketId])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  const handleSync = useCallback(
    async (provider: OutboxProvider) => {
      setSyncing(provider)
      try {
        await forceSyncTicket(orgId, ticketId, provider)
        toast.success(`Sync to ${provider} queued`)
        // External links may show up after the worker drains — poll once.
        window.setTimeout(() => void loadLinks(), 1500)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to sync to ${provider}`)
      } finally {
        setSyncing(null)
      }
    },
    [orgId, ticketId, loadLinks]
  )

  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      setExporting(format)
      try {
        const filename = await downloadTicketAudit(orgId, ticketId, format)
        toast.success(`Downloaded ${filename}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Audit export failed')
      } finally {
        setExporting(null)
      }
    },
    [orgId, ticketId]
  )

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">Integrations &amp; audit</h2>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            External links
          </p>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            className="text-[11px] font-semibold text-[#020308] underline-offset-2 hover:underline"
          >
            {adding ? 'Cancel' : '+ Add link'}
          </button>
        </div>

        {loadingLinks ? (
          <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
        ) : links.length === 0 ? (
          <p className="text-[12px] text-gray-400">
            No external links yet. Force-sync below, or paste one manually.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {links.map((l, idx) => (
              <li
                key={`${l.provider}-${l.external_id}-${idx}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-1.5"
              >
                <ProviderBadgeInline provider={l.provider} />
                <code className="flex-1 truncate font-mono text-[11px] text-gray-600">
                  {l.external_id}
                </code>
                <a
                  href={l.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#020308] hover:underline"
                >
                  Open
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {adding && (
          <AddExternalLinkForm
            onSubmit={async (payload) => {
              try {
                const created = await createExternalLink(orgId, ticketId, payload)
                setLinks((prev) => [...prev, created])
                setAdding(false)
                toast.success('Link added')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to add link')
              }
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Force sync
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROVIDER_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleSync(p.value)}
              disabled={syncing !== null}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900',
                syncing === p.value && 'cursor-wait opacity-70'
              )}
            >
              <ArrowPathIcon
                className={cn('h-3 w-3', syncing === p.value && 'animate-spin')}
                aria-hidden
              />
              Sync to {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Audit export
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Immutable event timeline. Use for compliance reviews and post-incident analysis.
            </p>
          </div>
          <div className="flex gap-1.5">
            {(['json', 'csv'] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => handleExport(format)}
                disabled={exporting !== null}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900',
                  exporting === format && 'cursor-wait opacity-70'
                )}
              >
                <ArrowDownTrayIcon className="h-3 w-3" aria-hidden />
                {exporting === format ? '…' : format}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddExternalLinkForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: {
    provider: OutboxProvider
    external_id: string
    external_url: string
  }) => Promise<void>
  onCancel: () => void
}) {
  const [provider, setProvider] = useState<OutboxProvider>('linear')
  const [externalId, setExternalId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!externalId.trim() || !externalUrl.trim()) return
        setSubmitting(true)
        try {
          await onSubmit({
            provider,
            external_id: externalId.trim(),
            external_url: externalUrl.trim(),
          })
        } finally {
          setSubmitting(false)
        }
      }}
      className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
    >
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as OutboxProvider)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none"
        >
          {PROVIDER_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder={
            provider === 'linear' ? 'LIR-1234' : provider === 'slack' ? '1716895200.000123' : 'id'
          }
          className="rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none"
        />
      </div>
      <input
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
        placeholder="https://…"
        type="url"
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-gray-500 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !externalId.trim() || !externalUrl.trim()}
          className="rounded-md bg-[#020308] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add link'}
        </button>
      </div>
    </form>
  )
}

const PROVIDER_INLINE_COLOR: Record<OutboxProvider, string> = {
  slack: 'bg-[#4A154B]/10 text-[#4A154B]',
  linear: 'bg-[#5E6AD2]/10 text-[#5E6AD2]',
  webhook: 'bg-gray-100 text-gray-700',
}

function ProviderBadgeInline({ provider }: { provider: OutboxProvider }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        PROVIDER_INLINE_COLOR[provider]
      )}
    >
      {provider}
    </span>
  )
}

// ── Lifecycle action bar (§1.1) ──────────────────────────────────────────
//
// Discrete POST-driven status transitions. Each button only renders when
// the destination transition is *useful* from the current state — e.g. no
// "Reopen" on a ticket that isn't already terminal, no "Mark pending" if
// it's already pending.
//
// We deliberately don't render an "Escalate" button here because escalation
// requires a target (tier/queue/user) and deserves its own modal — that
// belongs in a follow-up. The "Ack escalation" button does appear when the
// ticket is already escalated so the on-call can clear the flag.

function LifecycleBar({
  ticket,
  acting,
  disabled,
  onMarkPending,
  onMarkOnHold,
  onReopen,
  onClose,
  onClassify,
  onRoute,
  onAckEscalation,
}: {
  ticket: SupportTicketRecord
  acting: string | null
  disabled?: boolean
  onMarkPending: () => void
  onMarkOnHold: () => void
  onReopen: () => void
  onClose: () => void
  onClassify: () => void
  onRoute: () => void
  onAckEscalation: () => void
}) {
  const s = ticket.status as string
  const isActive = s === 'open' || s === 'in_progress'
  const isTerminal = s === 'resolved' || s === 'closed' || s === 'merged'

  const actions: { key: string; label: string; show: boolean; onClick: () => void }[] = [
    { key: 'pending', label: 'Mark pending', show: isActive, onClick: onMarkPending },
    { key: 'on-hold', label: 'Put on hold', show: isActive, onClick: onMarkOnHold },
    { key: 'reopen', label: 'Reopen', show: s === 'resolved' || s === 'closed', onClick: onReopen },
    {
      key: 'close',
      label: 'Close',
      show: s === 'resolved' || s === 'pending' || s === 'on_hold',
      onClick: onClose,
    },
    { key: 'classify', label: 'Re-classify', show: !isTerminal, onClick: onClassify },
    { key: 'route', label: 'Re-route', show: !isTerminal, onClick: onRoute },
    {
      key: 'ack-escalation',
      label: 'Ack escalation',
      show: s === 'escalated',
      onClick: onAckEscalation,
    },
  ].filter((a) => a.show)

  if (actions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Actions
      </span>
      {actions.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={a.onClick}
          disabled={disabled || acting !== null}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900',
            acting === a.key && 'cursor-wait opacity-70'
          )}
        >
          {acting === a.key ? '…' : a.label}
        </button>
      ))}
    </div>
  )
}

// ── Inline PATCH controls (priority / category / queue / assignee) ───────
//
// Compact <select> row that PATCHes on change. Each control is optimistic
// — the new value renders immediately, then the server-acknowledged ticket
// replaces it on success or rolls back on failure.

function TicketPropertyControls({
  orgId,
  ticket,
  onTicketUpdate,
}: {
  orgId: string
  ticket: SupportTicketRecord
  onTicketUpdate: (t: SupportTicketRecord) => void
}) {
  const [queues, setQueues] = useState<SupportQueue[]>([])
  const [categories, setCategories] = useState<TicketCategoryRecord[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    listQueues(orgId)
      .then(setQueues)
      .catch(() => setQueues([]))
    listTicketCategories(orgId)
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [orgId])

  const wrap = useCallback(
    async <T,>(label: string, op: () => Promise<T>, after: (t: T) => void) => {
      setBusy(label)
      try {
        const res = await op()
        after(res)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to update ${label}`)
      } finally {
        setBusy(null)
      }
    },
    []
  )

  const selectClass =
    'rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none disabled:opacity-50'

  // The current ticket type narrows the assignee union — we can't pull org
  // members from a single endpoint yet, so the assign control is a free-text
  // user-id input for now (consistent with the way handoff-brief surfaces it).
  const currentCategory = (ticket as SupportTicketRecord & { category?: string }).category ?? ''

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
      <PropertyField label="Priority">
        <select
          value={ticket.priority}
          disabled={busy !== null}
          onChange={(e) =>
            void wrap(
              'priority',
              () =>
                setTicketPriority(
                  orgId,
                  ticket.ticket_id,
                  e.target.value as SupportTicketRecord['priority']
                ),
              onTicketUpdate
            )
          }
          className={selectClass}
        >
          {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </PropertyField>

      <PropertyField label="Category">
        <select
          value={currentCategory}
          disabled={busy !== null}
          onChange={(e) =>
            void wrap(
              'category',
              () => setTicketCategory(orgId, ticket.ticket_id, e.target.value),
              onTicketUpdate
            )
          }
          className={selectClass}
        >
          {currentCategory === '' && <option value="">(none)</option>}
          {categories.length === 0 && currentCategory !== '' && (
            <option value={currentCategory}>{currentCategory}</option>
          )}
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.label}
            </option>
          ))}
        </select>
      </PropertyField>

      <PropertyField label="Queue">
        <select
          value={(ticket as SupportTicketRecord & { queue_id?: string }).queue_id ?? ''}
          disabled={busy !== null}
          onChange={(e) =>
            void wrap(
              'queue',
              () => setTicketQueue(orgId, ticket.ticket_id, e.target.value || null),
              onTicketUpdate
            )
          }
          className={selectClass}
        >
          <option value="">(unrouted)</option>
          {queues.map((q) => (
            <option key={q.queue_id} value={q.queue_id}>
              {q.name}
            </option>
          ))}
        </select>
      </PropertyField>

      <PropertyField label="Assignee">
        <AssigneeInput
          value={ticket.assignee_user_id ?? ''}
          disabled={busy !== null}
          onCommit={(userId) =>
            void wrap(
              'assignee',
              () => assignTicket(orgId, ticket.ticket_id, userId || null),
              onTicketUpdate
            )
          }
        />
      </PropertyField>
    </div>
  )
}

function PropertyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function AssigneeInput({
  value,
  disabled,
  onCommit,
}: {
  value: string
  disabled?: boolean
  onCommit: (userId: string) => void
}) {
  // Mirror prop into local state so the user can type without parent re-
  // sync. Use the "store previous render" pattern instead of a setState-in-
  // effect (React-recommended, satisfies react-hooks/set-state-in-effect).
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [local, setLocal] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setLocal(value)
  }
  return (
    <input
      type="text"
      value={local}
      placeholder="user-id"
      disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className="rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none disabled:opacity-50"
    />
  )
}

// Tiny relative-time helper for the operator surface (§11 — "no raw ISO").
// Tooltips still carry the absolute timestamp; visible text is relative,
// e.g. "23m", "1h 12m", "yesterday", or a short date past 14 days.
function relativeTimeShort(iso: string, now: number): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = now - t
  const abs = Math.abs(diff)
  if (abs < 45_000) return 'just now'
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m ago`
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h ago`
  if (abs < 7 * 86_400_000) return `${Math.round(abs / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}

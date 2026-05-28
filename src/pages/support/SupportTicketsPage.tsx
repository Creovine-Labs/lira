import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  LightBulbIcon,
  PaperClipIcon,
  PlusIcon,
  SparklesIcon,
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
  createManualTicket,
  uploadTicketAttachment,
  type SupportTicketRecord,
  type SupportTicketMessageRecord,
  type TicketAttachmentRecord,
  type ResolveTicketFeedback,
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
  const [showNew, setShowNew] = useState(false)

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

        <HandoffBriefCard
          ticket={ticket}
          regenerating={regenerating}
          onRegenerate={handleRegenerateBrief}
          onUseSuggestion={(text) => {
            setReplyDraft(text)
            toast.success('Suggested reply loaded — edit before sending')
          }}
        />

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

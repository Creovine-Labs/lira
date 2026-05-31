// /portal/:orgId/tickets/:ticketNumber — full ticket thread + reply.
//
// Polling (per SUPPORT_TICKETING_API.md §7): every 3 s while the tab is
// focused, every 30 s when backgrounded. We bail out of polling entirely
// while a reply is in flight to avoid stomping the optimistic state.
//
// Reply behaviour (§2.4):
//   • `pending` tickets auto-reopen on reply.
//   • `resolved` tickets auto-reopen if inside the 14-day reopen window;
//     outside that window we still post but the customer should know they
//     should open a new ticket. We surface a calm helper note rather than
//     a hard block — backend is the source of truth.
//   • `closed`/`merged`/`snoozed` — composer is hidden, replaced by a
//     "this ticket is closed" notice with a link to start a new one.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCircleIcon,
  PaperClipIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  PortalTokenError,
  getPortalTicket,
  replyToPortalTicket,
  uploadPortalAttachment,
  type PortalAttachment,
  type PortalMessage,
  type PortalTicketDetail,
  type PortalTicketStatus,
} from '@/services/api/portal-api'
import {
  PortalCard,
  PortalLayout,
  PrimaryButton,
  SerifHeading,
  StatusBadge,
  SubtleText,
  TicketNumber,
  usePortalSession,
  type PortalMode,
} from './PortalChrome'
import { PortalCsatCard } from './PortalCsatCard'
import { fullDateTime, relativeTime, shortDate } from './portal-format'

const POLL_FOCUSED_MS = 3_000
const POLL_BACKGROUND_MS = 30_000
const MAX_ATTACHMENT_MB = 10
const ACCEPT_MIME = 'image/*,application/pdf,.txt,.csv,.md,.log'
const REOPEN_WINDOW_DAYS = 14
const TERMINAL_STATUSES: PortalTicketStatus[] = ['closed', 'merged', 'snoozed']

// Resolved at module load — safe outside render. We only need to know which
// hint to show for the keyboard shortcut; the value never changes per session.
const IS_MAC = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

export function PortalTicketDetailPage() {
  const { orgId = '', ticketNumber = '' } = useParams<{
    orgId: string
    ticketNumber: string
  }>()
  const navigate = useNavigate()
  const { ready: sessionReady, mode, auth } = usePortalSession(orgId)
  const hasAuth = auth !== null
  const [verifiedExpired, setVerifiedExpired] = useState(false)

  // Forced sign-out path on 401/403 anywhere in the app. Magic-link bounces
  // to the access page (with the ticket pre-scoped). Verified mode has no
  // recovery in the FE — render a "session expired" card.
  useEffect(() => {
    if (!orgId) return
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ orgId: string; authKind: PortalMode | null }>
      if (evt.detail?.orgId !== orgId) return
      if (evt.detail?.authKind === 'verified' || mode === 'verified') {
        setVerifiedExpired(true)
        return
      }
      navigate(`/portal/${orgId}/access?ticket=${encodeURIComponent(ticketNumber)}`, {
        replace: true,
      })
    }
    window.addEventListener('lira:portal-token-expired', handler)
    return () => window.removeEventListener('lira:portal-token-expired', handler)
  }, [orgId, ticketNumber, mode, navigate])

  const [detail, setDetail] = useState<PortalTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const sendingRef = useRef(false)
  useEffect(() => {
    sendingRef.current = sending
  }, [sending])

  const load = useCallback(
    async ({ silent }: { silent: boolean }) => {
      if (!orgId || !ticketNumber) return
      if (sendingRef.current && silent) return // don't fight an optimistic send
      if (!silent) setLoading(true)
      try {
        const next = await getPortalTicket(orgId, ticketNumber)
        setDetail((prev) => mergeOptimistic(prev, next))
        setError(null)
      } catch (err) {
        if (err instanceof PortalTokenError) return
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Could not load this ticket.')
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [orgId, ticketNumber]
  )

  // Initial load + visibility-aware polling.
  useEffect(() => {
    if (!sessionReady || !hasAuth || verifiedExpired) return
    void load({ silent: false })
    let intervalId: number | null = null
    const start = () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      const ms = document.visibilityState === 'visible' ? POLL_FOCUSED_MS : POLL_BACKGROUND_MS
      intervalId = window.setInterval(() => void load({ silent: true }), ms)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
      start()
    }
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [sessionReady, hasAuth, verifiedExpired, load])

  // Auto-scroll the thread to the bottom when new messages land.
  const threadEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(0)
  useEffect(() => {
    if (!detail) return
    const count = detail.messages.length
    if (count > lastMessageCountRef.current) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    lastMessageCountRef.current = count
  }, [detail])

  const onReplySent = useCallback(
    (
      optimistic: PortalMessage,
      server?: { message: PortalMessage; ticket: PortalTicketDetail['ticket'] }
    ) => {
      setDetail((prev) => {
        if (!prev) return prev
        if (server) {
          // Replace optimistic placeholder with the server-authored message.
          const messages = prev.messages.map((m) =>
            m.message_id === optimistic.message_id ? server.message : m
          )
          return { ticket: server.ticket, messages }
        }
        return { ...prev, messages: [...prev.messages, optimistic] }
      })
    },
    []
  )

  const onReplyFailed = useCallback((optimisticId: string) => {
    setDetail((prev) =>
      prev
        ? { ...prev, messages: prev.messages.filter((m) => m.message_id !== optimisticId) }
        : prev
    )
  }, [])

  if (!orgId || !ticketNumber) return <Navigate to="/" replace />
  if (!sessionReady) return null

  if (verifiedExpired) {
    return (
      <PortalLayout>
        <PortalCard className="space-y-3 text-center">
          <p className="text-[14px] font-semibold text-[#020308]">Your session has expired.</p>
          <SubtleText className="text-[13px]">
            Refresh the page to start a new session. If the issue persists, contact the team that
            embedded this portal.
          </SubtleText>
        </PortalCard>
      </PortalLayout>
    )
  }

  if (!hasAuth) {
    if (mode === 'verified') {
      return (
        <PortalLayout>
          <PortalCard className="space-y-3 text-center">
            <p className="text-[14px] font-semibold text-[#020308]">No active session.</p>
            <SubtleText className="text-[13px]">
              Open this page from your support embed to continue.
            </SubtleText>
          </PortalCard>
        </PortalLayout>
      )
    }
    return (
      <Navigate to={`/portal/${orgId}/access?ticket=${encodeURIComponent(ticketNumber)}`} replace />
    )
  }

  const backTo = mode === 'verified' ? `/verified/${orgId}/tickets` : `/portal/${orgId}/tickets`

  return (
    <PortalLayout backTo={backTo}>
      {loading && !detail ? (
        <DetailSkeleton />
      ) : error && !detail ? (
        <PortalCard className="space-y-3">
          <p className="text-[14px] font-semibold text-[#020308]">We couldn't load this ticket.</p>
          <SubtleText>{error}</SubtleText>
          <button
            type="button"
            onClick={() => void load({ silent: false })}
            className="text-[13px] font-medium text-[#020308] underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </PortalCard>
      ) : detail ? (
        <TicketView
          orgId={orgId}
          ticketNumber={ticketNumber}
          detail={detail}
          sending={sending}
          setSending={setSending}
          onReplySent={onReplySent}
          onReplyFailed={onReplyFailed}
          threadEndRef={threadEndRef}
        />
      ) : null}
    </PortalLayout>
  )
}

interface TicketViewProps {
  orgId: string
  ticketNumber: string
  detail: PortalTicketDetail
  sending: boolean
  setSending: (b: boolean) => void
  onReplySent: (
    optimistic: PortalMessage,
    server?: { message: PortalMessage; ticket: PortalTicketDetail['ticket'] }
  ) => void
  onReplyFailed: (optimisticId: string) => void
  threadEndRef: React.RefObject<HTMLDivElement | null>
}

function TicketView({
  orgId,
  ticketNumber,
  detail,
  sending,
  setSending,
  onReplySent,
  onReplyFailed,
  threadEndRef,
}: TicketViewProps) {
  const { ticket, messages } = detail
  const isTerminal = TERMINAL_STATUSES.includes(ticket.status)
  const isResolved = ticket.status === 'resolved'
  // `now` is captured at mount via lazy useState init so render stays pure
  // (react-hooks/purity disallows Date.now() during render). For a portal
  // session, a stable "now" is fine — the reopen-window threshold doesn't
  // need second-level freshness.
  const [now] = useState(() => Date.now())
  const isOutsideReopenWindow = useMemo(() => {
    if (!isResolved || !ticket.resolved_at) return false
    const resolvedAt = new Date(ticket.resolved_at).getTime()
    if (!Number.isFinite(resolvedAt)) return false
    return now - resolvedAt > REOPEN_WINDOW_DAYS * 86_400_000
  }, [isResolved, ticket.resolved_at, now])

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <TicketNumber value={ticket.ticket_number} />
          <StatusBadge status={ticket.status} />
          <span className="text-[12px] text-[#020308]/45">
            Opened {shortDate(ticket.created_at)}
          </span>
        </div>
        <SerifHeading className="text-[28px] sm:text-[32px]">{ticket.subject}</SerifHeading>
        {isResolved && ticket.resolved_at && (
          <div className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" />
            Resolved {relativeTime(ticket.resolved_at)}
          </div>
        )}
      </header>

      <section className="space-y-3" aria-label="Conversation">
        {messages.length === 0 ? (
          <PortalCard>
            <SubtleText>This thread doesn't have any messages yet.</SubtleText>
          </PortalCard>
        ) : (
          messages.map((m) => <MessageRow key={m.message_id} message={m} />)
        )}
        <div ref={threadEndRef} />
      </section>

      {isResolved && <PortalCsatCard orgId={orgId} ticketNumber={ticket.ticket_number} />}

      {isTerminal ? (
        <ClosedNotice orgId={orgId} ticketNumber={ticketNumber} status={ticket.status} />
      ) : (
        <ReplyComposer
          orgId={orgId}
          ticketNumber={ticketNumber}
          isResolved={isResolved}
          isOutsideReopenWindow={isOutsideReopenWindow}
          sending={sending}
          setSending={setSending}
          onReplySent={onReplySent}
          onReplyFailed={onReplyFailed}
        />
      )}
    </div>
  )
}

// ── Message rendering ────────────────────────────────────────────────────

function MessageRow({ message }: { message: PortalMessage }) {
  if (message.sender === 'system') {
    return (
      <div className="flex justify-center py-1">
        <div className="rounded-full bg-[#020308]/[0.04] px-3 py-1 text-[11px] text-[#020308]/55">
          {message.body || 'System event'}
        </div>
      </div>
    )
  }

  const isCustomer = message.sender === 'visitor'
  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[85%] flex-col gap-1 ${isCustomer ? 'items-end' : 'items-start'}`}
      >
        <div className="flex items-center gap-2 px-1 text-[11px] text-[#020308]/45">
          <span className="font-semibold text-[#020308]/65">
            {isCustomer ? 'You' : (message.sender_name ?? 'Lira team')}
          </span>
          <span title={fullDateTime(message.created_at)}>{relativeTime(message.created_at)}</span>
        </div>
        <div
          className={
            isCustomer
              ? 'rounded-2xl rounded-br-md bg-[#020308] px-4 py-2.5 text-[14px] leading-6 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
              : 'rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-4 py-2.5 text-[14px] leading-6 text-[#020308] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
          }
        >
          {message.body && <div className="whitespace-pre-wrap break-words">{message.body}</div>}
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentList attachments={message.attachments} dark={isCustomer} />
          )}
        </div>
      </div>
    </div>
  )
}

function AttachmentList({
  attachments,
  dark,
}: {
  attachments: PortalAttachment[]
  dark?: boolean
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => {
        const isImage = a.content_type.startsWith('image/') && a.url
        if (isImage) {
          return (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-black/10 transition hover:opacity-95"
            >
              <img
                src={a.url}
                alt={a.name}
                className="max-h-44 max-w-[240px] object-cover"
                loading="lazy"
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
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition ${
              dark
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                : 'border-black/10 bg-[#020308]/[0.03] text-[#020308]/80 hover:bg-[#020308]/[0.06]'
            }`}
          >
            <PaperClipIcon className="h-3.5 w-3.5" />
            <span className="max-w-[180px] truncate">{a.name}</span>
          </a>
        )
      })}
    </div>
  )
}

// ── Closed notice ────────────────────────────────────────────────────────

function ClosedNotice({
  orgId: _orgId,
  ticketNumber: _ticketNumber,
  status,
}: {
  orgId: string
  ticketNumber: string
  status: PortalTicketStatus
}) {
  const label =
    status === 'merged' ? 'merged into another ticket' : status === 'snoozed' ? 'snoozed' : 'closed'

  return (
    <PortalCard className="space-y-3 border-dashed bg-[#020308]/[0.02]">
      <div className="flex items-start gap-3">
        <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#020308]/45" />
        <div className="space-y-1.5">
          <p className="text-[14px] font-semibold text-[#020308]">This ticket is {label}.</p>
          <SubtleText className="text-[13px]">
            You can't reply on this thread. If you still need help, open a new ticket from the place
            you started this one.
          </SubtleText>
        </div>
      </div>
    </PortalCard>
  )
}

// ── Reply composer ───────────────────────────────────────────────────────

interface ReplyComposerProps {
  orgId: string
  ticketNumber: string
  isResolved: boolean
  isOutsideReopenWindow: boolean
  sending: boolean
  setSending: (b: boolean) => void
  onReplySent: TicketViewProps['onReplySent']
  onReplyFailed: TicketViewProps['onReplyFailed']
}

function ReplyComposer({
  orgId,
  ticketNumber,
  isResolved,
  isOutsideReopenWindow,
  sending,
  setSending,
  onReplySent,
  onReplyFailed,
}: ReplyComposerProps) {
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<PortalAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = !sending && !uploading && (body.trim().length > 0 || attachments.length > 0)

  const send = useCallback(async () => {
    const text = body.trim()
    if (!text && attachments.length === 0) return
    if (sending) return

    setSending(true)
    const optimistic: PortalMessage = {
      message_id: `optimistic-${crypto.randomUUID()}`,
      ticket_id: '',
      sender: 'visitor',
      sender_name: 'You',
      body: text,
      attachments: attachments.length > 0 ? attachments : undefined,
      created_at: new Date().toISOString(),
    }
    onReplySent(optimistic)
    setBody('')
    setAttachments([])

    try {
      const res = await replyToPortalTicket(orgId, ticketNumber, {
        body: text || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
      onReplySent(optimistic, res)
    } catch (err) {
      onReplyFailed(optimistic.message_id)
      // Restore the customer's draft so they don't lose their message.
      setBody(text)
      setAttachments(attachments)
      toast.error(err instanceof Error ? err.message : 'Could not send your reply.')
    } finally {
      setSending(false)
    }
  }, [body, attachments, sending, orgId, ticketNumber, onReplySent, onReplyFailed, setSending])

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (canSend) void send()
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (canSend) void send()
  }

  async function handleFile(file: File) {
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      toast.error(`Files must be under ${MAX_ATTACHMENT_MB} MB.`)
      return
    }
    setUploading(true)
    try {
      const a = await uploadPortalAttachment(orgId, ticketNumber, file)
      setAttachments((prev) => [...prev, a])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section aria-label="Reply" className="space-y-3">
      {isResolved && (
        <div
          className={`rounded-lg px-3 py-2 text-[12px] ${
            isOutsideReopenWindow
              ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/15'
              : 'bg-[#020308]/[0.04] text-[#020308]/65'
          }`}
        >
          {isOutsideReopenWindow
            ? 'This ticket was resolved more than 14 days ago. Replies may not reopen it — consider starting a new ticket.'
            : 'Replying will reopen this resolved ticket.'}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus-within:border-[#020308]/30 focus-within:ring-2 focus-within:ring-[#020308]/10"
      >
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          rows={4}
          placeholder="Add to this thread…"
          aria-label="Your reply"
          disabled={sending}
          className="block w-full resize-none bg-transparent px-4 py-3 text-[14px] text-[#020308] outline-none placeholder:text-[#020308]/35"
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-black/[0.06] bg-[#020308]/[0.015] px-3 py-2">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] text-[#020308]/70"
              >
                <PaperClipIcon className="h-3 w-3" />
                <span className="max-w-[160px] truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  className="ml-0.5 rounded text-[#020308]/40 transition hover:text-[#020308]"
                  aria-label={`Remove ${a.name}`}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#020308]/[0.015] px-3 py-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-[#020308]/55 transition hover:bg-black/[0.04] hover:text-[#020308]">
            <PaperClipIcon className="h-3.5 w-3.5" />
            {uploading ? 'Uploading…' : 'Attach'}
            <input
              type="file"
              className="hidden"
              accept={ACCEPT_MIME}
              disabled={uploading || sending}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void handleFile(file)
              }}
            />
          </label>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-[#020308]/40 sm:inline">
              {IS_MAC ? '⌘' : 'Ctrl'} + Enter
            </span>
            <PrimaryButton type="submit" disabled={!canSend} className="px-4 py-2 text-[13px]">
              {sending ? 'Sending…' : 'Send reply'}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </section>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-[#020308]/[0.06]" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-[#020308]/[0.06]" />
      </div>
      <div className="space-y-3">
        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-[#020308]/[0.04]" />
        <div className="ml-auto h-16 w-2/3 animate-pulse rounded-2xl bg-[#020308]/[0.04]" />
        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-[#020308]/[0.04]" />
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-[#020308]/[0.04]" />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * When a poll resolves, keep any unconfirmed optimistic messages (sender
 * = 'visitor' with `message_id` starting `optimistic-`) appended after the
 * server thread so they don't disappear mid-send. The send flow swaps them
 * out itself once the API responds.
 */
function mergeOptimistic(
  prev: PortalTicketDetail | null,
  next: PortalTicketDetail
): PortalTicketDetail {
  if (!prev) return next
  const optimistic = prev.messages.filter((m) => m.message_id.startsWith('optimistic-'))
  if (optimistic.length === 0) return next
  return { ticket: next.ticket, messages: [...next.messages, ...optimistic] }
}

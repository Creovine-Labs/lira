import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TagIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'
import type {
  ConversationMessage,
  ConversationStatus,
  SupportConversation,
} from '@/services/api/support-api'

type ComposerTab = 'reply' | 'escalate'

const STATUS_TONES: Record<
  ConversationStatus,
  { label: string; badge: string; dot: string; panel: string; text: string }
> = {
  open: {
    label: 'Open',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    panel: 'border-blue-100 bg-blue-50/60',
    text: 'text-blue-700',
  },
  pending: {
    label: 'Pending',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    panel: 'border-amber-100 bg-amber-50/70',
    text: 'text-amber-700',
  },
  escalated: {
    label: 'Human takeover',
    badge: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
    panel: 'border-red-100 bg-red-50/70',
    text: 'text-red-700',
  },
  resolved: {
    label: 'Resolved',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    panel: 'border-emerald-100 bg-emerald-50/70',
    text: 'text-emerald-700',
  },
}

function SupportConversationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { id: convId } = useParams<{ id: string }>()
  const { currentOrgId, organizations, setCurrentOrg } = useOrgStore()
  const clearCredentials = useAuthStore((s) => s.clearCredentials)
  const clearOrgStore = useOrgStore((s) => s.clear)
  const isFromNotifications = location.pathname.startsWith('/support/notifications/')

  const linkedOrgId = searchParams.get('org')
  const linkedOrgName = searchParams.get('orgName')
  const [showOrgMismatch, setShowOrgMismatch] = useState(false)

  useEffect(() => {
    if (!linkedOrgId || !currentOrgId) return
    if (linkedOrgId === currentOrgId) {
      if (searchParams.has('org')) {
        navigate(location.pathname, { replace: true })
      }
      return
    }

    const matchedOrg = organizations.find((org) => org.org_id === linkedOrgId)
    if (matchedOrg) {
      setCurrentOrg(linkedOrgId)
      navigate(location.pathname, { replace: true })
    } else {
      setShowOrgMismatch(true)
    }
  }, [
    linkedOrgId,
    currentOrgId,
    organizations,
    setCurrentOrg,
    navigate,
    location.pathname,
    searchParams,
  ])

  const handleLogoutAndRedirect = useCallback(() => {
    clearCredentials()
    clearOrgStore()
    navigate('/login', { replace: true })
  }, [clearCredentials, clearOrgStore, navigate])

  const {
    selectedConversation: conv,
    loadConversation,
    sendReply,
    resolveConversation,
    deleteConversation,
    escalateConversation,
    handbackToLira,
    updateTags,
    sendTypingIndicator,
  } = useSupportStore()
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<ComposerTab>('reply')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [newTag, setNewTag] = useState('')
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasHumanReply = useMemo(
    () => conv?.messages.some((message) => message.role === 'agent') ?? false,
    [conv?.messages]
  )

  const title = useMemo(() => (conv ? getConversationTitle(conv) : 'Conversation'), [conv])
  const customerDisplay = useMemo(() => (conv ? getCustomerDisplay(conv) : null), [conv])
  const latestMessage = conv?.messages[conv.messages.length - 1]
  const lastCustomerMessage = useMemo(() => (conv ? getLastCustomerMessage(conv) : null), [conv])

  useEffect(() => {
    if (!currentOrgId || !convId) return
    loadConversation(currentOrgId, convId)
  }, [currentOrgId, convId, loadConversation])

  useEffect(() => {
    if (!currentOrgId || !convId) return
    if (conv?.status === 'resolved') return
    const id = setInterval(() => {
      loadConversation(currentOrgId, convId)
    }, 2000)
    return () => clearInterval(id)
  }, [currentOrgId, convId, conv?.status, loadConversation])

  const handleSendReply = useCallback(async () => {
    if (!currentOrgId || !convId || !replyBody.trim()) return
    setSending(true)
    try {
      await sendReply(currentOrgId, convId, replyBody.trim())
      setReplyBody('')
      toast.success('Reply sent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }, [currentOrgId, convId, replyBody, sendReply])

  const handleResolve = useCallback(async () => {
    if (!currentOrgId || !convId) return
    try {
      await resolveConversation(currentOrgId, convId)
      await loadConversation(currentOrgId, convId)
      toast.success('Conversation resolved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve')
    }
  }, [currentOrgId, convId, loadConversation, resolveConversation])

  const handleEscalate = useCallback(async () => {
    if (!currentOrgId || !convId || !escalateReason.trim()) return
    try {
      await escalateConversation(currentOrgId, convId, escalateReason.trim())
      setEscalateReason('')
      toast.success('Conversation escalated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to escalate')
    }
  }, [currentOrgId, convId, escalateReason, escalateConversation])

  const handleHandback = useCallback(async () => {
    if (!currentOrgId || !convId) return
    try {
      await handbackToLira(currentOrgId, convId)
      toast.success('Handed back to Lira')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to hand back')
    }
  }, [currentOrgId, convId, handbackToLira])

  const handleDelete = useCallback(async () => {
    if (!currentOrgId || !convId) return
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    try {
      await deleteConversation(currentOrgId, convId)
      toast.success('Conversation deleted')
      navigate('/support')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }, [currentOrgId, convId, deleteConversation, navigate])

  const handleAddTag = useCallback(async () => {
    if (!currentOrgId || !convId || !newTag.trim()) return
    const existing = conv?.tags ?? []
    const tag = newTag.trim().toLowerCase()
    if (existing.includes(tag)) {
      setNewTag('')
      return
    }
    try {
      await updateTags(currentOrgId, convId, [...existing, tag])
      setNewTag('')
    } catch {
      toast.error('Failed to add tag')
    }
  }, [currentOrgId, convId, newTag, conv?.tags, updateTags])

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      if (!currentOrgId || !convId) return
      const existing = conv?.tags ?? []
      try {
        await updateTags(
          currentOrgId,
          convId,
          existing.filter((value) => value !== tag)
        )
      } catch {
        toast.error('Failed to remove tag')
      }
    },
    [currentOrgId, convId, conv?.tags, updateTags]
  )

  const handleReplyChange = useCallback(
    (value: string) => {
      setReplyBody(value)
      if (!currentOrgId || !convId) return
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        sendTypingIndicator(currentOrgId, convId)
      }, 400)
    },
    [currentOrgId, convId, sendTypingIndicator]
  )

  if (!conv) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f4f4f5]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
      </div>
    )
  }

  if (showOrgMismatch) {
    const displayName = linkedOrgName || linkedOrgId || 'the correct organization'
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f4f4f5] px-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-950">Wrong organization</h2>
          <p className="mb-1 text-sm text-gray-600">This conversation belongs to:</p>
          <p className="mb-4 text-base font-bold text-[#3730a3]">{displayName}</p>
          <p className="mb-6 text-sm text-gray-500">
            Please log in with an account that has access to this organization.
          </p>
          <button
            type="button"
            onClick={handleLogoutAndRedirect}
            className="w-full rounded-md bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81]"
          >
            Log in to {displayName}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowOrgMismatch(false)
              navigate('/support', { replace: true })
            }}
            className="mt-3 w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Stay in current organization
          </button>
        </div>
      </div>
    )
  }

  const statusTone = STATUS_TONES[conv.status]
  const tags = conv.tags ?? []

  return (
    <div className="min-h-full bg-[#f4f4f5] text-gray-950">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(isFromNotifications ? '/support/notifications' : '/support')}
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
              aria-label="Back to support inbox"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {conv.display_id && (
                  <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">
                    #{conv.display_id}
                  </span>
                )}
                <StatusBadge status={conv.status} />
              </div>
              <h1 className="max-w-3xl truncate text-xl font-bold tracking-normal text-gray-950 lg:text-2xl">
                {title}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                <span>{customerDisplay?.name ?? 'Unknown customer'}</span>
                <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:inline-block" />
                <span className="capitalize">{conv.channel}</span>
                <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:inline-block" />
                <span>Updated {timeAgo(conv.updated_at)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-950"
            >
              <UserCircleIcon className="h-4 w-4" />
              Details
            </button>
            {conv.status === 'escalated' && (
              <button
                type="button"
                onClick={handleHandback}
                disabled={!hasHumanReply}
                title={
                  hasHumanReply
                    ? 'Let Lira continue this conversation'
                    : 'Reply to the customer first before handing back to Lira'
                }
                className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-900 bg-white px-3 text-xs font-semibold text-gray-950 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <img src="/lira_black.png" alt="" className="h-3.5 w-3.5 object-contain" />
                Hand to Lira
              </button>
            )}
            {conv.status !== 'resolved' && (
              <button
                type="button"
                onClick={handleResolve}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Resolve
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              title="Delete conversation"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-5">
        <main className="min-w-0 space-y-4">
          {(lastCustomerMessage || conv.summary) && (
            <section className={cn('rounded-lg border px-4 py-3 shadow-sm', statusTone.panel)}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-gray-700 shadow-sm ring-1 ring-black/5">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-gray-800">
                    {conv.summary ?? lastCustomerMessage?.body}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-950">Conversation</h2>
              {latestMessage && (
                <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-500">
                  Latest {timeAgo(latestMessage.timestamp)}
                </span>
              )}
            </div>
            <div className="space-y-4 px-4 py-4">
              {conv.messages.map((message, index) => {
                const isLastMsg = index === conv.messages.length - 1
                const isAgentOrLira = message.role === 'agent' || message.role === 'lira'
                // Show "Seen" on the most recent agent/lira message if customer viewed it after
                const showSeen =
                  isAgentOrLira &&
                  isLastMsg &&
                  !!conv.customer_last_seen_at &&
                  conv.customer_last_seen_at >= message.timestamp
                return (
                  <TimelineMessage
                    key={message.id}
                    message={message}
                    customerName={customerDisplay?.name ?? 'Customer'}
                    isLast={isLastMsg}
                    showSeen={showSeen}
                    seenAt={showSeen ? conv.customer_last_seen_at : undefined}
                  />
                )
              })}
              {conv.customer_is_typing && (
                <div className="flex items-center gap-2 pl-1 pt-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-400">
                    {(customerDisplay?.name ?? 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </span>
                    <span className="ml-1.5 text-[11px] font-medium text-gray-400">
                      {customerDisplay?.name ?? 'Customer'} is typing…
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="sticky bottom-4 z-10 rounded-lg border border-gray-200 bg-white p-3 shadow-lg shadow-gray-900/5">
            {conv.status === 'resolved' ? (
              <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-emerald-700">Conversation resolved</p>
              </div>
            ) : (
              <>
                {activeTab === 'reply' && (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={replyBody}
                      onChange={(event) => handleReplyChange(event.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="min-h-14 w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:border-[#3730a3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3730a3]/10"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('escalate')}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        Escalate
                      </button>
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={sending || !replyBody.trim()}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-[#3730a3] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        {sending ? 'Sending...' : 'Send reply'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'escalate' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-gray-950">Escalate to a human</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('reply')}
                        className="text-xs font-semibold text-gray-500 transition hover:text-gray-950"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      value={escalateReason}
                      onChange={(event) => setEscalateReason(event.target.value)}
                      placeholder="Reason for escalation..."
                      rows={2}
                      className="min-h-14 w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleEscalate}
                        disabled={!escalateReason.trim()}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        Escalate
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {detailsOpen && (
          <div className="fixed inset-0 z-30 flex justify-end bg-gray-950/20 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="absolute inset-0 cursor-default"
              aria-label="Close details"
            />
            <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white p-5 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-950">Details</p>
                  <p className="mt-1 text-xs text-gray-500">Customer context, tags, and sources</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-950"
                  aria-label="Close details"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white">
                    {customerDisplay?.initials ?? 'CV'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-950">
                      {customerDisplay?.name ?? 'Website visitor'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {conv.customer?.email ?? customerDisplay?.email ?? 'No email captured'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniStat label="Tier" value={conv.customer?.tier ?? 'Standard'} />
                  <MiniStat
                    label="CSAT"
                    value={conv.csat_score ? `${conv.csat_score}/5` : 'None'}
                  />
                  <MiniStat label="Conversations" value={conv.customer?.total_conversations ?? 1} />
                  <MiniStat label="Escalations" value={conv.customer?.total_escalations ?? 0} />
                </div>
              </section>

              <SidebarSection title="Customer details">
                <InfoRow
                  icon={<BuildingOffice2Icon className="h-4 w-4" />}
                  label="Company"
                  value={conv.customer?.company ?? 'Unknown'}
                />
                <InfoRow
                  icon={<UserCircleIcon className="h-4 w-4" />}
                  label="Customer ID"
                  value={conv.customer_id}
                  truncate
                />
                <InfoRow
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Created"
                  value={formatDateTime(conv.created_at)}
                />
                <InfoRow
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Updated"
                  value={formatDateTime(conv.updated_at)}
                />
              </SidebarSection>

              <SidebarSection title="Tags">
                <TagEditor
                  tags={tags}
                  newTag={newTag}
                  onNewTagChange={setNewTag}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              </SidebarSection>

              {conv.knowledge_sources.length > 0 && (
                <SidebarSection title="Knowledge sources">
                  <div className="space-y-2">
                    {conv.knowledge_sources.map((source) => (
                      <div
                        key={source}
                        className="flex min-w-0 items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2 text-xs text-gray-600"
                      >
                        <BookOpenIcon className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">{source}</span>
                      </div>
                    ))}
                  </div>
                </SidebarSection>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  const tone = STATUS_TONES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide',
        tone.badge
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {tone.label}
    </span>
  )
}

function TimelineMessage({
  message,
  customerName,
  isLast,
  showSeen,
  seenAt,
}: {
  message: ConversationMessage
  customerName: string
  isLast: boolean
  showSeen?: boolean
  seenAt?: string
}) {
  if (message.role === 'system') {
    const isResolved = message.metadata?.event === 'conversation_resolved'
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-gray-200" />
        <div
          className={cn(
            'rounded-full border px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wide',
            isResolved
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          )}
          title={formatLongDateTime(message.timestamp)}
        >
          {message.body}
        </div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
    )
  }

  const isCustomer = message.role === 'customer'
  const isLira = message.role === 'lira'
  const senderName = isCustomer ? customerName : isLira ? 'Lira' : (message.sender_name ?? 'Agent')
  const avatar = getMessageAvatar(message, senderName)

  return (
    <div className="relative flex gap-3">
      {!isLast && <div className="absolute left-4 top-10 h-[calc(100%+1rem)] w-px bg-gray-200" />}
      <div
        className={cn(
          'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold shadow-sm',
          isCustomer
            ? 'border-gray-200 bg-white text-gray-600'
            : isLira
              ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
              : 'border-amber-100 bg-amber-50 text-amber-700'
        )}
      >
        {avatar}
      </div>
      <article
        className={cn(
          'min-w-0 flex-1 rounded-lg border p-4 shadow-sm',
          isCustomer
            ? 'border-gray-200 bg-white'
            : isLira
              ? 'border-indigo-100 bg-indigo-50/80'
              : 'border-amber-100 bg-amber-50/80'
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-950">{senderName}</span>
          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 ring-1 ring-black/5">
            {isCustomer ? 'Customer' : isLira ? 'Lira' : 'Agent'}
          </span>
          <span className="ml-auto text-[11px] font-medium text-gray-400">
            {formatLongDateTime(message.timestamp)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{message.body}</p>
        {showSeen && seenAt && (
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-500">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Seen {timeAgo(seenAt)}
          </div>
        )}
        {message.metadata?.grounded_in && message.metadata.grounded_in.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 text-[11px] font-medium text-gray-500">
            <span className="inline-flex items-center gap-1">
              <BookOpenIcon className="h-3.5 w-3.5" />
              {message.metadata.grounded_in.length} sources
            </span>
          </div>
        )}
      </article>
    </div>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({
  icon,
  label,
  value,
  truncate = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  truncate?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className={cn('text-sm font-semibold text-gray-800', truncate && 'truncate')}>{value}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="truncate text-sm font-bold capitalize text-gray-950">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  )
}

function TagEditor({
  tags,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[]
  newTag: string
  onNewTagChange: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 && (
          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
            No tags
          </span>
        )}
        {tags.map((tag) => (
          <span
            key={tag}
            className="group inline-flex items-center gap-1 rounded-md bg-gray-950 px-2 py-1 text-xs font-semibold text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="rounded-sm text-white/60 transition hover:text-white"
              aria-label={`Remove ${tag} tag`}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 focus-within:border-[#3730a3] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3730a3]/10">
        <TagIcon className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          value={newTag}
          onChange={(event) => onNewTagChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onAddTag()}
          placeholder="Add tag"
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
    </div>
  )
}

function getConversationTitle(conv: SupportConversation): string {
  return (
    conv.subject ??
    conv.intent ??
    conv.messages.find((message) => message.role === 'customer')?.body.slice(0, 80) ??
    'Conversation'
  )
}

function getCustomerDisplay(conv: SupportConversation) {
  const customerName =
    conv.customer?.name && conv.customer.name !== 'Visitor'
      ? conv.customer.name
      : conv.customer?.email
        ? conv.customer.email.split('@')[0].replace(/[._-]/g, ' ')
        : conv.channel === 'voice'
          ? 'Voice caller'
          : 'Website visitor'

  return {
    name: toTitleCase(customerName),
    email: conv.customer?.email,
    initials: getInitials(customerName),
  }
}

function getLastCustomerMessage(conv: SupportConversation): ConversationMessage | null {
  for (let index = conv.messages.length - 1; index >= 0; index -= 1) {
    const message = conv.messages[index]
    if (message.role === 'customer') return message
  }
  return null
}

function getMessageAvatar(message: ConversationMessage, senderName: string) {
  if (message.role === 'lira') {
    return <img src="/lira_black.png" alt="" className="h-4 w-4 object-contain" />
  }

  if (message.role === 'agent' && message.sender_avatar) {
    return (
      <img src={message.sender_avatar} alt="" className="h-full w-full rounded-lg object-cover" />
    )
  }

  if (message.role === 'agent') return 'A'
  return getInitials(senderName)
}

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'CV'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatLongDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export { SupportConversationPage }

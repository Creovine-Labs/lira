import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  BookOpenIcon,
  TrashIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'

function SupportConversationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { id: convId } = useParams<{ id: string }>()
  const { currentOrgId, organizations, setCurrentOrg } = useOrgStore()
  const clearCredentials = useAuthStore((s) => s.clearCredentials)
  const clearOrgStore = useOrgStore((s) => s.clear)
  const isFromNotifications = location.pathname.startsWith('/support/notifications/')

  // Org mismatch detection from email deep links (?org=...&orgName=...)
  const linkedOrgId = searchParams.get('org')
  const linkedOrgName = searchParams.get('orgName')
  const [showOrgMismatch, setShowOrgMismatch] = useState(false)

  useEffect(() => {
    if (!linkedOrgId || !currentOrgId) return
    if (linkedOrgId === currentOrgId) {
      // Correct org — strip query params for a clean URL
      if (searchParams.has('org')) {
        navigate(location.pathname, { replace: true })
      }
      return
    }
    // Check if the user has the linked org in their org list
    const matchedOrg = organizations.find((o) => o.org_id === linkedOrgId)
    if (matchedOrg) {
      // User belongs to this org — switch automatically
      setCurrentOrg(linkedOrgId)
      navigate(location.pathname, { replace: true })
    } else {
      // Wrong account or no access — show modal
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
  const [activeTab, setActiveTab] = useState<'reply' | 'escalate' | 'note'>('reply')
  const [escalateReason, setEscalateReason] = useState('')
  const [newTag, setNewTag] = useState('')
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // "Hand to Lira" only clickable once a human agent has replied
  const hasHumanReply = useMemo(
    () => conv?.messages.some((m) => m.role === 'agent') ?? false,
    [conv?.messages]
  )

  useEffect(() => {
    if (!currentOrgId || !convId) return
    loadConversation(currentOrgId, convId)
  }, [currentOrgId, convId, loadConversation])

  // Real-time poll: refresh conversation messages every 4s when viewing an open/escalated conversation
  useEffect(() => {
    if (!currentOrgId || !convId) return
    if (conv?.status === 'resolved') return
    const id = setInterval(() => {
      loadConversation(currentOrgId, convId)
    }, 4000)
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
      toast.success('Conversation resolved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve')
    }
  }, [currentOrgId, convId, resolveConversation])

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
      navigate('/support/inbox')
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
          existing.filter((t) => t !== tag)
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
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
      </div>
    )
  }

  // Org mismatch modal — shown when the user clicks "Reply in Lira" from email but is in the wrong org/account
  if (showOrgMismatch) {
    const displayName = linkedOrgName || linkedOrgId || 'the correct organization'
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Wrong Organization</h2>
          <p className="text-sm text-gray-600 mb-1">This conversation belongs to:</p>
          <p className="text-base font-bold text-indigo-700 mb-4">{displayName}</p>
          <p className="text-sm text-gray-500 mb-6">
            Please log in with an account that has access to this organization.
          </p>
          <button
            onClick={handleLogoutAndRedirect}
            className="w-full rounded-lg bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#312e81] transition"
          >
            Log in to {displayName}
          </button>
          <button
            onClick={() => {
              setShowOrgMismatch(false)
              navigate('/support/inbox', { replace: true })
            }}
            className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Stay in current organization
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full bg-[#ebebeb]">
      {/* Main conversation area */}
      <div className="flex flex-1 flex-col px-5 py-7">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back + header */}
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() =>
                navigate(isFromNotifications ? '/support/notifications' : '/support/inbox')
              }
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {conv.display_id && (
                  <span className="shrink-0 text-xs font-bold text-gray-300">
                    #{conv.display_id}
                  </span>
                )}
                <h1 className="truncate text-lg font-extrabold text-gray-900">
                  {conv.subject ??
                    conv.intent ??
                    conv.messages.find((m) => m.role === 'customer')?.body.slice(0, 60) ??
                    'Conversation'}
                </h1>
              </div>
              <p className="text-xs text-gray-400">
                {conv.customer?.name && conv.customer.name !== 'Visitor'
                  ? conv.customer.name
                  : conv.customer?.email
                    ? conv.customer.email.split('@')[0].replace(/[._-]/g, ' ')
                    : conv.channel === 'voice'
                      ? 'Voice caller'
                      : 'Website visitor'}
                {conv.intent && (
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                    {conv.intent}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {conv.status === 'escalated' && (
                <button
                  onClick={handleHandback}
                  disabled={!hasHumanReply}
                  title={
                    hasHumanReply
                      ? 'Let Lira continue this conversation'
                      : 'Reply to the customer first before handing back to Lira'
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-900 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <img src="/lira_black.png" alt="Lira" className="h-3.5 w-3.5 object-contain" />
                  Hand to Lira
                </button>
              )}
              {conv.status !== 'resolved' && (
                <button
                  onClick={handleResolve}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Resolve
                </button>
              )}
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                title="Delete conversation"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
              <span
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-bold uppercase',
                  conv.status === 'open'
                    ? 'bg-blue-100 text-blue-700'
                    : conv.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : conv.status === 'escalated'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                )}
              >
                {conv.status}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-gray-300" />
            {conv.tags?.map((tag) => (
              <span
                key={tag}
                className="group inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hidden text-gray-400 hover:text-red-500 group-hover:inline"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag…"
              className="w-20 border-none bg-transparent text-[11px] text-gray-400 placeholder:text-gray-300 focus:outline-none"
            />
          </div>

          {/* Messages */}
          <div className="mb-4 space-y-3">
            {conv.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-2xl p-4',
                  msg.role === 'customer'
                    ? 'border border-gray-100 bg-white'
                    : msg.role === 'lira'
                      ? 'border border-indigo-100 bg-indigo-50'
                      : 'border border-amber-100 bg-amber-50'
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  {msg.role === 'lira' ? (
                    <img src="/lira_black.png" alt="Lira" className="h-4 w-4 object-contain" />
                  ) : msg.role === 'agent' && msg.sender_avatar ? (
                    <img
                      src={msg.sender_avatar}
                      alt={msg.sender_name ?? 'Agent'}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : msg.role === 'agent' ? (
                    <UserCircleIcon className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <UserCircleIcon className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <span className="text-xs font-semibold text-gray-600">
                    {msg.role === 'customer'
                      ? (conv.customer?.name ?? 'Customer')
                      : msg.role === 'lira'
                        ? 'Lira'
                        : (msg.sender_name ?? 'Agent')}
                  </span>
                  <span className="text-[10px] text-gray-300">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                  {msg.metadata?.confidence != null && (
                    <span className="ml-auto text-[10px] text-gray-300">
                      {Math.round(msg.metadata.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{msg.body}</p>
                {msg.metadata?.grounded_in && msg.metadata.grounded_in.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                    <BookOpenIcon className="h-3 w-3" />
                    {msg.metadata.grounded_in.length} source(s) used
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action tabs */}
          <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
            <div className="flex border-b border-gray-100">
              {(['reply', 'escalate', 'note'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-2.5 text-xs font-semibold capitalize transition',
                    activeTab === tab
                      ? 'border-b-2 border-[#3730a3] text-[#3730a3]'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {tab === 'note' ? 'Internal Note' : tab}
                </button>
              ))}
            </div>

            <div className="p-4">
              {conv.status === 'resolved' ? (
                <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-green-700">
                    This conversation is resolved
                  </p>
                  <p className="mt-0.5 text-xs text-green-600">
                    No further messages can be sent. Re-open the conversation to reply.
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === 'reply' && (
                    <div className="space-y-3">
                      <textarea
                        value={replyBody}
                        onChange={(e) => handleReplyChange(e.target.value)}
                        placeholder="Type your reply…"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSendReply}
                          disabled={sending || !replyBody.trim()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#312e81] disabled:opacity-50 transition"
                        >
                          <PaperAirplaneIcon className="h-3.5 w-3.5" />
                          {sending ? 'Sending…' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'escalate' && (
                    <div className="space-y-3">
                      <textarea
                        value={escalateReason}
                        onChange={(e) => setEscalateReason(e.target.value)}
                        placeholder="Reason for escalation…"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleEscalate}
                          disabled={!escalateReason.trim()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        >
                          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                          Escalate
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'note' && (
                    <div className="space-y-3">
                      <textarea
                        placeholder="Internal note (not visible to customers)…"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                      />
                      <p className="text-[10px] text-gray-400">
                        Internal notes are for your team only
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar — customer info */}
      <aside className="hidden w-72 shrink-0 border-l border-gray-200 bg-white p-5 lg:block">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Customer</h3>
        {conv.customer ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                {conv.customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{conv.customer.name}</p>
                <p className="text-xs text-gray-400">{conv.customer.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <InfoRow label="Tier" value={conv.customer.tier} />
              <InfoRow label="Company" value={conv.customer.company ?? '—'} />
              <InfoRow label="Conversations" value={String(conv.customer.total_conversations)} />
              <InfoRow label="Escalations" value={String(conv.customer.total_escalations)} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No customer data</p>
        )}

        {/* CSAT */}
        {conv.csat_score && (
          <>
            <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
              Customer Satisfaction
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg text-amber-500">
                {'★'.repeat(conv.csat_score)}
                {'☆'.repeat(5 - conv.csat_score)}
              </span>
              <span className="text-xs font-semibold text-gray-600">{conv.csat_score}/5</span>
            </div>
          </>
        )}

        {/* Channel */}
        <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
          Channel
        </h3>
        <p className="text-xs font-medium text-gray-600 capitalize">{conv.channel}</p>

        {/* Actions taken */}
        {conv.action_ids.length > 0 && (
          <>
            <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
              Actions
            </h3>
            <p className="text-xs text-gray-500">{conv.action_ids.length} action(s) executed</p>
          </>
        )}

        {/* Knowledge sources */}
        {conv.knowledge_sources.length > 0 && (
          <>
            <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
              Sources
            </h3>
            <div className="space-y-1">
              {conv.knowledge_sources.map((src) => (
                <div key={src} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <BookOpenIcon className="h-3 w-3 text-gray-300" />
                  <span className="truncate">{src}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  )
}

export { SupportConversationPage }

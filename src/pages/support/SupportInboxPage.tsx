import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDownIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import type { ConversationStatus, SupportConversation } from '@/services/api/support-api'
import { cn } from '@/lib'

const STATUS_OPTIONS: { value: ConversationStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-600' },
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  { value: 'escalated', label: 'Escalated', color: 'bg-red-100 text-red-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
]

function statusBadgeClass(status: ConversationStatus): string {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-700'
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'escalated':
      return 'bg-red-100 text-red-700'
    case 'resolved':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function sentimentIcon(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😠'
    case 'urgent':
      return '🔴'
    default:
      return ''
  }
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

function SupportInboxPage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportInboxPanel />
      </div>
    </div>
  )
}

function SupportInboxPanel() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const {
    config,
    configLoading,
    conversations,
    conversationsLoading,
    loadConversations,
    stats,
    loadStats,
    statusFilter,
    setStatusFilter,
  } = useSupportStore()
  const [search, setSearch] = useState('')
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    if (!currentOrgId) return
    // Config is loaded and kept current by AppShell. Re-fetching here can race with a
    // fresh activation (DynamoDB eventual consistency) and overwrite activated:true with
    // stale data, causing the redirect guard below to fire incorrectly.
    loadConversations(currentOrgId)
    loadStats(currentOrgId)
  }, [currentOrgId, loadConversations, loadStats])

  // Redirect to activate if not activated or no config exists
  useEffect(() => {
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  const handleFilterChange = useCallback(
    (value: ConversationStatus | 'all') => {
      const status = value === 'all' ? null : value
      setStatusFilter(status)
      if (currentOrgId) {
        loadConversations(currentOrgId, status ?? undefined)
      }
    },
    [currentOrgId, setStatusFilter, loadConversations]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        c.subject?.toLowerCase().includes(q) ||
        c.customer?.name?.toLowerCase().includes(q) ||
        c.customer?.email?.toLowerCase().includes(q) ||
        c.intent?.toLowerCase().includes(q)
    )
  }, [conversations, search])

  return (
    <>
      {/* Collapsible Stats */}
      <button
        onClick={() => setShowStats((v) => !v)}
        className="mb-4 flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
      >
        <ChevronDownIcon
          className={cn('h-3 w-3 transition-transform', !showStats && '-rotate-90')}
        />
        {showStats ? 'Hide' : 'Show'} stats
      </button>

      {showStats && stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Open" value={stats.open_conversations} />
          <StatCard label="Autonomous" value={stats.resolved_autonomous} />
          <StatCard label="Escalated" value={stats.escalated} />
          <StatCard
            label="Avg CSAT"
            value={stats.avg_csat ? `${stats.avg_csat.toFixed(1)}/5` : '—'}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-white/60 bg-white p-1 shadow-sm">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                (statusFilter ?? 'all') === opt.value
                  ? 'bg-[#3730a3] text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-56 rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
          />
        </div>
      </div>

      {/* Conversation list */}
      {conversationsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
          <InboxIcon className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-400">No conversations yet</p>
          <p className="mt-1 text-xs text-gray-300">
            Conversations will appear here when customers reach out
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <ConversationRow
              key={conv.conv_id}
              conv={conv}
              onClick={() => navigate(`/support/inbox/${conv.conv_id}`)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function ConversationRow({ conv, onClick }: { conv: SupportConversation; onClick: () => void }) {
  const navigate = useNavigate()
  const lastMsg = conv.messages[conv.messages.length - 1]
  // Better customer name resolution
  const customerName =
    conv.customer?.name && conv.customer.name !== 'Visitor'
      ? conv.customer.name
      : conv.customer?.email
        ? conv.customer.email.split('@')[0].replace(/[._-]/g, ' ')
        : null
  const avatarLetter = customerName?.charAt(0)?.toUpperCase()
  // Generate a meaningful title: use subject, intent, or derive from first customer message
  const title =
    conv.subject ??
    conv.intent ??
    conv.messages.find((m) => m.role === 'customer')?.body.slice(0, 60) ??
    'New conversation'
  const displayName =
    customerName ?? (conv.channel === 'voice' ? 'Voice caller' : 'Website visitor')

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-2xl border border-white/60 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
        {avatarLetter ? (
          avatarLetter
        ) : (
          <ChatBubbleLeftEllipsisIcon className="h-4.5 w-4.5 text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {conv.display_id && (
            <span className="shrink-0 text-[10px] font-bold text-gray-300">#{conv.display_id}</span>
          )}
          <span
            role="button"
            tabIndex={0}
            className="truncate text-sm font-semibold text-gray-900 hover:text-[#3730a3] hover:underline cursor-pointer"
            onClick={(e) => {
              if (conv.customer?.customer_id) {
                e.stopPropagation()
                navigate(`/support/customers/${conv.customer.customer_id}`)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && conv.customer?.customer_id) {
                e.stopPropagation()
                navigate(`/support/customers/${conv.customer.customer_id}`)
              }
            }}
          >
            {displayName}
          </span>
          {conv.sentiment && <span className="text-xs">{sentimentIcon(conv.sentiment)}</span>}
          <span
            className={cn(
              'ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
              statusBadgeClass(conv.status)
            )}
          >
            {conv.status}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs font-medium text-gray-600">{title}</p>
        {/* Tags */}
        {conv.tags && conv.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {conv.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
              >
                {tag}
              </span>
            ))}
            {conv.tags.length > 4 && (
              <span className="text-[10px] text-gray-400">+{conv.tags.length - 4}</span>
            )}
          </div>
        )}
        {/* Summary preview or last message */}
        {conv.summary ? (
          <p className="mt-1 truncate text-xs text-gray-400 italic">{conv.summary.slice(0, 120)}</p>
        ) : lastMsg ? (
          <p className="mt-1 truncate text-xs text-gray-400">
            {lastMsg.role === 'lira'
              ? 'Lira: '
              : lastMsg.role === 'agent'
                ? `${lastMsg.sender_name ?? 'Agent'}: `
                : ''}
            {lastMsg.body.slice(0, 120)}
          </p>
        ) : null}
      </div>

      {/* Time + CSAT */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[10px] text-gray-300">{timeAgo(conv.updated_at)}</p>
        {conv.csat_score && (
          <span className="text-[10px] text-amber-500">{'★'.repeat(conv.csat_score)}</span>
        )}
      </div>
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
    </div>
  )
}

export { SupportInboxPage, SupportInboxPanel }

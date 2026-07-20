import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  LifebuoyIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { getOrgUsage, listOrgMembers } from '@/services/api'
import {
  getSupportStats,
  listConversations,
  type SupportConfig,
  type SupportConversation,
  type SupportStats,
} from '@/services/api/support-api'
import { cn } from '@/lib'

function timeAgo(iso?: string): string {
  if (!iso) return 'just now'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatResponseTime(ms: number): string {
  if (!ms) return '0s'
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.round(seconds / 60)}m`
}

function formatChannel(channel: SupportConversation['channel']) {
  return channel.charAt(0).toUpperCase() + channel.slice(1)
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'default',
  onClick,
}: {
  label: string
  value: string | number
  detail: string
  icon: React.ElementType
  tone?: 'default' | 'urgent' | 'success'
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={cn(
        'group rounded-[26px] border border-white/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md',
        tone === 'urgent' && 'ring-1 ring-gray-300',
        tone === 'success' && 'ring-1 ring-gray-200'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            tone === 'urgent'
              ? 'bg-gray-950 text-white'
              : tone === 'success'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {onClick && (
          <ArrowRightIcon className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500" />
        )}
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-gray-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{detail}</p>
    </Tag>
  )
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  primary = false,
}: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition',
        primary ? 'bg-[#202527] text-white hover:bg-black' : 'hover:bg-gray-50'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          primary ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn('block text-sm font-semibold', primary ? 'text-white' : 'text-gray-950')}
        >
          {label}
        </span>
        <span
          className={cn(
            'mt-0.5 block truncate text-xs',
            primary ? 'text-white/55' : 'text-gray-500'
          )}
        >
          {description}
        </span>
      </span>
      <ArrowRightIcon
        className={cn(
          'h-4 w-4 shrink-0 transition group-hover:translate-x-0.5',
          primary ? 'text-white/60' : 'text-gray-300 group-hover:text-gray-500'
        )}
      />
    </button>
  )
}

function SetupChecklist({
  supportConfig,
  knowledgePages,
  memberCount,
}: {
  supportConfig: SupportConfig | null
  knowledgePages: number
  memberCount: number
}) {
  const supportActivated = supportConfig?.activated ?? false
  // Only a real external install completes this step. `last_widget_seen_at`
  // is tripped by the dashboard's OWN embedded onboarding widget (it loads
  // from the Lira app host), so keying off it marked this done too early.
  // `widget_seen_external_at` is set only when the widget loads from a
  // non-Lira host — i.e. the customer embedded the snippet on their own site.
  const widgetInstalled = Boolean(supportConfig?.widget_seen_external_at)
  const knowledgeConnected = knowledgePages > 0
  const supportEmailConfigured = Boolean(
    supportConfig?.email_enabled &&
    (supportConfig.email_address ||
      supportConfig.custom_support_email ||
      supportConfig.escalation_email)
  )
  const teammatesInvited = memberCount > 1
  const steps = [
    {
      label: 'Activate customer support',
      done: supportActivated,
      path: '/support/activate',
    },
    {
      label: 'Install the chat widget',
      done: widgetInstalled,
      path: '/settings?tab=support&supportTab=connect',
    },
    {
      label: 'Connect product knowledge',
      done: knowledgeConnected,
      path: '/org/knowledge',
    },
    {
      label: 'Configure support email',
      done: supportEmailConfigured,
      path: '/settings?tab=support&supportTab=channels',
    },
    {
      label: 'Invite support teammates',
      done: teammatesInvited,
      path: '/org/members',
    },
  ]

  const navigate = useNavigate()
  const completed = steps.filter((step) => step.done).length

  return (
    <section className="rounded-[26px] border border-white/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Launch checklist
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">Get support ready for customers</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
          {completed}/{steps.length}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {steps.map((step) => (
          <button
            type="button"
            key={step.label}
            onClick={() => navigate(step.path)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50"
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                step.done ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-400'
              )}
            >
              <CheckCircleIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">{step.label}</span>
            <ArrowRightIcon className="h-3.5 w-3.5 text-gray-300" />
          </button>
        ))}
      </div>
    </section>
  )
}

function ConversationsPanel({
  conversations,
  supportActivated,
}: {
  conversations: SupportConversation[]
  supportActivated: boolean
}) {
  const navigate = useNavigate()

  return (
    <section className="rounded-[26px] border border-white/70 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Live support
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">Open conversations</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate(supportActivated ? '/support/inbox' : '/support/activate')}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
        >
          {supportActivated ? 'Open inbox' : 'Set up'}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3">
        {!supportActivated ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <LifebuoyIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-950">
              Customer support is not active yet
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Activate support to start receiving chat, email, portal, and voice conversations in
              one place.
            </p>
            <button
              type="button"
              onClick={() => navigate('/support/activate')}
              className="mt-5 rounded-full bg-[#202527] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              Set up customer support
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <CheckCircleIcon className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-950">No open conversations</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Your support queue is clear. New customer conversations will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.slice(0, 8).map((conversation) => {
              const customer = conversation.customer
              const name = customer?.name || customer?.email || 'Customer'
              const updatedAt = conversation.updated_at || conversation.created_at
              return (
                <button
                  type="button"
                  key={conversation.conv_id}
                  onClick={() => navigate(`/support/inbox/${conversation.conv_id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-950">{name}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          conversation.status === 'escalated'
                            ? 'bg-gray-950 text-white'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {conversation.status}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-gray-500">
                      {conversation.subject || conversation.summary || 'Customer conversation'}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-xs text-gray-400 sm:block">
                    {formatChannel(conversation.channel)}
                    <br />
                    {timeAgo(updatedAt)}
                  </span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { token, userName } = useAuthStore()
  const { currentOrgId } = useOrgStore()
  const supportConfig = useSupportStore((s) => s.config)
  const supportActivated = supportConfig?.activated ?? false

  const [supportStats, setSupportStats] = useState<SupportStats | null>(null)
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([])
  const [knowledgePages, setKnowledgePages] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }

    const statsPromise =
      currentOrgId && supportActivated
        ? getSupportStats(currentOrgId).catch(() => null)
        : Promise.resolve(null)
    const conversationsPromise =
      currentOrgId && supportActivated
        ? listConversations(currentOrgId, 'open').catch(() => [] as SupportConversation[])
        : Promise.resolve([] as SupportConversation[])
    const usagePromise = currentOrgId
      ? getOrgUsage(currentOrgId).catch(() => null)
      : Promise.resolve(null)
    const membersPromise = currentOrgId
      ? listOrgMembers(currentOrgId).catch(() => [])
      : Promise.resolve([])

    Promise.all([statsPromise, conversationsPromise, usagePromise, membersPromise]).then(
      ([stats, conversations, usage, members]) => {
        conversations.sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        )
        setSupportStats(stats)
        setSupportConversations(conversations)
        setKnowledgePages(usage?.usage.knowledge_pages ?? 0)
        setMemberCount(members.length)
        setLoading(false)
      }
    )
  }, [token, currentOrgId, navigate, supportActivated])

  const firstName = userName?.split(' ')[0]
  const escalatedCount =
    supportStats?.escalated ??
    supportConversations.filter((conversation) => conversation.status === 'escalated').length
  const aiResolved = supportStats?.resolved_autonomous ?? 0
  const csat = supportStats?.avg_csat ? supportStats.avg_csat.toFixed(1) : '0.0'

  const healthMessage = useMemo(() => {
    if (!supportActivated)
      return 'Finish setup to start helping customers from chat, email, portal, and voice.'
    if (escalatedCount > 0)
      return `${escalatedCount} conversation${escalatedCount === 1 ? '' : 's'} need human attention.`
    if (supportConversations.length > 0) return 'Customers are waiting in the support queue.'
    return 'Support is active and the queue is clear.'
  }, [escalatedCount, supportActivated, supportConversations.length])

  if (loading) {
    return (
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-300/60" />
          <div className="h-36 animate-pulse rounded-3xl bg-gray-300/60" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="h-96 animate-pulse rounded-2xl bg-gray-300/60" />
            <div className="h-96 animate-pulse rounded-2xl bg-gray-300/60" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(supportActivated ? '/support/inbox' : '/support/activate')}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#202527] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            {supportActivated ? 'Open support inbox' : 'Set up customer support'}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </header>

        <section className="mb-4 overflow-hidden rounded-3xl bg-[#202527] p-6 text-white shadow-sm sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                Launch status
              </p>
              {supportActivated && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                      supportConfig?.environment === 'sandbox'
                        ? 'bg-amber-300/15 text-amber-200 ring-1 ring-amber-200/25'
                        : 'bg-emerald-300/15 text-emerald-200 ring-1 ring-emerald-200/25'
                    )}
                  >
                    {supportConfig?.environment === 'sandbox' ? 'Sandbox' : 'Live'}
                  </span>
                  {supportConfig?.environment === 'sandbox' && (
                    <span className="text-xs text-white/45">
                      Testing mode: real outbound sends are suppressed.
                    </span>
                  )}
                </div>
              )}
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {supportActivated
                  ? 'Lira is watching your customer queue.'
                  : 'Launch your support workspace.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{healthMessage}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    supportActivated ? 'bg-white/12 text-white' : 'bg-white/12 text-white'
                  )}
                >
                  {supportActivated ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <ClockIcon className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {supportActivated ? 'Support active' : 'Setup pending'}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {supportActivated
                      ? 'Inbox, portal, email, and widget controls are available.'
                      : 'Complete activation to receive conversations.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Open conversations"
            value={supportStats?.open_conversations ?? supportConversations.length}
            detail="Customers waiting for a response"
            icon={InboxIcon}
            onClick={() => navigate(supportActivated ? '/support/inbox' : '/support/activate')}
          />
          <StatCard
            label="Escalated"
            value={escalatedCount}
            detail="Needs a human teammate"
            icon={ExclamationTriangleIcon}
            tone={escalatedCount > 0 ? 'urgent' : 'default'}
            onClick={() => navigate(supportActivated ? '/support/inbox' : '/support/activate')}
          />
          <StatCard
            label="AI resolved"
            value={aiResolved}
            detail="Conversations closed by Lira"
            icon={SparklesIcon}
            tone="success"
            onClick={() => navigate('/support/analytics')}
          />
          <StatCard
            label="Avg response"
            value={formatResponseTime(supportStats?.avg_response_time_ms ?? 0)}
            detail={`CSAT ${csat} when available`}
            icon={ClockIcon}
            onClick={() => navigate('/support/analytics')}
          />
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <ConversationsPanel
              conversations={supportConversations}
              supportActivated={supportActivated}
            />
            <SetupChecklist
              supportConfig={supportConfig}
              knowledgePages={knowledgePages}
              memberCount={memberCount}
            />
          </div>

          <div className="space-y-4">
            <section className="rounded-[26px] border border-white/70 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Quick actions
                </p>
              </div>
              <div className="space-y-1 p-2">
                <QuickAction
                  icon={ChatBubbleLeftEllipsisIcon}
                  label="Open support inbox"
                  description="Reply, resolve, and hand back to Lira"
                  onClick={() =>
                    navigate(supportActivated ? '/support/inbox' : '/support/activate')
                  }
                  primary
                />
                <QuickAction
                  icon={BookOpenIcon}
                  label="Add knowledge"
                  description="Upload docs or crawl product pages"
                  onClick={() => navigate('/org/knowledge')}
                />
                <QuickAction
                  icon={EnvelopeIcon}
                  label="Configure support email"
                  description="Forward your support inbox into Lira"
                  onClick={() => navigate('/org/email')}
                />
                <QuickAction
                  icon={PuzzlePieceIcon}
                  label="Connect tools"
                  description="Link Slack, CRM, and workflows"
                  onClick={() => navigate('/org/integrations')}
                />
                <QuickAction
                  icon={UsersIcon}
                  label="Invite teammates"
                  description="Bring support agents into the workspace"
                  onClick={() => navigate('/org/members')}
                />
                <QuickAction
                  icon={Cog6ToothIcon}
                  label="Support settings"
                  description="Widget, portal, voice, and escalation rules"
                  onClick={() => navigate('/settings?tab=support')}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DashboardPage }

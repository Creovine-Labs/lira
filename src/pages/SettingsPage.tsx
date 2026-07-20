import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDownOnSquareIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  // CalendarDaysIcon removed alongside the commented-out 'Calendar Sync' tab.
  ChatBubbleLeftEllipsisIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  MicrophoneIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { env } from '@/env'
import {
  useUserPrefsStore,
  useAuthStore,
  useOrgStore,
  type VoiceId,
  type Personality,
} from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { Button } from '@/components/common'
import { cn } from '@/lib'
import {
  updateMyName,
  updateMyEmail,
  updateMyPicture,
  changePassword,
  deleteAccount,
  leaveOrganization,
  listOrgMembers,
  getMyPlan,
  requestPlanChange,
  cancelPlanChangeRequest,
  requestSandboxExtension,
  getBillingStatus,
  createBillingCheckout,
  createBillingPortalSession,
  resolvePortalUrl,
  type MyPlan,
  type PlanTier,
  type PlanEntitlements,
  type BillingStatus,
  type SubscriptionStatus,
} from '@/services/api'
import { openPaddleCheckout } from '@/lib/paddle'
import {
  deleteAgentCapability,
  listAgentCapabilities,
  listAgentActionRuns,
  getSupportConfig,
  HANDOFF_TRIGGER_DEFAULTS,
  deleteWhatsAppChannelConfig,
  getWhatsAppAnalyticsSummary,
  getWhatsAppChannelConfig,
  listWhatsAppAnalyticsEvents,
  rotateWidgetSecret,
  updateWhatsAppChannelConfig,
  upsertAgentCapability,
  type AgentCapabilityConfig,
  type AgentActionRun,
  type AgentActionRunStatus,
  type HandoffTriggersConfig,
  type SupportConfig,
  type WhatsAppAnalyticsEvent,
  type WhatsAppAnalyticsSummary,
  type WhatsAppChannelConfig,
} from '@/services/api/support-api'
import { ExportButton } from './support/ExportButton'
import { OrgSettingsPage } from './OrgSettingsPage'
import { CalendarSyncSection } from '@/components/settings/CalendarSyncSection'
import { GoLiveModal } from '@/components/settings/GoLiveModal'
import { SupportMcpConnector } from '@/components/settings/SupportMcpConnector'
import { SupportToolPacksPanel } from '@/pages/support/SupportToolPacksPage'
import {
  SettingsShell,
  SideNav,
  SCard,
  SRow,
  Toggle as SToggle,
  Disclosure,
  Callout,
  StatTile,
  Field as SField,
  fieldInputCls,
  CodeTabs,
  SaveBar,
} from '@/components/settings/support-ui'

interface VoiceOption {
  id: VoiceId
  label: string
  gender: 'female' | 'male'
  description: string
}

interface PersonalityOption {
  id: Personality
  label: string
  description: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'tiffany',
    label: 'Tiffany',
    gender: 'female',
    description: 'Clear & professional female voice (default)',
  },
  {
    id: 'ruth',
    label: 'Ruth',
    gender: 'female',
    description: 'Warm & conversational female voice',
  },
  {
    id: 'matthew',
    label: 'Matthew',
    gender: 'male',
    description: 'Confident & articulate male voice',
  },
  {
    id: 'stephen',
    label: 'Stephen',
    gender: 'male',
    description: 'Deep & authoritative male voice',
  },
]

const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'supportive',
    label: 'Supportive',
    description: 'Encouraging, helps the team move forward and resolve conflicts',
  },
  {
    id: 'challenger',
    label: 'Challenger',
    description: 'Asks tough questions and pushes the team to think critically',
  },
  {
    id: 'facilitator',
    label: 'Facilitator',
    description: 'Keeps the meeting on track and surfaces action items',
  },
  {
    id: 'analyst',
    label: 'Analyst',
    description: 'Data-driven, focuses on facts, metrics, and structured reasoning',
  },
]

const FEMALE_NAMES = ['Lira', 'Sarah', 'Emma', 'Nova', 'Aria', 'Luna']
const MALE_NAMES = ['Max', 'James', 'Leo', 'Alex', 'Kai', 'Orion']

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  disabled,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className={`rounded-xl border bg-card p-6 shadow-sm ${disabled ? 'opacity-50' : ''}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-500" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {disabled && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <LockClosedIcon className="h-3 w-3" />
            Not available yet
          </span>
        )}
      </div>
      <div className={disabled ? 'pointer-events-none select-none' : ''}>{children}</div>
    </div>
  )
}

function LockedRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-muted-foreground/70">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs">{description}</p>
      </div>
      <LockClosedIcon className="h-4 w-4 shrink-0" />
    </div>
  )
}

// ── Subscription section ─────────────────────────────────────────────────────

const TIER_LABELS: Record<PlanTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  SCALE: 'Scale',
  ENTERPRISE: 'Enterprise',
}

function tierPrice(e: PlanEntitlements): string {
  if (e.basePriceUsd === null) return 'Custom'
  if (e.basePriceUsd === 0) return '$0'
  return `$${e.basePriceUsd}/mo`
}

const SUBSCRIPTION_BADGE: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700' },
  past_due: { label: 'Past due', className: 'bg-amber-100 text-amber-800' },
  canceled: { label: 'Canceled', className: 'bg-gray-100 text-gray-600' },
  none: { label: 'No subscription', className: 'bg-gray-100 text-gray-500' },
}

function formatBillingDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function entitlementLines(e: PlanEntitlements): string[] {
  const conv =
    e.includedConversationsPerMonth === 0
      ? 'Unlimited conversations'
      : `${e.includedConversationsPerMonth.toLocaleString()} conversations / mo`
  const overage = e.overagePer1000Usd !== null ? `$${e.overagePer1000Usd} per extra 1,000` : null
  return [
    conv,
    ...(overage ? [overage] : []),
    `${e.languages} languages`,
    ...(e.whatsappBusinessApi ? ['WhatsApp Business API'] : []),
    ...(e.multipleDomains ? ['Multiple domains'] : []),
    ...(e.brandingRemoval ? ['Branding removed'] : []),
    ...(e.prioritySupport ? ['Priority support'] : []),
    ...(e.advancedAnalytics ? ['Advanced analytics & exports'] : []),
  ]
}

function PlanUsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const unlimited = limit === 0
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">
          {used.toLocaleString()} / {unlimited ? 'Unlimited' : limit.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
          )}
          style={{ width: unlimited ? '4%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Sandbox testing caps shown while an org is in sandbox. Display values only —
// the enforced values live in the backend SANDBOX_MAX_CONVERSATIONS_PER_MONTH /
// SANDBOX_MAX_AI_REPLIES_PER_MONTH env defaults (see SANDBOX_VS_LIVE_DESIGN.md).
const SANDBOX_CONVERSATIONS_CAP = 500
const SANDBOX_AI_REPLIES_CAP = 500
const SANDBOX_LLM_CALLS_CAP = 2000

function SubscriptionSection() {
  const { currentOrgId } = useOrgStore()
  const userId = useAuthStore((s) => s.userId)
  const navigate = useNavigate()
  const [plan, setPlan] = useState<MyPlan | null>(null)
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  // Only org owners/admins may request plan changes — members get a
  // read-only view. Defaults true so a failed role lookup never locks
  // an admin out; the backend still enforces the role on every POST.
  const [canManage, setCanManage] = useState(true)
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('production')
  const [usage, setUsage] = useState<{
    conversations: number
    conversationsMax: number
    aiReplies: number
    aiRepliesMax: number
    llmCalls: number
    llmCallsMax: number
    sandboxConversationsMax: number
    sandboxAiRepliesMax: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = await getMyPlan(currentOrgId ?? undefined)
      setPlan(p)
      if (p.billingExempt || p.platformOwned) {
        setBilling(null)
      } else {
        try {
          setBilling(await getBillingStatus(currentOrgId ?? undefined))
        } catch {
          // billing endpoint unavailable — hide the Paddle status row
          setBilling(null)
        }
      }
      if (currentOrgId) {
        try {
          const members = await listOrgMembers(currentOrgId)
          const me = members.find((m) => m.user_id === userId)
          setCanManage(!me || me.role === 'owner' || me.role === 'admin')
        } catch {
          // role lookup failed — keep manage UI, backend enforces anyway
        }
        const cfg = await getSupportConfig(currentOrgId)
        setEnvironment(cfg.environment ?? 'production')
        setUsage({
          conversations: cfg.conversations_this_month ?? 0,
          conversationsMax: cfg.max_conversations_per_month ?? 0,
          aiReplies: cfg.ai_replies_this_month ?? 0,
          aiRepliesMax: cfg.max_ai_replies_per_month ?? 0,
          llmCalls: cfg.llm_calls_this_month ?? 0,
          llmCallsMax: cfg.sandbox_max_llm_calls_per_month ?? SANDBOX_LLM_CALLS_CAP,
          sandboxConversationsMax:
            cfg.sandbox_max_conversations_per_month ?? SANDBOX_CONVERSATIONS_CAP,
          sandboxAiRepliesMax: cfg.sandbox_max_ai_replies_per_month ?? SANDBOX_AI_REPLIES_CAP,
        })
      }
    } catch {
      // plan endpoint unavailable — leave section empty-stated
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, userId])

  useEffect(() => {
    void load()
  }, [load])

  const handleRequest = async (toTier: PlanTier) => {
    if (!currentOrgId || !plan) return
    setBusy(true)
    try {
      await requestPlanChange({ toTier, orgId: currentOrgId })
      toast.success(
        `${TIER_LABELS[toTier]} plan requested — the Lira team will review and apply it.`
      )
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not request plan change')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (!plan?.pendingRequest) return
    const isExtension = plan.pendingRequest.type === 'SANDBOX_EXTENSION'
    setBusy(true)
    try {
      await cancelPlanChangeRequest(plan.pendingRequest.id)
      toast.success(
        isExtension ? 'Sandbox extension request cancelled' : 'Plan change request cancelled'
      )
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel request')
    } finally {
      setBusy(false)
    }
  }

  const handleSandboxExtension = async () => {
    if (!currentOrgId) return
    setBusy(true)
    try {
      await requestSandboxExtension(currentOrgId)
      toast.success('Sandbox extension requested — the Lira team will review it shortly.')
      await load()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message.replace(/^\d+:\s*/, '')
          : 'Could not request sandbox extension'
      )
    } finally {
      setBusy(false)
    }
  }

  // Self-serve Paddle checkout for PRO/SCALE — the plan is applied server-side
  // by the Paddle webhook, so we re-fetch a few seconds after completion.
  const handleCheckout = async (tier: 'PRO' | 'SCALE') => {
    if (!currentOrgId) {
      toast.error('Select an organization before subscribing.')
      return
    }
    setBusy(true)
    try {
      const interval = billing?.billingInterval ?? 'month'
      const checkout = await createBillingCheckout({ orgId: currentOrgId, tier, interval })
      await openPaddleCheckout(checkout.transactionId, currentOrgId, () => {
        toast.success('Payment received — your plan will update shortly.')
        setTimeout(() => void load(), 3000)
      })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Could not start checkout'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleManageBilling = async () => {
    setBusy(true)
    try {
      const session = await createBillingPortalSession(currentOrgId ?? undefined)
      const url = resolvePortalUrl(session)
      if (!url) throw new Error('Could not open the billing portal. Please try again.')
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Could not open billing portal'
      )
    } finally {
      setBusy(false)
    }
  }

  const sandboxConversationLimit =
    environment === 'sandbox'
      ? (usage?.sandboxConversationsMax ?? SANDBOX_CONVERSATIONS_CAP)
      : SANDBOX_CONVERSATIONS_CAP
  const sandboxAiReplyLimit =
    environment === 'sandbox'
      ? (usage?.sandboxAiRepliesMax ?? SANDBOX_AI_REPLIES_CAP)
      : SANDBOX_AI_REPLIES_CAP
  const sandboxExtension = plan?.sandboxExtension
  const sandboxExtensionLimitReached =
    Boolean(sandboxExtension) && sandboxExtension!.remainingThisMonth <= 0
  const sandboxExtensionActive =
    environment === 'sandbox' &&
    (sandboxConversationLimit > SANDBOX_CONVERSATIONS_CAP ||
      sandboxAiReplyLimit > SANDBOX_AI_REPLIES_CAP ||
      (usage?.llmCallsMax ?? SANDBOX_LLM_CALLS_CAP) > SANDBOX_LLM_CALLS_CAP)
  const billingExempt = Boolean(plan?.billingExempt || plan?.platformOwned)

  if (loading) {
    return (
      <Section icon={ShieldCheckIcon} title="Subscription">
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-900" />
        </div>
      </Section>
    )
  }

  if (!plan) {
    return (
      <Section icon={ShieldCheckIcon} title="Subscription">
        <p className="text-sm text-muted-foreground">
          Plan information is unavailable right now. Try again shortly.
        </p>
      </Section>
    )
  }

  return (
    <div className="space-y-6">
      <Section icon={ShieldCheckIcon} title="Current plan">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {TIER_LABELS[plan.tier]}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {billingExempt ? 'Internal' : tierPrice(plan.entitlements)}
              </span>
            </p>
            {billingExempt && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Platform-owned · billing exempt
              </p>
            )}
            <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              {entitlementLines(plan.entitlements).map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        </div>

        {billing && (
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                SUBSCRIPTION_BADGE[billing.subscriptionStatus].className
              )}
            >
              {SUBSCRIPTION_BADGE[billing.subscriptionStatus].label}
            </span>
            {billing.subscriptionStatus === 'active' && billing.paddleCurrentPeriodEndsAt && (
              <span className="text-xs text-muted-foreground">
                {billing.paddleCancelAtPeriodEnd ? 'Access until' : 'Next billing'}{' '}
                {formatBillingDate(billing.paddleCurrentPeriodEndsAt)}
              </span>
            )}
            {billing.paddleCancelAtPeriodEnd && (
              <span className="text-xs font-medium text-amber-700">Cancels at period end</span>
            )}
            {billing.paddleCustomerId && canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={busy}
                onClick={handleManageBilling}
              >
                Manage billing
              </Button>
            )}
          </div>
        )}

        {currentOrgId && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Launch status: {environment === 'sandbox' ? 'Sandbox' : 'Live'}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-900/80">
                  {environment === 'sandbox'
                    ? 'You are testing for free. Open Support Settings when you are ready to switch this org to live.'
                    : billingExempt
                      ? 'This Lira-owned workspace is live with internal usage rules. Sandbox and customer billing controls do not apply.'
                      : 'This org is live. Open Support Settings if you need to review launch controls or force a sandbox rollback.'}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate('/settings?tab=support')}
              >
                Open go-live controls
              </Button>
            </div>
          </div>
        )}

        {usage &&
          (environment === 'sandbox' ? (
            <div className="mt-5 space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Sandbox testing usage — free</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    busy || !canManage || !!plan.pendingRequest || sandboxExtensionLimitReached
                  }
                  onClick={handleSandboxExtension}
                >
                  {plan.pendingRequest?.type === 'SANDBOX_EXTENSION'
                    ? 'Extension requested'
                    : sandboxExtensionLimitReached
                      ? 'Extension limit reached'
                      : 'Request sandbox extension'}
                </Button>
              </div>
              {sandboxExtensionActive && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Sandbox extension active. This org can now test up to{' '}
                  <strong>{sandboxConversationLimit.toLocaleString()}</strong> conversations,{' '}
                  <strong>{sandboxAiReplyLimit.toLocaleString()}</strong> AI replies, and{' '}
                  <strong>{(usage?.llmCallsMax ?? SANDBOX_LLM_CALLS_CAP).toLocaleString()}</strong>{' '}
                  LLM calls this month.
                </div>
              )}
              <PlanUsageBar
                label="Conversations this month"
                used={usage.conversations}
                limit={sandboxConversationLimit}
              />
              <PlanUsageBar
                label="AI replies this month"
                used={usage.aiReplies}
                limit={sandboxAiReplyLimit}
              />
              <PlanUsageBar
                label="LLM calls this month"
                used={usage.llmCalls}
                limit={usage.llmCallsMax}
              />
              <p className="text-xs text-muted-foreground">
                {billingExempt
                  ? 'This internal workspace does not use customer billing or sandbox extensions.'
                  : `Going live applies your plan's limits and starts billing. Sandbox extensions are limited to ${sandboxExtension?.limitPerMonth ?? 2} request(s) per month.`}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Usage this month</p>
                {!billingExempt && (
                  <ExportButton orgId={currentOrgId} kind="usage" label="Export usage evidence" />
                )}
              </div>
              <PlanUsageBar
                label="Conversations this month"
                used={usage.conversations}
                limit={usage.conversationsMax}
              />
              <PlanUsageBar
                label="AI replies this month"
                used={usage.aiReplies}
                limit={usage.aiRepliesMax}
              />
            </div>
          ))}

        {plan.pendingRequest && (
          <div className="mt-5 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              {plan.pendingRequest.type === 'SANDBOX_EXTENSION' ? (
                <>Sandbox extension requested — awaiting review by the Lira team.</>
              ) : (
                <>
                  Change to <strong>{TIER_LABELS[plan.pendingRequest.toTier as PlanTier]}</strong>{' '}
                  requested — awaiting review by the Lira team.
                </>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !canManage}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </Section>

      <Section icon={CreditCardIcon} title={billingExempt ? 'Billing' : 'Change plan'}>
        {billingExempt ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-950">
              This is a Lira-owned internal organization.
            </p>
            <p className="mt-1 text-sm text-emerald-900/80">
              It stays live with Enterprise-level features, unlimited usage caps, no overage
              charging, and no Paddle subscription.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {canManage
                ? 'Pro and Scale are self-serve — pick a plan, pay through the secure Paddle checkout, and it activates automatically. Enterprise and downgrades to Free are reviewed and applied by the Lira team.'
                : 'Only org owners and admins can change plans. Ask an admin of this organization if you need a different plan.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plan.allTiers.map(({ tier, entitlements }) => {
                const isCurrent = tier === plan.tier
                const isPendingTarget = plan.pendingRequest?.toTier === tier
                // PRO/SCALE upgrades go through Paddle checkout; FREE (downgrade)
                // and ENTERPRISE (custom) keep the request/approve flow.
                const isPaidCheckout = tier === 'PRO' || tier === 'SCALE'
                const billingActive = billing?.subscriptionStatus === 'active'
                return (
                  <div
                    key={tier}
                    className={cn(
                      'flex flex-col rounded-xl border p-4',
                      isCurrent ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                    )}
                  >
                    <p className="font-semibold text-foreground">{TIER_LABELS[tier]}</p>
                    <p className="text-sm text-muted-foreground">{tierPrice(entitlements)}</p>
                    <ul className="mt-2 flex-1 space-y-0.5 text-xs text-muted-foreground">
                      {entitlementLines(entitlements)
                        .slice(0, 4)
                        .map((line) => (
                          <li key={line}>• {line}</li>
                        ))}
                    </ul>
                    {isCurrent ? (
                      <Button className="mt-3" size="sm" variant="outline" disabled>
                        Current plan
                      </Button>
                    ) : isPaidCheckout ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        disabled={busy || !canManage}
                        onClick={() => handleCheckout(tier as 'PRO' | 'SCALE')}
                      >
                        {billingActive ? 'Switch to this plan' : 'Subscribe'}
                      </Button>
                    ) : (
                      <Button
                        className="mt-3"
                        size="sm"
                        disabled={busy || !canManage || !!plan.pendingRequest || isPendingTarget}
                        onClick={() => handleRequest(tier)}
                      >
                        {isPendingTarget ? 'Requested' : 'Request change'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Section>
    </div>
  )
}

// ── AI Configuration section ──────────────────────────────────────────────────

function AiConfigSection() {
  const { aiName, voiceId, personality, setAiName, setVoiceId, setPersonality } =
    useUserPrefsStore()

  const [localName, setLocalName] = useState(aiName)
  const [saved, setSaved] = useState(false)

  // Determine gender from current voice selection
  const currentVoice = VOICE_OPTIONS.find((v) => v.id === voiceId)
  const isFemaleName = FEMALE_NAMES.includes(localName)

  function handleVoiceChange(id: VoiceId) {
    setVoiceId(id)
    // Suggest an appropriate name when switching gender
    const selected = VOICE_OPTIONS.find((v) => v.id === id)
    if (selected?.gender === 'male' && isFemaleName) {
      setLocalName('Max')
    } else if (selected?.gender === 'female' && !isFemaleName) {
      setLocalName('Lira')
    }
  }

  function handleSave() {
    const trimmed = localName.trim()
    if (!trimmed) return
    setAiName(trimmed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const nameSuggestions = currentVoice?.gender === 'male' ? MALE_NAMES : FEMALE_NAMES

  return (
    <Section icon={SparklesIcon} title="Lira Configuration">
      {/* AI Name */}
      <div className="space-y-5">
        <div>
          <label htmlFor="ai-name" className="mb-2 block text-sm font-medium text-foreground">
            AI Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              maxLength={30}
              id="ai-name"
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              placeholder="e.g. Lira, Sarah, Max…"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!localName.trim() || localName.trim() === aiName}
              className="gap-1.5 rounded-xl"
            >
              <ArrowDownOnSquareIcon className="h-3.5 w-3.5" />
              {saved ? 'Saved!' : 'Save'}
            </Button>
          </div>
          {/* Name quick-picks */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {nameSuggestions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLocalName(n)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                  localName === n
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-border text-muted-foreground hover:border-gray-400 hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Voice selection */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Voice</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVoiceChange(v.id)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  voiceId === v.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-border hover:border-gray-300'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <MicrophoneIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{v.label}</span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-gray-600">
                      {v.gender}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Personality</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERSONALITY_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonality(p.id)}
                className={`flex flex-col gap-0.5 rounded-xl border p-3 text-left transition ${
                  personality === p.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-border hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium text-foreground">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ── Account Section ────────────────────────────────────────────────────────────

function AccountSection() {
  const navigate = useNavigate()
  const {
    userName,
    userEmail,
    userPicture,
    userId,
    setUserName,
    setUserEmail,
    setUserPicture,
    clearCredentials,
  } = useAuthStore()
  const { organizations, removeOrganization } = useOrgStore()

  // Profile
  const [name, setName] = useState(userName ?? '')
  const [savingName, setSavingName] = useState(false)

  // Picture
  const [savingPicture, setSavingPicture] = useState(false)
  const [picturePreview, setPicturePreview] = useState<string | null>(null)
  const [pictureFile, setPictureFile] = useState<File | null>(null)

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Leave org
  const [leavingOrgId, setLeavingOrgId] = useState<string | null>(null)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleSaveName() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === (userName ?? '')) return
    setSavingName(true)
    try {
      await updateMyName(trimmed)
      setUserName(trimmed)
      toast.success('Name updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  function handlePictureFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      return
    }
    setPictureFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPicturePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSavePicture() {
    if (!pictureFile && !picturePreview) return
    const dataUri = picturePreview
    if (!dataUri) return
    setSavingPicture(true)
    try {
      await updateMyPicture(dataUri)
      setUserPicture(dataUri)
      setPictureFile(null)
      setPicturePreview(null)
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update picture')
    } finally {
      setSavingPicture(false)
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || !emailPassword) return
    setSavingEmail(true)
    try {
      await updateMyEmail(newEmail.trim(), emailPassword)
      setUserEmail(newEmail.trim())
      setNewEmail('')
      setEmailPassword('')
      toast.success('Email updated. Check your inbox to verify the new address.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleLeaveOrg(orgId: string) {
    try {
      await leaveOrganization(orgId)
      removeOrganization(orgId)
      toast.success('Left organization')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave organization')
    } finally {
      setLeavingOrgId(null)
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) return
    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
      clearCredentials()
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Section icon={UserCircleIcon} title="Profile">
        <div className="space-y-4">
          {/* Avatar with click-to-upload */}
          <div className="flex items-center gap-4">
            <label
              htmlFor="account-picture"
              className="group relative h-16 w-16 shrink-0 cursor-pointer rounded-full"
              title="Upload profile picture"
            >
              {(picturePreview ?? userPicture) ? (
                <img
                  src={picturePreview ?? userPicture ?? ''}
                  alt={userName ?? ''}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100 transition group-hover:brightness-75"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a] text-lg font-bold text-white transition group-hover:brightness-75">
                  {(userName ?? userEmail ?? 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                Edit
              </span>
            </label>
            <input
              id="account-picture"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePictureFileChange}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{userName ?? '—'}</p>
              <p className="text-xs text-gray-400">{userEmail ?? '—'}</p>
              {pictureFile ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="truncate text-xs text-gray-500">{pictureFile.name}</span>
                  <Button
                    size="sm"
                    onClick={handleSavePicture}
                    disabled={savingPicture}
                    className="shrink-0 gap-1 rounded-xl px-3 py-1 text-xs"
                  >
                    <ArrowDownOnSquareIcon className="h-3 w-3" />
                    {savingPicture ? 'Saving…' : 'Save'}
                  </Button>
                  <button
                    onClick={() => {
                      setPictureFile(null)
                      setPicturePreview(null)
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-gray-400">Click photo to change · Max 2 MB</p>
              )}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label
              htmlFor="account-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                id="account-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Your name"
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={savingName || !name.trim() || name.trim() === (userName ?? '')}
                className="gap-1.5 rounded-xl"
              >
                <ArrowDownOnSquareIcon className="h-3.5 w-3.5" />
                {savingName ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section icon={EnvelopeIcon} title="Security">
        <div className="space-y-5">
          {/* Change email */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Change Email</p>
            <p className="mb-3 text-xs text-gray-400">
              Current: <span className="font-medium text-gray-600">{userEmail ?? '—'}</span>
            </p>
            <div className="space-y-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="New email address"
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Confirm with your password"
              />
              <Button
                size="sm"
                onClick={handleChangeEmail}
                disabled={savingEmail || !newEmail.trim() || !emailPassword}
                className="gap-1.5 rounded-xl"
              >
                <ArrowDownOnSquareIcon className="h-3.5 w-3.5" />
                {savingEmail ? 'Updating…' : 'Update email'}
              </Button>
            </div>
          </div>

          {/* Change password */}
          <div className="border-t border-gray-100 pt-5">
            <p className="mb-3 text-sm font-medium text-foreground">Change Password</p>
            <div className="space-y-2">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Current password"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="New password (min 8 characters)"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Confirm new password"
              />
              <Button
                size="sm"
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="gap-1.5 rounded-xl"
              >
                <LockClosedIcon className="h-3.5 w-3.5" />
                {savingPassword ? 'Updating…' : 'Change password'}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Organizations */}
      {organizations.length > 0 && (
        <Section icon={BuildingOffice2Icon} title="Organizations">
          <div className="space-y-2">
            {organizations.map((org) => {
              const isOwner = org.owner_id === userId
              return (
                <div
                  key={org.org_id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-400">{isOwner ? 'Owner' : 'Member'}</p>
                  </div>
                  {!isOwner && (
                    <button
                      onClick={() => setLeavingOrgId(org.org_id)}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      Leave
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Danger Zone */}
      <Section icon={ExclamationTriangleIcon} title="Danger Zone">
        <p className="mb-4 text-sm text-gray-500">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Delete account
        </button>
      </Section>

      {/* Leave Org Confirmation Modal */}
      {leavingOrgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Leave Organization?</h3>
            <p className="mt-2 text-sm text-gray-500">
              You will be removed from{' '}
              <span className="font-semibold text-gray-900">
                {organizations.find((o) => o.org_id === leavingOrgId)?.name ?? leavingOrgId}
              </span>{' '}
              immediately. An admin will need to send you a new invitation to rejoin.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setLeavingOrgId(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLeaveOrg(leavingOrgId)}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-red-600">Delete Account</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete your account, remove you from all organizations, and
              erase all your data. This cannot be undone.
            </p>
            <div className="mt-4">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                placeholder="Enter your password to confirm"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                }}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Support Settings section ──────────────────────────────────────────────────

// ── Support → Environment card ────────────────────────────────────────────
// The sandbox ↔ production switch. Lives at the top of Settings → Support
// (before the tab strip) so it's impossible to miss — pilot feedback was
// that the old Pilot Controls surface (on the unrouted SupportSettingsPage)
// couldn't be found at all. Environment changes apply immediately: going
// live requires the typed-org-name GoLiveModal (billing starts), returning
// to sandbox is a simple confirm.
function SupportEnvironmentCard() {
  const { currentOrgId, organizations } = useOrgStore()
  const orgName = organizations.find((o) => o.org_id === currentOrgId)?.name ?? ''
  const { config, updateConfig } = useSupportStore()
  const [envBusy, setEnvBusy] = useState(false)
  const [goLiveOpen, setGoLiveOpen] = useState(false)

  const environment = config?.environment ?? 'production'
  const isSandbox = environment === 'sandbox'

  const applyEnvironment = async (next: 'sandbox' | 'production') => {
    if (!currentOrgId) return
    setEnvBusy(true)
    try {
      // Store updateConfig refreshes the shared config, so the shell's
      // SANDBOX pill and the widget badge stay in sync automatically.
      await updateConfig(currentOrgId, { environment: next })
      setGoLiveOpen(false)
      toast.success(
        next === 'production'
          ? "You're live — your plan's limits now apply and your billing period has started."
          : 'Back in sandbox — real sends are suppressed and testing caps apply.'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change environment')
    } finally {
      setEnvBusy(false)
    }
  }

  const handleEnvClick = (next: 'sandbox' | 'production') => {
    if (next === environment || envBusy) return
    if (next === 'production') {
      setGoLiveOpen(true)
      return
    }
    if (
      window.confirm(
        'Return this workspace to sandbox? Real outbound sends will be suppressed and the widget will show a SANDBOX badge.'
      )
    ) {
      void applyEnvironment('sandbox')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Environment</h2>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider',
                isSandbox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {isSandbox ? 'SANDBOX' : 'LIVE'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {isSandbox ? (
              <>
                In <span className="font-medium">sandbox</span>, no real emails are sent (previewed
                only) and the widget shows a SANDBOX badge. Going live starts your billing period
                and applies your plan&apos;s limits.
              </>
            ) : (
              <>
                This workspace is <span className="font-medium">live</span>. Real outbound sends are
                active, and your plan&apos;s usage limits and billing now apply. You can return to
                sandbox to pause real sends and resume testing.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-none items-center gap-1 self-start rounded-lg bg-gray-100 p-1 sm:self-auto">
          <button
            type="button"
            disabled={envBusy}
            onClick={() => handleEnvClick('sandbox')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60',
              isSandbox ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Sandbox
          </button>
          <button
            type="button"
            disabled={envBusy}
            onClick={() => handleEnvClick('production')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60',
              !isSandbox ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            Production
          </button>
        </div>
      </div>

      {goLiveOpen && (
        <GoLiveModal
          orgName={orgName}
          orgId={currentOrgId ?? undefined}
          busy={envBusy}
          onConfirm={() => void applyEnvironment('production')}
          onClose={() => setGoLiveOpen(false)}
        />
      )}
    </div>
  )
}

type ComplianceDraft = {
  currency: string
  financial_advice_refusal: boolean
  sla_acknowledge_hours: number
  sla_resolution_hours: number
  kb_stale_after_days: number
}

function complianceDraftFromConfig(config: SupportConfig | null): ComplianceDraft {
  return {
    currency: config?.currency ?? 'USD',
    financial_advice_refusal: config?.financial_advice_refusal !== false,
    sla_acknowledge_hours: config?.sla_acknowledge_hours ?? 24,
    sla_resolution_hours: config?.sla_resolution_hours ?? 336,
    kb_stale_after_days: config?.kb_stale_after_days ?? 180,
  }
}

function SupportComplianceControls({
  orgId,
  config,
}: {
  orgId: string
  config: SupportConfig | null
}) {
  const { updateConfig } = useSupportStore()
  const [draft, setDraft] = useState<ComplianceDraft>(() => complianceDraftFromConfig(config))
  const [saved, setSaved] = useState<ComplianceDraft>(() => complianceDraftFromConfig(config))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const next = complianceDraftFromConfig(config)
    setDraft(next)
    setSaved(next)
  }, [config])

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const set = <K extends keyof ComplianceDraft>(key: K, value: ComplianceDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const next = {
        currency: draft.currency.trim().toUpperCase() || 'USD',
        financial_advice_refusal: draft.financial_advice_refusal,
        sla_acknowledge_hours: draft.sla_acknowledge_hours,
        sla_resolution_hours: draft.sla_resolution_hours,
        kb_stale_after_days: draft.kb_stale_after_days,
      }
      await updateConfig(orgId, next)
      setSaved(next)
      toast.success('Compliance controls saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save compliance controls')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-medium text-foreground">Compliance guardrails</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Controls for fintech-style deployments: currency, advice refusal, complaint SLAs, and KB
          freshness.
        </p>
      </div>
      <div className="divide-y">
        <ComplianceTextRow
          label="Currency"
          description="ISO code the assistant uses for amounts."
          value={draft.currency}
          maxLength={3}
          onChange={(value) => set('currency', value.toUpperCase())}
        />
        <ComplianceToggleRow
          label="Refuse financial / investment advice"
          description="Recommended for any organization that sells or services financial products."
          checked={draft.financial_advice_refusal}
          onChange={(value) => set('financial_advice_refusal', value)}
        />
        <ComplianceNumberRow
          label="Complaint acknowledgement SLA"
          description="Hours to first response before a complaint is flagged at risk."
          value={draft.sla_acknowledge_hours}
          suffix="hours"
          min={1}
          max={720}
          onChange={(value) => set('sla_acknowledge_hours', value)}
        />
        <ComplianceNumberRow
          label="Complaint resolution SLA"
          description="Hours to resolution before breach. A 14-day target is 336 hours."
          value={draft.sla_resolution_hours}
          suffix="hours"
          min={1}
          max={8760}
          onChange={(value) => set('sla_resolution_hours', value)}
        />
        <ComplianceNumberRow
          label="Flag knowledge as stale after"
          description="Articles older than this window are surfaced for review."
          value={draft.kb_stale_after_days}
          suffix="days"
          min={7}
          max={3650}
          onChange={(value) => set('kb_stale_after_days', value)}
        />
      </div>
      <div className="flex justify-end border-t bg-gray-50/60 px-4 py-3">
        <Button type="button" size="sm" disabled={!dirty || saving} onClick={save}>
          {saving ? 'Saving...' : dirty ? 'Save guardrails' : 'Saved'}
        </Button>
      </div>
    </div>
  )
}

function SupportHandoffControls({
  orgId,
  initial,
}: {
  orgId: string
  initial?: HandoffTriggersConfig
}) {
  const { updateConfig } = useSupportStore()
  const merged = (): Required<HandoffTriggersConfig> => ({
    ...HANDOFF_TRIGGER_DEFAULTS,
    ...(initial ?? {}),
  })
  const [draft, setDraft] = useState<Required<HandoffTriggersConfig>>(merged)
  const [saved, setSaved] = useState<Required<HandoffTriggersConfig>>(merged)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const next = merged()
    setDraft(next)
    setSaved(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const set = <K extends keyof HandoffTriggersConfig>(
    key: K,
    value: Required<HandoffTriggersConfig>[K]
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await updateConfig(orgId, { handoff_triggers: draft })
      setSaved(draft)
      toast.success('Automatic handoff triggers saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save handoff triggers')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-medium text-foreground">Automatic handoff triggers</p>
        <p className="mt-1 text-xs text-muted-foreground">
          When these rules fire, Lira opens a ticket for the team while the AI keeps chatting.
        </p>
      </div>
      <div className="divide-y">
        <HandoffTriggerRow
          label="VIP customer"
          description="A VIP or enterprise customer asks anything beyond a greeting."
          checked={draft.vip_auto_enabled}
          onChange={(value) => set('vip_auto_enabled', value)}
        />
        <HandoffTriggerRow
          label="Negative sentiment"
          description="The customer becomes frustrated or urgent after their first message."
          checked={draft.sentiment_enabled}
          onChange={(value) => set('sentiment_enabled', value)}
        />
        <HandoffTriggerRow
          label="Repeated failure"
          description="The customer keeps returning and the AI is not closing it out."
          checked={draft.repeated_failure_enabled}
          onChange={(value) => set('repeated_failure_enabled', value)}
          threshold={{
            value: draft.repeated_failure_threshold,
            suffix: 'messages',
            min: 2,
            max: 20,
            onChange: (value) => set('repeated_failure_threshold', value),
          }}
        />
        <HandoffTriggerRow
          label="Going in circles"
          description="The same question gets rephrased without progress."
          checked={draft.multi_turn_confusion_enabled}
          onChange={(value) => set('multi_turn_confusion_enabled', value)}
          threshold={{
            value: draft.multi_turn_confusion_threshold,
            suffix: 'similar messages',
            min: 2,
            max: 20,
            onChange: (value) => set('multi_turn_confusion_threshold', value),
          }}
        />
        <HandoffTriggerRow
          label="SLA pressure"
          description="A conversation stays open and unresolved past the time window."
          checked={draft.sla_pressure_enabled}
          onChange={(value) => set('sla_pressure_enabled', value)}
          threshold={{
            value: draft.sla_pressure_minutes,
            suffix: 'minutes',
            min: 1,
            max: 10080,
            onChange: (value) => set('sla_pressure_minutes', value),
          }}
        />
      </div>
      <div className="flex items-center justify-between border-t bg-gray-50/60 px-4 py-3">
        <button
          type="button"
          onClick={() => setDraft({ ...HANDOFF_TRIGGER_DEFAULTS })}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Reset to defaults
        </button>
        <Button type="button" size="sm" disabled={!dirty || saving} onClick={save}>
          {saving ? 'Saving...' : dirty ? 'Save triggers' : 'Saved'}
        </Button>
      </div>
    </div>
  )
}

function normalizeNumber(value: string, min: number, max: number): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return min
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function ComplianceTextRow({
  label,
  description,
  value,
  maxLength,
  onChange,
}: {
  label: string
  description: string
  value: string
  maxLength: number
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm uppercase outline-none focus:border-gray-900 sm:w-24"
      />
    </div>
  )
}

function ComplianceToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300"
      />
    </div>
  )
}

function ComplianceNumberRow({
  label,
  description,
  value,
  suffix,
  min,
  max,
  onChange,
}: {
  label: string
  description: string
  value: number
  suffix: string
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(normalizeNumber(event.target.value, min, max))}
          className="w-24 rounded-xl border border-input bg-background px-3 py-1.5 text-center text-sm outline-none focus:border-gray-900"
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  )
}

function HandoffTriggerRow({
  label,
  description,
  checked,
  onChange,
  threshold,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  threshold?: {
    value: number
    suffix: string
    min: number
    max: number
    onChange: (value: number) => void
  }
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />
      </div>
      {threshold && checked && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Fires after</span>
          <input
            type="number"
            min={threshold.min}
            max={threshold.max}
            value={threshold.value}
            onChange={(event) =>
              threshold.onChange(normalizeNumber(event.target.value, threshold.min, threshold.max))
            }
            className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-center text-xs outline-none focus:border-gray-900"
          />
          <span>{threshold.suffix}</span>
        </div>
      )}
    </div>
  )
}

function SupportSettingsSection() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentOrgId, organizations } = useOrgStore()
  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)
  const { config, loadConfig, updateConfig } = useSupportStore()
  const [saving, setSaving] = useState(false)

  const [emailEnabled, setEmailEnabled] = useState(false)
  const [customSupportEmail, setCustomSupportEmail] = useState('')
  const [chatEnabled, setChatEnabled] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [portalEnabled, setPortalEnabled] = useState(false)
  const [portalSlug, setPortalSlug] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [portalColor, setPortalColor] = useState('#3730a3')
  const [portalLogoUrl, setPortalLogoUrl] = useState('')
  const [portalGreeting, setPortalGreeting] = useState('')
  const [portalChatEnabled, setPortalChatEnabled] = useState(true)
  const [portalVoiceEnabled, setPortalVoiceEnabled] = useState(true)
  const [portalTicketsEnabled, setPortalTicketsEnabled] = useState(true)
  const [portalTrackEnabled, setPortalTrackEnabled] = useState(true)
  const [widgetColor, setWidgetColor] = useState('#3730a3')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [forceEscalateIntents, setForceEscalateIntents] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [linearTeam, setLinearTeam] = useState('')
  const [escalationEmail, setEscalationEmail] = useState('')
  const [greetingMessage, setGreetingMessage] = useState('Hello! How can I help you today?')
  const [slaHours, setSlaHours] = useState(4)

  useEffect(() => {
    if (!currentOrgId) return
    loadConfig(currentOrgId)
  }, [currentOrgId, loadConfig])

  useEffect(() => {
    if (!config) return
    setEmailEnabled(config.email_enabled)
    setCustomSupportEmail(config.custom_support_email ?? '')
    setChatEnabled(config.chat_enabled)
    setVoiceEnabled(config.voice_enabled)
    setPortalEnabled(config.portal_enabled ?? false)
    // If portal is on but no slug was ever persisted (older activations had a
    // bug where the slug was sent as undefined), derive one from the org name
    // so the field shows something meaningful. User can edit + Save to commit.
    const derivedSlug =
      (currentOrg?.name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'my-company'
    setPortalSlug(config.portal_slug || (config.portal_enabled ? derivedSlug : ''))
    setCustomDomain(config.custom_domain ?? '')
    setPortalColor(config.portal_color ?? config.widget_color ?? '#3730a3')
    setPortalLogoUrl(config.portal_logo_url ?? '')
    setPortalGreeting(config.portal_greeting ?? '')
    setPortalChatEnabled(config.portal_chat_enabled ?? config.chat_enabled ?? true)
    setPortalVoiceEnabled(config.portal_voice_enabled ?? config.voice_enabled ?? true)
    setPortalTicketsEnabled(config.portal_tickets_enabled ?? true)
    setPortalTrackEnabled(config.portal_track_enabled ?? true)
    setWidgetColor(config.widget_color ?? '#1A1A1A')
    setAutoReplyEnabled(config.auto_reply_enabled ?? true)
    setConfidenceThreshold(config.confidence_threshold ?? 0.5)
    // Fields may be undefined when the support module isn't activated
    // yet (backend now returns `{ org_id, activated: false }` instead of
    // 404 for un-activated orgs). Defaulting prevents the .join() crash
    // that blanked this whole tab.
    setForceEscalateIntents((config.force_escalate_intents ?? []).join(', '))
    setSlackChannel(config.escalation_slack_channel ?? '')
    setLinearTeam(config.escalation_linear_team ?? '')
    setEscalationEmail(config.escalation_email ?? '')
    setGreetingMessage(config.greeting_message ?? 'Hello! How can I help you today?')
    setSlaHours(config.sla_hours ?? 4)
  }, [config, currentOrg?.name])

  const handleSave = useCallback(async () => {
    if (!currentOrgId) return
    setSaving(true)
    try {
      await updateConfig(currentOrgId, {
        email_enabled: emailEnabled,
        custom_support_email: customSupportEmail.trim() || undefined,
        chat_enabled: chatEnabled,
        voice_enabled: voiceEnabled,
        portal_enabled: portalEnabled,
        portal_slug: portalSlug.trim() || undefined,
        custom_domain: customDomain.trim().toLowerCase() || undefined,
        portal_color: portalColor || undefined,
        portal_logo_url: portalLogoUrl.trim() || undefined,
        portal_greeting: portalGreeting.trim() || undefined,
        portal_chat_enabled: portalChatEnabled,
        portal_voice_enabled: portalVoiceEnabled,
        portal_tickets_enabled: portalTicketsEnabled,
        portal_track_enabled: portalTrackEnabled,
        widget_color: widgetColor || undefined,
        auto_reply_enabled: autoReplyEnabled,
        confidence_threshold: confidenceThreshold,
        force_escalate_intents: forceEscalateIntents
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        escalation_slack_channel: slackChannel || undefined,
        escalation_linear_team: linearTeam || undefined,
        escalation_email: escalationEmail.trim() || undefined,
        greeting_message: greetingMessage.trim() || undefined,
        sla_hours: slaHours,
      })
      toast.success('Support settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [
    currentOrgId,
    emailEnabled,
    customSupportEmail,
    chatEnabled,
    voiceEnabled,
    portalEnabled,
    portalSlug,
    customDomain,
    portalColor,
    portalLogoUrl,
    portalGreeting,
    portalChatEnabled,
    portalVoiceEnabled,
    portalTicketsEnabled,
    portalTrackEnabled,
    widgetColor,
    autoReplyEnabled,
    confidenceThreshold,
    forceEscalateIntents,
    slackChannel,
    linearTeam,
    escalationEmail,
    greetingMessage,
    slaHours,
    updateConfig,
  ])

  // Grouped tab keys. The old granular keys (widget/secret/mobile/whatsapp/
  // portal/capabilities/audit) still resolve via LEGACY_SUPPORT_TAB_MAP so any
  // stored value, deep link, or internal setActiveTab('widget') keeps working.
  const activeTab = getSupportTabFromSearch(location.search)

  const setActiveTab = (key: string) => {
    const next = LEGACY_SUPPORT_TAB_MAP[key] ?? 'connect'
    navigate(`/settings?tab=support&supportTab=${next}`, { replace: true })
  }

  // Show the "not activated" prompt for both null configs AND for the
  // empty default the backend now returns for unactivated orgs.
  if (!config || !config.activated) {
    return (
      <Section icon={ChatBubbleLeftEllipsisIcon} title="Customer Support">
        <p className="text-sm text-muted-foreground">
          Support module is not activated yet. Go to{' '}
          <a href="/support/activate" className="font-semibold text-[#3730a3] hover:underline">
            Support &rarr; Activate
          </a>{' '}
          to get started.
        </p>
      </Section>
    )
  }

  const SUPPORT_TABS: Array<{
    key: SupportSettingsTabKey
    label: string
    icon: typeof CodeBracketIcon
    description: string
  }> = [
    {
      key: 'connect',
      label: 'Get connected',
      icon: CodeBracketIcon,
      description:
        'Install Lira in your product: the web SDK embed, the signing secret for identified visitors, and mobile.',
    },
    {
      key: 'channels',
      label: 'Channels',
      icon: EnvelopeIcon,
      description:
        'Where customers reach you: web chat, voice, email, WhatsApp, and the Lira-hosted page.',
    },
    {
      key: 'behavior',
      label: 'Behavior',
      icon: SparklesIcon,
      description: 'How Lira replies and when it holds back — auto-reply, confidence, and limits.',
    },
    {
      key: 'actions',
      label: 'Actions',
      icon: BoltIcon,
      description: 'Connect your systems and choose what Lira is allowed to do for a customer.',
    },
    {
      key: 'escalation',
      label: 'Escalation',
      icon: ExclamationTriangleIcon,
      description:
        'Where conversations go when a human needs to step in: email, SLA, Slack, and Linear.',
    },
    {
      key: 'health',
      label: 'Health & audit',
      icon: ShieldCheckIcon,
      description:
        'Integration diagnostics plus a log of every action the agent ran on your behalf.',
    },
  ]

  const escapedGreeting = (greetingMessage ?? 'Hi! How can we help?').replace(/"/g, '&quot;')
  const widgetEmbedSnippet = [
    '<script',
    '  src="https://widget.liraintelligence.com/v1/widget.js"',
    `  data-org-id="${config.org_id}"`,
    `  data-greeting="${escapedGreeting}"`,
    '  data-position="bottom-right">',
    '</script>',
  ].join('\n')
  const fullPageEmbedSnippet = [
    '<div id="lira-support-root" style="height: 720px;"></div>',
    '<script',
    '  src="https://widget.liraintelligence.com/v1/widget.js"',
    `  data-org-id="${config.org_id}"`,
    '  data-mode="fullscreen"',
    '  data-target="#lira-support-root"',
    `  data-greeting="${escapedGreeting}">`,
    '</script>',
  ].join('\n')
  const jsSdkSnippet = [
    '<div id="lira-support-root" style="height: 720px;"></div>',
    '<script src="https://widget.liraintelligence.com/v1/widget.js"></script>',
    '<script>',
    '  window.Lira.init({',
    `    orgId: '${config.org_id}',`,
    "    orgName: 'Your company',",
    `    primaryColor: '${widgetColor}',`,
    `    greeting: '${(greetingMessage ?? 'Hi! How can we help?').replace(/'/g, "\\'")}'`,
    '  })',
    '',
    '  window.Lira.identify({',
    '    email: currentUser.email,',
    '    name: currentUser.name,',
    '    sig: serverGeneratedHmac',
    '  })',
    '',
    '  window.Lira.setContext({',
    '    route: window.location.pathname,',
    '    account: { id: currentUser.accountId, plan: currentUser.plan }',
    '  })',
    '',
    "  window.Lira.mountSupportPage('#lira-support-root')",
    '</script>',
  ].join('\n')
  const npmSdkSnippet = [
    '# After @liraintelligence/support is published to your npm registry',
    'npm install @liraintelligence/support',
    '',
    "import { init, identify, setContext, mountSupportPage, registerAction } from '@liraintelligence/support'",
    '',
    `await init({ orgId: '${config.org_id}', orgName: 'Your company' })`,
    'await identify({ email: currentUser.email, name: currentUser.name, sig: serverGeneratedHmac })',
    'await setContext({ route: window.location.pathname, account: currentUser.account })',
    '',
    "registerAction('billing.open_checkout', async ({ payload }) => {",
    '  await openCheckout(payload)',
    "  return { ok: true, message: 'Checkout opened' }",
    '})',
    '',
    "await mountSupportPage('#lira-support-root')",
  ].join('\n')

  return (
    <SettingsShell
      title="Customer Support"
      description="How Lira answers, what it can do, and where humans step in."
      docsUrl="https://docs.liraintelligence.com/platform/customer-support"
    >
      {/* Environment (sandbox ↔ production) — always visible, above the tabs */}
      <SupportEnvironmentCard />

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <SideNav tabs={SUPPORT_TABS} active={activeTab} onChange={setActiveTab} />
        <div className="min-w-0 flex-1">
          {/* ── Get connected: Web SDK ── */}
          {activeTab === 'connect' && (
            <>
              <SCard
                title="Install Lira"
                hint="Add Lira to your product — pick the method that fits your stack."
              >
                <CodeTabs
                  methods={[
                    {
                      key: 'widget',
                      label: 'Web widget',
                      desc: 'A floating chat launcher for any page. The quickest way to go live.',
                      code: widgetEmbedSnippet,
                    },
                    {
                      key: 'fullpage',
                      label: 'Full page',
                      desc: 'A full support experience on your own route (e.g. /support). Recommended for logged-in products.',
                      code: fullPageEmbedSnippet,
                    },
                    {
                      key: 'js',
                      label: 'JavaScript',
                      desc: 'Identify signed-in users and pass live context like plan, route, or billing status.',
                      code: jsSdkSnippet,
                    },
                    {
                      key: 'npm',
                      label: 'npm',
                      desc: 'Typed imports and registered actions for React, Next.js, Vue, or any bundled app.',
                      code: npmSdkSnippet,
                    },
                  ]}
                />
              </SCard>

              <SCard
                title="Appearance & greeting"
                hint="How the widget looks, and its first message."
              >
                <div className="pb-3.5">
                  <p className="mb-2 text-[13px] font-semibold text-gray-900">Brand color</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5"
                    />
                    <input
                      type="text"
                      value={widgetColor}
                      onChange={(e) => {
                        if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                          setWidgetColor(e.target.value)
                      }}
                      maxLength={7}
                      className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-gray-900"
                    />
                    <div className="h-9 flex-1 rounded-lg" style={{ background: widgetColor }} />
                  </div>
                </div>
                <SField label="Greeting message" hint="The opening message shown when chat loads.">
                  <textarea
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    rows={2}
                    placeholder="Hello! How can I help you today?"
                    className={cn(fieldInputCls, 'resize-none')}
                  />
                </SField>
              </SCard>

              <SCard title="Developer options">
                <Disclosure
                  title="Signing secret for logged-in customers"
                  desc="Verify identified visitors with an HMAC signature so Lira can trust who they are."
                >
                  <SupportSecretTab orgId={config.org_id} secret={config.widget_secret ?? null} />
                </Disclosure>
                <Disclosure title="Mobile SDKs" desc="Native iOS and Android — on the roadmap.">
                  <SupportMobileTab />
                </Disclosure>
              </SCard>
            </>
          )}

          {/* ── Health & audit ── */}
          {activeTab === 'health' && (
            <>
              <SCard
                title="Integration health"
                hint="Run diagnostics on demand to confirm your setup is working."
              >
                <SupportHealthTab orgId={currentOrgId!} />
              </SCard>
              <SCard
                title="Agent audit log"
                hint="Every resource and action the agent used while helping customers."
              >
                <SupportAuditTab orgId={currentOrgId!} />
              </SCard>
            </>
          )}

          {/* ── Channels: core channels ── */}
          {activeTab === 'channels' && (
            <SCard title="Where customers reach you" hint="Turn a channel on to configure it.">
              <SRow
                label="Web chat"
                desc="The floating widget and full-page support on your site or app."
                control={
                  <SToggle checked={chatEnabled} onChange={setChatEnabled} label="Web chat" />
                }
              />
              <SRow
                label="Voice"
                desc="Spoken support powered by Lira's voice."
                control={
                  <SToggle checked={voiceEnabled} onChange={setVoiceEnabled} label="Voice" />
                }
              />
              <div className="border-t border-gray-100 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Receive and answer customer emails.
                    </p>
                  </div>
                  <SToggle checked={emailEnabled} onChange={setEmailEnabled} label="Email" />
                </div>
                {config.email_address && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      Your Lira support address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate font-mono text-xs text-gray-800">
                        {config.email_address}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(config.email_address ?? '')
                          toast.success('Copied!')
                        }}
                        className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-200"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Share with customers or set as a forwarding destination.
                    </p>
                  </div>
                )}
                {emailEnabled && (
                  <div className="mt-3">
                    <SField
                      label="Custom address (optional)"
                      hint="Forward this address to your Lira support address in your email provider."
                    >
                      <input
                        type="email"
                        value={customSupportEmail}
                        onChange={(e) => setCustomSupportEmail(e.target.value)}
                        placeholder="support@yourcompany.com"
                        className={fieldInputCls}
                      />
                    </SField>
                    {customSupportEmail.trim() && config.email_address && (
                      <Callout>
                        Create a forwarding rule from <strong>{customSupportEmail.trim()}</strong>{' '}
                        to <strong className="font-mono">{config.email_address}</strong>.
                      </Callout>
                    )}
                  </div>
                )}
              </div>
            </SCard>
          )}

          {/* ── Channels: WhatsApp ── */}
          {activeTab === 'channels' && (
            <SCard title="WhatsApp Business" hint="Answer on a WhatsApp number too.">
              <Disclosure
                title="Set up WhatsApp"
                desc="Meta credentials, message templates, and webhook."
              >
                <SupportWhatsAppTab orgId={currentOrgId!} />
              </Disclosure>
            </SCard>
          )}

          {/* ── Channels: hosted page (formerly the "Hosted" / portal tab) ── */}
          {activeTab === 'channels' && (
            <SCard
              title="Lira-hosted page"
              hint="A ready-made support page if you can't embed the widget yet."
            >
              <Disclosure
                title="Set up hosted page & branding"
                desc="Page address, custom domain, branding, and features."
              >
                <Callout>
                  For production, prefer embedding the Web SDK inside your own{' '}
                  <code className="font-mono">/support</code> route — it keeps your URL and app
                  shell. Use this hosted page as a no-code fallback.
                </Callout>

                {/* Access */}
                <div className="rounded-lg border px-4 py-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Hosted Support Portal</p>
                      <p className="text-xs text-muted-foreground">
                        Optional Lira-hosted fallback page for customers without an SDK integration.
                      </p>
                    </div>
                    <label aria-label="Toggle support portal" className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={portalEnabled}
                        onChange={(e) => setPortalEnabled(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </label>
                  </div>

                  {portalEnabled && (
                    <div className="space-y-3 border-t border-gray-100 pt-3">
                      {/* Slug */}
                      <div>
                        <label
                          htmlFor="portal-slug-input"
                          className="block text-xs font-semibold text-gray-500"
                        >
                          Portal URL
                        </label>
                        <div className="mt-1 flex items-center">
                          <span className="shrink-0 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400">
                            support.liraintelligence.com/
                          </span>
                          <input
                            id="portal-slug-input"
                            type="text"
                            value={portalSlug}
                            onChange={(e) =>
                              setPortalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                            }
                            placeholder="my-company"
                            className="flex-1 rounded-r-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
                          />
                        </div>
                      </div>

                      {config.portal_slug && (
                        <a
                          href={`https://support.liraintelligence.com/${config.portal_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#3730a3] hover:underline"
                        >
                          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          Open portal
                        </a>
                      )}

                      {/* Custom domain */}
                      <div className="border-t border-gray-100 pt-3">
                        <label
                          htmlFor="portal-custom-domain"
                          className="block text-xs font-semibold text-gray-500"
                        >
                          Custom Domain{' '}
                          <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                          id="portal-custom-domain"
                          type="text"
                          value={customDomain}
                          onChange={(e) =>
                            setCustomDomain(e.target.value.toLowerCase().replace(/\s/g, ''))
                          }
                          placeholder="support.yourcompany.com"
                          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add a CNAME from your domain to{' '}
                          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]">
                            support.liraintelligence.com
                          </code>
                          , then enter it above.
                        </p>
                        {config.custom_domain && (
                          <a
                            href={`https://${config.custom_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#3730a3] hover:underline"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            Open {config.custom_domain}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {!portalEnabled && (
                    <p className="text-xs text-muted-foreground">
                      Enable the hosted fallback to configure its URL, branding, and features.
                    </p>
                  )}
                </div>

                {/* Branding */}
                {portalEnabled && (
                  <>
                    <div className="rounded-lg border px-4 py-3 space-y-3">
                      <p className="text-sm font-medium text-foreground">Branding</p>
                      <p className="text-xs text-muted-foreground">
                        Customize the portal to match your brand.
                      </p>

                      {/* Portal color */}
                      <div>
                        <label
                          htmlFor="portal-brand-color-text"
                          className="block text-xs font-semibold text-gray-500 mb-2"
                        >
                          Brand Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={portalColor}
                            onChange={(e) => setPortalColor(e.target.value)}
                            className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5"
                          />
                          <input
                            id="portal-brand-color-text"
                            type="text"
                            value={portalColor}
                            onChange={(e) => {
                              if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                                setPortalColor(e.target.value)
                            }}
                            maxLength={7}
                            className="w-28 rounded-xl border border-input bg-background px-3 py-1.5 font-mono text-sm outline-none focus:border-gray-900"
                          />
                          <div
                            className="h-9 flex-1 rounded-lg"
                            style={{ background: portalColor }}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            '#3730a3',
                            '#1d4ed8',
                            '#0891b2',
                            '#059669',
                            '#d97706',
                            '#dc2626',
                            '#7c3aed',
                            '#db2777',
                            '#1a1a2e',
                          ].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setPortalColor(c)}
                              className={cn(
                                'h-7 w-7 rounded-md border-2 transition',
                                portalColor === c
                                  ? 'border-gray-900 scale-110'
                                  : 'border-transparent hover:scale-105'
                              )}
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Used for header, buttons, and chat bubbles. Defaults to your widget color.
                        </p>
                      </div>

                      {/* Logo */}
                      <div className="border-t border-gray-100 pt-3">
                        <label
                          htmlFor="portal-logo-url"
                          className="block text-xs font-semibold text-gray-500"
                        >
                          Logo URL <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                          id="portal-logo-url"
                          type="url"
                          value={portalLogoUrl}
                          onChange={(e) => setPortalLogoUrl(e.target.value.trim())}
                          placeholder="https://yourcompany.com/logo.png"
                          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
                        />
                        {portalLogoUrl && (
                          <div className="mt-2 flex items-center gap-3">
                            <img
                              src={portalLogoUrl}
                              alt="Logo preview"
                              className="h-8 max-w-[120px] object-contain rounded"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <span className="text-xs text-muted-foreground">Preview</span>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Shown in the portal header. Use a transparent PNG or SVG.
                        </p>
                      </div>
                    </div>

                    {/* Portal Greeting */}
                    <div className="rounded-lg border px-4 py-3">
                      <p className="mb-1 text-sm font-medium text-foreground">Portal Greeting</p>
                      <textarea
                        value={portalGreeting}
                        onChange={(e) => setPortalGreeting(e.target.value)}
                        rows={2}
                        placeholder={config.greeting_message ?? 'Hello! How can I help you today?'}
                        className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900 resize-none"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Opening message on the portal. Leave blank to use your widget greeting.
                      </p>
                    </div>

                    {/* Features */}
                    <div className="rounded-lg border px-4 py-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Portal Features</p>
                        <p className="text-xs text-muted-foreground">
                          Choose which capabilities customers see on the portal.
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        {(
                          [
                            {
                              id: 'p-chat',
                              label: 'Live Chat',
                              desc: 'Real-time chat with Lira AI',
                              value: portalChatEnabled,
                              set: setPortalChatEnabled,
                            },
                            {
                              id: 'p-voice',
                              label: 'Voice',
                              desc: 'Talk via voice call',
                              value: portalVoiceEnabled,
                              set: setPortalVoiceEnabled,
                            },
                            {
                              id: 'p-tickets',
                              label: 'Submit a Request',
                              desc: 'Submit a support ticket',
                              value: portalTicketsEnabled,
                              set: setPortalTicketsEnabled,
                            },
                            {
                              id: 'p-track',
                              label: 'Track Tickets',
                              desc: 'View and follow up on past requests',
                              value: portalTrackEnabled,
                              set: setPortalTrackEnabled,
                            },
                          ] as const
                        ).map((f) => (
                          <label
                            key={f.id}
                            htmlFor={f.id}
                            aria-label={f.label}
                            className="flex items-start gap-2.5 cursor-pointer"
                          >
                            <input
                              id={f.id}
                              type="checkbox"
                              checked={f.value}
                              onChange={(e) => f.set(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700">{f.label}</span>
                              <p className="text-xs text-muted-foreground">{f.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Customer Login */}
                    <div className="rounded-lg border px-4 py-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Customer Login</p>
                        <p className="text-xs text-muted-foreground">
                          How customers identify themselves on the portal.
                        </p>
                      </div>

                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 space-y-0.5">
                        <p className="text-xs font-semibold text-emerald-800">
                          Magic Link — Active
                        </p>
                        <p className="text-xs text-emerald-700">
                          Customers enter their email and receive a one-time sign-in link. No
                          password required.
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 space-y-0.5 opacity-60">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-gray-700">
                            Identity Verification / SSO
                          </p>
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            Coming soon
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Connect your own auth system. Generate a signed JWT with the customer's
                          email — the portal trusts it automatically.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </Disclosure>
            </SCard>
          )}

          {/* ── Behavior tab ── */}
          {activeTab === 'behavior' && (
            <>
              <SCard
                title="Replies"
                hint="When Lira answers on its own, and how sure it must be before it does."
              >
                <SRow
                  label="Auto-reply"
                  desc="Lira answers customers automatically when it's confident. Off = it drafts a reply for a human to send."
                  control={
                    <SToggle
                      checked={autoReplyEnabled}
                      onChange={setAutoReplyEnabled}
                      label="Auto-reply"
                    />
                  }
                />
                <div className="border-t border-gray-100 pt-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Confidence to answer</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Below this, Lira hands the conversation to a human instead of guessing.
                      </p>
                    </div>
                    <div className="shrink-0 text-2xl font-extrabold tabular-nums text-gray-900">
                      {Math.round(confidenceThreshold * 100)}
                      <span className="text-sm font-semibold text-gray-400">%</span>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex rounded-xl bg-gray-100 p-1">
                    {(
                      [
                        ['Cautious', 0.55],
                        ['Balanced', 0.7],
                        ['Strict', 0.85],
                      ] as Array<[string, number]>
                    ).map(([lbl, v]) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setConfidenceThreshold(v)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                          Math.round(confidenceThreshold * 100) === Math.round(v * 100)
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        )}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(confidenceThreshold * 100)}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                    className="mt-3 w-full accent-[#1A1A1A]"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Answers more, asks humans less</span>
                    <span>Answers only when very sure</span>
                  </div>
                </div>
              </SCard>

              {config && (
                <SCard title="This month" hint="Usage against your plan. Read-only.">
                  <div className="grid grid-cols-2 gap-3">
                    <StatTile
                      label="Conversations"
                      value={config.conversations_this_month ?? 0}
                      max={config.max_conversations_per_month}
                    />
                    <StatTile
                      label="AI replies"
                      value={config.ai_replies_this_month ?? 0}
                      max={config.max_ai_replies_per_month}
                    />
                  </div>
                </SCard>
              )}

              <SCard title="Advanced" hint="Most teams never touch these. Open only what you need.">
                <Disclosure
                  title="Always escalate certain topics"
                  desc="Named topics skip the AI and go straight to a human."
                >
                  <SField
                    label="Topics that always escalate"
                    hint="Comma-separated. Lira routes these to a human no matter how confident it is."
                  >
                    <input
                      type="text"
                      value={forceEscalateIntents}
                      onChange={(e) => setForceEscalateIntents(e.target.value)}
                      placeholder="fraud, account_security, legal"
                      className={fieldInputCls}
                    />
                  </SField>
                </Disclosure>
                <Disclosure
                  title="Compliance guardrails"
                  tag="Fintech"
                  desc="Rules for regulated support: advice limits, complaint timing, currency."
                >
                  <SupportComplianceControls orgId={currentOrgId!} config={config} />
                </Disclosure>
              </SCard>
            </>
          )}

          {/* ── Actions tab: connect systems + choose what the AI can do ── */}
          {activeTab === 'actions' && (
            <>
              <SCard
                title="Connect a system"
                hint="Let Lira take real actions by calling your own systems. MCP is the recommended path — your tools run under your own auth, and every call still passes Lira's policy, confirmation/step-up, audit and metering."
              >
                <SupportMcpConnector />
              </SCard>

              <SCard
                title="REST adapter"
                hint="No MCP server yet? Connect a REST API that follows Lira's convention, or a thin adapter in front of your real API. Best for simpler APIs."
              >
                <SupportToolPacksPanel />
              </SCard>

              <SCard title="Advanced">
                <Disclosure
                  title="Manually registered actions"
                  tag="SDK"
                  desc="Declare a server-side action by name so the AI knows it exists. Most orgs use MCP above instead."
                >
                  <SupportCapabilitiesTab orgId={currentOrgId!} />
                </Disclosure>
              </SCard>
            </>
          )}

          {/* ── Escalation tab ── */}
          {activeTab === 'escalation' && (
            <>
              <SCard
                title="When a human takes over"
                hint="Where escalated conversations go, and how fast they should be answered."
              >
                <SField
                  label="Escalation email"
                  hint="Lira alerts this address whenever a conversation is escalated."
                >
                  <input
                    type="email"
                    value={escalationEmail}
                    onChange={(e) => setEscalationEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={fieldInputCls}
                  />
                </SField>
                <div className="border-t border-gray-100 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-gray-900">Response time target</p>
                    <span className="text-sm font-bold tabular-nums text-gray-900">
                      {slaHours}h
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={72}
                    value={slaHours}
                    onChange={(e) => setSlaHours(Number(e.target.value))}
                    className="mt-2 w-full accent-[#1A1A1A]"
                  />
                  <p className="mt-1 text-[11.5px] text-gray-400">
                    An escalated ticket is flagged as overdue after this many hours.
                  </p>
                </div>
              </SCard>

              <SCard title="Notifications" hint="Optional back-channels for your team.">
                <SField label="Slack channel" hint="Escalation alerts post here.">
                  <input
                    type="text"
                    value={slackChannel}
                    onChange={(e) => setSlackChannel(e.target.value)}
                    placeholder="#support-escalations"
                    className={fieldInputCls}
                  />
                </SField>
                <SField
                  label="Linear team"
                  hint="Escalated tickets open as Linear issues in this team."
                >
                  <input
                    type="text"
                    value={linearTeam}
                    onChange={(e) => setLinearTeam(e.target.value)}
                    placeholder="Team ID or name"
                    className={fieldInputCls}
                  />
                </SField>
              </SCard>

              <SCard
                title="Automatic handoff"
                hint="Let Lira bring in a human on its own when a conversation goes sideways."
              >
                <Disclosure
                  title="When to bring in a human"
                  desc="VIP customers, negative sentiment, repeated failures, and more."
                >
                  <SupportHandoffControls orgId={currentOrgId!} initial={config.handoff_triggers} />
                </Disclosure>
              </SCard>
            </>
          )}

          <SaveBar onSave={handleSave} saving={saving} />
        </div>
      </div>
    </SettingsShell>
  )
}

/** Grouped Support-settings tab keys (post-consolidation). */
type SupportSettingsTabKey =
  | 'connect'
  | 'channels'
  | 'behavior'
  | 'actions'
  | 'escalation'
  | 'health'

/**
 * Maps the pre-consolidation tab keys (one tab per feature) to the grouped
 * tabs, so old deep links / stored values / internal setActiveTab('widget')
 * calls resolve to the right group. New keys map to themselves.
 */
const LEGACY_SUPPORT_TAB_MAP: Record<string, SupportSettingsTabKey> = {
  connect: 'connect',
  widget: 'connect',
  secret: 'connect',
  mobile: 'connect',
  channels: 'channels',
  whatsapp: 'channels',
  portal: 'channels',
  behavior: 'behavior',
  actions: 'actions',
  // 'capabilities' used to live under the behavior tab; it now lives under Actions.
  capabilities: 'actions',
  escalation: 'escalation',
  health: 'health',
  audit: 'health',
}

function getSettingsTabFromSearch(search: string): SettingsTab {
  const requested = new URLSearchParams(search).get('tab')
  return SETTINGS_TABS.some((tab) => tab.id === requested) ? (requested as SettingsTab) : 'account'
}

function getSupportTabFromSearch(search: string): SupportSettingsTabKey {
  const requested = new URLSearchParams(search).get('supportTab')
  return requested ? (LEGACY_SUPPORT_TAB_MAP[requested] ?? 'connect') : 'connect'
}

/**
 * Meta-side prerequisites the CUSTOMER completes before Lira can operate
 * their WhatsApp channel. Shown as a guided checklist so onboarding needs
 * no back-and-forth with the Lira team.
 */
const WHATSAPP_PREREQUISITES: Array<{ label: string; detail: string }> = [
  {
    label: 'Meta Business Portfolio',
    detail: 'Create or confirm your Business Manager account at business.facebook.com.',
  },
  {
    label: 'WhatsApp Business Account (WABA)',
    detail: 'Create/connect a WABA and note its WABA ID.',
  },
  {
    label: 'Production phone number',
    detail:
      'Add and verify the number customers will message. A number already used in the WhatsApp app must be migrated first.',
  },
  {
    label: 'Business verification & display name',
    detail: 'Complete Meta business verification and submit your display name for review.',
  },
  {
    label: 'System-user access token',
    detail:
      'Generate a token with whatsapp_business_messaging + whatsapp_business_management permissions, scoped to your WABA and number.',
  },
  {
    label: 'Message templates',
    detail:
      'Create and submit outbound templates in Meta (acknowledgement, ticket updates, handoff, CSAT). Add approved names to the template allowlist below.',
  },
]

function SupportWhatsAppTab({ orgId }: { orgId: string }) {
  const planTier = useAuthStore((s) => s.planTier)
  const [orgPlan, setOrgPlan] = useState<MyPlan | null>(null)
  const whatsappEntitled =
    orgPlan?.entitlements.whatsappBusinessApi ?? (planTier === 'SCALE' || planTier === 'ENTERPRISE')
  const [config, setConfig] = useState<WhatsAppChannelConfig | null>(null)
  const [summary, setSummary] = useState<WhatsAppAnalyticsSummary | null>(null)
  const [events, setEvents] = useState<WhatsAppAnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [ingestEnabled, setIngestEnabled] = useState(false)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [realSendEnabled, setRealSendEnabled] = useState(false)
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox')
  const [wabaId, setWabaId] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [graphApiVersion, setGraphApiVersion] = useState('v23.0')
  const [allowedTemplates, setAllowedTemplates] = useState('')
  const [optOutKeywords, setOptOutKeywords] = useState('stop, unsubscribe')
  const [accessToken, setAccessToken] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [verifyToken, setVerifyToken] = useState('')

  const callbackUrl = `${env.VITE_API_URL}/lira/v1/support/whatsapp/webhook/${encodeURIComponent(
    orgId
  )}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [channelConfig, analytics, recentEvents] = await Promise.all([
        getWhatsAppChannelConfig(orgId),
        getWhatsAppAnalyticsSummary(orgId, 30).catch(() => null),
        listWhatsAppAnalyticsEvents(orgId, { limit: 8 }).catch(() => []),
      ])
      setOrgPlan(await getMyPlan(orgId).catch(() => null))
      setConfig(channelConfig)
      setSummary(analytics)
      setEvents(recentEvents)
      setEnabled(channelConfig?.enabled ?? false)
      setIngestEnabled(channelConfig?.ingest_enabled ?? false)
      setAutoReplyEnabled(channelConfig?.auto_reply_enabled ?? false)
      setRealSendEnabled(channelConfig?.real_send_enabled ?? false)
      setEnvironment(channelConfig?.environment ?? 'sandbox')
      setWabaId(channelConfig?.waba_id ?? '')
      setPhoneNumberId(channelConfig?.phone_number_id ?? '')
      setDisplayPhoneNumber(channelConfig?.display_phone_number ?? '')
      setDisplayName(channelConfig?.display_name ?? '')
      setGraphApiVersion(channelConfig?.graph_api_version ?? 'v23.0')
      setAllowedTemplates((channelConfig?.allowed_template_names ?? []).join(', '))
      setOptOutKeywords((channelConfig?.opt_out_keywords ?? ['stop', 'unsubscribe']).join(', '))
      setAccessToken('')
      setAppSecret('')
      setVerifyToken('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load WhatsApp settings')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const updated = await updateWhatsAppChannelConfig(orgId, {
        enabled,
        ingest_enabled: ingestEnabled,
        auto_reply_enabled: autoReplyEnabled,
        real_send_enabled: realSendEnabled,
        environment,
        waba_id: wabaId.trim() || undefined,
        phone_number_id: phoneNumberId.trim() || undefined,
        display_phone_number: displayPhoneNumber.trim() || undefined,
        display_name: displayName.trim() || undefined,
        graph_api_version: graphApiVersion.trim() || 'v23.0',
        allowed_template_names: allowedTemplates
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        opt_out_keywords: optOutKeywords
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
        access_token: accessToken.trim() || undefined,
        app_secret: appSecret.trim() || undefined,
        verify_token: verifyToken.trim() || undefined,
      })
      setConfig(updated)
      setAccessToken('')
      setAppSecret('')
      setVerifyToken('')
      toast.success('WhatsApp settings saved')
      const [analytics, recentEvents] = await Promise.all([
        getWhatsAppAnalyticsSummary(orgId, 30).catch(() => null),
        listWhatsAppAnalyticsEvents(orgId, { limit: 8 }).catch(() => []),
      ])
      setSummary(analytics)
      setEvents(recentEvents)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save WhatsApp settings')
    } finally {
      setSaving(false)
    }
  }, [
    accessToken,
    allowedTemplates,
    appSecret,
    autoReplyEnabled,
    displayName,
    displayPhoneNumber,
    enabled,
    environment,
    graphApiVersion,
    ingestEnabled,
    optOutKeywords,
    orgId,
    phoneNumberId,
    realSendEnabled,
    verifyToken,
    wabaId,
  ])

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Delete WhatsApp config and encrypted credentials for this org?')) return
    setSaving(true)
    try {
      await deleteWhatsAppChannelConfig(orgId)
      toast.success('WhatsApp config deleted')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete WhatsApp config')
    } finally {
      setSaving(false)
    }
  }, [load, orgId])

  // Plan gate — the WhatsApp Business API channel is a Scale/Enterprise
  // entitlement (the backend enforces this too; this is the friendly surface).
  if (!whatsappEntitled) {
    return (
      <div className="rounded-xl border border-dashed px-5 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          WhatsApp Business API is available on the Scale plan
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your organization is on the {planTier ?? 'Free'} plan. Upgrade to Scale to run the AI
          agent inside WhatsApp — request the change in Settings → Subscription and the Lira team
          will apply it.
        </p>
        <div className="mx-auto mt-5 max-w-md rounded-lg border bg-gray-50 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What you'll set up once upgraded
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {WHATSAPP_PREREQUISITES.map((item) => (
              <li key={item.label}>• {item.label}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border px-4 py-6 text-sm text-muted-foreground">
        Loading WhatsApp settings…
      </div>
    )
  }

  const totals = summary?.totals ?? {}
  const metricItems = [
    ['Inbound', totals.inbound_messages ?? 0],
    ['Auto replies', totals.auto_replies ?? 0],
    ['Outbound', totals.outbound_sends ?? 0],
    ['Failures', totals.outbound_failed ?? 0],
    ['Escalations', totals.escalations ?? 0],
    ['Duplicates', totals.webhook_duplicates ?? 0],
  ] as const

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-950">WhatsApp Cloud API</p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-emerald-900/80">
              Configure your organization's Meta assets, control ingestion and AI rollout, and track
              channel health without exposing raw credentials in the dashboard.
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              enabled
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-800 ring-1 ring-emerald-200'
            )}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Guided setup: everything the customer completes on the Meta side
          before the channel can go live — no back-and-forth required. */}
      {!enabled && (
        <details className="rounded-xl border bg-gray-50/60 px-4 py-3" open>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Before you start: what you'll need from Meta
          </summary>
          <ol className="mt-3 space-y-2.5">
            {WHATSAPP_PREREQUISITES.map((item, i) => (
              <li key={item.label} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="font-medium text-foreground">{item.label}</span>{' '}
                  <span className="text-muted-foreground">— {item.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Once you have these, fill in the Meta assets below, copy the webhook callback URL into
            your Meta app, and enable the channel. Real outbound sends stay off until you explicitly
            enable them.
          </p>
        </details>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <WhatsAppToggle
          label="Channel enabled"
          description="Allows Meta webhook verification and event processing for this org."
          checked={enabled}
          onChange={setEnabled}
        />
        <div className="rounded-lg border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Environment</p>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            {(['sandbox', 'production'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setEnvironment(value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition',
                  environment === value
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <WhatsAppToggle
          label="Ingest conversations"
          description="Creates Lira support conversations from inbound WhatsApp text messages."
          checked={ingestEnabled}
          onChange={setIngestEnabled}
        />
        <WhatsAppToggle
          label="AI auto-replies"
          description="Runs RAG, classification, agent replies, and escalation after ingestion."
          checked={autoReplyEnabled}
          onChange={setAutoReplyEnabled}
        />
        <WhatsAppToggle
          label="Real Meta sends"
          description="Calls Meta Graph API instead of dry-run payload generation."
          checked={realSendEnabled}
          onChange={setRealSendEnabled}
          danger
        />
      </div>

      <div className="rounded-lg border px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-foreground">Meta Assets</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <WhatsAppField
            label="WABA ID"
            value={wabaId}
            onChange={setWabaId}
            placeholder="123456789"
          />
          <WhatsAppField
            label="Phone Number ID"
            value={phoneNumberId}
            onChange={setPhoneNumberId}
            placeholder="987654321"
          />
          <WhatsAppField
            label="Display phone"
            value={displayPhoneNumber}
            onChange={setDisplayPhoneNumber}
            placeholder="+2348012345678"
          />
          <WhatsAppField
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Riverly"
          />
          <WhatsAppField
            label="Graph API version"
            value={graphApiVersion}
            onChange={setGraphApiVersion}
            placeholder="v23.0"
          />
          <WhatsAppField
            label="Allowed templates"
            value={allowedTemplates}
            onChange={setAllowedTemplates}
            placeholder="support_acknowledgement, ticket_created"
          />
          <div className="md:col-span-2">
            <WhatsAppField
              label="Opt-out keywords"
              value={optOutKeywords}
              onChange={setOptOutKeywords}
              placeholder="stop, unsubscribe"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyIcon className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-foreground">Encrypted Credentials</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <SecretBadge label="Token" ok={config?.has_access_token} />
            <SecretBadge label="App secret" ok={config?.has_app_secret} />
            <SecretBadge label="Verify token" ok={config?.has_verify_token} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <WhatsAppField
            label="Access token"
            value={accessToken}
            onChange={setAccessToken}
            placeholder={
              config?.has_access_token ? 'Stored. Enter to replace.' : 'Paste Meta token'
            }
            type="password"
          />
          <WhatsAppField
            label="App secret"
            value={appSecret}
            onChange={setAppSecret}
            placeholder={config?.has_app_secret ? 'Stored. Enter to replace.' : 'Paste app secret'}
            type="password"
          />
          <WhatsAppField
            label="Verify token"
            value={verifyToken}
            onChange={setVerifyToken}
            placeholder={
              config?.has_verify_token ? 'Stored. Enter to replace.' : 'Shared verify token'
            }
            type="password"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Credentials are write-only here. Saved values are encrypted server-side and only shown as
          presence checks.
        </p>
      </div>

      <div className="rounded-lg border px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Webhook Setup</p>
            <p className="text-xs text-muted-foreground">
              Use these values in Riverly&apos;s Meta app.
            </p>
          </div>
          {config?.webhook_verified_at && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              Verified
            </span>
          )}
        </div>
        <div className="space-y-2">
          <CopyLine label="Callback URL" value={callbackUrl} />
          <CopyLine
            label="Verify token"
            value={
              config?.has_verify_token
                ? 'Stored encrypted. Use the token shared with Riverly.'
                : 'Not stored yet'
            }
            copyValue={verifyToken || undefined}
          />
        </div>
      </div>

      <div className="rounded-lg border px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <PresentationChartLineIcon className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-foreground">Last 30 Days</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {metricItems.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent events
          </p>
          {events.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
              No WhatsApp events recorded yet.
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.event_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{event.type.replace(/_/g, ' ')}</p>
                  <p className="text-gray-400">
                    {new Date(event.created_at).toLocaleString()}
                    {event.recipient_last4 ? ` · *${event.recipient_last4}` : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-semibold',
                    event.ok === false
                      ? 'bg-red-50 text-red-700'
                      : event.dry_run
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {event.ok === false
                    ? 'failed'
                    : event.dry_run
                      ? 'dry-run'
                      : (event.status ?? 'ok')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <Button
          size="sm"
          type="button"
          onClick={handleDelete}
          disabled={saving || !config}
          className="bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
        >
          Delete Config
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            type="button"
            onClick={() => void load()}
            disabled={saving}
            className="bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save WhatsApp'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function WhatsAppToggle({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left transition',
        checked
          ? danger
            ? 'border-amber-200 bg-amber-50/60'
            : 'border-emerald-200 bg-emerald-50/60'
          : 'hover:bg-gray-50'
      )}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <span
        className={cn(
          'mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition',
          checked ? (danger ? 'bg-amber-600' : 'bg-emerald-600') : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-white shadow transition',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  )
}

function WhatsAppField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password'
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
    </label>
  )
}

function SecretBadge({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
      )}
    >
      {label}: {ok ? 'stored' : 'missing'}
    </span>
  )
}

function CopyLine({
  label,
  value,
  copyValue,
}: {
  label: string
  value: string
  copyValue?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <code className="min-w-0 flex-1 break-all font-mono text-xs text-gray-800">{value}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(copyValue ?? value)
          toast.success(`${label} copied`)
        }}
        disabled={!copyValue && value.startsWith('Not stored')}
        className="rounded-md px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Copy
      </button>
    </div>
  )
}

// ── Settings tabs ─────────────────────────────────────────────────────────────────

type SettingsTab =
  | 'account'
  | 'ai'
  | 'organization'
  | 'calendar'
  | 'support'
  | 'subscription'
  | 'billing'

const SETTINGS_TABS = [
  { id: 'account' as SettingsTab, icon: UserCircleIcon, label: 'Account' },
  // 'Lira Configuration' (voice/AI) is hidden until voice is brought back.
  // The AI section is still rendered under activeTab === 'ai' for direct URL
  // access, but it's not in the nav so customers don't see half-built UI.
  // { id: 'ai' as SettingsTab, icon: SparklesIcon, label: 'Lira Configuration' },
  { id: 'organization' as SettingsTab, icon: BuildingOffice2Icon, label: 'Organization' },
  // Calendar sync is for the (deprecated) meetings module; not part of the
  // support-only product. Restore when meetings is reintroduced.
  // { id: 'calendar' as SettingsTab, icon: CalendarDaysIcon, label: 'Calendar Sync' },
  { id: 'support' as SettingsTab, icon: ChatBubbleLeftEllipsisIcon, label: 'Support' },
  { id: 'subscription' as SettingsTab, icon: ShieldCheckIcon, label: 'Subscription' },
  { id: 'billing' as SettingsTab, icon: CreditCardIcon, label: 'Billing' },
]

// ── Support → Secret sub-tab ──────────────────────────────────────────────
// Migrated from the deleted /support/configuration page. Holds the HMAC
// widget secret (with reveal/copy/rotate) plus the identified-visitor
// explainer and code samples. The secret is auto-generated on first
// activate; rotation invalidates all prior signatures.

function SupportSecretTab({
  orgId,
  secret: initialSecret,
}: {
  orgId: string
  secret: string | null
}) {
  const [secret, setSecret] = useState<string | null>(initialSecret)
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleCopy = () => {
    if (!secret) return
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const handleRotate = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setRotating(true)
    setConfirming(false)
    try {
      const fresh = await rotateWidgetSecret(orgId)
      setSecret(fresh)
      toast.success('Widget secret rotated. Update your server before deploying.')
    } catch {
      toast.error('Failed to rotate secret')
    } finally {
      setRotating(false)
    }
  }
  const masked = secret ? secret.slice(0, 8) + '••••••••••••••••••••••••' : ''
  const idSnippet = secret
    ? [
        '// Server side (Node example):',
        "const crypto = require('crypto');",
        "const sig = crypto.createHmac('sha256', process.env.LIRA_WIDGET_SECRET)",
        '  .update(currentUser.email)',
        "  .digest('hex');",
        '',
        '// Then inject into the page:',
        '<script',
        '  src="https://widget.liraintelligence.com/v1/widget.js"',
        `  data-org-id="${orgId}"`,
        '  data-email="{{ user.email }}"',
        '  data-name="{{ user.name }}"',
        '  data-sig="{{ sig }}">',
        '</script>',
      ].join('\n')
    : ''

  return (
    <div className="space-y-4">
      {/* Widget secret row */}
      <div className="rounded-lg border px-4 py-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Widget secret</p>
        <p className="text-xs text-muted-foreground">
          Store this as <code className="rounded bg-gray-100 px-1">LIRA_WIDGET_SECRET</code> on your
          server. Use it to HMAC-sign identified visitor emails. Never expose it client-side.
        </p>
        {secret ? (
          <div className="flex items-center gap-2 pt-1">
            <span className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 select-all">
              {show ? secret : masked}
            </span>
            <button
              onClick={() => setShow((v) => !v)}
              title={show ? 'Hide' : 'Reveal'}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleCopy}
              title="Copy"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleRotate}
              disabled={rotating}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
                confirming
                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <ArrowPathIcon className={cn('h-3.5 w-3.5', rotating && 'animate-spin')} />
              {confirming ? 'Confirm rotate' : 'Rotate'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Secret not available. Activate support first.</p>
        )}
        <div className="flex items-start gap-1.5 pt-2 text-xs text-amber-700">
          <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Rotating invalidates all existing HMAC signatures. Update your server first.</span>
        </div>
      </div>

      {/* Identified visitor embed code */}
      {secret && (
        <div className="rounded-lg border px-4 py-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Identified visitor install</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pass the signed identity from your server so Lira recognises the logged-in user.
            </p>
          </div>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg bg-gray-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-200 whitespace-pre">
              {idSnippet}
            </pre>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(idSnippet)
                toast.success('Code copied')
              }}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-gray-600 transition"
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Explainer */}
      <div className="rounded-lg border px-4 py-4">
        <p className="text-sm font-medium text-foreground mb-2">How identified visitors work</p>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
              1
            </span>
            <span>Your user logs into your platform (you manage authentication).</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
              2
            </span>
            <span>
              Your server computes{' '}
              <code className="rounded bg-gray-100 px-1 text-[11px]">
                HMAC-SHA256(LIRA_WIDGET_SECRET, user.email)
              </code>{' '}
              and injects it into the script tag.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
              3
            </span>
            <span>
              Lira verifies the signature server-side and treats the visitor as a verified customer.
              The AI can read their data and act on their account.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
              4
            </span>
            <span>If the signature is wrong or missing, Lira treats the visitor as anonymous.</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

// ── Support → Mobile sub-tab ──────────────────────────────────────────────
// Placeholder for native iOS/Android SDKs. Visible today so customers
// know the surface is on the roadmap; the actual SDK ships later.

function SupportMobileTab() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      <DevicePhoneMobileIcon className="mx-auto h-8 w-8 text-gray-400" />
      <p className="mt-3 text-sm font-semibold text-gray-700">Native mobile SDKs coming soon</p>
      <p className="mt-1 mx-auto max-w-md text-xs text-gray-500">
        Until then, mobile apps can open your own in-app support route in a WebView and mount the
        full-page Web SDK there. The hosted portal is only a fallback when you cannot ship that
        route yet.
      </p>
    </div>
  )
}

// ── Integration Health tab ───────────────────────────────────────────────────
// Lets the operator run live diagnostics against their own org's support
// integration — same checks Lira runs via lira_check_integration_health — and
// see exactly which piece is misconfigured, with the fix inline.

function SupportHealthTab({ orgId }: { orgId: string }) {
  const [report, setReport] = useState<
    import('@/services/api/support-api').IntegrationHealthReport | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { runIntegrationHealth } = await import('@/services/api/support-api')
      const r = await runIntegrationHealth(orgId)
      setReport(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run diagnostics')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void run()
  }, [run])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 space-y-1.5">
        <p className="text-sm font-semibold text-blue-900">Integration Health</p>
        <p className="text-xs text-blue-900/80 leading-relaxed">
          Live diagnostics for your support integration. If something looks broken (silent widget,
          identity not recognised, missing notifications), run this first — every failed check tells
          you what's wrong AND how to fix it. Lira's own AI runs the same checks when customers ask
          about widget issues, so you can also point them here.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {report && (
            <p
              className={cn('text-sm font-medium', report.ok ? 'text-emerald-700' : 'text-red-700')}
            >
              {report.summary}
            </p>
          )}
          {report && (
            <p className="text-[11px] text-gray-400">
              Last run: {new Date(report.generated_at).toLocaleString()}
            </p>
          )}
        </div>
        <Button size="sm" onClick={run} disabled={loading} className="shrink-0">
          {loading ? 'Running…' : 'Run diagnostics'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {report && (
        <ul className="space-y-2">
          {report.checks.map((c) => (
            <li
              key={c.key}
              className={cn(
                'rounded-xl border px-4 py-3',
                c.ok ? 'border-emerald-100 bg-emerald-50/40' : 'border-red-100 bg-red-50/60'
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    c.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  )}
                >
                  {c.ok ? '✓' : '!'}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      c.ok ? 'text-emerald-900' : 'text-red-900'
                    )}
                  >
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-700">{c.detail}</p>
                  {!c.ok && c.fix && (
                    <p className="mt-1.5 text-xs text-gray-900">
                      <span className="font-semibold">Fix:</span> {c.fix}
                    </p>
                  )}
                  {!c.ok && c.docs && (
                    <a
                      href={c.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#3730a3] hover:underline"
                    >
                      Troubleshooting docs →
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const AGENT_RUN_STATUSES: Array<{ value: '' | AgentActionRunStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'running', label: 'Running' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function SupportAuditTab({ orgId }: { orgId: string }) {
  const [runs, setRuns] = useState<AgentActionRun[]>([])
  const [status, setStatus] = useState<'' | AgentActionRunStatus>('')
  const [capability, setCapability] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAgentActionRuns(orgId, {
        status,
        capability: capability.trim() || undefined,
        limit: 50,
      })
      setRuns(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit events')
    } finally {
      setLoading(false)
    }
  }, [capability, orgId, status])

  useEffect(() => {
    void load()
  }, [load])

  const totalEstimatedCost = runs.reduce((sum, r) => sum + (r.estimated_model_cost_usd ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Agent runtime audit</p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600">
              Org-admin view of the resources and actions Lira requested while helping customers.
              This is the first runtime audit surface for tickets, escalations, setup changes,
              integration health checks, and approved customer actions.
            </p>
          </div>
          <Button size="sm" onClick={load} disabled={loading} className="shrink-0">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | AgentActionRunStatus)}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
        >
          {AGENT_RUN_STATUSES.map((s) => (
            <option key={s.value || 'all'} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
          placeholder="Filter by capability, e.g. lira_check_integration_health"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <Button size="sm" onClick={load} disabled={loading}>
          Apply
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AuditMetric label="Events shown" value={String(runs.length)} />
        <AuditMetric
          label="Failed/cancelled"
          value={String(
            runs.filter((r) => r.status === 'failed' || r.status === 'cancelled').length
          )}
        />
        <AuditMetric
          label="Estimated model cost"
          value={`$${totalEstimatedCost.toFixed(4)}`}
          hint="Estimate, not a bill. Token counts come from the model provider's usage reports where available (split evenly across the actions in a turn) and from message-size heuristics otherwise, priced at a flat $3 per 1M input / $15 per 1M output tokens regardless of model."
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="grid grid-cols-[minmax(180px,1.2fr)_110px_120px_140px] gap-3 border-b bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span>Capability</span>
          <span>Status</span>
          <span>Risk</span>
          <span>Time</span>
        </div>
        {runs.length === 0 && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No agent action runs match these filters yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {runs.map((run) => (
              <li key={run.run_id} className="px-4 py-3">
                <div className="grid grid-cols-[minmax(180px,1.2fr)_110px_120px_140px] gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {run.capability_name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {run.capability_kind} · {run.auth_scope ?? 'unknown scope'}
                    </p>
                  </div>
                  <StatusPill status={run.status} />
                  <span className="self-start rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                    {run.risk}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(run.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  <AuditJsonBlock title="Input" value={run.input_summary} />
                  <AuditJsonBlock
                    title={run.error ? 'Error' : 'Output'}
                    value={run.error ? { error: run.error } : run.output_summary}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span>Run {run.run_id.slice(0, 8)}</span>
                  {run.conv_id && <span>Conversation {run.conv_id.slice(0, 8)}</span>}
                  {run.ticket_id && (
                    <a
                      href={`/support/tickets/${run.ticket_id}`}
                      className="font-medium text-[#3730a3] hover:underline"
                    >
                      Open ticket
                    </a>
                  )}
                  <span>
                    Tokens {run.estimated_tokens_in ?? 0}/{run.estimated_tokens_out ?? 0}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SupportCapabilitiesTab({ orgId }: { orgId: string }) {
  const [capabilities, setCapabilities] = useState<AgentCapabilityConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'resource' | 'action'>('action')
  const [authScope, setAuthScope] = useState<'public' | 'verified_visitor' | 'verified_customer'>(
    'verified_customer'
  )
  const [risk, setRisk] = useState<AgentCapabilityConfig['risk']>('customer_confirm')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCapabilities(await listAgentCapabilities(orgId))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load capabilities')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const createCapability = useCallback(async () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Capability name and description are required')
      return
    }
    setSaving(true)
    try {
      await upsertAgentCapability(orgId, {
        name,
        description,
        kind,
        auth_scope: authScope,
        risk,
        source: 'server_side',
        enabled: true,
        input_schema: { type: 'object', properties: {}, additionalProperties: true },
        output_schema: { type: 'object', properties: {}, additionalProperties: true },
      })
      setName('')
      setDescription('')
      toast.success('Capability registered')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to register capability')
    } finally {
      setSaving(false)
    }
  }, [authScope, description, kind, load, name, orgId, risk])

  const removeCapability = useCallback(
    async (capabilityId: string) => {
      try {
        await deleteAgentCapability(orgId, capabilityId)
        toast.success('Capability deleted')
        await load()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to delete capability')
      }
    },
    [load, orgId]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
        <p className="text-sm font-semibold text-violet-950">Agent capabilities</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-violet-950/80">
          Register server-side resources and actions Lira may use later through the policy engine.
          V1 can override or disable existing executable tools. New names are stored as metadata
          until a backend executor or connector is attached.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">Register a capability</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="billing.retry_payment"
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Retry a failed payment after customer approval."
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as 'resource' | 'action'
              setKind(next)
              setRisk(next === 'resource' ? 'read_private' : 'customer_confirm')
            }}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
          >
            <option value="action">Action</option>
            <option value="resource">Resource</option>
          </select>
          <select
            value={authScope}
            onChange={(e) =>
              setAuthScope(e.target.value as 'public' | 'verified_visitor' | 'verified_customer')
            }
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900"
          >
            <option value="public">Public</option>
            <option value="verified_visitor">Verified visitor</option>
            <option value="verified_customer">Verified customer</option>
          </select>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as AgentCapabilityConfig['risk'])}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900 sm:col-span-2"
          >
            <option value="read_public">Read public</option>
            <option value="read_private">Read private</option>
            <option value="safe_write">Safe write</option>
            <option value="customer_confirm">Customer confirm</option>
            <option value="step_up">Step-up required</option>
            <option value="admin_approve">Admin approve</option>
            <option value="human_only">Human only</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={createCapability} disabled={saving}>
            {saving ? 'Registering...' : 'Register capability'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Registered capabilities
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {capabilities.length === 0 && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No server-side capabilities registered yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {capabilities.map((cap) => (
              <li key={cap.capability_id} className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{cap.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{cap.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {cap.kind}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {cap.auth_scope}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {cap.risk}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {cap.enabled ? 'enabled' : 'disabled'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 ${
                          cap.executable
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {cap.executable ? 'runtime executable' : 'metadata only'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeCapability(cap.capability_id)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AuditMetric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      title={hint}
      className={cn('rounded-xl border border-gray-200 bg-white px-4 py-3', hint && 'cursor-help')}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: AgentActionRunStatus }) {
  const tone =
    status === 'succeeded'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'failed' || status === 'cancelled' || status === 'blocked'
        ? 'bg-red-50 text-red-700'
        : status === 'pending_approval'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-blue-50 text-blue-700'
  return (
    <span className={cn('self-start rounded-full px-2 py-1 text-[11px] font-semibold', tone)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function AuditJsonBlock({ title, value }: { title: string; value?: Record<string, unknown> }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-600">
        {value ? JSON.stringify(value, null, 2) : 'No data'}
      </pre>
    </div>
  )
}

function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = getSettingsTabFromSearch(location.search)

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your Lira configuration and workspace</p>
        </div>
      </div>

      {/* Two-column layout: stacked on mobile, side-by-side on md+ */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sub-nav tabs */}
        <aside className="shrink-0 border-b border-gray-100 md:border-b-0 md:border-r md:w-52 overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
          <div className="flex flex-row gap-1 px-3 py-2 md:flex-col md:space-y-0.5 md:p-3">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  navigate(`/settings?tab=${tab.id}`, { replace: true })
                }}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="text-[13px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {activeTab === 'account' && <AccountSection />}
          {activeTab === 'ai' && <AiConfigSection />}
          {activeTab === 'organization' && <OrgSettingsPage />}
          {activeTab === 'calendar' && <CalendarSyncSection />}
          {activeTab === 'support' && <SupportSettingsSection />}
          {activeTab === 'subscription' && <SubscriptionSection />}
          {activeTab === 'billing' && (
            <Section icon={CreditCardIcon} title="Billing & License" disabled>
              <LockedRow label="Invoices" description="View and download past invoices." />
              <div className="mt-2">
                <LockedRow
                  label="Payment Methods"
                  description="Add or update your payment information."
                />
              </div>
              <div className="mt-2">
                <LockedRow
                  label="Enterprise License"
                  description="Manage seat allocations and enterprise licensing terms."
                />
              </div>
              <div className="mt-2">
                <LockedRow label="License Key" description="View or transfer your license key." />
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

export { SettingsPage }

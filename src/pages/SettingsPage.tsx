import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownOnSquareIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  // CalendarDaysIcon removed alongside the commented-out 'Calendar Sync' tab.
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
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
  getMyPlan,
  requestPlanChange,
  cancelPlanChangeRequest,
  type MyPlan,
  type PlanTier,
  type PlanEntitlements,
} from '@/services/api'
import {
  deleteAgentCapability,
  listAgentCapabilities,
  listAgentActionRuns,
  getSupportConfig,
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
  type WhatsAppAnalyticsEvent,
  type WhatsAppAnalyticsSummary,
  type WhatsAppChannelConfig,
} from '@/services/api/support-api'
import { OrgSettingsPage } from './OrgSettingsPage'
import { CalendarSyncSection } from '@/components/settings/CalendarSyncSection'

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

function SubscriptionSection() {
  const { currentOrgId } = useOrgStore()
  const [plan, setPlan] = useState<MyPlan | null>(null)
  const [usage, setUsage] = useState<{
    conversations: number
    conversationsMax: number
    aiReplies: number
    aiRepliesMax: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = await getMyPlan()
      setPlan(p)
      if (currentOrgId) {
        const cfg = await getSupportConfig(currentOrgId)
        setUsage({
          conversations: cfg.conversations_this_month ?? 0,
          conversationsMax: cfg.max_conversations_per_month ?? 0,
          aiReplies: cfg.ai_replies_this_month ?? 0,
          aiRepliesMax: cfg.max_ai_replies_per_month ?? 0,
        })
      }
    } catch {
      // plan endpoint unavailable — leave section empty-stated
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

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
    setBusy(true)
    try {
      await cancelPlanChangeRequest(plan.pendingRequest.id)
      toast.success('Plan change request cancelled')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel request')
    } finally {
      setBusy(false)
    }
  }

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
                {tierPrice(plan.entitlements)}
              </span>
            </p>
            <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              {entitlementLines(plan.entitlements).map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        </div>

        {usage && (
          <div className="mt-5 space-y-3 border-t pt-4">
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
        )}

        {plan.pendingRequest && (
          <div className="mt-5 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              Change to <strong>{TIER_LABELS[plan.pendingRequest.toTier as PlanTier]}</strong>{' '}
              requested — awaiting review by the Lira team.
            </p>
            <Button variant="outline" size="sm" disabled={busy} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </Section>

      <Section icon={CreditCardIcon} title="Change plan">
        <p className="mb-4 text-sm text-muted-foreground">
          Pick a plan and the Lira team will review and apply the change. Upgrades take effect on
          approval; downgrade limits apply from your next monthly usage reset.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plan.allTiers.map(({ tier, entitlements }) => {
            const isCurrent = tier === plan.tier
            const isPendingTarget = plan.pendingRequest?.toTier === tier
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
                <Button
                  className="mt-3"
                  size="sm"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={busy || isCurrent || !!plan.pendingRequest || isPendingTarget}
                  onClick={() => handleRequest(tier)}
                >
                  {isCurrent ? 'Current plan' : isPendingTarget ? 'Requested' : 'Request change'}
                </Button>
              </div>
            )
          })}
        </div>
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

function SupportSettingsSection() {
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

  const [activeTab, setActiveTab] = useState<
    | 'widget'
    | 'secret'
    | 'channels'
    | 'whatsapp'
    | 'portal'
    | 'behavior'
    | 'escalation'
    | 'mobile'
    | 'health'
    | 'audit'
    | 'capabilities'
  >('widget')

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

  const SUPPORT_TABS = [
    { key: 'widget' as const, label: 'Web SDK', icon: CodeBracketIcon },
    { key: 'secret' as const, label: 'Secret', icon: KeyIcon },
    { key: 'channels' as const, label: 'Channels', icon: EnvelopeIcon },
    { key: 'whatsapp' as const, label: 'WhatsApp', icon: DevicePhoneMobileIcon },
    { key: 'portal' as const, label: 'Hosted', icon: GlobeAltIcon },
    { key: 'behavior' as const, label: 'Behavior', icon: Cog6ToothIcon },
    { key: 'escalation' as const, label: 'Escalation', icon: ExclamationTriangleIcon },
    { key: 'mobile' as const, label: 'Mobile', icon: DevicePhoneMobileIcon },
    { key: 'capabilities' as const, label: 'Capabilities', icon: SparklesIcon },
    { key: 'health' as const, label: 'Health', icon: ShieldCheckIcon },
    { key: 'audit' as const, label: 'Audit', icon: ClipboardDocumentCheckIcon },
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
    <div className="space-y-4 pb-24">
      {/* Tab bar + top Save button */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {SUPPORT_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition',
                  activeTab === tab.key
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* ── Web SDK tab ── */}
      {activeTab === 'widget' && (
        <div className="space-y-4">
          {/* Full-page SDK */}
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Full-page Support SDK, recommended
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add this to your own route, for example <code className="font-mono">/support</code>,
                so customers stay inside your product while Lira powers chat, tickets, identity, and
                AI actions.
              </p>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                {fullPageEmbedSnippet}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fullPageEmbedSnippet)
                  toast.success('Full-page SDK code copied!')
                }}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-gray-600 transition"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              For logged-in products, use the Secret tab to sign visitors server-side, then pass
              identity and account context with <code className="font-mono">window.Lira</code>.
            </p>
          </div>

          {/* JS SDK API */}
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">JavaScript SDK API</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use this form when your app needs to identify signed-in users and send live product
                context such as account plan, route, or billing status.
              </p>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                {jsSdkSnippet}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(jsSdkSnippet)
                  toast.success('JavaScript SDK code copied!')
                }}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-gray-600 transition"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>

          {/* NPM SDK */}
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">NPM package, publish-ready</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use <code className="font-mono">@liraintelligence/support</code> in React, Next.js,
                Vue, or any bundled web app when your engineers want typed imports and registered
                actions. Registry publishing requires npm authentication.
              </p>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                {npmSdkSnippet}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(npmSdkSnippet)
                  toast.success('NPM SDK example copied!')
                }}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-gray-600 transition"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>

          {/* Floating widget */}
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Floating Chat Widget</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optional launcher for marketing pages, dashboards, and areas where you want a
                compact support entry point instead of a full support route.
              </p>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                {widgetEmbedSnippet}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(widgetEmbedSnippet)
                  toast.success('Widget code copied!')
                }}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 hover:bg-gray-600 transition"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>

          {/* Widget Color */}
          <div className="rounded-lg border px-4 py-3 space-y-3">
            <p className="text-sm font-medium text-foreground">Widget Color</p>
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
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setWidgetColor(e.target.value)
                }}
                maxLength={7}
                className="w-28 rounded-xl border border-input bg-background px-3 py-1.5 font-mono text-sm outline-none focus:border-gray-900"
              />
              <div className="h-9 flex-1 rounded-lg" style={{ background: widgetColor }} />
            </div>
            <div className="flex flex-wrap gap-2">
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
                  onClick={() => setWidgetColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-md border-2 transition',
                    widgetColor === c
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Greeting message */}
          <div className="rounded-lg border px-4 py-3">
            <p className="mb-1 text-sm font-medium text-foreground">Greeting Message</p>
            <textarea
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              rows={2}
              placeholder="Hello! How can I help you today?"
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900 resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Opening message shown when the chat widget loads
            </p>
          </div>
        </div>
      )}

      {/* ── Secret tab ── HMAC widget secret + identified-visitor guide.
          Migrated from the old /support/configuration page; the secret is
          the only thing customers really need from there. */}
      {activeTab === 'secret' && (
        <SupportSecretTab orgId={config.org_id} secret={config.widget_secret ?? null} />
      )}

      {/* ── Mobile tab ── placeholder. Native iOS/Android SDKs are on the
          roadmap; this tab exists today so customers see we have a plan. */}
      {activeTab === 'mobile' && <SupportMobileTab />}

      {/* ── Health tab — run integration diagnostics on demand ── */}
      {activeTab === 'health' && <SupportHealthTab orgId={currentOrgId!} />}

      {/* ── Capabilities tab — server-side action/resource registration ── */}
      {activeTab === 'capabilities' && <SupportCapabilitiesTab orgId={currentOrgId!} />}

      {/* ── Audit tab — agent runtime action runs ── */}
      {activeTab === 'audit' && <SupportAuditTab orgId={currentOrgId!} />}

      {/* ── Channels tab ── */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          {/* Web SDK — configure in Web SDK tab */}
          <button
            type="button"
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition text-left"
            onClick={() => setActiveTab('widget')}
          >
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-500">Full-page Support SDK</p>
              <span className="text-xs text-gray-400">→ Web SDK tab</span>
            </div>
          </button>

          {/* Chat */}
          <div className="flex items-start justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Web Chat Runtime</p>
              <p className="text-xs text-muted-foreground">
                Enables the floating widget and full-page support SDK surfaces.
              </p>
            </div>
            <label aria-label="Toggle chat widget" className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={(e) => setChatEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
          </div>

          {/* Voice */}
          <div className="flex items-start justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Voice Support</p>
              <p className="text-xs text-muted-foreground">
                Inbound phone support powered by Lira&apos;s voice
              </p>
            </div>
            <label aria-label="Toggle voice support" className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
          </div>

          {/* Email */}
          <div className="rounded-lg border px-4 py-3 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground">
                  Receive and respond to customer emails via AI
                </p>
              </div>
              <label aria-label="Toggle email support" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
            </div>
            {config.email_address && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  Your Lira support address
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-gray-800 truncate">
                    {config.email_address}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(config.email_address ?? '')
                      toast.success('Copied!')
                    }}
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-200 transition"
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
              <div className="rounded-lg border border-dashed border-gray-300 px-3 py-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Custom address <span className="font-normal text-gray-400">(optional)</span>
                </p>
                <input
                  type="email"
                  value={customSupportEmail}
                  onChange={(e) => setCustomSupportEmail(e.target.value)}
                  placeholder="support@yourcompany.com"
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900"
                />
                {customSupportEmail.trim() && config.email_address && (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 space-y-1">
                    <p className="font-semibold">Forwarding setup required</p>
                    <p>
                      Create a forwarding rule from <strong>{customSupportEmail.trim()}</strong> to{' '}
                      <strong className="font-mono">{config.email_address}</strong> in your email
                      provider.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WhatsApp tab ── */}
      {activeTab === 'whatsapp' && <SupportWhatsAppTab orgId={currentOrgId!} />}

      {/* ── Hosted fallback tab ── */}
      {activeTab === 'portal' && (
        <div className="space-y-4">
          {/* What this is + what to do with it */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-blue-900">Hosted portal fallback</p>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              For production B2B apps, use the Web SDK tab to mount Lira inside your own support
              route, such as <code className="font-mono">yourcompany.com/support</code>. That keeps
              your URL, app shell, and customer experience under your control.
            </p>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              The hosted portal remains available as a no-code fallback for temporary launches,
              emails, or teams that cannot touch their product code yet. It should not be the main
              integration path for customers like LemonPay.
            </p>
          </div>

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
                    Custom Domain <span className="font-normal text-gray-400">(optional)</span>
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
                    <div className="h-9 flex-1 rounded-lg" style={{ background: portalColor }} />
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
                  <p className="text-xs font-semibold text-emerald-800">Magic Link — Active</p>
                  <p className="text-xs text-emerald-700">
                    Customers enter their email and receive a one-time sign-in link. No password
                    required.
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
                    Connect your own auth system. Generate a signed JWT with the customer's email —
                    the portal trusts it automatically.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Behavior tab ── */}
      {activeTab === 'behavior' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-reply</p>
              <p className="text-xs text-muted-foreground">
                Lira automatically responds to customer messages when confident
              </p>
            </div>
            <label aria-label="Toggle auto-reply" className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </label>
          </div>

          <div className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Confidence Threshold</p>
              <span className="text-sm font-semibold text-gray-700">
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(confidenceThreshold * 100)}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Conversations below this threshold are escalated to a human
            </p>
          </div>

          <div className="rounded-lg border px-4 py-3">
            <p className="mb-1 text-sm font-medium text-foreground">Force-Escalate Intents</p>
            <input
              type="text"
              value={forceEscalateIntents}
              onChange={(e) => setForceEscalateIntents(e.target.value)}
              placeholder="data_privacy, account_security, legal, fraud"
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated intents that always escalate regardless of confidence
            </p>
          </div>

          {/* Volume limits */}
          {config && (
            <div className="rounded-lg border px-4 py-3 space-y-3">
              <p className="text-sm font-medium text-foreground">Volume &amp; Limits</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversations (this month)</span>
                <span className="font-semibold">
                  {config.conversations_this_month ?? 0} / {config.max_conversations_per_month}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Replies (this month)</span>
                <span className="font-semibold">
                  {config.ai_replies_this_month ?? 0} / {config.max_ai_replies_per_month}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Escalation tab ── */}
      {activeTab === 'escalation' && (
        <div className="space-y-4">
          <div className="rounded-lg border px-4 py-3">
            <p className="mb-1 text-sm font-medium text-foreground">Escalation Email</p>
            <input
              type="email"
              value={escalationEmail}
              onChange={(e) => setEscalationEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Lira sends an alert here whenever a conversation is escalated
            </p>
          </div>

          <div className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">SLA Target (hours)</p>
              <span className="text-sm font-semibold text-gray-700">{slaHours}h</span>
            </div>
            <input
              type="range"
              min={1}
              max={72}
              value={slaHours}
              onChange={(e) => setSlaHours(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Escalated tickets breach SLA after this many hours
            </p>
          </div>

          <div className="rounded-lg border px-4 py-3">
            <p className="mb-1 text-sm font-medium text-foreground">Slack Channel</p>
            <input
              type="text"
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              placeholder="#support-escalations"
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Notifications go here when a conversation is escalated
            </p>
          </div>

          <div className="rounded-lg border px-4 py-3">
            <p className="mb-1 text-sm font-medium text-foreground">Linear Team</p>
            <input
              type="text"
              value={linearTeam}
              onChange={(e) => setLinearTeam(e.target.value)}
              placeholder="Team ID or name"
              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Escalated tickets are created as Linear issues in this team
            </p>
          </div>
        </div>
      )}

      {/* Sticky bottom Save bar — kept out of the widget bubble's zone
          (bottom-right, ~80px) via pr-24 so the button is always clickable. */}
      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-gray-200 bg-white/95 px-4 py-3 pr-24 backdrop-blur sm:-mx-6 sm:px-6 sm:pr-32">
        <div className="flex items-center justify-end gap-3">
          <p className="text-xs text-gray-400">Changes save on click — no auto-save.</p>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Support Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
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
  const whatsappEntitled = planTier === 'SCALE' || planTier === 'ENTERPRISE'
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
        <AuditMetric label="Estimated model cost" value={`$${totalEstimatedCost.toFixed(4)}`} />
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

function AuditMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')

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
                onClick={() => setActiveTab(tab.id)}
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

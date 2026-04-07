import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import {
  useUserPrefsStore,
  useAuthStore,
  useOrgStore,
  type VoiceId,
  type Personality,
} from '@/app/store'
import { Button } from '@/components/common'
import { cn } from '@/lib'
import {
  updateMyName,
  updateMyEmail,
  updateMyPicture,
  changePassword,
  deleteAccount,
  leaveOrganization,
} from '@/services/api'
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
  const [picture, setPicture] = useState(userPicture ?? '')
  const [savingPicture, setSavingPicture] = useState(false)

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

  async function handleSavePicture() {
    const trimmed = picture.trim()
    if (!trimmed || trimmed === (userPicture ?? '')) return
    setSavingPicture(true)
    try {
      await updateMyPicture(trimmed)
      setUserPicture(trimmed)
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
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            {userPicture ? (
              <img
                src={userPicture}
                alt={userName ?? ''}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a] text-lg font-bold text-white">
                {(userName ?? userEmail ?? 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{userName ?? '—'}</p>
              <p className="text-xs text-gray-400">{userEmail ?? '—'}</p>
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

          {/* Profile picture URL */}
          <div>
            <label
              htmlFor="account-picture"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Profile Picture URL
            </label>
            <div className="flex gap-2">
              <input
                id="account-picture"
                type="url"
                value={picture}
                onChange={(e) => setPicture(e.target.value)}
                className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="https://example.com/avatar.png"
              />
              <Button
                size="sm"
                onClick={handleSavePicture}
                disabled={
                  savingPicture || !picture.trim() || picture.trim() === (userPicture ?? '')
                }
                className="gap-1.5 rounded-xl"
              >
                <ArrowDownOnSquareIcon className="h-3.5 w-3.5" />
                {savingPicture ? 'Saving…' : 'Save'}
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
              immediately. You will need a new invite code to rejoin.
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

// ── Settings tabs ─────────────────────────────────────────────────────────────────

type SettingsTab = 'account' | 'ai' | 'organization' | 'calendar' | 'subscription' | 'billing'

const SETTINGS_TABS = [
  { id: 'account' as SettingsTab, icon: UserCircleIcon, label: 'Account' },
  { id: 'ai' as SettingsTab, icon: SparklesIcon, label: 'Lira Configuration' },
  { id: 'organization' as SettingsTab, icon: BuildingOffice2Icon, label: 'Organization' },
  { id: 'calendar' as SettingsTab, icon: CalendarDaysIcon, label: 'Calendar Sync' },
  { id: 'subscription' as SettingsTab, icon: ShieldCheckIcon, label: 'Subscription' },
  { id: 'billing' as SettingsTab, icon: CreditCardIcon, label: 'Billing' },
]

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
          {activeTab === 'subscription' && (
            <Section icon={ShieldCheckIcon} title="Subscription" disabled>
              <LockedRow
                label="Manage Plan"
                description="View and upgrade your current subscription plan."
              />
              <div className="mt-2">
                <LockedRow
                  label="Usage"
                  description="Track minutes used and remaining in your plan."
                />
              </div>
            </Section>
          )}
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

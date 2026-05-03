import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownOnSquareIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
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

// ── Support Settings section ──────────────────────────────────────────────────

function SupportSettingsSection() {
  const { currentOrgId } = useOrgStore()
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
    setPortalSlug(config.portal_slug ?? '')
    setCustomDomain(config.custom_domain ?? '')
    setPortalColor(config.portal_color ?? config.widget_color ?? '#3730a3')
    setPortalLogoUrl(config.portal_logo_url ?? '')
    setPortalGreeting(config.portal_greeting ?? '')
    setPortalChatEnabled(config.portal_chat_enabled ?? config.chat_enabled ?? true)
    setPortalVoiceEnabled(config.portal_voice_enabled ?? config.voice_enabled ?? true)
    setPortalTicketsEnabled(config.portal_tickets_enabled ?? true)
    setPortalTrackEnabled(config.portal_track_enabled ?? true)
    setWidgetColor(config.widget_color ?? '#3730a3')
    setAutoReplyEnabled(config.auto_reply_enabled)
    setConfidenceThreshold(config.confidence_threshold)
    setForceEscalateIntents(config.force_escalate_intents.join(', '))
    setSlackChannel(config.escalation_slack_channel ?? '')
    setLinearTeam(config.escalation_linear_team ?? '')
    setEscalationEmail(config.escalation_email ?? '')
    setGreetingMessage(config.greeting_message ?? 'Hello! How can I help you today?')
    setSlaHours(config.sla_hours ?? 4)
  }, [config])

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
    'widget' | 'channels' | 'portal' | 'behavior' | 'escalation'
  >('widget')

  if (!config) {
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
    { key: 'widget' as const, label: 'Widget', icon: CodeBracketIcon },
    { key: 'channels' as const, label: 'Channels', icon: EnvelopeIcon },
    { key: 'portal' as const, label: 'Portal', icon: GlobeAltIcon },
    { key: 'behavior' as const, label: 'Behavior', icon: Cog6ToothIcon },
    { key: 'escalation' as const, label: 'Escalation', icon: ExclamationTriangleIcon },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
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

      {/* ── Widget tab ── */}
      {activeTab === 'widget' && (
        <div className="space-y-4">
          {/* Embed code */}
          <div className="rounded-lg border px-4 py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Embed Code</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste before the <code className="font-mono">&lt;/body&gt;</code> tag on every page
                where you want the chat widget.
              </p>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                {[
                  '<script',
                  '  src="https://widget.liraintelligence.com/v1/widget.js"',
                  `  data-org-id="${config.org_id}"`,
                  `  data-greeting="${(greetingMessage ?? 'Hi! How can we help?').replace(/"/g, '&quot;')}"`,
                  '  data-position="bottom-right">',
                  '</script>',
                ].join('\n')}
              </pre>
              <button
                type="button"
                onClick={() => {
                  const code = [
                    '<script',
                    '  src="https://widget.liraintelligence.com/v1/widget.js"',
                    `  data-org-id="${config.org_id}"`,
                    `  data-greeting="${(greetingMessage ?? 'Hi! How can we help?').replace(/"/g, '"')}"`,
                    '  data-position="bottom-right">',
                    '</script>',
                  ].join('\n')
                  navigator.clipboard.writeText(code)
                  toast.success('Embed code copied!')
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

      {/* ── Channels tab ── */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          {/* Support Portal — configure in Portal tab */}
          <button
            type="button"
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition text-left"
            onClick={() => setActiveTab('portal')}
          >
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-500">Support Portal</p>
              <span className="text-xs text-gray-400">→ Portal tab</span>
            </div>
          </button>

          {/* Chat */}
          <div className="flex items-start justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Chat Widget</p>
              <p className="text-xs text-muted-foreground">Embeddable live chat for your website</p>
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

      {/* ── Portal tab ── */}
      {activeTab === 'portal' && (
        <div className="space-y-4">
          {/* Access */}
          <div className="rounded-lg border px-4 py-3 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Support Portal</p>
                <p className="text-xs text-muted-foreground">
                  A branded page where customers submit tickets, track status, and chat.
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
                Enable the portal to configure its URL, branding, and features.
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

      {/* Save */}
      <div className="flex justify-end pt-2">
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
  { id: 'ai' as SettingsTab, icon: SparklesIcon, label: 'Lira Configuration' },
  { id: 'organization' as SettingsTab, icon: BuildingOffice2Icon, label: 'Organization' },
  { id: 'calendar' as SettingsTab, icon: CalendarDaysIcon, label: 'Calendar Sync' },
  { id: 'support' as SettingsTab, icon: ChatBubbleLeftEllipsisIcon, label: 'Support' },
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
          {activeTab === 'support' && <SupportSettingsSection />}
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

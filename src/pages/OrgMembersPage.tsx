import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listOrgMembers,
  updateMemberRole,
  removeMember,
  transferOwnership,
  leaveOrganization,
  createEmployeeInvite,
  listEmployeeInvites,
  revokeEmployeeInvite,
  type EmployeeInvite,
  type OrgMembership,
} from '@/services/api'

function OrgMembersPage() {
  const navigate = useNavigate()
  const { currentOrgId, removeOrganization } = useOrgStore()
  const userId = useAuthStore((s) => {
    // Parse user ID from JWT
    const token = s.token
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId ?? payload.id ?? payload.sub ?? null
    } catch {
      return null
    }
  })

  const [members, setMembers] = useState<OrgMembership[]>([])
  const [invites, setInvites] = useState<EmployeeInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [transferTarget, setTransferTarget] = useState<OrgMembership | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [leavingOrg, setLeavingOrg] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<OrgMembership | null>(null)
  const [removing, setRemoving] = useState(false)

  // Invite-by-email form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [justCreated, setJustCreated] = useState<EmployeeInvite | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const memberList = await listOrgMembers(currentOrgId)
      setMembers(memberList)
      // Invite list is admin/owner-only on the backend — silently ignore 403
      // for plain members so the page still renders for them.
      try {
        const inviteList = await listEmployeeInvites(currentOrgId)
        setInvites(inviteList)
      } catch {
        setInvites([])
      }
    } catch {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleRoleChange(memberId: string, role: 'admin' | 'member') {
    if (!currentOrgId) return
    try {
      await updateMemberRole(currentOrgId, memberId, role)
      setMembers((prev) => prev.map((m) => (m.user_id === memberId ? { ...m, role } : m)))
      toast.success('Role updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  async function handleRemove(memberId: string) {
    if (!currentOrgId) return
    try {
      await removeMember(currentOrgId, memberId)
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId))
      toast.success('Member removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  async function handleCreateInvite() {
    if (!currentOrgId) return
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !/.+@.+\..+/.test(email)) {
      toast.error('Enter a valid email address')
      return
    }
    if (invites.some((i) => i.state === 'active' && i.email === email)) {
      toast.error('An active invite already exists for that email')
      return
    }
    setCreatingInvite(true)
    try {
      const { invite } = await createEmployeeInvite(currentOrgId, {
        email,
        role: inviteRole,
      })
      setInvites((prev) => [invite, ...prev])
      setJustCreated(invite)
      setInviteEmail('')
      setInviteRole('member')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setCreatingInvite(false)
    }
  }

  async function handleRevokeInvite(token: string) {
    if (!currentOrgId) return
    try {
      await revokeEmployeeInvite(currentOrgId, token)
      setInvites((prev) =>
        prev.map((i) =>
          i.token === token ? { ...i, state: 'revoked', revoked_at: new Date().toISOString() } : i
        )
      )
      toast.success('Invite revoked')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke invite')
    }
  }

  // Build the accept URL from the current origin so links generated in dev
  // (npm run dev) point at the local server instead of the backend's
  // FRONTEND_URL env value. The backend uses FRONTEND_URL for the email link.
  function acceptUrlFor(token: string): string {
    return `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`
  }

  function copyInviteLink(invite: EmployeeInvite) {
    navigator.clipboard.writeText(acceptUrlFor(invite.token))
    setCopiedToken(invite.token)
    setTimeout(() => setCopiedToken((c) => (c === invite.token ? null : c)), 2000)
  }

  async function handleTransferOwnership() {
    if (!currentOrgId || !transferTarget) return
    setTransferring(true)
    try {
      await transferOwnership(currentOrgId, transferTarget.user_id)
      await loadData()
      setTransferTarget(null)
      toast.success(
        `Ownership transferred to ${transferTarget.name ?? transferTarget.email ?? transferTarget.user_id}`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to transfer ownership'
      toast.error(msg)
    } finally {
      setTransferring(false)
    }
  }

  async function handleLeave() {
    if (!currentOrgId) return
    try {
      await leaveOrganization(currentOrgId)
      removeOrganization(currentOrgId)
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave organization')
    } finally {
      setLeavingOrg(false)
    }
  }

  const currentMember = members.find((m) => m.user_id === userId)
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-5 w-24 animate-pulse rounded-lg bg-gray-300/40" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-300/60" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-300/40" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Settings
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Team Members</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage your team and invite people to your organization.
            </p>
          </div>
          <a
            href="https://docs.liraintelligence.com/getting-started/navigation#members"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Docs
          </a>
        </div>

        {/* Invite by email (admin/owner only) */}
        {isOwnerOrAdmin && (
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-gray-900">Invite a teammate</h2>
            <p className="mb-4 text-sm text-gray-400">
              Send a one-time, expiring invite link tied to a specific email address. The invitee
              sets a password and lands directly in this organization.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[220px] flex-1">
                <label
                  htmlFor="invite-email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Email address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={creatingInvite}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                  disabled={creatingInvite}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                onClick={handleCreateInvite}
                disabled={creatingInvite || !inviteEmail.trim()}
                className="rounded-xl bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:opacity-50"
              >
                {creatingInvite ? 'Generating…' : 'Generate invite link'}
              </button>
            </div>

            {justCreated && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Invite ready for {justCreated.email}
                </p>
                <p className="mt-1 text-xs text-emerald-700/80">
                  Share this link. It expires{' '}
                  {new Date(justCreated.expires_at).toLocaleDateString()} and can only be used once.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-gray-700">
                    {acceptUrlFor(justCreated.token)}
                  </code>
                  <button
                    onClick={() => copyInviteLink(justCreated)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {copiedToken === justCreated.token ? (
                      <>
                        <ClipboardDocumentCheckIcon className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending invites */}
        {isOwnerOrAdmin && invites.length > 0 && (
          <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">Invites ({invites.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {invites.map((inv) => (
                <div
                  key={inv.token}
                  className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      {inv.role === 'admin' ? 'Admin · ' : 'Member · '}
                      {inv.state === 'active'
                        ? `Expires ${new Date(inv.expires_at).toLocaleDateString()}`
                        : inv.state === 'used'
                          ? `Accepted ${inv.used_at ? new Date(inv.used_at).toLocaleDateString() : ''}`
                          : inv.state === 'revoked'
                            ? 'Revoked'
                            : 'Expired'}
                      {inv.invited_by_name ? ` · by ${inv.invited_by_name}` : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      inv.state === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : inv.state === 'used'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {inv.state}
                  </span>
                  {inv.state === 'active' && (
                    <>
                      <button
                        onClick={() => copyInviteLink(inv)}
                        className="rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                        title="Copy invite link"
                      >
                        {copiedToken === inv.token ? (
                          <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRevokeInvite(inv.token)}
                        className="rounded-xl p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Revoke invite"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-bold text-gray-900">Team Members ({members.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3">
                <Link to={`/org/members/${m.user_id}`} className="shrink-0">
                  {m.picture ? (
                    <img
                      src={m.picture}
                      alt={m.name ?? m.email ?? ''}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 transition hover:ring-[#3730a3]/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a] text-sm font-bold text-white transition hover:ring-2 hover:ring-[#3730a3]/30">
                      {(m.name ?? m.email ?? m.user_id).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    <Link
                      to={`/org/members/${m.user_id}`}
                      className="transition hover:text-[#3730a3] hover:underline"
                    >
                      {m.name ?? m.email ?? m.user_id}
                    </Link>
                    {m.user_id === userId && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {m.email && m.name ? `${m.email} · ` : ''}
                    Joined {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {m.role === 'owner' ? (
                    <span className="rounded-full bg-[#3730a3]/10 px-2.5 py-1 text-xs font-semibold text-[#3730a3]">
                      Owner
                    </span>
                  ) : m.role === 'admin' ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#3730a3]/10 px-2.5 py-1 text-xs font-semibold text-[#3730a3]">
                      <ShieldCheckIcon className="h-3 w-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                      <ShieldCheckIcon className="h-3 w-3" />
                      Member
                    </span>
                  )}
                </div>

                {isOwnerOrAdmin && m.user_id !== userId && m.role !== 'owner' && (
                  <div className="flex items-center gap-1">
                    {currentMember?.role === 'owner' && (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(m.user_id, e.target.value as 'admin' | 'member')
                        }
                        className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                        title="Change role"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    <button
                      onClick={() => setRemoveTarget(m)}
                      className="rounded-xl p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Remove member"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                    </button>
                    {currentMember?.role === 'owner' && (
                      <button
                        onClick={() => setTransferTarget(m)}
                        className="rounded-xl p-1.5 text-gray-400 transition hover:bg-amber-50 hover:text-amber-600"
                        title="Transfer ownership"
                      >
                        <ArrowsRightLeftIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone - non-owner */}
        {currentMember && currentMember.role !== 'owner' && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-red-600">Danger Zone</h2>
            <p className="mb-4 text-sm text-gray-400">
              Leaving this organization is permanent. An admin will need to send you a new
              invitation to rejoin.
            </p>
            <button
              onClick={() => setLeavingOrg(true)}
              className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Leave organization
            </button>
          </div>
        )}

        {currentMember?.role === 'owner' && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-red-600">Can't leave yet</h2>
            <p className="text-sm text-gray-400">
              You’re the owner of this organization. Transfer ownership to another member before
              leaving.
            </p>
          </div>
        )}

        {/* Remove Member Confirmation Modal */}
        {removeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Remove Member?</h3>
              <p className="mt-2 text-sm text-gray-500">
                Remove{' '}
                <span className="font-semibold text-gray-900">
                  {removeTarget.name ?? removeTarget.email ?? removeTarget.user_id}
                </span>{' '}
                from this organization? They will need a new invitation to rejoin.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setRemoveTarget(null)}
                  disabled={removing}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setRemoving(true)
                    try {
                      await handleRemove(removeTarget.user_id)
                      setRemoveTarget(null)
                    } finally {
                      setRemoving(false)
                    }
                  }}
                  disabled={removing}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {removing ? 'Removing…' : 'Remove member'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Org Modal */}
        {leavingOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Leave Organization?</h3>
              <p className="mt-2 text-sm text-gray-500">
                You will be removed from this organization immediately. An admin will need to send
                you a new invitation to rejoin.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setLeavingOrg(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeave}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Leave organization
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Ownership Modal */}
        {transferTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Transfer Ownership</h3>
              <p className="mt-2 text-sm text-gray-500">
                Transfer ownership to{' '}
                <span className="font-semibold text-gray-900">{transferTarget.user_id}</span>? You
                will be demoted to admin. This cannot be undone without their cooperation.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setTransferTarget(null)}
                  disabled={transferring}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferOwnership}
                  disabled={transferring}
                  className="rounded-xl bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:opacity-50"
                >
                  {transferring ? (
                    <img
                      src="/lira_black.png"
                      alt="Loading"
                      className="h-4 w-4 animate-spin opacity-50"
                      style={{ animationDuration: '1.2s' }}
                    />
                  ) : (
                    'Transfer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { OrgMembersPage }

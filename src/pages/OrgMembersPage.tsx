import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { cn } from '@/lib'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listOrgMembers,
  updateMemberRole,
  removeMember,
  regenerateInviteCode,
  transferOwnership,
  getOrganization,
  leaveOrganization,
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
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [transferTarget, setTransferTarget] = useState<OrgMembership | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [leavingOrg, setLeavingOrg] = useState(false)

  const loadData = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const [memberList, org] = await Promise.all([
        listOrgMembers(currentOrgId),
        getOrganization(currentOrgId),
      ])
      setMembers(memberList)
      setInviteCode(org.invite_code)
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

  async function handleRegenerate() {
    if (!currentOrgId) return
    setRegenerating(true)
    try {
      const code = await regenerateInviteCode(currentOrgId)
      setInviteCode(code)
      toast.success('Invite code regenerated')
    } catch {
      toast.error('Failed to regenerate code')
    } finally {
      setRegenerating(false)
    }
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

  function copyCode() {
    navigator.clipboard.writeText(inviteCode)
    toast.success('Invite code copied!')
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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Settings</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Team Members</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your team and invite people to your organization.
          </p>
        </div>

        {/* Invite Code */}
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-gray-900">Invite Code</h2>
          <p className="mb-4 text-sm text-gray-400">
            Share this code with teammates so they can join your organization.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-gray-900">
              {inviteCode || '—'}
            </div>
            <button
              onClick={copyCode}
              disabled={!inviteCode}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              title="Copy invite code"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Copy
            </button>
            {isOwnerOrAdmin && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                title="Regenerate invite code"
              >
                <img
                  src="/lira_black.png"
                  alt="Loading"
                  className={cn('h-4 w-4 opacity-50', regenerating && 'animate-spin')}
                  style={regenerating ? { animationDuration: '1.2s' } : undefined}
                />
                Regenerate
              </button>
            )}
          </div>
        </div>

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
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <TrophyIcon className="h-3 w-3" />
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
                      onClick={() => handleRemove(m.user_id)}
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
              Leaving this organization is permanent. You will need a new invite code to rejoin.
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
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-amber-600">Can’t leave yet</h2>
            <p className="text-sm text-gray-400">
              You’re the owner of this organization. Transfer ownership to another member before
              leaving.
            </p>
          </div>
        )}

        {/* Leave Org Modal */}
        {leavingOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Leave Organization?</h3>
              <p className="mt-2 text-sm text-gray-500">
                You will be removed from this organization immediately. You’ll need a new invite
                code to rejoin.
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
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
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

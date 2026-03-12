import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightLeft,
  Copy,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  ShieldCheck,
  Crown,
  UserMinus,
} from 'lucide-react'
import { toast } from 'sonner'

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
      return payload.id ?? payload.sub ?? null
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage team members and invite new people to your organization.
        </p>
      </div>

      {/* Invite Code */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">Invite Code</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Share this code with teammates so they can join your organization.
        </p>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-background px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-foreground">
            {inviteCode || '—'}
          </div>
          <button
            onClick={copyCode}
            disabled={!inviteCode}
            className="rounded-lg border px-3 py-2.5 text-sm hover:bg-muted disabled:opacity-50"
            title="Copy invite code"
          >
            <Copy className="h-4 w-4" />
          </button>
          {isOwnerOrAdmin && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-lg border px-3 py-2.5 text-sm hover:bg-muted disabled:opacity-50"
              title="Regenerate invite code"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </section>

      {/* Members list */}
      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Team Members ({members.length})
          </h2>
        </div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                {(m.name ?? m.email ?? m.user_id).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {m.name ?? m.email ?? m.user_id}
                  {m.user_id === userId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.email && m.name ? `${m.email} · ` : ''}
                  Joined {new Date(m.joined_at).toLocaleDateString()}
                </p>
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-1.5">
                {m.role === 'owner' ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    <Crown className="h-3 w-3" />
                    Owner
                  </span>
                ) : m.role === 'admin' ? (
                  <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <Shield className="h-3 w-3" />
                    Member
                  </span>
                )}
              </div>

              {/* Actions (only for owner/admin, not on self or other owners) */}
              {isOwnerOrAdmin && m.user_id !== userId && m.role !== 'owner' && (
                <div className="flex items-center gap-1">
                  {/* Only the owner can promote/demote — backend enforces this */}
                  {currentMember?.role === 'owner' && (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleRoleChange(m.user_id, e.target.value as 'admin' | 'member')
                      }
                      className="rounded-lg border bg-background px-2 py-1 text-xs"
                      title="Change role"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    title="Remove member"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                  {currentMember?.role === 'owner' && (
                    <button
                      onClick={() => setTransferTarget(m)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                      title="Transfer ownership"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      {currentMember && currentMember.role !== 'owner' && (
        <section className="rounded-xl border border-red-200 bg-card p-6 dark:border-red-900/50">
          <h2 className="mb-1 text-base font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Leaving this organization is permanent. You will need a new invite code to rejoin.
          </p>
          <button
            onClick={() => setLeavingOrg(true)}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            Leave organization
          </button>
        </section>
      )}
      {currentMember?.role === 'owner' && (
        <section className="rounded-xl border border-amber-200 bg-card p-6 dark:border-amber-900/50">
          <h2 className="mb-1 text-base font-semibold text-amber-600 dark:text-amber-400">
            Can't leave yet
          </h2>
          <p className="text-sm text-muted-foreground">
            You're the owner of this organization. Transfer ownership to another member before
            leaving.
          </p>
        </section>
      )}

      {/* Leave Org Confirmation Modal */}
      {leavingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Leave Organization?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You will be removed from this organization immediately. You'll need a new invite code
              to rejoin.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setLeavingOrg(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Leave organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Confirmation Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Transfer Ownership</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Transfer ownership to{' '}
              <span className="font-medium text-foreground">{transferTarget.user_id}</span>? You
              will be demoted to admin. This cannot be undone without their cooperation.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTransferTarget(null)}
                disabled={transferring}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={transferring}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {transferring ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { OrgMembersPage }

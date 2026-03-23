import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowPathIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useInterviewStore } from '@/app/store'
import { deleteInterviewRecord, listInterviews } from '@/services/api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageLoader } from '@/components/ui/page-loader'

function InterviewsPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { interviews, loading, setInterviews, setLoading, removeInterview } = useInterviewStore()

  const [search, setSearch] = useState('')
  const [deletingRole, setDeletingRole] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    onConfirm: () => Promise<void>
  } | null>(null)

  const handleDeleteRole = (role: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const group = interviews.filter((iv) => iv.title === role)
    setConfirm({
      title: 'Delete Role',
      description: `Are you sure you want to delete "${role}" and all ${group.length} candidate${group.length !== 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        if (!currentOrgId) return
        setDeletingRole(role)
        try {
          await Promise.all(group.map((iv) => deleteInterviewRecord(currentOrgId, iv.interview_id)))
          group.forEach((iv) => removeInterview(iv.interview_id))
          toast.success(`"${role}" deleted`)
        } catch {
          toast.error('Failed to delete role')
        } finally {
          setDeletingRole(null)
        }
      },
    })
  }

  const loadInterviews = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const list = await listInterviews(currentOrgId)
      setInterviews(list)
    } catch {
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, setInterviews, setLoading])

  useEffect(() => {
    loadInterviews()
  }, [loadInterviews])

  // Group by role title, tracking unique candidates and newest date per role
  const roleMap = new Map<string, { candidates: Set<string>; latestDate: string }>()
  for (const iv of interviews) {
    if (search) {
      const q = search.toLowerCase()
      if (!iv.title.toLowerCase().includes(q) && !iv.candidate_name.toLowerCase().includes(q))
        continue
    }
    const candidateKey =
      iv.candidate_email?.trim().toLowerCase() ||
      iv.candidate_name?.trim().toLowerCase() ||
      iv.interview_id
    const existing = roleMap.get(iv.title)
    if (existing) {
      existing.candidates.add(candidateKey)
      if (iv.created_at > existing.latestDate) existing.latestDate = iv.created_at
    } else {
      roleMap.set(iv.title, { candidates: new Set([candidateKey]), latestDate: iv.created_at })
    }
  }
  // Sort roles by newest first
  const sortedRoles = Array.from(roleMap.entries())
    .sort((a, b) => b[1].latestDate.localeCompare(a[1].latestDate))
    .map(([role, { candidates }]) => [role, candidates.size] as const)

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <ConfirmDialog
          open={!!confirm}
          title={confirm?.title ?? ''}
          description={confirm?.description ?? ''}
          onConfirm={confirm?.onConfirm ?? (async () => {})}
          onClose={() => setConfirm(null)}
        />

        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Workspace
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Interviews</h1>
          </div>
          <button
            onClick={() => navigate('/org/roles/new')}
            className="flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#222]"
          >
            <PlusIcon className="h-4 w-4" />
            Create Role
          </button>
        </div>

        {/* ── Stat strip ── */}
        {!loading && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Total Interviews', value: interviews.length },
              { label: 'Total Roles', value: sortedRoles.length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#141414] to-[#0a0a0a] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.10] to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.07]" />
                <div className="relative">
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative mb-5">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles or candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/60 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#3730a3]/40 focus:ring-2 focus:ring-[#3730a3]/10"
          />
        </div>

        {/* ── Loading ── */}
        {loading && <PageLoader />}

        {/* ── Empty state ── */}
        {!loading && sortedRoles.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-white/60 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3730a3]/10">
              <BriefcaseIcon className="h-7 w-7 text-[#3730a3]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {search ? 'No results found' : 'No interviews yet'}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">
              {search ? 'Try a different search term.' : 'Create your first role to get started.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/org/roles/new')}
                className="mt-5 flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#222]"
              >
                <PlusIcon className="h-4 w-4" />
                Create Role
              </button>
            )}
          </div>
        )}

        {/* ── Role cards ── */}
        {!loading && sortedRoles.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedRoles.map(([role, count]) => {
              const initials = role
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()
              return (
                <div
                  key={role}
                  className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm transition hover:border-[#3730a3]/30 hover:shadow-md"
                >
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-transparent transition group-hover:bg-[#3730a3]/40" />
                  <button
                    onClick={() => navigate(`/org/roles/${encodeURIComponent(role)}`)}
                    className="flex w-full items-start gap-4 p-5 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a] text-sm font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-snug text-gray-900 transition group-hover:text-[#3730a3]">
                        {role}
                      </p>
                      <span className="mt-1.5 inline-flex items-center rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-xs font-semibold text-[#3730a3]">
                        {count} candidate{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-[#3730a3]" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteRole(role, e)}
                    disabled={deletingRole === role}
                    className="absolute right-3 top-3 rounded-xl p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
                    title="Delete role"
                  >
                    {deletingRole === role ? (
                      <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export { InterviewsPage }

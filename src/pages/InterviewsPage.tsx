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
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        onConfirm={confirm?.onConfirm ?? (async () => {})}
        onClose={() => setConfirm(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <BriefcaseIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Interviews</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {interviews.length} interview{interviews.length !== 1 ? 's' : ''} across{' '}
              {sortedRoles.length} role{sortedRoles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/org/roles/new')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* MagnifyingGlassIcon */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="MagnifyingGlassIcon roles or candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : sortedRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-2xl bg-violet-50 mb-4">
              <BriefcaseIcon className="w-10 h-10 text-violet-400" />
            </div>
            <p className="text-gray-700 font-semibold">No interviews yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Try a different search term.' : 'Create your first role to get started.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/org/roles/new')}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create Role
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedRoles.map(([role, count], idx) => {
              const initials = role
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()
              const palettes = [
                'from-violet-500 to-purple-600',
                'from-indigo-500 to-violet-600',
                'from-fuchsia-500 to-pink-600',
                'from-blue-500 to-indigo-600',
                'from-purple-500 to-indigo-600',
                'from-violet-600 to-fuchsia-600',
              ]
              const gradient = palettes[idx % palettes.length]
              return (
                <div
                  key={role}
                  className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-violet-300 transition-all"
                >
                  {/* Card top gradient strip */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                  {/* Card body */}
                  <button
                    onClick={() => navigate(`/org/roles/${encodeURIComponent(role)}`)}
                    className="flex-1 p-5 text-left flex items-start gap-4"
                  >
                    {/* Role initials avatar */}
                    <div
                      className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate leading-snug">{role}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                          {count} candidate{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0 mt-1" />
                  </button>

                  {/* Delete button — hover only */}
                  <button
                    onClick={(e) => handleDeleteRole(role, e)}
                    disabled={deletingRole === role}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-30 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-40"
                    title="Delete role"
                  >
                    {deletingRole === role ? (
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="w-3.5 h-3.5" />
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

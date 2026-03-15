import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BriefcaseIcon, ChevronRight, Loader2, Plus, Search, Trash2 } from 'lucide-react'
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

  // Group by role title, tracking newest created_at per role for sorting
  const roleMap = new Map<string, { count: number; latestDate: string }>()
  for (const iv of interviews) {
    if (search) {
      const q = search.toLowerCase()
      if (!iv.title.toLowerCase().includes(q) && !iv.candidate_name.toLowerCase().includes(q))
        continue
    }
    const existing = roleMap.get(iv.title)
    if (existing) {
      existing.count++
      if (iv.created_at > existing.latestDate) existing.latestDate = iv.created_at
    } else {
      roleMap.set(iv.title, { count: 1, latestDate: iv.created_at })
    }
  }
  // Sort roles by newest first
  const sortedRoles = Array.from(roleMap.entries())
    .sort((a, b) => b[1].latestDate.localeCompare(a[1].latestDate))
    .map(([role, { count }]) => [role, count] as const)

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
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
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
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles or candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : sortedRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BriefcaseIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No interviews found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search
                ? 'Try a different search term.'
                : 'Create your first interview to get started.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/org/roles/new')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Role
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden">
            {sortedRoles.map(([role, count]) => (
              <div
                key={role}
                className="flex items-center group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <button
                  onClick={() => navigate(`/org/roles/${encodeURIComponent(role)}`)}
                  className="flex-1 flex items-center justify-between px-5 py-4 text-left min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                      <BriefcaseIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {role}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {count} candidate{count !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                </button>
                <button
                  onClick={(e) => handleDeleteRole(role, e)}
                  disabled={deletingRole === role}
                  className="shrink-0 p-3 mr-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                  title="Delete role"
                >
                  {deletingRole === role ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { InterviewsPage }

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseIcon,
  ChevronRight,
  Loader2,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { useOrgStore, useInterviewStore } from '@/app/store'
import { deleteInterviewRecord, listInterviews, type Interview } from '@/services/api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { cn } from '@/lib'

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  scheduled: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400',
  bot_deployed: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
  in_progress: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
  evaluating: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400',
  completed: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400',
  cancelled: 'text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-400',
  no_show: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-400',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Pending',
  scheduled: 'Scheduled',
  bot_deployed: 'In Session',
  in_progress: 'In Progress',
  evaluating: 'Evaluating',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

function CandidateRow({
  interviews,
  onOpen,
  onDelete,
  deleting,
}: {
  interviews: Interview[]
  onOpen: () => void
  onDelete: (iv: Interview) => void
  deleting: string | null
}) {
  const latest = interviews[0] // sorted newest first
  const initial = latest.candidate_name?.trim()?.charAt(0)?.toUpperCase()
  const totalRounds = interviews.length
  const latestRound = Math.max(...interviews.map((iv) => iv.round ?? 1))
  const statusColor = STATUS_COLORS[latest.status] ?? 'text-slate-500 bg-slate-100'

  return (
    <div className="group relative flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5 hover:border-violet-300 hover:shadow-sm transition-all">
      <button onClick={onOpen} className="flex-1 flex items-center gap-4 text-left min-w-0">
        {/* Avatar */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
          {initial ? initial : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">
              {latest.candidate_name?.trim() || latest.candidate_email || 'Candidate'}
            </span>
            <span
              className={cn(
                'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                statusColor
              )}
            >
              {STATUS_LABELS[latest.status] ?? latest.status}
            </span>
            {totalRounds > 1 && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                Round {latestRound}/{totalRounds}
              </span>
            )}
          </div>
          {latest.candidate_email && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{latest.candidate_email}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(latest)
        }}
        disabled={deleting === latest.interview_id}
        className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-30 sm:opacity-0 sm:group-hover:opacity-100 transition-all disabled:opacity-40"
        title="Delete candidate"
      >
        {deleting === latest.interview_id ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}

function InterviewRolePage() {
  const navigate = useNavigate()
  const { roleSlug } = useParams<{ roleSlug: string }>()
  const role = decodeURIComponent(roleSlug ?? '')
  const { currentOrgId } = useOrgStore()
  const { interviews, loading, setInterviews, setLoading, removeInterview } = useInterviewStore()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingRole, setDeletingRole] = useState(false)
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    onConfirm: () => Promise<void>
  } | null>(null)

  // Load interviews for this org (also re-runs on direct navigation when store is empty)
  const loadIfNeeded = useCallback(async () => {
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
    loadIfNeeded()
  }, [loadIfNeeded])

  const allForRole = interviews
    .filter((iv) => iv.title === role)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Group by candidate (email preferred, fallback to name)
  const candidateGroups = (() => {
    const groups = new Map<string, Interview[]>()
    for (const iv of allForRole) {
      const key =
        iv.candidate_email?.trim().toLowerCase() ||
        iv.candidate_name?.trim().toLowerCase() ||
        iv.interview_id
      const existing = groups.get(key)
      if (existing) {
        existing.push(iv)
      } else {
        groups.set(key, [iv])
      }
    }
    return Array.from(groups.values())
  })()

  const templateId = allForRole[0]?.interview_id

  const handleDeleteCandidate = (interview: Interview) => {
    const name = interview.candidate_name?.trim() || 'this candidate'
    setConfirm({
      title: 'Delete Candidate',
      description: `Are you sure you want to delete ${name}? This cannot be undone.`,
      onConfirm: async () => {
        if (!currentOrgId) return
        setDeletingId(interview.interview_id)
        try {
          await deleteInterviewRecord(currentOrgId, interview.interview_id)
          removeInterview(interview.interview_id)
          toast.success('Candidate deleted')
        } catch {
          toast.error('Failed to delete candidate')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const handleDeleteRole = () => {
    const count = candidateGroups.length
    setConfirm({
      title: 'Delete Role',
      description: `Are you sure you want to delete the "${role}" role and all ${count} candidate${count !== 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        if (!currentOrgId) return
        setDeletingRole(true)
        try {
          await Promise.all(
            allForRole.map((iv) => deleteInterviewRecord(currentOrgId, iv.interview_id))
          )
          allForRole.forEach((iv) => removeInterview(iv.interview_id))
          toast.success(`"${role}" deleted`)
          navigate('/org/roles')
        } catch {
          toast.error('Failed to delete role')
          setDeletingRole(false)
        }
      },
    })
  }

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
      <div className="flex items-center gap-4 px-4 sm:px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => navigate('/org/roles')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 shrink-0">
            <BriefcaseIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{role}</h1>
        </div>
        <button
          onClick={handleDeleteRole}
          disabled={deletingRole || allForRole.length === 0}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors disabled:opacity-40"
        >
          {deletingRole ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Delete Role
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {candidateGroups.map((group) => {
              // Navigate to the root interview (no parent_interview_id) so the
              // full rounds list is visible and the back-button chain works correctly
              const root =
                group.find((iv) => !iv.parent_interview_id) ?? group[group.length - 1]
              return (
                <CandidateRow
                  key={root.interview_id}
                  interviews={group}
                  onOpen={() => navigate(`/org/interviews/${root.interview_id}`)}
                  onDelete={(iv) => handleDeleteCandidate(iv)}
                  deleting={deletingId}
                />
              )
            })}

            {/* Interview Another Person */}
            {templateId && (
              <button
                onClick={() => navigate(`/org/roles/new?from=${templateId}`)}
                className="w-full flex items-center gap-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/60 px-4 py-3.5 hover:bg-violet-50 hover:border-violet-400 transition-all text-left"
              >
                <div className="shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-violet-400 text-violet-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="font-semibold text-violet-600">Interview Another Person</span>
              </button>
            )}

            {candidateGroups.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="p-3 rounded-xl bg-gray-100 mb-3">
                  <User className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium">No candidates yet</p>
                <p className="text-sm text-gray-400 mt-1">Add a candidate to start interviewing.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { InterviewRolePage }

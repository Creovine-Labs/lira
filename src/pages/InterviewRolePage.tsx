import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BriefcaseIcon, Loader2, Trash2, User, UserPlus } from 'lucide-react'
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

  return (
    <div className="flex items-center">
      <button
        onClick={onOpen}
        className="flex-1 flex items-center px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left min-w-0"
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center text-sm font-semibold mr-4">
          {initial ? initial : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">
            {latest.candidate_name?.trim() || latest.candidate_email || 'Candidate'}
          </span>
          {totalRounds > 1 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Round {latestRound} of {totalRounds}
            </span>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-3',
            STATUS_COLORS[latest.status] ?? 'text-slate-500 bg-slate-100'
          )}
        >
          {totalRounds > 1 ? `Round ${latestRound} — ` : ''}
          {STATUS_LABELS[latest.status] ?? latest.status}
        </span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(latest)
        }}
        disabled={deleting === latest.interview_id}
        className="shrink-0 p-3 mr-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
        title="Delete candidate"
      >
        {deleting === latest.interview_id ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
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

  // Load interviews if store is empty (direct navigation)
  const loadIfNeeded = useCallback(async () => {
    if (!currentOrgId || interviews.length > 0) return
    setLoading(true)
    try {
      const list = await listInterviews(currentOrgId)
      setInterviews(list)
    } catch {
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, interviews.length, setInterviews, setLoading])

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
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
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
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {candidateGroups.map((group) => {
              const latest = group[0] // newest first
              return (
                <CandidateRow
                  key={latest.interview_id}
                  interviews={group}
                  onOpen={() => navigate(`/org/interviews/${latest.interview_id}`)}
                  onDelete={(iv) => handleDeleteCandidate(iv)}
                  deleting={deletingId}
                />
              )
            })}

            {/* Interview Another Person — same row height as a candidate */}
            {templateId && (
              <button
                onClick={() => navigate(`/org/roles/new?from=${templateId}`)}
                className="w-full flex items-center px-5 py-4 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors text-left"
              >
                <div className="shrink-0 w-9 h-9 rounded-full border-2 border-dashed border-violet-300 dark:border-violet-700 text-violet-400 flex items-center justify-center mr-4">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="font-medium text-violet-600 dark:text-violet-400">
                  Interview Another Person
                </span>
              </button>
            )}

            {candidateGroups.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No candidates yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { InterviewRolePage }

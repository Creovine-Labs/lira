import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  PlayCircleIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

import { useOrgStore, useTaskStore, useNotifStore } from '@/app/store'
import {
  getTask,
  getMeeting,
  listOrgMembers,
  updateTask,
  deleteTask,
  executeTask,
  liraReviewTask,
  type OrgMembership,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
  type Meeting,
} from '@/services/api'
import { cn } from '@/lib'
import { PageLoader } from '@/components/ui/page-loader'

const STATUS_LABELS: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; color: string; dot: string; badgeCls: string }
> = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    color: 'text-red-500',
    dot: 'bg-red-500',
    badgeCls: 'bg-red-100 text-red-600 border border-red-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    color: 'text-amber-500',
    dot: 'bg-amber-400',
    badgeCls: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'text-emerald-500',
    dot: 'bg-emerald-500',
    badgeCls: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircleIcon,
    color: 'text-slate-500',
    dot: 'bg-slate-400',
    badgeCls: 'bg-slate-100 text-slate-500 border border-slate-200',
  },
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-600',
  urgent: 'bg-red-100 text-red-600',
}

const TASK_TYPE_LABELS: Record<string, string> = {
  action_item: 'Action Item',
  draft_document: 'Draft Document',
  follow_up_email: 'Follow-up Email',
  research: 'Research',
  summary: 'Summary',
  decision: 'Decision',
}

function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { updateTask: updateTaskInStore, removeTask } = useTaskStore()
  const { markTaskRead } = useNotifStore()

  const [task, setTask] = useState<TaskRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [liraReviewing, setLiraReviewing] = useState(false)

  // Meeting title lookup
  const [sourceMeeting, setSourceMeeting] = useState<Meeting | null>(null)

  // Org members for assignee autocomplete
  const [orgMembers, setOrgMembers] = useState<OrgMembership[]>([])

  // Inline field editing
  const [editAssignee, setEditAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState('')
  const [savingAssignee, setSavingAssignee] = useState(false)

  const [editDueDate, setEditDueDate] = useState(false)
  const [dueDateDraft, setDueDateDraft] = useState('')
  const [savingDueDate, setSavingDueDate] = useState(false)

  const loadTask = useCallback(async () => {
    if (!currentOrgId || !taskId) return
    setLoading(true)
    try {
      const [t, members] = await Promise.all([
        getTask(currentOrgId, taskId),
        listOrgMembers(currentOrgId),
      ])
      setTask(t)
      setOrgMembers(members)
      if (t.execution_status === 'completed' && t.execution_result) {
        setExecutionResult(t.execution_result)
      }
      // Mark this task's notification as read (clears sidebar badge)
      markTaskRead(`task-${taskId}`)
      // Fetch the source meeting if present
      if (t.session_id) {
        getMeeting(t.session_id)
          .then((m) => setSourceMeeting(m))
          .catch(() => {})
      }
    } catch {
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, taskId, markTaskRead])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  async function handleStatusChange(status: TaskStatus) {
    if (!currentOrgId || !taskId || !task) return
    try {
      const updated = await updateTask(currentOrgId, taskId, { status })
      setTask(updated)
      updateTaskInStore(taskId, { status })
      toast.success(`Status updated to ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleSaveAssignee(value?: string) {
    const val = (value !== undefined ? value : assigneeDraft).trim()
    if (!currentOrgId || !taskId) return
    setSavingAssignee(true)
    try {
      const updated = await updateTask(currentOrgId, taskId, { assigned_to: val || undefined })
      setTask(updated)
      updateTaskInStore(taskId, { assigned_to: updated.assigned_to })
      toast.success('Assignee updated')
    } catch {
      toast.error('Failed to update assignee')
    } finally {
      setSavingAssignee(false)
      setEditAssignee(false)
    }
  }

  async function handleSaveDueDate() {
    if (!currentOrgId || !taskId) return
    setSavingDueDate(true)
    try {
      const updated = await updateTask(currentOrgId, taskId, {
        due_date: dueDateDraft || undefined,
      })
      setTask(updated)
      updateTaskInStore(taskId, { due_date: updated.due_date })
      toast.success('Due date updated')
    } catch {
      toast.error('Failed to update due date')
    } finally {
      setSavingDueDate(false)
      setEditDueDate(false)
    }
  }

  async function handleExecute() {
    if (!currentOrgId || !taskId) return
    setExecuting(true)
    try {
      const res = await executeTask(currentOrgId, taskId)
      setExecutionResult(res.result)
      setTask((prev) =>
        prev ? { ...prev, execution_status: 'completed', execution_result: res.result } : prev
      )
      updateTaskInStore(taskId, { execution_status: 'completed', execution_result: res.result })
      toast.success('Task executed!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Execution failed')
      setTask((prev) => (prev ? { ...prev, execution_status: 'failed' } : prev))
    } finally {
      setExecuting(false)
    }
  }

  async function handleDelete() {
    if (!currentOrgId || !taskId) return
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteTask(currentOrgId, taskId)
      removeTask(taskId)
      toast.success('Task deleted')
      navigate('/org/tasks')
    } catch {
      toast.error('Failed to delete task')
      setDeleting(false)
    }
  }

  async function handleLiraReview() {
    if (!currentOrgId || !taskId) return
    setLiraReviewing(true)
    try {
      const reviewed = await liraReviewTask(currentOrgId, taskId)
      setTask(reviewed)
      if (reviewed.lira_review_status === 'approved') {
        toast.success('Lira is ready to take on this task!')
      } else {
        toast.info('Lira needs a bit more detail — see her notes below.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setLiraReviewing(false)
    }
  }

  function copyResult() {
    if (executionResult) {
      navigator.clipboard.writeText(executionResult)
      toast.success('Copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#ebebeb]">
        <PageLoader />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb] py-20">
        <div className="text-center">
          <p className="text-sm text-gray-500">Task not found.</p>
          <button
            onClick={() => navigate('/org/tasks')}
            className="mt-4 text-sm text-violet-600 hover:underline"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_LABELS[task.status]
  // StatusIcon intentionally unused — dot is used instead

  // Member lookup for assignee link + autocomplete suggestions
  const assignedMember = orgMembers.find(
    (m) => task.assigned_to && (m.name === task.assigned_to || m.email === task.assigned_to)
  )
  const memberSuggestions = orgMembers.filter((m) => {
    if (!assigneeDraft.trim()) return true
    const q = assigneeDraft.toLowerCase()
    return (m.name ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q)
  })

  const canExecute =
    ['action_item', 'draft_document', 'follow_up_email', 'research', 'summary'].includes(
      task.task_type
    ) && task.execution_status !== 'running'

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/org/tasks')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Tasks
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                  statusCfg.badgeCls
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  PRIORITY_COLORS[task.priority]
                )}
              >
                {task.priority}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>

        {/* Lira Review Banner */}
        {task.assigned_to === 'lira' && task.lira_review_status && (
          <section
            className={cn(
              'rounded-2xl border p-5 shadow-sm',
              task.lira_review_status === 'reviewing' && 'border-amber-200 bg-amber-50',
              task.lira_review_status === 'needs_info' && 'border-red-200 bg-red-50',
              task.lira_review_status === 'approved' && 'border-emerald-200 bg-emerald-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                L
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {task.lira_review_status === 'reviewing' && 'Lira is reviewing this task…'}
                  {task.lira_review_status === 'needs_info' && 'Lira needs more information'}
                  {task.lira_review_status === 'approved' && 'Lira has this covered'}
                </p>
                {task.lira_message && (
                  <p className="text-sm text-gray-700 mb-3">{task.lira_message}</p>
                )}
                {task.lira_review_status === 'needs_info' &&
                  task.lira_needs &&
                  task.lira_needs.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {task.lira_needs.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-red-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                {task.lira_review_status === 'needs_info' && (
                  <p className="mb-3 text-xs text-gray-500">
                    Edit the task description above with the missing details, then ask Lira to
                    review again.
                  </p>
                )}
                {(task.lira_review_status === 'needs_info' ||
                  task.lira_review_status === 'reviewing') && (
                  <button
                    onClick={handleLiraReview}
                    disabled={liraReviewing}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {liraReviewing ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <BoltIcon className="h-4 w-4" />
                    )}
                    {liraReviewing ? 'Lira is reviewing…' : 'Ask Lira to Review Again'}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Description */}
        <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Description</h2>
          <p className="text-sm leading-relaxed text-gray-900">{task.description}</p>
          {task.source_quote && (
            <div className="mt-4 rounded-xl border-l-4 border-violet-500 bg-violet-50/50 py-3 pl-4">
              <p className="mb-1 text-xs font-medium text-gray-500">From meeting transcript:</p>
              <p className="text-sm italic text-gray-900">"{task.source_quote}"</p>
            </div>
          )}
        </section>

        {/* Details */}
        <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Details</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {/* Assigned To — member autocomplete */}
            <div className="relative flex flex-col gap-1">
              <dt className="text-xs font-medium text-gray-500">Assigned To</dt>
              {editAssignee ? (
                <dd className="relative">
                  <div className="flex items-center gap-1">
                    <input
                      className="h-7 flex-1 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                      value={assigneeDraft}
                      onChange={(e) => setAssigneeDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveAssignee()
                        if (e.key === 'Escape') setEditAssignee(false)
                      }}
                      placeholder="Search members…"
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional UX: auto-focus inline edit field
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveAssignee()}
                      disabled={savingAssignee}
                      className="rounded p-0.5 text-green-600 hover:bg-green-50"
                    >
                      {savingAssignee ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditAssignee(false)}
                      className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {(memberSuggestions.length > 0 ||
                    !assigneeDraft.trim() ||
                    'lira'.includes(assigneeDraft.toLowerCase())) && (
                    <div className="absolute left-0 top-8 z-20 w-full max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                      {/* Lira — always first */}
                      {(!assigneeDraft.trim() ||
                        'lira'.includes(assigneeDraft.toLowerCase()) ||
                        'lira (ai)'.includes(assigneeDraft.toLowerCase())) && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSaveAssignee('lira')
                          }}
                          className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm hover:bg-violet-50"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">
                            L
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-violet-700">
                              Lira (AI)
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              Lira will review and complete this automatically
                            </p>
                          </div>
                          <span className="ml-auto shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                            AI
                          </span>
                        </button>
                      )}
                      {memberSuggestions.map((m) => (
                        <button
                          key={m.user_id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSaveAssignee(m.name ?? m.email ?? '')
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                            {(m.name ?? m.email ?? '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">
                              {m.name ?? m.email}
                            </p>
                            {m.name && m.email && (
                              <p className="truncate text-xs text-gray-500">{m.email}</p>
                            )}
                          </div>
                          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] capitalize text-slate-600">
                            {m.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </dd>
              ) : (
                <dd className="flex items-center gap-1 group">
                  {task.assigned_to === 'lira' ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-violet-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[9px] font-bold text-white">
                        L
                      </span>
                      Lira (AI)
                    </span>
                  ) : assignedMember ? (
                    <Link
                      to={`/org/members/${assignedMember.user_id}`}
                      className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
                    >
                      <UserIcon className="h-3.5 w-3.5 shrink-0" />
                      {task.assigned_to}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-900">
                      {task.assigned_to || 'Unassigned'}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setAssigneeDraft(task.assigned_to ?? '')
                      setEditAssignee(true)
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-gray-500 hover:text-gray-900 transition-opacity"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                </dd>
              )}
            </div>

            {/* Due Date — inline edit */}
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-gray-500">Due Date</dt>
              {editDueDate ? (
                <dd className="flex items-center gap-1">
                  <input
                    type="date"
                    className="h-7 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                    value={dueDateDraft}
                    onChange={(e) => setDueDateDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDueDate()
                      if (e.key === 'Escape') setEditDueDate(false)
                    }}
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional UX: auto-focus inline edit field
                    autoFocus
                  />
                  <button
                    onClick={handleSaveDueDate}
                    disabled={savingDueDate}
                    className="rounded p-0.5 text-green-600 hover:bg-green-50"
                  >
                    {savingDueDate ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditDueDate(false)}
                    className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </dd>
              ) : (
                <dd className="flex items-center gap-1 group">
                  <span className="text-sm text-gray-900">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                  </span>
                  <button
                    onClick={() => {
                      setDueDateDraft(task.due_date ? task.due_date.split('T')[0] : '')
                      setEditDueDate(true)
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-gray-500 hover:text-gray-900 transition-opacity"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                </dd>
              )}
            </div>

            <DetailItem label="Created" value={new Date(task.created_at).toLocaleString()} />
            <DetailItem label="Updated" value={new Date(task.updated_at).toLocaleString()} />

            {/* Meeting link */}
            {task.session_id && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-gray-500">Meeting</dt>
                <dd>
                  <Link
                    to={`/meetings/${task.session_id}`}
                    className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
                  >
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0" />
                    {sourceMeeting?.title || task.session_id}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Status actions */}
        <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Change Status</h2>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((s) => {
              const cfg = STATUS_LABELS[s]
              const isActive = task.status === s
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isActive}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition',
                    isActive
                      ? cn('border-transparent cursor-default', cfg.badgeCls)
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Lira Execution */}
        <section className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BoltIcon className="h-5 w-5 text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-900">Lira Execution</h2>
            </div>
            {canExecute && (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Executing…
                    </>
                  ) : (
                    <>
                      <BoltIcon className="h-4 w-4" />
                      {executionResult ? 'Re-run with Lira' : 'Run with Lira'}
                    </>
                  )}
                </button>
                {executing && (
                  <p className="text-xs text-gray-400">
                    Lira is generating — this may take a few seconds
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Email execution toggle for follow_up_email tasks */}
          {task.task_type === 'follow_up_email' && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-send email via Lira</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    When enabled, Lira will actually send this email to the assignee — not just
                    draft it.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!currentOrgId || !taskId) return
                    const newVal = !task.email_execution_enabled
                    try {
                      const updated = await updateTask(currentOrgId, taskId, {
                        email_execution_enabled: newVal,
                      })
                      if (updated) setTask(updated)
                      updateTaskInStore(taskId, { email_execution_enabled: newVal })
                    } catch {
                      toast.error('Failed to update')
                    }
                  }}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    task.email_execution_enabled ? 'bg-violet-600' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200',
                      task.email_execution_enabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Missing fields warning */}
              {task.missing_fields && task.missing_fields.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="mb-1 text-xs font-semibold text-amber-700">
                    Required before Lira can send:
                  </p>
                  <ul className="space-y-0.5">
                    {task.missing_fields.includes('assignee') && (
                      <li className="flex items-center gap-1.5 text-xs text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Assignee email not resolved — edit the Assigned To field with a member name
                      </li>
                    )}
                    {task.missing_fields.includes('due_date') && (
                      <li className="flex items-center gap-1.5 text-xs text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Due date is not set
                      </li>
                    )}
                    {task.missing_fields.includes('email_config') && (
                      <li className="flex items-center gap-1.5 text-xs text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Email not configured — go to{' '}
                        <a href="/org/email" className="underline">
                          Email Settings
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Resolved assignee confirmation */}
              {task.assignee_email && task.missing_fields?.length === 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Ready to send to {task.assignee_email}
                </div>
              )}
            </div>
          )}

          {executionResult ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Lira Result
                </span>
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  <DocumentDuplicateIcon className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <div className="prose prose-sm max-w-none rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <ReactMarkdown>{executionResult}</ReactMarkdown>
              </div>
            </div>
          ) : task.execution_status === 'running' ? (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
              <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
              <p className="text-sm text-blue-600">Lira is processing this task…</p>
            </div>
          ) : task.execution_status === 'failed' ? (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">Execution failed. Try again.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Click "Run with Lira" to generate a result for this task. Available for action items,
              drafts, emails, research, and summaries.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

export { TaskDetailPage as OrgTaskDetailPage }

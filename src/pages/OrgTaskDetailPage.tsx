import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  EnvelopeIcon,
  PencilIcon,
  PlayCircleIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useTaskStore, useNotifStore } from '@/app/store'
import {
  getTask,
  getMeeting,
  listOrgMembers,
  updateTask,
  deleteTask,
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
  const { markTaskRead, removeNotif, entries: notifEntries } = useNotifStore()

  const [task, setTask] = useState<TaskRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskNotFound, setTaskNotFound] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editDescOpen, setEditDescOpen] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [savingDesc, setSavingDesc] = useState(false)

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
  const [emailModalOpen, setEmailModalOpen] = useState(false)

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
      // Mark this task's notification as read (clears sidebar badge)
      markTaskRead(`task-${taskId}`)
      // Fetch the source meeting if present
      if (t.session_id) {
        getMeeting(t.session_id)
          .then((m) => setSourceMeeting(m))
          .catch(() => {})
      }
    } catch (err) {
      const is404 = err instanceof Error && err.message.startsWith('404:')
      if (is404) {
        setTaskNotFound(true)
        // Remove all in-memory notifications pointing to this task
        notifEntries
          .filter((e) => e.link === `/org/tasks/${taskId}`)
          .forEach((e) => removeNotif(e.id))
      } else {
        toast.error('Failed to load task')
      }
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, taskId, markTaskRead])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  // Poll for updates while Lira is reviewing or executing
  useEffect(() => {
    if (!task) return
    const shouldPoll =
      task.lira_review_status === 'reviewing' || task.execution_status === 'running'
    if (!shouldPoll) return
    const interval = setInterval(() => loadTask(), 4000)
    return () => clearInterval(interval)
  }, [task?.lira_review_status, task?.execution_status, loadTask])

  // Auto-redirect when task was deleted
  useEffect(() => {
    if (!taskNotFound) return
    const timer = setTimeout(() => navigate('/org/tasks'), 3000)
    return () => clearTimeout(timer)
  }, [taskNotFound, navigate])

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

  async function handleSaveDescription() {
    if (!currentOrgId || !taskId) return
    setSavingDesc(true)
    try {
      const updated = await updateTask(currentOrgId, taskId, { description: descDraft.trim() })
      setTask(updated)
      updateTaskInStore(taskId, { description: updated.description })
      setEditDescOpen(false)
      // Automatically trigger Lira re-review with the updated description
      const reviewed = await liraReviewTask(currentOrgId, taskId)
      if (reviewed) {
        setTask(reviewed)
        if (reviewed.lira_review_status === 'approved') {
          toast.success('Lira is ready to take on this task!')
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingDesc(false)
    }
  }

  function handleDelete() {
    if (!currentOrgId || !taskId) return
    setShowDeleteConfirm(true)
  }

  async function handleConfirmDelete() {
    if (!currentOrgId || !taskId) return
    setDeleting(true)
    try {
      await deleteTask(currentOrgId, taskId)
      removeTask(taskId)
      toast.success('Task deleted')
      navigate('/org/tasks')
    } catch {
      toast.error('Failed to delete task')
      setDeleting(false)
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#ebebeb]">
        <PageLoader />
      </div>
    )
  }

  if (taskNotFound) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb] py-20">
        <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <TrashIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Task no longer exists</h2>
          <p className="mt-2 text-sm text-gray-500">
            This task has been deleted. You'll be redirected to your tasks list in a moment.
          </p>
          <button
            onClick={() => navigate('/org/tasks')}
            className="mt-6 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Go to Tasks
          </button>
        </div>
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
              <img
                src="/lira_black_with_white_backgound.png"
                alt="Lira"
                className="h-8 w-8 shrink-0 rounded-full object-contain border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {task.lira_review_status === 'reviewing' && 'Lira is reviewing this task…'}
                  {task.lira_review_status === 'needs_info' && 'Lira needs more information'}
                  {task.lira_review_status === 'approved' &&
                    (task.execution_status === 'completed'
                      ? 'Lira completed this task'
                      : task.execution_status === 'running'
                        ? 'Lira is working on this…'
                        : 'Lira has this covered')}
                </p>
                {/* Show View Sent Email button when email task is completed */}
                {task.lira_review_status === 'approved' &&
                task.execution_status === 'completed' &&
                task.execution_result &&
                task.task_type === 'follow_up_email' ? (
                  <button
                    onClick={() => setEmailModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    View Sent Email
                  </button>
                ) : task.lira_review_status === 'approved' &&
                  task.execution_status === 'running' ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Working on it…
                  </div>
                ) : (
                  task.lira_message &&
                  task.lira_review_status !== 'approved' && (
                    <p className="text-sm text-gray-700 mb-3">{task.lira_message}</p>
                  )
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
                  <button
                    onClick={() => {
                      setDescDraft(task.description)
                      setEditDescOpen(true)
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit Description
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
                      {(!assigneeDraft.trim() || 'lira'.includes(assigneeDraft.toLowerCase())) && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSaveAssignee('lira')
                          }}
                          className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm hover:bg-violet-50"
                        >
                          <img
                            src="/lira_black_with_white_backgound.png"
                            alt="Lira"
                            className="h-6 w-6 shrink-0 rounded-full object-contain border border-gray-200"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-violet-700">Lira</p>
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
                      <img
                        src="/lira_black_with_white_backgound.png"
                        alt="Lira"
                        className="h-5 w-5 rounded-full object-contain border border-gray-200"
                      />
                      Lira
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

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
              <div className="px-6 py-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Delete this task?</h3>
                <p className="mt-1.5 text-sm text-gray-500">
                  This action cannot be undone. The task will be permanently removed.
                </p>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Description edit modal */}
        {editDescOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Update Description</h3>
                <button
                  onClick={() => setEditDescOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-4">
                {task?.lira_needs && task.lira_needs.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-amber-700">
                      Add to your description:
                    </p>
                    <ul className="space-y-1">
                      {task.lira_needs.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  placeholder="Describe what Lira needs to do…"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => setEditDescOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDescription}
                  disabled={savingDesc || !descDraft.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {savingDesc && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {savingDesc ? 'Saving…' : 'Save & Ask Lira to Review'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Sent Email modal */}
        {emailModalOpen && task?.execution_result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <EnvelopeIcon className="h-4 w-4 text-emerald-600" />
                  Sent Email
                </h3>
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                {(() => {
                  const result = task.execution_result ?? ''
                  const subjectMatch = result.match(/^Subject:\s*(.+)$/m)
                  const subject = subjectMatch ? subjectMatch[1].trim() : null
                  const body =
                    subject && subjectMatch
                      ? result
                          .slice(result.indexOf(subjectMatch[0]) + subjectMatch[0].length)
                          .trim()
                      : result
                  return (
                    <div className="space-y-3">
                      {subject && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Subject</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900">{subject}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-500">Body</p>
                        <div className="mt-1 whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                          {body}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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

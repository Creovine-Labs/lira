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
  type OrgMembership,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
  type Meeting,
} from '@/services/api'
import { cn } from '@/lib'
import { PageLoader } from '@/components/ui/page-loader'

const STATUS_LABELS: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> =
  {
    pending: { label: 'Pending', icon: ClockIcon, color: 'text-amber-500' },
    in_progress: { label: 'In Progress', icon: PlayCircleIcon, color: 'text-blue-500' },
    completed: { label: 'Completed', icon: CheckCircleIcon, color: 'text-emerald-500' },
    cancelled: { label: 'Cancelled', icon: XCircleIcon, color: 'text-slate-500' },
  }

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
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

  function copyResult() {
    if (executionResult) {
      navigator.clipboard.writeText(executionResult)
      toast.success('Copied to clipboard')
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!task) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Task not found.</p>
        <button
          onClick={() => navigate('/org/tasks')}
          className="mt-4 text-sm text-violet-600 hover:underline"
        >
          Back to Tasks
        </button>
      </div>
    )
  }

  const statusCfg = STATUS_LABELS[task.status]
  const StatusIcon = statusCfg.icon

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
    <div className="space-y-6 pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/org/tasks')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Tasks
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn('flex items-center gap-1 text-xs font-medium', statusCfg.color)}>
              <StatusIcon className="h-3.5 w-3.5" />
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
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Description */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Description</h2>
        <p className="text-sm leading-relaxed text-foreground">{task.description}</p>

        {task.source_quote && (
          <div className="mt-4 rounded-lg border-l-4 border-violet-500 bg-violet-50/50 pl-4 py-3 dark:bg-violet-950/20">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              From meeting transcript:
            </p>
            <p className="text-sm italic text-foreground">"{task.source_quote}"</p>
          </div>
        )}
      </section>

      {/* Details */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Details</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {/* Assigned To — member autocomplete */}
          <div className="relative flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground">Assigned To</dt>
            {editAssignee ? (
              <dd className="relative">
                <div className="flex items-center gap-1">
                  <input
                    className="h-7 flex-1 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={assigneeDraft}
                    onChange={(e) => setAssigneeDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveAssignee()
                      if (e.key === 'Escape') setEditAssignee(false)
                    }}
                    placeholder="MagnifyingGlassIcon members…"
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
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                {memberSuggestions.length > 0 && (
                  <div className="absolute left-0 top-8 z-20 w-full max-h-44 overflow-y-auto rounded-lg border bg-popover shadow-md">
                    {memberSuggestions.map((m) => (
                      <button
                        key={m.user_id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSaveAssignee(m.name ?? m.email ?? '')
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                          {(m.name ?? m.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {m.name ?? m.email}
                          </p>
                          {m.name && m.email && (
                            <p className="truncate text-xs text-muted-foreground">{m.email}</p>
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
                {assignedMember ? (
                  <Link
                    to={`/org/members/${assignedMember.user_id}`}
                    className="flex items-center gap-1 text-sm text-violet-600 hover:underline"
                  >
                    <UserIcon className="h-3.5 w-3.5 shrink-0" />
                    {task.assigned_to}
                  </Link>
                ) : (
                  <span className="text-sm text-foreground">
                    {task.assigned_to || 'Unassigned'}
                  </span>
                )}
                <button
                  onClick={() => {
                    setAssigneeDraft(task.assigned_to ?? '')
                    setEditAssignee(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              </dd>
            )}
          </div>

          {/* Due Date — inline edit */}
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground">Due Date</dt>
            {editDueDate ? (
              <dd className="flex items-center gap-1">
                <input
                  type="date"
                  className="h-7 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </dd>
            ) : (
              <dd className="flex items-center gap-1 group">
                <span className="text-sm text-foreground">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                </span>
                <button
                  onClick={() => {
                    setDueDateDraft(task.due_date ? task.due_date.split('T')[0] : '')
                    setEditDueDate(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
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
              <dt className="text-xs font-medium text-muted-foreground">Meeting</dt>
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
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Change Status</h2>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((s) => {
            const cfg = STATUS_LABELS[s]
            const Icon = cfg.icon
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={task.status === s}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition',
                  task.status === s
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400'
                    : 'hover:bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* AI Execution */}
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">AI Execution</h2>
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
                    {executionResult ? 'Re-execute' : 'Execute with AI'}
                  </>
                )}
              </button>
              {executing && (
                <p className="text-xs text-muted-foreground">
                  AI is generating — this may take a few seconds
                </p>
              )}
            </div>
          )}
        </div>

        {executionResult ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                AI Result
              </span>
              <button
                onClick={copyResult}
                className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-muted"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
                DocumentDuplicateIcon
              </button>
            </div>
            <div className="prose prose-sm max-w-none rounded-lg border bg-background p-4 dark:prose-invert">
              <ReactMarkdown>{executionResult}</ReactMarkdown>
            </div>
          </div>
        ) : task.execution_status === 'running' ? (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/20">
            <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
            <p className="text-sm text-blue-600 dark:text-blue-400">AI is processing this task…</p>
          </div>
        ) : task.execution_status === 'failed' ? (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/20">
            <XCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">Execution failed. Try again.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Run AI execution to generate a result for this task. Available for action items, drafts,
            emails, research, and summaries.
          </p>
        )}
      </section>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

export { TaskDetailPage as OrgTaskDetailPage }

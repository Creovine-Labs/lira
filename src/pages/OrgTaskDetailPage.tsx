import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  Trash2,
  XCircle,
  Zap,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

import { useOrgStore, useTaskStore } from '@/app/store'
import {
  getTask,
  updateTask,
  deleteTask,
  executeTask,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
} from '@/services/api'
import { cn } from '@/lib'

const STATUS_LABELS: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> =
  {
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-500' },
    in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
    completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-slate-500' },
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

  const [task, setTask] = useState<TaskRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadTask = useCallback(async () => {
    if (!currentOrgId || !taskId) return
    setLoading(true)
    try {
      const t = await getTask(currentOrgId, taskId)
      setTask(t)
      if (t.execution_status === 'completed' && t.execution_result) {
        setExecutionResult(t.execution_result)
      }
    } catch {
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, taskId])

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
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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
        <ArrowLeft className="h-4 w-4" />
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
          <Trash2 className="h-3.5 w-3.5" />
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
          <DetailItem label="Assigned To" value={task.assigned_to ?? 'Unassigned'} />
          <DetailItem
            label="Due Date"
            value={task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
          />
          <DetailItem label="Created" value={new Date(task.created_at).toLocaleString()} />
          <DetailItem label="Updated" value={new Date(task.updated_at).toLocaleString()} />
          {task.session_id && <DetailItem label="Meeting" value={task.session_id} />}
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
            <Zap className="h-5 w-5 text-violet-500" />
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
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
                <CheckCircle2 className="h-3.5 w-3.5" />
                AI Result
              </span>
              <button
                onClick={copyResult}
                className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-muted"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
            <div className="prose prose-sm max-w-none rounded-lg border bg-background p-4 dark:prose-invert">
              <ReactMarkdown>{executionResult}</ReactMarkdown>
            </div>
          </div>
        ) : task.execution_status === 'running' ? (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/20">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <p className="text-sm text-blue-600 dark:text-blue-400">AI is processing this task…</p>
          </div>
        ) : task.execution_status === 'failed' ? (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/20">
            <XCircle className="h-5 w-5 text-red-500" />
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

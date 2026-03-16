import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare,
  Loader2,
  Plus,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { useOrgStore, useTaskStore } from '@/app/store'
import {
  listTasks,
  createTask,
  updateTask,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
  type CreateTaskInput,
} from '@/services/api'
import { cn } from '@/lib'

const STATUS_TABS: { value: TaskStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: CheckSquare },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircle },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
]

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  medium: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400',
  high: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
  urgent: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400',
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  action_item: 'Action Item',
  draft_document: 'Draft Document',
  follow_up_email: 'Follow-up Email',
  research: 'Research',
  summary: 'Summary',
  decision: 'Decision',
}

function TasksPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { tasks, loading, statusFilter, setTasks, setLoading, setStatusFilter, addTask } =
    useTaskStore()

  const [showCreate, setShowCreate] = useState(false)

  const loadTasks = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const { tasks: taskList } = await listTasks(currentOrgId)
      setTasks(taskList)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, setTasks, setLoading])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const filteredTasks =
    statusFilter && statusFilter !== 'all' ? tasks.filter((t) => t.status === statusFilter) : tasks

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <CheckSquare className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500">
              Track action items extracted from meetings or created by you.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Create task form */}
        {showCreate && (
          <CreateTaskForm
            orgId={currentOrgId!}
            onCreated={(task) => {
              addTask(task)
              setShowCreate(false)
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {/* Status tabs */}
        <div className="overflow-x-auto pb-0.5">
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 min-w-max">
            {STATUS_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value === 'all' ? null : value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  (statusFilter ?? 'all') === value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className="ml-0.5 rounded-full bg-gray-100 px-1.5 text-[10px]">
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
            <div className="p-3 rounded-xl bg-gray-100 mb-3">
              <CheckSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No tasks yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Action items from meetings will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
                onClick={() => navigate(`/org/tasks/${task.task_id}`)}
                onStatusChange={async (status) => {
                  if (!currentOrgId) return
                  try {
                    await updateTask(currentOrgId, task.task_id, { status })
                    useTaskStore.getState().updateTask(task.task_id, { status })
                  } catch {
                    toast.error('Failed to update status')
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
  onStatusChange,
}: {
  task: TaskRecord
  onClick: () => void
  onStatusChange: (status: TaskStatus) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex cursor-pointer items-start gap-4 rounded-xl border bg-card px-5 py-4 transition hover:border-violet-500/30 hover:shadow-sm"
    >
      {/* Status checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onStatusChange(task.status === 'completed' ? 'pending' : 'completed')
        }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition',
          task.status === 'completed'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-border hover:border-violet-500'
        )}
      >
        {task.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
        >
          {task.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Priority */}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium',
              PRIORITY_COLORS[task.priority]
            )}
          >
            {task.priority}
          </span>

          {/* Type */}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
          </span>

          {/* Assigned */}
          {task.assigned_to && (
            <span className="text-[11px] text-muted-foreground">→ {task.assigned_to}</span>
          )}

          {/* AI execution badge */}
          {task.execution_status === 'completed' && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              <Zap className="h-2.5 w-2.5" />
              AI Result
            </span>
          )}
          {task.execution_status === 'running' && (
            <span className="flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Running
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span className="text-[11px] text-muted-foreground">
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Create Task Form ─────────────────────────────────────────────────────────

function CreateTaskForm({
  orgId,
  onCreated,
  onCancel,
}: {
  orgId: string
  onCreated: (task: TaskRecord) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [taskType, setTaskType] = useState<TaskType>('action_item')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return
    setCreating(true)
    try {
      const input: CreateTaskInput = {
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo.trim() || undefined,
        priority,
        task_type: taskType,
        due_date: dueDate || undefined,
      }
      const task = await createTask(orgId, input)
      toast.success('Task created')
      onCreated(task)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-base font-semibold text-foreground">Create Task</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-foreground">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Send Q4 report to stakeholders"
            maxLength={200}
          />
        </div>
        <div>
          <label
            htmlFor="task-description"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="task-description"
            className="input-field min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail…"
            maxLength={2000}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="task-assigned-to"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Assigned To
            </label>
            <input
              id="task-assigned-to"
              className="input-field"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Person name"
              maxLength={100}
            />
          </div>
          <div>
            <label
              htmlFor="task-due-date"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              className="input-field"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="task-priority"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Priority
            </label>
            <select
              id="task-priority"
              className="input-field"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label htmlFor="task-type" className="mb-1.5 block text-sm font-medium text-foreground">
              Type
            </label>
            <select
              id="task-type"
              className="input-field"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
            >
              <option value="action_item">Action Item</option>
              <option value="draft_document">Draft Document</option>
              <option value="follow_up_email">Follow-up Email</option>
              <option value="research">Research</option>
              <option value="summary">Summary</option>
              <option value="decision">Decision</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating || !title.trim() || !description.trim()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export { TasksPage }

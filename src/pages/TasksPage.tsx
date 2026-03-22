import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  PlayCircleIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useTaskStore } from '@/app/store'
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
  type CreateTaskInput,
} from '@/services/api'
import { cn } from '@/lib'

const STATUS_TABS: { value: TaskStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: ClipboardDocumentCheckIcon },
  { value: 'pending', label: 'Pending', icon: ClockIcon },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircleIcon },
  { value: 'completed', label: 'Completed', icon: CheckCircleIcon },
  { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon },
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
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-300/60" />
          <div className="h-5 w-64 animate-pulse rounded-lg bg-gray-300/40" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
          <div className="h-12 animate-pulse rounded-2xl bg-gray-300/40" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Workspace
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Tasks</h1>
            <p className="mt-1 text-sm text-gray-400">
              Track action items from meetings and beyond.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1a1a1a]"
          >
            <PlusIcon className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Stat strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'All Tasks', count: counts.all },
            { label: 'Pending', count: counts.pending },
            { label: 'In Progress', count: counts.in_progress },
            { label: 'Completed', count: counts.completed },
          ].map(({ label, count }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#141414] to-[#0a0a0a] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/[0.06]" />
              <div className="relative">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Create task form */}
        {showCreate && (
          <div className="mb-5">
            <CreateTaskForm
              orgId={currentOrgId!}
              onCreated={(task) => {
                addTask(task)
                setShowCreate(false)
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {/* Status tabs */}
        <div className="mb-4 overflow-x-auto pb-0.5">
          <div className="flex gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm min-w-max">
            {STATUS_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value === 'all' ? null : value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                  (statusFilter ?? 'all') === value
                    ? 'bg-[#0f0f0f] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 text-[10px]',
                    (statusFilter ?? 'all') === value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16 text-center shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No tasks yet</p>
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
                onDelete={async () => {
                  if (!currentOrgId) return
                  try {
                    await deleteTask(currentOrgId, task.task_id)
                    useTaskStore.getState().removeTask(task.task_id)
                    toast.success('Task deleted')
                  } catch {
                    toast.error('Failed to delete task')
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
  onDelete,
}: {
  task: TaskRecord
  onClick: () => void
  onStatusChange: (status: TaskStatus) => void
  onDelete: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group/card flex cursor-pointer items-start gap-4 rounded-2xl border border-white/60 bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:border-[#3730a3]/20"
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
            : 'border-gray-300 hover:border-[#3730a3]'
        )}
      >
        {task.status === 'completed' && <CheckCircleIcon className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-semibold',
            task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{task.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              PRIORITY_COLORS[task.priority]
            )}
          >
            {task.priority}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
          </span>
          {task.assigned_to && (
            <span className="text-[11px] text-gray-400">→ {task.assigned_to}</span>
          )}
          {task.execution_status === 'completed' && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <BoltIcon className="h-2.5 w-2.5" />
              AI Result
            </span>
          )}
          {task.execution_status === 'running' && (
            <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
              <ArrowPathIcon className="h-2.5 w-2.5 animate-spin" />
              Running
            </span>
          )}
          {task.due_date && (
            <span className="text-[11px] text-gray-400">
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="mt-0.5 shrink-0 rounded-xl p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover/card:opacity-100"
        title="Delete task"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
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
    <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-gray-900">Create Task</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Send Q4 report to stakeholders"
            maxLength={200}
          />
        </div>
        <div>
          <label
            htmlFor="task-description"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="task-description"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20 min-h-[80px] resize-y"
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
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Assigned To
            </label>
            <input
              id="task-assigned-to"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Person name"
              maxLength={100}
            />
          </div>
          <div>
            <label
              htmlFor="task-due-date"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="task-priority"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Priority
            </label>
            <select
              id="task-priority"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20"
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
            <label htmlFor="task-type" className="mb-1.5 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="task-type"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20"
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
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating || !title.trim() || !description.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#3730a3] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:opacity-50"
          >
            {creating && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export { TasksPage }

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BoltIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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
  listMeetings,
  listOrgMembers,
  createTask,
  updateTask,
  deleteTask,
  type TaskRecord,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
  type CreateTaskInput,
  type OrgMembership,
} from '@/services/api'
import { cn } from '@/lib'

const STATUS_TABS: { value: TaskStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: ClipboardDocumentCheckIcon },
  { value: 'pending', label: 'Pending', icon: ClockIcon },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircleIcon },
  { value: 'completed', label: 'Completed', icon: CheckCircleIcon },
  { value: 'cancelled', label: 'Cancelled', icon: XCircleIcon },
]

// Status colors: red = pending, yellow = in_progress, green = completed
const STATUS_COLORS: Record<TaskStatus, { dot: string; badge: string; text: string }> = {
  pending: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-600 border border-red-200',
    text: 'text-red-600',
  },
  in_progress: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    text: 'text-amber-700',
  },
  completed: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    text: 'text-emerald-600',
  },
  cancelled: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-500 border border-slate-200',
    text: 'text-slate-500',
  },
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  medium: 'text-[#3730a3] bg-[#3730a3]/10',
  high: 'text-red-600 bg-red-100',
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
  const [pendingDeleteTask, setPendingDeleteTask] = useState<TaskRecord | null>(null)
  const [deletingTask, setDeletingTask] = useState(false)
  const [meetingTitles, setMeetingTitles] = useState<Record<string, string>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const loadTasks = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const [{ tasks: taskList }, meetings] = await Promise.all([
        listTasks(currentOrgId),
        listMeetings(currentOrgId).catch(() => []),
      ])
      setTasks(taskList)
      // Build session_id → title map
      const titles: Record<string, string> = {}
      for (const m of meetings) {
        titles[m.session_id] = m.title || `Meeting ${m.session_id.slice(0, 8)}`
      }
      setMeetingTitles(titles)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, setTasks, setLoading])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const filteredTasks = (
    statusFilter && statusFilter !== 'all'
      ? tasks.filter((t) => t.status === statusFilter)
      : [...tasks]
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Group tasks by meeting (session_id). Manual tasks go under 'manual'.
  const taskGroups = useMemo(() => {
    const groups: { key: string; title: string; date: string; tasks: TaskRecord[] }[] = []
    const groupMap = new Map<string, TaskRecord[]>()

    for (const task of filteredTasks) {
      const key = task.session_id || 'manual'
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(task)
    }

    // Sort groups: most recent first (by first task's created_at)
    const entries = [...groupMap.entries()].sort((a, b) => {
      const aTime = new Date(a[1][0].created_at).getTime()
      const bTime = new Date(b[1][0].created_at).getTime()
      return bTime - aTime
    })

    for (const [key, groupTasks] of entries) {
      const firstTask = groupTasks[0]
      const title =
        key === 'manual' ? 'Manually Created' : meetingTitles[key] || `Meeting ${key.slice(0, 8)}`
      const date = new Date(firstTask.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      groups.push({ key, title, date, tasks: groupTasks })
    }

    return groups
  }, [filteredTasks, meetingTitles])

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
          <div className="flex items-center gap-2">
            <a
              href="https://docs.liraintelligence.com/getting-started/navigation#tasks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            >
              <BookOpenIcon className="h-3.5 w-3.5" />
              Docs
            </a>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
            >
              <PlusIcon className="h-4 w-4" />
              New Task
            </button>
          </div>
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
            {STATUS_TABS.map(({ value, label, icon: Icon }) => {
              const isActive = (statusFilter ?? 'all') === value
              const statusColor = value !== 'all' ? STATUS_COLORS[value as TaskStatus] : null
              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value === 'all' ? null : value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                    isActive
                      ? 'bg-[#0f0f0f] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {statusColor && !isActive ? (
                    <span className={cn('h-2 w-2 rounded-full', statusColor.dot)} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  {label}
                  <span
                    className={cn(
                      'ml-0.5 rounded-full px-1.5 text-[10px]',
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {counts[value]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Task list grouped by meeting */}
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
          <div className="space-y-4">
            {taskGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key)
              return (
                <div key={group.key}>
                  {/* Meeting group header — clickable to collapse */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="mb-2 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/60"
                  >
                    {isCollapsed ? (
                      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    )}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {group.title}
                    </h3>
                    <span className="text-[10px] text-gray-300">{group.date}</span>
                    <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      {group.tasks.length}
                    </span>
                    {isCollapsed && <span className="ml-auto text-[10px] text-gray-300">Show</span>}
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
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
                          onDelete={() => setPendingDeleteTask(task)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="px-6 py-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <TrashIcon className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Delete this task?</h3>
              <p className="mt-1.5 text-sm text-gray-500">
                "<span className="font-medium text-gray-700">{pendingDeleteTask.title}</span>" will
                be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setPendingDeleteTask(null)}
                disabled={deletingTask}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!currentOrgId) return
                  setDeletingTask(true)
                  try {
                    await deleteTask(currentOrgId, pendingDeleteTask.task_id)
                    useTaskStore.getState().removeTask(pendingDeleteTask.task_id)
                    toast.success('Task deleted')
                    setPendingDeleteTask(null)
                  } catch {
                    toast.error('Failed to delete task')
                  } finally {
                    setDeletingTask(false)
                  }
                }}
                disabled={deletingTask}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingTask && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                )}
                {deletingTask ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
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
      {/* Status dot */}
      <div className="mt-1.5 flex shrink-0 flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStatusChange(task.status === 'completed' ? 'pending' : 'completed')
          }}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition',
            task.status === 'completed'
              ? 'border-[#3730a3] bg-[#3730a3] text-white'
              : task.status === 'in_progress'
                ? 'border-[#3730a3] hover:border-[#3730a3]'
                : 'border-[#3730a3]/40 hover:border-[#3730a3]'
          )}
        >
          {task.status === 'completed' && <CheckCircleIcon className="h-3 w-3" />}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              'text-sm font-semibold',
              task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
            )}
          >
            {task.title}
          </p>
          {/* Colored status badge */}
          <span
            className={cn(
              'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              STATUS_COLORS[task.status].badge
            )}
          >
            <span
              className={cn(
                'mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle',
                STATUS_COLORS[task.status].dot
              )}
            />
            {task.status === 'pending'
              ? 'Pending'
              : task.status === 'in_progress'
                ? 'In Progress'
                : task.status === 'completed'
                  ? 'Completed'
                  : 'Cancelled'}
          </span>
        </div>
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
          {task.assigned_to && task.assigned_to === 'lira' ? (
            <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              Lira
            </span>
          ) : task.assigned_to ? (
            <span className="text-[11px] text-gray-400">→ {task.assigned_to}</span>
          ) : null}
          {task.lira_review_status === 'needs_info' && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              Lira needs info
            </span>
          )}
          {task.lira_review_status === 'approved' && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              Lira approved
            </span>
          )}
          {task.execution_status === 'completed' && (
            <span className="flex items-center gap-0.5 rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3730a3]">
              <BoltIcon className="h-2.5 w-2.5" />
              AI Result
            </span>
          )}
          {task.execution_status === 'running' && (
            <span className="flex items-center gap-0.5 rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3730a3]">
              <img
                src="/lira_black.png"
                alt="Loading"
                className="h-2.5 w-2.5 animate-spin opacity-50"
                style={{ animationDuration: '1.2s' }}
              />
              Running
            </span>
          )}
          {task.due_date && (
            <span className="text-[11px] text-gray-400">
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          {task.created_at && (
            <span className="text-[11px] text-gray-400">
              {new Date(task.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}{' '}
              {new Date(task.created_at).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
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
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [orgMembers, setOrgMembers] = useState<OrgMembership[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const assigneeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listOrgMembers(orgId)
      .then(setOrgMembers)
      .catch(() => {})
  }, [orgId])

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const memberSuggestions = orgMembers.filter((m) => {
    if (!assignedTo.trim()) return true
    const q = assignedTo.toLowerCase()
    return (m.name ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q)
  })

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return
    setCreating(true)
    try {
      const input: CreateTaskInput = {
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo.trim() || undefined,
        priority,
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
            <div ref={assigneeRef} className="relative">
              <input
                id="task-assigned-to"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#3730a3] focus:bg-white focus:ring-2 focus:ring-[#3730a3]/20"
                value={assignedTo === 'lira' ? 'Lira' : assignedTo}
                onChange={(e) => {
                  const val = e.target.value
                  if (val !== 'Lira') setAssignedTo(val)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search members or assign to Lira…"
                maxLength={100}
                autoComplete="off"
              />
              {showSuggestions && (
                <div className="absolute left-0 top-full z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {/* Lira — always first */}
                  {(!assignedTo.trim() || 'lira'.includes(assignedTo.toLowerCase())) && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setAssignedTo('lira')
                        setShowSuggestions(false)
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
                        setAssignedTo(m.name ?? m.email ?? '')
                        setShowSuggestions(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                        {(m.name ?? m.email ?? '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
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
            </div>
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
            {creating && (
              <img
                src="/lira_black.png"
                alt="Loading"
                className="h-4 w-4 animate-spin opacity-50"
                style={{ animationDuration: '1.2s' }}
              />
            )}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export { TasksPage }

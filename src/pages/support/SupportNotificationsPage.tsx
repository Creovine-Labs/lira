import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BellIcon,
  ClipboardDocumentListIcon,
  MicrophoneIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useNotifStore, useOrgStore } from '@/app/store'
import { cn } from '@/lib'

function SupportNotificationsPage() {
  const navigate = useNavigate()
  const { id: selectedConvId } = useParams<{ id?: string }>()
  const { entries, removeNotif } = useNotifStore()
  const { organizations } = useOrgStore()

  // Sort newest first
  const sorted = useMemo(() => [...entries].sort((a, b) => b.createdAt - a.createdAt), [entries])

  // If there's a selectedConvId, find matching entry
  const selected = useMemo(
    () => (selectedConvId ? sorted.find((e) => e.link.includes(selectedConvId)) : null),
    [selectedConvId, sorted]
  )

  useEffect(() => {
    useNotifStore.getState().markSupportSeen()
    useNotifStore.getState().markMeetingsSeen()
  }, [])

  const kindIcon: Record<string, React.ReactNode> = {
    task: <ClipboardDocumentListIcon className="h-4 w-4 shrink-0 text-violet-500" />,
    meeting_ended: <MicrophoneIcon className="h-4 w-4 shrink-0 text-emerald-500" />,
    interview: <BriefcaseIcon className="h-4 w-4 shrink-0 text-blue-500" />,
    support_escalation: <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-red-500" />,
  }

  const kindLabel: Record<string, string> = {
    task: 'Task',
    meeting_ended: 'Meeting',
    interview: 'Interview',
    support_escalation: 'Escalation',
  }

  return (
    <div className="flex min-h-full bg-[#ebebeb]">
      <div className="mx-auto w-full max-w-3xl px-5 py-7">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <BellIcon className="h-5 w-5 text-gray-400" />
          <h1 className="text-lg font-extrabold text-gray-900">Notifications</h1>
          {sorted.length > 0 && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
              {sorted.length}
            </span>
          )}
          {sorted.length > 0 && (
            <button
              onClick={() => useNotifStore.getState().clearAll()}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Empty state */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <BellIcon className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-300">
              Escalations, task assignments, and meeting alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((entry) => {
              const orgName = organizations.find((o) => o.org_id === entry.orgId)?.name

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border bg-white px-4 py-3 transition hover:shadow-sm',
                    selected?.id === entry.id
                      ? 'border-violet-300 ring-1 ring-violet-200'
                      : 'border-gray-100'
                  )}
                >
                  <button
                    onClick={() => {
                      // Escalation notifications → stay in notifications context
                      if (entry.kind === 'support_escalation') {
                        navigate(entry.link)
                      } else {
                        navigate(entry.link)
                      }
                    }}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div className="mt-0.5">{kindIcon[entry.kind] ?? kindIcon.task}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                          {kindLabel[entry.kind] ?? 'Notification'}
                        </span>
                        {orgName && <span className="text-[10px] text-gray-300">{orgName}</span>}
                        <span className="ml-auto text-[10px] text-gray-300">
                          {formatRelative(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900">{entry.title}</p>
                      {entry.subtitle && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">
                          {entry.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => removeNotif(entry.id)}
                    className="mt-1 shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:text-gray-500 group-hover:opacity-100"
                    aria-label="Dismiss"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export { SupportNotificationsPage }

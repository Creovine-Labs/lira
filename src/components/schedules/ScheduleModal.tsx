import { useEffect, useState } from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib'
import type {
  MeetingSchedule,
  CreateScheduleInput,
  RecurrenceType,
  ScheduleMeetingType,
} from '@/services/api'

// ── Constants ────────────────────────────────────────────────────────────────

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekly', label: 'Weekly' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const MEETING_TYPE_OPTIONS: { value: ScheduleMeetingType; label: string }[] = [
  { value: 'meeting', label: 'General' },
  { value: 'standup', label: 'Stand-up' },
  { value: 'one_on_one', label: '1:1' },
  { value: 'technical', label: 'Technical' },
  { value: 'brainstorming', label: 'Brainstorm' },
  { value: 'sales', label: 'Sales' },
]

function getCommonTimezones(): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (Intl as any).supportedValuesOf('timeZone') as string[]
  } catch {
    // Fallback for older engines
    return [
      'Africa/Lagos',
      'Africa/Nairobi',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/New_York',
      'America/Sao_Paulo',
      'Asia/Calcutta',
      'Asia/Dubai',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Australia/Sydney',
      'Europe/Berlin',
      'Europe/London',
      'Europe/Paris',
      'Pacific/Auckland',
      'UTC',
    ]
  }
}

const TIMEZONES = getCommonTimezones()

// ── Props ────────────────────────────────────────────────────────────────────

interface ScheduleModalProps {
  open: boolean
  onClose: () => void
  onSave: (input: CreateScheduleInput) => Promise<void>
  editing?: MeetingSchedule | null
}

// ── Component ────────────────────────────────────────────────────────────────

function ScheduleModal({ open, onClose, onSave, editing }: ScheduleModalProps) {
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const [name, setName] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [time, setTime] = useState('09:00')
  const [timezone, setTimezone] = useState(userTz)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekdays')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3]) // Mon, Wed
  const [meetingType, setMeetingType] = useState<ScheduleMeetingType>('meeting')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setMeetingUrl(editing.meeting_url)
      setTime(editing.time)
      setTimezone(editing.timezone)
      setRecurrenceType(editing.recurrence.type)
      setDaysOfWeek(editing.recurrence.days_of_week ?? [1, 3])
      setMeetingType(editing.meeting_type)
    } else {
      setName('')
      setMeetingUrl('')
      setTime('09:00')
      setTimezone(userTz)
      setRecurrenceType('weekdays')
      setDaysOfWeek([1, 3])
      setMeetingType('meeting')
    }
    setError(null)
  }, [editing, open, userTz])

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter a schedule name.')
      return
    }
    const trimmedUrl = meetingUrl.trim()
    if (!trimmedUrl || !trimmedUrl.includes('meet.google.com')) {
      setError('Please enter a valid Google Meet URL.')
      return
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError('Please enter a valid time (HH:MM).')
      return
    }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      setError('Select at least one day for weekly recurrence.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: trimmedName,
        meeting_url: trimmedUrl,
        meeting_type: meetingType,
        time,
        timezone,
        recurrence: {
          type: recurrenceType,
          ...(recurrenceType === 'weekly' ? { days_of_week: daysOfWeek } : {}),
        },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-white/60 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {editing ? 'Edit Schedule' : 'Create Recurring Schedule'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-700">
              The Google Meet link you enter will be used{' '}
              <span className="font-semibold">every time</span> Lira joins. If your meeting link
              changes, come back here and update it.
            </p>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="schedule-name"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Schedule Name
            </label>
            <input
              id="schedule-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Standup, Weekly Sync"
              maxLength={120}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#3730a3]/40 focus:bg-white focus:ring-2 focus:ring-[#3730a3]/10"
            />
          </div>

          {/* Meeting URL */}
          <div>
            <label
              htmlFor="schedule-meeting-url"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Google Meet Link
            </label>
            <input
              id="schedule-meeting-url"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#3730a3]/40 focus:bg-white focus:ring-2 focus:ring-[#3730a3]/10"
            />
          </div>

          {/* Time + Timezone row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="schedule-time"
                className="mb-1.5 block text-xs font-semibold text-gray-600"
              >
                Time
              </label>
              <input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#3730a3]/40 focus:bg-white focus:ring-2 focus:ring-[#3730a3]/10"
              />
            </div>
            <div>
              <label
                htmlFor="schedule-timezone"
                className="mb-1.5 block text-xs font-semibold text-gray-600"
              >
                Timezone
              </label>
              <select
                id="schedule-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#3730a3]/40 focus:bg-white focus:ring-2 focus:ring-[#3730a3]/10"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <p className="mb-2 block text-xs font-semibold text-gray-600">Recurrence</p>
            <div className="flex flex-wrap gap-2">
              {RECURRENCE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRecurrenceType(value)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                    recurrenceType === value
                      ? 'border-[#3730a3] bg-[#3730a3] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Day selector for weekly */}
            {recurrenceType === 'weekly' && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition',
                      daysOfWeek.includes(i)
                        ? 'bg-[#3730a3] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meeting type */}
          <div>
            <p className="mb-2 block text-xs font-semibold text-gray-600">Meeting Type</p>
            <div className="flex flex-wrap gap-2">
              {MEETING_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMeetingType(value)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                    meetingType === value
                      ? 'border-[#3730a3] bg-[#3730a3] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="relative rounded-xl bg-[#3730a3] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#312e81] disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <img
                  src="/lira_white.png"
                  alt=""
                  className="h-4 w-4 animate-spin"
                  style={{ animationDuration: '1.2s' }}
                />
                Saving…
              </span>
            ) : editing ? (
              'Update Schedule'
            ) : (
              'Create Schedule'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export { ScheduleModal }

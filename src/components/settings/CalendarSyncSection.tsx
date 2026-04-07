import { useState, useEffect, useCallback } from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib'
import { useOrgStore } from '@/app/store'
import {
  getCalendarSync,
  updateCalendarSync,
  getGoogleStatus,
  type CalendarSyncSettings,
} from '@/services/api'

// ── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'google_meet' as const, label: 'Google Meet', icon: '🟢' },
  { id: 'zoom' as const, label: 'Zoom', icon: '🔵' },
  { id: 'teams' as const, label: 'Microsoft Teams', icon: '🟣' },
]

// ── Component ────────────────────────────────────────────────────────────────

export function CalendarSyncSection() {
  const orgId = useOrgStore((s) => s.currentOrgId)

  const [settings, setSettings] = useState<CalendarSyncSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)

  // ── Fetch settings ─────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const [syncRes, googleRes] = await Promise.all([
        getCalendarSync(orgId),
        getGoogleStatus(orgId).catch(() => null),
      ])
      setSettings(syncRes.calendar_sync)
      setGoogleConnected(googleRes?.connected ?? false)
    } catch (err) {
      setError('Failed to load calendar sync settings')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // ── Update handler ─────────────────────────────────────────────────────

  const handleUpdate = useCallback(
    async (updates: Partial<CalendarSyncSettings>) => {
      if (!orgId) return
      setSaving(true)
      setError(null)
      try {
        const res = await updateCalendarSync(orgId, updates)
        setSettings(res.calendar_sync)
      } catch (err) {
        setError('Failed to save settings')
      } finally {
        setSaving(false)
      }
    },
    [orgId]
  )

  // ── Toggle enabled ─────────────────────────────────────────────────────

  const handleToggleEnabled = useCallback(
    async (checked: boolean) => {
      await handleUpdate({ enabled: checked })
    },
    [handleUpdate]
  )

  // ── Toggle platform ────────────────────────────────────────────────────

  const handleTogglePlatform = useCallback(
    async (platformId: 'google_meet' | 'zoom' | 'teams') => {
      if (!settings) return
      const current = new Set(settings.platforms)
      if (current.has(platformId)) {
        current.delete(platformId)
      } else {
        current.add(platformId)
      }
      if (current.size === 0) return // At least one platform required
      await handleUpdate({ platforms: Array.from(current) })
    },
    [settings, handleUpdate]
  )

  // ── Update join window ─────────────────────────────────────────────────

  const handleJoinWindowChange = useCallback(
    async (value: number[]) => {
      await handleUpdate({ join_before_minutes: value[0] })
    },
    [handleUpdate]
  )

  // ── Render ─────────────────────────────────────────────────────────────

  if (!orgId) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Join or create an organization to configure calendar sync.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  const enabled = settings?.enabled ?? false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Calendar Auto-Join</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lira will automatically join your upcoming meetings from your connected calendar.
        </p>
      </div>

      {/* Status banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!googleConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          Connect your Google Calendar in the Organization tab to use auto-join.
        </div>
      )}

      {/* Main toggle */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Enable Calendar Auto-Join</p>
              <p className="text-xs text-muted-foreground">
                Lira will watch your calendar and join meetings automatically
              </p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggleEnabled} disabled={saving} />
        </div>

        {enabled && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Calendar sync is active — Lira is watching for upcoming meetings
          </div>
        )}
      </div>

      {/* Settings (only when enabled) */}
      {enabled && (
        <>
          {/* Join window */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Join Window</p>
                <p className="text-xs text-muted-foreground">
                  How many minutes before the meeting should Lira join?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Slider
                className="flex-1"
                min={0}
                max={10}
                step={1}
                value={[settings?.join_before_minutes ?? 1]}
                onValueCommit={handleJoinWindowChange}
                disabled={saving}
              />
              <span className="text-sm font-medium text-foreground w-16 text-right">
                {settings?.join_before_minutes ?? 1} min
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Set to 0 to join exactly at the meeting start time
            </p>
          </div>

          {/* Platforms */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <VideoCameraIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Meeting Platforms</p>
                <p className="text-xs text-muted-foreground">
                  Which meeting platforms should Lira auto-join?
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {PLATFORMS.map((platform) => {
                const active = settings?.platforms?.includes(platform.id) ?? false
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleTogglePlatform(platform.id)}
                    disabled={saving}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                      active
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-sm font-medium text-foreground">{platform.label}</span>
                    </div>
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 transition-colors',
                        active ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      )}
                    >
                      {active && (
                        <svg
                          className="h-full w-full text-white"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

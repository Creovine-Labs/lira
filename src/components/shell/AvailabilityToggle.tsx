// Operator availability presence indicator (Phase 4 §1.2).
//
// Lives in the AppShell topbar. Shows a small status dot + label and a
// dropdown to change. Three states per the API:
//   • available — actively pulling tickets, gets auto-assigned
//   • away      — soft pause; backend may still assign but de-prioritises
//   • offline   — hard pause; backend skips for auto-assign
//
// We seed from `listAgentAvailability` filtered to the current user, then
// PATCH `updateMyAvailability`. The whole component is conditional on the
// org being support-activated — we use `useSupportStore.config?.activated`
// as the gate so it doesn't appear in non-support workspaces.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  listAgentAvailability,
  updateMyAvailability,
  type AgentAvailability,
} from '@/services/api/support-api'
import { cn } from '@/lib'

const STATES: { value: AgentAvailability; label: string; dot: string; ring: string }[] = [
  { value: 'available', label: 'Available', dot: 'bg-emerald-500', ring: 'ring-emerald-500/30' },
  { value: 'away', label: 'Away', dot: 'bg-amber-500', ring: 'ring-amber-500/30' },
  { value: 'offline', label: 'Offline', dot: 'bg-gray-400', ring: 'ring-gray-400/30' },
]

export function AvailabilityToggle() {
  const { currentOrgId } = useOrgStore()
  const { userEmail, userId } = useAuthStore()
  const { config } = useSupportStore()
  const [current, setCurrent] = useState<AgentAvailability | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const supportActive = config?.activated === true
  const enabled = supportActive && currentOrgId !== null

  const load = useCallback(async () => {
    if (!enabled || !currentOrgId) return
    try {
      const agents = await listAgentAvailability(currentOrgId)
      // Match by user_id first, fall back to email — different backends
      // populate one or the other consistently.
      const me = agents.find(
        (a) =>
          (userId && a.user_id === userId) ||
          (userEmail && a.email?.toLowerCase() === userEmail.toLowerCase())
      )
      if (me) setCurrent(me.availability)
      else setCurrent('available') // first-time default
    } catch {
      // Endpoint may not be wired yet on every backend — silently degrade.
      setCurrent(null)
    }
  }, [enabled, currentOrgId, userId, userEmail])

  useEffect(() => {
    void load()
  }, [load])

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSet = useCallback(
    async (next: AgentAvailability) => {
      if (!currentOrgId || next === current) {
        setOpen(false)
        return
      }
      setLoading(true)
      // Optimistic flip; backend confirm replaces it.
      setCurrent(next)
      setOpen(false)
      try {
        const res = await updateMyAvailability(currentOrgId, next)
        setCurrent(res.availability)
      } catch {
        // Roll back via fresh fetch.
        void load()
      } finally {
        setLoading(false)
      }
    },
    [currentOrgId, current, load]
  )

  // Don't render at all if support isn't activated or we couldn't seed.
  if (!enabled || current === null) return null

  const active = STATES.find((s) => s.value === current) ?? STATES[0]

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        title={`You are ${active.label}. Click to change.`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900',
          loading && 'cursor-wait opacity-70'
        )}
      >
        <span
          className={cn('inline-block h-2 w-2 rounded-full ring-2', active.dot, active.ring)}
          aria-hidden
        />
        <span className="hidden sm:inline">{active.label}</span>
        <ChevronDownIcon className="h-3 w-3 text-gray-400" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <p className="border-b border-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Your availability
          </p>
          {STATES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => void handleSet(s.value)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition hover:bg-gray-50',
                current === s.value && 'bg-gray-50'
              )}
              role="menuitemradio"
              aria-checked={current === s.value}
            >
              <span className={cn('h-2 w-2 rounded-full ring-2', s.dot, s.ring)} aria-hidden />
              <span className="flex-1 text-gray-900">{s.label}</span>
              {current === s.value && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Small formatting helpers used across the customer portal.
//
// `date-fns` is already a project dep — but the portal only needs two
// inline formats (relative-from-now + short date), so a hand-rolled
// version keeps the bundle slim and the output predictable.

const UNITS: { ms: number; one: string; many: string }[] = [
  { ms: 60_000, one: 'minute', many: 'minutes' },
  { ms: 3_600_000, one: 'hour', many: 'hours' },
  { ms: 86_400_000, one: 'day', many: 'days' },
  { ms: 604_800_000, one: 'week', many: 'weeks' },
]

/**
 * "23 minutes ago" / "in 1 hour" / "just now". Days < 14 stay relative;
 * older falls back to a short date so the customer always has an absolute
 * anchor for old threads.
 */
export function relativeTime(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = nowMs - t
  const abs = Math.abs(diff)
  if (abs < 45_000) return 'just now'
  if (abs > 14 * 86_400_000) return shortDate(iso)

  let unitIdx = 0
  while (unitIdx < UNITS.length - 1 && abs >= UNITS[unitIdx + 1].ms) unitIdx++
  const u = UNITS[unitIdx]
  const n = Math.round(abs / u.ms)
  const word = n === 1 ? u.one : u.many
  return diff >= 0 ? `${n} ${word} ago` : `in ${n} ${word}`
}

/** "May 27" or "May 27, 2025" if past year. */
export function shortDate(iso: string, nowMs: number = Date.now()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sameYear = d.getFullYear() === new Date(nowMs).getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** "May 27, 2026 · 3:14 PM" — used for full message timestamps on hover. */
export function fullDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

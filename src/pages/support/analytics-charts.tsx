// Minimal SVG chart primitives for the analytics surface.
//
// Hand-rolled (no recharts/victory) because the chart needs here are simple
// and the bundle weight matters. Each primitive is responsive (uses
// viewBox + width=100%) and self-contained.

import { type ReactNode } from 'react'

// ── Big number row tile ─────────────────────────────────────────────────

interface MetricTileProps {
  label: string
  value: ReactNode
  tooltip?: string
  tone?: 'default' | 'warning' | 'danger'
  delta?: ReactNode
}

const TONE_RING: Record<NonNullable<MetricTileProps['tone']>, string> = {
  default: 'ring-gray-200',
  warning: 'ring-amber-300/60',
  danger: 'ring-rose-300/60',
}

export function MetricTile({ label, value, tooltip, tone = 'default', delta }: MetricTileProps) {
  return (
    <div
      title={tooltip}
      className={`rounded-2xl border border-white/60 bg-white p-4 shadow-sm ring-1 ring-inset ${TONE_RING[tone]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      {delta && <p className="mt-0.5 text-[11px] text-gray-500">{delta}</p>}
    </div>
  )
}

// ── Horizontal bar chart (one bar per row, label + value + bar) ─────────

export interface BarDatum {
  label: string
  value: number
  colorClass?: string
}

export function HorizontalBars({ data, max }: { data: BarDatum[]; max?: number }) {
  const effectiveMax = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = (d.value / effectiveMax) * 100
        return (
          <div key={d.label} className="flex items-center gap-3 text-[12px]">
            <span className="w-24 shrink-0 truncate text-gray-600" title={d.label}>
              {d.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
              <div
                className={`absolute inset-y-0 left-0 ${d.colorClass ?? 'bg-[#020308]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-[11px] text-gray-700">
              {d.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Donut chart (single ring of proportional slices) ────────────────────

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export function Donut({ slices, total: totalProp }: { slices: DonutSlice[]; total?: number }) {
  const total = totalProp ?? slices.reduce((s, x) => s + x.value, 0)
  if (total === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-md bg-gray-50 text-[11px] text-gray-400">
        No data
      </div>
    )
  }
  const radius = 56
  const stroke = 16
  const circumference = 2 * Math.PI * radius

  // Pre-compute the cumulative dashoffset for each slice so the render
  // stays pure (react-hooks/immutability flags mid-render reassignment).
  const drawn = slices.reduce<{
    acc: number
    out: { slice: DonutSlice; dash: number; offset: number }[]
  }>(
    (carry, s) => {
      const dash = (s.value / total) * circumference
      carry.out.push({ slice: s, dash, offset: carry.acc })
      carry.acc += dash
      return carry
    },
    { acc: 0, out: [] }
  ).out

  return (
    <div className="flex items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Distribution">
        <g transform="translate(70, 70) rotate(-90)">
          <circle r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          {drawn.map(({ slice, dash, offset }) => (
            <circle
              key={slice.label}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-offset}
            />
          ))}
        </g>
        <text
          x="70"
          y="74"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill="#020308"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {total}
        </text>
      </svg>
      <ul className="space-y-1 text-[12px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-gray-700">{s.label}</span>
            <span className="ml-2 font-mono text-[11px] text-gray-400">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Sparkline-style large stat with hint ────────────────────────────────
//
// The §5.1 response only returns the current snapshot — no historical
// series — so we render a "stat with context" rather than a true sparkline.
// When backend ships history, swap this for an SVG polyline.

interface StatCardProps {
  label: string
  value: string
  hint: string
  tooltip?: string
  tone?: 'default' | 'good' | 'warning' | 'danger'
}

const STAT_TONE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-[#020308]',
  good: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
}

export function StatCard({ label, value, hint, tooltip, tone = 'default' }: StatCardProps) {
  return (
    <div title={tooltip} className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${STAT_TONE[tone]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
    </div>
  )
}

// ── Hit-rate gauge (semicircular) ───────────────────────────────────────

export function HitGauge({ value, label }: { value: number; label: string }) {
  // Clamp to [0, 100]
  const clamped = Math.max(0, Math.min(100, value))
  const radius = 60
  const circumference = Math.PI * radius
  const dash = (clamped / 100) * circumference
  const color = clamped >= 90 ? '#10b981' : clamped >= 75 ? '#f59e0b' : '#e11d48'

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100" role="img" aria-label={label}>
        <g transform="translate(80, 80) rotate(-180)">
          <path
            d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </g>
        <text
          x="80"
          y="72"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#020308"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {clamped.toFixed(1)}%
        </text>
      </svg>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  )
}

// Recharts-based chart primitives for the analytics surface.
//
// All charts are responsive (ResponsiveContainer) and share one palette so
// the page reads as a single system rather than a scatter of boxes.

import { type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Shared, colour-blind-friendly palette.
export const PALETTE = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#84cc16',
  '#f97316',
  '#14b8a6',
  '#ef4444',
]

export type ChartType = 'bar' | 'pie'

export interface ChartDatum {
  name: string
  value: number
  color?: string
}

// ── Compact KPI tile (small backlog counts) ──────────────────────────────

interface KpiTileProps {
  label: string
  value: ReactNode
  tone?: 'default' | 'warning' | 'danger' | 'good'
}

const KPI_TONE: Record<NonNullable<KpiTileProps['tone']>, string> = {
  default: 'text-gray-900',
  good: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
}

export function KpiTile({ label, value, tone = 'default' }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${KPI_TONE[tone]}`}>{value}</p>
    </div>
  )
}

// ── Radial rate gauge (single percentage) ─────────────────────────────────

export function RateGauge({
  value,
  label,
  display,
  caption,
  color = '#020308',
}: {
  value: number // 0..100
  label: string
  display: string // centre text, already formatted
  caption?: string
  color?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  const data = [{ name: label, value: v }]
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#f1f1ef' }}
              dataKey="value"
              cornerRadius={20}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-bold text-gray-900">{display}</span>
        </div>
      </div>
      <p className="mt-1 text-center text-[12px] font-semibold text-gray-700">{label}</p>
      {caption && <p className="mt-0.5 text-center text-[11px] text-gray-400">{caption}</p>}
    </div>
  )
}

// ── Switchable distribution chart (bar or pie) ────────────────────────────

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: ChartDatum }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0]
  const name = p.payload?.name ?? p.name
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] shadow-md">
      <span className="font-semibold text-gray-700">{name}</span>
      <span className="ml-2 font-mono text-gray-900">{p.value}</span>
    </div>
  )
}

export function DistributionChart({
  data,
  type,
  height = 240,
}: {
  data: ChartDatum[]
  type: ChartType
  height?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-50 text-[12px] text-gray-400"
        style={{ height }}
      >
        Nothing to chart yet
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(val) => <span className="text-[12px] text-gray-600">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(2,3,8,0.04)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={d.color ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Grouped horizontal bar chart (multi-series, e.g. categories/agents) ────

export interface SeriesDef {
  key: string
  label: string
  color: string
}

export function GroupedBars({
  data,
  series,
  height = 320,
}: {
  data: Array<Record<string, string | number>>
  series: SeriesDef[]
  height?: number
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-50 text-[12px] text-gray-400"
        style={{ height: 160 }}
      >
        Nothing to chart yet
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: 'rgba(2,3,8,0.04)' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val) => <span className="text-[12px] text-gray-600">{val}</span>}
        />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[0, 4, 4, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

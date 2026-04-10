// ── Support Analytics — Shared Components ─────────────────────────────────────

import React from 'react'

// ── Design tokens ─────────────────────────────────────────────────────────────

export const BG = '#E8EAF0'

export const NEU_SHADOW =
  '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'

export const NEU_INSET =
  'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  badge?: string
  badgeBg?: string
  badgeColor?: string
  sub?: string
  subColor?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  badge,
  badgeBg,
  badgeColor,
  sub,
  subColor,
  trend,
  trendValue,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <span
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#585A68',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 36,
              lineHeight: '40px',
              color: '#2E3040',
            }}
          >
            {value}
          </span>
          {trend && trendValue && (
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color:
                  trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280',
              }}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
        {badge && (
          <span
            style={{
              background: badgeBg,
              color: badgeColor,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '4px 8px',
              borderRadius: 16,
            }}
          >
            {badge}
          </span>
        )}
        {sub && !badge && (
          <span
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700,
              fontSize: 12,
              color: subColor ?? '#2E3040',
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Line Chart ────────────────────────────────────────────────────────────────

interface LineChartProps {
  data: Array<{ date: string; value: number }>
  color?: string
  height?: number
  showGrid?: boolean
  showPoints?: boolean
}

export function LineChart({
  data,
  color = '#6366F1',
  height = 200,
  showGrid = true,
  showPoints = false,
}: LineChartProps) {
  if (!data.length) return null

  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  const width = 800
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((d.value - min) / range) * chartHeight
    return { x, y, value: d.value }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return (
    <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: 20 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + chartHeight - ratio * chartHeight
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(0,0,0,0.05)"
                strokeWidth={1}
              />
            )
          })}

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />

        {/* Points */}
        {showPoints &&
          points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
          ))}

        {/* Y-axis labels */}
        {[max, Math.round(min + range * 0.5), min].map((val, i) => {
          const y = padding + (i * chartHeight) / 2
          return (
            <text
              key={i}
              x={padding - 10}
              y={y}
              textAnchor="end"
              fontSize={10}
              fill="#585A68"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight={600}
            >
              {Math.round(val)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: Array<{ label: string; value: number }>
  color?: string
  height?: number
  horizontal?: boolean
}

export function BarChart({
  data,
  color = '#6366F1',
  height = 300,
  horizontal = false,
}: BarChartProps) {
  if (!data.length) return null

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 16,
        padding: 20,
        height,
        display: 'flex',
        flexDirection: horizontal ? 'column' : 'row',
        alignItems: horizontal ? 'stretch' : 'flex-end',
        gap: horizontal ? 8 : 4,
        justifyContent: 'space-between',
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: horizontal ? 'row' : 'column',
            alignItems: horizontal ? 'center' : 'center',
            gap: 8,
            flex: horizontal ? 'none' : 1,
            width: horizontal ? '100%' : undefined,
          }}
        >
          {horizontal && (
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: '#585A68',
                minWidth: 120,
                textAlign: 'right',
              }}
            >
              {d.label}
            </span>
          )}
          <div
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              borderRadius: 8,
              width: horizontal ? `${(d.value / max) * 100}%` : '100%',
              height: horizontal ? 24 : `${(d.value / max) * 100}%`,
              minHeight: horizontal ? 24 : 4,
              minWidth: horizontal ? 4 : undefined,
              transition: 'all 0.3s ease',
              boxShadow: NEU_INSET,
            }}
          />
          {!horizontal && (
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 10,
                fontWeight: 600,
                color: '#585A68',
                textAlign: 'center',
                marginTop: 4,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {d.label}
            </span>
          )}
          {horizontal && (
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                color: '#2E3040',
                minWidth: 40,
              }}
            >
              {d.value}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerValue?: string
  showLegend?: boolean
}

export function DonutChart({
  segments,
  size = 128,
  strokeWidth = 14,
  centerLabel,
  centerValue,
  showLegend = true,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  let currentOffset = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((segment, i) => {
            const segmentLength = (segment.value / total) * circumference
            const offset = currentOffset
            currentOffset += segmentLength
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
          })}
        </svg>
        {/* Center content */}
        {(centerLabel || centerValue) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {centerValue && (
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 800,
                  fontSize: size / 6,
                  lineHeight: 1.2,
                  color: '#2E3040',
                }}
              >
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: size / 16,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#585A68',
                }}
              >
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      {/* Legend */}
      {showLegend && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {segments.map((segment, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: segment.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 10,
                    color: '#2E3040',
                  }}
                >
                  {segment.label}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: 10,
                  color: '#2E3040',
                }}
              >
                {total > 0 ? Math.round((segment.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string
  value: number
  max: number
  color?: string
  showPercentage?: boolean
}

export function ProgressBar({
  label,
  value,
  max,
  color = '#6366F1',
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 600,
            fontSize: 12,
            color: '#2E3040',
          }}
        >
          {label}
        </span>
        {showPercentage && (
          <span
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              color: '#585A68',
            }}
          >
            {percentage}%
          </span>
        )}
      </div>
      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 9999,
          background: BG,
          boxShadow: NEU_INSET,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            borderRadius: 9999,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
        marginBottom: 16,
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '-0.02em',
            color: '#2E3040',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 500,
              fontSize: 13,
              color: '#585A68',
              margin: '4px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Card Container ────────────────────────────────────────────────────────────

interface CardProps {
  title?: string
  children: React.ReactNode
  padding?: number
  noPadding?: boolean
}

export function Card({ title, children, padding = 24, noPadding = false }: CardProps) {
  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {title && (
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <h3
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#2E3040',
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : padding }}>{children}</div>
    </div>
  )
}

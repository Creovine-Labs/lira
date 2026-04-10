/**
 * Screen 18 — Customer Profiles: Customer List
 * Browse all customers Lira has interacted with.
 * Layout: left filter panel + main table view.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG         = '#E8EAF0'
const NEU_SHADOW = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET  = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const PRIMARY    = '#6366F1'
const DARK       = '#2E3040'
const MUTED      = '#585A68'
const WHITE      = '#FFFFFF'
const FONT       = 'Plus Jakarta Sans, sans-serif'
const GREEN      = '#059669'
const AMBER      = '#D97706'
const RED        = '#DC2626'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tier = 'Standard' | 'VIP' | 'Enterprise'
type ChurnBand = 'Low' | 'Medium' | 'High'
type SentimentTrend = 'improving' | 'stable' | 'declining'
type CRMType = 'HubSpot' | 'Salesforce' | 'None'

interface Customer {
  id: string
  name: string
  email: string
  tier: Tier
  churnScore: number
  totalInteractions: number
  escalations: number
  sentimentTrend: SentimentTrend
  lastContact: string
  crmType: CRMType
  crmSynced: boolean
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Jana Fischer', email: 'jana.fischer@acme.de', tier: 'VIP', churnScore: 12, totalInteractions: 14, escalations: 1, sentimentTrend: 'improving', lastContact: '2 min ago', crmType: 'HubSpot', crmSynced: true },
  { id: 'c2', name: 'Daniel Roy', email: 'd.roy@fintechco.com', tier: 'Standard', churnScore: 68, totalInteractions: 7, escalations: 3, sentimentTrend: 'declining', lastContact: '14 min ago', crmType: 'HubSpot', crmSynced: false },
  { id: 'c3', name: 'Amara Nwosu', email: 'amara.n@paynow.io', tier: 'Enterprise', churnScore: 8, totalInteractions: 29, escalations: 0, sentimentTrend: 'stable', lastContact: '1 hour ago', crmType: 'Salesforce', crmSynced: true },
  { id: 'c4', name: 'Luca Ferreira', email: 'luca@buildfast.co', tier: 'Standard', churnScore: 81, totalInteractions: 3, escalations: 2, sentimentTrend: 'declining', lastContact: '3 hours ago', crmType: 'None', crmSynced: false },
  { id: 'c5', name: 'Priya Mehta', email: 'priya.mehta@lendify.in', tier: 'VIP', churnScore: 22, totalInteractions: 18, escalations: 2, sentimentTrend: 'improving', lastContact: 'Yesterday', crmType: 'Salesforce', crmSynced: true },
  { id: 'c6', name: 'Tom Hartley', email: 'tom.h@cryptobase.io', tier: 'Standard', churnScore: 45, totalInteractions: 5, escalations: 1, sentimentTrend: 'stable', lastContact: 'Yesterday', crmType: 'HubSpot', crmSynced: true },
  { id: 'c7', name: 'Chioma Obi', email: 'chioma@paystack.ng', tier: 'Enterprise', churnScore: 19, totalInteractions: 41, escalations: 3, sentimentTrend: 'stable', lastContact: '2 days ago', crmType: 'Salesforce', crmSynced: true },
  { id: 'c8', name: 'Sven Larsson', email: 's.larsson@nordpay.se', tier: 'Standard', churnScore: 72, totalInteractions: 4, escalations: 2, sentimentTrend: 'declining', lastContact: '3 days ago', crmType: 'None', crmSynced: false },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<Tier, { color: string; bg: string }> = {
  Standard:   { color: '#4338CA', bg: '#E0E7FF' },
  VIP:        { color: '#92400E', bg: '#FEF3C7' },
  Enterprise: { color: '#065F46', bg: '#D1FAE5' },
}

function churnBand(score: number): ChurnBand {
  if (score < 30) return 'Low'
  if (score < 70) return 'Medium'
  return 'High'
}

const CHURN_COLOR: Record<ChurnBand, string> = { Low: GREEN, Medium: AMBER, High: RED }
const CHURN_BG:    Record<ChurnBand, string> = { Low: '#D1FAE5', Medium: '#FEF3C7', High: '#FEE2E2' }

function SentimentIcon({ trend }: { trend: SentimentTrend }) {
  if (trend === 'improving') return <ArrowUpIcon   style={{ width: 13, height: 13, color: GREEN }} />
  if (trend === 'declining') return <ArrowDownIcon style={{ width: 13, height: 13, color: RED }} />
  return <MinusIcon style={{ width: 13, height: 13, color: AMBER }} />
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#818CF8', '#6EE7B7', '#FCA5A5', '#FCD34D', '#93C5FD', '#C4B5FD', '#F9A8D4', '#6EE7B7']
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(1) % AVATAR_COLORS.length] }

// ── Filter pill ────────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT, fontWeight: active ? 700 : 500, fontSize: 12,
        color: active ? WHITE : DARK,
        background: active ? PRIMARY : BG,
        boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : NEU_SHADOW,
        border: 'none', borderRadius: 9999, padding: '6px 14px', cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────
function CustomerRow({ customer, selected, onSelect, onClick }: {
  customer: Customer; selected: boolean; onSelect: () => void; onClick: () => void
}) {
  const band = churnBand(customer.churnScore)
  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.45)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '14px 16px' }} onClick={e => { e.stopPropagation(); onSelect() }}>
        <input type="checkbox" checked={selected} onChange={onSelect} style={{ accentColor: PRIMARY, cursor: 'pointer' }} />
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9999,
            background: avatarColor(customer.id),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>{initials(customer.name)}</span>
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>{customer.name}</div>
            <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{customer.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <span style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 11,
          color: TIER_CONFIG[customer.tier].color, background: TIER_CONFIG[customer.tier].bg,
          borderRadius: 9999, padding: '3px 10px',
        }}>
          {customer.tier}
        </span>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 12,
            color: CHURN_COLOR[band], background: CHURN_BG[band],
            borderRadius: 9999, padding: '2px 8px',
          }}>
            {band}
          </span>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{customer.churnScore}</span>
        </div>
      </td>
      <td style={{ padding: '14px 12px', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK, textAlign: 'center' }}>
        {customer.totalInteractions}
      </td>
      <td style={{ padding: '14px 12px', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: customer.escalations > 0 ? RED : MUTED, textAlign: 'center' }}>
        {customer.escalations}
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <SentimentIcon trend={customer.sentimentTrend} />
          <span style={{
            fontFamily: FONT, fontWeight: 500, fontSize: 11,
            color: customer.sentimentTrend === 'improving' ? GREEN : customer.sentimentTrend === 'declining' ? RED : AMBER,
          }}>
            {customer.sentimentTrend.charAt(0).toUpperCase() + customer.sentimentTrend.slice(1)}
          </span>
        </div>
      </td>
      <td style={{ padding: '14px 12px', fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>
        {customer.lastContact}
      </td>
      <td style={{ padding: '14px 12px' }}>
        {customer.crmType === 'None' ? (
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>—</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {customer.crmSynced
              ? <CheckCircleIcon style={{ width: 13, height: 13, color: GREEN }} />
              : <ExclamationTriangleIcon style={{ width: 13, height: 13, color: AMBER }} />
            }
            <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: customer.crmSynced ? GREEN : AMBER }}>
              {customer.crmType}
            </span>
          </div>
        )}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 11, color: PRIMARY,
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          View →
        </span>
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportCustomerListPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('All')
  const [churnFilter, setChurnFilter] = useState<string>('All')
  const [sentimentFilter, setSentimentFilter] = useState<string>('All')
  const [crmFilter, setCRMFilter] = useState<string>('All')
  const [sortKey, setSortKey] = useState<string>('Last contact')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(!isMobile)

  // Apply filters + search
  const filtered = CUSTOMERS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false
    if (tierFilter !== 'All' && c.tier !== tierFilter) return false
    if (churnFilter !== 'All' && churnBand(c.churnScore) !== churnFilter) return false
    if (sentimentFilter !== 'All' && c.sentimentTrend !== sentimentFilter.toLowerCase()) return false
    if (crmFilter !== 'All') {
      if (crmFilter === 'Not synced' && c.crmSynced) return false
      if (crmFilter === 'HubSpot' && c.crmType !== 'HubSpot') return false
      if (crmFilter === 'Salesforce' && c.crmType !== 'Salesforce') return false
    }
    return true
  }).sort((a, b) => {
    if (sortKey === 'Churn risk') return b.churnScore - a.churnScore
    if (sortKey === 'Escalation count') return b.escalations - a.escalations
    if (sortKey === 'Interaction count') return b.totalInteractions - a.totalInteractions
    return 0 // last contact — mocked order preserved
  })

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Page header */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px', flexShrink: 0,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UsersIcon style={{ width: 18, height: 18, color: PRIMARY }} />
          </div>
          <div>
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: DARK, margin: 0 }}>Customer Profiles</h1>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{CUSTOMERS.length} customers tracked by Lira</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FunnelIcon style={{ width: 18, height: 18, color: DARK }} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'row', gap: 0,
        minHeight: 0, overflow: isMobile ? 'visible' : 'hidden',
      }}>
        {/* Left filter panel */}
        {(showFilters || !isMobile) && (
          <div style={{
            width: isMobile ? '100%' : 240, flexShrink: 0,
            background: BG, padding: isMobile ? '16px' : '24px 20px',
            overflowY: 'auto', borderRight: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: 24,
          }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: BG, boxShadow: NEU_INSET, borderRadius: 14, padding: '10px 14px',
            }}>
              <MagnifyingGlassIcon style={{ width: 14, height: 14, color: MUTED, flexShrink: 0 }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name or email…"
                style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: DARK, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
              />
            </div>

            {/* Tier */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Tier</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['All', 'Standard', 'VIP', 'Enterprise'].map(t => (
                  <FilterPill key={t} label={t} active={tierFilter === t} onClick={() => setTierFilter(t)} />
                ))}
              </div>
            </div>

            {/* Churn risk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Churn Risk</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['All', 'Low', 'Medium', 'High'].map(t => (
                  <FilterPill key={t} label={t} active={churnFilter === t} onClick={() => setChurnFilter(t)} />
                ))}
              </div>
            </div>

            {/* Sentiment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Sentiment Trend</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['All', 'Improving', 'Stable', 'Declining'].map(t => (
                  <FilterPill key={t} label={t} active={sentimentFilter === t} onClick={() => setSentimentFilter(t)} />
                ))}
              </div>
            </div>

            {/* CRM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>CRM</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['All', 'HubSpot', 'Salesforce', 'Not synced'].map(t => (
                  <FilterPill key={t} label={t} active={crmFilter === t} onClick={() => setCRMFilter(t)} />
                ))}
              </div>
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Sort By</span>
              <div style={{ background: BG, boxShadow: NEU_INSET, borderRadius: 14, overflow: 'hidden' }}>
                {['Last contact', 'Churn risk', 'Escalation count', 'Interaction count'].map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSortKey(s)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      fontFamily: FONT, fontWeight: sortKey === s ? 700 : 400, fontSize: 12,
                      color: sortKey === s ? PRIMARY : DARK,
                      background: sortKey === s ? 'rgba(99,102,241,0.06)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowsUpDownIcon style={{ width: 11, height: 11 }} />
                      {s}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main table */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 24px',
              background: '#EEF2FF', borderBottom: '1px solid rgba(99,102,241,0.15)',
            }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: PRIMARY }}>
                {selected.size} selected
              </span>
              {['Export CSV', 'Flag for review', 'Merge duplicates'].map(action => (
                <button key={action} style={{
                  fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK,
                  background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 9999,
                  padding: '6px 14px', cursor: 'pointer',
                }}>
                  {action}
                </button>
              ))}
              <button onClick={() => setSelected(new Set())} style={{
                fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED,
                background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 'auto',
              }}>
                Clear
              </button>
            </div>
          )}

          {/* Table */}
          <div style={{ padding: isMobile ? '8px' : '16px 24px' }}>
            <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                    <th style={{ width: 40, padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set())
                          else setSelected(new Set(filtered.map(c => c.id)))
                        }}
                        style={{ accentColor: PRIMARY, cursor: 'pointer' }}
                      />
                    </th>
                    {['Customer', 'Tier', 'Churn Risk', 'Interactions', 'Escalations', 'Sentiment', 'Last Contact', 'CRM', ''].map(h => (
                      <th key={h} style={{
                        padding: '12px',
                        fontFamily: FONT, fontWeight: 700, fontSize: 10,
                        letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED,
                        textAlign: h === 'Interactions' || h === 'Escalations' ? 'center' : 'left',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 48, textAlign: 'center', fontFamily: FONT, fontWeight: 400, fontSize: 14, color: MUTED }}>
                        No customers match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map(c => (
                      <CustomerRow
                        key={c.id}
                        customer={c}
                        selected={selected.has(c.id)}
                        onSelect={() => toggleSelect(c.id)}
                        onClick={() => navigate(`/support/customers/${c.id}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

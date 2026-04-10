/**
 * Screen 29 — Knowledge Base: Document Library
 * View and manage all knowledge sources Lira uses to ground her replies.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PencilIcon,
  SparklesIcon as SparklesOutline,
  PlusIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EllipsisHorizontalIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG           = '#E8EAF0'
const NEU_SHADOW   = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET    = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const PRIMARY      = '#6366F1'
const DARK         = '#2E3040'
const MUTED        = '#585A68'
const WHITE        = '#FFFFFF'
const FONT         = 'Plus Jakarta Sans, sans-serif'
const AI_BG        = '#EEF2FF'
const AI_BORDER    = 'rgba(224,231,255,0.5)'
const GREEN        = '#059669'
const GREEN_BG     = 'rgba(209,250,229,0.8)'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const AMBER        = '#D97706'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
type SourceType = 'website' | 'file' | 'manual' | 'ai-drafted'
type DocStatus  = 'active' | 'archived'

interface KBDoc {
  id: string
  title: string
  source: SourceType
  dateAdded: string
  lastUpdated: string
  chunks: number
  status: DocStatus
  tags: string[]
}

const DOCS: KBDoc[] = [
  { id: 'd1',  title: 'Payment Processing Guide',               source: 'website',    dateAdded: 'Jan 12, 2026', lastUpdated: 'Apr 2, 2026',  chunks: 24, status: 'active',   tags: ['Billing', 'Technical'] },
  { id: 'd2',  title: 'KYC Verification Requirements',          source: 'file',       dateAdded: 'Jan 20, 2026', lastUpdated: 'Mar 15, 2026', chunks: 18, status: 'active',   tags: ['Compliance', 'Onboarding'] },
  { id: 'd3',  title: 'Refund & Dispute Policy',                source: 'manual',     dateAdded: 'Feb 3, 2026',  lastUpdated: 'Apr 1, 2026',  chunks: 11, status: 'active',   tags: ['Billing'] },
  { id: 'd4',  title: 'API Error Code Reference',               source: 'file',       dateAdded: 'Feb 14, 2026', lastUpdated: 'Mar 28, 2026', chunks: 47, status: 'active',   tags: ['Technical'] },
  { id: 'd5',  title: 'Onboarding Checklist for New Customers', source: 'manual',     dateAdded: 'Mar 1, 2026',  lastUpdated: 'Apr 5, 2026',  chunks: 9,  status: 'active',   tags: ['Onboarding'] },
  { id: 'd6',  title: 'Subscription Plans & Pricing FAQ',       source: 'website',    dateAdded: 'Mar 8, 2026',  lastUpdated: 'Apr 3, 2026',  chunks: 16, status: 'active',   tags: ['Billing', 'Product'] },
  { id: 'd7',  title: 'International Wire Transfer Limits',     source: 'ai-drafted', dateAdded: 'Apr 1, 2026',  lastUpdated: 'Apr 1, 2026',  chunks: 7,  status: 'active',   tags: ['Billing', 'Compliance'] },
  { id: 'd8',  title: 'Fraud Alert Handling Procedures',        source: 'file',       dateAdded: 'Mar 20, 2026', lastUpdated: 'Mar 20, 2026', chunks: 21, status: 'active',   tags: ['Compliance', 'Technical'] },
  { id: 'd9',  title: 'Legacy Pricing Tiers (2024)',            source: 'manual',     dateAdded: 'Jan 5, 2026',  lastUpdated: 'Jan 5, 2026',  chunks: 5,  status: 'archived', tags: ['Billing'] },
  { id: 'd10', title: 'Old KYC Flow (deprecated)',              source: 'file',       dateAdded: 'Dec 1, 2025',  lastUpdated: 'Dec 1, 2025',  chunks: 8,  status: 'archived', tags: ['Compliance'] },
]

const SOURCE_LABELS: Record<SourceType, string> = {
  'website': 'Website page',
  'file': 'Uploaded file',
  'manual': 'Manual entry',
  'ai-drafted': 'AI-drafted',
}

const ALL_TAGS = ['Billing', 'Compliance', 'Technical', 'Onboarding', 'Product', 'Other']

// ── Source icon ────────────────────────────────────────────────────────────────
function SourceIcon({ source, size = 16 }: { source: SourceType; size?: number }) {
  const style = { width: size, height: size }
  if (source === 'website')   return <GlobeAltIcon style={{ ...style, color: PRIMARY }} />
  if (source === 'file')      return <DocumentTextIcon style={{ ...style, color: AMBER }} />
  if (source === 'manual')    return <PencilIcon style={{ ...style, color: GREEN }} />
  return <SparklesIcon style={{ ...style, color: PRIMARY }} />
}

// ── Filter pill ────────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT, fontWeight: active ? 700 : 500, fontSize: 12,
        color: active ? WHITE : MUTED,
        background: active ? PRIMARY : 'transparent',
        border: `1.5px solid ${active ? PRIMARY : 'rgba(88,90,104,0.2)'}`,
        borderRadius: 9999, padding: '5px 12px', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ── Tag badge ──────────────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    'Billing':    { bg: AI_BG,      color: PRIMARY },
    'Compliance': { bg: RED_LIGHT,  color: RED },
    'Technical':  { bg: 'rgba(234,243,199,0.8)', color: '#65a30d' },
    'Onboarding': { bg: GREEN_BG,   color: GREEN },
    'Product':    { bg: 'rgba(237,233,254,0.8)', color: '#7c3aed' },
    'Other':      { bg: PROFILE_BG, color: MUTED },
  }
  const c = colors[tag] ?? { bg: PROFILE_BG, color: MUTED }
  return (
    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 10, color: c.color, background: c.bg, borderRadius: 6, padding: '2px 7px' }}>
      {tag}
    </span>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DocStatus }) {
  return (
    <span style={{
      fontFamily: FONT, fontWeight: 700, fontSize: 10,
      color: status === 'active' ? GREEN : MUTED,
      background: status === 'active' ? GREEN_BG : PROFILE_BG,
      borderRadius: 8, padding: '3px 8px',
    }}>
      {status === 'active' ? 'Active' : 'Archived'}
    </span>
  )
}

// ── Document card (grid view) ─────────────────────────────────────────────────
function DocCard({ doc, onAction }: { doc: KBDoc; onAction: (action: string, id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
      {/* Source icon + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SourceIcon source={doc.source} size={18} />
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, borderRadius: 8 }}
          >
            <EllipsisHorizontalIcon style={{ width: 18, height: 18 }} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 10, background: WHITE, borderRadius: 14, boxShadow: NEU_SHADOW, border: '1px solid rgba(0,0,0,0.06)', padding: 6, minWidth: 140 }}>
              {['View', 'Edit', 'Re-index', 'Archive', 'Delete'].map(a => (
                <button
                  key={a}
                  onClick={() => { onAction(a, doc.id); setMenuOpen(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    fontFamily: FONT, fontWeight: 600, fontSize: 12,
                    color: a === 'Delete' ? RED : DARK,
                    background: 'transparent', border: 'none', borderRadius: 8,
                    padding: '8px 12px', cursor: 'pointer',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title + source label */}
      <div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK, lineHeight: '1.3em', marginBottom: 4 }}>{doc.title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{SOURCE_LABELS[doc.source]}</div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusBadge status={doc.status} />
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{doc.chunks} chunks</span>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {doc.tags.map(t => <TagBadge key={t} tag={t} />)}
      </div>

      {/* Dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>Added {doc.dateAdded}</span>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>Updated {doc.lastUpdated}</span>
      </div>
    </div>
  )
}

// ── Document row (list view) ───────────────────────────────────────────────────
function DocRow({ doc, onAction }: { doc: KBDoc; onAction: (action: string, id: string) => void }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SourceIcon source={doc.source} size={14} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>{doc.title}</span>
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{SOURCE_LABELS[doc.source]}</span>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {doc.tags.map(t => <TagBadge key={t} tag={t} />)}
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{doc.chunks} chunks</span>
      </td>
      <td style={{ padding: '12px 14px' }}><StatusBadge status={doc.status} /></td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{doc.lastUpdated}</span>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['View', 'Edit', 'Re-index'].map(a => (
            <button key={a} onClick={() => onAction(a, doc.id)} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>{a}</button>
          ))}
          <button onClick={() => onAction('Delete', doc.id)} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: RED, background: RED_LIGHT, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
        </div>
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportKnowledgeLibraryPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [search, setSearch]           = useState('')
  const [filterSource, setFilterSource] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTag, setFilterTag]     = useState('all')
  const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [reindexing, setReindexing]   = useState(false)
  const [docs, setDocs]               = useState(DOCS)

  function handleAction(action: string, id: string) {
    if (action === 'Delete')  setDocs(prev => prev.filter(d => d.id !== id))
    if (action === 'Archive') setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'archived' as DocStatus } : d))
    if (action === 'Edit' || action === 'View') navigate(`/support/knowledge/new?id=${id}`)
  }

  function handleReindex() {
    setReindexing(true)
    setTimeout(() => setReindexing(false), 1600)
  }

  const totalChunks = docs.filter(d => d.status === 'active').reduce((s, d) => s + d.chunks, 0)

  const filtered = docs.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSource !== 'all' && d.source !== filterSource) return false
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (filterTag !== 'all' && !d.tags.includes(filterTag)) return false
    return true
  })

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'visible' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '18px 14px 14px' : '24px 32px 18px',
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparklesIcon style={{ width: 20, height: 20, color: PRIMARY }} />
            </div>
            <div>
              <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: DARK, margin: 0 }}>Knowledge Base</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{totalChunks.toLocaleString()} total chunks · Last indexed: 2 hours ago</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Nav tabs */}
            {[
              { label: 'Library', path: '/support/knowledge' },
              { label: 'AI Drafts', path: '/support/knowledge/drafts', badge: '7' },
              { label: 'Gap Report', path: '/support/knowledge/gaps' },
            ].map(tab => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 12,
                  color: tab.label === 'Library' ? PRIMARY : MUTED,
                  background: tab.label === 'Library' ? AI_BG : 'transparent',
                  border: `1.5px solid ${tab.label === 'Library' ? AI_BORDER : 'transparent'}`,
                  borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.label}
                {tab.badge && (
                  <span style={{ background: PRIMARY, color: WHITE, borderRadius: 9999, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>{tab.badge}</span>
                )}
              </button>
            ))}

            {/* Re-index all */}
            <button
              onClick={handleReindex}
              style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14, padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <ArrowPathIcon style={{ width: 14, height: 14, color: MUTED, animation: reindexing ? 'spin 0.8s linear infinite' : 'none' }} />
              {reindexing ? 'Re-indexing…' : 'Re-index all'}
            </button>

            {/* Add knowledge */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAddMenuOpen(p => !p)}
                style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE, background: PRIMARY, border: 'none', borderRadius: 14, padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
              >
                <PlusIcon style={{ width: 15, height: 15 }} />
                Add Knowledge
                <ChevronDownIcon style={{ width: 12, height: 12 }} />
              </button>
              {addMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: WHITE, borderRadius: 16, boxShadow: NEU_SHADOW, border: '1px solid rgba(0,0,0,0.06)', padding: 8, minWidth: 200 }}>
                  {[
                    { label: 'Crawl webpage',              icon: <GlobeAltIcon style={{ width: 14, height: 14 }} /> },
                    { label: 'Upload file',                icon: <DocumentTextIcon style={{ width: 14, height: 14 }} /> },
                    { label: 'Write manually',             icon: <PencilIcon style={{ width: 14, height: 14 }} /> },
                    { label: 'Import from Google Drive',   icon: <SparklesOutline style={{ width: 14, height: 14 }} /> },
                  ].map(a => (
                    <button
                      key={a.label}
                      onClick={() => { navigate('/support/knowledge/new'); setAddMenuOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK, background: 'transparent', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
                    >
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 0 220px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: MUTED }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search in knowledge base..."
              style={{ fontFamily: FONT, fontSize: 12, color: DARK, background: BG, boxShadow: NEU_INSET, border: 'none', borderRadius: 12, padding: '9px 12px 9px 34px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Source type */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'All sources', val: 'all' },
              { label: 'Website', val: 'website' },
              { label: 'Files', val: 'file' },
              { label: 'Manual', val: 'manual' },
              { label: 'AI-drafted', val: 'ai-drafted' },
            ].map(s => (
              <Pill key={s.val} label={s.label} active={filterSource === s.val} onClick={() => setFilterSource(s.val)} />
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

          {/* Status */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ label: 'All', val: 'all' }, { label: 'Active', val: 'active' }, { label: 'Archived', val: 'archived' }].map(s => (
              <Pill key={s.val} label={s.label} active={filterStatus === s.val} onClick={() => setFilterStatus(s.val)} />
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill label="All tags" active={filterTag === 'all'} onClick={() => setFilterTag('all')} />
            {ALL_TAGS.map(t => (
              <Pill key={t} label={t} active={filterTag === t} onClick={() => setFilterTag(t)} />
            ))}
          </div>

          {/* View toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: BG, boxShadow: NEU_INSET, borderRadius: 12, padding: 4 }}>
            {(['grid', 'list'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === m ? PRIMARY : 'transparent', color: viewMode === m ? WHITE : MUTED, transition: 'all 0.15s' }}
              >
                {m === 'grid' ? <Squares2X2Icon style={{ width: 15, height: 15 }} /> : <ListBulletIcon style={{ width: 15, height: 15 }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '24px 32px 32px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        {viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {filtered.map(doc => (
              <DocCard key={doc.id} doc={doc} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: PROFILE_BG }}>
                  {['Title', 'Source', 'Tags', 'Chunks', 'Status', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: MUTED, textAlign: 'left', padding: '10px 14px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => <DocRow key={doc.id} doc={doc} onAction={handleAction} />)}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 32px', background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: DARK, marginBottom: 8 }}>No documents match your filters</div>
            <button
              onClick={() => { setSearch(''); setFilterSource('all'); setFilterStatus('all'); setFilterTag('all') }}
              style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

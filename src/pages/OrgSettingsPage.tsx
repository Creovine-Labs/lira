import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownOnSquareIcon,
  BuildingOffice2Icon,
  ClipboardDocumentIcon,
  LightBulbIcon,
  LockClosedIcon,
  PlusIcon,
  RectangleStackIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
import { PageLoader } from '@/components/ui/page-loader'
import { cn } from '@/lib'
import {
  getOrganization,
  listOrgMembers,
  updateOrganization,
  deleteOrganization,
  type OrganizationProfile,
  type OrgProduct,
  type OrgTerminology,
} from '@/services/api'

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Education',
  'Retail & E-commerce',
  'Manufacturing',
  'Real Estate',
  'Legal',
  'Marketing & Advertising',
  'Consulting',
  'Media & Entertainment',
  'Transportation & Logistics',
  'Food & Beverage',
  'Non-profit',
  'Government',
  'Energy',
  'Telecommunications',
  'Other',
]

function OrgSettingsPage() {
  const navigate = useNavigate()
  const { currentOrgId, updateOrganization: updateOrgInStore, removeOrganization } = useOrgStore()
  const userId = useAuthStore((s) => {
    const token = s.token
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId ?? payload.id ?? payload.sub ?? null
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Profile fields
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryCustom, setIndustryCustom] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [size, setSize] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')

  // Culture
  const [commStyle, setCommStyle] = useState('')
  const [meetingNorms, setMeetingNorms] = useState('')
  const [values, setValues] = useState<string[]>([])
  const [newValue, setNewValue] = useState('')

  // Products
  const [products, setProducts] = useState<OrgProduct[]>([])

  // Terminology
  const [terminology, setTerminology] = useState<OrgTerminology[]>([])

  const loadOrg = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const [org, memberList] = await Promise.all([
        getOrganization(currentOrgId),
        listOrgMembers(currentOrgId),
      ])
      // Determine current user's role
      const me = memberList.find((m) => m.user_id === userId)
      setCurrentRole(me?.role ?? null)
      setName(org.name)
      const p = org.profile || {}
      setCompanyName(p.company_name ?? '')
      setLogoUrl(p.logo_url ?? '')
      // Resolve industry: if stored value matches a known option use it; otherwise use 'Other' + custom
      const storedIndustry = p.industry ?? ''
      if (!storedIndustry || INDUSTRIES.includes(storedIndustry)) {
        setIndustry(storedIndustry)
        setIndustryCustom('')
      } else {
        setIndustry('Other')
        setIndustryCustom(storedIndustry)
      }
      setDescription(p.description ?? '')
      setWebsite(p.websites?.[0]?.url ?? p.website ?? '')
      setSize(p.size ?? '')
      setCustomInstructions(p.custom_instructions ?? '')
      setCommStyle(p.culture?.communication_style ?? '')
      setMeetingNorms(p.culture?.meeting_norms ?? '')
      setValues(p.culture?.values ?? [])
      setProducts(p.products ?? [])
      setTerminology(p.terminology ?? [])
    } catch {
      toast.error('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, userId])

  useEffect(() => {
    loadOrg()
  }, [loadOrg])

  async function handleSave() {
    if (!currentOrgId) return
    setSaving(true)
    try {
      const profile: Partial<OrganizationProfile> = {
        company_name: companyName.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        industry: (industry === 'Other' ? industryCustom.trim() : industry) || undefined,
        description: description.trim() || undefined,
        website: website.trim() || '',
        websites: website.trim() ? [{ url: website.trim() }] : undefined,
        size: size.trim() || undefined,
        custom_instructions: customInstructions.trim() || undefined,
        culture: {
          communication_style: commStyle.trim() || undefined,
          meeting_norms: meetingNorms.trim() || undefined,
          values: values.length > 0 ? values : undefined,
        },
        products: products.length > 0 ? products : undefined,
        terminology: terminology.length > 0 ? terminology : undefined,
      }
      await updateOrganization(currentOrgId, { name: name.trim(), profile })
      updateOrgInStore(currentOrgId, { name: name.trim() })
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteOrg() {
    if (!currentOrgId) return
    setDeleting(true)
    try {
      await deleteOrganization(currentOrgId)
      removeOrganization(currentOrgId)
      toast.success('Organization deleted')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete organization')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const [activeTab, setActiveTab] = useState<'general' | 'culture' | 'products' | 'instructions'>('general')

  if (loading) {
    return <PageLoader />
  }

  const canEdit = currentRole === 'owner' || currentRole === 'admin'

  const ORG_TABS = [
    { id: 'general' as const, icon: BuildingOffice2Icon, label: 'General' },
    { id: 'culture' as const, icon: UserGroupIcon, label: 'Culture' },
    { id: 'products' as const, icon: RectangleStackIcon, label: 'Products & Services' },
    { id: 'instructions' as const, icon: LightBulbIcon, label: 'Instructions' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organization Settings</h1>
          {name && <p className="mt-0.5 text-sm font-semibold text-[#3730a3]">{name}</p>}
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure your org profile — helps Lira give contextualized responses.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <aside className="shrink-0 border-b border-gray-100 md:border-b-0 md:border-r md:w-48 overflow-x-auto md:overflow-y-auto">
          <div className="flex flex-row gap-1 px-3 py-2 md:flex-col md:space-y-0.5 md:p-3">
            {ORG_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="text-[13px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Read-only notice */}
          {!canEdit && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
              <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700">
                You're viewing as a <strong>member</strong>. Only admins and owners can edit.
              </p>
            </div>
          )}

          {/* ── General tab ── */}
          {activeTab === 'general' && (
            <section className="rounded-xl border bg-card p-6 space-y-6">
              {/* Org ID */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">Organization ID</p>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <code className="flex-1 font-mono text-xs text-gray-700 truncate select-all">{currentOrgId}</code>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentOrgId) {
                        navigator.clipboard.writeText(currentOrgId)
                        toast.success('Org ID copied!')
                      }
                    }}
                    className="shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-200 transition"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Use this to configure the Lira widget on your website.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organization Name" required>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Company Name">
            <input
              className="input-field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Organization Logo URL" span2>
            <input
              type="url"
              className="input-field"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              maxLength={500}
            />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-10 w-10 rounded-lg object-contain border bg-muted"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  Used in outgoing emails and other branded communications.
                </span>
              </div>
            )}
          </Field>
          <Field label="Industry">
            <select
              className="input-field"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="">Select…</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            {industry === 'Other' && (
              <input
                className="input-field mt-2"
                value={industryCustom}
                onChange={(e) => setIndustryCustom(e.target.value)}
                placeholder="Describe your industry"
                maxLength={100}
              />
            )}
          </Field>
          <Field label="Company Size">
            <select className="input-field" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">Select…</option>
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-500">201–500</option>
              <option value="501+">501+</option>
            </select>
          </Field>
          <Field label="Website" span2>
            <input
              type="url"
              className="input-field"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              maxLength={500}
            />
          </Field>
          <Field label="Description" span2>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your organization"
              maxLength={1000}
            />
          </Field>
              </div>

              {/* Danger Zone inside General tab */}
              {canEdit && (
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
                  <h3 className="mb-1 text-sm font-semibold text-red-700">Danger Zone</h3>
                  <p className="mb-3 text-xs text-red-600/80">Destructive actions that cannot be undone.</p>
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Delete this organization</p>
                      <p className="text-xs text-gray-500">Permanently removes all members, documents, meetings, and data.</p>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="ml-4 shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Save */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim() || !canEdit}
                  className="flex items-center gap-2 rounded-xl bg-[#3730a3] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#312e81] disabled:opacity-50"
                >
                  {saving ? (
                    <img src="/lira_black.png" alt="" className="h-4 w-4 animate-spin opacity-50" style={{ animationDuration: '1.2s' }} />
                  ) : (
                    <ArrowDownOnSquareIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </section>
          )}

          {/* ── Culture tab ── */}
          {activeTab === 'culture' && (
            <section className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground">Company Culture</h2>
                    <div className="space-y-4">
          <Field label="Communication Style">
            <input
              className="input-field"
              value={commStyle}
              onChange={(e) => setCommStyle(e.target.value)}
              placeholder="e.g. Direct, collaborative, formal"
              maxLength={200}
            />
          </Field>
          <Field label="Meeting Norms">
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={meetingNorms}
              onChange={(e) => setMeetingNorms(e.target.value)}
              placeholder="e.g. Start on time, rotate facilitator, action items at end"
              maxLength={500}
            />
          </Field>
          <Field label="Core Values">
            <div className="flex flex-wrap gap-2 mb-2">
              {values.map((v, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full bg-[#3730a3]/10 px-2.5 py-1 text-xs font-medium text-[#3730a3]"
                >
                  {v}
                  <button
                    onClick={() => setValues(values.filter((_, j) => j !== i))}
                    className="ml-0.5 hover:text-red-500"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add a value"
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newValue.trim()) {
                    setValues([...values, newValue.trim()])
                    setNewValue('')
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newValue.trim()) {
                    setValues([...values, newValue.trim()])
                    setNewValue('')
                  }
                }}
                disabled={!canEdit}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </Field>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !canEdit}
                  className="flex items-center gap-2 rounded-xl bg-[#3730a3] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#312e81] disabled:opacity-50"
                >
                  {saving ? (
                    <img src="/lira_black.png" alt="" className="h-4 w-4 animate-spin opacity-50" style={{ animationDuration: '1.2s' }} />
                  ) : (
                    <ArrowDownOnSquareIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </section>
          )}

          {/* ── Products tab ── */}
          {activeTab === 'products' && (
            <section className="rounded-xl border bg-card p-6 space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Products &amp; Services</h2>
          <button
            onClick={() =>
              setProducts([...products, { name: '', description: '', status: 'active' }])
            }
            disabled={!canEdit}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products added yet. Add your products so Lira can reference them in meetings.
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((prod, i) => (
              <div key={i} className="flex gap-3 rounded-lg border bg-background p-3">
                <div className="flex-1 space-y-2">
                  <input
                    className="input-field"
                    value={prod.name}
                    onChange={(e) => {
                      const next = [...products]
                      next[i] = { ...next[i], name: e.target.value }
                      setProducts(next)
                    }}
                    placeholder="Product name"
                    maxLength={100}
                  />
                  <input
                    className="input-field"
                    value={prod.description}
                    onChange={(e) => {
                      const next = [...products]
                      next[i] = { ...next[i], description: e.target.value }
                      setProducts(next)
                    }}
                    placeholder="Brief description"
                    maxLength={500}
                  />
                </div>
                <button
                  onClick={() => setProducts(products.filter((_, j) => j !== i))}
                  className="self-start p-1 text-muted-foreground hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !canEdit}
                  className="flex items-center gap-2 rounded-xl bg-[#3730a3] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#312e81] disabled:opacity-50"
                >
                  {saving ? (
                    <img src="/lira_black.png" alt="" className="h-4 w-4 animate-spin opacity-50" style={{ animationDuration: '1.2s' }} />
                  ) : (
                    <ArrowDownOnSquareIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </section>
          )}

          {/* ── Instructions tab ── */}
          {activeTab === 'instructions' && (
            <section className="rounded-xl border bg-card p-6 space-y-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Terminology</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Internal terms or acronyms so Lira understands your jargon.</p>
                </div>
                <button
                  onClick={() => setTerminology([...terminology, { term: '', definition: '' }])}
                  disabled={!canEdit}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
        {terminology.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add internal terms or acronyms so Lira understands your jargon.
          </p>
        ) : (
          <div className="space-y-3">
            {terminology.map((t, i) => (
              <div key={i} className="flex gap-3 rounded-lg border bg-background p-3">
                <div className="flex-1 space-y-2">
                  <input
                    className="input-field"
                    value={t.term}
                    onChange={(e) => {
                      const next = [...terminology]
                      next[i] = { ...next[i], term: e.target.value }
                      setTerminology(next)
                    }}
                    placeholder="Term (e.g. OKR)"
                    maxLength={100}
                  />
                  <input
                    className="input-field"
                    value={t.definition}
                    onChange={(e) => {
                      const next = [...terminology]
                      next[i] = { ...next[i], definition: e.target.value }
                      setTerminology(next)
                    }}
                    placeholder="Definition"
                    maxLength={500}
                  />
                </div>
                <button
                  onClick={() => setTerminology(terminology.filter((_, j) => j !== i))}
                  className="self-start p-1 text-muted-foreground hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

              <div className="border-t border-gray-100 pt-6">
                <h2 className="mb-1 text-base font-semibold text-foreground">Custom Instructions</h2>
                <p className="mb-3 text-sm text-muted-foreground">
                  Tell Lira anything else about how to behave during your meetings.
                </p>
        <textarea
          className="input-field min-h-[120px] resize-y"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="e.g. Always summarize action items at the end of each meeting. Refer to our team as 'the crew'."
                  maxLength={2000}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !canEdit}
                  className="flex items-center gap-2 rounded-xl bg-[#3730a3] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#312e81] disabled:opacity-50"
                >
                  {saving ? (
                    <img src="/lira_black.png" alt="" className="h-4 w-4 animate-spin opacity-50" style={{ animationDuration: '1.2s' }} />
                  ) : (
                    <ArrowDownOnSquareIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Delete Organization</h3>
            <p className="mt-2 text-sm text-gray-500">
              Permanently delete <span className="font-semibold text-gray-900">{name}</span> and all
              its data including members, meetings, documents, and the knowledge base? This cannot
              be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrg}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function Field({
  label,
  required,
  children,
  span2,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  span2?: boolean
}) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

export { OrgSettingsPage }

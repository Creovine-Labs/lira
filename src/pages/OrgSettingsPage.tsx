import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownOnSquareIcon,
  ArrowPathIcon,
  LockClosedIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
import { PageLoader } from '@/components/ui/page-loader'
import {
  getOrganization,
  listOrgMembers,
  updateOrganization,
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
  const { currentOrgId, updateOrganization: updateOrgInStore } = useOrgStore()
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

  // Profile fields
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
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
      toast.success('Cog6ToothIcon saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  const canEdit = currentRole === 'owner' || currentRole === 'admin'

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Organization Cog6ToothIcon</h1>
        {name && (
          <p className="mt-0.5 text-base font-bold text-violet-600 dark:text-violet-400">{name}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your organization profile. This information helps Lira provide contextualized
          responses during meetings.
        </p>
      </div>

      {/* Read-only notice for plain members */}
      {!canEdit && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            You're viewing these settings as a <strong>member</strong>. Only admins and the owner
            can make changes. Ask your organization owner to promote you to admin if you need
            editing access.
          </p>
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Basic Information</h2>
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
      </section>

      {/* Culture */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Company Culture</h2>
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
                  className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
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
      </section>

      {/* Products */}
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Products & Services</h2>
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
      </section>

      {/* Terminology */}
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Terminology</h2>
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
      </section>

      {/* Custom Instructions */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Custom Instructions</h2>
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
      </section>

      {/* ArrowDownOnSquareIcon */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !canEdit}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDownOnSquareIcon className="h-4 w-4" />
          )}
          Save
        </button>
      </div>
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

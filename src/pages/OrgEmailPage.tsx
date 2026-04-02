import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BellIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { toast } from 'sonner'

import { useOrgStore } from '@/app/store'
import { PageLoader } from '@/components/ui/page-loader'
import {
  getEmailConfig,
  updateEmailConfig,
  registerEmailDomain,
  checkEmailDomainStatus,
  listEmailThreads,
  getEmailThread,
  type OrgEmailConfig,
  type EmailDnsRecord,
  type EmailThread,
} from '@/services/api'
import { cn } from '@/lib'

const NOTIFY_EVENTS: { value: string; label: string; description: string }[] = [
  {
    value: 'task_created',
    label: 'Task Created',
    description: 'Email assignee when a task is extracted from a meeting',
  },
  {
    value: 'task_completed',
    label: 'Task Completed',
    description: 'Notify the assigner when a task is marked complete',
  },
  {
    value: 'meeting_ended',
    label: 'Meeting Ended',
    description: 'Notify members when a meeting bot session ends',
  },
  {
    value: 'summary_ready',
    label: 'Summary Ready',
    description: 'Send the meeting summary to all participants',
  },
]

// ── Main page ─────────────────────────────────────────────────────────────────

function OrgEmailPage() {
  const { currentOrgId } = useOrgStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<OrgEmailConfig | null>(null)

  // notification form state
  const [fromName, setFromName] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notifyOn, setNotifyOn] = useState<string[]>([])
  const [aiReplyEnabled, setAiReplyEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState<'settings' | 'inbox'>('settings')

  // custom domain state
  const [domainInput, setDomainInput] = useState('')
  const [registering, setRegistering] = useState(false)
  const [dnsRecords, setDnsRecords] = useState<EmailDnsRecord[]>([])
  const [verifying, setVerifying] = useState(false)
  const [domainStatus, setDomainStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>(
    'idle'
  )
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadConfig = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const data = await getEmailConfig(currentOrgId)
      setConfig(data)
      setFromName(data.from_name ?? '')
      setNotificationsEnabled(data.email_notifications_enabled)
      setNotifyOn(data.notify_on ?? [])
      setAiReplyEnabled(data.ai_reply_enabled ?? true)
      // If domain was already registered, show its DNS records + status
      if (data.mode === 'custom' && data.dns_records?.length) {
        setDnsRecords(data.dns_records as EmailDnsRecord[])
        setDomainStatus(data.domain_verified ? 'verified' : 'pending')
        setDomainInput(data.custom_domain ?? '')
      }
    } catch {
      toast.error('Failed to load email settings')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    loadConfig()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadConfig])

  function toggleEvent(value: string) {
    setNotifyOn((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    )
  }

  async function handleSave() {
    if (!currentOrgId) return
    setSaving(true)
    try {
      const updated = await updateEmailConfig(currentOrgId, {
        from_name: fromName.trim() || undefined,
        email_notifications_enabled: notificationsEnabled,
        notify_on: notifyOn,
        ai_reply_enabled: aiReplyEnabled,
      })
      setConfig(updated)
      toast.success('Email settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleRegisterDomain() {
    if (!currentOrgId || !domainInput.trim()) return
    setRegistering(true)
    try {
      const result = await registerEmailDomain(currentOrgId, domainInput.trim().toLowerCase())
      setDnsRecords(result.dnsRecords)
      setDomainStatus('pending')
      toast.success('Domain registered — add the DNS records below to your provider')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register domain')
    } finally {
      setRegistering(false)
    }
  }

  function startPolling() {
    if (!currentOrgId || pollRef.current) return
    setVerifying(true)
    setDomainStatus('pending')
    pollRef.current = setInterval(async () => {
      try {
        const result = await checkEmailDomainStatus(currentOrgId)
        if (result.verified) {
          setDomainStatus('verified')
          setConfig((prev) => (prev ? { ...prev, domain_verified: true, mode: 'custom' } : prev))
          toast.success('Domain verified! Emails will now send from your custom domain.')
          clearInterval(pollRef.current!)
          pollRef.current = null
          setVerifying(false)
        }
      } catch {
        setDomainStatus('failed')
        clearInterval(pollRef.current!)
        pollRef.current = null
        setVerifying(false)
      }
    }, 8000)
  }

  if (loading) return <PageLoader />

  const isDirty =
    fromName !== (config?.from_name ?? '') ||
    notificationsEnabled !== config?.email_notifications_enabled ||
    aiReplyEnabled !== (config?.ai_reply_enabled ?? true) ||
    JSON.stringify([...notifyOn].sort()) !== JSON.stringify([...(config?.notify_on ?? [])].sort())

  const hasDomain = config?.mode === 'custom' && config.custom_domain
  const step = !dnsRecords.length ? 1 : domainStatus !== 'verified' ? 2 : 3

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Workspace
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Email</h1>
          </div>
          {activeTab === 'settings' && (
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1a1a1a] disabled:opacity-40"
            >
              {saving ? (
                <img
                  src="/lira_black.png"
                  alt="Loading"
                  className="h-4 w-4 animate-spin opacity-50"
                  style={{ animationDuration: '1.2s' }}
                />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {(['settings', 'inbox'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors capitalize',
                activeTab === tab
                  ? 'bg-[#0f0f0f] text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              {tab === 'inbox' ? 'Inbox' : 'Settings'}
            </button>
          ))}
        </div>

        {activeTab === 'inbox' && currentOrgId && <InboxPanel orgId={currentOrgId} />}

        {activeTab === 'settings' && (
          <>
            {/* Sender identity */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-800">Sender Identity</h2>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div>
                  <label
                    htmlFor="from-name-input"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500"
                  >
                    From Name
                  </label>
                  <input
                    id="from-name-input"
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Lira"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    Appears as the sender name — e.g.{' '}
                    <em>{fromName || 'Lira'} &lt;lira@liraintelligence.com&gt;</em>
                  </p>
                </div>

                {/* Current sending address pill */}
                <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  {hasDomain && config?.domain_verified ? (
                    <CheckCircleSolid className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <InformationCircleIcon className="h-4 w-4 shrink-0 text-blue-400" />
                  )}
                  <p className="text-xs text-gray-600">
                    {hasDomain && config?.domain_verified ? (
                      <>
                        Sending as{' '}
                        <span className="font-semibold text-gray-800">
                          lira@{config.custom_domain}
                        </span>
                      </>
                    ) : (
                      <>
                        Sending from{' '}
                        <span className="font-semibold">lira@liraintelligence.com</span>. Set up a
                        custom domain below to send from your own address.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Custom domain setup */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-gray-800">Custom Sending Domain</h2>
                  <p className="text-xs text-gray-400">
                    Send emails from your own domain, e.g. lira@yourcompany.com
                  </p>
                </div>
                {domainStatus === 'verified' && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Verified
                  </span>
                )}
                {domainStatus === 'pending' && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                    Pending DNS
                  </span>
                )}
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Step indicators */}
                <div className="flex items-center gap-0">
                  {[
                    { n: 1, label: 'Enter domain' },
                    { n: 2, label: 'Add DNS records' },
                    { n: 3, label: 'Verified' },
                  ].map((s, i) => (
                    <div key={s.n} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                            step > s.n
                              ? 'bg-emerald-500 text-white'
                              : step === s.n
                                ? 'bg-[#0f0f0f] text-white'
                                : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {step > s.n ? <CheckCircleIcon className="h-4 w-4" /> : s.n}
                        </div>
                        <span
                          className={cn(
                            'mt-1 text-[10px] font-semibold whitespace-nowrap',
                            step === s.n ? 'text-gray-800' : 'text-gray-400'
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className={cn(
                            'mb-3 h-px w-10 mx-1',
                            step > s.n ? 'bg-emerald-400' : 'bg-gray-200'
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1 — enter domain */}
                <div
                  className={cn(
                    'space-y-3',
                    step !== 1 && domainStatus !== 'pending' && 'opacity-50 pointer-events-none'
                  )}
                >
                  <label
                    htmlFor="domain-input"
                    className="block text-xs font-semibold uppercase tracking-widest text-gray-500"
                  >
                    Your Domain
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="domain-input"
                      type="text"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="yourcompany.com"
                      disabled={domainStatus === 'verified' || registering}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 disabled:opacity-50"
                    />
                    <button
                      onClick={handleRegisterDomain}
                      disabled={registering || !domainInput.trim() || domainStatus === 'verified'}
                      className="flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:opacity-40"
                    >
                      {registering ? (
                        <img
                          src="/lira_black.png"
                          alt="Loading"
                          className="h-4 w-4 animate-spin opacity-50"
                          style={{ animationDuration: '1.2s' }}
                        />
                      ) : null}
                      {registering
                        ? 'Registering…'
                        : dnsRecords.length
                          ? 'Re-register'
                          : 'Register'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Enter the root domain — Lira will send as <em>lira@yourcompany.com</em>. You'll
                    need access to your DNS provider to complete setup.
                  </p>
                </div>

                {/* Step 2 — DNS records */}
                {dnsRecords.length > 0 && domainStatus !== 'verified' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">
                        Add these records to your DNS provider
                      </p>
                      <p className="text-xs text-amber-700">
                        Log in to your domain registrar (e.g. Cloudflare, GoDaddy, Route 53,
                        Namecheap) and add the following DNS records exactly as shown. Propagation
                        typically takes 5–30 minutes.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Type
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Name / Host
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="px-4">
                          {dnsRecords.map((r, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                              <td className="px-4 py-3">
                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold uppercase text-gray-600">
                                  {r.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <CopyCell text={r.name} />
                              </td>
                              <td className="px-4 py-3">
                                <CopyCell text={r.value} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-gray-400">
                      <strong className="text-gray-600">Tip:</strong> Some providers (e.g. GoDaddy,
                      cPanel) strip the root domain from the Name field automatically — if your
                      record name already includes your domain, enter only the subdomain part shown
                      above.
                    </p>

                    {/* Verify button */}
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Ready to verify?</p>
                        <p className="text-xs text-gray-400">
                          Once DNS records are added, click Verify. This polls Resend every 8
                          seconds.
                        </p>
                      </div>
                      <button
                        onClick={startPolling}
                        disabled={verifying}
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:opacity-40"
                      >
                        {verifying ? (
                          <img
                            src="/lira_black.png"
                            alt="Loading"
                            className="h-4 w-4 animate-spin opacity-50"
                            style={{ animationDuration: '1.2s' }}
                          />
                        ) : (
                          <ShieldCheckIcon className="h-4 w-4" />
                        )}
                        {verifying ? 'Checking DNS…' : 'Verify'}
                      </button>
                    </div>

                    {domainStatus === 'failed' && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <XCircleIcon className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
                        <p className="text-xs text-red-700">
                          Verification failed — DNS records may not have propagated yet. Wait a few
                          minutes and try again.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 — verified */}
                {domainStatus === 'verified' && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                    <CheckCircleSolid className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        {config?.custom_domain ?? domainInput} is verified
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Lira will now send all emails from{' '}
                        <strong>lira@{config?.custom_domain ?? domainInput}</strong>. Replies still
                        route through the Lira inbound engine.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Notifications */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <BellIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-800">Email Notifications</h2>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable email notifications</p>
                    <p className="text-xs text-gray-400">
                      Lira will send automated emails for the events selected below.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notificationsEnabled}
                    onClick={() => setNotificationsEnabled((v) => !v)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none',
                      notificationsEnabled ? 'bg-[#0f0f0f]' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div
                  className={cn(
                    'space-y-2 transition-opacity',
                    notificationsEnabled ? 'opacity-100' : 'pointer-events-none opacity-30'
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Notify on
                  </p>
                  {NOTIFY_EVENTS.map((ev) => (
                    <label
                      key={ev.value}
                      htmlFor={`notif-${ev.value}`}
                      aria-label={ev.label}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        id={`notif-${ev.value}`}
                        type="checkbox"
                        checked={notifyOn.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                        className="mt-0.5 h-4 w-4 rounded accent-[#0f0f0f]"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ev.label}</p>
                        <p className="text-xs text-gray-400">{ev.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* AI Auto-Reply */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <EnvelopeOpenIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-800">AI Auto-Reply</h2>
              </div>
              <div className="px-5 py-5">
                <div className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable AI auto-reply</p>
                    <p className="text-xs text-gray-400">
                      When on, Lira replies to incoming emails using GPT-4o. When off, all inbound
                      replies are escalated to an admin immediately.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={aiReplyEnabled}
                    onClick={() => setAiReplyEnabled((v) => !v)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none',
                      aiReplyEnabled ? 'bg-[#0f0f0f]' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                        aiReplyEnabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
                {!aiReplyEnabled && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                    AI replies are disabled. Any email replies will be forwarded to your org admins
                    for manual follow-up.
                  </p>
                )}
              </div>
            </section>

            {/* Status card */}
            {config && (
              <section className="rounded-2xl border border-white/60 bg-white px-5 py-5 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Current Status
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Sending mode</p>
                    <p className="font-semibold text-gray-900 capitalize">{config.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Domain verified</p>
                    <p
                      className={`font-semibold ${config.domain_verified ? 'text-[#3730a3]' : 'text-red-500'}`}
                    >
                      {config.domain_verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Notifications</p>
                    <p
                      className={`font-semibold ${config.email_notifications_enabled ? 'text-[#3730a3]' : 'text-gray-400'}`}
                    >
                      {config.email_notifications_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">AI auto-reply</p>
                    <p
                      className={`font-semibold ${(config.ai_reply_enabled ?? true) ? 'text-[#3730a3]' : 'text-red-500'}`}
                    >
                      {(config.ai_reply_enabled ?? true) ? 'On' : 'Off'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last updated</p>
                    <p className="font-semibold text-gray-700">
                      {new Date(config.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Copy cell helper ──────────────────────────────────────────────────────────

function CopyCell({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="truncate max-w-[220px] text-xs font-mono text-gray-700">{text}</span>
      <button
        onClick={copy}
        className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
        title="Copy"
      >
        {copied ? (
          <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}

export default OrgEmailPage

// ── Inbox panel ───────────────────────────────────────────────────────────────

function InboxPanel({ orgId }: { orgId: string }) {
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EmailThread | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)

  useEffect(() => {
    setLoading(true)
    listEmailThreads(orgId)
      .then(setThreads)
      .catch(() => toast.error('Failed to load inbox'))
      .finally(() => setLoading(false))
  }, [orgId])

  async function openThread(t: EmailThread) {
    setLoadingThread(true)
    try {
      const full = await getEmailThread(orgId, t.threadId)
      setSelected(full)
    } catch {
      toast.error('Failed to load thread')
    } finally {
      setLoadingThread(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="mr-2 h-4 w-4 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />{' '}
        Loading inbox…
      </div>
    )
  }

  if (selected) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </button>
          <div className="ml-2 min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">
              {selected.subject ?? selected.contextType.replace('_', ' ')}
            </p>
            {selected.recipient && (
              <p className="truncate text-xs text-gray-400">To: {selected.recipient}</p>
            )}
          </div>
          <span
            className={cn(
              'ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              selected.status === 'open' && 'bg-emerald-50 text-emerald-700',
              selected.status === 'escalated' && 'bg-amber-50 text-amber-700',
              selected.status === 'closed' && 'bg-gray-100 text-gray-500'
            )}
          >
            {selected.status}
          </span>
        </div>
        {loadingThread ? (
          <div className="flex justify-center py-10 text-gray-400">
            <img
              src="/lira_black.png"
              alt="Loading"
              className="h-4 w-4 animate-spin opacity-50"
              style={{ animationDuration: '1.2s' }}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-5 py-4 space-y-3">
            {selected.messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm',
                  msg.role === 'lira'
                    ? 'bg-[#18181b] text-white ml-6'
                    : 'bg-gray-50 text-gray-800 mr-6'
                )}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-50">
                  {msg.role === 'lira' ? 'Lira' : 'Recipient'} ·{' '}
                  {new Date(msg.timestamp).toLocaleString()}
                </p>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: msg.body }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm text-center">
        <EnvelopeOpenIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">No email threads yet</p>
        <p className="mt-1 text-xs text-gray-400">
          When Lira sends emails and someone replies, the conversations will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm divide-y divide-gray-50">
      {threads.map((t) => {
        const last = t.messages[t.messages.length - 1]
        const hasReply = t.messages.some((m) => m.role === 'member')
        return (
          <button
            key={t.threadId}
            onClick={() => openThread(t)}
            className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                hasReply ? 'bg-violet-100' : 'bg-gray-100'
              )}
            >
              {hasReply ? (
                <EnvelopeOpenIcon className="h-4 w-4 text-violet-600" />
              ) : (
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {t.subject ?? t.contextType.replace('_', ' ')}
                </p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    t.status === 'open' && 'bg-emerald-50 text-emerald-600',
                    t.status === 'escalated' && 'bg-amber-50 text-amber-600',
                    t.status === 'closed' && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {t.status}
                </span>
              </div>
              {last && (
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {last.role === 'lira' ? 'Lira: ' : 'Reply: '}
                  {last.body
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 80)}
                </p>
              )}
              {t.recipient && (
                <p className="mt-0.5 truncate text-xs text-gray-300">To: {t.recipient}</p>
              )}
              <p className="mt-1 text-[10px] text-gray-300">
                {new Date(t.updated_at).toLocaleString()}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

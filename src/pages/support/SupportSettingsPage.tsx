import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon as _SparklesIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'

const TABS = [
  { key: 'widget', label: 'Widget', icon: CodeBracketIcon },
  { key: 'channels', label: 'Channels', icon: EnvelopeIcon },
  { key: 'behavior', label: 'Behavior', icon: Cog6ToothIcon },
  { key: 'escalation', label: 'Escalation', icon: ExclamationTriangleIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

function SupportSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (TABS.find((t) => t.key === searchParams.get('tab'))?.key ?? 'widget') as TabKey
  const { currentOrgId } = useOrgStore()
  const { config, loadConfig, updateConfig } = useSupportStore()
  const [saving, setSaving] = useState(false)

  // ── Form state ────────────────────────────────────────────────────────────
  const [widgetColor, setWidgetColor] = useState('#3730a3')
  const [greetingMessage, setGreetingMessage] = useState('Hello! How can I help you today?')
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [customSupportEmail, setCustomSupportEmail] = useState('')
  const [chatEnabled, setChatEnabled] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [portalEnabled, setPortalEnabled] = useState(false)
  const [portalSlug, setPortalSlug] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [forceEscalateIntents, setForceEscalateIntents] = useState('')
  const [escalationEmail, setEscalationEmail] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [linearTeam, setLinearTeam] = useState('')
  const [slaHours, setSlaHours] = useState(4)

  useEffect(() => {
    if (!currentOrgId) return
    loadConfig(currentOrgId)
  }, [currentOrgId, loadConfig])

  useEffect(() => {
    if (!config) return
    setWidgetColor(config.widget_color ?? '#3730a3')
    setGreetingMessage(config.greeting_message ?? 'Hello! How can I help you today?')
    setEmailEnabled(config.email_enabled)
    setCustomSupportEmail(config.custom_support_email ?? config.email_address ?? '')
    setChatEnabled(config.chat_enabled)
    setVoiceEnabled(config.voice_enabled)
    setPortalEnabled(config.portal_enabled ?? false)
    setPortalSlug(config.portal_slug ?? '')
    setAutoReplyEnabled(config.auto_reply_enabled)
    setConfidenceThreshold(config.confidence_threshold)
    setForceEscalateIntents((config.force_escalate_intents ?? []).join(', '))
    setEscalationEmail(config.escalation_email ?? '')
    setSlackChannel(config.escalation_slack_channel ?? '')
    setLinearTeam(config.escalation_linear_team ?? '')
    setSlaHours(config.sla_hours ?? 4)
  }, [config])

  const isDirty = config
    ? widgetColor !== (config.widget_color ?? '#3730a3') ||
      greetingMessage !== (config.greeting_message ?? 'Hello! How can I help you today?') ||
      emailEnabled !== config.email_enabled ||
      customSupportEmail !== (config.custom_support_email ?? config.email_address ?? '') ||
      chatEnabled !== config.chat_enabled ||
      voiceEnabled !== config.voice_enabled ||
      portalEnabled !== (config.portal_enabled ?? false) ||
      portalSlug !== (config.portal_slug ?? '') ||
      autoReplyEnabled !== config.auto_reply_enabled ||
      confidenceThreshold !== config.confidence_threshold ||
      forceEscalateIntents !== (config.force_escalate_intents ?? []).join(', ') ||
      escalationEmail !== (config.escalation_email ?? '') ||
      slackChannel !== (config.escalation_slack_channel ?? '') ||
      linearTeam !== (config.escalation_linear_team ?? '') ||
      slaHours !== (config.sla_hours ?? 4)
    : false

  const handleSave = useCallback(async () => {
    if (!currentOrgId) return
    setSaving(true)
    try {
      await updateConfig(currentOrgId, {
        widget_color: widgetColor || undefined,
        greeting_message: greetingMessage.trim() || undefined,
        email_enabled: emailEnabled,
        custom_support_email: customSupportEmail.trim() || undefined,
        chat_enabled: chatEnabled,
        voice_enabled: voiceEnabled,
        portal_enabled: portalEnabled,
        portal_slug: portalSlug.trim() || undefined,
        auto_reply_enabled: autoReplyEnabled,
        confidence_threshold: confidenceThreshold,
        force_escalate_intents: forceEscalateIntents
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        escalation_email: escalationEmail.trim() || undefined,
        escalation_slack_channel: slackChannel || undefined,
        escalation_linear_team: linearTeam || undefined,
        sla_hours: slaHours,
      })
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [
    currentOrgId,
    widgetColor,
    greetingMessage,
    emailEnabled,
    customSupportEmail,
    chatEnabled,
    voiceEnabled,
    portalEnabled,
    portalSlug,
    autoReplyEnabled,
    confidenceThreshold,
    forceEscalateIntents,
    escalationEmail,
    slackChannel,
    linearTeam,
    slaHours,
    updateConfig,
  ])

  const setTab = useCallback(
    function setTab(key: TabKey) {
      setSearchParams({ tab: key }, { replace: true })
    },
    [setSearchParams]
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Configure how Lira handles customer support
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition',
            isDirty
              ? 'bg-[#3730a3] text-white hover:bg-[#312e81]'
              : 'bg-gray-200 text-gray-400 cursor-default'
          )}
        >
          {saving ? 'Saving…' : isDirty ? '● Save Changes' : 'Saved'}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <aside className="shrink-0 border-b border-gray-100 md:border-b-0 md:border-r md:w-48 overflow-x-auto md:overflow-y-auto">
          <div className="flex flex-row gap-1 px-3 py-2 md:flex-col md:p-3">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors whitespace-nowrap',
                    activeTab === tab.key
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[13px] font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Widget tab */}
          {activeTab === 'widget' && (
            <div className="space-y-4">
              {!config?.chat_enabled && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-3">
                  <p className="text-sm font-semibold text-amber-800">
                    Chat widget is currently disabled
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    Enable it in the Channels tab. The embed code below will work as soon as it's
                    active.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Embed Code</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Paste this snippet before the{' '}
                    <code className="font-mono text-gray-600">&lt;/body&gt;</code> tag on every page
                    where you want the chat widget to appear.
                  </p>
                </div>

                {config ? (
                  <>
                    <div className="relative">
                      <pre className="overflow-x-auto rounded-xl bg-gray-900 px-5 py-4 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                        {[
                          '<script',
                          '  src="https://widget.liraintelligence.com/v1/widget.js"',
                          `  data-org-id="${config.org_id}"`,
                          `  data-greeting="${(greetingMessage ?? 'Hi! How can we help you today?').replace(/"/g, '&quot;')}"`,
                          '  data-position="bottom-right">',
                          '</script>',
                        ].join('\n')}
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          const code = [
                            '<script',
                            '  src="https://widget.liraintelligence.com/v1/widget.js"',
                            `  data-org-id="${config.org_id}"`,
                            `  data-greeting="${(greetingMessage ?? 'Hi! How can we help you today?').replace(/"/g, '"')}"`,
                            '  data-position="bottom-right">',
                            '</script>',
                          ].join('\n')
                          navigator.clipboard.writeText(code)
                          toast.success('Embed code copied!')
                        }}
                        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-gray-600"
                      >
                        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>

                    <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1.5 text-xs text-gray-500">
                      <p>
                        <span className="font-semibold text-gray-700">data-org-id</span> —
                        permanent, never changes.
                      </p>
                      <p>
                        <span className="font-semibold text-gray-700">data-greeting</span> —
                        reflects your greeting message below.
                      </p>
                      <p>
                        <span className="font-semibold text-gray-700">data-position</span> —{' '}
                        <code className="font-mono">bottom-right</code> or{' '}
                        <code className="font-mono">bottom-left</code>.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Loading…</p>
                )}
              </div>

              {/* Widget Color */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Widget Color</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Primary color for the chat widget header, buttons, and message bubbles.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-xl border border-gray-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={widgetColor}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setWidgetColor(v)
                    }}
                    maxLength={7}
                    className="w-28 rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm focus:border-[#3730a3] focus:outline-none"
                  />
                  <div className="h-10 flex-1 rounded-xl" style={{ background: widgetColor }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    '#3730a3',
                    '#1d4ed8',
                    '#0891b2',
                    '#059669',
                    '#d97706',
                    '#dc2626',
                    '#7c3aed',
                    '#db2777',
                    '#1a1a2e',
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWidgetColor(c)}
                      className={cn(
                        'h-8 w-8 rounded-lg border-2 transition',
                        widgetColor === c
                          ? 'border-gray-900 scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Greeting message */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Greeting Message</h3>
                <textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  rows={2}
                  placeholder="Hello! How can I help you today?"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400">
                  Opening message shown to customers when the chat widget loads.
                </p>
              </div>
            </div>
          )}

          {/* Channels tab */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              {/* Email */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900">Email</h3>
                  <label className="ml-auto flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                    />
                    <span className="text-xs text-gray-500">Enabled</span>
                  </label>
                </div>
                {config?.email_address && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                      Your Lira support address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-gray-800 truncate">
                        {config.email_address}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(config.email_address ?? '')
                          toast.success('Copied!')
                        }}
                        className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-200 transition"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Share with customers or set as a forwarding destination.
                    </p>
                  </div>
                )}
                {emailEnabled && (
                  <div className="space-y-2">
                    <label
                      htmlFor="settings-custom-email"
                      className="block text-xs font-semibold text-gray-500"
                    >
                      Custom address <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="settings-custom-email"
                      type="email"
                      value={customSupportEmail}
                      onChange={(e) => setCustomSupportEmail(e.target.value)}
                      placeholder="support@yourcompany.com"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                    />
                    {customSupportEmail.trim() && config?.email_address && (
                      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 space-y-1">
                        <p className="font-semibold">Forwarding setup required</p>
                        <p>
                          Create a forwarding rule from <strong>{customSupportEmail.trim()}</strong>{' '}
                          to <strong className="font-mono">{config.email_address}</strong> in your
                          email provider.
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400">
                      Customers can email your own address and it forwards to Lira.
                    </p>
                  </div>
                )}
              </div>

              {/* Chat */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Chat Widget</h3>
                    <p className="text-xs text-gray-400">Embeddable live chat for your website</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={chatEnabled}
                      onChange={(e) => setChatEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                    />
                    <span className="text-xs text-gray-500">Enabled</span>
                  </label>
                </div>
              </div>

              {/* Voice */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900">Voice</h3>
                  <label className="ml-auto flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                    />
                    <span className="text-xs text-gray-500">Enabled</span>
                  </label>
                </div>
                {voiceEnabled && (
                  <p className="mt-2 text-xs text-gray-400">
                    Visitors can talk to Lira via real-time voice calls in the chat widget.
                  </p>
                )}
              </div>

              {/* Support Portal */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900">Support Portal</h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                    NEW
                  </span>
                  <label className="ml-auto flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={portalEnabled}
                      onChange={(e) => setPortalEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                    />
                    <span className="text-xs text-gray-500">Enabled</span>
                  </label>
                </div>

                {portalEnabled && (
                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <div>
                      <label
                        htmlFor="settings-portal-slug"
                        className="mb-1 block text-xs font-semibold text-gray-500"
                      >
                        Portal URL slug
                      </label>
                      <div className="flex items-center">
                        <span className="shrink-0 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-400">
                          support.liraintelligence.com/
                        </span>
                        <input
                          id="settings-portal-slug"
                          type="text"
                          value={portalSlug}
                          onChange={(e) =>
                            setPortalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                          }
                          placeholder={(config?.org_id ?? '').slice(0, 12) || 'my-company'}
                          className="flex-1 rounded-r-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        The public URL where your customers access the portal.
                      </p>
                    </div>

                    {config?.portal_slug && (
                      <a
                        href={`https://support.liraintelligence.com/${config.portal_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3730a3] hover:underline"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        Open portal
                      </a>
                    )}
                  </div>
                )}

                {!portalEnabled && (
                  <p className="text-xs text-gray-400">
                    Give customers a branded full-page experience — submit tickets, track status,
                    and chat live.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Behavior tab */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-gray-900">AI Behavior</h3>
                <div className="space-y-4">
                  <label aria-label="Toggle auto-reply" className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={autoReplyEnabled}
                      onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Auto-reply enabled</span>
                      <p className="text-xs text-gray-400">
                        When enabled, Lira will automatically reply to customer messages
                      </p>
                    </div>
                  </label>

                  <div>
                    <label
                      htmlFor="settings-confidence"
                      className="mb-1 block text-xs font-semibold text-gray-500"
                    >
                      Confidence Threshold ({Math.round(confidenceThreshold * 100)}%)
                    </label>
                    <input
                      id="settings-confidence"
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(confidenceThreshold * 100)}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Lira will escalate if confidence is below this threshold
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="settings-force-escalate"
                      className="mb-1 block text-xs font-semibold text-gray-500"
                    >
                      Force-Escalate Intents
                    </label>
                    <input
                      id="settings-force-escalate"
                      type="text"
                      value={forceEscalateIntents}
                      onChange={(e) => setForceEscalateIntents(e.target.value)}
                      placeholder="data_privacy, account_security, legal, fraud"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Comma-separated intents that always escalate regardless of confidence
                    </p>
                  </div>
                </div>
              </div>

              {/* Volume limits */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Volume Limits</h3>
                {config && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Conversations this month</span>
                      <span className="font-medium text-gray-800">
                        {config.conversations_this_month} / {config.max_conversations_per_month}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">AI replies this month</span>
                      <span className="font-medium text-gray-800">
                        {config.ai_replies_this_month} / {config.max_ai_replies_per_month}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Escalation tab */}
          {activeTab === 'escalation' && (
            <div className="space-y-4">
              {/* Escalation email + SLA */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Escalation Routing</h3>

                <div>
                  <label
                    htmlFor="settings-escalation-email"
                    className="mb-1 block text-xs font-semibold text-gray-500"
                  >
                    Escalation Email
                  </label>
                  <input
                    id="settings-escalation-email"
                    type="email"
                    value={escalationEmail}
                    onChange={(e) => setEscalationEmail(e.target.value)}
                    placeholder="support-team@yourcompany.com"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Receives a notification whenever a conversation is escalated to a human.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    SLA Target — {slaHours}h
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={72}
                    value={slaHours}
                    onChange={(e) => setSlaHours(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>1h</span>
                    <span>12h</span>
                    <span>24h</span>
                    <span>48h</span>
                    <span>72h</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Target response time for escalated conversations.
                  </p>
                </div>
              </div>

              {/* Integrations */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Integrations</h3>

                <div>
                  <label
                    htmlFor="settings-slack-channel"
                    className="mb-1 block text-xs font-semibold text-gray-500"
                  >
                    Slack Escalation Channel
                  </label>
                  <input
                    id="settings-slack-channel"
                    type="text"
                    value={slackChannel}
                    onChange={(e) => setSlackChannel(e.target.value)}
                    placeholder="#support-escalations"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-linear-team"
                    className="mb-1 block text-xs font-semibold text-gray-500"
                  >
                    Linear Team
                  </label>
                  <input
                    id="settings-linear-team"
                    type="text"
                    value={linearTeam}
                    onChange={(e) => setLinearTeam(e.target.value)}
                    placeholder="Team ID or name"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                  />
                </div>

                <p className="text-xs text-gray-400">
                  When a conversation is escalated, Lira will create a Linear issue and notify the
                  Slack channel above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { SupportSettingsPage }

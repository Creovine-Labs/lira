import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  KeyIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  PhoneIcon,
  SparklesIcon,
  CheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  BoltIcon,
  ChatBubbleLeftEllipsisIcon,
  CpuChipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { toast } from 'sonner'
import { cn } from '@/lib'
import {
  defaultOnboardingState,
  ONBOARDING_STEPS,
  type SupportOnboardingState,
  type SupportOnboardingStep,
} from '@/features/support/types'

// ── Design tokens (Figma neumorphic system) ───────────────────────────────────
const BG = '#E8EAF0'
const NEU_SHADOW = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const PRIMARY = '#6366F1'
const DARK = '#2E3040'
const MUTED = '#585A68'
const DIVIDER = '#D6D8DE'

// ── Copy-to-clipboard helper ──────────────────────────────────────────────────
function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <code className="flex-1 truncate font-mono text-sm text-gray-700">{value}</code>
      <button
        onClick={copy}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-violet-600' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
    </label>
  )
}

// ── Integration card ──────────────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    desc: 'Sync customer profiles, update contact records',
    required: 'Recommended',
    logo: '🟠',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    desc: 'Sync customer profiles, update contact records',
    required: 'Recommended',
    logo: '☁️',
  },
  {
    id: 'linear',
    name: 'Linear',
    desc: 'Create and assign support tickets automatically',
    required: 'Recommended',
    logo: '◆',
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Notify teams on escalation, compliance holds',
    required: 'Recommended',
    logo: '#️⃣',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    desc: 'Alternative to Slack for team notifications',
    required: 'Optional',
    logo: '🟣',
  },
  {
    id: 'github',
    name: 'GitHub',
    desc: 'Create issues for product bugs surfaced in support',
    required: 'Optional',
    logo: '⚫',
  },
]

// ── Step 1 — Email Channel ───────────────────────────────────────────────────
function StepEmail({
  state,
  update,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
}) {
  function handleVerify() {
    if (!state.emailAddress) {
      toast.error('Enter an email address first')
      return
    }
    // Simulated verify
    toast.success('Verification email sent — check your inbox')
    setTimeout(() => update({ emailVerified: true }), 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Inbound support email address
        </label>
        <input
          type="email"
          value={state.emailAddress}
          onChange={(e) => update({ emailAddress: e.target.value })}
          placeholder="support@yourcompany.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <p className="mt-1.5 text-xs text-gray-400">
          This is the address your customers already email for support. Lira monitors it and
          replies on your behalf.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Email ownership verification</p>
          <p className="mt-0.5 text-xs text-gray-400">
            We&apos;ll send a confirmation link to that address
          </p>
        </div>
        {state.emailVerified ? (
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <CheckCircleSolid className="h-3.5 w-3.5" />
            Verified
          </span>
        ) : (
          <button
            onClick={handleVerify}
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
          >
            Send verification
          </button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Sender display name
        </label>
        <input
          type="text"
          value={state.senderName}
          onChange={(e) => update({ senderName: e.target.value })}
          placeholder="Lira | YourCompany Support"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <p className="mt-1.5 text-xs text-gray-400">
          How replies appear in your customers&apos; inboxes
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Reply-from address</p>
        <div className="space-y-2">
          {[
            {
              val: false,
              label: 'reply@lira-mail.yourcompany.com',
              sub: 'Default — Lira provisions a custom subdomain for you',
            },
            {
              val: true,
              label: 'Use your own custom domain',
              sub: 'Requires a DNS record — we&apos;ll show you exactly what to add',
            },
          ].map((opt) => (
            <label
              key={String(opt.val)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition',
                state.useCustomDomain === opt.val
                  ? 'border-violet-300 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <input
                type="radio"
                name="reply-domain"
                checked={state.useCustomDomain === opt.val}
                onChange={() => update({ useCustomDomain: opt.val })}
                className="accent-violet-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                <p
                  className="mt-0.5 text-xs text-gray-500"
                  dangerouslySetInnerHTML={{ __html: opt.sub }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Toggle
          checked={state.ccTeam}
          onChange={(v) => update({ ccTeam: v })}
          label="CC your team on every reply"
        />
        {state.ccTeam && (
          <input
            type="email"
            value={state.ccAddress}
            onChange={(e) => update({ ccAddress: e.target.value })}
            placeholder="team@yourcompany.com"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        )}
        <Toggle
          checked={state.bccCompliance}
          onChange={(v) => update({ bccCompliance: v })}
          label="BCC for compliance logging"
        />
        {state.bccCompliance && (
          <input
            type="email"
            value={state.bccAddress}
            onChange={(e) => update({ bccAddress: e.target.value })}
            placeholder="compliance@yourcompany.com"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        )}
      </div>
    </div>
  )
}

// ── Step 2 — Chat Widget ──────────────────────────────────────────────────────
function StepWidget({
  state,
  update,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
}) {
  const [copied, setCopied] = useState(false)
  const embedCode = `<script src="https://cdn.lira.ai/widget.js" data-org="org_xxxx"></script>`
  function copyEmbed() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Config */}
      <div className="space-y-5">
        <Toggle
          checked={state.widgetEnabled}
          onChange={(v) => update({ widgetEnabled: v })}
          label="Enable Chat Widget"
          description="Embed Lira's chat on your website or app"
        />

        {state.widgetEnabled && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Widget title
              </label>
              <input
                type="text"
                value={state.widgetTitle}
                onChange={(e) => update({ widgetTitle: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Greeting message
              </label>
              <input
                type="text"
                value={state.widgetGreeting}
                onChange={(e) => update({ widgetGreeting: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Accent color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={state.widgetColor}
                  onChange={(e) => update({ widgetColor: e.target.value })}
                  className="h-10 w-16 cursor-pointer rounded-lg border-0 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={state.widgetColor}
                  onChange={(e) => update({ widgetColor: e.target.value })}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-mono text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Position</label>
              <div className="grid grid-cols-2 gap-3">
                {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                  <label
                    key={pos}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
                      state.widgetPosition === pos
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="widget-pos"
                      checked={state.widgetPosition === pos}
                      onChange={() => update({ widgetPosition: pos })}
                      className="sr-only"
                    />
                    {pos === 'bottom-right' ? 'Bottom right' : 'Bottom left'}
                  </label>
                ))}
              </div>
            </div>

            <Toggle
              checked={state.alwaysOn}
              onChange={(v) => update({ alwaysOn: v })}
              label="Always on (24/7)"
              description="Lira runs around the clock — no business hours needed"
            />

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Embed code</p>
              <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <code className="flex-1 break-all font-mono text-xs text-gray-600">
                  {embedCode}
                </code>
                <button
                  onClick={copyEmbed}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
                >
                  {copied ? (
                    <ClipboardDocumentCheckIcon className="h-3 w-3 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-3 w-3" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                Add this to your website&apos;s{' '}
                <code className="rounded bg-gray-100 px-1 text-gray-600">&lt;head&gt;</code> tag
              </p>
            </div>
          </>
        )}
      </div>

      {/* Live preview */}
      <div className="flex flex-col">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Live preview
        </p>
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 p-4">
          <div className="text-xs text-gray-400">yourcompany.com</div>
          <div className="mt-2 h-32 rounded-xl bg-white/80" />
          <div className="mt-2 flex gap-2">
            <div className="h-4 w-24 rounded bg-white/80" />
            <div className="h-4 w-16 rounded bg-white/80" />
          </div>

          {/* Widget launcher */}
          <div
            className={cn(
              'absolute bottom-4',
              state.widgetPosition === 'bottom-right' ? 'right-4' : 'left-4'
            )}
          >
            {/* Open widget bubble */}
            <div
              className="mb-2 max-w-[160px] rounded-2xl rounded-br-sm bg-white p-2.5 shadow-lg"
              style={{ borderColor: state.widgetColor }}
            >
              <p className="text-[10px] font-semibold text-gray-800">{state.widgetTitle}</p>
              <p className="mt-0.5 text-[9px] text-gray-500 leading-tight">
                {state.widgetGreeting}
              </p>
            </div>
            <button
              style={{ background: state.widgetColor }}
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition hover:opacity-90"
            >
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3 — Voice ────────────────────────────────────────────────────────────
function StepVoice({
  state,
  update,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <MicrophoneIcon className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-violet-800">Powered by Nova Sonic</p>
          <p className="mt-0.5 text-sm text-violet-600">
            The same voice AI that runs Lira&apos;s live meeting assistant handles your support
            calls — no hold music, no IVR, no press-1-for-billing. Full context from the moment
            the call connects.
          </p>
        </div>
      </div>

      <Toggle
        checked={state.voiceEnabled}
        onChange={(v) => update({ voiceEnabled: v })}
        label="Enable Voice Support"
        description="Optional — Lira will handle inbound calls and resolve them autonomously"
      />

      {state.voiceEnabled && (
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Support phone number
            </label>
            <div className="flex gap-3">
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
                <PhoneIcon className="h-4 w-4" />
              </div>
              <input
                type="tel"
                value={state.phoneNumber}
                onChange={(e) => update({ phoneNumber: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Provision a Twilio number or forward your existing number to Lira
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">Voice AI capabilities</p>
            <ul className="space-y-2">
              {[
                'Natural turn-taking — Lira speaks, pauses, listens',
                'Barge-in detection — customer can interrupt at any time',
                'Full customer memory context from the first word',
                'Seamless email follow-up after call ends',
                'Call transcripts linked to customer profile',
              ].map((cap) => (
                <li key={cap} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-violet-400" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!state.voiceEnabled && (
        <p className="text-sm text-gray-400">
          You can enable voice support at any time from Settings → Channels.
        </p>
      )}
    </div>
  )
}

// ── Step 4 — Integrations ─────────────────────────────────────────────────────
function StepIntegrations({
  state,
  update,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
}) {
  function toggleIntegration(id: string) {
    const connected = state.connectedIntegrations
    if (connected.includes(id)) {
      update({ connectedIntegrations: connected.filter((c) => c !== id) })
    } else {
      toast.success(`Connected to ${INTEGRATIONS.find((i) => i.id === id)?.name ?? id}`)
      update({ connectedIntegrations: [...connected, id] })
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 text-sm text-violet-700">
        Lira will only take actions on these tools when a customer conversation warrants it. You
        control action permissions in the Action Engine settings.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((intg) => {
          const isConnected = state.connectedIntegrations.includes(intg.id)
          return (
            <div
              key={intg.id}
              className={cn(
                'flex items-start gap-4 rounded-2xl border p-4 transition',
                isConnected ? 'border-violet-200 bg-violet-50/40' : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl shadow-sm">
                {intg.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      intg.required === 'Recommended'
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {intg.required}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{intg.desc}</p>
              </div>
              <button
                onClick={() => toggleIntegration(intg.id)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  isConnected
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                )}
              >
                {isConnected ? '✓ Connected' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400">
        Already connected integrations from your Workspace are automatically available — no need
        to reconnect.
      </p>
    </div>
  )
}

// ── Step 5 — Knowledge Base ───────────────────────────────────────────────────
function StepKnowledge({
  state,
  update,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
}) {
  const [activeTab, setActiveTab] = useState<'crawl' | 'upload' | 'manual'>('crawl')
  const [manualTitle, setManualTitle] = useState('')
  const [manualBody, setManualBody] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function startCrawl() {
    if (!state.websiteUrl) {
      toast.error('Enter a website URL first')
      return
    }
    update({ crawlStarted: true })
    // Simulate crawl progress
    setTimeout(() => update({ crawledPages: 12, knowledgeChunks: 420 }), 1000)
    setTimeout(() => update({ crawledPages: 31, knowledgeChunks: 890 }), 2000)
    setTimeout(() => {
      update({ crawlComplete: true, crawledPages: 48, knowledgeChunks: 1240 })
      toast.success('Knowledge base indexed — 1,240 chunks ready')
    }, 3500)
  }

  function handleFileUpload(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      status: 'processing' as const,
    }))
    update({ uploadedFiles: [...state.uploadedFiles, ...newFiles] })
    setTimeout(() => {
      update({
        uploadedFiles: state.uploadedFiles.concat(newFiles).map((f) => ({
          ...f,
          status: 'ready',
        })),
      })
    }, 2000)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Important:</strong> Lira only answers questions she can find in the knowledge
        base — she won&apos;t make things up. The more you add here, the better she performs.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {(
          [
            { id: 'crawl', label: 'Website crawl', icon: GlobeAltIcon },
            { id: 'upload', label: 'File upload', icon: CloudArrowUpIcon },
            { id: 'manual', label: 'Manual entry', icon: PencilSquareIcon },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition',
              activeTab === id
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'crawl' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Website URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={state.websiteUrl}
                onChange={(e) => update({ websiteUrl: e.target.value })}
                placeholder="https://yourcompany.com"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                disabled={state.crawlStarted}
              />
              <button
                onClick={startCrawl}
                disabled={state.crawlStarted}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {state.crawlStarted ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Crawling…
                  </>
                ) : (
                  <>
                    <BoltIcon className="h-4 w-4" />
                    Start crawl
                  </>
                )}
              </button>
            </div>
          </div>

          {state.crawlStarted && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              {state.crawlComplete ? (
                <div className="flex items-center gap-3">
                  <CheckCircleSolid className="h-6 w-6 shrink-0 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {state.crawledPages} pages indexed
                    </p>
                    <p className="text-xs text-gray-500">
                      {state.knowledgeChunks.toLocaleString()} knowledge chunks ready
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Crawling {state.crawledPages} pages…</span>
                    <span>{state.knowledgeChunks} chunks so far</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${Math.min((state.crawledPages / 48) * 100, 95)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv"
            className="sr-only"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center transition hover:border-violet-300 hover:bg-violet-50/30"
          >
            <CloudArrowUpIcon className="h-10 w-10 text-gray-300" />
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Drop files here or click to upload
              </p>
              <p className="mt-1 text-xs text-gray-400">PDF, DOCX, TXT, CSV — max 50MB each</p>
            </div>
          </button>
          {state.uploadedFiles.length > 0 && (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {state.uploadedFiles.map((f) => (
                <div key={f.name} className="flex items-center gap-3 px-4 py-3">
                  <DocumentTextIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{f.name}</p>
                    <p className="text-xs text-gray-400">
                      {(f.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      f.status === 'ready'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-600'
                    )}
                  >
                    {f.status === 'ready' ? 'Ready' : 'Processing…'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder='e.g. "What is your refund policy?"'
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={manualBody}
              onChange={(e) => setManualBody(e.target.value)}
              placeholder="Write the knowledge entry content here…"
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <button
            onClick={() => {
              if (!manualTitle || !manualBody) return
              toast.success('Knowledge entry saved')
              setManualTitle('')
              setManualBody('')
            }}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Save entry
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 6 — API & Webhooks ───────────────────────────────────────────────────
function StepApi({
  state,
  update,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
}) {
  const [keyVisible, setKeyVisible] = useState(false)
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('node')
  const [testSent, setTestSent] = useState(false)

  const CODE: Record<typeof codeTab, string> = {
    curl: `curl -X POST https://api.lira.ai/support/customers \\
  -H "Authorization: Bearer ${state.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"customerId": "usr_abc", "email": "james@acme.com"}'`,
    node: `import Lira from '@lira-ai/sdk'
const lira = new Lira({ apiKey: process.env.LIRA_API_KEY })

await lira.support.customers.create({
  customerId: 'usr_abc',
  email: 'james@acme.com',
  name: 'James Chen',
})`,
    python: `import lira
client = lira.Client(api_key=os.environ['LIRA_API_KEY'])

client.support.customers.create(
    customer_id='usr_abc',
    email='james@acme.com',
    name='James Chen',
)`,
  }

  const webhookPayload = `{
  "event": "payment.failed",
  "customerId": "usr_abc",
  "orgId": "org_xxxx",
  "data": {
    "amount": 4900,
    "currency": "USD",
    "failureReason": "insufficient_funds"
  },
  "timestamp": "${new Date().toISOString()}"
}`

  function sendTestEvent() {
    setTestSent(true)
    toast.success('Test event received — webhook is working!')
  }

  return (
    <div className="space-y-8">
      {/* API key */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-800">Your API Key</label>
          <Toggle
            checked={state.sandboxMode}
            onChange={(v) => update({ sandboxMode: v })}
            label="Sandbox mode"
          />
        </div>
        <p className="mb-3 text-xs text-gray-400">
          Use this key to send customer data to Lira and trigger actions programmatically. It is
          shown once — store it securely.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <KeyIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <code className="flex-1 truncate font-mono text-sm text-gray-700">
            {keyVisible
              ? state.apiKey
              : state.apiKey.slice(0, 14) + '•'.repeat(18)}
          </code>
          <button
            onClick={() => setKeyVisible((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:bg-gray-50"
          >
            {keyVisible ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(state.apiKey)
              toast.success('API key copied')
            }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>

        {/* Code snippet */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <div className="flex gap-0 border-b border-gray-200 bg-gray-50">
            {(['node', 'curl', 'python'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold transition',
                  codeTab === tab
                    ? 'bg-white text-violet-700 border-b-2 border-violet-600'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                {tab === 'node' ? 'Node.js' : tab === 'curl' ? 'cURL' : 'Python'}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto bg-[#0f0f0f] p-4 text-xs leading-relaxed text-green-300">
            <code>{CODE[codeTab]}</code>
          </pre>
        </div>
      </div>

      {/* Webhook */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-gray-800">Proactive Support Webhook</p>
        <p className="mb-3 text-xs text-gray-400">
          Send product events to this URL. When a payment fails, a KYC check stalls, or any event
          you define fires — Lira will reach out to the affected customer automatically.
        </p>
        <CopyField value={state.webhookUrl} label="webhook URL" />
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
            Expected payload
          </div>
          <pre className="overflow-x-auto bg-[#0f0f0f] p-4 text-xs leading-relaxed text-blue-300">
            <code>{webhookPayload}</code>
          </pre>
        </div>
        <button
          onClick={sendTestEvent}
          className={cn(
            'mt-3 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition',
            testSent
              ? 'bg-green-50 text-green-700'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          )}
        >
          {testSent ? (
            <>
              <CheckCircleSolid className="h-4 w-4" />
              Test event received!
            </>
          ) : (
            <>
              <BoltIcon className="h-4 w-4" />
              Send test event
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Step 7 — Test & Go Live ───────────────────────────────────────────────────
const CHECK_ITEMS = [
  { id: 'email', label: 'Email channel connected', detail: (s: SupportOnboardingState) => s.emailAddress || 'Not configured', ok: (s: SupportOnboardingState) => !!s.emailAddress },
  { id: 'widget', label: 'Chat widget configured', detail: () => 'Embed code generated', ok: (s: SupportOnboardingState) => s.widgetEnabled },
  { id: 'voice', label: 'Voice support', detail: (s: SupportOnboardingState) => s.voiceEnabled ? s.phoneNumber || 'Enabled' : 'Skipped', ok: () => true },
  { id: 'integrations', label: 'Integrations connected', detail: (s: SupportOnboardingState) => s.connectedIntegrations.length > 0 ? s.connectedIntegrations.join(', ') : 'None yet', ok: (s: SupportOnboardingState) => s.connectedIntegrations.length > 0 },
  { id: 'knowledge', label: 'Knowledge base seeded', detail: (s: SupportOnboardingState) => s.crawlComplete ? `${s.crawledPages} pages, ${s.knowledgeChunks.toLocaleString()} chunks` : 'Not indexed yet', ok: (s: SupportOnboardingState) => s.crawlComplete || s.uploadedFiles.length > 0 },
  { id: 'api', label: 'API key generated', detail: () => 'Ready', ok: () => true },
  { id: 'webhook', label: 'Webhook configured', detail: () => 'URL ready', ok: () => true },
]

type TestStatus = 'idle' | 'waiting' | 'received' | 'composing' | 'sent'

function StepTest({
  state,
  update,
  onActivate,
}: {
  state: SupportOnboardingState
  update: (patch: Partial<SupportOnboardingState>) => void
  onActivate: () => void
}) {
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')

  function runTest() {
    if (!state.emailAddress) {
      toast.error('Configure an email address first (Step 1)')
      return
    }
    setTestStatus('waiting')
    setTimeout(() => setTestStatus('received'), 1800)
    setTimeout(() => setTestStatus('composing'), 3200)
    setTimeout(() => {
      setTestStatus('sent')
      update({ testEmailSent: true })
    }, 5000)
  }

  const statusLabels: Record<TestStatus, string> = {
    idle: '',
    waiting: 'Waiting for test email…',
    received: 'Email received — Lira is reading it',
    composing: 'Lira is composing reply…',
    sent: 'Reply sent! Test successful.',
  }

  return (
    <div className="space-y-6">
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
        {CHECK_ITEMS.map((item) => {
          const good = item.ok(state)
          return (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                  good ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                )}
              >
                {good ? <CheckIcon className="h-3.5 w-3.5" /> : '—'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.detail(state)}</p>
              </div>
              {!good && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  Optional
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Live test */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="mb-1 text-sm font-semibold text-gray-800">Send a live test email</p>
        <p className="mb-4 text-xs text-gray-400">
          Send any email to{' '}
          <code className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">
            {state.emailAddress || 'your-support-email'}
          </code>{' '}
          — Lira will respond within 30 seconds.
        </p>

        {testStatus === 'idle' && (
          <button
            onClick={runTest}
            disabled={!state.emailAddress}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            <BoltIcon className="h-4 w-4" />
            Run test
          </button>
        )}

        {testStatus !== 'idle' && (
          <div className="space-y-2">
            {(['waiting', 'received', 'composing', 'sent'] as TestStatus[]).map((s) => {
              const statuses: TestStatus[] = ['waiting', 'received', 'composing', 'sent']
              const statusIndex = statuses.indexOf(testStatus)
              const thisIndex = statuses.indexOf(s)
              const done = thisIndex < statusIndex
              const active = s === testStatus

              if (s === 'idle') return null
              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      done ? 'bg-green-500' : active ? 'bg-violet-500 animate-pulse' : 'bg-gray-200'
                    )}
                  />
                  <span
                    className={cn(
                      done ? 'text-gray-500 line-through' : active ? 'font-medium text-gray-900' : 'text-gray-300'
                    )}
                  >
                    {statusLabels[s]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activate */}
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6 text-center">
        <SparklesIcon className="mx-auto mb-3 h-8 w-8 text-violet-500" />
        <h3 className="text-base font-bold text-gray-900">Ready to go live?</h3>
        <p className="mt-1 text-sm text-gray-500">
          Lira will start monitoring your support email and responding autonomously.
        </p>
        <button
          onClick={onActivate}
          className="mt-5 flex items-center gap-2 mx-auto rounded-xl bg-violet-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-95"
        >
          Activate Customer Support
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => toast.info('Progress saved — you can return any time')}
          className="mt-2 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          Save and finish later
        </button>
      </div>
    </div>
  )
}

// ── Left illustrative panel ───────────────────────────────────────────────────
const STEP_LEFT: Record<
  SupportOnboardingStep,
  { headline: string; body: string; icon: React.ComponentType<{ className?: string }> }
> = {
  email: {
    headline: 'Your support\ninbox, powered\nby Lira',
    body: 'Connect the email address your customers already use. Lira monitors every inbound message and replies on your behalf — instantly.',
    icon: EnvelopeIcon,
  },
  widget: {
    headline: 'Chat anywhere,\nanytime',
    body: 'Embed Lira\'s chat widget on any page of your product or website. Customers get instant answers — 24/7, zero wait time.',
    icon: ChatBubbleLeftEllipsisIcon,
  },
  voice: {
    headline: 'She picks up\nevery call',
    body: 'No hold music. No IVR. No "press 1 for billing." Lira speaks with full context from the moment the call connects.',
    icon: MicrophoneIcon,
  },
  integrations: {
    headline: 'She doesn\'t\njust talk.\nShe acts.',
    body: 'Connect your tools and Lira can create tickets, update CRM records, message your team, and follow up with customers — all in one autonomous chain.',
    icon: CpuChipIcon,
  },
  knowledge: {
    headline: 'What Lira\nknows, she\nresolves',
    body: 'Every page you index becomes an answer Lira can give. The more you add, the fewer escalations — and Lira fills in the gaps automatically from every conversation.',
    icon: SparklesIcon,
  },
  api: {
    headline: 'Proactive, not\nreactive',
    body: 'Your webhook is the trigger. When a payment fails, a KYC stalls, or any event fires — Lira reaches out to the customer before they even feel the problem.',
    icon: BoltIcon,
  },
  test: {
    headline: 'Almost live',
    body: 'Run a quick test to confirm the whole pipeline is working, then flip the switch. From this moment on, Lira handles your support.',
    icon: CheckCircleIcon,
  },
}

// ── Main component ─────────────────────────────────────────────────────────────
const STEP_ORDER: SupportOnboardingStep[] = [
  'email',
  'widget',
  'voice',
  'integrations',
  'knowledge',
  'api',
  'test',
]

interface SupportOnboardingPageProps {
  modalMode?: boolean
  onClose?: () => void
  onActivated?: () => void
}

export function SupportOnboardingPage({ modalMode = false, onClose, onActivated }: SupportOnboardingPageProps = {}) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [currentStep, setCurrentStep] = useState<SupportOnboardingStep>(() => {
    const saved = localStorage.getItem('lira_support_onboarding_step') as SupportOnboardingStep | null
    return (saved && STEP_ORDER.includes(saved)) ? saved : STEP_ORDER[0]
  })
  const [state, setState] = useState<SupportOnboardingState>(defaultOnboardingState)
  const [activated, setActivated] = useState(false)

  const currentIndex = STEP_ORDER.indexOf(currentStep)

  // Persist step progress so the user can resume after leaving
  useEffect(() => {
    localStorage.setItem('lira_support_onboarding_step', currentStep)
  }, [currentStep])

  function update(patch: Partial<SupportOnboardingState>) {
    setState((s) => ({ ...s, ...patch }))
  }

  function goNext() {
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1])
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
    }
  }

  function handleActivate() {
    localStorage.setItem('lira_support_activated', 'true')
    localStorage.removeItem('lira_support_onboarding_step')
    setActivated(true)
  }

  // ── Activation success screen ───────────────────────────────────────────────
  if (activated) {
    return (
      <div style={{ ...(modalMode ? { position: 'fixed', inset: 0, zIndex: 60 } : { minHeight: '100vh' }), background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: isMobile ? 16 : 24 }}>
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: isMobile ? 16 : 24, padding: isMobile ? 24 : 48, maxWidth: isMobile ? '100%' : 540, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleSolid style={{ width: 36, height: 36, color: '#059669' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D1FAE5', borderRadius: 9999, padding: '4px 12px', margin: '0 auto' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#059669', animation: 'pulse 2s infinite' }} />
              <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#059669' }}>Live</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: DARK }}>Lira Customer Support is live.</span>
            <span style={{ fontWeight: 400, fontSize: 16, color: MUTED }}>Emails are being monitored. Lira is ready to respond.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%' }}>
            {[
              { label: 'Email channel', status: 'Active' },
              { label: 'Chat widget', status: 'Active' },
              { label: 'Knowledge base', status: 'Indexed' },
            ].map((item) => (
              <div key={item.label} style={{ background: BG, boxShadow: NEU_INSET, borderRadius: 16, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 11, color: DARK }}>{item.label}</span>
                <span style={{ background: '#D1FAE5', color: '#059669', fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 9999, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.status}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => modalMode ? onActivated?.() : navigate('/support/home')}
            style={{ background: PRIMARY, borderRadius: 24, padding: '14px 32px', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}
          >
            Go to Support dashboard
            <ArrowRightIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...(modalMode ? { position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto' } : { minHeight: '100vh' }), background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Reduced Header (Figma node 1-78) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 32px', height: 64, flexShrink: 0 }}>
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: '8px 20px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 20, color: PRIMARY, letterSpacing: '-0.02em' }}>Lira</span>
        </div>
        <button
          onClick={() => onClose ? onClose() : navigate('/support')}
          style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <XMarkIcon style={{ width: 16, height: 16, color: MUTED }} />
        </button>
      </div>

      {/* ── Main scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '16px 16px 48px' : '24px 32px 64px', gap: 28 }}>
        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 800 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Setup Progress</span>
            <span style={{ fontWeight: 500, fontSize: 12, color: MUTED }}>Step {currentIndex + 1} of {STEP_ORDER.length}</span>
          </div>
          <div style={{ background: '#E5E7ED', boxShadow: NEU_INSET, borderRadius: 9999, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${((currentIndex + 1) / STEP_ORDER.length) * 100}%`, height: '100%', background: `linear-gradient(90deg, #818CF8, ${PRIMARY})`, borderRadius: 9999, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Step card */}
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 800, background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: isMobile ? 20 : 40 }}>
          {/* Step segment indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
            {STEP_ORDER.map((_, i) => (
              <div key={i} style={{ height: 4, flex: 1, borderRadius: 9999, background: i <= currentIndex ? PRIMARY : DIVIDER, transition: 'background 0.2s' }} />
            ))}
          </div>
          {/* Step badge */}
          <div style={{ background: '#EEF2FF', display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 9999, marginBottom: 28 }}>
            <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY }}>
              Step {currentIndex + 1} of 7 — {ONBOARDING_STEPS[currentIndex]?.label}
            </span>
          </div>

          {/* Step content */}
          {currentStep === 'email' && <StepEmail state={state} update={update} />}
          {currentStep === 'widget' && <StepWidget state={state} update={update} />}
          {currentStep === 'voice' && <StepVoice state={state} update={update} />}
          {currentStep === 'integrations' && <StepIntegrations state={state} update={update} />}
          {currentStep === 'knowledge' && <StepKnowledge state={state} update={update} />}
          {currentStep === 'api' && <StepApi state={state} update={update} />}
          {currentStep === 'test' && <StepTest state={state} update={update} onActivate={handleActivate} />}
        </div>

        {/* Navigation */}
        {currentStep !== 'test' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: isMobile ? '100%' : 800 }}>
            <button
              onClick={goBack}
              disabled={currentIndex === 0}
              style={{ background: currentIndex === 0 ? 'transparent' : BG, boxShadow: currentIndex === 0 ? 'none' : NEU_SHADOW, borderRadius: 24, padding: '12px 24px', border: 'none', cursor: currentIndex === 0 ? 'default' : 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: currentIndex === 0 ? 'transparent' : MUTED, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ArrowLeftIcon style={{ width: 14, height: 14 }} />
              Back
            </button>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {(currentStep === 'voice' || currentStep === 'integrations' || currentStep === 'knowledge') && (
                <button
                  onClick={goNext}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, color: MUTED }}
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={goNext}
                style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: '12px 28px', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: PRIMARY, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Continue
                <ArrowRightIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Keep LeftIcon / leftInfo references to avoid TS errors on unused vars ─────
// (STEP_LEFT is kept for reference but not rendered in the neumorphic layout)
void (STEP_LEFT as unknown)

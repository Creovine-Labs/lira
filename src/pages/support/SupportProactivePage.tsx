import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowRightIcon,
  BoltIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CodeBracketSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  createTrigger,
  updateTrigger,
  deleteTrigger,
  testFireTrigger,
  type ProactiveTrigger,
  type ProactiveChannel,
  type TriggerCondition,
} from '@/services/api/support-api'
import { cn } from '@/lib'

const TABS = [
  { key: 'triggers', label: 'Triggers', icon: BoltIcon },
  { key: 'activity', label: 'Activity Log', icon: ClockIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

const CHANNEL_OPTIONS: Array<{
  key: ProactiveChannel
  label: string
  description: string
}> = [
  {
    key: 'email',
    label: 'Email',
    description: 'Send to the customer email address in Lira.',
  },
  {
    key: 'widget',
    label: 'In-app widget',
    description: 'Show the outreach inside the embedded Lira widget.',
  },
]

function channelLabel(channel: ProactiveChannel | string) {
  return CHANNEL_OPTIONS.find((option) => option.key === channel)?.label ?? channel
}

// ── Shared copy button ─────────────────────────────────────────────────────────

function CopyButton({ text, size = 'xs' }: { text: string; size?: 'xs' | 'sm' }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white font-semibold text-gray-500 hover:bg-gray-50 transition',
        size === 'xs' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
      )}
    >
      {copied ? (
        <>
          <ClipboardDocumentCheckIcon className="h-3 w-3 text-emerald-500" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

// ── Webhook details (shared between setup wizard and collapsible panel) ────────

function WebhookDetails({ orgId }: { orgId: string }) {
  const endpoint = `https://api.creovine.com/lira/v1/support/webhooks/inbound/${orgId}`
  const nodeSnippet = `const crypto = require('crypto');

// Fire this from your backend whenever an event occurs:
const body = JSON.stringify({
  event: 'payment.failed',        // must match your trigger's Event Type
  customerId: customer.id,        // your customer's ID in Lira
  data: { amount: 49.00 }         // any extra context
});

const sig = crypto
  .createHmac('sha256', process.env.LIRA_ORG_ID)   // signing key = your org ID
  .update(body)
  .digest('hex');

await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-lira-signature': sig,
  },
  body,
});`

  return (
    <div className="space-y-4">
      {/* Endpoint */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Inbound webhook endpoint
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-xl bg-gray-950 px-3 py-2.5 text-[11px] text-gray-200 whitespace-nowrap">
            POST {endpoint}
          </code>
          <CopyButton text={`POST ${endpoint}`} />
        </div>
      </div>

      {/* Signing key callout */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-800 leading-5">
        <span className="font-semibold">Signing key:</span> your Lira org ID (
        <code className="bg-amber-100 px-1 rounded">{orgId}</code>). Use it as the HMAC-SHA256
        secret when building the <code className="bg-amber-100 px-1 rounded">x-lira-signature</code>{' '}
        header. Store it as an environment variable — never hard-code it.
      </div>

      {/* Code snippet */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Node.js example
        </p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl bg-gray-950 px-4 py-4 text-[11px] leading-relaxed text-gray-200 whitespace-pre">
            {nodeSnippet}
          </pre>
          <div className="absolute top-2.5 right-2.5">
            <CopyButton text={nodeSnippet} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-5">
        The <code className="bg-gray-100 px-1 rounded text-gray-600">event</code> field must match
        the <span className="font-medium">Event Type</span> you set on a trigger exactly. The{' '}
        <code className="bg-gray-100 px-1 rounded text-gray-600">customerId</code> must match a
        record in <span className="font-medium">Support → Customers</span>. Lira will match the
        event, look up the customer, and deliver the outreach through the channel you choose.
      </p>
    </div>
  )
}

// ── Collapsible webhook panel (shown when triggers exist) ──────────────────────

function BackendEventPanel({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  if (!orgId) return null
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <CodeBracketSquareIcon className="h-4 w-4 text-[#020308]" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Backend event endpoint</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Send events from your backend to fire these triggers
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#020308]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <WebhookDetails orgId={orgId} />
        </div>
      )}
    </div>
  )
}

// ── First-time setup wizard (shown when no triggers exist) ─────────────────────

type SetupStep = 'how-it-works' | 'connect' | 'create'

const WIZARD_EXAMPLES = [
  {
    event: 'Trial expires in 3 days',
    message: 'Send a friendly reminder through the best channel',
  },
  { event: 'Payment method declined', message: 'Send billing update instructions immediately' },
  { event: 'New feature just launched', message: 'Notify active customers automatically' },
  { event: 'License renews in 7 days', message: 'Send a heads-up so there are no surprises' },
]

function ProactiveSetupWizard({ orgId, onCreate }: { orgId: string; onCreate: () => void }) {
  const [step, setStep] = useState<SetupStep>('how-it-works')
  const [showTechDetails, setShowTechDetails] = useState(false)

  return (
    <div className="rounded-2xl border border-white/60 bg-white shadow-sm overflow-hidden">
      {/* Progress bar */}
      <div className="flex items-stretch border-b border-gray-100">
        {(['how-it-works', 'connect', 'create'] as SetupStep[]).map((s, i) => {
          const steps = ['how-it-works', 'connect', 'create'] as SetupStep[]
          const currentIndex = steps.indexOf(step)
          const isActive = s === step
          const isDone = steps.indexOf(s) < currentIndex
          const labels = ['How it works', 'Connect your product', 'Create a rule']
          return (
            <button
              key={s}
              onClick={() => isDone && setStep(s)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-[11px] font-semibold transition',
                isActive
                  ? 'bg-[#020308] text-white'
                  : isDone
                    ? 'text-[#020308] hover:bg-gray-50'
                    : 'text-gray-300 cursor-default'
              )}
            >
              {isDone ? (
                <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]',
                    isActive ? 'border-white' : 'border-current'
                  )}
                >
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{labels[i]}</span>
            </button>
          )
        })}
      </div>

      {/* Step 1 — How it works */}
      {step === 'how-it-works' && (
        <div className="px-6 py-6 space-y-5">
          <div>
            <p className="text-sm font-bold text-gray-900">
              Send the right outreach at exactly the right time
            </p>
            <p className="mt-1.5 text-xs text-gray-500 leading-5">
              Proactive lets you automatically reach customers when something important happens in
              your product — without anyone on your team doing it manually. You define the rule,
              choose the delivery channel, and Lira handles the rest.
            </p>
          </div>

          {/* Examples */}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            For example
          </p>
          <div className="space-y-2">
            {WIZARD_EXAMPLES.map((ex, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#020308]/10">
                  <BoltIcon className="h-3 w-3 text-[#020308]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{ex.event}</p>
                  <p className="text-xs text-gray-400">→ {ex.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setStep('connect')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#020308] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#020308] transition"
            >
              Set this up for my product
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Connect your product */}
      {step === 'connect' && (
        <div className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Connect your product to Lira</p>
            <p className="mt-1.5 text-xs text-gray-500 leading-5">
              Your product needs to notify Lira when an event happens. This is a one-time technical
              setup — your developer sends a small signal to Lira whenever something important
              occurs (like a payment failing or a trial expiring).
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-800">What your developer does</p>
            <ul className="space-y-1 text-xs text-gray-700 leading-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                Call one URL on your Lira account whenever an event occurs
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                Pass the event name, the customer ID, and any extra details
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                Lira matches it to your rule and sends outreach through your selected channel
              </li>
            </ul>
          </div>

          {/* Tech details — collapsed by default */}
          <button
            onClick={() => setShowTechDetails((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#020308] hover:text-[#020308] transition"
          >
            <CodeBracketSquareIcon className="h-3.5 w-3.5" />
            {showTechDetails ? 'Hide' : 'Show'} technical details
          </button>

          {showTechDetails && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
              <WebhookDetails orgId={orgId} />
            </div>
          )}

          <p className="text-[11px] text-gray-400 leading-5">
            Want the full step-by-step guide?{' '}
            <a
              href="https://docs.liraintelligence.com/platform/customer-support/proactive"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#020308] underline underline-offset-2 hover:text-[#020308]"
            >
              Read the setup guide →
            </a>
          </p>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setStep('how-it-works')}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep('create')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#020308] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#020308] transition"
            >
              My developer is on it — next
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Create first rule */}
      {step === 'create' && (
        <div className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Create your first automated rule</p>
            <p className="mt-1.5 text-xs text-gray-500 leading-5">
              A rule says: "when <em>this event</em> happens, send <em>this message</em> to that
              customer." You can have as many rules as you need.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <BoltIcon className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-xs text-gray-500 mb-1 font-medium">Common first rules</p>
            <p className="text-xs text-gray-400 mb-4">
              Trial expiry · Payment failed · License renewal · New feature alert
            </p>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#020308] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#020308] transition"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Create my first rule
            </button>
          </div>

          <button
            onClick={() => setStep('connect')}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}

function SupportProactivePage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { config, configLoading } = useSupportStore()
  const loadStarted = useRef(false)

  useEffect(() => {
    if (configLoading) loadStarted.current = true
  }, [configLoading])

  useEffect(() => {
    if (!loadStarted.current) return
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  if (!currentOrgId || configLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Proactive</h1>
            <p className="mt-1 text-sm text-gray-400">
              Configure automated triggers and proactive customer outreach
            </p>
          </div>
          <a
            href="https://docs.liraintelligence.com/platform/customer-support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Docs
          </a>
        </div>
        <SupportProactivePanel />
      </div>
    </div>
  )
}

function SupportProactivePanel() {
  const [activeTab, setProactiveTab] = useState<TabKey>('triggers')
  const { currentOrgId } = useOrgStore()
  const { userEmail } = useAuthStore()
  const { triggers, triggersLoading, loadTriggers, outreachLogs, loadOutreachLogs } =
    useSupportStore()
  // Per-trigger "Test fire" panel state
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    event_type: '',
    outreach_template: '',
    channels: ['email'] as ProactiveChannel[],
    cooldown_hours: 24,
    max_per_customer_per_day: 1,
    conditions: [] as TriggerCondition[],
  })

  useEffect(() => {
    if (!currentOrgId) return
    loadTriggers(currentOrgId)
    loadOutreachLogs(currentOrgId)
  }, [currentOrgId, loadTriggers, loadOutreachLogs])

  const handleChannelClick = useCallback((key: ProactiveChannel) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(key)
        ? f.channels.filter((c) => c !== key)
        : [...f.channels, key],
    }))
  }, [])

  const handleCreate = useCallback(async () => {
    if (!currentOrgId || !form.name.trim() || !form.event_type.trim()) return
    setCreating(true)
    try {
      await createTrigger(currentOrgId, {
        name: form.name.trim(),
        event_type: form.event_type.trim(),
        outreach_template: form.outreach_template.trim(),
        channels: form.channels,
        cooldown_hours: form.cooldown_hours,
        max_per_customer_per_day: form.max_per_customer_per_day,
        conditions: form.conditions,
        enabled: true,
      })
      setForm({
        name: '',
        event_type: '',
        outreach_template: '',
        channels: ['email'],
        cooldown_hours: 24,
        max_per_customer_per_day: 1,
        conditions: [],
      })
      setShowCreate(false)
      toast.success('Trigger created')
      loadTriggers(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trigger')
    } finally {
      setCreating(false)
    }
  }, [currentOrgId, form, loadTriggers])

  const handleToggle = useCallback(
    async (trigger: ProactiveTrigger) => {
      if (!currentOrgId) return
      try {
        await updateTrigger(currentOrgId, trigger.trigger_id, {
          enabled: !trigger.enabled,
        })
        loadTriggers(currentOrgId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update')
      }
    },
    [currentOrgId, loadTriggers]
  )

  const handleDelete = useCallback(
    async (triggerId: string) => {
      if (!currentOrgId) return
      try {
        await deleteTrigger(currentOrgId, triggerId)
        toast.success('Trigger deleted')
        loadTriggers(currentOrgId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      }
    },
    [currentOrgId, loadTriggers]
  )

  const openTest = useCallback(
    (triggerId: string) => {
      setTestingId((cur) => (cur === triggerId ? null : triggerId))
      setTestEmail((cur) => cur || userEmail || '')
    },
    [userEmail]
  )

  const handleTestFire = useCallback(
    async (triggerId: string) => {
      if (!currentOrgId || !testEmail.trim()) return
      setTestSending(true)
      try {
        const res = await testFireTrigger(currentOrgId, triggerId, testEmail.trim())
        toast.success(
          res.sandbox
            ? `Sandbox: outreach previewed (not sent). Switch to production to send for real.`
            : `Test outreach sent to ${testEmail.trim()}`
        )
        setTestingId(null)
        loadOutreachLogs(currentOrgId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send test')
      } finally {
        setTestSending(false)
      }
    },
    [currentOrgId, testEmail, loadOutreachLogs]
  )

  // While loading, show spinner
  if (triggersLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  // ── First-time setup: no triggers yet → show activation wizard ──────
  if (!triggersLoading && triggers.length === 0 && !showCreate) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-base font-bold text-gray-900">Proactive Messaging</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Automatically reach customers through the right channel when something important happens
            in your product.
          </p>
        </div>
        <ProactiveSetupWizard orgId={currentOrgId ?? ''} onCreate={() => setShowCreate(true)} />
      </div>
    )
  }

  // ── Normal view: at least one trigger exists (or create form just opened) ──
  return (
    <>
      {/* Action bar */}
      {activeTab === 'triggers' && (
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#020308] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#020308] transition"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New Rule
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setProactiveTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-[#020308] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Webhook panel (collapsible, always accessible) */}
      {activeTab === 'triggers' && <BackendEventPanel orgId={currentOrgId ?? ''} />}

      {/* Create trigger form */}
      {showCreate && (
        <div className="mb-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">New Rule</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="trigger-name"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Trigger Name
                </label>
                <input
                  id="trigger-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Payment Failed Alert"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#020308] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="trigger-event-type"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Event Type
                </label>
                <input
                  id="trigger-event-type"
                  type="text"
                  value={form.event_type}
                  onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                  placeholder="payment.failed"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#020308] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="trigger-template"
                className="mb-1 block text-xs font-semibold text-gray-500"
              >
                Message Template
              </label>
              <textarea
                id="trigger-template"
                value={form.outreach_template}
                onChange={(e) => setForm((f) => ({ ...f, outreach_template: e.target.value }))}
                rows={3}
                placeholder={'Hi {{customer.name}}, we noticed your payment failed…'}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#020308] focus:outline-none"
              />
            </div>
            <div>
              <div>
                <p className="mb-1 block text-xs font-semibold text-gray-500">Delivery Channel</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CHANNEL_OPTIONS.map((option) => {
                    const selected = form.channels.includes(option.key)
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleChannelClick(option.key)}
                        className={cn(
                          'relative rounded-xl border px-3 py-2 text-left transition',
                          selected
                            ? 'border-[#020308] bg-gray-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        {selected && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#020308]">
                            <CheckIcon className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        <span className="block text-xs font-bold text-gray-800">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-gray-400">
                          {option.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="trigger-cooldown"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Cooldown (hrs)
                </label>
                <input
                  id="trigger-cooldown"
                  type="number"
                  min={1}
                  value={form.cooldown_hours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cooldown_hours: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#020308] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="trigger-max-day"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Max/Day
                </label>
                <input
                  id="trigger-max-day"
                  type="number"
                  min={1}
                  value={form.max_per_customer_per_day}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_per_customer_per_day: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#020308] focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim() || !form.event_type.trim()}
              className="rounded-xl bg-[#020308] px-4 py-2 text-xs font-semibold text-white hover:bg-[#020308] disabled:opacity-50 transition"
            >
              {creating ? 'Creating…' : 'Create Rule'}
            </button>
          </div>
        </div>
      )}

      {/* Triggers list */}
      {activeTab === 'triggers' && (
        <div className="space-y-2">
          {triggers.map((trigger) => (
            <div
              key={trigger.trigger_id}
              className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl',
                    trigger.enabled ? 'bg-green-100' : 'bg-gray-100'
                  )}
                >
                  <BoltIcon
                    className={cn('h-4 w-4', trigger.enabled ? 'text-green-600' : 'text-gray-400')}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{trigger.name}</p>
                  <p className="text-xs text-gray-400">
                    Event: <code className="text-gray-500">{trigger.event_type}</code> · Channels:{' '}
                    {(
                      (trigger.channels ??
                        (trigger.channel ? [trigger.channel] : [])) as ProactiveChannel[]
                    )
                      .map(channelLabel)
                      .join(', ')}{' '}
                    · Cooldown: {trigger.cooldown_hours}h
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => openTest(trigger.trigger_id)}
                    className="rounded-lg bg-[#020308] px-2.5 py-1 text-[10px] font-bold uppercase text-white transition hover:bg-gray-800"
                  >
                    Test fire
                  </button>
                  <button
                    onClick={() => handleToggle(trigger)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition',
                      trigger.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {trigger.enabled ? 'On' : 'Off'}
                  </button>
                  <button
                    onClick={() => handleDelete(trigger.trigger_id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {testingId === trigger.trigger_id && (
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="mb-2 text-xs text-gray-500">
                    Send a one-off test of this outreach. Choose where it lands.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 focus:border-[#020308] focus:outline-none"
                    />
                    <button
                      onClick={() => handleTestFire(trigger.trigger_id)}
                      disabled={testSending || !testEmail.trim()}
                      className="rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {testSending ? 'Sending…' : 'Send test'}
                    </button>
                    <button
                      onClick={() => setTestingId(null)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Activity log */}
      {activeTab === 'activity' && (
        <>
          {outreachLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
              <ClockIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No outreach activity yet</p>
              <p className="mt-1 max-w-sm text-center text-xs leading-5 text-gray-400">
                Activity appears here after a product event matches one of your triggers. You will
                see whether Lira sent, skipped, or failed each outreach attempt.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {outreachLogs.map((log) => (
                    <tr key={log.outreach_id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {log.trigger_name ?? log.trigger_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.customer_name ?? log.customer_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.channel}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                            log.status === 'sent' || log.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : log.status === 'skipped'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(log.sent_at ?? log.created_at ?? '').toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}

export { SupportProactivePage, SupportProactivePanel }

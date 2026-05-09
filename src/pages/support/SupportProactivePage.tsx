import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CodeBracketSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  createTrigger,
  updateTrigger,
  deleteTrigger,
  type ProactiveTrigger,
  type ProactiveChannel,
  type TriggerCondition,
} from '@/services/api/support-api'
import {
  getSlackStatus,
  getTwilioStatus,
  connectTwilio,
  getWebPushVapidKey,
  getWebPushStatus,
} from '@/services/api'
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
  setupType: 'none' | 'twilio' | 'slack' | 'web_push' | 'mobile_push'
}> = [
  {
    key: 'email',
    label: 'Email',
    description: 'Send to the customer email address in Lira.',
    setupType: 'none',
  },
  {
    key: 'widget',
    label: 'In-app widget',
    description: 'Show the outreach inside the embedded Lira widget.',
    setupType: 'none',
  },
  {
    key: 'sms',
    label: 'SMS',
    description: 'Text the customer phone number in Lira.',
    setupType: 'twilio',
  },
  {
    key: 'slack',
    label: 'Slack DM',
    description: 'DM a matching Slack user, or post to the default Slack channel.',
    setupType: 'slack',
  },
  {
    key: 'web_push',
    label: 'Web push',
    description: 'Browser push notifications for web customers.',
    setupType: 'web_push',
  },
  {
    key: 'mobile_push',
    label: 'Mobile push',
    description: 'Push to your iOS or Android app users.',
    setupType: 'mobile_push',
  },
]

// ── Channel Setup Modal ───────────────────────────────────────────────────────

function WebPushSetupModal({
  orgId,
  onClose,
  onConnected,
}: {
  orgId: string
  onClose: () => void
  onConnected: () => void
}) {
  const [vapidKey, setVapidKey] = useState('')
  const [checking, setChecking] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedSw, setCopiedSw] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getWebPushVapidKey(orgId)
      .then((r) => setVapidKey(r.publicKey))
      .catch(() => {})
  }, [orgId])

  const swContent = `// Save this file as /lira-sw.js at the root of your website
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'New message', {
      body: data.body ?? '',
      icon: '/favicon.ico',
    })
  )
})`

  const snippet = `<!-- Add this once, after your Lira widget script -->
<script>
(function () {
  var VAPID_KEY = '${vapidKey || 'YOUR_VAPID_PUBLIC_KEY'}';
  var ORG_ID   = '${orgId}';
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  navigator.serviceWorker.register('/lira-sw.js').then(function (reg) {
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') return;
      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_KEY
      }).then(function (sub) {
        var json = sub.toJSON();
        return fetch('https://api.creovine.com/lira/v1/support/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId: ORG_ID,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            visitorId: localStorage.getItem('lira_visitor_id') || undefined
          })
        });
      });
    });
  });
})();
</script>`

  const handleCheckConnection = async () => {
    setChecking(true)
    try {
      const status = await getWebPushStatus(orgId)
      if (status.connected) {
        toast.success(
          `Connected — ${status.subscriptionCount} push subscriber${status.subscriptionCount !== 1 ? 's' : ''}`
        )
        onConnected()
      } else {
        toast.error('No push subscriptions yet. Complete the steps below first.')
      }
    } catch {
      toast.error('Could not check status')
    } finally {
      setChecking(false)
    }
  }

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true)
      setTimeout(() => setter(false), 2000)
    })
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/60 bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <h3 className="text-sm font-bold text-gray-900">Set up Web Push</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500 leading-5">
            Web push lets Lira send browser notifications to your customers even when they are not
            on your site. Complete these <strong>3 steps</strong> once — all future subscribers are
            stored automatically.
          </p>

          {/* Step 1 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-bold text-gray-800">Step 1 — Add the service worker file</p>
            <p className="text-xs text-gray-500 leading-5">
              Create a file called{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">lira-sw.js</code> at the
              root of your website (e.g.{' '}
              <code className="text-[11px]">https://yourdomain.com/lira-sw.js</code>). Paste this
              content:
            </p>
            <div className="relative rounded-lg bg-gray-900 px-3 py-3">
              <pre className="overflow-x-auto text-[10px] leading-5 text-gray-100 whitespace-pre">
                {swContent}
              </pre>
              <button
                onClick={() => copy(swContent, setCopiedSw)}
                className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-300 hover:bg-gray-700"
              >
                {copiedSw ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-bold text-gray-800">
              Step 2 — Add the subscription snippet to your site
            </p>
            <p className="text-xs text-gray-500 leading-5">
              Add this script tag to your site's HTML, <strong>after</strong> the Lira widget
              script. It requests permission and registers each visitor's browser with Lira
              automatically.
            </p>
            {vapidKey ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500">
                    Your VAPID public key:
                  </span>
                  <code className="flex-1 truncate rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                    {vapidKey}
                  </code>
                  <button
                    onClick={() => copy(vapidKey, setCopiedKey)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#3730a3] hover:bg-indigo-50"
                  >
                    {copiedKey ? 'Copied' : 'Copy key'}
                  </button>
                </div>
                <div className="relative rounded-lg bg-gray-900 px-3 py-3">
                  <pre className="overflow-x-auto text-[10px] leading-5 text-gray-100 whitespace-pre">
                    {snippet}
                  </pre>
                  <button
                    onClick={() => copy(snippet, setCopiedSnippet)}
                    className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-300 hover:bg-gray-700"
                  >
                    {copiedSnippet ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-gray-400">Loading your VAPID key…</p>
            )}
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-bold text-gray-800">Step 3 — Verify connection</p>
            <p className="text-xs text-gray-500 leading-5">
              Open your site in a browser, allow the notification prompt. Then click the button
              below — once at least one subscription is registered, the Web Push channel is marked
              as connected.
            </p>
            <button
              onClick={handleCheckConnection}
              disabled={checking}
              className="w-full rounded-xl bg-[#3730a3] py-2 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
            >
              {checking ? 'Checking…' : 'Check connection'}
            </button>
          </div>

          <a
            href="https://docs.liraintelligence.com/platform/customer-support/proactive#web-push"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[11px] font-semibold text-[#3730a3] hover:underline"
          >
            Full setup guide →
          </a>
        </div>
      </div>
    </div>
  )
}

function ChannelSetupModal({
  channelKey,
  orgId,
  onClose,
  onConnected,
}: {
  channelKey: ProactiveChannel
  orgId: string
  onClose: () => void
  onConnected: () => void
}) {
  const option = CHANNEL_OPTIONS.find((o) => o.key === channelKey)!
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [fromNumber, setFromNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  if (channelKey === 'web_push') {
    return <WebPushSetupModal orgId={orgId} onClose={onClose} onConnected={onConnected} />
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleTwilioConnect = async () => {
    if (!accountSid.trim() || !authToken.trim() || !fromNumber.trim()) return
    setSaving(true)
    try {
      await connectTwilio(orgId, {
        accountSid: accountSid.trim(),
        authToken: authToken.trim(),
        fromNumber: fromNumber.trim(),
      })
      toast.success('Twilio connected')
      onConnected()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect Twilio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">Set up {option.label}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          {option.setupType === 'twilio' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Connect your Twilio account to send SMS. You can find these in the{' '}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#3730a3] hover:underline"
                >
                  Twilio Console
                </a>
                .
              </p>
              <div>
                <label
                  htmlFor="twilio-account-sid"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Account SID
                </label>
                <input
                  id="twilio-account-sid"
                  type="text"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxx"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="twilio-auth-token"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Auth Token
                </label>
                <input
                  id="twilio-auth-token"
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Your auth token"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="twilio-from-number"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  From Number
                </label>
                <input
                  id="twilio-from-number"
                  type="text"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                  placeholder="+15550001234"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
              <button
                onClick={handleTwilioConnect}
                disabled={saving || !accountSid.trim() || !authToken.trim() || !fromNumber.trim()}
                className="w-full rounded-xl bg-[#3730a3] py-2 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
              >
                {saving ? 'Connecting…' : 'Connect Twilio'}
              </button>
            </div>
          )}
          {option.setupType === 'slack' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Slack requires OAuth authorization. Go to Integrations to connect your Slack
                workspace.
              </p>
              <a
                href="/org/integrations"
                className="block w-full rounded-xl bg-[#3730a3] py-2 text-center text-xs font-semibold text-white hover:bg-[#312e81] transition"
              >
                Go to Integrations → Slack
              </a>
            </div>
          )}
          {option.setupType === 'mobile_push' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 leading-5">
                Mobile push requires push credentials (APNs for iOS, FCM for Android) and your app
                to send device tokens to Lira. See the setup guide for the full integration steps.
              </p>
              <a
                href="https://docs.liraintelligence.com/platform/customer-support/proactive#mobile-push"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl bg-[#3730a3] py-2 text-center text-xs font-semibold text-white hover:bg-[#312e81] transition"
              >
                View Mobile Push Setup Guide
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

function WebhookIntegrationPanel({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false)
  if (!orgId) return null
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <CodeBracketSquareIcon className="h-4 w-4 text-[#3730a3]" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Webhook integration</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Send events from your backend to fire these triggers
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#3730a3]">{open ? 'Hide' : 'Show'}</span>
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
                  ? 'bg-[#3730a3] text-white'
                  : isDone
                    ? 'text-[#3730a3] hover:bg-indigo-50'
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
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3730a3]/10">
                  <BoltIcon className="h-3 w-3 text-[#3730a3]" />
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#312e81] transition"
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

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-indigo-800">What your developer does</p>
            <ul className="space-y-1 text-xs text-indigo-700 leading-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                Call one URL on your Lira account whenever an event occurs
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                Pass the event name, the customer ID, and any extra details
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                Lira matches it to your rule and sends outreach through your selected channel
              </li>
            </ul>
          </div>

          {/* Tech details — collapsed by default */}
          <button
            onClick={() => setShowTechDetails((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3730a3] hover:text-[#312e81] transition"
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
              className="font-semibold text-[#3730a3] underline underline-offset-2 hover:text-[#312e81]"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#312e81] transition"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#312e81] transition"
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
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportProactivePanel />
      </div>
    </div>
  )
}

function SupportProactivePanel() {
  const [activeTab, setProactiveTab] = useState<TabKey>('triggers')
  const { currentOrgId } = useOrgStore()
  const { triggers, triggersLoading, loadTriggers, outreachLogs, loadOutreachLogs } =
    useSupportStore()
  const [slackConnected, setSlackConnected] = useState(false)
  const [twilioConnected, setTwilioConnected] = useState(false)
  const [webPushConnected, setWebPushConnected] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [setupModal, setSetupModal] = useState<ProactiveChannel | null>(null)
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
    getSlackStatus(currentOrgId)
      .then((status) => setSlackConnected(status.connected))
      .catch(() => setSlackConnected(false))
    getTwilioStatus(currentOrgId)
      .then((status) => setTwilioConnected(status.connected))
      .catch(() => setTwilioConnected(false))
    getWebPushStatus(currentOrgId)
      .then((status) => setWebPushConnected(status.connected))
      .catch(() => setWebPushConnected(false))
  }, [currentOrgId, loadTriggers, loadOutreachLogs])

  const refreshIntegrations = useCallback(() => {
    if (!currentOrgId) return
    getSlackStatus(currentOrgId)
      .then((s) => setSlackConnected(s.connected))
      .catch(() => setSlackConnected(false))
    getTwilioStatus(currentOrgId)
      .then((s) => setTwilioConnected(s.connected))
      .catch(() => setTwilioConnected(false))
    getWebPushStatus(currentOrgId)
      .then((s) => setWebPushConnected(s.connected))
      .catch(() => setWebPushConnected(false))
  }, [currentOrgId])

  const isChannelReady = useCallback(
    (key: ProactiveChannel) => {
      const option = CHANNEL_OPTIONS.find((o) => o.key === key)!
      if (option.setupType === 'twilio') return twilioConnected
      if (option.setupType === 'slack') return slackConnected
      if (option.setupType === 'web_push') return webPushConnected
      if (option.setupType === 'mobile_push') return false // requires native app integration
      return true
    },
    [twilioConnected, slackConnected, webPushConnected]
  )

  const handleChannelClick = useCallback(
    (key: ProactiveChannel) => {
      const option = CHANNEL_OPTIONS.find((o) => o.key === key)!
      const ready = isChannelReady(key)
      if (!ready && option.setupType !== 'none') {
        setSetupModal(key)
        return
      }
      setForm((f) => ({
        ...f,
        channels: f.channels.includes(key)
          ? f.channels.filter((c) => c !== key)
          : [...f.channels, key],
      }))
    },
    [isChannelReady]
  )

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

  // While loading, show spinner
  if (triggersLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
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
      {/* Channel setup modal */}
      {setupModal && currentOrgId && (
        <ChannelSetupModal
          channelKey={setupModal}
          orgId={currentOrgId}
          onClose={() => setSetupModal(null)}
          onConnected={() => {
            setSetupModal(null)
            refreshIntegrations()
            setForm((f) => ({
              ...f,
              channels: f.channels.includes(setupModal) ? f.channels : [...f.channels, setupModal],
            }))
          }}
        />
      )}
      {/* Action bar */}
      {activeTab === 'triggers' && (
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#312e81] transition"
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
                  ? 'bg-[#3730a3] text-white shadow-sm'
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
      {activeTab === 'triggers' && <WebhookIntegrationPanel orgId={currentOrgId ?? ''} />}

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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
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
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
              />
            </div>
            <div>
              <div>
                <p className="mb-1 block text-xs font-semibold text-gray-500">Delivery Channel</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CHANNEL_OPTIONS.map((option) => {
                    const selected = form.channels.includes(option.key)
                    const ready = isChannelReady(option.key)
                    const needsSetup = !ready && option.setupType !== 'none'
                    const isConnected = ready && option.setupType !== 'none'
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleChannelClick(option.key)}
                        className={cn(
                          'relative rounded-xl border px-3 py-2 text-left transition',
                          selected
                            ? 'border-[#3730a3] bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        {selected && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#3730a3]">
                            <CheckIcon className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        <span className="block text-xs font-bold text-gray-800">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-gray-400">
                          {option.description}
                        </span>
                        {isConnected && (
                          <span className="mt-1 block text-[10px] font-semibold text-green-600">
                            Connected
                          </span>
                        )}
                        {needsSetup && (
                          <span className="mt-1 block text-[10px] font-semibold text-amber-600">
                            Tap to connect →
                          </span>
                        )}
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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
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
              className="rounded-xl bg-[#3730a3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
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

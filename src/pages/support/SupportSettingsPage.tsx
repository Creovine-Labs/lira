import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  getSupportConfig,
  rotateWidgetSecret,
  updateSupportConfig,
  HANDOFF_TRIGGER_DEFAULTS,
} from '@/services/api/support-api'
import { getMobilePushStatus, getMyPlan, type MyPlan, type PlanTier } from '@/services/api'
import type { SupportConfig, HandoffTriggersConfig } from '@/services/api/support-api'

// ── Copy button helper ────────────────────────────────────────────────────────

function CopyButton({ text, size = 'sm' }: { text: string; size?: 'sm' | 'xs' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition ${size === 'xs' ? 'text-[10px]' : 'text-xs'}`}
    >
      {copied ? (
        <>
          <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

// ── Widget secret row ──────────────────────────────────────────────────────────

function WidgetSecretRow({
  secret,
  orgId,
  onRotate,
}: {
  secret: string
  orgId: string
  onRotate: (s: string) => void
}) {
  const [show, setShow] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleRotate = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setRotating(true)
    setConfirming(false)
    try {
      const newSecret = await rotateWidgetSecret(orgId)
      onRotate(newSecret)
      toast.success('Widget secret rotated — update your server integration before deploying')
    } catch {
      toast.error('Failed to rotate secret')
    } finally {
      setRotating(false)
    }
  }

  const displayed = show ? secret : secret.slice(0, 8) + '••••••••••••••••••••••••'

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 select-all">
        {displayed}
      </span>
      <button
        onClick={() => setShow((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
      <CopyButton text={secret} />
      <button
        onClick={handleRotate}
        disabled={rotating}
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${confirming ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
      >
        <ArrowPathIcon className={`h-3.5 w-3.5 ${rotating ? 'animate-spin' : ''}`} />
        {confirming ? 'Click again to confirm' : 'Rotate'}
      </button>
    </div>
  )
}

// ── Embed code generator ───────────────────────────────────────────────────────

function buildAnonymousEmbed(orgId: string, color?: string): string {
  const colorAttr = color ? `\n  data-color="${color}"` : ''
  return `<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="${orgId}"${colorAttr}
  data-position="bottom-right"
  async>
</script>`
}

function buildIdentifiedEmbed(orgId: string, color?: string): string {
  const colorAttr = color ? `\n  data-color="${color}"` : ''
  return `<!-- 1. Generate the HMAC signature server-side (Node.js example): -->
<!--
const crypto = require('crypto');
const sig = crypto
  .createHmac('sha256', process.env.LIRA_WIDGET_SECRET)
  .update(currentUser.email)
  .digest('hex');
-->

<!-- 2. Inject the signed identity into the script tag: -->
<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="${orgId}"${colorAttr}
  data-email="{{ currentUser.email }}"
  data-name="{{ currentUser.name }}"
  data-sig="{{ sig }}"
  data-position="bottom-right"
  async>
</script>`
}

// ── Mobile snippet builders ────────────────────────────────────────────────────

function buildFlutterSnippet(orgId: string, portalSlug: string): string {
  const url = `https://support.liraintelligence.com/${portalSlug}`
  return `// 1. Add to pubspec.yaml:
//    webview_flutter: ^4.10.0
//    firebase_messaging: ^15.2.5
//    http: ^1.3.0

// 2. Support screen (WebView):
import 'package:webview_flutter/webview_flutter.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});
  @override State<SupportScreen> createState() => _SupportScreenState();
}
class _SupportScreenState extends State<SupportScreen> {
  late final WebViewController _controller;
  @override void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('${url}'));
  }
  @override Widget build(BuildContext context) =>
    Scaffold(appBar: AppBar(title: const Text('Support')),
      body: WebViewWidget(controller: _controller));
}

// 3. Register push token on app start:
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> registerPushToken() async {
  await FirebaseMessaging.instance.requestPermission();
  final token = await FirebaseMessaging.instance.getToken();
  if (token == null) return;
  await http.post(
    Uri.parse('https://api.creovine.com/lira/v1/support/push/mobile/subscribe'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'orgId': '${orgId}', 'fcmToken': token, 'platform': 'ios'}),
  );
}`
}

function buildReactNativeSnippet(orgId: string, portalSlug: string): string {
  const url = `https://support.liraintelligence.com/${portalSlug}`
  return `// 1. Install packages:
//    npm install react-native-webview @react-native-firebase/app @react-native-firebase/messaging

// 2. Support screen (WebView):
import { WebView } from 'react-native-webview';
export function SupportScreen() {
  return (
    <WebView
      source={{ uri: '${url}' }}
      style={{ flex: 1 }}
    />
  );
}

// 3. Register push token on app start:
import messaging from '@react-native-firebase/messaging';

async function registerPushToken() {
  await messaging().requestPermission();
  const token = await messaging().getToken();
  await fetch('https://api.creovine.com/lira/v1/support/push/mobile/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId: '${orgId}', fcmToken: token, platform: 'ios' }),
  });
}`
}

// ── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${checked ? 'bg-[#020308]' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

// ── Handoff triggers (§6.2) ────────────────────────────────────────────────────

function HandoffTriggersSection({
  orgId,
  initial,
}: {
  orgId: string
  initial: HandoffTriggersConfig | undefined
}) {
  // Merge stored config over the built-in defaults so every field has a value.
  const merged = (): Required<HandoffTriggersConfig> => ({
    ...HANDOFF_TRIGGER_DEFAULTS,
    ...(initial ?? {}),
  })
  const [draft, setDraft] = useState<Required<HandoffTriggersConfig>>(merged)
  const [saved, setSaved] = useState<Required<HandoffTriggersConfig>>(merged)
  const [saving, setSaving] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const set = <K extends keyof HandoffTriggersConfig>(
    key: K,
    value: Required<HandoffTriggersConfig>[K]
  ) => setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await updateSupportConfig(orgId, { handoff_triggers: draft })
      setSaved(draft)
      toast.success('Handoff triggers saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const resetDefaults = () => setDraft({ ...HANDOFF_TRIGGER_DEFAULTS })

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BoltIcon className="h-4 w-4 text-[#020308]" />
          <h2 className="font-semibold text-gray-900 text-sm">Automatic handoff triggers</h2>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          When any of these fire, Lira opens a ticket for your team. The AI keeps chatting in
          parallel — these never silence it.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        <TriggerRow
          title="VIP customer"
          desc="A VIP or enterprise customer asks anything beyond a greeting."
          checked={draft.vip_auto_enabled}
          onChange={(v) => set('vip_auto_enabled', v)}
        />
        <TriggerRow
          title="Negative sentiment"
          desc="The customer turns frustrated or urgent after their first message."
          checked={draft.sentiment_enabled}
          onChange={(v) => set('sentiment_enabled', v)}
        />
        <TriggerRow
          title="Repeated failure"
          desc="The customer keeps coming back and the AI isn't closing it out."
          checked={draft.repeated_failure_enabled}
          onChange={(v) => set('repeated_failure_enabled', v)}
          threshold={{
            value: draft.repeated_failure_threshold,
            onChange: (n) => set('repeated_failure_threshold', n),
            suffix: 'messages',
            min: 2,
            max: 20,
          }}
        />
        <TriggerRow
          title="Going in circles"
          desc="The same question gets rephrased without the AI making progress."
          checked={draft.multi_turn_confusion_enabled}
          onChange={(v) => set('multi_turn_confusion_enabled', v)}
          threshold={{
            value: draft.multi_turn_confusion_threshold,
            onChange: (n) => set('multi_turn_confusion_threshold', n),
            suffix: 'similar messages',
            min: 2,
            max: 20,
          }}
        />
        <TriggerRow
          title="SLA pressure"
          desc="A conversation stays open and unresolved past the time window."
          checked={draft.sla_pressure_enabled}
          onChange={(v) => set('sla_pressure_enabled', v)}
          threshold={{
            value: draft.sla_pressure_minutes,
            onChange: (n) => set('sla_pressure_minutes', n),
            suffix: 'minutes',
            min: 1,
            max: 10080,
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50/60 border-t border-gray-100">
        <button
          onClick={resetDefaults}
          className="text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Reset to defaults
        </button>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#020308] px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
    </div>
  )
}

// ── Pilot & compliance controls (sandbox, currency, refusal, CBN SLA, KB freshness) ──
type PilotDraft = {
  currency: string
  financial_advice_refusal: boolean
  sla_acknowledge_hours: number
  sla_resolution_hours: number
  kb_stale_after_days: number
}

const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  SCALE: 'Scale',
  ENTERPRISE: 'Enterprise',
}

/**
 * Go-live confirmation — going live is the commercial event (billing starts,
 * plan limits replace sandbox caps), so it requires typing the org name.
 */
function GoLiveModal({
  orgName,
  busy,
  onConfirm,
  onClose,
}: {
  orgName: string
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const [plan, setPlan] = useState<MyPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    getMyPlan()
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setPlanLoading(false))
  }, [])

  const nameMatches = typed.trim() === orgName.trim() && orgName.trim().length > 0
  const price =
    plan === null
      ? null
      : plan.entitlements.basePriceUsd === null
        ? 'Custom pricing'
        : `$${plan.entitlements.basePriceUsd}/mo`
  const included =
    plan === null
      ? null
      : plan.entitlements.includedConversationsPerMonth === 0
        ? 'Unlimited conversations'
        : `${plan.entitlements.includedConversationsPerMonth.toLocaleString()} conversations / mo included`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/40"
        onClick={() => !busy && onClose()}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Go live</h3>
        <p className="mt-1 text-sm text-gray-500">
          Switch this workspace from sandbox to production.
        </p>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          {planLoading ? (
            <p className="text-sm text-gray-400">Loading your plan…</p>
          ) : plan ? (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {PLAN_TIER_LABELS[plan.tier]} plan
                {price ? <span className="ml-2 font-normal text-gray-500">{price}</span> : null}
              </p>
              {included && <p className="mt-0.5 text-xs text-gray-500">{included}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Plan details are unavailable right now — your invited plan applies when you go live.
            </p>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-700">
          Going live starts your billing period. Sandbox testing limits are replaced by your
          plan&apos;s volume.
        </p>

        <div className="mt-4">
          <label
            htmlFor="golive-confirm-name"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Type <span className="normal-case text-gray-900">{orgName}</span> to confirm
          </label>
          <input
            id="golive-confirm-name"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
            placeholder={orgName}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#020308] focus:ring-2 focus:ring-[#020308]/10"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || !nameMatches}
            className="rounded-xl bg-[#020308] px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {busy ? 'Going live…' : 'Go live'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PilotControlsSection({ orgId, config }: { orgId: string; config: SupportConfig | null }) {
  const orgName = useOrgStore((s) => s.organizations.find((o) => o.org_id === orgId)?.name ?? '')
  const fromConfig = (): PilotDraft => ({
    currency: config?.currency ?? 'USD',
    financial_advice_refusal: config?.financial_advice_refusal !== false,
    sla_acknowledge_hours: config?.sla_acknowledge_hours ?? 24,
    sla_resolution_hours: config?.sla_resolution_hours ?? 336,
    kb_stale_after_days: config?.kb_stale_after_days ?? 180,
  })
  const [draft, setDraft] = useState<PilotDraft>(fromConfig)
  const [saved, setSaved] = useState<PilotDraft>(fromConfig)
  const [saving, setSaving] = useState(false)
  // Environment is applied immediately (with confirmation), separate from the
  // draft/save flow — going live is a deliberate commercial event, not a
  // setting to batch with SLA tweaks.
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>(
    config?.environment ?? 'production'
  )
  const [envBusy, setEnvBusy] = useState(false)
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  // Re-seed once the config loads in.
  useEffect(() => {
    const next = fromConfig()
    setDraft(next)
    setSaved(next)
    setEnvironment(config?.environment ?? 'production')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const set = <K extends keyof PilotDraft>(key: K, value: PilotDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await updateSupportConfig(orgId, {
        currency: draft.currency.trim().toUpperCase() || 'USD',
        financial_advice_refusal: draft.financial_advice_refusal,
        sla_acknowledge_hours: draft.sla_acknowledge_hours,
        sla_resolution_hours: draft.sla_resolution_hours,
        kb_stale_after_days: draft.kb_stale_after_days,
      })
      setSaved(draft)
      toast.success('Pilot settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const applyEnvironment = async (next: 'sandbox' | 'production') => {
    setEnvBusy(true)
    try {
      await updateSupportConfig(orgId, { environment: next })
      setEnvironment(next)
      setGoLiveOpen(false)
      toast.success(
        next === 'production'
          ? "You're live — your plan's limits now apply and your billing period has started."
          : 'Back in sandbox — real sends are suppressed and testing caps apply.'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change environment')
    } finally {
      setEnvBusy(false)
    }
  }

  const handleEnvClick = (next: 'sandbox' | 'production') => {
    if (next === environment || envBusy) return
    if (next === 'production') {
      setGoLiveOpen(true)
      return
    }
    if (
      window.confirm(
        'Return this workspace to sandbox? Real outbound sends will be suppressed and the widget will show a SANDBOX badge.'
      )
    ) {
      void applyEnvironment('sandbox')
    }
  }

  const isSandbox = environment === 'sandbox'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-[#020308]" />
          <h2 className="font-semibold text-gray-900 text-sm">Pilot & compliance</h2>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          Environment, currency, advice guardrail, complaint SLAs, and knowledge freshness.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Environment — applied immediately; going live requires typed confirmation */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">Environment</p>
            <p className="mt-0.5 text-xs text-gray-400">
              In <span className="font-medium">sandbox</span>, no real emails are sent (previewed
              only) and the widget shows a SANDBOX badge. Going live starts your billing period and
              applies your plan&apos;s limits.
            </p>
          </div>
          <div className="flex flex-none items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              disabled={envBusy}
              onClick={() => handleEnvClick('sandbox')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                isSandbox
                  ? 'bg-white text-[#020308] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sandbox
            </button>
            <button
              type="button"
              disabled={envBusy}
              onClick={() => handleEnvClick('production')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                !isSandbox
                  ? 'bg-white text-[#020308] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Production
            </button>
          </div>
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">Currency</p>
            <p className="mt-0.5 text-xs text-gray-400">
              ISO code the assistant uses for amounts (e.g. USD, NGN, KES, GBP).
            </p>
          </div>
          <input
            type="text"
            value={draft.currency}
            maxLength={3}
            onChange={(e) => set('currency', e.target.value.toUpperCase())}
            className="w-20 flex-none rounded-lg border border-gray-200 px-3 py-1.5 text-center text-sm font-mono uppercase text-gray-800 focus:border-[#020308] focus:outline-none"
          />
        </div>

        {/* Financial-advice refusal */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">
              Refuse financial / investment advice
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              The assistant declines advice questions and offers a ticket. Recommended for any org
              that sells financial products.
            </p>
          </div>
          <Toggle
            checked={draft.financial_advice_refusal}
            onChange={(v) => set('financial_advice_refusal', v)}
          />
        </div>

        {/* Acknowledge SLA */}
        <NumberRow
          title="Complaint acknowledgement SLA"
          desc="Hours to first response before the ticket is flagged at-risk (CBN: 24h)."
          value={draft.sla_acknowledge_hours}
          suffix="hours"
          min={1}
          max={720}
          onChange={(n) => set('sla_acknowledge_hours', n)}
        />

        {/* Resolution SLA */}
        <NumberRow
          title="Complaint resolution SLA"
          desc="Hours to resolution before breach. CBN target is 14 days (336h)."
          value={draft.sla_resolution_hours}
          suffix="hours"
          min={1}
          max={8760}
          onChange={(n) => set('sla_resolution_hours', n)}
        />

        {/* KB staleness */}
        <NumberRow
          title="Flag knowledge as stale after"
          desc="Articles not updated within this window are surfaced for human review."
          value={draft.kb_stale_after_days}
          suffix="days"
          min={7}
          max={3650}
          onChange={(n) => set('kb_stale_after_days', n)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-3 bg-gray-50/60 border-t border-gray-100">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#020308] px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {goLiveOpen && (
        <GoLiveModal
          orgName={orgName}
          busy={envBusy}
          onConfirm={() => void applyEnvironment('production')}
          onClose={() => setGoLiveOpen(false)}
        />
      )}
    </div>
  )
}

function NumberRow({
  title,
  desc,
  value,
  suffix,
  min,
  max,
  onChange,
}: {
  title: string
  desc: string
  value: number
  suffix: string
  min: number
  max: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
      </div>
      <div className="flex flex-none items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, Math.round(n))))
          }}
          className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-sm text-gray-800 focus:border-[#020308] focus:outline-none"
        />
        <span className="text-xs text-gray-400">{suffix}</span>
      </div>
    </div>
  )
}

function TriggerRow({
  title,
  desc,
  checked,
  onChange,
  threshold,
}: {
  title: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
  threshold?: {
    value: number
    onChange: (n: number) => void
    suffix: string
    min: number
    max: number
  }
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
        {threshold && checked && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Fires after</span>
            <input
              type="number"
              min={threshold.min}
              max={threshold.max}
              value={threshold.value}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (!Number.isNaN(n))
                  threshold.onChange(Math.min(threshold.max, Math.max(threshold.min, n)))
              }}
              className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-800 outline-none focus:border-gray-900 focus:bg-white"
            />
            <span className="text-[11px] text-gray-400">{threshold.suffix}</span>
          </div>
        )}
      </div>
      <div className="pt-0.5">
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export function SupportSettingsPanel() {
  const { currentOrgId } = useOrgStore()
  const [config, setConfig] = useState<SupportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSnippet, setActiveSnippet] = useState<'anonymous' | 'identified'>('identified')
  const [mobileSnippetLang, setMobileSnippetLang] = useState<'flutter' | 'reactnative'>('flutter')
  const [mobileTokenCount, setMobileTokenCount] = useState<number | null>(null)
  const [savingHome, setSavingHome] = useState(false)

  const loadConfig = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const [c, mobileStat] = await Promise.all([
        getSupportConfig(currentOrgId),
        getMobilePushStatus(currentOrgId).catch(() => null),
      ])
      setConfig(c)
      if (mobileStat) setMobileTokenCount(mobileStat.tokenCount)
    } catch {
      toast.error('Failed to load config')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleRotate = (newSecret: string) => {
    setConfig((prev) => (prev ? { ...prev, widget_secret: newSecret } : prev))
  }

  if (!currentOrgId) return null

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-gray-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
        Loading…
      </div>
    )
  }

  const orgId = currentOrgId
  const color = config?.widget_color
  const anonSnippet = buildAnonymousEmbed(orgId, color)
  const idSnippet = buildIdentifiedEmbed(orgId, color)

  const portalSlug = config?.portal_slug ?? orgId
  const flutterSnippet = buildFlutterSnippet(orgId, portalSlug)
  const reactNativeSnippet = buildReactNativeSnippet(orgId, portalSlug)
  const activeMobileSnippet = mobileSnippetLang === 'flutter' ? flutterSnippet : reactNativeSnippet
  const homeCards =
    config?.home_cards && config.home_cards.length > 0
      ? config.home_cards
      : [
          {
            icon: '01',
            title: 'Ask a product question',
            body: 'Get answers from your knowledge base.',
            prompt: 'I have a product question.',
          },
          {
            icon: '02',
            title: 'Get account help',
            body: 'Billing, login, subscription, and setup support.',
            prompt: 'I need help with my account.',
          },
          {
            icon: '03',
            title: 'Talk to support',
            body: 'Create a ticket when Lira needs your team.',
            prompt: 'I want to talk to support.',
          },
        ]

  const updateHomeField = (patch: Partial<SupportConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const updateHomeCard = (index: number, patch: Partial<(typeof homeCards)[number]>) => {
    const next = homeCards.map((card, i) => (i === index ? { ...card, ...patch } : card))
    updateHomeField({ home_cards: next })
  }

  // Seed an "Add" with a common-question template the admin can adopt or
  // overwrite. Cycles through these so successive Adds give different starts
  // instead of always landing on the same generic placeholder. Icons are
  // clean numeric badges by default; admins can swap them for emojis/letters
  // via the icon field if they want — we just don't ship emoji defaults.
  const cardTemplates: Array<{ title: string; body: string; prompt: string }> = [
    { title: 'About us', body: 'Get a quick overview.', prompt: 'Tell me about your company.' },
    { title: 'Pricing', body: 'See plans and pricing.', prompt: 'How does pricing work?' },
    {
      title: 'How does it work?',
      body: 'A short walkthrough.',
      prompt: 'How does your product work?',
    },
    {
      title: 'Account help',
      body: 'Login, billing, settings.',
      prompt: 'I need help with my account.',
    },
    {
      title: 'Talk to a teammate',
      body: 'Loop in a human.',
      prompt: 'I want to talk to a real person.',
    },
    {
      title: 'See what it can do',
      body: 'Capabilities + use cases.',
      prompt: 'What can you help me with?',
    },
  ]

  const addHomeCard = () => {
    const seed = cardTemplates[homeCards.length % cardTemplates.length]
    updateHomeField({
      home_cards: [
        ...homeCards,
        {
          // Generate a stable id up-front so the card can survive renames.
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          // Default to a clean numeric badge (01, 02, …); admin can replace.
          icon: String(homeCards.length + 1).padStart(2, '0'),
          title: seed.title,
          body: seed.body,
          prompt: seed.prompt,
        },
      ],
    })
  }

  const removeHomeCard = (index: number) => {
    updateHomeField({ home_cards: homeCards.filter((_, i) => i !== index) })
  }

  // Re-order quick-start cards. Order matters visually (first card carries
  // the most weight) so admins can tune which prompt the visitor sees first.
  const moveHomeCard = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= homeCards.length) return
    const next = [...homeCards]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateHomeField({ home_cards: next })
  }

  const saveHomeSurface = async () => {
    if (!config) return
    setSavingHome(true)
    try {
      const payload = {
        home_template: config.home_template ?? 'default',
        home_banner_url: config.home_banner_url ?? '',
        home_logo_url: config.home_logo_url ?? '',
        home_title: config.home_title ?? '',
        home_subtitle: config.home_subtitle ?? '',
        home_cards: homeCards.map((card) => ({
          // Preserve existing ids; mint one for any card that doesn't have one
          // (e.g. an admin pasted from another source or imported a legacy
          // config). The backend will also backfill, but minting client-side
          // means the field is reflected immediately in local state.
          id:
            card.id?.trim() ||
            (typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
          icon: card.icon?.trim() || '',
          title: card.title.trim(),
          body: card.body?.trim() || '',
          prompt: card.prompt.trim(),
        })),
      }
      const updated = await updateSupportConfig(orgId, payload)
      setConfig(updated)
      toast.success('Widget home screen saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save home screen')
    } finally {
      setSavingHome(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Embed widget ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CodeBracketIcon className="h-4 w-4 text-[#020308]" />
            <h2 className="font-semibold text-gray-900 text-sm">Embed the chat widget</h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            Paste this snippet into the{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">&lt;body&gt;</code> of
            your website, just before{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">&lt;/body&gt;</code>.
          </p>
        </div>

        {/* Toggle: anonymous vs identified */}
        <div className="flex gap-1 px-5 pt-4">
          <button
            onClick={() => setActiveSnippet('anonymous')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeSnippet === 'anonymous' ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Anonymous visitors
          </button>
          <button
            onClick={() => setActiveSnippet('identified')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeSnippet === 'identified' ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Identified visitors (recommended)
          </button>
        </div>

        {activeSnippet === 'identified' && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
            <CheckCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
            <span>
              Identified mode unlocks personalized replies, Lira knows your customer by name, and
              agentic tools (subscription lookups, account actions) become available. The AI can
              resolve issues without human intervention.
            </span>
          </div>
        )}

        <div className="relative mx-5 mt-3 mb-5">
          <pre className="overflow-x-auto rounded-xl bg-gray-950 px-4 py-4 text-[11px] leading-relaxed text-gray-200 whitespace-pre-wrap">
            {activeSnippet === 'anonymous' ? anonSnippet : idSnippet}
          </pre>
          <div className="absolute top-2.5 right-2.5">
            <CopyButton text={activeSnippet === 'anonymous' ? anonSnippet : idSnippet} />
          </div>
        </div>
      </div>

      {/* ── Widget home screen ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Widget home screen</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Customize the Home tab shown in every Lira widget, dashboard embed, and full-page SDK
            surface.
          </p>
        </div>
        {/* Template picker — three styles for the widget home tab. */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="mb-2 text-xs font-semibold text-gray-600">Home template</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  value: 'default',
                  label: 'Default',
                  desc: 'Logo, headline, cards.',
                },
                {
                  value: 'minimal',
                  label: 'Minimal',
                  desc: 'No big hero — just a list.',
                },
                {
                  value: 'branded',
                  label: 'Branded',
                  desc: 'Large banner image on top.',
                },
              ] as const
            ).map((opt) => {
              const active = (config?.home_template ?? 'default') === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateHomeField({ home_template: opt.value })}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-[#020308] bg-[#020308] text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className={`mt-0.5 text-[11px] ${active ? 'text-white/70' : 'text-gray-400'}`}>
                    {opt.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          {/* Branded template only — the cover image at the top of the home. */}
          {(config?.home_template ?? 'default') === 'branded' && (
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-gray-600">Banner image URL</span>
              <input
                value={config?.home_banner_url ?? ''}
                onChange={(e) => updateHomeField({ home_banner_url: e.target.value })}
                placeholder="https://...  (PNG/JPG — appears above the title)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
              />
            </label>
          )}
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-600">Logo URL</span>
            <input
              value={config?.home_logo_url ?? ''}
              onChange={(e) => updateHomeField({ home_logo_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-600">Headline</span>
            <input
              value={config?.home_title ?? ''}
              onChange={(e) => updateHomeField({ home_title: e.target.value })}
              placeholder="How can we help?"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-gray-600">Intro copy</span>
            <textarea
              value={config?.home_subtitle ?? ''}
              onChange={(e) => updateHomeField({ home_subtitle: e.target.value })}
              placeholder="Start with a common question or open a new conversation."
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
            />
          </label>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">Quick-start buttons</p>
              <p className="text-[11px] text-gray-400">
                Each button starts its own conversation. Re-clicking the same button reopens that
                thread. Add up to 12.
              </p>
            </div>
            <button
              onClick={addHomeCard}
              disabled={homeCards.length >= 12}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {homeCards.map((card, index) => (
              // Stable key by id so React preserves input focus across
              // reordering. Falls back to index for legacy cards.
              <div
                key={card.id ?? `idx-${index}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="grid gap-2 md:grid-cols-[72px_1fr]">
                  <input
                    value={card.icon ?? ''}
                    onChange={(e) => updateHomeCard(index, { icon: e.target.value })}
                    placeholder="01"
                    className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm outline-none focus:border-gray-900"
                  />
                  <input
                    value={card.title}
                    onChange={(e) => updateHomeCard(index, { title: e.target.value })}
                    placeholder="Button title"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                  <input
                    value={card.body ?? ''}
                    onChange={(e) => updateHomeCard(index, { body: e.target.value })}
                    placeholder="Short description"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 md:col-span-2"
                  />
                  <textarea
                    value={card.prompt}
                    onChange={(e) => updateHomeCard(index, { prompt: e.target.value })}
                    placeholder="Prompt sent when clicked"
                    rows={2}
                    className="resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 md:col-span-2"
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  Icon: a short number, emoji, or 1–2 letters (e.g. 01, 💡, AI).
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveHomeCard(index, -1)}
                      disabled={index === 0}
                      aria-label="Move card up"
                      className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-1.5 py-1 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHomeCard(index, 1)}
                      disabled={index === homeCards.length - 1}
                      aria-label="Move card down"
                      className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-1.5 py-1 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeHomeCard(index)}
                    disabled={homeCards.length <= 1}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={saveHomeSurface}
              disabled={savingHome}
              className="inline-flex items-center rounded-lg bg-[#020308] px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {savingHome ? 'Saving…' : 'Save home screen'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Widget secret ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Widget secret</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Store this as an environment variable on your server (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">LIRA_WIDGET_SECRET</code>
            ). Use it to generate the HMAC signature for identified visitors. Never expose it in
            client-side code.
          </p>
        </div>
        <div className="px-5 py-4">
          {config?.widget_secret ? (
            <WidgetSecretRow secret={config.widget_secret} orgId={orgId} onRotate={handleRotate} />
          ) : (
            <p className="text-sm text-gray-400">
              Secret not available — activate the support module first.
            </p>
          )}
          <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Rotating the secret immediately invalidates all existing HMAC signatures. Update your
              server before rotating in production.
            </span>
          </div>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">How identified visitors work</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#020308] text-[10px] font-bold text-white">
              1
            </span>
            <span>Your user logs into your platform (you manage authentication).</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#020308] text-[10px] font-bold text-white">
              2
            </span>
            <span>
              Your server computes{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">
                HMAC-SHA256(LIRA_WIDGET_SECRET, user.email)
              </code>{' '}
              and injects it into the page along with{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">data-email</code> and{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">data-name</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#020308] text-[10px] font-bold text-white">
              3
            </span>
            <span>
              Lira verifies the signature. If it matches, the visitor becomes a{' '}
              <strong>verified customer</strong> — the AI knows their name, history, and can take
              actions on their account.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#020308] text-[10px] font-bold text-white">
              4
            </span>
            <span>
              If the visitor is not logged in (unauthenticated pages), omit{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">data-email</code> /{' '}
              <code className="bg-gray-100 px-1 rounded text-xs">data-sig</code> — the widget still
              works, just without account-level actions.
            </span>
          </li>
        </ol>
      </div>

      {/* ── Handoff triggers ──────────────────────────────────────────────── */}
      <HandoffTriggersSection orgId={orgId} initial={config?.handoff_triggers} />

      {/* ── Pilot & compliance controls ───────────────────────────────────── */}
      <PilotControlsSection orgId={orgId} config={config} />

      {/* ── Mobile App integration ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="h-4 w-4 text-[#020308]" />
              <h2 className="font-semibold text-gray-900 text-sm">Mobile App integration</h2>
            </div>
            {mobileTokenCount !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${mobileTokenCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${mobileTokenCount > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}
                />
                {mobileTokenCount > 0
                  ? `${mobileTokenCount} device${mobileTokenCount !== 1 ? 's' : ''} connected`
                  : 'No devices connected yet'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            Embed the Lira support portal in your iOS or Android app using a WebView, and register
            for push notifications.
          </p>
        </div>

        {/* How it works — 3 steps */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
          {[
            {
              n: '1',
              title: 'Embed the portal',
              body: 'Open a WebView pointing to your Lira support portal URL. Customers get the full chat, ticket, and knowledge-base experience inside your app.',
            },
            {
              n: '2',
              title: 'Register push token',
              body: 'On app start, get the FCM device token and POST it to the Lira API. Lira stores it and can send push notifications through proactive triggers.',
            },
            {
              n: '3',
              title: 'Receive notifications',
              body: "When Lira's proactive engine fires a mobile_push trigger, it sends an FCM notification directly to the customer's device.",
            },
          ].map((step) => (
            <div key={step.n} className="bg-white px-4 py-3.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#020308] text-[9px] font-bold text-white">
                  {step.n}
                </span>
                <span className="text-[11px] font-semibold text-gray-700">{step.title}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        {/* Portal URL */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            Your support portal URL (WebView target)
          </p>
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <code className="flex-1 break-all font-mono text-xs text-gray-800">
              https://support.liraintelligence.com/{portalSlug}
            </code>
            <CopyButton text={`https://support.liraintelligence.com/${portalSlug}`} size="xs" />
          </div>
        </div>

        {/* Code snippet toggle */}
        <div className="px-5 pt-4">
          <div className="flex gap-1">
            <button
              onClick={() => setMobileSnippetLang('flutter')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mobileSnippetLang === 'flutter' ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Flutter
            </button>
            <button
              onClick={() => setMobileSnippetLang('reactnative')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mobileSnippetLang === 'reactnative' ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              React Native
            </button>
          </div>
        </div>

        <div className="relative mx-5 mt-3 mb-5">
          <pre className="overflow-x-auto rounded-xl bg-gray-950 px-4 py-4 text-[11px] leading-relaxed text-gray-200 whitespace-pre-wrap">
            {activeMobileSnippet}
          </pre>
          <div className="absolute top-2.5 right-2.5">
            <CopyButton text={activeMobileSnippet} />
          </div>
        </div>

        {/* Push endpoint reference */}
        <div className="mx-5 mb-5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 space-y-1">
          <p className="text-[11px] font-semibold text-blue-800">Push subscribe endpoint</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all font-mono text-[11px] text-blue-900">
              POST https://api.creovine.com/lira/v1/support/push/mobile/subscribe
            </code>
            <CopyButton
              text="https://api.creovine.com/lira/v1/support/push/mobile/subscribe"
              size="xs"
            />
          </div>
          <p className="text-[11px] text-blue-700 mt-0.5">
            Body:{' '}
            <code className="bg-blue-100 px-1 rounded">{'{ orgId, fcmToken, platform }'}</code> — no
            authentication required. Call this once on app start after obtaining the FCM token.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Standalone page wrapper ─────────────────────────────────────────────────

export function SupportSettingsPage() {
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
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Configuration</h1>
            <p className="mt-1 text-sm text-gray-400">
              Configure widget, integrations, secrets, email, and tool packs
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
        <SupportSettingsPanel />
      </div>
    </div>
  )
}

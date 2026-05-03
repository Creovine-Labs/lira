import { useCallback, useEffect, useState } from 'react'
import {
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useOrgStore } from '@/app/store'
import { getSupportConfig, rotateWidgetSecret } from '@/services/api/support-api'
import { getMobilePushStatus } from '@/services/api'
import type { SupportConfig } from '@/services/api/support-api'

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

// ── Main panel ─────────────────────────────────────────────────────────────────

export function SupportSettingsPanel() {
  const { currentOrgId } = useOrgStore()
  const [config, setConfig] = useState<SupportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSnippet, setActiveSnippet] = useState<'anonymous' | 'identified'>('identified')
  const [mobileSnippetLang, setMobileSnippetLang] = useState<'flutter' | 'reactnative'>('flutter')
  const [mobileTokenCount, setMobileTokenCount] = useState<number | null>(null)

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
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
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

  return (
    <div className="space-y-6">
      {/* ── Embed widget ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CodeBracketIcon className="h-4 w-4 text-[#3730a3]" />
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
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeSnippet === 'anonymous' ? 'bg-[#3730a3] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Anonymous visitors
          </button>
          <button
            onClick={() => setActiveSnippet('identified')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeSnippet === 'identified' ? 'bg-[#3730a3] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[10px] font-bold text-white">
              1
            </span>
            <span>Your user logs into your platform (you manage authentication).</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[10px] font-bold text-white">
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
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[10px] font-bold text-white">
              3
            </span>
            <span>
              Lira verifies the signature. If it matches, the visitor becomes a{' '}
              <strong>verified customer</strong> — the AI knows their name, history, and can take
              actions on their account.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[10px] font-bold text-white">
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

      {/* ── Mobile App integration ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="h-4 w-4 text-[#3730a3]" />
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
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[9px] font-bold text-white">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mobileSnippetLang === 'flutter' ? 'bg-[#3730a3] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Flutter
            </button>
            <button
              onClick={() => setMobileSnippetLang('reactnative')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mobileSnippetLang === 'reactnative' ? 'bg-[#3730a3] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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

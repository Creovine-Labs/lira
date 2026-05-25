import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
  GlobeAltIcon,
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  LockClosedIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathRoundedSquareIcon,
  RocketLaunchIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'
import {
  listKBEntries,
  listDocuments,
  listConnectedDocuments,
  getCrawlStatus,
  getOrganization,
  type KBEntry,
  type DocumentRecord,
  type ConnectedSourceStatus,
  type CrawlStatus,
} from '@/services/api'
import { rotateWidgetSecret } from '@/services/api/support-api'

// Mirror backend slug logic so we can show a preview before activation
function previewSupportEmail(orgName: string, orgId: string): string {
  const base = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
  const suffix = orgId.replace(/[^a-z0-9]/g, '').slice(-4)
  const slug = base ? `${base}-${suffix}` : `support-${suffix}`
  return `support-${slug}@liraintelligence.com`
}

// ── Chat Widget Preview ───────────────────────────────────────────────────────

const WIDGET_PREVIEW_STYLES = `
  @keyframes wDot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
  @keyframes wFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .w-bubble{animation:wFade .22s ease-out}
`

type WidgetPhase = 0 | 1 | 2 | 3 | 4
// 0 = greeting only  1 = + customer msg  2 = + typing  3 = + lira resp 1  4 = + lira resp 2 → reset
const WPHASE_DELAYS: Record<WidgetPhase, number> = { 0: 2400, 1: 900, 2: 1600, 3: 2100, 4: 3800 }

function WidgetWindow({
  greeting,
  phase,
  color,
  orgName,
  logoUrl,
}: {
  greeting: string
  phase: WidgetPhase
  color: string
  orgName: string
  logoUrl?: string
}) {
  const initial = orgName.charAt(0).toUpperCase()
  const avatarContent = logoUrl ? (
    <img
      src={logoUrl}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
    />
  ) : (
    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{initial}</span>
  )
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: color,
          color: '#fff',
          padding: '10px 14px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {avatarContent}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{orgName}</div>
          <div style={{ fontSize: 9.5, opacity: 0.82, marginTop: 1 }}>
            Typically replies in seconds
          </div>
        </div>
        <div style={{ fontSize: 16, opacity: 0.6, lineHeight: 1 }}>✕</div>
      </div>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: '10px 11px',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          overflowY: 'hidden',
        }}
      >
        {/* Lira greeting */}
        <div
          className="w-bubble"
          style={{
            maxWidth: '84%',
            padding: '7px 11px',
            borderRadius: 11,
            borderBottomLeftRadius: 3,
            background: '#f3f4f6',
            fontSize: 11.5,
            lineHeight: 1.45,
            color: '#1a1a2e',
          }}
        >
          {greeting}
        </div>
        {/* Customer */}
        {phase >= 1 && (
          <div
            className="w-bubble"
            style={{
              maxWidth: '84%',
              padding: '7px 11px',
              borderRadius: 11,
              borderBottomRightRadius: 3,
              background: color,
              color: '#fff',
              fontSize: 11.5,
              lineHeight: 1.45,
              alignSelf: 'flex-end',
            }}
          >
            Hi, my password isn't working.
          </div>
        )}
        {/* Typing */}
        {phase === 2 && (
          <div
            className="w-bubble"
            style={{
              display: 'inline-flex',
              gap: 4,
              padding: '9px 12px',
              background: '#f3f4f6',
              borderRadius: 11,
              borderBottomLeftRadius: 3,
              alignSelf: 'flex-start',
            }}
          >
            {[0, 200, 400].map((delay) => (
              <span
                key={delay}
                style={{
                  width: 6,
                  height: 6,
                  background: '#9ca3af',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: `wDot 1.4s ${delay}ms infinite`,
                }}
              />
            ))}
          </div>
        )}
        {/* Lira response 1 */}
        {phase >= 3 && (
          <div
            className="w-bubble"
            style={{
              maxWidth: '84%',
              padding: '7px 11px',
              borderRadius: 11,
              borderBottomLeftRadius: 3,
              background: '#f3f4f6',
              fontSize: 11.5,
              lineHeight: 1.45,
              color: '#1a1a2e',
            }}
          >
            On it! I'll send a password reset link to your email right now.
          </div>
        )}
        {/* Lira response 2 */}
        {phase >= 4 && (
          <div
            className="w-bubble"
            style={{
              maxWidth: '84%',
              padding: '7px 11px',
              borderRadius: 11,
              borderBottomLeftRadius: 3,
              background: '#f3f4f6',
              fontSize: 11.5,
              lineHeight: 1.45,
              color: '#1a1a2e',
            }}
          >
            Done! Check your inbox — the link expires in 30 minutes. 😊
          </div>
        )}
      </div>
      {/* Input */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '7px 10px',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            border: '1px solid #d1d5db',
            borderRadius: 9,
            padding: '5px 9px',
            fontSize: 11,
            color: '#9ca3af',
            background: '#fff',
          }}
        >
          Type a message…
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            fontSize: 14,
          }}
        >
          ↑
        </div>
      </div>
    </div>
  )
}

function ChatWidgetPreview({ greeting }: { greeting: string }) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop')
  const [phase, setPhase] = useState<WidgetPhase>(0)
  const { currentOrgId, organizations } = useOrgStore()
  const previewOrg = organizations.find((o) => o.org_id === currentOrgId)
  const orgName = previewOrg?.name ?? previewOrg?.profile?.company_name ?? 'Support'
  const logoUrl = previewOrg?.profile?.logo_url ?? undefined
  const COLOR = '#020308'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(0)
  }, [view])

  useEffect(() => {
    const delay = WPHASE_DELAYS[phase]
    const next = (phase >= 4 ? 0 : phase + 1) as WidgetPhase
    const t = setTimeout(() => setPhase(next), delay)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="space-y-2">
      <style>{WIDGET_PREVIEW_STYLES}</style>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Live Preview
        </p>
        <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
          {(['desktop', 'mobile'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all',
                view === v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {v === 'desktop' ? (
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v7a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1H4zm1 10a.5.5 0 000 1h10a.5.5 0 000-1H5z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm1 1h4a1 1 0 011 1v12a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zm1 12a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="capitalize">{v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop */}
      {view === 'desktop' && (
        <div
          style={{
            width: '100%',
            height: 290,
            borderRadius: 11,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              height: 27,
              background: '#f0efee',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingInline: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <div
              style={{
                flex: 1,
                height: 16,
                background: '#fff',
                borderRadius: 5,
                border: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                paddingInline: 7,
                gap: 4,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 16 16" fill="#9ca3af">
                <path
                  fillRule="evenodd"
                  d="M10.68 11.74a6 6 0 01-7.922-8.982 6 6 0 018.982 7.922l3.04 3.04-.84.84-3.26-3.22zm-3.18.26a5 5 0 100-10 5 5 0 000 10z"
                  clipRule="evenodd"
                />
              </svg>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>yourcompany.com</span>
            </div>
          </div>
          {/* Page */}
          <div style={{ flex: 1, background: '#f9f9f6', position: 'relative' }}>
            {/* Nav */}
            <div
              style={{
                height: 30,
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                paddingInline: 14,
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    background: COLOR,
                    opacity: 0.85,
                  }}
                />
                <span style={{ fontSize: 9.5, fontWeight: 700, color: '#1a1a2e' }}>YourCo</span>
              </div>
              {['Products', 'Pricing', 'Blog'].map((n) => (
                <span key={n} style={{ fontSize: 8.5, color: '#9ca3af' }}>
                  {n}
                </span>
              ))}
            </div>
            {/* Dummy content */}
            <div style={{ padding: '14px 16px', opacity: 0.5 }}>
              <div
                style={{
                  height: 9,
                  width: 110,
                  background: '#d1d5db',
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 5,
                  width: 190,
                  background: '#e5e7eb',
                  borderRadius: 3,
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  height: 5,
                  width: 150,
                  background: '#e5e7eb',
                  borderRadius: 3,
                  marginBottom: 4,
                }}
              />
              <div style={{ height: 5, width: 170, background: '#e5e7eb', borderRadius: 3 }} />
            </div>
            {/* Widget window */}
            <div style={{ position: 'absolute', bottom: 42, right: 10, width: 234, height: 185 }}>
              <WidgetWindow
                greeting={greeting}
                phase={phase}
                color={COLOR}
                orgName={orgName}
                logoUrl={logoUrl}
              />
            </div>
            {/* Launcher */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 10,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: COLOR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(55,48,163,0.4)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Mobile */}
      {view === 'mobile' && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 4 }}>
          <div
            style={{
              width: 200,
              height: 338,
              borderRadius: 30,
              border: '7px solid #1c1c1e',
              background: '#f9f9f6',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 56,
                height: 16,
                background: '#1c1c1e',
                borderBottomLeftRadius: 11,
                borderBottomRightRadius: 11,
                zIndex: 10,
              }}
            />
            {/* Widget window */}
            <div style={{ position: 'absolute', bottom: 42, right: 6, left: 6, height: 258 }}>
              <WidgetWindow
                greeting={greeting}
                phase={phase}
                color={COLOR}
                orgName={orgName}
                logoUrl={logoUrl}
              />
            </div>
            {/* Launcher */}
            <div
              style={{
                position: 'absolute',
                bottom: 7,
                right: 7,
                width: 31,
                height: 31,
                borderRadius: '50%',
                background: COLOR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(55,48,163,0.4)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-gray-400">
        Auto-playing preview · your greeting message updates in real-time
      </p>
    </div>
  )
}

const STEPS = [
  { key: 'email', label: 'Email Setup', icon: EnvelopeIcon },
  { key: 'chat', label: 'Channels', icon: ChatBubbleLeftEllipsisIcon },
  { key: 'integrations', label: 'Ticket Notifications', icon: EnvelopeIcon },
  { key: 'knowledge', label: 'Seed Knowledge', icon: BookOpenIcon },
  { key: 'activate', label: 'Test & Activate', icon: RocketLaunchIcon },
] as const

function SupportActivatePage() {
  const navigate = useNavigate()
  const { currentOrgId, organizations, updateOrganization } = useOrgStore()
  const { userEmail } = useAuthStore()
  const { config, activateModule, updateConfig, loadConfig } = useSupportStore()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [customSupportEmail, setCustomSupportEmail] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [modalInput, setModalInput] = useState('')
  const modalInputRef = useRef<HTMLInputElement>(null)
  const [chatEnabled, setChatEnabled] = useState(false)
  const [greeting, setGreeting] = useState('Hi! How can we help you today?')
  const [portalEnabled, setPortalEnabled] = useState(false)
  const [portalSlug, setPortalSlug] = useState('')
  const [portalCustomDomain, setPortalCustomDomain] = useState('')
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [confirmingRotate, setConfirmingRotate] = useState(false)

  // Step 3 — ticketing notification email + CC list (enterprise can add up to 2)
  const [escalationEmail, setEscalationEmail] = useState('')
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const escalationEmailInitialized = useRef(false)
  // Enterprise gating — wire to real org plan when plans land. For now, off.
  const isEnterprise = false
  const MAX_CC = 2

  // Step 4 — knowledge base preview
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([])
  const [kbDocuments, setKbDocuments] = useState<DocumentRecord[]>([])
  const [connectedSources, setConnectedSources] = useState<{
    google_drive: ConnectedSourceStatus
    github: ConnectedSourceStatus
  } | null>(null)
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus | null>(null)
  const [kbLoading, setKbLoading] = useState(false)

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)
  const liraAddress =
    config?.email_address ??
    (currentOrg && currentOrgId
      ? previewSupportEmail(currentOrg.name, currentOrgId)
      : 'support-yourorg@liraintelligence.com')

  useEffect(() => {
    // Skip the auto-redirect when we've just activated and are showing the 'You're live!' screen.
    // The user navigates to inbox manually from there.
    if (activated) return
    if (config?.activated && config.onboarding_completed) {
      navigate('/support/inbox', { replace: true })
    }
  }, [config, navigate, activated])

  // Set default ticketing email + CC list from saved config (once only)
  useEffect(() => {
    if (!escalationEmailInitialized.current && userEmail) {
      escalationEmailInitialized.current = true
      setEscalationEmail(config?.escalation_email ?? userEmail)
      if (config?.escalation_cc_emails?.length) {
        setCcEmails(config.escalation_cc_emails.slice(0, MAX_CC))
      }
    }
  }, [userEmail, config?.escalation_email, config?.escalation_cc_emails])

  // Load KB data when step 4 (knowledge) becomes active
  useEffect(() => {
    if (currentStep === 3 && currentOrgId) {
      // Freshen the org in the store so description is always up to date
      getOrganization(currentOrgId)
        .then((org) => updateOrganization(currentOrgId, { profile: org.profile }))
        .catch(() => {})

      setKbLoading(true)
      Promise.allSettled([
        listKBEntries(currentOrgId),
        listDocuments(currentOrgId),
        listConnectedDocuments(currentOrgId),
        getCrawlStatus(currentOrgId),
      ])
        .then(([kbRes, docsRes, sourcesRes, crawlRes]) => {
          if (kbRes.status === 'fulfilled') setKbEntries(kbRes.value)
          if (docsRes.status === 'fulfilled') setKbDocuments(docsRes.value)
          if (sourcesRes.status === 'fulfilled') setConnectedSources(sourcesRes.value.sources)
          if (crawlRes.status === 'fulfilled') setCrawlStatus(crawlRes.value)
        })
        .finally(() => setKbLoading(false))
    }
  }, [currentStep, currentOrgId])

  const handleRotateSecret = useCallback(async () => {
    if (!currentOrgId) return
    if (!confirmingRotate) {
      setConfirmingRotate(true)
      return
    }
    setRotating(true)
    setConfirmingRotate(false)
    try {
      await rotateWidgetSecret(currentOrgId)
      await loadConfig(currentOrgId)
      toast.success('Widget secret rotated — update your customer integration before deploying')
    } catch {
      toast.error('Failed to rotate secret')
    } finally {
      setRotating(false)
    }
  }, [currentOrgId, confirmingRotate, loadConfig])

  const handleActivate = useCallback(async () => {
    if (!currentOrgId) return
    setActivating(true)
    try {
      // Set activated early to prevent the useEffect redirect from firing
      // before the success screen renders
      setActivated(true)
      await activateModule(currentOrgId)
      // Refresh config so widget_secret (set server-side on activation) is
      // available on the success screen.
      await loadConfig(currentOrgId)
      await updateConfig(currentOrgId, {
        email_enabled: true,
        custom_support_email: customSupportEmail || undefined,
        chat_enabled: chatEnabled,
        greeting_message: greeting.trim() || undefined,
        portal_enabled: portalEnabled,
        // Persist the *resolved* slug (derived from org name if the user
        // didn't type a custom one) so it matches the URL shown on the
        // success screen and shows up in Settings → Portal afterwards.
        portal_slug: portalEnabled ? portalSlugFinal : portalSlug.trim() || undefined,
        custom_domain: portalCustomDomain.trim().toLowerCase() || undefined,
        escalation_email: escalationEmail.trim() || undefined,
        escalation_cc_emails: ccEmails
          .map((e) => e.trim())
          .filter(Boolean)
          .slice(0, MAX_CC),
        onboarding_completed: true,
        onboarding_step: 'complete',
      })
      toast.success('Support module activated!')
    } catch (err) {
      setActivated(false)
      toast.error(err instanceof Error ? err.message : 'Activation failed')
    } finally {
      setActivating(false)
    }
  }, [
    currentOrgId,
    customSupportEmail,
    chatEnabled,
    greeting,
    portalEnabled,
    portalSlug,
    portalCustomDomain,
    escalationEmail,
    ccEmails,
    activateModule,
    updateConfig,
    navigate,
  ])

  const step = STEPS[currentStep]

  const embedCode =
    '<script\n' +
    '  src="https://widget.liraintelligence.com/v1/widget.js"\n' +
    `  data-org-id="${currentOrgId ?? 'YOUR_ORG_ID'}"\n` +
    `  data-greeting="${(greeting.trim() || 'Hi! How can we help you today?').replace(/"/g, '&quot;')}"\n` +
    '  data-position="bottom-right">\n' +
    '</script>'
  const fullPageSdkCode =
    '<div id="lira-support-root" style="height: 720px;"></div>\n' +
    '<script\n' +
    '  src="https://widget.liraintelligence.com/v1/widget.js"\n' +
    `  data-org-id="${currentOrgId ?? 'YOUR_ORG_ID'}"\n` +
    '  data-mode="fullscreen"\n' +
    '  data-target="#lira-support-root"\n' +
    `  data-greeting="${(greeting.trim() || 'Hi! How can we help you today?').replace(/"/g, '&quot;')}">\n` +
    '</script>'
  const jsSdkCode =
    '<div id="lira-support-root" style="height: 720px;"></div>\n' +
    '<script src="https://widget.liraintelligence.com/v1/widget.js"></script>\n' +
    '<script>\n' +
    '  window.Lira.init({\n' +
    `    orgId: '${currentOrgId ?? 'YOUR_ORG_ID'}',\n` +
    `    orgName: '${(currentOrg?.name ?? 'Your company').replace(/'/g, "\\'")}',\n` +
    `    greeting: '${(greeting.trim() || 'Hi! How can we help you today?').replace(/'/g, "\\'")}'\n` +
    '  })\n' +
    '\n' +
    '  window.Lira.identify({\n' +
    '    email: currentUser.email,\n' +
    '    name: currentUser.name,\n' +
    '    sig: serverGeneratedHmac\n' +
    '  })\n' +
    '\n' +
    '  window.Lira.setContext({\n' +
    '    route: window.location.pathname,\n' +
    '    account: { id: currentUser.accountId, plan: currentUser.plan }\n' +
    '  })\n' +
    '\n' +
    "  window.Lira.mountSupportPage('#lira-support-root')\n" +
    '</script>'
  const npmSdkCode =
    '# After @liraintelligence/support is published to your npm registry\n' +
    'npm install @liraintelligence/support\n\n' +
    "import { init, identify, setContext, mountSupportPage, registerAction } from '@liraintelligence/support'\n\n" +
    `await init({ orgId: '${currentOrgId ?? 'YOUR_ORG_ID'}', orgName: '${(currentOrg?.name ?? 'Your company').replace(/'/g, "\\'")}' })\n` +
    'await identify({ email: currentUser.email, name: currentUser.name, sig: serverGeneratedHmac })\n' +
    'await setContext({ route: window.location.pathname, account: currentUser.account })\n\n' +
    "registerAction('billing.open_checkout', async ({ payload }) => {\n" +
    '  await openCheckout(payload)\n' +
    "  return { ok: true, message: 'Checkout opened' }\n" +
    '})\n\n' +
    "await mountSupportPage('#lira-support-root')"

  const portalSlugFinal =
    portalSlug.trim() ||
    (currentOrg?.name ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'my-company'
  const portalUrl = `https://support.liraintelligence.com/${portalSlugFinal}`

  if (activated) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb] px-4 py-12">
        <div className="w-full max-w-xl space-y-5">
          {/* Success header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon className="h-9 w-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              You&apos;re live!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Lira is now handling support for {currentOrg?.name ?? 'your organization'}. Start with
              the full-page SDK for their own support route, then add the optional widget or hosted
              fallback if needed.
            </p>
          </div>

          {/* Support email */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-800">Support Email</p>
            </div>
            <p className="text-xs text-gray-500">
              {customSupportEmail
                ? `Emails sent to ${customSupportEmail} are forwarded to Lira.`
                : 'Share this address with your customers, or set up forwarding from your own domain.'}
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
              <code className="flex-1 break-all font-mono text-sm text-gray-800">
                {liraAddress}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(liraAddress)
                  toast.success('Copied!')
                }}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Full-page SDK — only if chat/runtime was enabled */}
          {chatEnabled && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <RocketLaunchIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">
                  Full-page Support SDK, recommended
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Ask the customer&apos;s dev team to create their own support route, for example{' '}
                <code className="font-mono text-gray-600">/support</code>, and paste this into the
                page. Their customers stay on their domain while Lira powers chat, tickets,
                identity, and AI actions.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3.5 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                  {fullPageSdkCode}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullPageSdkCode)
                    toast.success('Full-page SDK code copied!')
                  }}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-gray-600"
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <details className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <summary className="cursor-pointer text-xs font-semibold text-gray-600">
                  Logged-in app integration with identity and context
                </summary>
                <div className="relative mt-2">
                  <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3.5 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                    {jsSdkCode}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(jsSdkCode)
                      toast.success('JavaScript SDK code copied!')
                    }}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </details>
              <details className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <summary className="cursor-pointer text-xs font-semibold text-gray-600">
                  NPM package install for bundled apps, publish-ready
                </summary>
                <div className="relative mt-2">
                  <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3.5 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                    {npmSdkCode}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(npmSdkCode)
                      toast.success('NPM SDK example copied!')
                    }}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* Widget embed code — only if chat was enabled */}
          {chatEnabled && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">
                  Floating Chat Widget, optional
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Paste this snippet before the{' '}
                <code className="font-mono text-gray-600">&lt;/body&gt;</code> tag on every page
                where you want a compact chat launcher. This uses the same Lira runtime as the
                full-page SDK.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3.5 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                  {embedCode}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(embedCode)
                    toast.success('Embed code copied!')
                  }}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-gray-600"
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Your <code className="font-mono">data-org-id</code> is permanent. You can update{' '}
                <code className="font-mono">data-greeting</code> or other attributes at any time —
                changes take effect immediately.
              </p>
              <p className="text-[11px] text-gray-400">
                You can copy this code again any time from{' '}
                <strong className="font-medium text-gray-500">
                  Settings → Support → Web SDK tab
                </strong>
                .
              </p>
            </div>
          )}

          {/* Widget Secret — always shown so the customer's dev team has it on hand */}
          {chatEnabled && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <KeyIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">Widget Secret</p>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  <LockClosedIcon className="h-2.5 w-2.5" />
                  Server-side only
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Use this if {currentOrg?.name ?? 'your customer'}&apos;s platform has logged-in
                users. Their backend signs each logged-in visitor&apos;s email with this secret
                (HMAC-SHA256) and passes the signature to the widget, so Lira knows it&apos;s really
                that user — not someone spoofing their email.
              </p>
              <p className="text-[11px] text-gray-400">
                If their site is fully public with no accounts, you can skip this — anonymous
                visitors work out of the box.
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                <code className="flex-1 break-all font-mono text-xs text-gray-800">
                  {config?.widget_secret
                    ? showSecret
                      ? config.widget_secret
                      : '•'.repeat(Math.min(40, config.widget_secret.length))
                    : 'Loading…'}
                </code>
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  disabled={!config?.widget_secret}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-40"
                  title={showSecret ? 'Hide' : 'Show'}
                >
                  {showSecret ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!config?.widget_secret) return
                    navigator.clipboard.writeText(config.widget_secret)
                    toast.success('Secret copied!')
                  }}
                  disabled={!config?.widget_secret}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-40"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <a
                  href="https://docs.liraintelligence.com/platform/customer-support/web-sdk#signed-identity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-900"
                >
                  <BookOpenIcon className="h-3 w-3" />
                  How to sign visitor emails on the server
                </a>
                <button
                  type="button"
                  onClick={handleRotateSecret}
                  disabled={rotating || !config?.widget_secret}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition',
                    confirmingRotate
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'
                  )}
                >
                  <ArrowPathRoundedSquareIcon className="h-3 w-3" />
                  {rotating ? 'Rotating…' : confirmingRotate ? 'Click again to confirm' : 'Rotate'}
                </button>
              </div>
              {confirmingRotate && (
                <p className="text-[11px] text-red-600">
                  Rotating invalidates the current secret. Any logged-in visitors signed with the
                  old secret will fail to verify until {currentOrg?.name ?? 'the customer'}&apos;s
                  backend is updated.
                </p>
              )}
            </div>
          )}

          {/* Hosted portal fallback — only if enabled */}
          {portalEnabled && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">Hosted Portal Fallback</p>
              </div>
              <p className="text-xs text-gray-500">
                Use this as a temporary no-code fallback or email link. For production B2B apps, the
                full-page SDK above is the primary integration.
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                <code className="flex-1 break-all font-mono text-sm text-gray-800">
                  {portalUrl}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl)
                    toast.success('Portal URL copied!')
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>

              <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                Do not iframe this page into a customer product. If the customer wants{' '}
                <code className="font-mono">lemonpay.com/support</code>, use the full-page SDK so
                Lira runs inside their own route.
              </p>
            </div>
          )}

          {/* Docs link */}
          <div className="flex justify-center">
            <a
              href="https://docs.liraintelligence.com/platform/customer-support/web-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            >
              <BookOpenIcon className="h-3.5 w-3.5" />
              Not sure what to do next? View the SDK integration guide
            </a>
          </div>

          {/* Go to Inbox */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/support/inbox', { replace: true })}
              className="inline-flex items-center gap-2 rounded-xl bg-[#020308] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#020308]"
            >
              Go to Inbox
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[#ebebeb] px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Activate Customer Support
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up Lira to handle customer conversations autonomously
          </p>
          <a
            href="https://docs.liraintelligence.com/platform/customer-support/activation"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Read the activation guide
          </a>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= currentStep ? 'bg-[#020308]' : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#020308] text-white">
            <step.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">
              Step {currentStep + 1} of {STEPS.length}
            </p>
            <p className="text-sm font-bold text-gray-900">{step.label}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
          {step.key === 'email' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Lira automatically assigns you a support email address. Share it with customers, or
                set up forwarding from your own address.
              </p>

              {/* Read-only Lira address */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Your support email address
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate text-sm font-mono text-gray-800">
                    {liraAddress}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(liraAddress)
                      toast.success('Copied!')
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    title="Copy address"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
                {!config?.email_address && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600">
                    <InformationCircleIcon className="h-3.5 w-3.5 shrink-0" />
                    Address is confirmed when you activate
                  </p>
                )}
              </div>

              {/* Custom address option */}
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3">
                {customSupportEmail ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Custom address set</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Customers can email{' '}
                        <strong className="font-mono text-gray-700">{customSupportEmail}</strong> —
                        forward it to Lira to activate.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalInput(customSupportEmail)
                        setShowCustomModal(true)
                        setTimeout(() => modalInputRef.current?.focus(), 50)
                      }}
                      className="text-xs font-semibold text-[#020308] hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setModalInput('')
                      setShowCustomModal(true)
                      setTimeout(() => modalInputRef.current?.focus(), 50)
                    }}
                    className="flex w-full items-center justify-between text-sm font-semibold text-[#020308] hover:text-[#020308] transition-colors"
                  >
                    <span>Use your own existing address instead</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}
                {!customSupportEmail && (
                  <p className="mt-1 text-xs text-gray-400">
                    e.g. support@yourcompany.com — we'll show you how to forward it
                  </p>
                )}
              </div>
            </div>
          )}

          {step.key === 'chat' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Enable the web runtime that powers the full-page SDK and optional floating widget.
                The hosted portal is available only as a no-code fallback.
              </p>

              {/* ── Web SDK card ────────────────────── */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <label
                  aria-label="Toggle chat widget"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#020308]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">Web SDK Runtime</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Full-page support embed for your own /support route, plus optional widget
                    </p>
                  </div>
                </label>

                {chatEnabled && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    <ChatWidgetPreview greeting={greeting} />
                    <div>
                      <label
                        htmlFor="activate-greeting"
                        className="mb-1 block text-xs font-semibold text-gray-500"
                      >
                        Greeting Message
                      </label>
                      <textarea
                        id="activate-greeting"
                        value={greeting}
                        onChange={(e) => setGreeting(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Updates in the preview as you type
                      </p>
                    </div>

                    {/* ── SDK code preview ──────────────────── */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">
                        Full-page support SDK snippet
                      </p>
                      <p className="text-xs text-gray-400">
                        Paste this inside the customer&apos;s own support route, for example{' '}
                        <code className="font-mono text-gray-500">/support</code>.
                      </p>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3.5 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                          {fullPageSdkCode}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(fullPageSdkCode)
                            toast.success('Copied!')
                          }}
                          className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-gray-600"
                        >
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        To let Lira greet customers by name, generate an{' '}
                        <strong className="font-medium text-gray-500">HMAC signature</strong>{' '}
                        server-side and pass <code className="font-mono">data-email</code>,{' '}
                        <code className="font-mono">data-name</code>, and{' '}
                        <code className="font-mono">data-sig</code>. After activation, grab your{' '}
                        <strong className="font-medium text-gray-500">widget secret</strong> from{' '}
                        <strong className="font-medium text-gray-500">
                          Settings → Support → Secret
                        </strong>
                        . The floating widget snippet is also available after activation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Hosted portal fallback card ─────────────────── */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <label
                  aria-label="Toggle support portal"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={portalEnabled}
                    onChange={(e) => setPortalEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#020308]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">
                        Hosted Portal Fallback
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Optional Lira-hosted URL for temporary no-code launches
                    </p>
                  </div>
                </label>

                {portalEnabled && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {/* Portal URL — toggle between Default and Custom */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Portal URL</span>
                        {/* Toggle pill */}
                        <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-[11px] font-medium">
                          <button
                            type="button"
                            onClick={() => setPortalCustomDomain('')}
                            className={`rounded-md px-3 py-1 transition-colors ${
                              !portalCustomDomain
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            Default
                          </button>
                          <button
                            type="button"
                            onClick={() => setPortalCustomDomain((v) => v || ' ')}
                            className={`flex items-center gap-1 rounded-md px-3 py-1 transition-colors ${
                              portalCustomDomain
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                      </div>

                      {!portalCustomDomain ? (
                        /* Default domain panel */
                        <div className="flex items-center gap-0">
                          <span className="shrink-0 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-400">
                            support.liraintelligence.com/
                          </span>
                          <input
                            id="activate-portal-slug"
                            type="text"
                            value={portalSlug}
                            onChange={(e) =>
                              setPortalSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                            }
                            placeholder={portalSlugFinal}
                            className="flex-1 rounded-r-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
                          />
                        </div>
                      ) : (
                        /* Custom domain panel */
                        <div>
                          <input
                            id="activate-portal-custom-domain"
                            type="text"
                            value={portalCustomDomain.trim()}
                            onChange={(e) =>
                              setPortalCustomDomain(e.target.value.toLowerCase().replace(/\s/g, ''))
                            }
                            placeholder="support.yourcompany.com"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
                          />
                          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                            Add a DNS CNAME from{' '}
                            <code className="rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[10px]">
                              support.yourcompany.com
                            </code>{' '}
                            pointing to{' '}
                            <code className="rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[10px]">
                              support.liraintelligence.com
                            </code>
                            , then enter your domain above. Your default URL still works — this adds
                            an alias for the fallback page.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Portal preview mockup */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 rounded-md bg-white px-3 py-1 text-[10px] text-gray-400 border border-gray-200 truncate">
                          {portalUrl}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-gray-200 p-4">
                        <div className="h-8 w-48 rounded-md bg-[#020308]/10 mb-3" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-700">
                            How can we help you?
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {greeting.trim() || 'Welcome to support'}
                          </p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-gray-200 p-2 text-center">
                            <div className="mx-auto mb-1 h-5 w-5 rounded-md bg-gray-50" />
                            <p className="text-[10px] text-gray-500">Submit Ticket</p>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-2 text-center">
                            <div className="mx-auto mb-1 h-5 w-5 rounded-md bg-gray-50" />
                            <p className="text-[10px] text-gray-500">My Tickets</p>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-2 text-center">
                            <div className="mx-auto mb-1 h-5 w-5 rounded-md bg-gray-50" />
                            <p className="text-[10px] text-gray-500">Live Chat</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* What's included */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500">What customers get:</p>
                      {[
                        'Temporary support page while SDK integration is pending',
                        'Submit and track support tickets',
                        'Live chat powered by the same Lira runtime',
                        'Magic-link sign in, no passwords needed',
                        'Brand colors and logo applied automatically',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <CheckCircleIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
                          <span className="text-xs text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step.key === 'integrations' && (
            <div className="space-y-5">
              {/* Primary ticket-notification email */}
              <div className="rounded-xl border bg-white px-4 py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-800">Ticketing Email</p>
                </div>
                <p className="text-xs text-gray-500">
                  When Lira opens a ticket on a customer&apos;s behalf, we send the alert here.
                  Defaults to your account email. Switch to a shared inbox if your team handles
                  tickets together.
                </p>
                <input
                  type="email"
                  value={escalationEmail}
                  onChange={(e) => setEscalationEmail(e.target.value)}
                  placeholder={userEmail ?? 'you@company.com'}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              {/* CC emails — enterprise only, max 2 */}
              <div className="rounded-xl border bg-white px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">Additional recipients</p>
                    {!isEnterprise && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <LockClosedIcon className="h-2.5 w-2.5" />
                        Enterprise
                      </span>
                    )}
                  </div>
                  {isEnterprise && ccEmails.length < MAX_CC && (
                    <button
                      onClick={() => setCcEmails((prev) => [...prev, ''])}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900 transition"
                    >
                      <PlusIcon className="h-3 w-3" /> Add email
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  CC up to {MAX_CC} additional teammates on every ticket notification.
                </p>
                {!isEnterprise ? (
                  <p className="text-xs text-gray-400 italic">
                    Upgrade to Enterprise to CC more teammates on ticket alerts.
                  </p>
                ) : ccEmails.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No additional recipients. Click &ldquo;Add email&rdquo; to include teammates.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ccEmails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            setCcEmails((prev) =>
                              prev.map((v, j) => (j === i ? e.target.value : v))
                            )
                          }
                          placeholder="teammate@company.com"
                          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        />
                        <button
                          onClick={() => setCcEmails((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-300 hover:text-red-600 transition"
                          aria-label="Remove recipient"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step.key === 'knowledge' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Seed knowledge base so Lira can answer customer questions accurately. Here's what
                Lira currently knows about your organization.
              </p>

              {kbLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Checking knowledge base…
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
                  {/* Org description */}
                  <div className="flex items-start gap-3 bg-white px-4 py-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${currentOrg?.profile?.description ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800">Organization description</p>
                      {currentOrg?.profile?.description ? (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {currentOrg.profile.description.length > 120
                            ? currentOrg.profile.description.slice(0, 120) + '…'
                            : currentOrg.profile.description}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-gray-400">Not added yet</p>
                      )}
                    </div>
                    {currentOrg?.profile?.description && (
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                  </div>

                  {/* Web pages */}
                  <div className="flex items-start gap-3 bg-white px-4 py-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${kbEntries.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Website pages</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {kbEntries.length > 0
                          ? `${kbEntries.length} page${kbEntries.length === 1 ? '' : 's'} indexed${crawlStatus?.status === 'completed' ? ' · Crawl complete' : ''}`
                          : crawlStatus?.status === 'crawling'
                            ? 'Crawl in progress…'
                            : 'No pages crawled yet'}
                      </p>
                    </div>
                    {kbEntries.length > 0 && (
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                  </div>

                  {/* Uploaded documents */}
                  {(() => {
                    const indexed = kbDocuments.filter((d) => d.status === 'indexed')
                    return (
                      <div className="flex items-start gap-3 bg-white px-4 py-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${indexed.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">Uploaded documents</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {indexed.length > 0
                              ? indexed
                                  .slice(0, 3)
                                  .map((d) => d.filename)
                                  .join(', ') +
                                (indexed.length > 3 ? ` +${indexed.length - 3} more` : '')
                              : 'No documents uploaded yet'}
                          </p>
                        </div>
                        {indexed.length > 0 && (
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
                        )}
                      </div>
                    )
                  })()}

                  {/* GitHub */}
                  {connectedSources?.github?.connected && (
                    <div className="flex items-start gap-3 bg-white px-4 py-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">GitHub</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {connectedSources.github.files.length} file
                          {connectedSources.github.files.length === 1 ? '' : 's'} available
                        </p>
                      </div>
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
                    </div>
                  )}

                  {/* Google Drive */}
                  {connectedSources?.google_drive?.connected && (
                    <div className="flex items-start gap-3 bg-white px-4 py-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Google Drive</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {connectedSources.google_drive.files.length} file
                          {connectedSources.google_drive.files.length === 1 ? '' : 's'} available
                        </p>
                      </div>
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-500" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => window.open('/org/knowledge', '_blank')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  Add More Information
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Opens in a new tab — your activation progress is saved here.
              </p>
            </div>
          )}

          {step.key === 'activate' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Everything is set up. Activate customer support to start receiving and handling
                conversations.
              </p>
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-600" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold">Ready to activate</p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-green-700">
                      <li>
                        Email:{' '}
                        {customSupportEmail
                          ? `${customSupportEmail} → ${liraAddress}`
                          : liraAddress}
                      </li>
                      <li>Web SDK runtime: {chatEnabled ? 'Enabled' : 'Disabled'}</li>
                      {portalEnabled && (
                        <li>
                          Hosted fallback:{' '}
                          {portalCustomDomain.trim() ? portalCustomDomain.trim() : portalUrl}
                        </li>
                      )}
                      <li>Knowledge base: Connected</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-white disabled:opacity-40 transition"
          >
            Back
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="rounded-xl bg-[#020308] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#020308] transition"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#020308] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#020308] disabled:opacity-50 transition"
            >
              <RocketLaunchIcon className="h-4 w-4" />
              {activating ? 'Activating…' : 'Activate Support'}
            </button>
          )}
        </div>
      </div>

      {/* Custom email modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Use your existing email address
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Enter your company's existing support email. We'll show you how to forward it to
                  Lira.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="custom-email-modal-input"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-500"
                >
                  Your email address
                </label>
                <input
                  id="custom-email-modal-input"
                  ref={modalInputRef}
                  type="email"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="support@yourcompany.com"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
                />
              </div>

              {/* Forwarding instructions — appear as user types */}
              {modalInput.trim() && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 space-y-2">
                  <p className="text-xs font-bold text-blue-800">How to set this up</p>
                  <ol className="space-y-1.5 text-xs text-blue-700 list-decimal pl-4">
                    <li>
                      In your email provider (Gmail, Outlook, etc.), open the settings for{' '}
                      <strong className="font-mono">{modalInput.trim()}</strong>
                    </li>
                    <li>
                      Add a forwarding rule to:{' '}
                      <span className="inline-flex items-center gap-1">
                        <strong className="font-mono text-blue-900 break-all">{liraAddress}</strong>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(liraAddress)
                            toast.success('Copied!')
                          }}
                          className="shrink-0 rounded p-0.5 hover:bg-blue-100 transition-colors"
                          title="Copy Lira address"
                        >
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </li>
                    <li>Save the rule — Lira will receive all emails automatically</li>
                  </ol>
                  <p className="text-[11px] text-blue-500">
                    Customers can email either address. You can always update this later in
                    Settings.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomSupportEmail(modalInput.trim())
                    setShowCustomModal(false)
                  }}
                  disabled={!modalInput.trim()}
                  className="flex-1 rounded-xl bg-[#020308] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#020308] disabled:opacity-40 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { SupportActivatePage }

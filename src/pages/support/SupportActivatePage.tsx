import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  BookOpenIcon,
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
  getSlackAuthUrl,
  getLinearAuthUrl,
  getHubSpotAuthUrl,
  getSalesforceAuthUrl,
  getSlackStatus,
  getLinearStatus,
  getHubSpotStatus,
  getSalesforceStatus,
  disconnectSlack,
  disconnectLinear,
  disconnectHubSpot,
  listKBEntries,
  listDocuments,
  listConnectedDocuments,
  getCrawlStatus,
  getOrganization,
  type KBEntry,
  type DocumentRecord,
  type ConnectedSourceStatus,
  type CrawlStatus,
  disconnectSalesforce,
} from '@/services/api'

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
  const COLOR = '#3730a3'

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
  { key: 'integrations', label: 'Connect Integrations', icon: PuzzlePieceIcon },
  { key: 'knowledge', label: 'Seed Knowledge', icon: BookOpenIcon },
  { key: 'activate', label: 'Test & Activate', icon: RocketLaunchIcon },
] as const

function SupportActivatePage() {
  const navigate = useNavigate()
  const { currentOrgId, organizations, updateOrganization } = useOrgStore()
  const { userEmail } = useAuthStore()
  const { config, activateModule, updateConfig } = useSupportStore()
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

  // Step 3 — integration statuses
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({})
  const [statusLoading, setStatusLoading] = useState(false)
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null)

  // Step 3 — escalation email
  const [escalationEmail, setEscalationEmail] = useState('')
  const escalationEmailInitialized = useRef(false)

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

  // Set default escalation email from logged-in user (once only)
  useEffect(() => {
    if (!escalationEmailInitialized.current && userEmail) {
      escalationEmailInitialized.current = true
      setEscalationEmail(config?.escalation_email ?? userEmail)
    }
  }, [userEmail, config?.escalation_email])

  // Load integration statuses when step 3 is active
  const loadIntegrationStatuses = useCallback(async () => {
    if (!currentOrgId) return
    setStatusLoading(true)
    try {
      const [slack, linear, hubspot, salesforce] = await Promise.allSettled([
        getSlackStatus(currentOrgId),
        getLinearStatus(currentOrgId),
        getHubSpotStatus(currentOrgId),
        getSalesforceStatus(currentOrgId),
      ])
      setIntegrationStatus({
        Slack: slack.status === 'fulfilled' ? slack.value.connected : false,
        Linear: linear.status === 'fulfilled' ? linear.value.connected : false,
        HubSpot: hubspot.status === 'fulfilled' ? hubspot.value.connected : false,
        Salesforce: salesforce.status === 'fulfilled' ? salesforce.value.connected : false,
      })
    } catch {
      // ignore
    } finally {
      setStatusLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    if (currentStep === 2) {
      loadIntegrationStatuses()
    }
  }, [currentStep, loadIntegrationStatuses])

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

  const handleDisconnectIntegration = useCallback(
    async (name: string) => {
      if (!currentOrgId) return
      try {
        const disconnectFns: Record<string, (id: string) => Promise<void>> = {
          Slack: disconnectSlack,
          Linear: disconnectLinear,
          HubSpot: disconnectHubSpot,
          Salesforce: disconnectSalesforce,
        }
        await disconnectFns[name]?.(currentOrgId)
        setIntegrationStatus((prev) => ({ ...prev, [name]: false }))
        toast.success(`${name} disconnected`)
      } catch {
        toast.error(`Failed to disconnect ${name}`)
      }
    },
    [currentOrgId]
  )

  const handleConnectIntegration = useCallback(
    (name: string) => {
      if (!currentOrgId) return
      const authUrls: Record<string, string> = {
        Slack: getSlackAuthUrl(currentOrgId),
        Linear: getLinearAuthUrl(currentOrgId),
        HubSpot: getHubSpotAuthUrl(currentOrgId),
        Salesforce: getSalesforceAuthUrl(currentOrgId),
      }
      const url = authUrls[name]
      if (!url) return

      setConnectingIntegration(name)
      const popup = window.open(url, `connect-${name}`, 'width=650,height=750,left=200,top=100')

      // eslint-disable-next-line prefer-const
      let fallbackInterval: ReturnType<typeof setInterval>
      // eslint-disable-next-line prefer-const
      let safetyTimeout: ReturnType<typeof setTimeout>

      const cleanup = () => {
        clearInterval(fallbackInterval)
        clearTimeout(safetyTimeout)
        window.removeEventListener('message', onMessage)
        setConnectingIntegration(null)
      }

      // Primary: popup posts a message via window.opener after OAuth completes
      const onMessage = async (event: MessageEvent) => {
        if (!event.data || event.data.type !== 'oauth_callback') return
        cleanup()
        await loadIntegrationStatuses()
      }
      window.addEventListener('message', onMessage)

      // Fallback: user manually closed the popup without completing OAuth
      fallbackInterval = setInterval(() => {
        if (!popup || popup.closed) {
          cleanup()
          loadIntegrationStatuses()
        }
      }, 1_000)

      // Safety cleanup after 5 minutes
      safetyTimeout = setTimeout(cleanup, 5 * 60_000)
    },
    [currentOrgId, loadIntegrationStatuses]
  )

  const handleActivate = useCallback(async () => {
    if (!currentOrgId) return
    setActivating(true)
    try {
      // Set activated early to prevent the useEffect redirect from firing
      // before the success screen renders
      setActivated(true)
      await activateModule(currentOrgId)
      await updateConfig(currentOrgId, {
        email_enabled: true,
        custom_support_email: customSupportEmail || undefined,
        chat_enabled: chatEnabled,
        greeting_message: greeting.trim() || undefined,
        portal_enabled: portalEnabled,
        portal_slug: portalSlug.trim() || undefined,
        custom_domain: portalCustomDomain.trim().toLowerCase() || undefined,
        escalation_email: escalationEmail.trim() || undefined,
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

  const portalSlugFinal =
    portalSlug.trim() ||
    (currentOrg?.name ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'my-company'
  const portalUrl = `https://support.liraintelligence.com/${portalSlugFinal}`
  const portalIframeCode =
    `<iframe\n` +
    `  src="${portalUrl}?embed=true"\n` +
    `  width="100%" height="700"\n` +
    `  frameborder="0"\n` +
    `  style="border: none; border-radius: 12px;">\n` +
    `</iframe>`

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
              Lira is now handling customer support for your organization.
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

          {/* Widget embed code — only if chat was enabled */}
          {chatEnabled && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">Install Chat Widget</p>
              </div>
              <p className="text-xs text-gray-500">
                Paste this snippet before the{' '}
                <code className="font-mono text-gray-600">&lt;/body&gt;</code> tag on every page
                where you want the chat widget to appear.
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
                  Support → Settings → Widget tab
                </strong>
                .
              </p>
            </div>
          )}

          {/* Support Portal — only if enabled */}
          {portalEnabled && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">Support Portal</p>
              </div>
              <p className="text-xs text-gray-500">
                Your customers can visit this page to submit tickets, track status, and chat.
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

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Embed on your site (optional)</p>
                <div className="relative">
                  <pre className="overflow-x-auto rounded-xl bg-gray-900 px-4 py-3.5 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre">
                    {portalIframeCode}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(portalIframeCode)
                      toast.success('Embed code copied!')
                    }}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-gray-700 px-2.5 py-1.5 text-[11px] font-semibold text-gray-300 transition hover:bg-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Docs link */}
          <div className="flex justify-center">
            <a
              href="https://docs.liraintelligence.com/platform/customer-support/setup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            >
              <BookOpenIcon className="h-3.5 w-3.5" />
              Not sure what to do next? View the setup guide
            </a>
          </div>

          {/* Go to Inbox */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/support/inbox', { replace: true })}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3730a3] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#312e81]"
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
                i <= currentStep ? 'bg-[#3730a3]' : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3730a3] text-white">
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
                      className="text-xs font-semibold text-[#3730a3] hover:underline shrink-0"
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
                    className="flex w-full items-center justify-between text-sm font-semibold text-[#3730a3] hover:text-[#312e81] transition-colors"
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
                Choose how customers reach you. Enable a chat widget, a full support portal, or
                both.
              </p>

              {/* ── Chat Widget card ────────────────────── */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <label
                  aria-label="Toggle chat widget"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">Chat Widget</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Floating chat button on your website — instant AI responses
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
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Updates in the preview as you type
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Support Portal card ─────────────────── */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <label
                  aria-label="Toggle support portal"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={portalEnabled}
                    onChange={(e) => setPortalEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#3730a3]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-800">Support Portal</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Full-page support experience — ticket creation, tracking &amp; live chat
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
                            onClick={() =>
                              setPortalCustomDomain((v) => v || ' ')
                            }
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
                              setPortalSlug(
                                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                              )
                            }
                            placeholder={portalSlugFinal}
                            className="flex-1 rounded-r-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
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
                              setPortalCustomDomain(
                                e.target.value.toLowerCase().replace(/\s/g, ''),
                              )
                            }
                            placeholder="support.yourcompany.com"
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
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
                            , then enter your domain above. Your default URL still works — this
                            adds an alias.
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
                        <div className="h-8 w-48 rounded-md bg-[#3730a3]/10 mb-3" />
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
                            <div className="mx-auto mb-1 h-5 w-5 rounded-md bg-indigo-50" />
                            <p className="text-[10px] text-gray-500">Submit Ticket</p>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-2 text-center">
                            <div className="mx-auto mb-1 h-5 w-5 rounded-md bg-indigo-50" />
                            <p className="text-[10px] text-gray-500">My Tickets</p>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-2 text-center">
                            <div className="mx-auto mb-1 h-5 w-5 rounded-md bg-indigo-50" />
                            <p className="text-[10px] text-gray-500">Live Chat</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* What's included */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500">What customers get:</p>
                      {[
                        'Submit and track support tickets',
                        'View conversation history with AI & human agents',
                        'Live chat powered by your existing widget',
                        'Magic-link sign in — no passwords needed',
                        'Your brand colors and logo applied automatically',
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
              {/* Escalation email — top, mandatory */}
              <div className="rounded-xl border bg-white px-4 py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-800">Escalation Email</p>
                </div>
                <p className="text-xs text-gray-500">
                  When Lira can&apos;t confidently answer a customer, she sends an alert to this
                  address. It defaults to your account email. Change it to a team email if needed.
                </p>
                <input
                  type="email"
                  value={escalationEmail}
                  onChange={(e) => setEscalationEmail(e.target.value)}
                  placeholder={userEmail ?? 'you@company.com'}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              {/* Optional notification channels */}
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Optionally connect your team tools to also receive escalation alerts there —
                  notifications only, replies always happen in your Lira inbox. You can skip any you
                  don&apos;t use.
                </p>
                <div className="space-y-2">
                  {(['Slack', 'Linear', 'HubSpot', 'Salesforce'] as const).map((name) => {
                    const isConnected = integrationStatus[name] === true
                    const isConnecting = connectingIntegration === name
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between rounded-xl border bg-white px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-800">{name}</span>
                          {isConnected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                              <CheckCircleIcon className="h-3 w-3" />
                              Connected
                            </span>
                          )}
                        </div>
                        {isConnected ? (
                          <button
                            onClick={() => handleDisconnectIntegration(name)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-600 transition"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnectIntegration(name)}
                            disabled={isConnecting || statusLoading}
                            className="rounded-lg bg-[#3730a3] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
                          >
                            {isConnecting ? 'Connecting…' : 'Connect'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                {statusLoading && (
                  <p className="mt-2 text-xs text-gray-400">Checking connection status…</p>
                )}
                <p className="mt-3 text-xs text-gray-400">
                  You can update all integrations any time from{' '}
                  <strong>Settings → Integrations</strong>.
                </p>
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
                      <li>Chat widget: {chatEnabled ? 'Enabled' : 'Disabled'}</li>
                      {portalEnabled && (
                        <li>
                          Support portal:{' '}
                          {portalCustomDomain.trim()
                            ? portalCustomDomain.trim()
                            : portalUrl}
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
              className="rounded-xl bg-[#3730a3] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#312e81] transition"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3730a3] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#312e81] disabled:opacity-50 transition"
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
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
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
                  className="flex-1 rounded-xl bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#312e81] disabled:opacity-40 transition-colors"
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

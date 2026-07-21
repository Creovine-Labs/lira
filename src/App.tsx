import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner'

import {
  DashboardPage,
  LandingPageV3,
  LandingPageV4,
  HomePage,
  MeetingPage,
  MeetingsPage,
  MeetingDetailPage,
  UiLabPage,
  SettingsPage,
  OnboardingPage,
  OrganizationsPage,
  OrgSettingsPage,
  OrgMembersPage,
  MemberProfilePage,
  KnowledgeBasePage,
  TasksPage,
  OrgTaskDetailPage,
  OrgEmailPage,
  ProductSalesPage,
  ProductCustomerSupportPage,
  PricingPage,
  DemoSitePage,
  DemoHelpPage,
  SupportCenterDemoPage,
  LiraForFintechPage,
  LiraForHospitalityPage,
  ResourcesPage,
  TutorialsPage,
  DocsHubPage,
  DocArticlePage,
  BlogPage,
  BlogPostPage,
  AboutPage,
  FeaturesPage,
  CareersPage,
  BookDemoPage,
  ContactPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  CookiePolicyPage,
  AcceptableUsePolicyPage,
  RefundPolicyPage,
  SecurityPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AcceptInvitePage,
  MyTicketsPage,
  MyTicketDetailPage,
} from '@/pages'
import {
  AdminShell,
  AdminDashboardPage,
  AdminUsersPage,
  AdminOrganizationsPage,
  AdminEmailPage,
  AdminDemoOpsPage,
  AdminManagementPage,
  AdminInvitesPage,
  AdminPlanRequestsPage,
} from '@/pages/admin'
import { PortalAccessPage, PortalTicketsPage, PortalTicketDetailPage } from '@/pages/portal'
import {
  SupportActivatePage,
  SupportConversationPage,
  SupportNotificationsPage,
  SupportCustomerDetailPage,
  SupportInboxPage,
  SupportCustomersPage,
  SupportProactivePage,
  SupportAnalyticsPage,
  SupportQueuesPage,
  SupportSlaPoliciesPage,
  SupportTicketsPage,
  SupportTicketDetailPage,
  // SupportSettingsPage removed 2026-05-24 — content consolidated into
  // /settings → Support. The /support/configuration route now redirects.
} from '@/pages/support'
import { OrgLayout } from '@/components/org'
import { AppShell } from '@/components/shell'
import { useAuthStore, useOrgStore } from '@/app/store'
import { credentials } from '@/services/api'
import { env } from '@/env'
import { resetLiraWidgetSession } from '@/lib/lira-widget-session'

/** Listens for JWT expiry events dispatched by apiFetch and forces re-login. */
function AuthExpiryGuard() {
  const clearCredentials = useAuthStore((s) => s.clearCredentials)
  const clearOrgStore = useOrgStore((s) => s.clear)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => {
      credentials.clear()
      clearCredentials()
      clearOrgStore()
      resetLiraWidgetSession()
      navigate('/', { replace: true })
    }
    window.addEventListener('lira:auth-expired', handler)
    return () => window.removeEventListener('lira:auth-expired', handler)
  }, [clearCredentials, clearOrgStore, navigate])

  return null
}

function RootRoute() {
  const token = useAuthStore((s) => s.token)
  const [authHydrated, setAuthHydrated] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (authHydrated) return
    return useAuthStore.persist.onFinishHydration(() => setAuthHydrated(true))
  }, [authHydrated])

  if (!authHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-8 w-8 animate-spin opacity-60"
          style={{ animationDuration: '1.2s' }}
        />
      </div>
    )
  }

  if (token) return <Navigate to="/dashboard" replace />

  return <LandingPageV4 />
}

function App() {
  // demo subdomain — render the Nimbus demo directly, bypassing the main router.
  // Two paths supported: / (widget mode) and /help (full support page mode).
  if (window.location.hostname === 'demo.liraintelligence.com') {
    const path = window.location.pathname
    if (path === '/help' || path === '/help/') {
      return <DemoHelpPage />
    }
    return <DemoSitePage />
  }

  return (
    <GoogleOAuthProvider clientId={env.VITE_GOOGLE_LOGIN_CLIENT_ID}>
      <Routes>
        {/* Public routes — no shell */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/v3" element={<LandingPageV3 />} />
        <Route path="/v4" element={<LandingPageV4 />} />
        <Route path="/login" element={<HomePage defaultView="login" />} />
        <Route path="/signup" element={<HomePage defaultView="landing" />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/ui-lab" element={<UiLabPage />} />
        <Route path="/launch-demo" element={<Navigate to="/features" replace />} />
        <Route path="/products/sales" element={<ProductSalesPage />} />
        <Route path="/products/customer-support" element={<ProductCustomerSupportPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/demo" element={<DemoSitePage />} />
        <Route path="/demo/help" element={<DemoHelpPage />} />
        <Route path="/demo/support-center" element={<SupportCenterDemoPage />} />
        <Route path="/for/fintech" element={<LiraForFintechPage />} />
        <Route path="/for/hospitality" element={<LiraForHospitalityPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/docs" element={<DocsHubPage />} />
        <Route path="/docs/:slug" element={<DocArticlePage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/feature" element={<FeaturesPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/book-demo" element={<BookDemoPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/acceptable-use" element={<AcceptableUsePolicyPage />} />
        <Route path="/refund" element={<RefundPolicyPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/*
         * Customer-facing ticket portal — two auth modes share the same UI.
         *
         *   /portal/:orgId/*    magic-link (Phase 4 §2.1–2.5). Customer
         *                       enters their email, gets a magic link,
         *                       lands on /tickets?access_token=…
         *
         *   /verified/:orgId/*  embedded-SDK (Phase 4 §2.6). The SDK opens
         *                       /verified/:orgId/tickets?email=…&sig=… or
         *                       /verified/:orgId/tickets/:number?email=…&sig=…
         *                       The HMAC sig is computed by the host SDK;
         *                       the FE just persists what the URL provides.
         *
         * Both paths render the same components — `usePortalSession` in
         * PortalChrome detects the mode via the path prefix and routes the
         * API calls under /public/ vs /verified/ accordingly.
         */}
        <Route path="/portal/:orgId/access" element={<PortalAccessPage />} />
        <Route path="/portal/:orgId/tickets" element={<PortalTicketsPage />} />
        <Route path="/portal/:orgId/tickets/:ticketNumber" element={<PortalTicketDetailPage />} />
        <Route path="/portal/:orgId" element={<Navigate to="access" replace />} />

        <Route path="/verified/:orgId/tickets" element={<PortalTicketsPage />} />
        <Route path="/verified/:orgId/tickets/:ticketNumber" element={<PortalTicketDetailPage />} />
        <Route path="/verified/:orgId" element={<Navigate to="tickets" replace />} />

        {/* Authenticated routes — wrapped in AppShell (sidebar + topbar) */}
        <Route element={<AppShell />}>
          <Route path="/profile" element={<MemberProfilePage />} />
          <Route path="/tickets" element={<MyTicketsPage />} />
          <Route path="/tickets/:ticketNumber" element={<MyTicketDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/org" element={<OrgLayout />}>
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="knowledge" element={<KnowledgeBasePage />} />
            <Route
              path="documents"
              element={<Navigate to="/org/knowledge?tab=documents" replace />}
            />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<OrgTaskDetailPage />} />
            <Route path="members" element={<OrgMembersPage />} />
            <Route path="members/:userId" element={<MemberProfilePage />} />
            <Route path="email" element={<OrgEmailPage />} />
            <Route
              path="integrations"
              element={<Navigate to="/org/knowledge?tab=sources" replace />}
            />
            <Route
              path="webhooks"
              element={<Navigate to="/settings?tab=support&supportTab=developers" replace />}
            />
          </Route>
          <Route path="/support" element={<Navigate to="/support/inbox" replace />} />
          <Route path="/support/tickets" element={<SupportTicketsPage />} />
          <Route path="/support/tickets/:ticketId" element={<SupportTicketDetailPage />} />
          <Route path="/support/inbox" element={<SupportInboxPage />} />
          <Route path="/support/customers" element={<SupportCustomersPage />} />
          <Route path="/support/proactive" element={<SupportProactivePage />} />
          {/* /support/ai-actions consolidated into Settings → Support → Actions (2026-07-20) */}
          <Route
            path="/support/ai-actions"
            element={<Navigate to="/settings?tab=support&supportTab=actions" replace />}
          />
          <Route path="/support/analytics" element={<SupportAnalyticsPage />} />
          <Route
            path="/support/portal"
            element={<Navigate to="/settings?tab=support&supportTab=channels" replace />}
          />
          <Route path="/support/queues" element={<SupportQueuesPage />} />
          <Route path="/support/sla-policies" element={<SupportSlaPoliciesPage />} />
          <Route
            path="/support/integrations/outbox"
            element={<Navigate to="/support/tickets" replace />}
          />
          {/* Support configuration lives in one place: /settings?tab=support.
              Keep old links as redirects so bookmarks and older widget prompts
              do not open a second settings surface. */}
          <Route
            path="/support/configuration"
            element={<Navigate to="/settings?tab=support&supportTab=connect" replace />}
          />
          <Route
            path="/support/settings"
            element={<Navigate to="/settings?tab=support" replace />}
          />
          <Route path="/support/activate" element={<SupportActivatePage />} />
          <Route path="/support/inbox/:id" element={<SupportConversationPage />} />
          <Route path="/support/notifications" element={<SupportNotificationsPage />} />
          <Route path="/support/notifications/:id" element={<SupportConversationPage />} />
          <Route path="/support/customers/:id" element={<SupportCustomerDetailPage />} />
        </Route>

        {/* Admin dashboard — own shell, role-guarded */}
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="email" element={<AdminEmailPage />} />
          <Route path="demo-ops" element={<AdminDemoOpsPage />} />
          <Route path="invites" element={<AdminInvitesPage />} />
          <Route path="plan-requests" element={<AdminPlanRequestsPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthExpiryGuard />
      <Toaster position="top-right" richColors closeButton />
    </GoogleOAuthProvider>
  )
}

export default App

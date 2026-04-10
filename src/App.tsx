import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner'

import {
  DashboardPage,
  LandingPage,
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
  IntegrationsPage,
  WebhooksPage,
  InterviewsPage,
  InterviewRolePage,
  InterviewCreatePage,
  InterviewDetailPage,
  ProductSalesPage,
  ProductInterviewsPage,
  ProductCustomerSupportPage,
  ResourcesPage,
  TutorialsPage,
  BlogPage,
  BlogPostPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  CookiePolicyPage,
  AcceptableUsePolicyPage,
  SecurityPage,
  UsagePage,
  LaunchDemoPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SupportActivatePage,
  SupportOnboardingPage,
  SupportHomePage,
  SupportEntryPage,
  SupportInboxPage,
  SupportConversationDetailPage,
  SupportConversationActionPage,
  SupportEscalationPage,
  SupportHumanOverridePage,
  SupportCSATPage,
  SupportVoiceTranscriptPage,
  SupportCustomerListPage,
  SupportCustomerProfilePage,
  SupportCustomerTimelinePage,
  SupportCustomerCRMPage,
  SupportProactiveTriggerListPage,
  SupportProactiveTriggerWizardPage,
  SupportProactiveActivityLogPage,
  SupportKnowledgeLibraryPage,
  SupportKnowledgeDraftQueuePage,
  SupportKnowledgeEntryEditorPage,
  SupportKnowledgeGapReportPage,
  SupportActionApprovalQueuePage,
  SupportActionHistoryPage,
  SupportActionChainPage,
  SupportActionIntegrationHealthPage,
  SupportAnalyticsOverviewPage,
  SupportProactiveOutreachPage,
  SupportWeeklyReportPage,
  SupportBillingOutcomePage,
} from '@/pages'
import {
  AdminShell,
  AdminDashboardPage,
  AdminUsersPage,
  AdminOrganizationsPage,
  AdminEmailPage,
  AdminManagementPage,
} from '@/pages/admin'
import { OrgLayout } from '@/components/org'
import { AppShell } from '@/components/shell'
import { useAuthStore, useOrgStore } from '@/app/store'
import { credentials } from '@/services/api'
import { env } from '@/env'

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
      navigate('/', { replace: true })
    }
    window.addEventListener('lira:auth-expired', handler)
    return () => window.removeEventListener('lira:auth-expired', handler)
  }, [clearCredentials, clearOrgStore, navigate])

  return null
}

function App() {
  return (
    <GoogleOAuthProvider clientId={env.VITE_GOOGLE_LOGIN_CLIENT_ID}>
      <Routes>
        {/* Public routes — no shell */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<HomePage defaultView="login" />} />
        <Route path="/signup" element={<HomePage defaultView="landing" />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/ui-lab" element={<UiLabPage />} />
        <Route path="/launch-demo" element={<LaunchDemoPage />} />
        <Route path="/products/sales" element={<ProductSalesPage />} />
        <Route path="/products/interviews" element={<ProductInterviewsPage />} />
        <Route path="/products/customer-support" element={<ProductCustomerSupportPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/acceptable-use" element={<AcceptableUsePolicyPage />} />
        <Route path="/security" element={<SecurityPage />} />
        
        {/* ── Customer Support module — Activation & Onboarding (no shell) ── */}
        <Route path="/support/activate" element={<SupportActivatePage />} />
        <Route path="/support/onboarding" element={<SupportOnboardingPage />} />

        {/* Authenticated routes — wrapped in AppShell (sidebar + topbar) */}
        <Route element={<AppShell />}>
          <Route path="/profile" element={<MemberProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          {/* ── Customer Support module (with shell) ── */}
          <Route path="/support" element={<SupportEntryPage />} />
          <Route path="/support/home" element={<SupportHomePage />} />
          <Route path="/support/inbox" element={<SupportInboxPage />} />
          <Route path="/support/inbox/:id" element={<SupportConversationDetailPage />} />
          <Route path="/support/inbox/:id/action" element={<SupportConversationActionPage />} />
          <Route path="/support/inbox/:id/escalation" element={<SupportEscalationPage />} />
          <Route path="/support/inbox/:id/override" element={<SupportHumanOverridePage />} />
          <Route path="/support/inbox/:id/csat" element={<SupportCSATPage />} />
          <Route path="/support/inbox/:id/voice" element={<SupportVoiceTranscriptPage />} />
          <Route path="/support/customers" element={<SupportCustomerListPage />} />
          <Route path="/support/customers/:id" element={<SupportCustomerProfilePage />} />
          <Route path="/support/customers/:id/timeline" element={<SupportCustomerTimelinePage />} />
          <Route path="/support/customers/:id/crm" element={<SupportCustomerCRMPage />} />
          <Route path="/support/proactive" element={<SupportProactiveTriggerListPage />} />
          <Route path="/support/proactive/new" element={<SupportProactiveTriggerWizardPage />} />
          <Route path="/support/proactive/activity" element={<SupportProactiveActivityLogPage />} />
          <Route path="/support/knowledge" element={<SupportKnowledgeLibraryPage />} />
          <Route path="/support/knowledge/drafts" element={<SupportKnowledgeDraftQueuePage />} />
          <Route path="/support/knowledge/drafts/:id/edit" element={<SupportKnowledgeEntryEditorPage />} />
          <Route path="/support/knowledge/new" element={<SupportKnowledgeEntryEditorPage />} />
          <Route path="/support/knowledge/gaps" element={<SupportKnowledgeGapReportPage />} />
          <Route path="/support/actions" element={<SupportActionApprovalQueuePage />} />
          <Route path="/support/actions/history" element={<SupportActionHistoryPage />} />
          <Route path="/support/actions/chain" element={<SupportActionChainPage />} />
          <Route path="/support/actions/integrations" element={<SupportActionIntegrationHealthPage />} />
          <Route path="/support/analytics" element={<SupportAnalyticsOverviewPage />} />
          <Route path="/support/analytics/proactive" element={<SupportProactiveOutreachPage />} />
          <Route path="/support/analytics/weekly" element={<SupportWeeklyReportPage />} />
          <Route path="/support/analytics/billing" element={<SupportBillingOutcomePage />} />
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
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="usage" element={<UsagePage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="roles" element={<InterviewsPage />} />
            <Route path="roles/new" element={<InterviewCreatePage />} />
            <Route path="roles/:roleSlug" element={<InterviewRolePage />} />
            <Route path="interviews" element={<Navigate to="/org/roles" replace />} />
            <Route path="interviews/:interviewId/edit" element={<InterviewCreatePage />} />
            <Route path="interviews/:interviewId" element={<InterviewDetailPage />} />
          </Route>
        </Route>

        {/* Admin dashboard — own shell, role-guarded */}
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="email" element={<AdminEmailPage />} />
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

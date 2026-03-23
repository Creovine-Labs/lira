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
  DocumentsPage,
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
  BlogPage,
  BlogPostPage,
} from '@/pages'
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
    <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID}>
      <Routes>
        {/* Public routes — no shell */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<HomePage defaultView="login" />} />
        <Route path="/signup" element={<HomePage defaultView="signup" />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/ui-lab" element={<UiLabPage />} />
        <Route path="/products/sales" element={<ProductSalesPage />} />
        <Route path="/products/interviews" element={<ProductInterviewsPage />} />
        <Route path="/products/customer-support" element={<ProductCustomerSupportPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Authenticated routes — wrapped in AppShell (sidebar + topbar) */}
        <Route element={<AppShell />}>
          <Route path="/profile" element={<MemberProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/org" element={<OrgLayout />}>
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="knowledge" element={<KnowledgeBasePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<OrgTaskDetailPage />} />
            <Route path="members" element={<OrgMembersPage />} />
            <Route path="members/:userId" element={<MemberProfilePage />} />
            <Route path="email" element={<OrgEmailPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="roles" element={<InterviewsPage />} />
            <Route path="roles/new" element={<InterviewCreatePage />} />
            <Route path="roles/:roleSlug" element={<InterviewRolePage />} />
            <Route path="interviews" element={<Navigate to="/org/roles" replace />} />
            <Route path="interviews/:interviewId/edit" element={<InterviewCreatePage />} />
            <Route path="interviews/:interviewId" element={<InterviewDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthExpiryGuard />
      <Toaster position="top-right" richColors closeButton />
    </GoogleOAuthProvider>
  )
}

export default App

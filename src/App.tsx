import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner'

import {
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
  KnowledgeBasePage,
  DocumentsPage,
  TasksPage,
  OrgTaskDetailPage,
  WebhooksPage,
  InterviewsPage,
  InterviewRolePage,
  InterviewCreatePage,
  InterviewDetailPage,
} from '@/pages'
import { OrgLayout } from '@/components/org'
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
        <Route path="/" element={<HomePage />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/ui-lab" element={<UiLabPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/org" element={<OrgLayout />}>
          <Route path="settings" element={<OrgSettingsPage />} />
          <Route path="knowledge" element={<KnowledgeBasePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:taskId" element={<OrgTaskDetailPage />} />
          <Route path="members" element={<OrgMembersPage />} />
          <Route path="webhooks" element={<WebhooksPage />} />
          <Route path="roles" element={<InterviewsPage />} />
          <Route path="roles/new" element={<InterviewCreatePage />} />
          <Route path="roles/:roleSlug" element={<InterviewRolePage />} />
          <Route path="interviews" element={<Navigate to="/org/roles" replace />} />
          <Route path="interviews/:interviewId/edit" element={<InterviewCreatePage />} />
          <Route path="interviews/:interviewId" element={<InterviewDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthExpiryGuard />
      <Toaster position="top-right" richColors closeButton />
    </GoogleOAuthProvider>
  )
}

export default App

import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { HomePage, MeetingPage, UiLabPage } from '@/pages'
import { useAuthStore } from '@/app/store'
import { credentials } from '@/services/api'
import { env } from '@/env'

/** Listens for JWT expiry events dispatched by apiFetch and forces re-login. */
function AuthExpiryGuard() {
  const clearCredentials = useAuthStore((s) => s.clearCredentials)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => {
      credentials.clear()
      clearCredentials()
      navigate('/', { replace: true })
    }
    window.addEventListener('lira:auth-expired', handler)
    return () => window.removeEventListener('lira:auth-expired', handler)
  }, [clearCredentials, navigate])

  return null
}

function App() {
  return (
    <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/ui-lab" element={<UiLabPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthExpiryGuard />
    </GoogleOAuthProvider>
  )
}

export default App

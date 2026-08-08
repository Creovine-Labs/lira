import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'

import { useAuthStore } from '@/app/store'
import { credentials, mintVoiceSso } from '@/services/api'

function voiceAppUrl(): string {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}/`
  }
  return 'https://voice.liraintelligence.com/'
}

export function VoiceSsoBridgePage() {
  const token = useAuthStore((s) => s.token)
  const [error, setError] = useState<string | null>(null)
  const returnTo = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('returnTo')
    return raw || voiceAppUrl()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const stored = token || credentials.getToken()
      if (!stored) return
      try {
        const handoff = await mintVoiceSso(returnTo)
        if (!cancelled) window.location.replace(handoff.redirectUrl)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not open Lira Voice')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [returnTo, token])

  if (!token && !credentials.getToken()) {
    return (
      <main className="min-h-screen bg-[#f4f0e8] px-5 py-10 text-[#171412]">
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
          <img src="/lira_black.png" alt="Lira" className="h-10 w-10" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in to open Lira Voice</h1>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Voice uses your existing Lira account and workspaces. Sign in on the dashboard, then
            continue to the Voice app.
          </p>
          <Link
            to={`/login?next=${encodeURIComponent(`/voice-sso?returnTo=${encodeURIComponent(returnTo)}`)}`}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f0e8] px-5 py-10 text-[#171412]">
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
        <img src="/lira_black.png" alt="Lira" className="h-10 w-10" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Opening Lira Voice</h1>
        <p className="mt-3 text-sm leading-6 text-black/60">
          Creating a secure one-time handoff for the Voice app.
        </p>
        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <Loader2 className="mt-6 h-5 w-5 animate-spin text-black/50" />
        )}
      </div>
    </main>
  )
}

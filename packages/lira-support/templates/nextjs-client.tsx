'use client'

import { useEffect, useState } from 'react'
import { LiraProvider, LiraSupportPage, useLiraAction } from '@liraintelligence/support/react'

export function LiraSupport() {
  const user = useCurrentUser()
  const [sig, setSig] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return
    fetch('/api/lira/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    })
      .then((r) => r.json())
      .then(({ sig }) => setSig(sig))
      .catch(() => setSig(null))
  }, [user?.email])

  const identity = user?.email && sig ? { email: user.email, name: user.name, sig } : undefined

  return (
    <LiraProvider
      config={{
        orgId: process.env.NEXT_PUBLIC_LIRA_ORG_ID!,
        orgName: '{{ORG_NAME}}',
        primaryColor: '#111827',
        greeting: 'Hi! How can we help?',
      }}
      identity={identity}
      context={{ route: '/support', account: user ?? undefined }}
    >
      <CustomerActions />
      <LiraSupportPage style={{ minHeight: 720 }} />
    </LiraProvider>
  )
}

function CustomerActions() {
  // Register the actions Lira is allowed to trigger from the chat.
  // Add or remove as your product grows.
  useLiraAction('billing.open_checkout', async ({ payload }) => {
    window.location.href = `/checkout?plan=${payload.plan ?? 'pro'}`
    return { ok: true, message: 'Checkout opened' }
  })
  return null
}

// TODO: replace with your real auth hook.
function useCurrentUser() {
  return {
    email: 'demo@example.com',
    name: 'Demo User',
    accountId: 'acct_demo',
    plan: 'pro',
  }
}

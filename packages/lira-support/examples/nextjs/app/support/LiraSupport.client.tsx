'use client'

import { useEffect, useState } from 'react'
import { LiraProvider, LiraSupportPage, useLiraAction } from '@liraintelligence/support/react'

/**
 * Mounts the Lira support runtime inside a customer-owned route.
 * Replace `useCurrentUser` with whatever auth hook your app uses.
 */
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
        orgName: 'LemonPay',
        primaryColor: '#111827',
        greeting: 'Hi! How can we help?',
      }}
      identity={identity}
      context={{
        route: '/support',
        account: user
          ? { id: user.accountId, plan: user.plan, status: user.subscriptionStatus }
          : undefined,
      }}
    >
      <CustomerActions />
      <LiraSupportPage style={{ minHeight: 720 }} />
    </LiraProvider>
  )
}

/**
 * Customer-defined actions Lira can trigger from chat.
 * Mount once anywhere inside <LiraProvider>.
 */
function CustomerActions() {
  useLiraAction('billing.open_checkout', async ({ payload }) => {
    // Replace with your real checkout flow
    window.location.href = `/checkout?plan=${payload.plan ?? 'pro'}`
    return { ok: true, message: 'Checkout opened' }
  })

  useLiraAction('account.refresh_billing_status', async () => {
    const res = await fetch('/api/account/refresh-billing', { method: 'POST' })
    if (!res.ok) return { ok: false, message: 'Refresh failed' }
    const data = (await res.json()) as { status: string }
    return { ok: true, message: 'Billing refreshed', data }
  })

  return null
}

// Replace this with your real auth hook.
function useCurrentUser() {
  return {
    email: 'demo@lemonpay.com',
    name: 'Demo User',
    accountId: 'acct_demo',
    plan: 'pro',
    subscriptionStatus: 'active' as const,
  }
}

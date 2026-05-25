import { LiraProvider, LiraSupportPage, useLiraAction } from '@liraintelligence/support/react'

export function Support() {
  return (
    <LiraProvider
      config={{
        orgId: import.meta.env.VITE_LIRA_ORG_ID,
        orgName: '{{ORG_NAME}}',
        primaryColor: '#111827',
        greeting: 'Hi! How can we help?',
      }}
      // identity={{ email, name, sig }}  // when you have logged-in users
    >
      <CustomerActions />
      <LiraSupportPage style={{ minHeight: 720 }} />
    </LiraProvider>
  )
}

function CustomerActions() {
  useLiraAction('billing.open_checkout', async ({ payload }) => {
    window.location.href = `/checkout?plan=${payload.plan ?? 'pro'}`
    return { ok: true, message: 'Checkout opened' }
  })
  return null
}

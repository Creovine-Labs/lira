# @liraintelligence/support

Lira Support Web SDK for customer-owned support routes, floating widgets,
verified identity, live product context, and customer-side actions.

## Install

```bash
npm install @liraintelligence/support
```

## Full-page support

```ts
import { init, identify, setContext, mountSupportPage } from '@liraintelligence/support'

await init({ orgId: 'org_123', orgName: 'LemonPay' })
await identify({
  email: currentUser.email,
  name: currentUser.name,
  sig: serverGeneratedHmac,
})
await setContext({
  route: window.location.pathname,
  account: { id: currentUser.accountId, plan: currentUser.plan },
})
await mountSupportPage('#lira-support-root')
```

## React

```tsx
import { LiraProvider, LiraSupportPage } from '@liraintelligence/support/react'

export function SupportRoute() {
  return (
    <LiraProvider config={{ orgId: 'org_123', orgName: 'LemonPay' }}>
      <LiraSupportPage style={{ minHeight: 720 }} />
    </LiraProvider>
  )
}
```

## Customer actions

```ts
import { registerAction } from '@liraintelligence/support'

registerAction('billing.open_checkout', async ({ payload }) => {
  await openCheckout(payload)
  return { ok: true, message: 'Checkout opened' }
})
```

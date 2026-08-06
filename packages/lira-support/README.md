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

## Test and live mode

Your staging and production environments can run against the same Lira
workspace at the same time. The key decides the mode — not the workspace.

```html
<!-- staging build -->
<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="org_123"
  data-publishable-key="lira_pk_test_..."
  async
></script>

<!-- production build -->
<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="org_123"
  data-publishable-key="lira_pk_live_..."
  async
></script>
```

```ts
init({ orgId: 'org_123', publishableKey: process.env.NEXT_PUBLIC_LIRA_PUBLISHABLE_KEY })
```

Test traffic has its own quota, sends no real emails/Slack/Linear/webhooks, and
stays out of the live inbox.

## CLI

```bash
lira status                         # org, mode, workspace — what will my next command do?
lira mode                           # show the current mode and saved keys
lira mode test | lira mode live     # switch which key your commands use
lira keys use --api-key=lira_sk_live_...   # save a key (mode read from the prefix)

lira env show                       # is the workspace live?
lira env go-live                    # move to production (real sends + billing)
lira env sandbox                    # go back

lira channels                       # what's on: chat, voice, email, portal
lira channels enable voice          # customers can call, on web and mobile
lira channels disable portal
```

`lira mode` picks the **key**. `lira env` changes the **workspace** — the
commercial switch. A live key stays inert until the workspace has gone live, so
preparing production config early is safe.

Docs: https://docs.liraintelligence.com/platform/customer-support/test-and-live-mode

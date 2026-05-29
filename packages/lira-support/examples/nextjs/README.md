# Next.js example — `@liraintelligence/support`

Drop-in example showing how to mount a full Lira support page at
`yourapp.com/support` using the App Router, with identified visitors and
customer actions.

## Setup

```bash
npm install @liraintelligence/support
```

Set your org ID in `.env.local`:

```env
NEXT_PUBLIC_LIRA_ORG_ID=org-xxxxxxxxxxxxxxxxxxxx
LIRA_WIDGET_SECRET=your-server-only-widget-secret
```

## Files

- `app/support/page.tsx` — the support route (server component shell + client mount)
- `app/support/LiraSupport.client.tsx` — client component that mounts the SDK
- `app/api/lira/sign/route.ts` — signs the logged-in visitor's email server-side
- `app/layout.tsx` — adds the floating widget on every other page (optional)

## Identify your users

`/api/lira/sign` returns an HMAC of the visitor's email computed with your
`LIRA_WIDGET_SECRET`. Never expose the secret in the browser.

Once a user is signed in, fetch the signature, then pass it to `<LiraSupport />`.

## Customer actions

The example registers two actions Lira can trigger from the chat:

- `billing.open_checkout` — opens your Stripe checkout flow
- `account.refresh_billing_status` — refreshes the user's plan from your DB

Replace the implementations with your real ones.

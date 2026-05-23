# Verify Logged-In Customers

This guide covers the verified customer flow for the Lira support widget. It is based on the current widget, support settings panel, and support identity checks already present in the codebase.

## What verified customers unlock

Verified visitors let Lira do more than answer generic questions. When the widget can trust the customer identity, Lira can:

- Greet the customer by name
- Associate the conversation with the right customer record
- Use customer-aware tools and account context
- Make escalations and follow-up cleaner for the human team

Anonymous visitors can still chat, but account-specific actions should stay gated behind verification.

## How verification works

The verified flow uses three widget attributes:

- `data-email`
- `data-name`
- `data-sig`

The signature is generated on your server with HMAC-SHA256 using the widget secret from Lira Support settings.

The current flow is:

1. Your user signs in to your product using your own authentication.
2. Your server reads the user email.
3. Your server computes `HMAC-SHA256(LIRA_WIDGET_SECRET, user.email)`.
4. Your page injects `data-email`, `data-name`, and `data-sig` into the widget script tag.
5. Lira verifies the signature before treating the visitor as a verified customer.

## Where to get the widget secret

The widget secret is exposed in the Support settings area for the org.

Use it only on the server side:

- Store it as an environment variable such as `LIRA_WIDGET_SECRET`
- Never expose it in browser code
- Rotate it carefully because rotation invalidates existing signatures immediately

## Verified widget snippet

```html
<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="org_abc123"
  data-email="user@example.com"
  data-name="Jane Doe"
  data-sig="hmac_hex_signature"
  data-position="bottom-right"
  async
></script>
```

## Example server-side signature

```js
const crypto = require('crypto')

const sig = crypto
  .createHmac('sha256', process.env.LIRA_WIDGET_SECRET)
  .update(currentUser.email)
  .digest('hex')
```

The current implementation signs the email value. If the email changes, the signature must be regenerated for that user.

## Recommended implementation pattern

- On authenticated pages, inject `data-email`, `data-name`, and `data-sig`
- On public pages, omit all three fields and let the widget run as anonymous
- Keep signature generation on the server
- Use the same org ID in both anonymous and verified installs

## Security notes

- Do not compute the HMAC in the browser
- Do not hardcode the widget secret in frontend bundles
- Treat tampered signatures as anonymous visitors
- Re-test the verified flow every time you rotate the secret

The product dogfood plan already treats a broken or modified signature as a fallback-to-anonymous case, not as a crash path.

## How to test verified visitors

Use this checklist:

1. Open the page as an anonymous visitor.
2. Confirm the widget still loads and chat works.
3. Open the signed-in version of the page with `data-email`, `data-name`, and `data-sig`.
4. Ask a customer-aware question such as "what's on file for me?"
5. Confirm Lira recognizes the verified customer.
6. Tamper with one character in `data-sig`.
7. Confirm the widget falls back safely instead of leaking customer data.

## What changes after verification

Once the visitor is verified, the support flow becomes more useful for real support operations:

- Customer context can be resolved more reliably
- Handoffs keep the right identity attached to the thread
- Agentic support tools can be gated to trusted customers only

That makes verified install the recommended mode for logged-in product surfaces, while anonymous mode remains the right default for public marketing pages.

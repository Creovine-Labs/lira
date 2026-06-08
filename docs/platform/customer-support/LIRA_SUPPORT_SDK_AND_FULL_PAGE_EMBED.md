# Lira Support SDK and Full-Page Embed

This is the tracked implementation plan for turning the current support widget
runtime into a real B2B integration surface.

This SDK work is one surface of the broader
[`AGENTIC_ORGANIZATION_RUNTIME.md`](./AGENTIC_ORGANIZATION_RUNTIME.md)
architecture. The SDK should carry the same identity, context, resource, action,
policy, and audit model used by the widget, full-page embed, dashboard
assistant, and future mobile SDK.

The goal is not to force customers to send their users to a Lira-hosted support
URL. A hosted portal can exist as a no-code fallback, but the primary product
should let a company run support inside its own product, for example
`lemonpay.com/support`, while Lira provides the AI runtime, tickets, escalation,
knowledge base, identity, context, and action infrastructure.

## Product stance

| Surface         | Purpose                                       | Owner of page/UI shell | Lira owns                                           |
| --------------- | --------------------------------------------- | ---------------------- | --------------------------------------------------- |
| Chat widget     | Floating support on an app or site            | Customer page          | Chat UI, AI, tickets, escalation                    |
| Full-page embed | Native support center inside customer app     | Customer route/layout  | Support conversation, ticket state, AI, KB, actions |
| Headless SDK    | Custom support UI built by customer engineers | Customer               | Transport, identity, context, actions, ticket APIs  |
| Hosted portal   | No-code fallback or temporary setup           | Lira                   | Whole page                                          |

The long-term answer is an SDK. The immediate implementation can still reuse
the current widget code, but only as one adapter inside the SDK contract.

## Target SDK contract

### Browser global

The CDN build should expose `window.Lira`:

```html
<div id="support-root"></div>
<script src="https://widget.liraintelligence.com/v1/widget.js"></script>
<script>
  window.Lira.init({
    orgId: 'org_...',
    primaryColor: '#2563eb',
    orgName: 'LemonPay'
  })

  window.Lira.identify({
    email: 'ada@lemonpay.com',
    name: 'Ada',
    sig: 'server_generated_hmac'
  })

  window.Lira.setContext({
    page: '/support',
    account: { plan: 'Growth', status: 'active' }
  })

  window.Lira.mountSupportPage('#support-root')
<\/script>
```

### NPM package shape

Package names:

- `@liraintelligence/support`: framework-agnostic browser runtime
- `@liraintelligence/support/react`: React provider and components

Source location:

- Package source: `packages/lira-support/src`
- Package manifest: `packages/lira-support/package.json`
- Build config: `vite.sdk.config.ts`
- Declaration config: `tsconfig.sdk.json`
- Build output: `dist/sdk`
- Build command: `npm run build:sdk`
- Local package verification: `npm pack dist/sdk`
- Registry publish status: package is build/pack ready; npm publish requires
  logging into npm on the deployment machine.

Core API:

```ts
Lira.init(config)
Lira.identify(visitor)
Lira.setContext(context)
Lira.track(eventName, payload)
Lira.registerAction(name, handler)
Lira.unregisterAction(name)
Lira.mountWidget(options)
Lira.mountSupportPage(target, options)
Lira.destroy()
```

Action API:

```ts
import { registerAction } from '@liraintelligence/support'

registerAction('billing.open_checkout', async ({ payload }) => {
  await openCheckout(payload)
  return { ok: true, message: 'Checkout opened' }
})
```

First SDK-loader usage:

```ts
import { init, identify, setContext, mountSupportPage } from '@liraintelligence/support'

await init({ orgId: 'org_...', orgName: 'LemonPay' })
await identify({ email: 'ada@lemonpay.com', name: 'Ada', sig: 'server_generated_hmac' })
await setContext({ route: '/support', account: { plan: 'Growth' } })
await mountSupportPage('#support-root')
```

React usage:

```tsx
import { LiraProvider, LiraSupportPage } from '@liraintelligence/support/react'

export function SupportRoute() {
  return (
    <LiraProvider config={{ orgId: 'org_...', orgName: 'LemonPay' }}>
      <LiraSupportPage />
    </LiraProvider>
  )
}
```

## Reused runtime

The SDK must reuse these existing pieces instead of duplicating them:

- Widget socket transport and conversation persistence
- Signed visitor identity fields
- Demo/account context transport
- Live product context events
- `lira_action` event dispatch
- Markdown/table/code rendering
- Ticket escalation and handback behavior
- Existing backend Pipecat/chat agent path

## Phases

### Phase 1, Contract and first browser SDK

Status: Done

Deliverables:

- Add this implementation plan.
- Expose `window.Lira` from the CDN widget bundle.
- Support `init`, `identify`, `setContext`, `mountWidget`,
  `mountSupportPage`, and `destroy`.
- Keep existing `<script data-org-id="...">` widget embeds working.
- Add full-page mount mode that renders into a customer-owned container.

Acceptance:

- Existing widget embed still auto-renders as a floating bubble.
- A customer can mount full-page support with:
  `window.Lira.init(...); window.Lira.mountSupportPage('#support-root')`.
- Full-page mode has no launcher bubble and fills the target container.

### Phase 2, Full-page support UX

Status: Done

Deliverables:

- Support-page layout refinements for desktop and mobile.
- First-screen greeting, search/chat entry, ticket history shell.
- Same premium message rendering as the widget.
- Keep conversation state shared with widget for the same visitor/org.

Acceptance:

- `/demo/help` can use the SDK full-page embed instead of a bespoke local UI.
- Refresh keeps the conversation.
- Escalated conversations clearly become tickets.

### Phase 2.5, Customer install surfaces and docs

Status: Done

Deliverables:

- Activation success screen leads with the full-page SDK snippet.
- Support settings exposes a Web SDK tab with full-page, JavaScript API, and
  floating widget snippets.
- Hosted portal is demoted to a no-code fallback, not the primary B2B path.
- Public docs include a Web SDK guide for customer-owned support routes.

Acceptance:

- A customer like LemonPay can create `lemonpay.com/support`, paste the
  full-page SDK snippet, and keep the experience on its own domain.
- Settings and docs no longer tell customers to iframe the hosted portal as the
  main integration.

### Phase 3, Headless runtime split

Status: Done, first package boundary

Deliverables:

- Extract package-facing identity, context, lifecycle, action registry, and
  script loading into framework-agnostic modules.
- Keep UI adapters thin: package calls into the CDN widget runtime for rendering
  while preserving a headless client boundary.
- Document stable events and lifecycle hooks.

Acceptance:

- `mountWidget` and `mountSupportPage` share the same `LiraClient`.
- Package source lives under `packages/lira-support/src`, not inside the app UI.
- React components mount through the client without touching widget internals.

### Phase 4, React SDK

Status: Done, first adapter

Deliverables:

- `LiraProvider`
- `useLira`
- `LiraSupportPage`
- `LiraWidget`
- TypeScript types for config, visitor, context, events, tickets, and actions.

Acceptance:

- A React customer can install the package and render:
  `<LiraSupportPage />` inside its own route.

### Phase 5, Customer action layer

Status: Done, client-side V1

Deliverables:

- Public `registerAction` API.
- Public `unregisterAction` API.
- Action result events through `lira:action_result`.
- Namespaced action targets to avoid collisions.

Acceptance:

- A customer can register actions such as `billing.open_checkout` and execute
  them when Lira emits a matching `lira:action`.
- The SDK reports success/failure locally and tracks `lira_action_result`.

Note: backend-visible action-result ingestion is a follow-up. The current V1
preserves the existing safe host-page event bridge and adds typed customer
registration.

### Phase 6, Ticket and portal APIs

Status: Planned

Deliverables:

- SDK methods for ticket list, ticket detail, reply, reopen, close.
- Full-page UI for open tickets and past conversations.
- Optional hosted portal remains a no-code fallback.

Acceptance:

- Full-page support is usable as a real customer support center, not only chat.

### Phase 6.5, Messenger home and multi-conversation UX

Status: In progress

Deliverables:

- Every surface, floating widget, dashboard embed, and full-page SDK embed,
  opens into a two-tab messenger: Home and Chat.
- Home is org-configurable with `home_logo_url`, `home_title`,
  `home_subtitle`, and `home_cards`.
- Chat opens to a conversation list, not directly into a single thread.
- Clicking a home card starts a topic-specific conversation; clicking that
  same card later reopens the existing topic thread.
- Dashboard onboarding keeps the guided setup CTA and adds a separate
  "Start a conversation" action.
- The widget can resume a selected conversation through a `convId` socket
  parameter.

Acceptance:

- A LemonPay admin can design the home screen in Settings.
- A visitor sees one thread per topic and can switch between old threads.
- Full-page SDK mode and floating widget mode share the same behavior.

### Phase 7, Packaging and distribution

Status: Done, package artifact ready

Deliverables:

- CDN bundle: `https://widget.liraintelligence.com/v1/widget.js`
- NPM package build with ESM and CJS output.
- TypeScript declarations.
- Public install docs.
- Versioned changelog and migration notes.

Acceptance:

- Customers can either paste a script tag or install an NPM package.
- Breaking changes are versioned, documented, and avoid silent behavior changes.

## Implementation log

| Date       | Phase | Change                                                             | Status      |
| ---------- | ----- | ------------------------------------------------------------------ | ----------- |
| 2026-05-24 | 1     | Created SDK/full-page embed plan                                   | Done        |
| 2026-05-24 | 1     | Added `window.Lira` browser API and full-page widget mode          | Done        |
| 2026-05-24 | 1     | Added first `src/sdk` NPM-loader entrypoint and `build:sdk` config | Done        |
| 2026-05-24 | 1     | Deployed updated widget bundle to CDN and invalidated `/v1/*`      | Done        |
| 2026-05-24 | 2     | Rewired `/demo/help` to use the SDK full-page embed surface        | Done        |
| 2026-05-24 | 2     | Added full-page SDK dogfood checks and deployed frontend to Vercel | Done        |
| 2026-05-24 | 2.5   | Updated activation/settings/docs to make Web SDK primary           | Done        |
| 2026-05-24 | 3     | Added `packages/lira-support` headless client boundary             | Done        |
| 2026-05-24 | 4     | Added React exports: provider, hook, support page, widget          | Done        |
| 2026-05-24 | 5     | Added customer action registration APIs                            | Done        |
| 2026-05-24 | 7     | Added package manifest, declarations, and `npm run build:sdk`      | Done        |
| 2026-05-29 | 6.5   | Added org-configurable Home tab and multi-conversation widget UX   | In progress |

## Notes for future debugging

When something fails, classify it before changing code:

- SDK contract issue: public API shape, config merging, lifecycle
- UI adapter issue: widget/full-page rendering, layout, message controls
- Runtime issue: socket, identity, context, persistence
- Backend issue: agent prompt, tools, escalation, ticket APIs
- Customer integration issue: selector not found, missing HMAC, wrong org ID

This separation matters because the internal dogfood version and the public SDK
will share one structure. Fixes should land in the layer that actually owns the
problem.

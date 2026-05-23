# Customer Support Setup

This guide covers the first live setup for Lira Customer Support based on the current product and codebase. It is focused on the website chat widget, support activation, and the settings that are already wired in the app.

## What you launch in setup

Lira Customer Support can be activated with these channels and surfaces that already exist in the product:

- Website chat via the public widget at `https://widget.liraintelligence.com/v1/widget.js`
- Support email with an org-specific support address
- A branded support portal
- Optional voice support in the widget and portal when enabled for the org

The main activation flow lives in the support activation experience. After activation, the ongoing widget configuration and secret management live under Support settings.

## Before you embed the widget

Make sure you have:

- An activated support configuration for your organization
- Your org ID
- A published website where the widget script can be added before `</body>`

If you want verified customers, you also need the widget secret from Support settings, but anonymous setup does not require that.

## Anonymous visitor install

For a public website, use the anonymous widget snippet first:

```html
<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="org_abc123"
  data-position="bottom-right"
  async
></script>
```

If you have already set a widget brand color in Lira, you can also include `data-color`:

```html
<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="org_abc123"
  data-color="#3730a3"
  data-position="bottom-right"
  async
></script>
```

## Supported script attributes

The widget currently supports these setup attributes:

- `data-org-id`  
  Required. Connects the widget to your organization.
- `data-position`  
  Optional. Supported values are `bottom-right` and `bottom-left`.
- `data-color`  
  Optional. Overrides the primary widget color.
- `data-greeting`  
  Optional. Overrides the greeting message shown in chat.
- `data-email`  
  Optional. Used only for verified logged-in customers.
- `data-name`  
  Optional. Used only for verified logged-in customers.
- `data-sig`  
  Optional. HMAC signature for verified logged-in customers.

## What the widget already does

The shipped widget already includes:

- Shadow DOM isolation so host-site styles do not break the widget
- Persistent visitor ID in local storage
- Conversation history caching for 24 hours per org
- WebSocket reconnect behavior with backoff
- Optional pre-chat form support
- Optional voice mode when voice is enabled for the org
- Escalation, human reply, handback, proactive messages, and CSAT flow

## Configuration inside Lira

After activation, Support settings is where you manage:

- Widget embed snippets
- Widget color
- Widget secret for verified visitors
- Secret rotation

The broader support configuration also includes:

- Greeting message
- Voice enablement
- Portal enablement
- Portal slug
- Portal branding
- Portal chat, voice, submit-a-request, and tracking toggles
- Escalation destinations and AI behavior

## Support email during setup

During support activation, Lira automatically generates a support email address for the org. You can:

- Share that address directly with customers
- Or forward your existing support inbox into the Lira address

That lets email support land in the same support system as chat and portal conversations.

## Support portal during setup

The support portal can be enabled as part of the same activation flow. The product already supports:

- A portal slug
- Optional custom domain field
- Portal color, logo, and greeting
- Live chat toggle
- Voice toggle
- Submit-a-request toggle
- Track-tickets toggle

## Recommended first launch sequence

1. Activate support for the org.
2. Confirm the support email address.
3. Embed the anonymous widget on your public website.
4. Test a conversation from an incognito window.
5. Turn on verified visitors for logged-in pages.
6. Enable the support portal if you want a dedicated support surface.
7. Add knowledge sources before opening the experience to real customers.

## Test after embed

Use a fresh browser session and verify:

- The widget bubble loads from `widget.liraintelligence.com`
- The launcher opens correctly
- A first message creates a conversation
- Replies stream normally
- Escalation creates a visible conversation or ticket for the team

If you are using a demo or dogfood org, also confirm the widget script returns `200` in the network tab.

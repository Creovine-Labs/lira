import {
  BellRinging,
  Books,
  Browser,
  ChatsCircle,
  EnvelopeSimple,
  Handshake,
  Plug,
  ShieldCheck,
} from '@phosphor-icons/react'

type DocSection = {
  title: string
  body?: string
  bullets?: string[]
  code?: string
}

export type DocEntry = {
  slug: string
  title: string
  summary: string
  category: 'Guide' | 'Tutorial'
  Icon: React.ComponentType<{ className?: string; weight?: 'duotone' | 'fill' | 'regular' }>
  related: string[]
  sections: DocSection[]
}

export const DOCS: DocEntry[] = [
  {
    slug: 'chat-widget',
    title: 'Install the Lira chat widget',
    summary: 'Add the script tag, choose placement, and launch website chat with your org ID.',
    category: 'Guide',
    Icon: ChatsCircle,
    related: ['verified-customers', 'support-portal', 'knowledge-base'],
    sections: [
      {
        title: 'What this does',
        body: 'Lira ships with an embeddable support widget that loads from the public widget bundle and opens a full customer support chat on your site.',
      },
      {
        title: 'Use the widget snippet',
        body: 'The widget reads its setup from data attributes on the script tag. The codebase expects your organization ID and supports color, greeting, and launcher position.',
        code:
          `<script src="https://widget.liraintelligence.com/v1/widget.js"\n` +
          `  data-org-id="org_abc123"\n` +
          `  data-color="#3730a3"\n` +
          `  data-greeting="Hi! How can we help you today?"\n` +
          `  data-position="bottom-right">\n` +
          `</script>`,
      },
      {
        title: 'Where to configure it in Lira',
        bullets: [
          'Go to Support activation to turn chat on before launch.',
          'Use Support settings to refine greeting, color, voice, pre-chat form, and escalation behavior.',
          'Your org ID is permanent, so you can update branding later without replacing the whole embed.',
        ],
      },
      {
        title: 'What the widget supports today',
        bullets: [
          'Website chat with saved conversation history for the visitor.',
          'Optional voice mode when voice is enabled for the organization.',
          'Pre-chat capture for visitor name and email.',
          'Escalation, human replies, handback to Lira, and proactive agent messages.',
        ],
      },
    ],
  },
  {
    slug: 'verified-customers',
    title: 'Verify logged-in customers',
    summary:
      'Pass signed identity so Lira can recognize the visitor and personalize support safely.',
    category: 'Guide',
    Icon: ShieldCheck,
    related: ['chat-widget', 'human-handoff', 'tool-packs'],
    sections: [
      {
        title: 'Why this matters',
        body: 'When a customer is already signed in, Lira can use their identity to personalize replies, connect the conversation to the right person, and support account-level actions with more confidence.',
      },
      {
        title: 'Supported identity fields',
        body: 'The widget code supports three optional attributes for authenticated visitors: email, name, and a server-generated HMAC signature.',
        code:
          `<script src="https://widget.liraintelligence.com/v1/widget.js"\n` +
          `  data-org-id="org_abc123"\n` +
          `  data-email="user@example.com"\n` +
          `  data-name="Jane Doe"\n` +
          `  data-sig="hmac_hex_signature">\n` +
          `</script>`,
      },
      {
        title: 'How to set it up',
        bullets: [
          'Generate the signature on your server, not in the browser.',
          'Pass data-email, data-name, and data-sig only for authenticated visitors.',
          'For public pages, omit identity fields and let visitors start as unknown users.',
          'After activation, get the widget secret from Support settings in the app.',
        ],
      },
      {
        title: 'What changes after verification',
        bullets: [
          'Lira can greet the customer by name.',
          'Conversations map more cleanly to the right customer record.',
          'Escalations and follow-up are easier for the team because identity is already present.',
        ],
      },
    ],
  },
  {
    slug: 'email-forwarding',
    title: 'Forward your support email',
    summary: 'Route your existing support inbox into Lira so customer email lands in one place.',
    category: 'Guide',
    Icon: EnvelopeSimple,
    related: ['knowledge-base', 'human-handoff', 'support-portal'],
    sections: [
      {
        title: 'How Lira handles support email',
        body: 'During support activation, Lira generates a dedicated support address for your organization. You can either use that address directly or forward your existing support inbox into it.',
      },
      {
        title: 'Forwarding setup',
        bullets: [
          'Open the settings for your current support inbox in Gmail, Outlook, or your mail provider.',
          'Create a forwarding rule that sends inbound mail to the Lira-generated support address.',
          'Keep your public support address the same for customers if you want continuity.',
          'Use the support activation flow to confirm which address your team will forward into Lira.',
        ],
      },
      {
        title: 'What you can configure after activation',
        bullets: [
          'Sender identity for outbound responses.',
          'A custom sending domain for branded replies.',
          'Inbox notifications and AI auto-reply behavior.',
        ],
      },
      {
        title: 'Best practice',
        body: 'Use one primary support email path so your team, Lira, and the customer are all looking at the same thread history instead of split inboxes.',
      },
    ],
  },
  {
    slug: 'support-portal',
    title: 'Publish a support portal',
    summary: 'Launch a branded customer portal for chat, ticket submission, and ticket tracking.',
    category: 'Guide',
    Icon: Browser,
    related: ['chat-widget', 'knowledge-base', 'verified-customers'],
    sections: [
      {
        title: 'What the portal includes',
        body: 'The support portal in the codebase can expose live chat, submit-a-request, and ticket tracking flows. Each capability is individually configurable.',
      },
      {
        title: 'Portal controls available today',
        bullets: [
          'Enable or disable the portal itself.',
          'Choose a portal slug or attach a custom domain.',
          'Set portal color, logo, and greeting.',
          'Turn on or off live chat, voice, submit-a-request, and track-tickets modules.',
        ],
      },
      {
        title: 'Where to set it up',
        bullets: [
          'Use the support activation flow for first launch.',
          'Use Support settings to manage branding, capabilities, and customer identification rules afterward.',
          'If you want to embed the portal in another page, Lira exposes an iframe embed pattern in the activation flow.',
        ],
      },
      {
        title: 'Customer authentication options',
        bullets: [
          'Use portal email verification for a lightweight login flow.',
          'Connect your own auth system and pass a signed JWT when you want a tighter product experience.',
        ],
      },
    ],
  },
  {
    slug: 'knowledge-base',
    title: 'Build your support knowledge base',
    summary: 'Ground Lira in the real product information your support team wants it to use.',
    category: 'Tutorial',
    Icon: Books,
    related: ['chat-widget', 'tool-packs', 'proactive-outreach'],
    sections: [
      {
        title: 'Where knowledge lives in Lira',
        body: 'Support uses the same organization knowledge system as the rest of Lira. The knowledge area already supports documents, connected sources, web sources, and direct querying.',
      },
      {
        title: 'Content sources supported in the app',
        bullets: [
          'Uploaded documents for product docs, policy docs, and internal playbooks.',
          'Google Drive sources when your team wants to reuse existing support documents.',
          'Web sources and crawled website content.',
          'Organization description and related company context.',
        ],
      },
      {
        title: 'A clean launch sequence',
        bullets: [
          'Start with your core product docs, help center content, and policies.',
          'Add website pages that explain onboarding, billing, permissions, and troubleshooting.',
          'Query the knowledge base inside Lira to test answer quality before going live.',
          'Watch escalations for knowledge gaps, then add missing material back into the system.',
        ],
      },
      {
        title: 'What good support knowledge looks like',
        body: 'The best support setups give Lira clear, current, product-specific answers. Keep it factual, update it when the product changes, and include the policies your team would actually want followed during a real customer conversation.',
      },
    ],
  },
  {
    slug: 'human-handoff',
    title: 'Handle human handoff',
    summary:
      'Escalate the right conversations, let a teammate reply, then hand the thread back to Lira.',
    category: 'Tutorial',
    Icon: Handshake,
    related: ['verified-customers', 'proactive-outreach', 'tool-packs'],
    sections: [
      {
        title: 'How handoff works in Lira',
        body: 'Lira can escalate when confidence is low or when a conversation hits rules you define. Human teammates reply from the support inbox, and the thread can later be handed back to Lira.',
      },
      {
        title: 'Available escalation controls',
        bullets: [
          'Escalation email notifications.',
          'Force-escalate intents for conversations that should always reach a person.',
          'A visible escalated status in support inbox and customer records.',
        ],
      },
      {
        title: 'What the visitor sees',
        bullets: [
          'The widget shows a clear escalation acknowledgement.',
          'Agent replies can continue in the same thread.',
          'If the team later hands the conversation back, the customer stays in one continuous support experience.',
        ],
      },
      {
        title: 'Recommended operating rhythm',
        bullets: [
          'Escalate for policy exceptions, account-sensitive actions, and low-confidence answers.',
          'Let Lira handle repeatable product guidance and first-response triage.',
          'Review escalations weekly to tighten knowledge and routing rules over time.',
        ],
      },
    ],
  },
  {
    slug: 'proactive-outreach',
    title: 'Create proactive outreach',
    summary:
      'Use Lira to start support conversations instead of waiting for customers to ask first.',
    category: 'Tutorial',
    Icon: BellRinging,
    related: ['human-handoff', 'tool-packs', 'knowledge-base'],
    sections: [
      {
        title: 'What proactive support means in Lira',
        body: 'Lira includes proactive support surfaces so your team can reach out before a customer opens a ticket. The codebase already includes proactive panels and customer-level proactive messaging flows.',
      },
      {
        title: 'Strong use cases',
        bullets: [
          'Failed payment recovery.',
          'Renewal or onboarding nudges.',
          'Status updates after an incident or delay.',
          'Follow-up after an escalated conversation needs a human-owned next step.',
        ],
      },
      {
        title: 'How to make it useful',
        bullets: [
          'Keep the message tied to a real customer event.',
          'Be specific about what changed and what the customer should do next.',
          'Use the customer record and conversation history so the outreach feels informed, not generic.',
          'Escalate to a teammate when the follow-up needs judgment or exception handling.',
        ],
      },
      {
        title: 'What to avoid',
        body: 'Do not use proactive support like a marketing blast. In Lira it works best when it is timely, operational, and directly helpful to the customer.',
      },
    ],
  },
  {
    slug: 'tool-packs',
    title: 'Connect support actions and developer tools',
    summary: 'Give Lira controlled access to the approved actions it can run for customers.',
    category: 'Tutorial',
    Icon: Plug,
    related: ['verified-customers', 'human-handoff', 'knowledge-base'],
    sections: [
      {
        title: 'What support actions do',
        body: 'Lira can call approved APIs, MCP tools, and CLI-backed workflows so support is not limited to conversation alone. Keep these actions narrow, audited, and tied to real customer-support outcomes.',
      },
      {
        title: 'Useful action patterns',
        bullets: [
          'Read customer status or plan details before answering account questions.',
          'Open a support-side task when a customer needs a follow-up.',
          'Trigger approved workflows from your backend through API keys or MCP.',
          'Require human approval before account-changing or money-adjacent actions run.',
        ],
      },
      {
        title: 'Rollout order',
        bullets: [
          'Start with read-only actions your support team already performs every day.',
          'Add write actions only after the approval and audit rules are clear.',
          'Add approvals and human review where account-changing actions need tighter control.',
        ],
      },
      {
        title: 'How to keep it trustworthy',
        body: 'Only expose actions that improve response quality or reduce manual work. A smaller set of well-understood actions is safer than a wide surface area that nobody actively manages.',
      },
    ],
  },
  {
    slug: 'mcp-gateway',
    title: 'Connect your MCP server',
    summary:
      'Expose your own tools to Lira over the Model Context Protocol and let the AI take real, governed actions under your own auth.',
    category: 'Tutorial',
    Icon: Plug,
    related: ['tool-packs', 'verified-customers', 'human-handoff'],
    sections: [
      {
        title: 'What this is',
        body: 'The Model Context Protocol (MCP) is the standard way for AI applications to connect to external tools. If you run an MCP server, Lira can import your tools and let the AI use them during support — checking a transaction, freezing a card, scheduling a callback — while every call runs under your own authentication. This is the recommended path for connecting a mature product; the REST tool pack is the simpler alternative for basic APIs.',
      },
      {
        title: 'How Lira keeps it safe',
        body: 'Lira never lets the model call your server directly. Each tool you approve becomes a normal Lira agent tool and still passes the full runtime before it can run.',
        bullets: [
          'Nothing runs until an admin approves it — discovery only lists your tools, it does not enable them.',
          'You map each tool to a risk level (read, confirm-first, re-auth required, or human-only) and who can use it (anyone, verified visitor, or verified customer).',
          'Money- and account-adjacent tools can require the customer to re-authenticate (step-up) before the action runs.',
          'The verified customer identity is sent to your server out-of-band, so the AI cannot impersonate a different customer through the tool inputs.',
          'Your bearer credential is stored encrypted and sent only to your endpoint; it is never shown back in the dashboard.',
          'Every call is logged and metered, and the whole server can be disabled or disconnected instantly.',
        ],
      },
      {
        title: 'Set it up',
        bullets: [
          'Open Support → AI actions in the dashboard.',
          'Under MCP server, choose Connect and enter your endpoint URL and bearer token. In production the endpoint must be HTTPS and cannot point at a private/internal address.',
          'Connecting saves the server disabled — nothing is live yet.',
          'Choose Discover tools to load your tool list. Descriptions are sanitized on import.',
          'For each tool, pick a risk level and audience, then Approve. Approve only the tools you want the AI to use.',
          'When you are ready, Enable the server from the card. You can toggle individual tools or disable everything at any time.',
        ],
      },
      {
        title: 'Requirements for your server',
        bullets: [
          'A streamable HTTP MCP endpoint that implements initialize, tools/list, and tools/call.',
          'Bearer-token auth (OAuth 2.1 support is on the roadmap for production enterprise use).',
          'Tools that scope actions to the customer in the io.lira/customer metadata Lira passes on each call — not to values in the tool arguments.',
          'Strict input schemas on each tool so inputs are validated on your side too.',
        ],
      },
      {
        title: 'Plan availability',
        body: 'MCP actions follow your plan: read-only tools on Pro, and the full approved set on Scale and Enterprise. This keeps action-taking aligned with the tier your organization is on.',
      },
    ],
  },
  {
    slug: 'developer-api',
    title: 'Developer API keys & CLI',
    summary:
      'Automate Lira from your own backend or CI: create a scoped API key, connect MCP tools, and mint native mobile support sessions.',
    category: 'Tutorial',
    Icon: Plug,
    related: ['mcp-gateway', 'verified-customers', 'tool-packs'],
    sections: [
      {
        title: 'What this is',
        body: 'For teams that want to script Lira instead of clicking through the dashboard. An org admin creates a scoped API key, and your engineers use it with the Lira CLI or the REST API to connect MCP tools, approve them, and mint support sessions for your customers from your backend.',
      },
      {
        title: 'Create a key',
        bullets: [
          'Go to Support → Developers → Create key (owner or admin only).',
          'Give it a name and pick only the permissions it needs: mcp:read, mcp:write, support:read, support:write, sessions:mint.',
          'Optionally set an expiry. Copy the key when it is shown — it is displayed once and cannot be retrieved again (only revoked).',
          'Use it as the LIRA_API_KEY environment variable. Keep it server-side; never ship it in a mobile app or browser.',
        ],
      },
      {
        title: 'Permissions (scopes)',
        bullets: [
          'mcp:read — read your MCP server config and discovered tools.',
          'mcp:write — connect, approve, enable, and remove MCP tools.',
          'support:read / support:write — read or update support configuration.',
          'sessions:mint — start a native support session as any of your customers. High privilege: keep this key on your backend only and revoke it if it leaks.',
        ],
      },
      {
        title: 'Use the CLI',
        code:
          `npm i -g @liraintelligence/support\n` +
          `export LIRA_API_KEY=lira_sk_…\n\n` +
          `lira mcp connect --org-id=org_xxx --endpoint=https://mcp.yourcompany.com/mcp\n` +
          `lira mcp discover --org-id=org_xxx\n` +
          `lira mcp approve --org-id=org_xxx --source-name=card.freeze --risk=customer_confirm\n` +
          `lira mcp enable --org-id=org_xxx\n\n` +
          `# from your backend, right after the customer authenticated:\n` +
          `lira sessions mint --org-id=org_xxx --email=customer@example.com`,
      },
      {
        title: 'Or call the API',
        body: 'Every CLI action maps to a REST endpoint. Authenticate with your key as a bearer token.',
        code:
          `curl -X POST https://api.creovine.com/lira/v1/support/sessions/orgs/org_xxx/mint \\\n` +
          `  -H "Authorization: Bearer $LIRA_API_KEY" \\\n` +
          `  -H "Content-Type: application/json" \\\n` +
          `  -d '{ "customer": { "email": "customer@example.com" }, "ttlSeconds": 900 }'`,
      },
      {
        title: 'How session minting stays safe',
        bullets: [
          'Your backend is the trusted party — it vouches for its own logged-in customer, the same way the widget verifies identified visitors.',
          'Tokens are short-lived (up to one hour) and can be revoked.',
          'For a high-risk action, mint a step-up proof right after the customer re-authenticates (PIN, biometric, or OTP).',
          'Requests are rate-limited per key, and each signed request can only be used once (replay-protected).',
          'Keys are stored hashed, scoped to one org, and rejected if used against a different org.',
        ],
      },
    ],
  },
]

export const DOCS_BY_SLUG = Object.fromEntries(DOCS.map((entry) => [entry.slug, entry])) as Record<
  string,
  DocEntry
>

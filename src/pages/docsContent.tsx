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
        body:
          'Lira ships with an embeddable support widget that loads from the public widget bundle and opens a full customer support chat on your site.',
      },
      {
        title: 'Use the widget snippet',
        body:
          'The widget reads its setup from data attributes on the script tag. The codebase expects your organization ID and supports color, greeting, and launcher position.',
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
    summary: 'Pass signed identity so Lira can recognize the visitor and personalize support safely.',
    category: 'Guide',
    Icon: ShieldCheck,
    related: ['chat-widget', 'human-handoff', 'tool-packs'],
    sections: [
      {
        title: 'Why this matters',
        body:
          'When a customer is already signed in, Lira can use their identity to personalize replies, connect the conversation to the right person, and support account-level actions with more confidence.',
      },
      {
        title: 'Supported identity fields',
        body:
          'The widget code supports three optional attributes for authenticated visitors: email, name, and a server-generated HMAC signature.',
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
        body:
          'During support activation, Lira generates a dedicated support address for your organization. You can either use that address directly or forward your existing support inbox into it.',
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
        body:
          'Use one primary support email path so your team, Lira, and the customer are all looking at the same thread history instead of split inboxes.',
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
        body:
          'The support portal in the codebase can expose live chat, submit-a-request, and ticket tracking flows. Each capability is individually configurable.',
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
        body:
          'Support uses the same organization knowledge system as the rest of Lira. The knowledge area already supports documents, connected sources, web sources, and direct querying.',
      },
      {
        title: 'Content sources supported in the app',
        bullets: [
          'Uploaded documents for product docs, policy docs, and internal playbooks.',
          'Connected sources such as GitHub and Google Drive when those sources are available.',
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
        body:
          'The best support setups give Lira clear, current, product-specific answers. Keep it factual, update it when the product changes, and include the policies your team would actually want followed during a real customer conversation.',
      },
    ],
  },
  {
    slug: 'human-handoff',
    title: 'Handle human handoff',
    summary: 'Escalate the right conversations, let a teammate reply, then hand the thread back to Lira.',
    category: 'Tutorial',
    Icon: Handshake,
    related: ['verified-customers', 'proactive-outreach', 'tool-packs'],
    sections: [
      {
        title: 'How handoff works in Lira',
        body:
          'Lira can escalate when confidence is low or when a conversation hits rules you define. Human teammates reply from the support inbox, and the thread can later be handed back to Lira.',
      },
      {
        title: 'Available escalation controls',
        bullets: [
          'Escalation email notifications.',
          'Force-escalate intents for conversations that should always reach a person.',
          'Slack and Linear destinations for escalation alerts or issue creation.',
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
    summary: 'Use Lira to start support conversations instead of waiting for customers to ask first.',
    category: 'Tutorial',
    Icon: BellRinging,
    related: ['human-handoff', 'tool-packs', 'knowledge-base'],
    sections: [
      {
        title: 'What proactive support means in Lira',
        body:
          'Lira includes proactive support surfaces so your team can reach out before a customer opens a ticket. The codebase already includes proactive panels and customer-level proactive messaging flows.',
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
        body:
          'Do not use proactive support like a marketing blast. In Lira it works best when it is timely, operational, and directly helpful to the customer.',
      },
    ],
  },
  {
    slug: 'tool-packs',
    title: 'Connect support integrations and tool packs',
    summary: 'Give Lira the approved systems it needs to look up context and take the right actions.',
    category: 'Tutorial',
    Icon: Plug,
    related: ['verified-customers', 'human-handoff', 'knowledge-base'],
    sections: [
      {
        title: 'What integrations do for support',
        body:
          'Lira can connect to external systems so support is not limited to conversation alone. In the current app, the support setup already surfaces Slack, Linear, HubSpot, and Salesforce connection status, and the wider product includes an integrations area for third-party tools.',
      },
      {
        title: 'Useful connection patterns',
        bullets: [
          'Slack for escalation alerts and team visibility.',
          'Linear for issue creation and engineering follow-through.',
          'HubSpot or Salesforce for customer context.',
          'Additional organization integrations for support agent actions and internal workflows.',
        ],
      },
      {
        title: 'Rollout order',
        bullets: [
          'Start with the systems your support team already checks every day.',
          'Connect context sources before action-heavy systems if you want a lower-risk launch.',
          'Add approvals and human review where account-changing actions need tighter control.',
        ],
      },
      {
        title: 'How to keep it trustworthy',
        body:
          'Only connect tools that improve response quality or reduce manual work. A smaller set of well-understood integrations is usually better than a wide surface area that nobody actively manages.',
      },
    ],
  },
]

export const DOCS_BY_SLUG = Object.fromEntries(DOCS.map((entry) => [entry.slug, entry])) as Record<
  string,
  DocEntry
>

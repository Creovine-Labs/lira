export const DOCS_BASE_URL = 'https://docs.liraintelligence.com'

const DOCS_SLUG_URLS: Record<string, string> = {
  'chat-widget': `${DOCS_BASE_URL}/platform/customer-support/setup`,
  'verified-customers': `${DOCS_BASE_URL}/platform/customer-support/verified-customers`,
  'email-forwarding': `${DOCS_BASE_URL}/platform/email`,
  'support-portal': `${DOCS_BASE_URL}/platform/customer-support/activation`,
  'knowledge-base': `${DOCS_BASE_URL}/knowledge-base`,
  'human-handoff': `${DOCS_BASE_URL}/platform/customer-support`,
  'proactive-outreach': `${DOCS_BASE_URL}/platform/customer-support`,
  'tool-packs': `${DOCS_BASE_URL}/platform/customer-support/actions`,
  'mcp-gateway': `${DOCS_BASE_URL}/platform/customer-support/mcp`,
  'developer-api': `${DOCS_BASE_URL}/platform/customer-support/developer-api`,
}

export function getDocsUrl(slug?: string) {
  if (!slug) {
    return DOCS_BASE_URL
  }

  return DOCS_SLUG_URLS[slug] ?? DOCS_BASE_URL
}

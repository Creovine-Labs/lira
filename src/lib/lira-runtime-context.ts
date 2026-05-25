export const LIRA_RUNTIME_CONTEXT_EVENT = 'lira:runtime-context'

export interface LiraRuntimeContext {
  app: 'lira-admin-dashboard'
  route: string
  search?: string
  page_title?: string
  tab?: string | null
  workflow?: {
    name: 'support_onboarding'
    step:
      | 'overview'
      | 'seed_knowledge_base'
      | 'activate_support'
      | 'configure_support'
      | 'install_widget'
      | 'test_support'
  }
  visitor?: {
    name?: string | null
    email?: string | null
  }
  organisation?: {
    org_id?: string | null
    name?: string | null
    created_at?: string | null
    company_name?: string | null
    industry?: string | null
    website?: string | null
    description?: string | null
    size?: string | null
    surfaces?: string | null
  }
  support?: {
    activated?: boolean
    chat_enabled?: boolean
    portal_enabled?: boolean
    portal_chat_enabled?: boolean
    portal_slug?: string | null
    auto_reply_enabled?: boolean
    email_address?: string | null
    onboarding_completed?: boolean
    onboarding_step?: string | null
  }
  knowledge?: {
    source_type?: 'web' | 'documents' | 'sources' | 'query' | null
    crawl_url?: string | null
    crawl_status?: string | null
    pages_indexed?: number
    pages_crawled?: number | null
    total_pages?: number | null
  }
}

type RuntimeContextWindow = Window &
  typeof globalThis & {
    __LIRA_RUNTIME_CONTEXT__?: LiraRuntimeContext
  }

export function publishLiraRuntimeContext(context: LiraRuntimeContext): void {
  if (typeof window === 'undefined') return
  const w = window as RuntimeContextWindow
  w.__LIRA_RUNTIME_CONTEXT__ = context
  window.dispatchEvent(
    new CustomEvent(LIRA_RUNTIME_CONTEXT_EVENT, {
      detail: { context },
    })
  )
}

export function readLiraRuntimeContext(): LiraRuntimeContext | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as RuntimeContextWindow).__LIRA_RUNTIME_CONTEXT__
}

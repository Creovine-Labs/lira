// ── Customer Support module — shared types ────────────────────────────────────

export type SupportOnboardingStep =
  | 'email'
  | 'widget'
  | 'voice'
  | 'integrations'
  | 'knowledge'
  | 'api'
  | 'test'

export interface SupportOnboardingState {
  // Step 1 — Email
  emailAddress: string
  emailVerified: boolean
  senderName: string
  useCustomDomain: boolean
  ccTeam: boolean
  ccAddress: string
  bccCompliance: boolean
  bccAddress: string

  // Step 2 — Widget
  widgetEnabled: boolean
  widgetColor: string
  widgetPosition: 'bottom-right' | 'bottom-left'
  widgetGreeting: string
  widgetTitle: string
  alwaysOn: boolean

  // Step 3 — Voice
  voiceEnabled: boolean
  phoneNumber: string

  // Step 4 — Integrations
  connectedIntegrations: string[]

  // Step 5 — Knowledge
  websiteUrl: string
  crawlStarted: boolean
  crawlComplete: boolean
  crawledPages: number
  knowledgeChunks: number
  uploadedFiles: Array<{ name: string; size: number; status: 'processing' | 'ready' }>

  // Step 6 — API
  apiKey: string
  sandboxMode: boolean
  webhookUrl: string

  // Step 7 — Test
  testEmailSent: boolean
  activated: boolean
}

export const defaultOnboardingState: SupportOnboardingState = {
  emailAddress: '',
  emailVerified: false,
  senderName: '',
  useCustomDomain: false,
  ccTeam: false,
  ccAddress: '',
  bccCompliance: false,
  bccAddress: '',

  widgetEnabled: true,
  widgetColor: '#7c3aed',
  widgetPosition: 'bottom-right',
  widgetGreeting: 'Hi there! How can we help you today?',
  widgetTitle: 'Support',
  alwaysOn: true,

  voiceEnabled: false,
  phoneNumber: '',

  connectedIntegrations: [],

  websiteUrl: '',
  crawlStarted: false,
  crawlComplete: false,
  crawledPages: 0,
  knowledgeChunks: 0,
  uploadedFiles: [],

  apiKey: 'lira_live_xxxxxxxxxxxxxxxxxxxx',
  sandboxMode: false,
  webhookUrl: 'https://api.lira.ai/support/webhook/org_xxxx',

  testEmailSent: false,
  activated: false,
}

export const ONBOARDING_STEPS: Array<{ id: SupportOnboardingStep; label: string }> = [
  { id: 'email', label: 'Email Channel' },
  { id: 'widget', label: 'Chat Widget' },
  { id: 'voice', label: 'Voice Support' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'api', label: 'API & Webhooks' },
  { id: 'test', label: 'Test & Go Live' },
]

export type SupportNavSection = 'inbox' | 'customers' | 'proactive' | 'knowledge' | 'actions' | 'analytics'

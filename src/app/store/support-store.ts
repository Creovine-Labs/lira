import { create } from 'zustand'
import type {
  SupportConfig,
  SupportConversation,
  CustomerProfile,
  SupportStats,
  ConversationStatus,
  ActionLog,
  KBDraft,
  ProactiveTrigger,
  OutreachLog,
  WeeklyReport,
} from '@/services/api/support-api'
import {
  getSupportConfig,
  activateSupport as activateSupportApi,
  updateSupportConfig as updateSupportConfigApi,
  listConversations as listConversationsApi,
  getConversation as getConversationApi,
  sendConversationReply as sendReplyApi,
  resolveConversation as resolveConversationApi,
  deleteConversation as deleteConversationApi,
  handbackToLira as handbackToLiraApi,
  escalateConversation as escalateConversationApi,
  updateConversationTags as updateTagsApi,
  summarizeConversation as summarizeApi,
  sendTypingIndicator as sendTypingApi,
  listCustomerConversations as listCustomerConversationsApi,
  mergeCustomers as mergeCustomersApi,
  listSupportCustomers,
  getSupportCustomer,
  updateSupportCustomer,
  deleteSupportCustomer,
  getSupportStats as getSupportStatsApi,
  getWeeklyReport as getWeeklyReportApi,
  listActions as listActionsApi,
  approveAction as approveActionApi,
  rejectAction as rejectActionApi,
  listKBDrafts as listKBDraftsApi,
  approveKBDraft as approveKBDraftApi,
  rejectKBDraft as rejectKBDraftApi,
  listTriggers as listTriggersApi,
  listOutreachLogs as listOutreachLogsApi,
} from '@/services/api/support-api'

interface SupportSlice {
  // Config
  config: SupportConfig | null
  configLoading: boolean
  loadConfig: (orgId: string) => Promise<void>
  activateModule: (orgId: string) => Promise<void>
  updateConfig: (orgId: string, updates: Partial<SupportConfig>) => Promise<void>

  // Conversations (inbox)
  conversations: SupportConversation[]
  conversationsLoading: boolean
  statusFilter: ConversationStatus | null
  selectedConversation: SupportConversation | null
  loadConversations: (
    orgId: string,
    status?: ConversationStatus,
    options?: { background?: boolean }
  ) => Promise<void>
  loadConversation: (orgId: string, convId: string) => Promise<void>
  sendReply: (orgId: string, convId: string, body: string) => Promise<void>
  resolveConversation: (orgId: string, convId: string) => Promise<void>
  deleteConversation: (orgId: string, convId: string) => Promise<void>
  handbackToLira: (orgId: string, convId: string) => Promise<void>
  escalateConversation: (orgId: string, convId: string, reason: string) => Promise<void>
  setStatusFilter: (status: ConversationStatus | null) => void
  updateTags: (orgId: string, convId: string, tags: string[]) => Promise<void>
  summarizeConversation: (orgId: string, convId: string) => Promise<string>
  sendTypingIndicator: (orgId: string, convId: string) => Promise<void>
  mergeCustomers: (orgId: string, primaryId: string, secondaryId: string) => Promise<void>

  // Customer conversations
  customerConversations: SupportConversation[]
  customerConversationsLoading: boolean
  loadCustomerConversations: (orgId: string, customerId: string) => Promise<void>

  // Customers
  customers: CustomerProfile[]
  customersLoading: boolean
  selectedCustomer: CustomerProfile | null
  customerLoading: boolean
  loadCustomers: (orgId: string) => Promise<void>
  loadCustomer: (orgId: string, customerId: string) => Promise<void>
  updateCustomer: (
    orgId: string,
    customerId: string,
    updates: Partial<CustomerProfile>
  ) => Promise<void>
  deleteCustomer: (orgId: string, customerId: string) => Promise<void>

  // Stats
  stats: SupportStats | null
  statsLoading: boolean
  weeklyReport: WeeklyReport | null
  loadStats: (orgId: string) => Promise<void>
  loadWeeklyReport: (orgId: string) => Promise<void>

  // Actions (Phase 3)
  actions: ActionLog[]
  actionsLoading: boolean
  loadActions: (orgId: string, status?: string) => Promise<void>
  approveAction: (orgId: string, actionId: string) => Promise<void>
  rejectAction: (orgId: string, actionId: string) => Promise<void>

  // KB Drafts (Phase 6)
  kbDrafts: KBDraft[]
  kbDraftsLoading: boolean
  loadKBDrafts: (orgId: string) => Promise<void>
  approveKBDraft: (
    orgId: string,
    draftId: string,
    edits?: { title?: string; body?: string }
  ) => Promise<void>
  rejectKBDraft: (orgId: string, draftId: string) => Promise<void>

  // Proactive (Phase 5)
  triggers: ProactiveTrigger[]
  triggersLoading: boolean
  outreachLogs: OutreachLog[]
  loadTriggers: (orgId: string) => Promise<void>
  loadOutreachLogs: (orgId: string) => Promise<void>

  // Clear on org switch
  clear: () => void
}

const INITIAL_STATE = {
  config: null,
  configLoading: false,
  conversations: [],
  conversationsLoading: false,
  statusFilter: null,
  selectedConversation: null,
  customerConversations: [],
  customerConversationsLoading: false,
  customers: [],
  customersLoading: false,
  selectedCustomer: null,
  customerLoading: false,
  stats: null,
  statsLoading: false,
  weeklyReport: null,
  actions: [],
  actionsLoading: false,
  kbDrafts: [],
  kbDraftsLoading: false,
  triggers: [],
  triggersLoading: false,
  outreachLogs: [],
}

export const useSupportStore = create<SupportSlice>()((set) => ({
  ...INITIAL_STATE,

  // ── Config ────────────────────────────────────────────────────────────────
  loadConfig: async (orgId) => {
    set({ configLoading: true })
    try {
      const config = await getSupportConfig(orgId)
      set({ config })
    } catch {
      set({ config: null })
    } finally {
      set({ configLoading: false })
    }
  },

  activateModule: async (orgId) => {
    const config = await activateSupportApi(orgId)
    set({ config })
  },

  updateConfig: async (orgId, updates) => {
    const config = await updateSupportConfigApi(orgId, updates)
    set({ config })
  },

  // ── Conversations ─────────────────────────────────────────────────────────
  loadConversations: async (orgId, status, options) => {
    if (!options?.background) set({ conversationsLoading: true })
    try {
      const conversations = await listConversationsApi(orgId, status)
      // Sort newest first by updated_at (DynamoDB SK is UUID-based, not time-ordered)
      conversations.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      set({ conversations })
    } catch {
      if (!options?.background) set({ conversations: [] })
    } finally {
      if (!options?.background) set({ conversationsLoading: false })
    }
  },

  loadConversation: async (orgId, convId) => {
    const conversation = await getConversationApi(orgId, convId)
    set({ selectedConversation: conversation })
  },

  sendReply: async (orgId, convId, body) => {
    await sendReplyApi(orgId, convId, body)
    // Reload conversation to get updated messages
    const conversation = await getConversationApi(orgId, convId)
    set({ selectedConversation: conversation })
  },

  resolveConversation: async (orgId, convId) => {
    await resolveConversationApi(orgId, convId)
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.conv_id === convId ? { ...c, status: 'resolved' as const } : c
      ),
      selectedConversation:
        s.selectedConversation?.conv_id === convId
          ? { ...s.selectedConversation, status: 'resolved' as const }
          : s.selectedConversation,
    }))
  },

  deleteConversation: async (orgId, convId) => {
    await deleteConversationApi(orgId, convId)
    set((s) => ({
      conversations: s.conversations.filter((c) => c.conv_id !== convId),
      selectedConversation:
        s.selectedConversation?.conv_id === convId ? null : s.selectedConversation,
    }))
  },

  handbackToLira: async (orgId, convId) => {
    await handbackToLiraApi(orgId, convId)
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.conv_id === convId ? { ...c, status: 'open' as const } : c
      ),
      selectedConversation:
        s.selectedConversation?.conv_id === convId
          ? { ...s.selectedConversation, status: 'open' as const }
          : s.selectedConversation,
    }))
  },

  escalateConversation: async (orgId, convId, reason) => {
    await escalateConversationApi(orgId, convId, reason)
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.conv_id === convId ? { ...c, status: 'escalated' as const } : c
      ),
      selectedConversation:
        s.selectedConversation?.conv_id === convId
          ? { ...s.selectedConversation, status: 'escalated' as const }
          : s.selectedConversation,
    }))
  },

  setStatusFilter: (statusFilter) => set({ statusFilter }),

  updateTags: async (orgId, convId, tags) => {
    await updateTagsApi(orgId, convId, tags)
    set((s) => ({
      selectedConversation:
        s.selectedConversation?.conv_id === convId
          ? { ...s.selectedConversation, tags }
          : s.selectedConversation,
      conversations: s.conversations.map((c) => (c.conv_id === convId ? { ...c, tags } : c)),
    }))
  },

  summarizeConversation: async (orgId, convId) => {
    const summary = await summarizeApi(orgId, convId)
    set((s) => ({
      selectedConversation:
        s.selectedConversation?.conv_id === convId
          ? { ...s.selectedConversation, summary }
          : s.selectedConversation,
    }))
    return summary
  },

  sendTypingIndicator: async (orgId, convId) => {
    await sendTypingApi(orgId, convId)
  },

  mergeCustomers: async (orgId, primaryId, secondaryId) => {
    await mergeCustomersApi(orgId, primaryId, secondaryId)
  },

  // ── Customer conversations ────────────────────────────────────────────────
  loadCustomerConversations: async (orgId, customerId) => {
    set({ customerConversationsLoading: true })
    try {
      const { conversations } = await listCustomerConversationsApi(orgId, customerId)
      conversations.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      set({ customerConversations: conversations })
    } catch {
      set({ customerConversations: [] })
    } finally {
      set({ customerConversationsLoading: false })
    }
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  loadCustomers: async (orgId) => {
    set({ customersLoading: true })
    try {
      const customers = await listSupportCustomers(orgId)
      set({ customers })
    } catch {
      set({ customers: [] })
    } finally {
      set({ customersLoading: false })
    }
  },

  loadCustomer: async (orgId, customerId) => {
    set({ customerLoading: true, selectedCustomer: null })
    try {
      const customer = await getSupportCustomer(orgId, customerId)
      set({ selectedCustomer: customer })
    } catch {
      set({ selectedCustomer: null })
    } finally {
      set({ customerLoading: false })
    }
  },

  updateCustomer: async (orgId, customerId, updates) => {
    const customer = await updateSupportCustomer(orgId, customerId, updates)
    set({ selectedCustomer: customer })
  },

  deleteCustomer: async (orgId, customerId) => {
    await deleteSupportCustomer(orgId, customerId)
    set((s) => ({
      customers: s.customers.filter((c) => c.customer_id !== customerId),
      selectedCustomer: s.selectedCustomer?.customer_id === customerId ? null : s.selectedCustomer,
      customerConversations:
        s.selectedCustomer?.customer_id === customerId ? [] : s.customerConversations,
    }))
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  loadStats: async (orgId) => {
    set({ statsLoading: true })
    try {
      const stats = await getSupportStatsApi(orgId)
      set({ stats })
    } catch {
      set({ stats: null })
    } finally {
      set({ statsLoading: false })
    }
  },

  loadWeeklyReport: async (orgId) => {
    try {
      const weeklyReport = await getWeeklyReportApi(orgId)
      set({ weeklyReport })
    } catch {
      set({ weeklyReport: null })
    }
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  loadActions: async (orgId, status) => {
    set({ actionsLoading: true })
    try {
      const actions = await listActionsApi(orgId, status)
      set({ actions })
    } catch {
      set({ actions: [] })
    } finally {
      set({ actionsLoading: false })
    }
  },

  approveAction: async (orgId, actionId) => {
    await approveActionApi(orgId, actionId)
    set((s) => ({
      actions: s.actions.map((a) =>
        a.action_id === actionId ? { ...a, status: 'approved' as const } : a
      ),
    }))
  },

  rejectAction: async (orgId, actionId) => {
    await rejectActionApi(orgId, actionId)
    set((s) => ({
      actions: s.actions.map((a) =>
        a.action_id === actionId ? { ...a, status: 'rejected' as const } : a
      ),
    }))
  },

  // ── KB Drafts ─────────────────────────────────────────────────────────────
  loadKBDrafts: async (orgId) => {
    set({ kbDraftsLoading: true })
    try {
      const kbDrafts = await listKBDraftsApi(orgId)
      set({ kbDrafts })
    } catch {
      set({ kbDrafts: [] })
    } finally {
      set({ kbDraftsLoading: false })
    }
  },

  approveKBDraft: async (orgId, draftId, edits) => {
    await approveKBDraftApi(orgId, draftId, edits)
    set((s) => ({
      kbDrafts: s.kbDrafts.map((d) =>
        d.draft_id === draftId ? { ...d, status: 'approved' as const } : d
      ),
    }))
  },

  rejectKBDraft: async (orgId, draftId) => {
    await rejectKBDraftApi(orgId, draftId)
    set((s) => ({
      kbDrafts: s.kbDrafts.map((d) =>
        d.draft_id === draftId ? { ...d, status: 'rejected' as const } : d
      ),
    }))
  },

  // ── Proactive ─────────────────────────────────────────────────────────────
  loadTriggers: async (orgId) => {
    set({ triggersLoading: true })
    try {
      const triggers = await listTriggersApi(orgId)
      set({ triggers })
    } catch {
      set({ triggers: [] })
    } finally {
      set({ triggersLoading: false })
    }
  },

  loadOutreachLogs: async (orgId) => {
    try {
      const outreachLogs = await listOutreachLogsApi(orgId)
      set({ outreachLogs })
    } catch {
      set({ outreachLogs: [] })
    }
  },

  // ── Clear ─────────────────────────────────────────────────────────────────
  clear: () => set(INITIAL_STATE),
}))

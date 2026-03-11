export const ROUTES = {
  home: '/',
  meeting: '/meeting',
  meetings: '/meetings',
  meetingDetail: '/meetings/:id',
  settings: '/settings',
  uiLab: '/ui-lab',
  onboarding: '/onboarding',
  organizations: '/organizations',
  orgSettings: '/org/settings',
  orgKnowledge: '/org/knowledge',
  orgDocuments: '/org/documents',
  orgTasks: '/org/tasks',
  orgTaskDetail: '/org/tasks/:taskId',
  orgMembers: '/org/members',
  orgWebhooks: '/org/webhooks',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

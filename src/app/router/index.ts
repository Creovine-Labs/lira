export const ROUTES = {
  home: '/',
  meeting: '/meeting',
  meetings: '/meetings',
  meetingDetail: '/meetings/:id',
  uiLab: '/ui-lab',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

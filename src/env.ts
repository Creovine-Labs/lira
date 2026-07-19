import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('https://api.creovine.com'),
  VITE_WS_URL: z.string().default('wss://api.creovine.com/lira/v1/ws'),
  VITE_GOOGLE_LOGIN_CLIENT_ID: z.string().default(''),
  VITE_DEMO_ORG_ID: z.string().default(''),
  // Lira's own org (rebuilt July 2026) — powers the public widget on the
  // marketing site and must match LIRA_INTERNAL_ORG_ID on the backend.
  VITE_LIRA_PUBLIC_ORG_ID: z.string().default('org-556fc4d1-9f29-4114-bb0e-da83ddab6c70'),
  VITE_DEMO_WIDGET_SECRET: z
    .string()
    .default('')
    .transform((s) => s.replace(/\n$/, '')),
  MODE: z.string().default('development'),
})

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_GOOGLE_LOGIN_CLIENT_ID:
    import.meta.env.VITE_GOOGLE_LOGIN_CLIENT_ID ?? import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_DEMO_ORG_ID: import.meta.env.VITE_DEMO_ORG_ID,
  VITE_LIRA_PUBLIC_ORG_ID: import.meta.env.VITE_LIRA_PUBLIC_ORG_ID,
  VITE_DEMO_WIDGET_SECRET: import.meta.env.DEV ? import.meta.env.VITE_DEMO_WIDGET_SECRET : '',
  MODE: import.meta.env.MODE,
})

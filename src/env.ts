import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('https://api.creovine.com'),
  VITE_WS_URL: z.string().default('wss://api.creovine.com/lira/v1/ws'),
  VITE_GOOGLE_LOGIN_CLIENT_ID: z.string().default(''),
  VITE_DEMO_ORG_ID: z.string().default(''),
  MODE: z.string().default('development'),
})

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_GOOGLE_LOGIN_CLIENT_ID:
    import.meta.env.VITE_GOOGLE_LOGIN_CLIENT_ID ?? import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_DEMO_ORG_ID: import.meta.env.VITE_DEMO_ORG_ID,
  MODE: import.meta.env.MODE,
})

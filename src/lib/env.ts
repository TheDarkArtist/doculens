import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  S3_ENDPOINT: z.string().default(''),
  S3_ACCESS_KEY: z.string().default(''),
  S3_SECRET_KEY: z.string().default(''),
  S3_BUCKET: z.string().default('doculens-documents'),
  S3_REGION: z.string().default('us-east-1'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GOOGLE_AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // TDACorp identity OIDC client; checked when a login starts, so a build needs none of it
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_KID: z.string().optional(),
  OIDC_PRIVATE_JWK: z.string().optional(),
  OIDC_COOKIE_SECRET: z.string().min(32).optional(),
  APP_ORIGIN: z.string().url().optional(),

  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().default('ap2'),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors
    console.error('Invalid environment variables:', formatted)
    throw new Error('Invalid environment variables')
  }
  return result.data
}

export const env = parseEnv()

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { seal, unseal } from '@tdacorp/identity-sdk/sealed'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { env } from './env'

export const SESSION_COOKIE = 'doculens_session'
const PURPOSE = 'doculens:session'
// Short on purpose: the session is stateless, and auth() re-reads the user row on every call,
// so a deleted user is refused at once and a changed role applies at once. Re-login is a silent identity redirect.
export const SESSION_MAX_AGE_SECONDS = 60 * 60

const secret = () => {
  if (!env.OIDC_COOKIE_SECRET) throw new Error('OIDC_COOKIE_SECRET is not set')
  return env.OIDC_COOKIE_SECRET
}

// Secure only over https; an http loopback origin (local dev against a local identity) cannot carry it everywhere.
const secureAttr = () => (env.APP_ORIGIN?.startsWith('https:') === false ? '' : '; Secure')

/** Set-Cookie value for a session that carries only the local user id. */
export async function sessionCookie(userId: string): Promise<string> {
  const value = await seal(
    { uid: userId },
    { secret: secret(), ttlSeconds: SESSION_MAX_AGE_SECONDS, purpose: PURPOSE }
  )
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly${secureAttr()}; SameSite=Lax`
}

export const clearSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly${secureAttr()}; SameSite=Lax`

/** The local user id in a session cookie value, or null when absent, forged or expired. */
export async function readSessionUserId(value: string | undefined): Promise<string | null> {
  if (!value) return null
  const payload = await unseal<{ uid?: string }>(value, { secret: secret(), purpose: PURPOSE })
  return payload?.uid ?? null
}

/** Same shape the Auth.js session had; role and tenant are read fresh from the DB on every call. */
export async function auth() {
  const userId = await readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value)
  if (!userId) return null
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return null
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    },
  }
}

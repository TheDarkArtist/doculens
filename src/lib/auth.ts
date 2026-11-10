import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { seal, unseal } from '@tdacorp/identity-sdk/sealed'
import { db } from '@/db'
import { tenants } from '@/db/schema/tenants'
import { CODES, sessionCan } from './authz-claim'
import { isSessionRevoked } from './revoked-session'
import { env } from './env'

export const SESSION_COOKIE = 'doculens_session'
const PURPOSE = 'doculens:session'
// ADR 0001 (O2): matches the identity access token lifetime. The session never outlives the token's exp;
// when it ends, re-login is a silent identity redirect.
export const SESSION_MAX_AGE_SECONDS = 5 * 60

/** What a verified access token gives the session: who, the tenant it was minted for, and doculens's codes in it. */
export interface SessionIdentity {
  sub: string
  name: string
  email: string
  tid: string
  codes: string[]
  sid: string | null
  /** Epoch seconds. */
  tokenExpiresAt: number
}

/** The actor recorded on audit rows: an identity sub plus the name at the time (a snapshot, never updated). */
export interface Actor {
  id: string
  name: string
}

const secret = () => {
  if (!env.OIDC_COOKIE_SECRET) throw new Error('OIDC_COOKIE_SECRET is not set')
  return env.OIDC_COOKIE_SECRET
}

// Secure only over https; an http loopback origin (local dev against a local identity) cannot carry it everywhere.
const secureAttr = () => (env.APP_ORIGIN?.startsWith('https:') === false ? '' : '; Secure')

/** Set-Cookie value for a session, or null when the token has no time left (fail closed: no session). */
export async function sessionCookie(identity: SessionIdentity): Promise<string | null> {
  const ttl = Math.min(SESSION_MAX_AGE_SECONDS, identity.tokenExpiresAt - Math.floor(Date.now() / 1000))
  if (ttl < 1) return null
  const { tokenExpiresAt: _exp, ...payload } = identity
  const value = await seal(payload, { secret: secret(), ttlSeconds: ttl, purpose: PURPOSE })
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${ttl}; HttpOnly${secureAttr()}; SameSite=Lax`
}

export const clearSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly${secureAttr()}; SameSite=Lax`

type StoredSession = Omit<SessionIdentity, 'tokenExpiresAt'>

/** The session in a cookie value, or null when absent, forged, expired or malformed. */
export async function readSession(value: string | undefined): Promise<StoredSession | null> {
  if (!value) return null
  const p = await unseal<Partial<StoredSession>>(value, { secret: secret(), purpose: PURPOSE })
  if (!p?.sub || !p.tid || !Array.isArray(p.codes) || !p.codes.every((c) => typeof c === 'string')) return null
  return { sub: p.sub, name: p.name ?? '', email: p.email ?? '', tid: p.tid, codes: p.codes, sid: p.sid ?? null }
}

/**
 * The signed-in session, or null. Authorization is the stored token claim, checked against the tenant row whose
 * `identity_tenant_id` equals the token's `tid`; a session with no such tenant, no read code, or an ended identity session is nobody.
 */
export async function auth() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session) return null
  const [tenant, revoked] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.identityTenantId, session.tid) }),
    session.sid ? isSessionRevoked(session.sid) : false,
  ])
  const can = (code: string) => sessionCan(session, code, tenant?.identityTenantId ?? null)
  if (!tenant || revoked || !can(CODES.read)) return null
  return {
    can,
    user: { id: session.sub, email: session.email, name: session.name, tenantId: tenant.id },
  }
}

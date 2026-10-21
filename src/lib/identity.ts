import { NextResponse } from 'next/server'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { createRelyingParty, type LoginSuccess, type ClientKey } from '@tdacorp/identity-sdk/rp'
import { createAuthRoutes, type AuthRoutes } from '@tdacorp/identity-sdk/rp/next'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { clearSessionCookie, sessionCookie } from './auth'
import { decideLink, normalizeEmail } from './identity-link'
import { env } from './env'

const LOGIN_PATH = '/login'

function required<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`${name} is not set`)
  return value
}

// Built per request so env is read at request time (the SDK caches discovery internally).
export function authRoutes(): AuthRoutes {
  const origin = required(env.APP_ORIGIN, 'APP_ORIGIN').replace(/\/+$/, '')
  const rp = createRelyingParty({
    issuer: required(env.OIDC_ISSUER, 'OIDC_ISSUER').replace(/\/+$/, ''),
    clientId: required(env.OIDC_CLIENT_ID, 'OIDC_CLIENT_ID'),
    redirectUri: `${origin}/api/auth/callback`,
    key: {
      kid: required(env.OIDC_KID, 'OIDC_KID'),
      privateKey: JSON.parse(required(env.OIDC_PRIVATE_JWK, 'OIDC_PRIVATE_JWK')) as ClientKey['privateKey'],
    },
  })
  return createAuthRoutes({
    rp,
    appOrigin: origin,
    secureCookies: origin.startsWith('https:'),
    cookieSecret: required(env.OIDC_COOKIE_SECRET, 'OIDC_COOKIE_SECRET'),
    defaultReturnTo: '/dashboard',
    onLogin: signIn,
    // Every failure collapses to one redirect so the callback is never an oracle for provider text.
    onError: () => NextResponse.redirect(new URL(`${LOGIN_PATH}?error=1`, origin), 303),
    logout: {
      postLogoutRedirectUri: `${origin}${LOGIN_PATH}`,
      clearSessionCookies: () => [clearSessionCookie()],
    },
  })
}

async function signIn({ idToken, redirectTo }: LoginSuccess): Promise<Response> {
  const { email, email_verified: emailVerified } = idToken.claims
  const claims = {
    sub: idToken.sub,
    email: typeof email === 'string' ? normalizeEmail(email) : '',
    emailVerified: emailVerified === true,
  }
  const bySubject = await db.query.users.findFirst({ where: eq(users.identitySubject, claims.sub) })
  const byEmail = bySubject || !claims.email
    ? []
    : await db.query.users.findMany({ where: sql`lower(${users.email}) = ${claims.email}` })

  const decision = decideLink(claims, bySubject, byEmail)
  let userId = decision.action === 'reject' ? null : decision.userId
  if (decision.action === 'link') {
    // The IS NULL guard makes a concurrent first login lose cleanly instead of overwriting a link.
    const [linked] = await db
      .update(users)
      .set({ identitySubject: claims.sub })
      .where(and(eq(users.id, decision.userId), isNull(users.identitySubject)))
      .returning({ id: users.id })
    userId = linked?.id ?? null
  }
  if (!userId) return NextResponse.json({ error: 'no DocuLens account for this identity' }, { status: 403 })

  // 200 + Refresh rather than 303: the callback is a cross-site navigation from identity, and a 303 chain can drop fresh cookies.
  const res = new NextResponse(null, { status: 200, headers: { Refresh: `0; url=${redirectTo}` } })
  res.headers.append('Set-Cookie', await sessionCookie(userId))
  return res
}

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAccessToken } from '@tdacorp/identity-sdk'
import { createRelyingParty, type LoginSuccess, type ClientKey } from '@tdacorp/identity-sdk/rp'
import { createAuthRoutes, type AuthRoutes } from '@tdacorp/identity-sdk/rp/next'
import { db } from '@/db'
import { tenants } from '@/db/schema/tenants'
import { clearSessionCookie, sessionCookie } from './auth'
import { CODES, grantedCodes } from './authz-claim'
import { revokeSession } from './revoked-session'
import { signedOutCookie } from './login-path'
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
    // D4: identity pushes an ended session; auth() refuses its sid from then on.
    backchannelLogout: { onLogout: ({ sid }) => (sid ? revokeSession(sid) : undefined) },
    // Every failure collapses to one redirect so the callback is never an oracle for provider text.
    onError: () => NextResponse.redirect(new URL(`${LOGIN_PATH}?error=1`, origin), 303),
    logout: {
      postLogoutRedirectUri: `${origin}${LOGIN_PATH}`,
      clearSessionCookies: () => [clearSessionCookie(), signedOutCookie(origin.startsWith('https:'))],
    },
  })
}

async function signIn({ tokens, idToken, redirectTo }: LoginSuccess): Promise<Response> {
  // Authorization is the access token's claim (ADR 0001): verified locally, issuer and audience = this client.
  const verified = await verifyAccessToken(tokens.accessToken, {
    issuer: required(env.OIDC_ISSUER, 'OIDC_ISSUER').replace(/\/+$/, ''),
    audience: required(env.OIDC_CLIENT_ID, 'OIDC_CLIENT_ID'),
  })
  const codes = grantedCodes(verified.claims)
  const tid = verified.tenantId
  const tenant = tid && (await db.query.tenants.findFirst({ where: eq(tenants.identityTenantId, tid) }))
  if (!tenant || !codes.includes(CODES.read)) return NextResponse.json({ error: 'no DocuLens access for this identity' }, { status: 403 })

  const { name, email } = idToken.claims
  const cookie = await sessionCookie({
    sub: verified.subject,
    name: typeof name === 'string' ? name : '',
    email: typeof email === 'string' ? email : '',
    tid,
    codes,
    sid: verified.sessionId,
    tokenExpiresAt: verified.expiresAt,
  })
  if (!cookie) return NextResponse.json({ error: 'access token expired' }, { status: 403 })

  // 200 + Refresh rather than 303: the callback is a cross-site navigation from identity, and a 303 chain can drop fresh cookies.
  const res = new NextResponse(null, { status: 200, headers: { Refresh: `0; url=${redirectTo}` } })
  res.headers.append('Set-Cookie', cookie)
  return res
}

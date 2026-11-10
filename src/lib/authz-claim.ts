// shortcut: local copy of @tdacorp/identity-sdk 2.1.0 can/canTenant, replace with the SDK import once 2.1.0 is published.
// ADR 0259: `claims` is the payload of a token ALREADY VERIFIED by verifyAccessToken. Absent or malformed is a deny.

export const CODES = {
  read: 'doculens.document.read',
  review: 'doculens.document.review',
  admin: 'doculens.admin',
} as const

const hasCodes = (value: unknown): value is readonly string[] => Array.isArray(value) && value.every((code) => typeof code === 'string')

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function can(claims: Readonly<Record<string, unknown>>, code: string, on: { readonly tid: string; readonly resource: string }): boolean {
  const authz = claims.authz
  if (claims.tid !== on.tid || !isRecord(authz) || !isRecord(authz.res)) return false
  const codes = Object.hasOwn(authz.res, on.resource) ? authz.res[on.resource] : undefined
  return hasCodes(codes) && codes.includes(code)
}

export function canTenant(claims: Readonly<Record<string, unknown>>, code: string, on: { readonly tid: string }): boolean {
  const authz = claims.authz
  return claims.tid === on.tid && isRecord(authz) && hasCodes(authz.tenant) && authz.tenant.includes(code)
}

/** The doculens codes a verified token holds in its own tenant; empty when the claim is absent or malformed. */
export function grantedCodes(claims: Readonly<Record<string, unknown>>): string[] {
  const { tid } = claims
  if (typeof tid !== 'string' || tid === '') return []
  return Object.values(CODES).filter((code) => canTenant(claims, code, { tid }))
}

/** Whether a session's stored codes grant `code` in the tenant the request acts in (`expectedTid`); a different tid denies. */
export const sessionCan = (session: { tid: string; codes: readonly string[] }, code: string, expectedTid: string | null): boolean =>
  expectedTid !== null && canTenant({ tid: session.tid, authz: { tenant: session.codes } }, code, { tid: expectedTid })

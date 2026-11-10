import { compare } from 'bcryptjs'
import { eq, isNull, or } from 'drizzle-orm'
import { createResourceServer, ResourceServerError, type ResourceServer } from '@tdacorp/identity-sdk'
import { db } from '@/db'
import { apiKeys } from '@/db/schema/api-keys'
import { tenants } from '@/db/schema/tenants'
import { auth, type Actor } from './auth'
import { CODES, grantedCodes } from './authz-claim'
import { dpopReplayStore } from './dpop-replay'
import { env } from './env'

type AuthResult = {
  actor: Actor
  tenantId: string
  can: (code: string) => boolean
}

// First characters of `dl_<hex>`: a non-secret lookup so a request costs one bcrypt compare, not one per key.
export const keyPrefix = (rawKey: string) => rawKey.slice(0, 11)

// Key scopes map onto the same codes the session path checks; a key never holds doculens.admin.
const SCOPE_FOR_CODE: Record<string, string> = { [CODES.read]: 'documents:read', [CODES.review]: 'documents:write' }

// Built on first use so `off` never touches identity config or its JWKS, and a build needs no OIDC env.
let machineServer: ResourceServer | undefined
function resourceServer(): ResourceServer {
  const { OIDC_ISSUER: issuer, OIDC_CLIENT_ID: audience, APP_ORIGIN: publicOrigin } = env
  if (!issuer || !audience || !publicOrigin) throw new Error('OIDC_ISSUER, OIDC_CLIENT_ID and APP_ORIGIN are required for identity machine tokens')
  return (machineServer ??= createResourceServer({
    issuer: issuer.replace(/\/+$/, ''),
    audience,
    publicOrigin: publicOrigin.replace(/\/+$/, ''),
    replay: dpopReplayStore,
    requireConfirmation: true,
    refuseActorTokens: true,
  }))
}

// Machine credential from identity (D9): a DPoP-bound token exchanged to this client. Any refusal is null (401).
export async function authenticateMachineToken(request: Request, server: ResourceServer = resourceServer()): Promise<AuthResult | null> {
  let verified
  try {
    verified = await server.verifyRequest(request)
  } catch (error) {
    if (error instanceof ResourceServerError) return null
    throw error
  }
  const codes = grantedCodes(verified.claims)
  const tenant = verified.tenantId && (await db.query.tenants.findFirst({ where: eq(tenants.identityTenantId, verified.tenantId) }))
  if (!tenant || codes.length === 0) return null
  return { actor: { id: verified.subject, name: verified.subject }, tenantId: tenant.id, can: (code) => codes.includes(code) }
}

export async function authenticateRequest(
  request: Request
): Promise<AuthResult | null> {
  const mode = env.DOCULENS_MACHINE_IDENTITY_TOKENS

  // Try API key first
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    return mode === 'identity' ? null : authenticateApiKey(apiKey)
  }

  if (mode !== 'off' && /^(DPoP|Bearer) /i.test(request.headers.get('authorization') ?? '')) {
    return authenticateMachineToken(request)
  }

  // Fall back to session
  const session = await auth()
  if (!session?.user) return null

  return { actor: session.user, tenantId: session.user.tenantId, can: session.can }
}

// Machine credential (D9, phase 5): product-minted and still accepted until it moves to identity client_credentials.
async function authenticateApiKey(
  key: string
): Promise<AuthResult | null> {
  // Keys made before key_prefix existed have none; they are still tried and get the prefix on first use.
  const candidates = await db.query.apiKeys.findMany({
    where: or(eq(apiKeys.keyPrefix, keyPrefix(key)), isNull(apiKeys.keyPrefix)),
  })

  for (const k of candidates) {
    if (k.expiresAt && k.expiresAt < new Date()) continue

    const valid = await compare(key, k.keyHash)
    if (!valid) continue

    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(), keyPrefix: keyPrefix(key) })
      .where(eq(apiKeys.id, k.id))

    // The key is the actor: an opaque reference, not a user row.
    return {
      actor: { id: `apikey:${k.id}`, name: k.name },
      tenantId: k.tenantId,
      can: (code) => SCOPE_FOR_CODE[code] !== undefined && k.scopes.includes(SCOPE_FOR_CODE[code]),
    }
  }

  return null
}

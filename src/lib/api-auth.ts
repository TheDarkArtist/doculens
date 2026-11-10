import { compare } from 'bcryptjs'
import { eq, isNull, or } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys } from '@/db/schema/api-keys'
import { auth, type Actor } from './auth'
import { CODES } from './authz-claim'

type AuthResult = {
  actor: Actor
  tenantId: string
  can: (code: string) => boolean
}

// First characters of `dl_<hex>`: a non-secret lookup so a request costs one bcrypt compare, not one per key.
export const keyPrefix = (rawKey: string) => rawKey.slice(0, 11)

// Key scopes map onto the same codes the session path checks; a key never holds doculens.admin.
const SCOPE_FOR_CODE: Record<string, string> = { [CODES.read]: 'documents:read', [CODES.review]: 'documents:write' }

export async function authenticateRequest(
  request: Request
): Promise<AuthResult | null> {
  // Try API key first
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    return authenticateApiKey(apiKey)
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

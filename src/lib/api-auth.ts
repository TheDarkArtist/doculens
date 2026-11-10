import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys } from '@/db/schema/api-keys'
import { auth, type Actor } from './auth'

type AuthResult = {
  actor: Actor
  tenantId: string
}

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

  return { actor: session.user, tenantId: session.user.tenantId }
}

// Machine credential (D9, phase 5): product-minted and still accepted until it moves to identity client_credentials.
async function authenticateApiKey(
  key: string
): Promise<AuthResult | null> {
  const allKeys = await db.query.apiKeys.findMany()

  for (const k of allKeys) {
    if (k.expiresAt && k.expiresAt < new Date()) continue

    const valid = await compare(key, k.keyHash)
    if (!valid) continue

    // Update last used
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, k.id))

    // The key is the actor: an opaque reference, not a user row.
    return {
      actor: { id: `apikey:${k.id}`, name: k.name },
      tenantId: k.tenantId,
    }
  }

  return null
}

import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys } from '@/db/schema/api-keys'
import { users } from '@/db/schema/users'
import { auth } from './auth'

type AuthResult = {
  userId: string
  tenantId: string
  role: 'admin' | 'reviewer' | 'viewer'
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

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  }
}

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

    // Get tenant's first admin user as the acting user
    const user = await db.query.users.findFirst({
      where: eq(users.tenantId, k.tenantId),
    })

    return {
      userId: user?.id ?? '',
      tenantId: k.tenantId,
      role: 'admin',
    }
  }

  return null
}

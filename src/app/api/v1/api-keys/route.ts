import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { hashSync } from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { apiKeys } from '@/db/schema/api-keys'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.tenantId, session.user.tenantId),
    columns: {
      id: true,
      name: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: [apiKeys.createdAt],
  })

  return successResponse(keys)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const body = await req.json()
  const { name, scopes } = body

  if (!name) {
    return errorResponse('VALIDATION_ERROR', 'Name is required')
  }

  // Generate a random API key
  const rawKey = `dl_${uuid().replace(/-/g, '')}${uuid().replace(/-/g, '').slice(0, 16)}`
  const keyHash = hashSync(rawKey, 10)

  const [key] = await db
    .insert(apiKeys)
    .values({
      tenantId: session.user.tenantId,
      name,
      keyHash,
      scopes: scopes ?? ['documents:read', 'documents:write'],
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      scopes: apiKeys.scopes,
      createdAt: apiKeys.createdAt,
    })

  // Return the raw key ONCE — it can never be retrieved again
  return successResponse({ ...key, key: rawKey }, 201)
}

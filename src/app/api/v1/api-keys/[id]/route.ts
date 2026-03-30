import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { apiKeys } from '@/db/schema/api-keys'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const { id } = await params

  const [deleted] = await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.tenantId, session.user.tenantId)
      )
    )
    .returning({ id: apiKeys.id })

  if (!deleted) return notFoundResponse('API key not found')
  return successResponse({ id: deleted.id, revoked: true })
}

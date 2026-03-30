import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { webhooks } from '@/db/schema/webhooks'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const { id } = await params
  const body = await req.json()

  const [updated] = await db
    .update(webhooks)
    .set({
      ...(body.url !== undefined && { url: body.url }),
      ...(body.events !== undefined && { events: body.events }),
      ...(body.active !== undefined && { active: body.active }),
    })
    .where(
      and(eq(webhooks.id, id), eq(webhooks.tenantId, session.user.tenantId))
    )
    .returning()

  if (!updated) return notFoundResponse('Webhook not found')
  return successResponse(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const { id } = await params
  const [deleted] = await db
    .delete(webhooks)
    .where(
      and(eq(webhooks.id, id), eq(webhooks.tenantId, session.user.tenantId))
    )
    .returning({ id: webhooks.id })

  if (!deleted) return notFoundResponse('Webhook not found')
  return successResponse({ id: deleted.id })
}

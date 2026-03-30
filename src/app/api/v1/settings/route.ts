import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { tenants } from '@/db/schema/tenants'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const body = await req.json()
  const { auto_approve_threshold, review_threshold } = body

  if (
    typeof auto_approve_threshold !== 'number' ||
    typeof review_threshold !== 'number' ||
    auto_approve_threshold <= review_threshold
  ) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Auto-approve threshold must be greater than review threshold'
    )
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, session.user.tenantId),
  })
  if (!tenant) return errorResponse('NOT_FOUND', 'Tenant not found', 404)

  const [updated] = await db
    .update(tenants)
    .set({
      settings: {
        ...tenant.settings,
        auto_approve_threshold,
        review_threshold,
      },
    })
    .where(eq(tenants.id, session.user.tenantId))
    .returning()

  return successResponse(updated.settings)
}

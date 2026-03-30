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

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, session.user.tenantId),
  })
  if (!tenant) return errorResponse('NOT_FOUND', 'Tenant not found', 404)

  const updates: Record<string, unknown> = { ...tenant.settings }

  if (typeof body.auto_approve_threshold === 'number') {
    updates.auto_approve_threshold = body.auto_approve_threshold
  }
  if (typeof body.review_threshold === 'number') {
    updates.review_threshold = body.review_threshold
  }
  if (typeof body.retention_days === 'number') {
    updates.retention_days = body.retention_days
  }
  if (typeof body.phi_detection_enabled === 'boolean') {
    updates.phi_detection_enabled = body.phi_detection_enabled
  }

  // Validate thresholds
  const autoThreshold = (updates.auto_approve_threshold as number) ?? 0.975
  const reviewThreshold = (updates.review_threshold as number) ?? 0.8
  if (autoThreshold <= reviewThreshold) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Auto-approve threshold must be greater than review threshold'
    )
  }

  const [updated] = await db
    .update(tenants)
    .set({ settings: updates as typeof tenant.settings })
    .where(eq(tenants.id, session.user.tenantId))
    .returning()

  return successResponse(updated.settings)
}

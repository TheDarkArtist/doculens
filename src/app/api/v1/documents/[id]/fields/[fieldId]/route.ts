import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'
import { correctFieldSchema } from '@/features/review/review.types'
import { correctField } from '@/features/review/review.service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role === 'viewer') return forbiddenResponse()

  const { id, fieldId } = await params
  const body = await req.json()
  const parsed = correctFieldSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const result = await correctField(
    session.user.tenantId,
    session.user.id,
    id,
    fieldId,
    parsed.data
  )

  if (!result.success) {
    return errorResponse('CORRECTION_FAILED', result.error, 404)
  }

  return successResponse(result.data)
}

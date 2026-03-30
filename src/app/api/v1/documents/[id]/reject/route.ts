import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'
import { rejectDocumentSchema } from '@/features/review/review.types'
import { rejectDocument } from '@/features/review/review.service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role === 'viewer') return forbiddenResponse()

  const { id } = await params
  const body = await req.json()
  const parsed = rejectDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const result = await rejectDocument(
    session.user.tenantId,
    session.user.id,
    id,
    parsed.data.reason
  )

  if (!result.success) {
    return errorResponse('REJECT_FAILED', result.error, 404)
  }

  return successResponse(result.data)
}

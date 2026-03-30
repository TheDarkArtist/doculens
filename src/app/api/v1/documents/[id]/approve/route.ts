import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'
import { approveDocument } from '@/features/review/review.service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role === 'viewer') return forbiddenResponse()

  const { id } = await params
  const result = await approveDocument(
    session.user.tenantId,
    session.user.id,
    id
  )

  if (!result.success) {
    return errorResponse('APPROVE_FAILED', result.error, 404)
  }

  return successResponse(result.data)
}

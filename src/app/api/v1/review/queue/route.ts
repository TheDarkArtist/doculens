import { auth } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'
import { getReviewQueue } from '@/features/review/review.repository'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const result = await getReviewQueue(session.user.tenantId)
  return successResponse(result)
}

import { auth } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'
import { getAccuracy } from '@/features/analytics/analytics.service'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const data = await getAccuracy(session.user.tenantId)
  return successResponse(data)
}

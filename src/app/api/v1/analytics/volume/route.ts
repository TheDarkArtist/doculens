import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'
import { getVolume } from '@/features/analytics/analytics.service'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const days = Number(req.nextUrl.searchParams.get('days') ?? 30)
  const data = await getVolume(session.user.tenantId, days)
  return successResponse(data)
}

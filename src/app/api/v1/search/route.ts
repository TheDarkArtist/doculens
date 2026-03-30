import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import { searchSchema } from '@/features/search/search.types'
import { hybridSearch } from '@/features/search/search.service'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = searchSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const results = await hybridSearch(session.user.tenantId, parsed.data)
  return successResponse(results)
}

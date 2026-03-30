import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import { uploadUrlSchema } from '@/features/documents/document.types'
import { generateUploadUrl } from '@/features/documents/document.service'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = uploadUrlSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const result = await generateUploadUrl(
    session.user.tenantId,
    parsed.data
  )

  if (!result.success) {
    return errorResponse('UPLOAD_URL_FAILED', result.error, 500)
  }

  return successResponse(result.data)
}

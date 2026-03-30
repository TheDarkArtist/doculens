import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-response'
import {
  createDocumentSchema,
  listDocumentsSchema,
} from '@/features/documents/document.types'
import * as documentService from '@/features/documents/document.service'

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!authResult) return unauthorizedResponse()

  const body = await req.json()
  const parsed = createDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const result = await documentService.createDocument(
    authResult.tenantId,
    authResult.userId,
    parsed.data
  )

  if (!result.success) {
    return errorResponse('CREATE_FAILED', result.error, 500)
  }

  return successResponse(result.data, 201)
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req)
  if (!authResult) return unauthorizedResponse()

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = listDocumentsSchema.safeParse(params)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const result = await documentService.listDocuments(
    authResult.tenantId,
    parsed.data
  )

  if (!result.success) {
    return errorResponse('LIST_FAILED', result.error, 500)
  }

  return successResponse(result.data)
}

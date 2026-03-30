import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-response'
import { getDocumentById } from '@/features/documents/document.repository'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const { id } = await params
  const doc = await getDocumentById(session.user.tenantId, id)

  if (!doc) return notFoundResponse('Document not found')

  return successResponse({
    status: doc.status,
    errorMessage: doc.errorMessage,
    processingStartedAt: doc.processingStartedAt,
    processingCompletedAt: doc.processingCompletedAt,
  })
}

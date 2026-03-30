import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-response'
import { getDocumentById } from '@/features/documents/document.repository'
import { getPresignedDownloadUrl } from '@/lib/s3'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const { id } = await params
  const doc = await getDocumentById(session.user.tenantId, id)
  if (!doc) return notFoundResponse('Document not found')

  const url = await getPresignedDownloadUrl(doc.storageKey)
  return successResponse({ url })
}

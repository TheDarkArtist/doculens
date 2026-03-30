import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'
import {
  getDocumentById,
  softDeleteDocument,
} from '@/features/documents/document.repository'
import { createAuditLog } from '@/features/audit/audit.repository'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const { id } = await params
  const doc = await getDocumentById(session.user.tenantId, id)

  if (!doc) return notFoundResponse('Document not found')

  return successResponse(doc)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role === 'viewer') return forbiddenResponse()

  const { id } = await params
  const doc = await softDeleteDocument(session.user.tenantId, id)
  if (!doc) return notFoundResponse('Document not found')

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    documentId: id,
    action: 'document.deleted',
    details: { filename: doc.filename },
  })

  return successResponse({ id, deletedAt: doc.deletedAt })
}

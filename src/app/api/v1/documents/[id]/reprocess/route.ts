import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'
import { inngest } from '@/inngest/client'
import { createAuditLog } from '@/features/audit/audit.repository'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role === 'viewer') return forbiddenResponse()

  const { id } = await params
  const tenantId = session.user.tenantId

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.tenantId, tenantId), eq(documents.id, id)),
  })
  if (!doc) return notFoundResponse('Document not found')

  // Clear existing fields
  await db
    .delete(extractedFields)
    .where(eq(extractedFields.documentId, id))

  // Reset status
  await db
    .update(documents)
    .set({
      status: 'queued',
      templateId: null,
      classificationConfidence: null,
      processingStartedAt: null,
      processingCompletedAt: null,
      errorMessage: null,
    })
    .where(eq(documents.id, id))

  // Fire Inngest event
  await inngest.send({
    name: 'document/uploaded',
    data: { documentId: id, tenantId },
  }).catch(() => {})

  await createAuditLog({
    tenantId,
    userId: session.user.id,
    documentId: id,
    action: 'document.processing_started',
    details: { reprocessed: true },
  })

  return successResponse({ id, status: 'queued' })
}

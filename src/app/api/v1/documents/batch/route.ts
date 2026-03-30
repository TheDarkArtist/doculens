import { NextRequest } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { createAuditLog } from '@/features/audit/audit.repository'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role === 'viewer') return forbiddenResponse()

  const body = await req.json()
  const { action, documentIds } = body as {
    action: 'approve' | 'delete'
    documentIds: string[]
  }

  if (!action || !documentIds?.length) {
    return errorResponse('VALIDATION_ERROR', 'action and documentIds required')
  }

  const tenantId = session.user.tenantId
  let affected = 0

  if (action === 'approve') {
    const result = await db
      .update(documents)
      .set({ status: 'complete' })
      .where(
        and(
          eq(documents.tenantId, tenantId),
          inArray(documents.id, documentIds),
          eq(documents.status, 'needs_review')
        )
      )
      .returning({ id: documents.id })

    affected = result.length

    for (const doc of result) {
      await createAuditLog({
        tenantId,
        userId: session.user.id,
        documentId: doc.id,
        action: 'document.approved',
        details: { batch: true },
      })
    }
  }

  if (action === 'delete') {
    const result = await db
      .update(documents)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(documents.tenantId, tenantId),
          inArray(documents.id, documentIds)
        )
      )
      .returning({ id: documents.id })

    affected = result.length

    for (const doc of result) {
      await createAuditLog({
        tenantId,
        userId: session.user.id,
        documentId: doc.id,
        action: 'document.deleted',
        details: { batch: true },
      })
    }
  }

  return successResponse({ action, affected })
}

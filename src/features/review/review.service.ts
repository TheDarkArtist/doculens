import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'
import { createAuditLog } from '@/features/audit/audit.repository'
import { updateDocumentStatus } from '@/features/documents/document.repository'
import { ok, err, type Result } from '@/lib/result'
import type { CorrectFieldInput } from './review.types'

export async function correctField(
  tenantId: string,
  userId: string,
  documentId: string,
  fieldId: string,
  input: CorrectFieldInput
): Promise<Result<{ id: string }>> {
  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.tenantId, tenantId),
      eq(documents.id, documentId)
    ),
  })
  if (!doc) return err('Document not found')

  const field = await db.query.extractedFields.findFirst({
    where: and(
      eq(extractedFields.id, fieldId),
      eq(extractedFields.documentId, documentId)
    ),
  })
  if (!field) return err('Field not found')

  const [updated] = await db
    .update(extractedFields)
    .set({
      fieldValue: input.value,
      originalValue: field.originalValue ?? field.fieldValue,
      reviewedBy: userId,
      reviewedAt: new Date(),
      isAutoApproved: false,
    })
    .where(eq(extractedFields.id, fieldId))
    .returning()

  await createAuditLog({
    tenantId,
    userId,
    documentId,
    action: 'field.corrected',
    details: {
      field_name: field.fieldName,
      before_value: field.fieldValue,
      after_value: input.value,
      reason: input.reason,
    },
  })

  return ok({ id: updated.id })
}

export async function approveDocument(
  tenantId: string,
  userId: string,
  documentId: string
): Promise<Result<{ id: string }>> {
  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.tenantId, tenantId),
      eq(documents.id, documentId)
    ),
  })
  if (!doc) return err('Document not found')

  await updateDocumentStatus(tenantId, documentId, 'complete')

  await createAuditLog({
    tenantId,
    userId,
    documentId,
    action: 'document.approved',
    details: { approvedBy: userId },
  })

  return ok({ id: documentId })
}

export async function rejectDocument(
  tenantId: string,
  userId: string,
  documentId: string,
  reason: string
): Promise<Result<{ id: string }>> {
  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.tenantId, tenantId),
      eq(documents.id, documentId)
    ),
  })
  if (!doc) return err('Document not found')

  await updateDocumentStatus(tenantId, documentId, 'failed', {
    errorMessage: reason,
  })

  await createAuditLog({
    tenantId,
    userId,
    documentId,
    action: 'document.rejected',
    details: { reason },
  })

  return ok({ id: documentId })
}

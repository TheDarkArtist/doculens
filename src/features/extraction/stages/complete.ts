import { updateDocumentStatus } from '@/features/documents/document.repository'
import { createAuditLog } from '@/features/audit/audit.repository'
import { publishDocumentComplete } from '@/lib/pusher'

export async function completeDocument(
  tenantId: string,
  documentId: string,
  validation: { autoApproved: boolean; status: 'complete' | 'needs_review' }
) {
  await updateDocumentStatus(tenantId, documentId, validation.status, {
    processingCompletedAt: new Date(),
  })

  const action = validation.autoApproved
    ? 'document.auto_approved'
    : 'document.processed'

  await createAuditLog({
    tenantId,
    documentId,
    action: action as 'document.auto_approved' | 'document.processed',
    details: {
      status: validation.status,
      autoApproved: validation.autoApproved,
    },
  })

  await publishDocumentComplete(
    tenantId,
    documentId,
    validation.autoApproved,
    0
  )
}

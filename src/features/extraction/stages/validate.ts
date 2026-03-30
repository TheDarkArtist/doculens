import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'
import { tenants } from '@/db/schema/tenants'
import { publishDocumentStatus } from '@/lib/pusher'

export async function validateDocument(
  tenantId: string,
  documentId: string
) {
  await publishDocumentStatus(tenantId, documentId, 'validating', 0.9)

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  const autoThreshold = tenant?.settings?.auto_approve_threshold ?? 0.975
  const reviewThreshold = tenant?.settings?.review_threshold ?? 0.8

  const fields = await db.query.extractedFields.findMany({
    where: eq(extractedFields.documentId, documentId),
  })

  if (fields.length === 0) {
    return { autoApproved: false, status: 'needs_review' as const }
  }

  let allAutoApproved = true

  for (const field of fields) {
    const isAuto = field.confidence >= autoThreshold
    if (!isAuto) allAutoApproved = false

    await db
      .update(extractedFields)
      .set({ isAutoApproved: isAuto })
      .where(eq(extractedFields.id, field.id))
  }

  const status = allAutoApproved ? 'complete' : 'needs_review'

  return { autoApproved: allAutoApproved, status }
}

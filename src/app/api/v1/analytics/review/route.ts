import { eq, and, count, avg, sql, isNotNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const tenantId = session.user.tenantId
  const where = eq(documents.tenantId, tenantId)

  const [queueDepth, reviewedFields, avgConfidence] = await Promise.all([
    db
      .select({ value: count() })
      .from(documents)
      .where(and(where, eq(documents.status, 'needs_review'))),
    db
      .select({ value: count() })
      .from(extractedFields)
      .innerJoin(documents, eq(extractedFields.documentId, documents.id))
      .where(
        and(where, isNotNull(extractedFields.reviewedBy))
      ),
    db
      .select({ value: avg(extractedFields.confidence).mapWith(Number) })
      .from(extractedFields)
      .innerJoin(documents, eq(extractedFields.documentId, documents.id))
      .where(where),
  ])

  return successResponse({
    queueDepth: queueDepth[0].value,
    reviewedFields: reviewedFields[0].value,
    avgFieldConfidence: avgConfidence[0].value ?? 0,
  })
}

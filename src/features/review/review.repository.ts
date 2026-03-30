import { and, eq, desc, count, avg, sql } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'

export async function getReviewQueue(
  tenantId: string,
  limit = 20,
  skip = 0
) {
  const where = and(
    eq(documents.tenantId, tenantId),
    eq(documents.status, 'needs_review')
  )

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: documents.id,
        filename: documents.filename,
        mimeType: documents.mimeType,
        status: documents.status,
        createdAt: documents.createdAt,
        templateId: documents.templateId,
        avgConfidence: avg(extractedFields.confidence).mapWith(Number),
        fieldCount: count(extractedFields.id),
      })
      .from(documents)
      .leftJoin(
        extractedFields,
        eq(documents.id, extractedFields.documentId)
      )
      .where(where)
      .groupBy(documents.id)
      .orderBy(avg(extractedFields.confidence))
      .limit(limit)
      .offset(skip),
    db.select({ total: count() }).from(documents).where(where),
  ])

  return { items, total }
}

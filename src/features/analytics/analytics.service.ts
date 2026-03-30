import { eq, and, count, avg, sql, gte, desc } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'

export async function getOverview(tenantId: string) {
  const where = eq(documents.tenantId, tenantId)

  const [total, byStatus, avgTime] = await Promise.all([
    db.select({ value: count() }).from(documents).where(where),
    db
      .select({
        status: documents.status,
        count: count(),
      })
      .from(documents)
      .where(where)
      .groupBy(documents.status),
    db
      .select({
        avg: sql<number>`
          avg(extract(epoch from (${documents.processingCompletedAt} - ${documents.processingStartedAt})))
        `.mapWith(Number),
      })
      .from(documents)
      .where(
        and(
          where,
          sql`${documents.processingCompletedAt} IS NOT NULL`,
          sql`${documents.processingStartedAt} IS NOT NULL`
        )
      ),
  ])

  const statusMap = Object.fromEntries(
    byStatus.map((s) => [s.status, s.count])
  )

  return {
    totalProcessed: total[0].value,
    byStatus: statusMap,
    avgProcessingTimeSec: avgTime[0]?.avg ?? 0,
    reviewQueueDepth: statusMap.needs_review ?? 0,
  }
}

export async function getAccuracy(tenantId: string) {
  const [totalFields, autoApproved, corrected] = await Promise.all([
    db
      .select({ value: count() })
      .from(extractedFields)
      .innerJoin(documents, eq(extractedFields.documentId, documents.id))
      .where(eq(documents.tenantId, tenantId)),
    db
      .select({ value: count() })
      .from(extractedFields)
      .innerJoin(documents, eq(extractedFields.documentId, documents.id))
      .where(
        and(
          eq(documents.tenantId, tenantId),
          eq(extractedFields.isAutoApproved, true)
        )
      ),
    db
      .select({ value: count() })
      .from(extractedFields)
      .innerJoin(documents, eq(extractedFields.documentId, documents.id))
      .where(
        and(
          eq(documents.tenantId, tenantId),
          sql`${extractedFields.originalValue} IS NOT NULL`
        )
      ),
  ])

  const totalVal = totalFields[0].value || 1
  return {
    totalFields: totalFields[0].value,
    autoApproveRate: autoApproved[0].value / totalVal,
    correctionFrequency: corrected[0].value / totalVal,
  }
}

export async function getVolume(tenantId: string, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const results = await db
    .select({
      date: sql<string>`date(${documents.createdAt})`.as('date'),
      count: count(),
    })
    .from(documents)
    .where(
      and(
        eq(documents.tenantId, tenantId),
        gte(documents.createdAt, since)
      )
    )
    .groupBy(sql`date(${documents.createdAt})`)
    .orderBy(sql`date(${documents.createdAt})`)

  return results
}

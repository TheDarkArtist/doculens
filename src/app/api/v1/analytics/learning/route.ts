import { eq, and, count, sql, gte, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { extractedFields } from '@/db/schema/extracted-fields'
import { auditLogs } from '@/db/schema/audit-logs'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const tenantId = session.user.tenantId

  // Get weekly correction counts and accuracy over the last 8 weeks
  const weeks: {
    week: string
    corrections: number
    totalFields: number
    autoApproved: number
  }[] = []

  for (let w = 7; w >= 0; w--) {
    const start = new Date()
    start.setDate(start.getDate() - (w + 1) * 7)
    const end = new Date()
    end.setDate(end.getDate() - w * 7)

    const [corrections, fields, autoApproved] = await Promise.all([
      db
        .select({ value: count() })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.tenantId, tenantId),
            eq(auditLogs.action, 'field.corrected'),
            gte(auditLogs.createdAt, start),
            sql`${auditLogs.createdAt} < ${end}`
          )
        ),
      db
        .select({ value: count() })
        .from(extractedFields)
        .innerJoin(documents, eq(extractedFields.documentId, documents.id))
        .where(
          and(
            eq(documents.tenantId, tenantId),
            gte(extractedFields.createdAt, start),
            sql`${extractedFields.createdAt} < ${end}`
          )
        ),
      db
        .select({ value: count() })
        .from(extractedFields)
        .innerJoin(documents, eq(extractedFields.documentId, documents.id))
        .where(
          and(
            eq(documents.tenantId, tenantId),
            eq(extractedFields.isAutoApproved, true),
            gte(extractedFields.createdAt, start),
            sql`${extractedFields.createdAt} < ${end}`
          )
        ),
    ])

    const totalF = fields[0].value || 1
    weeks.push({
      week: `W${8 - w}`,
      corrections: corrections[0].value,
      totalFields: fields[0].value,
      autoApproved: autoApproved[0].value,
    })
  }

  const data = weeks.map((w) => ({
    week: w.week,
    accuracy: w.totalFields > 0
      ? Math.round(((w.totalFields - w.corrections) / w.totalFields) * 100)
      : 0,
    corrections: w.corrections,
    autoApproveRate: w.totalFields > 0
      ? Math.round((w.autoApproved / w.totalFields) * 100)
      : 0,
  }))

  return successResponse(data)
}

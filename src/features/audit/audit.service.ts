import { and, eq, desc, count, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { auditLogs } from '@/db/schema/audit-logs'

export async function listAuditLogs(
  tenantId: string,
  options: {
    skip?: number
    limit?: number
    documentId?: string
    action?: string
  } = {}
) {
  const { skip = 0, limit = 50, documentId, action } = options

  const conditions = [eq(auditLogs.tenantId, tenantId)]
  if (documentId) conditions.push(eq(auditLogs.documentId, documentId))
  if (action) conditions.push(eq(auditLogs.action, action))

  const where = and(...conditions)

  const [items, [{ total }]] = await Promise.all([
    db.query.auditLogs.findMany({
      where,
      orderBy: [desc(auditLogs.createdAt)],
      limit,
      offset: skip,
      with: { user: true, document: true },
    }),
    db.select({ total: count() }).from(auditLogs).where(where),
  ])

  return { items, total }
}

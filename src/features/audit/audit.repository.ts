import { db } from '@/db'
import { auditLogs } from '@/db/schema/audit-logs'
import type { AuditAction, AuditDetails } from './audit.types'

export async function createAuditLog(params: {
  tenantId: string
  userId?: string
  documentId?: string
  action: AuditAction
  details?: AuditDetails
  ipAddress?: string
}) {
  const [log] = await db
    .insert(auditLogs)
    .values({
      tenantId: params.tenantId,
      userId: params.userId,
      documentId: params.documentId,
      action: params.action,
      details: params.details ?? {},
      ipAddress: params.ipAddress,
    })
    .returning()
  return log
}

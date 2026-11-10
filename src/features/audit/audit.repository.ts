import { db } from '@/db'
import { auditLogs } from '@/db/schema/audit-logs'
import { deliverWebhooks } from '@/features/webhooks/webhook.service'
import type { Actor } from '@/lib/auth'
import type { AuditAction, AuditDetails } from './audit.types'

export async function createAuditLog(params: {
  tenantId: string
  actor?: Actor
  documentId?: string
  action: AuditAction
  details?: AuditDetails
  ipAddress?: string
}) {
  const [log] = await db
    .insert(auditLogs)
    .values({
      tenantId: params.tenantId,
      userSub: params.actor?.id,
      userName: params.actor?.name,
      documentId: params.documentId,
      action: params.action,
      details: params.details ?? {},
      ipAddress: params.ipAddress,
    })
    .returning()

  // Fire webhooks for this event (non-blocking)
  deliverWebhooks(params.tenantId, params.action, {
    documentId: params.documentId,
    userId: params.actor?.id,
    ...params.details,
  }).catch((e) => console.warn('[webhooks] delivery error:', e))

  return log
}

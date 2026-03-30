import { inngest } from '../client'
import { db } from '@/db'
import { tenants } from '@/db/schema/tenants'
import { documents } from '@/db/schema/documents'
import { and, eq, lt, isNull, isNotNull } from 'drizzle-orm'

export const dataRetention = inngest.createFunction(
  { id: 'data-retention' },
  { cron: '0 3 * * *' }, // Run daily at 3 AM
  async ({ step }) => {
    const allTenants = await step.run('load-tenants', () =>
      db.query.tenants.findMany()
    )

    let totalDeleted = 0

    for (const tenant of allTenants) {
      const retentionDays = tenant.settings?.retention_days
      if (!retentionDays || retentionDays <= 0) continue

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - retentionDays)

      const deleted = await step.run(
        `purge-${tenant.slug}`,
        async () => {
          const result = await db
            .update(documents)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(documents.tenantId, tenant.id),
                lt(documents.createdAt, cutoff),
                isNull(documents.deletedAt),
                eq(documents.status, 'complete')
              )
            )
            .returning({ id: documents.id })

          return result.length
        }
      )

      totalDeleted += deleted
      if (deleted > 0) {
        console.log(
          `[retention] ${tenant.slug}: purged ${deleted} docs older than ${retentionDays}d`
        )
      }
    }

    return { totalDeleted }
  }
)

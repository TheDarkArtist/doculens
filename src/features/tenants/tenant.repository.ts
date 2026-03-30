import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { tenants } from '@/db/schema/tenants'

export async function getTenantById(tenantId: string) {
  return db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })
}

export async function getTenantBySlug(slug: string) {
  return db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  })
}

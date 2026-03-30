import type { tenants } from '@/db/schema/tenants'
import type { InferSelectModel } from 'drizzle-orm'

export type Tenant = InferSelectModel<typeof tenants>

export type TenantSettings = {
  auto_approve_threshold: number
  review_threshold: number
  retention_days?: number
  phi_detection_enabled?: boolean
}

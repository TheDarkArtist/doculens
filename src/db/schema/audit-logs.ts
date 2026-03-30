import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'
import { documents } from './documents'

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    userId: uuid('user_id').references(() => users.id),
    documentId: uuid('document_id').references(() => documents.id),
    action: text('action').notNull(),
    details: jsonb('details')
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_tenant_created_idx').on(
      table.tenantId,
      table.createdAt
    ),
    index('audit_document_idx').on(table.documentId),
    index('audit_user_idx').on(table.userId),
    index('audit_action_idx').on(table.action),
  ]
)

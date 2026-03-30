import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: jsonb('settings')
    .notNull()
    .$type<{
      auto_approve_threshold: number
      review_threshold: number
      retention_days?: number
      phi_detection_enabled?: boolean
    }>()
    .default({
      auto_approve_threshold: 0.975,
      review_threshold: 0.8,
    }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

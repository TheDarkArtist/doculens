import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { userRoleEnum } from './enums'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull().default('viewer'),
    passwordHash: text('password_hash').notNull(),
    emailVerified: timestamp('email_verified', { withTimezone: true }),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('users_tenant_email_idx').on(table.tenantId, table.email),
  ]
)

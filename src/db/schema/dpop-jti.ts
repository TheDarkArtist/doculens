import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// DPoP proof ids already used on the identity machine path; rows are only needed until the proof would be refused anyway.
export const dpopJti = pgTable('dpop_jti', {
  jti: text('jti').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

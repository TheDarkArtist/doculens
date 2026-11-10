import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Identity sessions ended by back-channel logout (D4): an event record, not a copy of identity data.
export const revokedSessions = pgTable('revoked_sessions', {
  sid: text('sid').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

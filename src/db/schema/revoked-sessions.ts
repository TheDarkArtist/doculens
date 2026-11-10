import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Identity sessions ended by back-channel logout (D4): an event record, not a copy of identity data.
// Back-channel logout that named only a subject: sessions of that sub issued at or before `revokedAt` (epoch seconds) are ended.
export const revokedSubjects = pgTable('revoked_subjects', {
  sub: text('sub').primaryKey(),
  revokedAt: integer('revoked_at').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const revokedSessions = pgTable('revoked_sessions', {
  sid: text('sid').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

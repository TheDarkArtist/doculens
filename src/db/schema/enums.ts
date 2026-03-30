import { pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'reviewer',
  'viewer',
])

export const documentStatusEnum = pgEnum('document_status', [
  'queued',
  'processing',
  'needs_review',
  'complete',
  'failed',
])

import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { documents } from './documents'
import { users } from './users'

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export const extractedFields = pgTable(
  'extracted_fields',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    fieldName: text('field_name').notNull(),
    fieldValue: text('field_value').notNull(),
    fieldType: text('field_type').notNull(),
    confidence: real('confidence').notNull(),
    sourcePage: integer('source_page'),
    sourceBbox: jsonb('source_bbox').$type<BoundingBox>(),
    isAutoApproved: boolean('is_auto_approved').notNull().default(false),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    originalValue: text('original_value'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('fields_document_idx').on(table.documentId),
    index('fields_document_name_idx').on(
      table.documentId,
      table.fieldName
    ),
  ]
)

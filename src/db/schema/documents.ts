import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  jsonb,
  timestamp,
  index,
  customType,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { extractionTemplates } from './extraction-templates'
import { users } from './users'
import { documentStatusEnum } from './enums'

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    templateId: uuid('template_id').references(
      () => extractionTemplates.id
    ),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    storageKey: text('storage_key').notNull(),
    status: documentStatusEnum('status').notNull().default('queued'),
    classificationConfidence: real('classification_confidence'),
    pageCount: integer('page_count'),
    processingStartedAt: timestamp('processing_started_at', {
      withTimezone: true,
    }),
    processingCompletedAt: timestamp('processing_completed_at', {
      withTimezone: true,
    }),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata')
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    searchVector: tsvector('search_vector'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('documents_tenant_status_idx').on(table.tenantId, table.status),
    index('documents_tenant_created_idx').on(
      table.tenantId,
      table.createdAt
    ),
    index('documents_tenant_template_idx').on(
      table.tenantId,
      table.templateId
    ),
  ]
)

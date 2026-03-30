import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  customType,
} from 'drizzle-orm/pg-core'
import { documents } from './documents'

const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(768)'
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`
  },
  fromDriver(value: unknown) {
    if (typeof value === 'string') {
      return value
        .slice(1, -1)
        .split(',')
        .map(Number)
    }
    return value as number[]
  },
})

export const documentEmbeddings = pgTable(
  'document_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chunkText: text('chunk_text').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    embedding: vector('embedding').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('embeddings_document_idx').on(table.documentId)]
)

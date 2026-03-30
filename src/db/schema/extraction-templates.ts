import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export type TemplateFieldDef = {
  name: string
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'array'
  description: string
  required: boolean
  sensitive?: boolean
  validation_rules?: {
    pattern?: string
    min?: number
    max?: number
    format?: string
  }
  items?: Record<string, string>
}

export type TemplateSchema = {
  fields: TemplateFieldDef[]
  validation_rules?: {
    arithmetic?: { rule: string; description: string }[]
    date_logic?: { rule: string; description: string }[]
    expiry?: { rule: string; description: string }[]
    code_formats?: { rule: string; description: string }[]
  }
}

export const extractionTemplates = pgTable('extraction_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  schema: jsonb('schema').notNull().$type<TemplateSchema>(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

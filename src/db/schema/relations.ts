import { relations } from 'drizzle-orm'
import { tenants } from './tenants'
import { users } from './users'
import { documents } from './documents'
import { extractedFields } from './extracted-fields'
import { documentEmbeddings } from './document-embeddings'
import { extractionTemplates } from './extraction-templates'
import { auditLogs } from './audit-logs'
import { apiKeys } from './api-keys'
import { accounts, sessions } from './auth'

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  documents: many(documents),
  templates: many(extractionTemplates),
  auditLogs: many(auditLogs),
  apiKeys: many(apiKeys),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  documents: many(documents),
  accounts: many(accounts),
  sessions: many(sessions),
}))

export const documentsRelations = relations(
  documents,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [documents.tenantId],
      references: [tenants.id],
    }),
    template: one(extractionTemplates, {
      fields: [documents.templateId],
      references: [extractionTemplates.id],
    }),
    uploadedByUser: one(users, {
      fields: [documents.uploadedBy],
      references: [users.id],
    }),
    fields: many(extractedFields),
    embeddings: many(documentEmbeddings),
  })
)

export const extractedFieldsRelations = relations(
  extractedFields,
  ({ one }) => ({
    document: one(documents, {
      fields: [extractedFields.documentId],
      references: [documents.id],
    }),
    reviewer: one(users, {
      fields: [extractedFields.reviewedBy],
      references: [users.id],
    }),
  })
)

export const documentEmbeddingsRelations = relations(
  documentEmbeddings,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentEmbeddings.documentId],
      references: [documents.id],
    }),
  })
)

export const extractionTemplatesRelations = relations(
  extractionTemplates,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [extractionTemplates.tenantId],
      references: [tenants.id],
    }),
    documents: many(documents),
  })
)

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [auditLogs.documentId],
    references: [documents.id],
  }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

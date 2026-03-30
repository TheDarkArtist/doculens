import { and, eq, desc, count, sql } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import type { CreateDocumentInput, ListDocumentsInput } from './document.types'

export async function createDocument(
  tenantId: string,
  uploadedBy: string,
  input: CreateDocumentInput
) {
  const [doc] = await db
    .insert(documents)
    .values({
      tenantId,
      uploadedBy,
      filename: input.filename,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageKey: input.storageKey,
      templateId: input.templateId,
      status: 'queued',
    })
    .returning()
  return doc
}

export async function getDocumentById(
  tenantId: string,
  documentId: string
) {
  return db.query.documents.findFirst({
    where: and(
      eq(documents.tenantId, tenantId),
      eq(documents.id, documentId)
    ),
    with: { fields: true },
  })
}

export async function listDocuments(
  tenantId: string,
  input: ListDocumentsInput
) {
  const conditions = [eq(documents.tenantId, tenantId)]

  if (input.status) {
    conditions.push(eq(documents.status, input.status))
  }
  if (input.templateId) {
    conditions.push(eq(documents.templateId, input.templateId))
  }

  const where = and(...conditions)

  const [items, [{ total }]] = await Promise.all([
    db.query.documents.findMany({
      where,
      orderBy: [desc(documents.createdAt)],
      limit: input.limit,
      offset: input.skip,
    }),
    db.select({ total: count() }).from(documents).where(where),
  ])

  return {
    items,
    total,
    hasMore: input.skip + items.length < total,
  }
}

export async function updateDocumentStatus(
  tenantId: string,
  documentId: string,
  status: 'queued' | 'processing' | 'needs_review' | 'complete' | 'failed',
  extra?: Partial<{
    processingStartedAt: Date
    processingCompletedAt: Date
    errorMessage: string
    templateId: string
    classificationConfidence: number
    pageCount: number
  }>
) {
  const [doc] = await db
    .update(documents)
    .set({ status, ...extra })
    .where(
      and(
        eq(documents.tenantId, tenantId),
        eq(documents.id, documentId)
      )
    )
    .returning()
  return doc
}

import { z } from 'zod'
import type { documents } from '@/db/schema/documents'
import type { InferSelectModel } from 'drizzle-orm'

export type Document = InferSelectModel<typeof documents>

export const createDocumentSchema = z.object({
  storageKey: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  templateId: z.string().uuid().optional(),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>

export const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive().max(10 * 1024 * 1024),
})

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>

export const listDocumentsSchema = z.object({
  skip: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum(['queued', 'processing', 'needs_review', 'complete', 'failed'])
    .optional(),
  templateId: z.string().uuid().optional(),
  search: z.string().optional(),
})

export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>

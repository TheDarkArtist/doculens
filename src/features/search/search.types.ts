import { z } from 'zod'

export const searchSchema = z.object({
  query: z.string().min(1),
  filters: z
    .object({
      templateId: z.string().uuid().optional(),
      status: z
        .enum(['queued', 'processing', 'needs_review', 'complete', 'failed'])
        .optional(),
      minConfidence: z.number().min(0).max(1).optional(),
    })
    .optional(),
  limit: z.number().min(1).max(100).default(20),
})

export type SearchInput = z.infer<typeof searchSchema>

export type SearchResult = {
  documentId: string
  filename: string
  status: string
  relevanceScore: number
  matchedChunk: string
}

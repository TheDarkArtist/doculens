import { z } from 'zod'

export const correctFieldSchema = z.object({
  value: z.string(),
  reason: z.string().optional(),
})

export type CorrectFieldInput = z.infer<typeof correctFieldSchema>

export const rejectDocumentSchema = z.object({
  reason: z.string().min(1),
})

export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>

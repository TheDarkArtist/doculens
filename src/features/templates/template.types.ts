import { z } from 'zod'
import type { extractionTemplates } from '@/db/schema/extraction-templates'
import type { InferSelectModel } from 'drizzle-orm'

export type Template = InferSelectModel<typeof extractionTemplates>

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  schema: z.object({
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.enum([
          'string', 'number', 'date', 'currency', 'boolean', 'array',
        ]),
        description: z.string(),
        required: z.boolean(),
        sensitive: z.boolean().optional(),
        validation_rules: z
          .object({
            pattern: z.string().optional(),
            min: z.number().optional(),
            max: z.number().optional(),
            format: z.string().optional(),
          })
          .optional(),
      })
    ),
  }),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>

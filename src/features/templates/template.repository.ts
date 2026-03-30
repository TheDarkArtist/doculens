import { and, eq, or, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { extractionTemplates } from '@/db/schema/extraction-templates'
import type { CreateTemplateInput } from './template.types'

export async function listTemplates(tenantId: string) {
  return db.query.extractionTemplates.findMany({
    where: or(
      eq(extractionTemplates.tenantId, tenantId),
      eq(extractionTemplates.isSystem, true)
    ),
    orderBy: [extractionTemplates.name],
  })
}

export async function getTemplateById(
  tenantId: string,
  templateId: string
) {
  return db.query.extractionTemplates.findFirst({
    where: and(
      eq(extractionTemplates.id, templateId),
      or(
        eq(extractionTemplates.tenantId, tenantId),
        eq(extractionTemplates.isSystem, true)
      )
    ),
  })
}

export async function createTemplate(
  tenantId: string,
  input: CreateTemplateInput
) {
  const [template] = await db
    .insert(extractionTemplates)
    .values({
      tenantId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      schema: { fields: input.schema.fields },
    })
    .returning()
  return template
}

export async function deleteTemplate(
  tenantId: string,
  templateId: string
) {
  const [deleted] = await db
    .delete(extractionTemplates)
    .where(
      and(
        eq(extractionTemplates.id, templateId),
        eq(extractionTemplates.tenantId, tenantId),
        eq(extractionTemplates.isSystem, false)
      )
    )
    .returning()
  return deleted
}

import { db } from '@/db'
import { extractionTemplates } from '@/db/schema/extraction-templates'
import { extractedFields } from '@/db/schema/extracted-fields'
import { eq } from 'drizzle-orm'
import { getAIProvider, type GeminiSchema, type GeminiSchemaProperty } from '@/lib/ai-provider'
import { publishDocumentStatus } from '@/lib/pusher'
import type { TemplateFieldDef } from '@/db/schema/extraction-templates'
import type { NormalizedDocument } from '../extraction.types'

export async function extractFields(
  tenantId: string,
  documentId: string,
  templateId: string | null,
  normalized: NormalizedDocument
) {
  await publishDocumentStatus(tenantId, documentId, 'extracting', 0.5)

  if (!templateId) return { fieldCount: 0 }

  const template = await db.query.extractionTemplates.findFirst({
    where: eq(extractionTemplates.id, templateId),
  })
  if (!template) return { fieldCount: 0 }

  const allText = normalized.pages
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n\n')

  if (!allText) return { fieldCount: 0 }

  const schema = buildGeminiSchema(template.schema.fields)
  const provider = getAIProvider()

  const systemPrompt = `Extract structured data from this document. The document is a "${template.name}". Extract all fields accurately. If a field is not found, use null or empty string.`

  const result = await provider.extractStructured(allText, schema, systemPrompt)

  const fieldRows = template.schema.fields
    .filter((f) => result.fields[f.name] !== undefined)
    .map((f) => ({
      documentId,
      fieldName: f.name,
      fieldValue: String(result.fields[f.name] ?? ''),
      fieldType: f.type,
      confidence: result.fieldConfidences[f.name] ?? 0.5,
      isAutoApproved: false,
    }))

  if (fieldRows.length > 0) {
    await db.insert(extractedFields).values(fieldRows)
  }

  return { fieldCount: fieldRows.length }
}

function buildGeminiSchema(fields: TemplateFieldDef[]): GeminiSchema {
  const typeMap: Record<string, GeminiSchemaProperty['type']> = {
    string: 'STRING',
    number: 'NUMBER',
    date: 'STRING',
    currency: 'NUMBER',
    boolean: 'BOOLEAN',
    array: 'ARRAY',
  }

  const properties: Record<string, GeminiSchemaProperty> = {}
  const required: string[] = []

  for (const field of fields) {
    const prop: GeminiSchemaProperty = {
      type: typeMap[field.type] ?? 'STRING',
      description: field.description,
    }

    if (field.type === 'array') {
      prop.items = { type: 'STRING', description: 'Array item' }
    }

    properties[field.name] = prop
    if (field.required) required.push(field.name)
  }

  return { type: 'OBJECT', properties, required }
}

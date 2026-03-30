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

  let fieldRows: {
    documentId: string
    fieldName: string
    fieldValue: string
    fieldType: string
    confidence: number
    isAutoApproved: boolean
  }[]

  try {
    const schema = buildGeminiSchema(template.schema.fields)
    const provider = getAIProvider()
    const systemPrompt = `You are an expert document data extractor. Extract structured data from this "${template.name}" document.

For each field you must provide:
- value: the extracted data
- confidence: a number 0.0-1.0 representing how reliable this extraction is

Confidence guidelines:
- 1.0: Value is directly and explicitly stated in the document text (e.g. a name printed on the page)
- 0.8-0.9: Value is clearly present but required minor interpretation (e.g. reformatting a date)
- 0.6-0.7: Value was inferred from context (e.g. calculating years of experience from employment dates)
- 0.3-0.5: Value is a reasonable guess based on limited evidence
- 0.0-0.2: Value was not found in the document at all, or is a default/placeholder

Extraction rules:
- For array fields, return comma-separated values
- For fields that can be calculated (e.g. total years of experience from work history dates), compute the value and set confidence to 0.6-0.7
- If a field is not present and cannot be inferred, use empty string with confidence 0.0
- Never fabricate data — if unsure, use low confidence`
    const result = await provider.extractStructured(allText, schema, systemPrompt)

    fieldRows = template.schema.fields
      .filter((f) => result.fields[f.name] !== undefined)
      .map((f) => ({
        documentId,
        fieldName: f.name,
        fieldValue: String(result.fields[f.name] ?? ''),
        fieldType: f.type,
        confidence: result.fieldConfidences[f.name] ?? 0.5,
        isAutoApproved: false,
      }))
  } catch (e) {
    console.warn('[extract] AI extraction failed, using regex fallback:', e)
    // Fallback: extract key-value pairs from text using simple patterns
    fieldRows = template.schema.fields
      .map((f) => {
        const regex = new RegExp(`${f.name.replace(/_/g, '[_ ]')}[:\\s]+([^\\n]+)`, 'i')
        const altRegex = new RegExp(`${f.description}[:\\s]+([^\\n]+)`, 'i')
        const match = allText.match(regex) ?? allText.match(altRegex)
        return {
          documentId,
          fieldName: f.name,
          fieldValue: match?.[1]?.trim() ?? '',
          fieldType: f.type,
          confidence: match ? 0.4 : 0.1,
          isAutoApproved: false,
        }
      })
      .filter((f) => f.fieldValue.length > 0)
  }

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

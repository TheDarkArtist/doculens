import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { extractionTemplates } from '@/db/schema/extraction-templates'
import { updateDocumentStatus } from '@/features/documents/document.repository'
import { getAIProvider } from '@/lib/ai-provider'
import { publishDocumentStatus } from '@/lib/pusher'
import type { NormalizedDocument } from '../extraction.types'

export async function classifyDocument(
  tenantId: string,
  documentId: string,
  normalized: NormalizedDocument
) {
  await publishDocumentStatus(tenantId, documentId, 'classifying', 0.3)

  const templates = await db.query.extractionTemplates.findMany({})
  const templateNames = templates.map((t) => t.slug)

  const firstPageText = normalized.pages[0]?.text || ''

  if (!firstPageText) {
    // No text to classify — skip classification
    return { templateId: null, confidence: 0 }
  }

  const provider = getAIProvider()
  const result = await provider.classify(firstPageText, templateNames)

  const matchedTemplate = templates.find(
    (t) => t.slug === result.documentType
  )

  if (matchedTemplate && result.confidence >= 0.8) {
    await updateDocumentStatus(tenantId, documentId, 'processing', {
      templateId: matchedTemplate.id,
      classificationConfidence: result.confidence,
    })
  }

  return {
    templateId: matchedTemplate?.id ?? null,
    confidence: result.confidence,
  }
}

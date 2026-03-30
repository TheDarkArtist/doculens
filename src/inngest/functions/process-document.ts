import { inngest } from '../client'
import { getDocumentById } from '@/features/documents/document.repository'
import { ingestDocument } from '@/features/extraction/stages/ingest'
import { classifyDocument } from '@/features/extraction/stages/classify'
import { extractFields } from '@/features/extraction/stages/extract'
import { enrichFields } from '@/features/extraction/stages/enrich'
import { validateDocument } from '@/features/extraction/stages/validate'
import { completeDocument } from '@/features/extraction/stages/complete'
import { NonRetriableError } from 'inngest'

export const processDocument = inngest.createFunction(
  { id: 'process-document', retries: 3 },
  { event: 'document/uploaded' },
  async ({ event, step }) => {
    const { documentId, tenantId } = event.data

    const doc = await step.run('load-document', async () => {
      const d = await getDocumentById(tenantId, documentId)
      if (!d) throw new NonRetriableError('Document not found')
      return { storageKey: d.storageKey, mimeType: d.mimeType }
    })

    const normalized = await step.run('ingest', () =>
      ingestDocument(tenantId, documentId, doc.storageKey, doc.mimeType)
    )

    const classified = await step.run('classify', () =>
      classifyDocument(tenantId, documentId, normalized)
    )

    await step.run('extract', () =>
      extractFields(
        tenantId,
        documentId,
        classified.templateId,
        normalized
      )
    )

    await step.run('enrich', () =>
      enrichFields(tenantId, documentId)
    )

    const validation = await step.run('validate', () =>
      validateDocument(tenantId, documentId)
    )

    await step.run('complete', () =>
      completeDocument(tenantId, documentId, {
        autoApproved: validation.autoApproved,
        status: validation.status as 'complete' | 'needs_review',
      })
    )
  }
)

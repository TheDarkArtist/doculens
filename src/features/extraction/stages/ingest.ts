import { downloadFile } from '@/lib/storage'
import { updateDocumentStatus } from '@/features/documents/document.repository'
import { publishDocumentStatus } from '@/lib/pusher'
import type { NormalizedDocument } from '../extraction.types'

export async function ingestDocument(
  tenantId: string,
  documentId: string,
  storageKey: string,
  mimeType: string
): Promise<NormalizedDocument> {
  await publishDocumentStatus(tenantId, documentId, 'ingesting', 0.1)
  await updateDocumentStatus(tenantId, documentId, 'processing', {
    processingStartedAt: new Date(),
  })

  const buffer = await downloadFile(storageKey)

  if (mimeType === 'application/pdf') {
    return extractPdfPages(buffer)
  }

  return {
    pages: [{ pageNumber: 1, text: null, hasTextLayer: false }],
    format: 'image',
    pageCount: 1,
  }
}

async function extractPdfPages(
  buffer: Buffer
): Promise<NormalizedDocument> {
  const { PDFExtract } = await import('pdf.js-extract')
  const pdfExtract = new PDFExtract()
  const data = await pdfExtract.extractBuffer(buffer)

  const pages = data.pages.map((page, i) => {
    const text = page.content
      .map((item) => item.str)
      .filter(Boolean)
      .join(' ')

    return {
      pageNumber: i + 1,
      text: text || null,
      hasTextLayer: text.length > 10,
    }
  })

  return {
    pages,
    format: 'pdf',
    pageCount: pages.length,
  }
}

import { downloadFile } from '@/lib/storage'
import { updateDocumentStatus } from '@/features/documents/document.repository'
import { publishDocumentStatus } from '@/lib/pusher'
import { getAIProvider } from '@/lib/ai-provider'
import type { NormalizedDocument } from '../extraction.types'

const MIN_TEXT_LAYER_CHARS = 50

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
    const fromTextLayer = await extractPdfPages(buffer)
    const totalChars = fromTextLayer.pages.reduce(
      (n, p) => n + (p.text?.length ?? 0),
      0
    )
    if (totalChars >= MIN_TEXT_LAYER_CHARS) return fromTextLayer

    const ocrText = await ocrFallback(buffer, mimeType)
    if (!ocrText) return fromTextLayer

    return {
      pages: [{ pageNumber: 1, text: ocrText, hasTextLayer: false }],
      format: 'pdf',
      pageCount: fromTextLayer.pageCount,
    }
  }

  if (mimeType.startsWith('image/')) {
    const ocrText = await ocrFallback(buffer, mimeType)
    return {
      pages: [{ pageNumber: 1, text: ocrText || null, hasTextLayer: false }],
      format: 'image',
      pageCount: 1,
    }
  }

  return {
    pages: [{ pageNumber: 1, text: null, hasTextLayer: false }],
    format: 'image',
    pageCount: 1,
  }
}

async function ocrFallback(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const provider = getAIProvider()
    return await provider.extractTextFromMedia(buffer, mimeType)
  } catch (e) {
    console.warn('[ingest] OCR fallback failed:', e)
    return ''
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

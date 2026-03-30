import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { extractedFields } from '@/db/schema/extracted-fields'
import { documentEmbeddings } from '@/db/schema/document-embeddings'
import { getAIProvider } from '@/lib/ai-provider'
import { publishDocumentStatus } from '@/lib/pusher'

export async function enrichFields(
  tenantId: string,
  documentId: string
) {
  await publishDocumentStatus(tenantId, documentId, 'enriching', 0.7)

  const fields = await db.query.extractedFields.findMany({
    where: eq(extractedFields.documentId, documentId),
  })

  if (fields.length === 0) return

  // Build text from all fields for embedding
  const fieldText = fields
    .map((f) => `${f.fieldName}: ${f.fieldValue}`)
    .join('\n')

  // Chunk text (simple approach: one chunk per document for now)
  const chunks = chunkText(fieldText, 500, 50)

  // Generate embeddings in batch (skip if AI provider unavailable)
  if (chunks.length > 0) {
    try {
      const provider = getAIProvider()
      const embeddings = await provider.embedBatch(chunks)

      const embeddingRows = chunks.map((chunk, i) => ({
        documentId,
        chunkText: chunk,
        chunkIndex: i,
        embedding: embeddings[i],
      }))

      await db.insert(documentEmbeddings).values(embeddingRows)
    } catch (e) {
      console.warn('[enrich] Embedding generation failed (no API key?):', e)
    }
  }
}

function chunkText(
  text: string,
  maxTokens: number,
  overlap: number
): string[] {
  // Approximate tokens as words / 0.75
  const words = text.split(/\s+/)
  const wordsPerChunk = Math.floor(maxTokens * 0.75)
  const overlapWords = Math.floor(overlap * 0.75)

  if (words.length <= wordsPerChunk) return [text]

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + wordsPerChunk, words.length)
    chunks.push(words.slice(start, end).join(' '))
    start = end - overlapWords
    if (start >= words.length) break
  }

  return chunks
}

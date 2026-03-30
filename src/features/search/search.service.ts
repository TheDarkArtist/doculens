import { sql, eq, and, desc, gte } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { documentEmbeddings } from '@/db/schema/document-embeddings'
import { getAIProvider } from '@/lib/ai-provider'
import type { SearchInput, SearchResult } from './search.types'

export async function hybridSearch(
  tenantId: string,
  input: SearchInput
): Promise<{ results: SearchResult[]; total: number }> {
  const { query, filters, limit } = input

  // Run vector search and full-text search in parallel
  const [vectorResults, textResults] = await Promise.all([
    vectorSearch(tenantId, query, filters, limit),
    fullTextSearch(tenantId, query, filters, limit),
  ])

  // Reciprocal Rank Fusion
  const k = 60
  const scores = new Map<string, { score: number; data: SearchResult }>()

  vectorResults.forEach((r, i) => {
    const rrf = 1 / (k + i + 1)
    const existing = scores.get(r.documentId)
    if (existing) {
      existing.score += rrf
    } else {
      scores.set(r.documentId, { score: rrf, data: r })
    }
  })

  textResults.forEach((r, i) => {
    const rrf = 1 / (k + i + 1)
    const existing = scores.get(r.documentId)
    if (existing) {
      existing.score += rrf
    } else {
      scores.set(r.documentId, { score: rrf, data: r })
    }
  })

  const merged = Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, data }) => ({ ...data, relevanceScore: score }))

  return { results: merged, total: merged.length }
}

async function vectorSearch(
  tenantId: string,
  query: string,
  filters: SearchInput['filters'],
  limit: number
): Promise<SearchResult[]> {
  try {
    const provider = getAIProvider()
    const queryEmbedding = await provider.embed(query)
    const embeddingStr = `[${queryEmbedding.join(',')}]`

    const results = await db
      .select({
        documentId: documentEmbeddings.documentId,
        chunkText: documentEmbeddings.chunkText,
        filename: documents.filename,
        status: documents.status,
        distance: sql<number>`${documentEmbeddings.embedding} <=> ${embeddingStr}::vector`,
      })
      .from(documentEmbeddings)
      .innerJoin(documents, eq(documentEmbeddings.documentId, documents.id))
      .where(eq(documents.tenantId, tenantId))
      .orderBy(sql`${documentEmbeddings.embedding} <=> ${embeddingStr}::vector`)
      .limit(limit)

    return results.map((r) => ({
      documentId: r.documentId,
      filename: r.filename,
      status: r.status,
      relevanceScore: 1 - r.distance,
      matchedChunk: r.chunkText.slice(0, 200),
    }))
  } catch {
    return []
  }
}

async function fullTextSearch(
  tenantId: string,
  query: string,
  filters: SearchInput['filters'],
  limit: number
): Promise<SearchResult[]> {
  try {
    const results = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        status: documents.status,
        rank: sql<number>`ts_rank_cd(${documents.searchVector}, plainto_tsquery('english', ${query}))`,
      })
      .from(documents)
      .where(
        and(
          eq(documents.tenantId, tenantId),
          sql`${documents.searchVector} @@ plainto_tsquery('english', ${query})`
        )
      )
      .orderBy(
        desc(
          sql`ts_rank_cd(${documents.searchVector}, plainto_tsquery('english', ${query}))`
        )
      )
      .limit(limit)

    return results.map((r) => ({
      documentId: r.id,
      filename: r.filename,
      status: r.status,
      relevanceScore: r.rank,
      matchedChunk: '',
    }))
  } catch {
    return []
  }
}

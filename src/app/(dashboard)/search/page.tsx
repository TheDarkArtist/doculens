'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/documents/status-badge'
import { Search as SearchIcon, FileText } from 'lucide-react'

type Result = {
  documentId: string
  filename: string
  status: string
  relevanceScore: number
  matchedChunk: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    const res = await fetch('/api/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await res.json()
    setResults(data.data?.results ?? [])
    setLoading(false)
    setSearched(true)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents... e.g. 'invoices from Acme Corp over $10K'"
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <SearchIcon className="mr-2 h-4 w-4" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {searched && results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No results found for &ldquo;{query}&rdquo;
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.documentId}>
              <CardContent className="flex items-start gap-3 py-4">
                <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/documents/${r.documentId}/review`}
                      className="font-medium hover:underline"
                    >
                      {r.filename}
                    </Link>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-muted-foreground">
                      Score: {r.relevanceScore.toFixed(4)}
                    </span>
                  </div>
                  {r.matchedChunk && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {r.matchedChunk}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

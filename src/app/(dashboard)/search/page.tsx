'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/documents/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Search as SearchIcon, FileText, SlidersHorizontal } from 'lucide-react'

type Result = {
  documentId: string
  filename: string
  status: string
  relevanceScore: number
  matchedChunk: string
}

type Template = { id: string; name: string; slug: string }

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTemplate, setFilterTemplate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetch('/api/v1/templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.data ?? []))
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    const body: Record<string, unknown> = { query }
    if (filterStatus || filterTemplate) {
      body.filters = {}
      if (filterStatus) (body.filters as Record<string, string>).status = filterStatus
      if (filterTemplate) (body.filters as Record<string, string>).documentType = filterTemplate
    }

    const res = await fetch('/api/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setResults(data.data?.results ?? [])
    setLoading(false)
    setSearched(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-1">
          Semantic + full-text hybrid search across all documents
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search documents... e.g. "invoices from Atlas over $5K"'
              className="pl-10 h-11"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <Card className="animate-fade">
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">All statuses</option>
                    <option value="complete">Complete</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Document Type</Label>
                  <select
                    value={filterTemplate}
                    onChange={(e) => setFilterTemplate(e.target.value)}
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">All types</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterStatus('')
                      setFilterTemplate('')
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {searched && results.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="No results found"
          description={`No documents match "${query}". Try a different search term.`}
        />
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{results.length} results</p>
          {results.map((r) => (
            <Link key={r.documentId} href={`/documents/${r.documentId}`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="flex items-start gap-3 py-4">
                  <FileText className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.filename}</span>
                      <StatusBadge status={r.status} />
                      <span className="text-[10px] text-muted-foreground font-mono">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

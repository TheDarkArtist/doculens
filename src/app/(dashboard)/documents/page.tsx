import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listDocuments } from '@/features/documents/document.repository'
import { listTemplates } from '@/features/templates/template.repository'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DocumentTable } from '@/components/documents/document-table'
import { AutoRefresh } from '@/components/documents/auto-refresh'
import { EmptyState } from '@/components/ui/empty-state'
import { Upload, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusTabs = [
  { label: 'All', value: undefined },
  { label: 'Needs Review', value: 'needs_review' as const },
  { label: 'Complete', value: 'complete' as const },
  { label: 'Processing', value: 'processing' as const },
  { label: 'Failed', value: 'failed' as const },
]

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  const status = params.status as 'queued' | 'processing' | 'needs_review' | 'complete' | 'failed' | undefined
  const page = Math.max(1, Number(params.page ?? 1))
  const limit = 20
  const skip = (page - 1) * limit

  const [{ items, total, hasMore }, templates] = await Promise.all([
    listDocuments(session.user.tenantId, { skip, limit, status }),
    listTemplates(session.user.tenantId),
  ])

  const hasTransient = items.some(
    (d) => d.status === 'queued' || d.status === 'processing'
  )

  return (
    <div className="space-y-6">
      <AutoRefresh hasTransient={hasTransient} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">{total} total documents</p>
        </div>
        <Link href="/documents/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 border-b">
        {statusTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/documents?status=${tab.value}` : '/documents'}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              status === tab.value || (!status && !tab.value)
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents found"
              description={status ? `No documents with status "${status.replace('_', ' ')}"` : 'Upload your first document to get started'}
              action={!status ? { label: 'Upload Document', href: '/documents/upload' } : undefined}
            />
          ) : (
            <DocumentTable
              documents={items.map((d) => ({
                ...d,
                createdAt: d.createdAt.toISOString(),
              }))}
              templates={templates.map((t) => ({ id: t.id, name: t.name }))}
            />
          )}
        </CardContent>
      </Card>

      {total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {skip + 1}–{Math.min(skip + items.length, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/documents?page=${page - 1}${status ? `&status=${status}` : ''}`}>
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            )}
            {hasMore && (
              <Link href={`/documents?page=${page + 1}${status ? `&status=${status}` : ''}`}>
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listDocuments } from '@/features/documents/document.repository'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/documents/status-badge'
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

  const { items, total, hasMore } = await listDocuments(
    session.user.tenantId,
    { skip, limit, status }
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
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
            <div className="p-6 text-center text-muted-foreground">
              No documents found{status ? ` with status "${status.replace('_', ' ')}"` : ''}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Filename</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Size</th>
                    <th className="p-3 font-medium">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.filename}
                        </Link>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {doc.mimeType.split('/')[1]?.toUpperCase() ?? doc.mimeType}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatSize(doc.fileSize)}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

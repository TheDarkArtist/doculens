import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getDocumentById } from '@/features/documents/document.repository'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/documents/status-badge'
import { ConfidenceBadge } from '@/components/review/confidence-badge'
import { Eye, Download } from 'lucide-react'

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const doc = await getDocumentById(session.user.tenantId, id)
  if (!doc) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{doc.filename}</h1>
          <StatusBadge status={doc.status} />
        </div>
        <div className="flex gap-2">
          {doc.status === 'needs_review' && (
            <Link href={`/documents/${doc.id}/review`}>
              <Button>
                <Eye className="mr-2 h-4 w-4" />
                Review
              </Button>
            </Link>
          )}
          <a href={`/api/v1/documents/${doc.id}/export?format=csv`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </a>
          <a href={`/api/v1/documents/${doc.id}/export?format=json`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              JSON
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Type" value={doc.mimeType} />
            <InfoRow label="Size" value={formatSize(doc.fileSize)} />
            <InfoRow
              label="Pages"
              value={doc.pageCount?.toString() ?? 'Unknown'}
            />
            <InfoRow
              label="Uploaded"
              value={new Date(doc.createdAt).toLocaleString()}
            />
            {doc.processingCompletedAt && (
              <InfoRow
                label="Completed"
                value={new Date(doc.processingCompletedAt).toLocaleString()}
              />
            )}
            {doc.errorMessage && (
              <InfoRow label="Error" value={doc.errorMessage} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Extracted Fields ({doc.fields?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!doc.fields?.length ? (
              <p className="text-sm text-muted-foreground">
                No fields extracted.
              </p>
            ) : (
              <div className="space-y-2">
                {doc.fields.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded border px-3 py-2"
                  >
                    <div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {f.fieldName.replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm">{f.fieldValue || '—'}</p>
                    </div>
                    <ConfidenceBadge confidence={f.confidence} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

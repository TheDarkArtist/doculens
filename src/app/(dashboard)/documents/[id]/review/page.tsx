import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getDocumentById } from '@/features/documents/document.repository'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/documents/status-badge'
import { FieldEditor } from '@/components/review/field-editor'
import { ReviewActions } from '@/components/review/review-actions'
import { PdfViewer } from '@/components/review/pdf-viewer'

export default async function ReviewDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const doc = await getDocumentById(session.user.tenantId, id)
  if (!doc) notFound()

  const sortedFields = [...(doc.fields ?? [])].sort(
    (a, b) => a.confidence - b.confidence
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{doc.filename}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={doc.status} />
            <span className="text-sm text-muted-foreground">
              {doc.mimeType.split('/')[1]?.toUpperCase()}
            </span>
          </div>
        </div>
        {(doc.status === 'needs_review' || doc.status === 'queued') && (
          <ReviewActions documentId={doc.id} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PdfViewer documentId={doc.id} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Extracted Fields ({sortedFields.length})
              </CardTitle>
              <Badge variant="secondary">
                Sorted by confidence (low first)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {sortedFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fields extracted yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedFields.map((field) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    documentId={doc.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

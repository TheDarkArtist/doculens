import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listDocuments } from '@/features/documents/document.repository'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/documents/status-badge'
import { Upload, FileText } from 'lucide-react'

export default async function DocumentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { items, total } = await listDocuments(session.user.tenantId, {
    skip: 0,
    limit: 50,
  })

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Documents ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents found. Upload a document to begin processing.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Filename</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Size</th>
                    <th className="pb-3 font-medium">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.filename}
                        </Link>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {doc.mimeType.split('/')[1]?.toUpperCase() ?? doc.mimeType}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3 text-muted-foreground">
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
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

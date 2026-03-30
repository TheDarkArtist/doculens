import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getReviewQueue } from '@/features/review/review.repository'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Eye } from 'lucide-react'

export default async function ReviewPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { items, total } = await getReviewQueue(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <Badge variant="secondary">{total} pending</Badge>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No documents pending review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.fieldCount} fields &middot; avg confidence{' '}
                      {doc.avgConfidence
                        ? `${(doc.avgConfidence * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <Link href={`/documents/${doc.id}/review`}>
                  <Button size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

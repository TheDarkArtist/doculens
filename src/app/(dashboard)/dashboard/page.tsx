import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { eq, count, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/documents/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { AutoRefresh } from '@/components/documents/auto-refresh'
import {
  FileText,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Upload,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenantId = session.user.tenantId
  const where = eq(documents.tenantId, tenantId)

  const [totalResult, reviewResult, completeResult, failedResult, recent] =
    await Promise.all([
      db.select({ value: count() }).from(documents).where(where),
      db.select({ value: count() }).from(documents).where(
        and(where, eq(documents.status, 'needs_review'))
      ),
      db.select({ value: count() }).from(documents).where(
        and(where, eq(documents.status, 'complete'))
      ),
      db.select({ value: count() }).from(documents).where(
        and(where, eq(documents.status, 'failed'))
      ),
      db.query.documents.findMany({
        where,
        orderBy: [desc(documents.createdAt)],
        limit: 8,
      }),
    ])

  const total = totalResult[0].value
  const completed = completeResult[0].value
  const automationRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const stats = [
    { title: 'Total Processed', value: total, icon: FileText, color: 'text-blue-500' },
    { title: 'Pending Review', value: reviewResult[0].value, icon: ClipboardCheck, color: 'text-yellow-500' },
    { title: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Automation Rate', value: `${automationRate}%`, icon: TrendingUp, color: 'text-purple-500' },
  ]

  const TRANSIENT_FRESH_MS = 10 * 60 * 1000
  const now = Date.now()
  const hasTransient = recent.some((d) => {
    if (d.status !== 'queued' && d.status !== 'processing') return false
    const updated = (d.updatedAt ?? d.createdAt).getTime()
    return now - updated < TRANSIENT_FRESH_MS
  })

  return (
    <div className="space-y-8">
      <AutoRefresh hasTransient={hasTransient} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Document processing overview
          </p>
        </div>
        <Link href="/documents/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Documents</CardTitle>
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload your first document to see it processed by the AI pipeline."
                action={{ label: 'Upload Document', href: '/documents/upload' }}
              />
            ) : (
              <div className="space-y-3">
                {recent.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {doc.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <StatusBadge status={doc.status} />
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/documents/upload" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <Upload className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground">Process a new document</p>
                </div>
              </div>
            </Link>
            <Link href="/review" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <ClipboardCheck className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Review Queue</p>
                  <p className="text-xs text-muted-foreground">
                    {reviewResult[0].value} documents pending
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/analytics" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-xs text-muted-foreground">View processing metrics</p>
                </div>
              </div>
            </Link>
            {failedResult[0].value > 0 && (
              <Link href="/documents?status=failed" className="block">
                <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 transition-colors hover:bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Failed Documents</p>
                    <p className="text-xs text-muted-foreground">
                      {failedResult[0].value} need attention
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { eq, count, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/documents/status-badge'
import { FileText, ClipboardCheck, CheckCircle, AlertTriangle } from 'lucide-react'

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

  const stats = [
    { title: 'Total Documents', value: totalResult[0].value, icon: FileText },
    { title: 'Pending Review', value: reviewResult[0].value, icon: ClipboardCheck },
    { title: 'Completed', value: completeResult[0].value, icon: CheckCircle },
    { title: 'Failed', value: failedResult[0].value, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Filename</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0">
                    <td className="py-2">
                      <Link href={`/documents/${doc.id}`} className="hover:underline">
                        {doc.filename}
                      </Link>
                    </td>
                    <td className="py-2"><StatusBadge status={doc.status} /></td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

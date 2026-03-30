import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listAuditLogs } from '@/features/audit/audit.service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const actionLabels: Record<string, string> = {
  'document.uploaded': 'Uploaded',
  'document.processing_started': 'Processing Started',
  'document.classified': 'Classified',
  'document.validated': 'Validated',
  'document.auto_approved': 'Auto-Approved',
  'document.processed': 'Processed',
  'document.approved': 'Approved',
  'document.rejected': 'Rejected',
  'document.deleted': 'Deleted',
  'field.extracted': 'Field Extracted',
  'field.corrected': 'Field Corrected',
}

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { items, total } = await listAuditLogs(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} entries</Badge>
          <a href="/api/v1/audit/export">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No audit entries yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Document</th>
                    <th className="p-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {actionLabels[log.action] ?? log.action}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {log.user?.name ?? 'System'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {log.document?.filename ?? '—'}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {JSON.stringify(log.details)}
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

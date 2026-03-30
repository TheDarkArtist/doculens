import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { unauthorizedResponse } from '@/lib/api-response'
import { listAuditLogs } from '@/features/audit/audit.service'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const { items } = await listAuditLogs(session.user.tenantId, {
    limit: 10000,
  })

  const headers = ['timestamp', 'action', 'user', 'document', 'details']
  const rows = items.map((log) =>
    [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.user?.name ?? 'System',
      log.document?.filename ?? '',
      `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
    ].join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="audit-log.csv"',
    },
  })
}

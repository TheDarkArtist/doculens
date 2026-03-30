import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { successResponse, unauthorizedResponse } from '@/lib/api-response'
import { listAuditLogs } from '@/features/audit/audit.service'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const params = req.nextUrl.searchParams
  const result = await listAuditLogs(session.user.tenantId, {
    skip: Number(params.get('skip') ?? 0),
    limit: Number(params.get('limit') ?? 50),
    documentId: params.get('documentId') ?? undefined,
    action: params.get('action') ?? undefined,
  })

  return successResponse(result)
}

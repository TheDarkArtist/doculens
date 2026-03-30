import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { webhooks } from '@/db/schema/webhooks'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const hooks = await db.query.webhooks.findMany({
    where: eq(webhooks.tenantId, session.user.tenantId),
    columns: { id: true, url: true, events: true, active: true, createdAt: true },
  })

  return successResponse(hooks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const body = await req.json()
  const { url, events } = body

  if (!url) return errorResponse('VALIDATION_ERROR', 'URL is required')

  const secret = randomBytes(32).toString('hex')

  const [hook] = await db
    .insert(webhooks)
    .values({
      tenantId: session.user.tenantId,
      url,
      events: events ?? ['document.processed'],
      secret,
    })
    .returning()

  return successResponse({ ...hook, secret }, 201)
}

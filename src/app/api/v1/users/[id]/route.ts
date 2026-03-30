import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const { id } = await params
  const body = await req.json()

  if (id === session.user.id && body.role && body.role !== session.user.role) {
    return errorResponse('VALIDATION_ERROR', 'Cannot change your own role')
  }

  const [updated] = await db
    .update(users)
    .set({ role: body.role })
    .where(
      and(eq(users.id, id), eq(users.tenantId, session.user.tenantId))
    )
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })

  if (!updated) return notFoundResponse('User not found')
  return successResponse(updated)
}

import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { hashSync } from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const userList = await db.query.users.findMany({
    where: eq(users.tenantId, session.user.tenantId),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: [users.createdAt],
  })

  return successResponse(userList)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const body = await req.json()
  const { email, name, role, password } = body

  if (!email || !name || !password) {
    return errorResponse('VALIDATION_ERROR', 'Email, name, and password are required')
  }

  const [user] = await db
    .insert(users)
    .values({
      tenantId: session.user.tenantId,
      email,
      name,
      role: role ?? 'viewer',
      passwordHash: hashSync(password, 10),
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })

  return successResponse(user, 201)
}

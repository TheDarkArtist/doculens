import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-response'
import { createTemplateSchema } from '@/features/templates/template.types'
import * as templateRepo from '@/features/templates/template.repository'

export async function GET() {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const templates = await templateRepo.listTemplates(
    session.user.tenantId
  )
  return successResponse(templates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const body = await req.json()
  const parsed = createTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', parsed.error.message)
  }

  const template = await templateRepo.createTemplate(
    session.user.tenantId,
    parsed.data
  )

  return successResponse(template, 201)
}

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api-response'
import * as templateRepo from '@/features/templates/template.repository'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const { id } = await params
  const template = await templateRepo.getTemplateById(
    session.user.tenantId,
    id
  )

  if (!template) return notFoundResponse('Template not found')
  return successResponse(template)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()
  if (session.user.role !== 'admin') return forbiddenResponse()

  const { id } = await params
  const deleted = await templateRepo.deleteTemplate(
    session.user.tenantId,
    id
  )

  if (!deleted) {
    return notFoundResponse('Template not found or is a system template')
  }

  return successResponse({ id: deleted.id })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { unauthorizedResponse, notFoundResponse } from '@/lib/api-response'
import { getDocumentById } from '@/features/documents/document.repository'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorizedResponse()

  const { id } = await params
  const format = req.nextUrl.searchParams.get('format') ?? 'json'
  const doc = await getDocumentById(session.user.tenantId, id)

  if (!doc) return notFoundResponse('Document not found')

  const fields = doc.fields ?? []

  if (format === 'csv') {
    const headers = ['field_name', 'field_value', 'field_type', 'confidence', 'is_auto_approved']
    const rows = fields.map((f) =>
      [f.fieldName, `"${f.fieldValue.replace(/"/g, '""')}"`, f.fieldType, f.confidence, f.isAutoApproved].join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${doc.filename}-fields.csv"`,
      },
    })
  }

  // JSON export
  const data = {
    document: {
      id: doc.id,
      filename: doc.filename,
      status: doc.status,
      createdAt: doc.createdAt,
    },
    fields: fields.map((f) => ({
      name: f.fieldName,
      value: f.fieldValue,
      type: f.fieldType,
      confidence: f.confidence,
      autoApproved: f.isAutoApproved,
      originalValue: f.originalValue,
    })),
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${doc.filename}-fields.json"`,
    },
  })
}

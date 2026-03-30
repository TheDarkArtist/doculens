import { v4 as uuid } from 'uuid'
import { getPresignedUploadUrl } from '@/lib/s3'
import { ok, err, type Result } from '@/lib/result'
import { inngest } from '@/inngest/client'
import * as documentRepo from './document.repository'
import { createAuditLog } from '@/features/audit/audit.repository'
import type { CreateDocumentInput, UploadUrlInput } from './document.types'

export async function generateUploadUrl(
  tenantId: string,
  input: UploadUrlInput
): Promise<Result<{ url: string; key: string; expiresIn: number }>> {
  const documentId = uuid()
  const key = `${tenantId}/${documentId}/${input.filename}`

  try {
    const presigned = await getPresignedUploadUrl(key, input.mimeType)
    return ok(presigned)
  } catch (e) {
    return err('Failed to generate upload URL')
  }
}

export async function createDocument(
  tenantId: string,
  userId: string,
  input: CreateDocumentInput
) {
  try {
    const doc = await documentRepo.createDocument(
      tenantId,
      userId,
      input
    )

    await createAuditLog({
      tenantId,
      userId,
      documentId: doc.id,
      action: 'document.uploaded',
      details: {
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      },
    })

    inngest
      .send({
        name: 'document/uploaded',
        data: { documentId: doc.id, tenantId },
      })
      .catch((e) => {
        console.warn('[inngest] Failed to send event (is inngest dev running?):', e)
      })

    return ok(doc)
  } catch (e) {
    console.error('[document.service] createDocument failed:', e)
    return err('Failed to create document')
  }
}

export async function listDocuments(
  tenantId: string,
  input: Parameters<typeof documentRepo.listDocuments>[1]
) {
  return ok(await documentRepo.listDocuments(tenantId, input))
}

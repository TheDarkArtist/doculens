import Pusher from 'pusher'
import { env } from './env'

let pusherInstance: Pusher | null = null

function getPusher(): Pusher | null {
  if (!env.PUSHER_APP_ID || !env.PUSHER_KEY || !env.PUSHER_SECRET) {
    return null
  }
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    })
  }
  return pusherInstance
}

export async function publishDocumentStatus(
  tenantId: string,
  documentId: string,
  stage: string,
  progress: number
) {
  const pusher = getPusher()
  if (!pusher) return
  await pusher.trigger(`tenant-${tenantId}`, 'document:status', {
    documentId,
    status: 'processing',
    stage,
    progress,
  }).catch((e) => console.warn('[pusher] Failed to publish:', e))
}

export async function publishDocumentComplete(
  tenantId: string,
  documentId: string,
  autoApproved: boolean,
  fieldCount: number
) {
  const pusher = getPusher()
  if (!pusher) return
  await pusher.trigger(`tenant-${tenantId}`, 'document:complete', {
    documentId,
    autoApproved,
    fieldCount,
  }).catch((e) => console.warn('[pusher] Failed to publish:', e))
}

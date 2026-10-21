'use client'

import { useDocumentEvents } from '@/hooks/use-document-events'

export function RealtimeListener({ tenantId }: { tenantId: string }) {
  useDocumentEvents(tenantId)
  return null
}

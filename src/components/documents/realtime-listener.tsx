'use client'

import { useSession } from 'next-auth/react'
import { useDocumentEvents } from '@/hooks/use-document-events'

export function RealtimeListener() {
  const { data: session } = useSession()
  useDocumentEvents(session?.user?.tenantId)
  return null
}

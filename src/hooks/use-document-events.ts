'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useDocumentEvents(tenantId: string | undefined) {
  const router = useRouter()

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster || key === 'your-key' || !tenantId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pusherInstance: any = null

    import('pusher-js').then(({ default: Pusher }) => {
      pusherInstance = new Pusher(key, { cluster })
      const channel = pusherInstance.subscribe(`tenant-${tenantId}`)
      channel.bind('document:status', () => router.refresh())
      channel.bind('document:complete', () => router.refresh())
    }).catch(() => {})

    return () => {
      pusherInstance?.disconnect()
    }
  }, [tenantId, router])
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function usePolling(
  shouldPoll: boolean,
  intervalMs = 3000
) {
  const router = useRouter()

  useEffect(() => {
    if (!shouldPoll) return

    const id = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => clearInterval(id)
  }, [shouldPoll, intervalMs, router])
}

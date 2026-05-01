'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_INTERVAL_MS = 8000
const MAX_ATTEMPTS = 30

export function usePolling(
  shouldPoll: boolean,
  intervalMs = DEFAULT_INTERVAL_MS
) {
  const router = useRouter()

  useEffect(() => {
    if (!shouldPoll) return
    if (typeof document === 'undefined') return

    let attempts = 0

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(id)
        return
      }
      attempts += 1
      router.refresh()
    }

    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [shouldPoll, intervalMs, router])
}

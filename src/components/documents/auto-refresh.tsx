'use client'

import { usePolling } from '@/hooks/use-polling'

export function AutoRefresh({
  hasTransient,
}: {
  hasTransient: boolean
}) {
  usePolling(hasTransient, 3000)
  return null
}

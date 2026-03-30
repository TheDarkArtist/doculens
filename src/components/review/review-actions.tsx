'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, Loader2, Keyboard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ReviewActions({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = useCallback(async () => {
    setLoading('approve')
    await fetch(`/api/v1/documents/${documentId}/approve`, { method: 'POST' })
    setLoading(null)
    router.push('/review')
  }, [documentId, router])

  const handleReject = useCallback(async () => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    setLoading('reject')
    await fetch(`/api/v1/documents/${documentId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(null)
    router.push('/review')
  }, [documentId, router])

  async function handleReprocess() {
    setLoading('reprocess')
    await fetch(`/api/v1/documents/${documentId}/reprocess`, { method: 'POST' })
    setLoading(null)
    router.refresh()
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        handleApprove()
      }
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        handleReject()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleApprove, handleReject])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReprocess}
        disabled={loading !== null}
      >
        {loading === 'reprocess' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Re-process
      </Button>
      <Button
        onClick={handleApprove}
        disabled={loading !== null}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading === 'approve' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        Approve
        <Badge variant="outline" className="ml-2 text-[10px] bg-white/20 border-white/30">
          Shift+Enter
        </Badge>
      </Button>
      <Button
        onClick={handleReject}
        disabled={loading !== null}
        variant="destructive"
      >
        {loading === 'reject' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="mr-2 h-4 w-4" />
        )}
        Reject
        <Badge variant="outline" className="ml-2 text-[10px] bg-white/20 border-white/30">
          R
        </Badge>
      </Button>
    </div>
  )
}

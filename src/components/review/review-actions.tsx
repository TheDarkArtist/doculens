'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export function ReviewActions({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleApprove() {
    setLoading('approve')
    const res = await fetch(`/api/v1/documents/${documentId}/approve`, {
      method: 'POST',
    })
    setLoading(null)
    if (res.ok) router.push('/review')
  }

  async function handleReject() {
    const reason = prompt('Rejection reason:')
    if (!reason) return

    setLoading('reject')
    const res = await fetch(`/api/v1/documents/${documentId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(null)
    if (res.ok) router.push('/review')
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleApprove}
        disabled={loading !== null}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        {loading === 'approve' ? 'Approving...' : 'Approve'}
      </Button>
      <Button
        onClick={handleReject}
        disabled={loading !== null}
        variant="destructive"
      >
        <XCircle className="mr-2 h-4 w-4" />
        {loading === 'reject' ? 'Rejecting...' : 'Reject'}
      </Button>
    </div>
  )
}

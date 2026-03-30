'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

export function PdfViewer({ documentId }: { documentId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/v1/documents/${documentId}/preview`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUrl(data.data.url)
        else setError('Preview not available')
      })
      .catch(() => setError('Failed to load preview'))
  }, [documentId])

  if (error) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!url) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden">
      <iframe
        src={url}
        className="h-full w-full min-h-[600px] border-0"
        title="PDF Preview"
      />
    </Card>
  )
}

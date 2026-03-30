'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUpload } from '@/hooks/use-upload'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
]
const MAX_SIZE = 10 * 1024 * 1024

export function UploadZone() {
  const router = useRouter()
  const { status, progress, error, upload, reset } = useUpload()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert('Only PDF, PNG, and JPEG files are accepted')
        return
      }
      if (file.size > MAX_SIZE) {
        alert('File must be under 10MB')
        return
      }
      upload(file)
    },
    [upload]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (status === 'done') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium">Upload complete</p>
          <p className="text-sm text-muted-foreground">
            Document is queued for processing.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset} variant="outline">Upload another</Button>
            <Button onClick={() => router.push('/documents')}>View documents</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Upload failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={reset} variant="outline">Try again</Button>
        </CardContent>
      </Card>
    )
  }

  const isUploading = status === 'uploading' || status === 'creating'

  return (
    <Card>
      <CardContent className="py-6">
        <div
          className={cn(
            'flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors',
            dragOver && 'border-primary bg-primary/5',
            isUploading && 'pointer-events-none opacity-60'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <>
              <FileText className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="text-lg font-medium">
                {status === 'uploading' ? 'Uploading...' : 'Creating document...'}
              </p>
              <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Drop a file here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                PDF, PNG, or JPEG up to 10MB
              </p>
              <label>
                <Button variant="outline" asChild>
                  <span>Choose file</span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleChange}
                />
              </label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

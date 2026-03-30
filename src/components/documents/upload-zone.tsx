'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUpload } from '@/hooks/use-upload'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_SIZE = 10 * 1024 * 1024

type FileEntry = {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

export function UploadZone() {
  const router = useRouter()
  const { upload } = useUpload()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const addFiles = useCallback((newFiles: FileList) => {
    const entries: FileEntry[] = Array.from(newFiles)
      .filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_SIZE)
      .map((f) => ({ file: f, status: 'pending' as const, progress: 0 }))
    setFiles((prev) => [...prev, ...entries])
  }, [])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUploadAll() {
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'done') continue
      setFiles((prev) =>
        prev.map((f, j) => (j === i ? { ...f, status: 'uploading', progress: 30 } : f))
      )
      try {
        await upload(files[i].file)
        setFiles((prev) =>
          prev.map((f, j) => (j === i ? { ...f, status: 'done', progress: 100 } : f))
        )
      } catch {
        setFiles((prev) =>
          prev.map((f, j) => (j === i ? { ...f, status: 'error', error: 'Upload failed' } : f))
        )
      }
    }
    setUploading(false)
  }

  const allDone = files.length > 0 && files.every((f) => f.status === 'done')
  const hasPending = files.some((f) => f.status === 'pending')

  if (allDone) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium">
            {files.length} document{files.length > 1 ? 's' : ''} uploaded
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setFiles([])} variant="outline">Upload more</Button>
            <Button onClick={() => router.push('/documents')}>View documents</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        <div
          className={cn(
            'flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors',
            dragOver && 'border-primary bg-primary/5'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">Drop files here or click to browse</p>
          <p className="text-sm text-muted-foreground">PDF, PNG, or JPEG up to 10MB each</p>
          <label>
            <Button variant="outline" asChild>
              <span>Choose files</span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 rounded border px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{entry.file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(entry.file.size / 1024).toFixed(0)} KB
                </span>
                {entry.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {entry.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                {entry.status === 'uploading' && (
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${entry.progress}%` }} />
                  </div>
                )}
                {entry.status === 'pending' && !uploading && (
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {hasPending && (
              <Button onClick={handleUploadAll} disabled={uploading} className="w-full">
                {uploading ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} file(s)`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

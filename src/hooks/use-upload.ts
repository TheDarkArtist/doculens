'use client'

import { useState, useCallback } from 'react'

type UploadState = {
  status: 'idle' | 'uploading' | 'creating' | 'done' | 'error'
  progress: number
  error: string | null
  documentId: string | null
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    error: null,
    documentId: null,
  })

  const upload = useCallback(async (file: File) => {
    setState({ status: 'uploading', progress: 10, error: null, documentId: null })

    try {
      const urlRes = await fetch('/api/v1/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { data } = await urlRes.json()

      setState((s) => ({ ...s, progress: 30 }))

      const uploadHeaders: Record<string, string> = { 'Content-Type': file.type }
      if (data.headers) Object.assign(uploadHeaders, data.headers)

      const uploadRes = await fetch(data.url, {
        method: data.headers ? 'POST' : 'PUT',
        body: file,
        headers: uploadHeaders,
      })

      if (!uploadRes.ok) throw new Error('Failed to upload file')

      setState((s) => ({ ...s, status: 'creating', progress: 70 }))

      const createRes = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageKey: data.key,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      if (!createRes.ok) throw new Error('Failed to create document')
      const { data: doc } = await createRes.json()

      setState({ status: 'done', progress: 100, error: null, documentId: doc.id })
    } catch (e) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: e instanceof Error ? e.message : 'Upload failed',
      }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, error: null, documentId: null })
  }, [])

  return { ...state, upload, reset }
}

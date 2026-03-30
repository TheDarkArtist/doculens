'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, Trash2, Loader2 } from 'lucide-react'

type Doc = {
  id: string
  filename: string
  status: string
  mimeType: string
  fileSize: number
  createdAt: string
  templateId: string | null
}

export function DocumentTable({
  documents,
  templates,
}: {
  documents: Doc[]
  templates: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [acting, setActing] = useState(false)

  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]))

  function toggleAll() {
    if (selected.size === documents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(documents.map((d) => d.id)))
    }
  }

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  async function batchAction(action: 'approve' | 'delete') {
    if (selected.size === 0) return
    if (action === 'delete' && !confirm(`Delete ${selected.size} document(s)?`)) return

    setActing(true)
    await fetch('/api/v1/documents/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, documentIds: Array.from(selected) }),
    })
    setActing(false)
    setSelected(new Set())
    router.refresh()
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2 mb-3 animate-fade">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => batchAction('approve')}
            disabled={acting}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            {acting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-2 h-3 w-3" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => batchAction('delete')}
            disabled={acting}
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === documents.length && documents.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="p-3 font-medium">Filename</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Size</th>
              <th className="p-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className={`border-b last:border-0 transition-colors ${
                  selected.has(doc.id)
                    ? 'bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(doc.id)}
                    onChange={() => toggle(doc.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[250px]">{doc.filename}</span>
                  </Link>
                </td>
                <td className="p-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="p-3">
                  {doc.templateId && templateMap[doc.templateId] ? (
                    <Badge variant="outline" className="text-[10px]">
                      {templateMap[doc.templateId]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">
                  {formatSize(doc.fileSize)}
                </td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

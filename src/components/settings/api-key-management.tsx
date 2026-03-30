'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Key, Plus, Trash2, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react'

type ApiKey = {
  id: string
  name: string
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
  key?: string
}

export function ApiKeyManagement() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/v1/api-keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.data ?? []))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.get('name') }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setNewKey(data.key)
      setKeys([...keys, data])
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    await fetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' })
    setKeys(keys.filter((k) => k.id !== id))
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">API Keys</CardTitle>
          <CardDescription>Programmatic access to the DocuLens API</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Key className="mr-2 h-4 w-4" />
          Create Key
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {newKey && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2 animate-fade">
            <p className="text-sm font-medium text-green-800">
              API key created — copy it now, it won't be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-xs font-mono border truncate">
                {newKey}
              </code>
              <Button size="sm" variant="outline" onClick={copyKey}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setNewKey(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Key Name</Label>
              <Input name="name" required placeholder="e.g. Production API" className="h-9" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create
              </Button>
            </div>
          </form>
        )}

        {keys.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No API keys yet. Create one for programmatic access.
          </p>
        )}

        {keys.map((key) => (
          <div key={key.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Key className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <div className="flex gap-1">
                {key.scopes?.slice(0, 2).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRevoke(key.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

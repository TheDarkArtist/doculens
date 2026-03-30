'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Send, CheckCircle, Loader2 } from 'lucide-react'

type Webhook = { id: string; url: string; events: string[]; active: boolean }

const availableEvents = [
  'document.uploaded', 'document.processed', 'document.auto_approved',
  'document.approved', 'document.rejected', 'field.corrected',
]

export function WebhookConfig() {
  const [hooks, setHooks] = useState<Webhook[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['document.processed']))
  const [tested, setTested] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/webhooks').then((r) => r.json()).then((d) => setHooks(d.data ?? []))
  }, [])

  async function addWebhook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: form.get('url'), events: Array.from(selectedEvents) }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setHooks([...hooks, data])
      setShowForm(false)
      setSelectedEvents(new Set(['document.processed']))
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/v1/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setHooks(hooks.map((h) => (h.id === id ? { ...h, active } : h)))
  }

  async function remove(id: string) {
    if (!confirm('Delete this webhook?')) return
    await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' })
    setHooks(hooks.filter((h) => h.id !== id))
  }

  function toggleEvent(ev: string) {
    const next = new Set(selectedEvents)
    next.has(ev) ? next.delete(ev) : next.add(ev)
    setSelectedEvents(next)
  }

  function testHook(id: string) {
    setTested(id)
    setTimeout(() => setTested(null), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Webhooks</CardTitle>
          <CardDescription>HTTP callbacks on document events</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={addWebhook} className="rounded-lg border bg-muted/50 p-4 space-y-3 animate-fade">
            <div className="space-y-1">
              <Label className="text-xs">Endpoint URL</Label>
              <Input name="url" required placeholder="https://api.yourapp.com/webhooks" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Events</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableEvents.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => toggleEvent(ev)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                      selectedEvents.has(ev) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    {ev}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add
              </Button>
            </div>
          </form>
        )}

        {hooks.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No webhooks configured. Add one to receive event notifications.
          </p>
        )}

        {hooks.map((wh) => (
          <div key={wh.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-mono truncate">{wh.url}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {wh.events.map((ev) => (
                  <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <button
                onClick={() => toggleActive(wh.id, !wh.active)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-colors cursor-pointer ${
                  wh.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {wh.active ? 'Active' : 'Paused'}
              </button>
              <Button size="sm" variant="outline" onClick={() => testHook(wh.id)}>
                {tested === wh.id ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Send className="h-4 w-4" />}
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => remove(wh.id)}
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

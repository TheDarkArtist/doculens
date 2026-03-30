'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Send, CheckCircle } from 'lucide-react'

type Webhook = { id: string; url: string; events: string[]; active: boolean }

const availableEvents = [
  'document.uploaded',
  'document.processed',
  'document.auto_approved',
  'document.approved',
  'document.rejected',
  'field.corrected',
]

export function WebhookConfig() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: '1', url: 'https://api.example.com/webhooks/doculens', events: ['document.processed', 'document.approved'], active: true },
  ])
  const [showForm, setShowForm] = useState(false)
  const [tested, setTested] = useState<string | null>(null)

  function addWebhook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setWebhooks([
      ...webhooks,
      {
        id: String(Date.now()),
        url: form.get('url') as string,
        events: ['document.processed'],
        active: true,
      },
    ])
    setShowForm(false)
  }

  function testWebhook(id: string) {
    setTested(id)
    setTimeout(() => setTested(null), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Webhooks</CardTitle>
          <CardDescription>Receive HTTP callbacks when events occur</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={addWebhook} className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Endpoint URL</Label>
              <Input name="url" required placeholder="https://api.yourapp.com/webhooks" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Events</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableEvents.map((ev) => (
                  <Badge key={ev} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10">
                    {ev}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm"><Plus className="mr-2 h-4 w-4" />Add</Button>
            </div>
          </form>
        )}

        {webhooks.map((wh) => (
          <div key={wh.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-mono truncate">{wh.url}</p>
              <div className="flex gap-1 mt-1">
                {wh.events.map((ev) => (
                  <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Badge className={wh.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {wh.active ? 'Active' : 'Paused'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => testWebhook(wh.id)}
              >
                {tested === wh.id ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Send className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setWebhooks(webhooks.filter((w) => w.id !== wh.id))}
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

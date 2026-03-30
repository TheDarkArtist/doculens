'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Save, Clock, CheckCircle, Loader2 } from 'lucide-react'

const retentionOptions = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: 0, label: 'Indefinite' },
]

export function DataRetention({
  initial,
}: {
  initial?: number
}) {
  const [retention, setRetention] = useState(initial ?? 90)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await fetch('/api/v1/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retention_days: retention }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Data Retention</CardTitle>
        <CardDescription>
          Auto-delete completed documents after a set period. Runs daily at 3 AM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Retention Period</Label>
          <div className="grid grid-cols-3 gap-2">
            {retentionOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRetention(opt.value)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  retention === opt.value
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          {retention > 0
            ? `Completed documents older than ${retention} days will be automatically purged. Audit logs are retained indefinitely.`
            : 'Documents will be retained indefinitely. No automatic purging.'}
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : saved ? (
            <><CheckCircle className="mr-2 h-4 w-4" />Saved</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />Save Retention Policy</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

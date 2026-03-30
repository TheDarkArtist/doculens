'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Save, Clock } from 'lucide-react'

const retentionOptions = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: 0, label: 'Indefinite' },
]

export function DataRetention() {
  const [retention, setRetention] = useState(90)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Data Retention</CardTitle>
          <Badge variant="secondary" className="text-[10px]">Enterprise</Badge>
        </div>
        <CardDescription>
          Auto-delete processed documents after a configurable period
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
          Documents older than {retention || '∞'} days will be automatically purged.
          Audit logs are retained indefinitely for compliance.
        </div>
        <Button className="w-full" variant="outline" disabled>
          <Save className="mr-2 h-4 w-4" />
          Save (requires Enterprise plan)
        </Button>
      </CardContent>
    </Card>
  )
}

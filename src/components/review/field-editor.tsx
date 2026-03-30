'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfidenceBadge } from './confidence-badge'
import { Check, Pencil, X } from 'lucide-react'

type Field = {
  id: string
  fieldName: string
  fieldValue: string
  fieldType: string
  confidence: number
  isAutoApproved: boolean
  originalValue: string | null
}

export function FieldEditor({
  field,
  documentId,
}: {
  field: Field
  documentId: string
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(field.fieldValue)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(
      `/api/v1/documents/${documentId}/fields/${field.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      }
    )
    setSaving(false)
    if (res.ok) {
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {field.fieldName.replace(/_/g, ' ')}
          </span>
          <ConfidenceBadge confidence={field.confidence} />
          {field.isAutoApproved && (
            <span className="text-xs text-green-600">Auto-approved</span>
          )}
          {saved && (
            <span className="text-xs text-blue-600">Saved</span>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setValue(field.fieldValue)
                setEditing(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm">{field.fieldValue || '—'}</p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}

        {field.originalValue && field.originalValue !== field.fieldValue && (
          <p className="text-xs text-muted-foreground">
            Original: {field.originalValue}
          </p>
        )}
      </div>
    </div>
  )
}

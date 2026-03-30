'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'

const fieldTypes = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'currency', label: 'Currency' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'array', label: 'List' },
]

export type FieldDef = {
  name: string
  type: string
  description: string
  required: boolean
  sensitive: boolean
}

export function TemplateFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: FieldDef
  onChange: (updated: FieldDef) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30">
      <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground/50 cursor-grab" />
      <div className="grid flex-1 gap-2 sm:grid-cols-12">
        <Input
          value={field.name}
          onChange={(e) => onChange({ ...field, name: e.target.value })}
          placeholder="field_name"
          className="sm:col-span-3 h-9 text-sm font-mono"
        />
        <select
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value })}
          className="sm:col-span-2 h-9 rounded-md border bg-background px-2 text-sm"
        >
          {fieldTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Input
          value={field.description}
          onChange={(e) => onChange({ ...field, description: e.target.value })}
          placeholder="Description"
          className="sm:col-span-4 h-9 text-sm"
        />
        <div className="sm:col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="rounded"
            />
            Required
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={field.sensitive}
              onChange={(e) => onChange({ ...field, sensitive: e.target.checked })}
              className="rounded"
            />
            PII
          </label>
        </div>
        <div className="sm:col-span-1 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TemplateFieldRow, type FieldDef } from './template-field-row'
import { Plus, Save, Loader2, Code } from 'lucide-react'

export function TemplateEditor({
  initial,
}: {
  initial?: {
    id?: string
    name: string
    slug: string
    description: string
    fields: FieldDef[]
  }
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [fields, setFields] = useState<FieldDef[]>(
    initial?.fields ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)

  function addField() {
    setFields([
      ...fields,
      { name: '', type: 'string', description: '', required: false, sensitive: false },
    ])
  }

  function updateField(index: number, updated: FieldDef) {
    setFields(fields.map((f, i) => (i === index ? updated : f)))
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
  }

  function autoSlug(val: string) {
    setName(val)
    if (!initial?.id) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''))
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError('Template name is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }
    if (fields.length === 0) { setError('Add at least one field'); return }

    const emptyNames = fields.filter((f) => !f.name.trim())
    if (emptyNames.length > 0) { setError('All fields must have a name'); return }

    const names = fields.map((f) => f.name.trim().toLowerCase())
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)
    if (dupes.length > 0) { setError(`Duplicate field name: ${dupes[0]}`); return }

    const invalidNames = fields.filter((f) => !/^[a-z][a-z0-9_]*$/.test(f.name.trim()))
    if (invalidNames.length > 0) {
      setError(`Field "${invalidNames[0].name}" must be lowercase with underscores (e.g. vendor_name)`)
      return
    }

    setSaving(true)
    setError(null)

    const body = {
      name,
      slug,
      description,
      schema: {
        fields: fields.map((f) => ({
          name: f.name,
          type: f.type,
          description: f.description,
          required: f.required,
          sensitive: f.sensitive || undefined,
        })),
      },
    }

    const res = await fetch('/api/v1/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (res.ok) {
      router.push('/templates')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error?.message ?? 'Failed to save template')
    }
  }

  const schemaJson = JSON.stringify(
    { fields: fields.filter((f) => f.name) },
    null,
    2
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => autoSlug(e.target.value)}
                placeholder="e.g. Bank Statement"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="bank-statement"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of document does this template extract?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Fields ({fields.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJson(!showJson)}
            >
              <Code className="mr-2 h-4 w-4" />
              {showJson ? 'Hide' : 'Show'} JSON
            </Button>
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed py-8 text-center">
              <p className="text-sm text-muted-foreground">No fields defined yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={addField}>
                <Plus className="mr-2 h-4 w-4" />
                Add first field
              </Button>
            </div>
          ) : (
            fields.map((field, i) => (
              <TemplateFieldRow
                key={i}
                field={field}
                onChange={(updated) => updateField(i, updated)}
                onRemove={() => removeField(i)}
              />
            ))
          )}

          {showJson && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono">
              {schemaJson}
            </pre>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

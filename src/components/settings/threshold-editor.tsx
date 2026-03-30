'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Save, Loader2, CheckCircle } from 'lucide-react'

export function ThresholdEditor({
  initial,
}: {
  initial: { auto_approve_threshold: number; review_threshold: number }
}) {
  const [autoApprove, setAutoApprove] = useState(initial.auto_approve_threshold)
  const [review, setReview] = useState(initial.review_threshold)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/v1/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auto_approve_threshold: autoApprove,
        review_threshold: review,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confidence Thresholds</CardTitle>
        <CardDescription>Controls automatic approval routing for extracted fields</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Auto-Approve Threshold</Label>
            <span className="text-sm font-mono font-medium text-green-600">
              {(autoApprove * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.005}
            value={autoApprove}
            onChange={(e) => setAutoApprove(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <p className="text-xs text-muted-foreground">
            Fields above this confidence are automatically approved
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Review Threshold</Label>
            <span className="text-sm font-mono font-medium text-yellow-600">
              {(review * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={0.3}
            max={autoApprove - 0.01}
            step={0.005}
            value={review}
            onChange={(e) => setReview(Number(e.target.value))}
            className="w-full accent-yellow-600"
          />
          <p className="text-xs text-muted-foreground">
            Fields below this confidence are flagged as low-confidence (red)
          </p>
        </div>

        <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-green-600 font-medium">Auto-approve</span>
            <span>&ge; {(autoApprove * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-600 font-medium">Needs review</span>
            <span>{(review * 100).toFixed(1)}% – {(autoApprove * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600 font-medium">Flagged</span>
            <span>&lt; {(review * 100).toFixed(1)}%</span>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : saved ? (
            <><CheckCircle className="mr-2 h-4 w-4" />Saved</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />Save Thresholds</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

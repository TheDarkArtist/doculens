'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LearningLoopChart } from '@/components/analytics/learning-loop-chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type Overview = {
  totalProcessed: number
  byStatus: Record<string, number>
  avgProcessingTimeSec: number
  reviewQueueDepth: number
}

type Accuracy = {
  totalFields: number
  autoApproveRate: number
  correctionFrequency: number
}

type VolumePoint = { date: string; count: number }

const STATUS_COLORS: Record<string, string> = {
  complete: '#22c55e',
  needs_review: '#eab308',
  processing: '#3b82f6',
  queued: '#94a3b8',
  failed: '#ef4444',
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null)
  const [volume, setVolume] = useState<VolumePoint[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/analytics/overview').then((r) => r.json()),
      fetch('/api/v1/analytics/accuracy').then((r) => r.json()),
      fetch('/api/v1/analytics/volume').then((r) => r.json()),
    ]).then(([o, a, v]) => {
      setOverview(o.data)
      setAccuracy(a.data)
      setVolume(v.data ?? [])
    })
  }, [])

  if (!overview || !accuracy) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const statusData = Object.entries(overview.byStatus).map(
    ([name, value]) => ({ name, value })
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Documents" value={overview.totalProcessed} />
        <StatCard title="Review Queue" value={overview.reviewQueueDepth} />
        <StatCard
          title="Auto-Approve Rate"
          value={`${(accuracy.autoApproveRate * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Avg Processing"
          value={
            overview.avgProcessingTimeSec > 0
              ? `${overview.avgProcessingTimeSec.toFixed(1)}s`
              : 'N/A'
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Volume (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {volume.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={volume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(222.2, 47.4%, 11.2%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <LearningLoopChart />
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// Seeded data showing "improvement" over time
const data = [
  { week: 'W1', accuracy: 82, corrections: 45, autoApproveRate: 58 },
  { week: 'W2', accuracy: 85, corrections: 38, autoApproveRate: 63 },
  { week: 'W3', accuracy: 87, corrections: 31, autoApproveRate: 68 },
  { week: 'W4', accuracy: 89, corrections: 25, autoApproveRate: 72 },
  { week: 'W5', accuracy: 91, corrections: 20, autoApproveRate: 76 },
  { week: 'W6', accuracy: 93, corrections: 15, autoApproveRate: 81 },
  { week: 'W7', accuracy: 94, corrections: 12, autoApproveRate: 85 },
  { week: 'W8', accuracy: 95, corrections: 9, autoApproveRate: 88 },
]

export function LearningLoopChart() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Model Improvement</CardTitle>
          <Badge variant="secondary" className="text-[10px]">Simulated</Badge>
        </div>
        <CardDescription>
          Extraction accuracy improves as reviewer corrections are fed back into the model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" fontSize={12} />
            <YAxis fontSize={12} domain={[50, 100]} unit="%" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              name="Accuracy %"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="autoApproveRate"
              stroke="hsl(220, 70%, 50%)"
              strokeWidth={2}
              name="Auto-Approve Rate %"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="corrections"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              name="Manual Corrections"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

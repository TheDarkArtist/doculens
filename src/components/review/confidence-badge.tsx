import { cn } from '@/lib/utils'

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = (confidence * 100).toFixed(1)

  const colorClass =
    confidence >= 0.975
      ? 'bg-green-100 text-green-800'
      : confidence >= 0.8
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass
      )}
    >
      {pct}%
    </span>
  )
}

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const statusConfig = {
  queued: { label: 'Queued', className: 'bg-gray-100 text-gray-800 border-gray-200', pulse: true },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 border-blue-200', pulse: true },
  needs_review: { label: 'Needs Review', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', pulse: false },
  complete: { label: 'Complete', className: 'bg-green-100 text-green-800 border-green-200', pulse: false },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 border-red-200', pulse: false },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? {
    label: status,
    className: '',
    pulse: false,
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'gap-1.5')}
    >
      {config.pulse && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {config.label}
    </Badge>
  )
}

import { Badge } from '@/components/ui/badge'

export function Header({ role }: { role: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/50 px-6">
      <div />
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-normal">
          {role}
        </Badge>
      </div>
    </header>
  )
}

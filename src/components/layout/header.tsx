'use client'

import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/50 px-6">
      <div />
      <div className="flex items-center gap-3">
        {session?.user && (
          <Badge variant="outline" className="text-xs font-normal">
            {session.user.role}
          </Badge>
        )}
      </div>
    </header>
  )
}

'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
            <Badge variant="secondary">{session.user.role}</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

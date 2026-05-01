import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = new Set(['/', '/login'])

export const proxy = auth((req) => {
  if (!req.auth && !PUBLIC_PATHS.has(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin))
  }
})

export const config = {
  matcher: [
    '/((?!api/auth|api/inngest|api/v1|_next/static|_next/image|favicon.ico|login).*)',
  ],
}

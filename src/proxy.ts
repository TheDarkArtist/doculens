import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, readSessionUserId } from '@/lib/auth'
import { loginPath } from '@/lib/login-path'

const PUBLIC_PATHS = new Set(['/', '/login'])

export async function proxy(req: NextRequest) {
  const userId = await readSessionUserId(req.cookies.get(SESSION_COOKIE)?.value)
  if (!userId && !PUBLIC_PATHS.has(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(loginPath(req.nextUrl.pathname + req.nextUrl.search), req.nextUrl.origin))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|api/inngest|api/v1|_next/static|_next/image|favicon.ico|login).*)',
  ],
}

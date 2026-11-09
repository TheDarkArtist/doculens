import { sanitizeReturnTo } from '@tdacorp/identity-sdk/rp'

/** The route that starts sign-in. An unsafe return path is dropped, so the user lands on the default page. */
export function loginPath(returnTo?: string | null): string {
  const safe = sanitizeReturnTo(returnTo)
  return safe ? `/api/auth/login?returnTo=${encodeURIComponent(safe)}` : '/api/auth/login'
}

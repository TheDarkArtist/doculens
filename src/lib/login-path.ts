import { sanitizeReturnTo } from '@tdacorp/identity-sdk/rp'

/** The route that starts sign-in. An unsafe return path is dropped, so the user lands on the default page. */
export function loginPath(returnTo?: string | null): string {
  const safe = sanitizeReturnTo(returnTo)
  return safe ? `/api/auth/login?returnTo=${encodeURIComponent(safe)}` : '/api/auth/login'
}

/** Short-lived marker set at sign-out, so the login page shows "signed out" without changing the registered post-logout URI. */
export const SIGNED_OUT_COOKIE = 'signed_out'
export const signedOutCookie = (secure: boolean) =>
  `${SIGNED_OUT_COOKIE}=1; Path=/; Max-Age=60; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`

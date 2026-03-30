import { auth } from './auth'

export async function getSession() {
  return auth()
}

export async function getRequiredSession() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(
  allowedRoles: ('admin' | 'reviewer' | 'viewer')[]
) {
  const session = await getRequiredSession()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }
  return session
}

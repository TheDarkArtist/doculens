import { eq, lt } from 'drizzle-orm'
import { db } from '@/db'
import { revokedSessions } from '@/db/schema/revoked-sessions'

// Outlives any session (at most 5 minutes) with slack.
const REVOCATION_TTL_MS = 60 * 60 * 1000

export async function revokeSession(sid: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REVOCATION_TTL_MS)
  await db.insert(revokedSessions).values({ sid, expiresAt }).onConflictDoNothing()
  await db.delete(revokedSessions).where(lt(revokedSessions.expiresAt, new Date()))
}

export async function isSessionRevoked(sid: string): Promise<boolean> {
  const row = await db.query.revokedSessions.findFirst({ where: eq(revokedSessions.sid, sid) })
  return row !== undefined
}

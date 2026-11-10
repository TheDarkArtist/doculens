import { eq, lt } from 'drizzle-orm'
import { db } from '@/db'
import { revokedSessions, revokedSubjects } from '@/db/schema/revoked-sessions'

// Outlives any session (at most 5 minutes) with slack.
const REVOCATION_TTL_MS = 60 * 60 * 1000

export async function revokeSession(sid: string): Promise<void> {
  await db.insert(revokedSessions).values({ sid, expiresAt: new Date(Date.now() + REVOCATION_TTL_MS) }).onConflictDoNothing()
  await db.delete(revokedSessions).where(lt(revokedSessions.expiresAt, new Date()))
}

/** A logout token with no `sid`: every session of `sub` issued at or before `at` (epoch seconds) ends. */
export async function revokeSubject(sub: string, at: number): Promise<void> {
  const expiresAt = new Date(Date.now() + REVOCATION_TTL_MS)
  await db
    .insert(revokedSubjects)
    .values({ sub, revokedAt: at, expiresAt })
    .onConflictDoUpdate({
      target: revokedSubjects.sub,
      set: { revokedAt: at, expiresAt },
      // A later logout never moves the cut-off back.
      setWhere: lt(revokedSubjects.revokedAt, at),
    })
  await db.delete(revokedSubjects).where(lt(revokedSubjects.expiresAt, new Date()))
}

export const sessionEnded = (session: { iat: number }, sidRevoked: boolean, subjectRevokedAt: number | null): boolean =>
  sidRevoked || (subjectRevokedAt !== null && session.iat <= subjectRevokedAt)

export async function isSessionRevoked(session: { sid: string | null; isub: string; iat: number }): Promise<boolean> {
  const [bySid, bySub] = await Promise.all([
    session.sid ? db.query.revokedSessions.findFirst({ where: eq(revokedSessions.sid, session.sid) }) : undefined,
    db.query.revokedSubjects.findFirst({ where: eq(revokedSubjects.sub, session.isub) }),
  ])
  return sessionEnded(session, bySid !== undefined, bySub?.revokedAt ?? null)
}

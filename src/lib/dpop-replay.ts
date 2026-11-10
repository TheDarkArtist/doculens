import type { DpopReplayStore } from '@tdacorp/identity-sdk'
import { lt } from 'drizzle-orm'
import { db } from '@/db'
import { dpopJti } from '@/db/schema/dpop-jti'

// A proof is refused after a couple of minutes anyway; never keep a row longer than this whatever the caller asks.
const MAX_TTL_MS = 10 * 60 * 1000

// Atomic claim in Postgres, shared by every instance. A throw is a refusal to the caller (fails closed).
export const dpopReplayStore: DpopReplayStore = {
  async claim(jti, expiresAt, now) {
    const expires = new Date(Math.min(expiresAt.getTime(), now.getTime() + MAX_TTL_MS))
    // An expired row for the same jti is taken over; a live one makes the insert return nothing.
    const claimed = await db
      .insert(dpopJti)
      .values({ jti, expiresAt: expires })
      .onConflictDoUpdate({ target: dpopJti.jti, set: { expiresAt: expires }, setWhere: lt(dpopJti.expiresAt, now) })
      .returning({ jti: dpopJti.jti })
    await db.delete(dpopJti).where(lt(dpopJti.expiresAt, now))
    return claimed.length === 1
  },
}

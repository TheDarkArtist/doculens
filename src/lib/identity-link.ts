export interface LinkCandidate {
  id: string
  identitySubject: string | null
}

export interface IdentityClaims {
  sub: string
  email: string
  emailVerified: boolean
}

export type LinkDecision =
  | { action: 'use'; userId: string }
  | { action: 'link'; userId: string }
  | { action: 'reject' }

/**
 * Pure policy for mapping an identity login to a local user. `bySubject` is the row already
 * linked to the sub; `byEmail` are rows whose email matches the (case-insensitive) claim.
 * Linking by email requires a verified email and exactly one unlinked row; anything else is rejected.
 */
export function decideLink(
  claims: IdentityClaims,
  bySubject: LinkCandidate | undefined,
  byEmail: LinkCandidate[]
): LinkDecision {
  if (bySubject) return { action: 'use', userId: bySubject.id }
  if (!claims.emailVerified || byEmail.length !== 1) return { action: 'reject' }
  const [row] = byEmail
  if (row.identitySubject !== null) return { action: 'reject' }
  return { action: 'link', userId: row.id }
}

-- Expand (additive). DPoP proof ids already seen by the identity machine path (D9): a proof is single-use only if something remembers it.
CREATE TABLE IF NOT EXISTS dpop_jti (
  jti text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS dpop_jti_expires_at_idx ON dpop_jti (expires_at);

-- Contract (phase 6, Kush-applied, NEVER by the app or db:push). Run only after the release that reads
-- identity claims has run in production with no fallback. Drops the local principal, role and Auth.js tables
-- and the legacy FK columns; the sub and name snapshot columns from 0001 stay.
-- Remove the matching definitions from src/db/schema (users.ts, auth.ts, the three legacy columns, userRoleEnum) in the same change.

ALTER TABLE documents DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE extracted_fields DROP COLUMN IF EXISTS reviewed_by;

DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;

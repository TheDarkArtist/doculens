-- Contract (phase 6, Kush-applied, NEVER by the app or db:push). Run only after the release that reads
-- identity claims has run in production with no fallback. Drops the local principal, role and Auth.js tables
-- and the legacy FK columns; the sub and name snapshot columns from 0001 stay.
-- Remove the matching definitions from src/db/schema (users.ts, auth.ts, the three legacy columns, userRoleEnum) in the same change.

-- Rows the previous release inserted after 0001 have no sub yet: backfill again before NOT NULL (same as 0001).
UPDATE documents d SET uploaded_by_sub = COALESCE(u.identity_subject, 'legacy:' || u.id::text), uploaded_by_name = u.name
FROM users u WHERE d.uploaded_by = u.id AND d.uploaded_by_sub IS NULL;
UPDATE audit_logs a SET user_sub = COALESCE(u.identity_subject, 'legacy:' || u.id::text), user_name = u.name
FROM users u WHERE a.user_id = u.id AND a.user_sub IS NULL;
UPDATE extracted_fields f SET reviewed_by_sub = COALESCE(u.identity_subject, 'legacy:' || u.id::text), reviewed_by_name = u.name
FROM users u WHERE f.reviewed_by = u.id AND f.reviewed_by_sub IS NULL;

ALTER TABLE documents ALTER COLUMN uploaded_by_sub SET NOT NULL;
ALTER TABLE documents ALTER COLUMN uploaded_by_name SET NOT NULL;
ALTER TABLE documents DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE extracted_fields DROP COLUMN IF EXISTS reviewed_by;

DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS verification_tokens;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;

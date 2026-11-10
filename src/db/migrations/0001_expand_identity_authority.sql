-- Expand (additive, safe to run before the release that reads it). Identity becomes the only authority:
-- tenants map to an identity tenant, principals are referenced by identity sub with a name snapshot (O3),
-- and back-channel logout is recorded per identity session id.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS identity_tenant_id uuid UNIQUE;

CREATE TABLE IF NOT EXISTS revoked_sessions (
  sid text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by_sub text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by_name text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_sub text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE extracted_fields ADD COLUMN IF NOT EXISTS reviewed_by_sub text;
ALTER TABLE extracted_fields ADD COLUMN IF NOT EXISTS reviewed_by_name text;

-- Backfill from the local principal; a user never linked to identity keeps an opaque legacy reference.
UPDATE documents d SET
  uploaded_by_sub = COALESCE(u.identity_subject, 'legacy:' || u.id::text),
  uploaded_by_name = u.name
FROM users u WHERE d.uploaded_by = u.id AND d.uploaded_by_sub IS NULL;

UPDATE audit_logs a SET
  user_sub = COALESCE(u.identity_subject, 'legacy:' || u.id::text),
  user_name = u.name
FROM users u WHERE a.user_id = u.id AND a.user_sub IS NULL;

UPDATE extracted_fields f SET
  reviewed_by_sub = COALESCE(u.identity_subject, 'legacy:' || u.id::text),
  reviewed_by_name = u.name
FROM users u WHERE f.reviewed_by = u.id AND f.reviewed_by_sub IS NULL;

ALTER TABLE documents ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN uploaded_by_sub SET NOT NULL;
ALTER TABLE documents ALTER COLUMN uploaded_by_name SET NOT NULL;

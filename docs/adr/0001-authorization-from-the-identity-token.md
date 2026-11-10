# 0001. Authorization comes from the identity access token

## Status

Accepted, 2026-11-10 (owner plan `identity-authority-plan.md`, decisions D1 to D9). The repo had no ADR convention or CLAUDE.md;
this is the first. It supersedes the earlier local rules: roles in `users.role`, tenant from `users.tenant_id`, per-request user row reads, local user admin.

## Decision

1. **Identity is the only authority (D1, D3).** Sign-in verifies the access token locally (`verifyAccessToken`, issuer and audience = this client id),
   reads the `authz.tenant` codes (`src/lib/authz-claim.ts`, a local copy of identity-sdk 2.1.0 `canTenant`, byte-identical fixture test) and stores
   only doculens's codes plus `tid`, `sub`, `sid` in the sealed `doculens_session` cookie. Absent or malformed claim = no codes = no session.
2. **Codes are tenant-level** (`docs/doculens.identity-manifest.json`): `doculens.document.read` (every signed-in session needs it), `.review`
   (former "not viewer"), `doculens.admin` (former "admin"). Roles viewer, reviewer, admin are manifest roles bound by identity. Registering the manifest is Kush-only.
3. **Tenant binding (D5).** A doculens tenant row carries `identity_tenant_id`. Every request resolves the tenant by the session's `tid`
   and checks codes against that tenant's id, so a token of another tenant grants nothing. A token whose `tid` has no doculens tenant gets no session.
   doculens has no per-resource identity grants (documents are rows of the tenant), so D7 resource creation does not apply.
4. **Session (O2).** At most 300 s and never past the token `exp`. doculens does not request `offline_access`: when the session ends the visitor
   is sent through the silent identity sign-in again. Back-channel logout (`POST /api/auth/backchannel-logout`) records the `sid` in `revoked_sessions`
   (an event record with a 1 h expiry, deleted opportunistically); `auth()` refuses a revoked `sid`. A logout token with no `sid` records its `sub` and the token `iat` in `revoked_subjects`; `auth()` refuses sessions of that ID-token `sub` issued at or before it.
5. **Members (D6).** The local user admin (`/api/v1/users`, settings panel) is removed. Membership is managed in identity. No members screen is built here
   because that needs a DPoP-bound `tdaid.members` token and a renew route, which doculens does not have; a later slice can add one.
6. **Principals are `sub` text (D8, O3).** `documents.uploaded_by_sub/_name`, `audit_logs.user_sub/_name`, `extracted_fields.reviewed_by_sub/_name`
   are write-time snapshots. Migration `0001` (expand) adds and backfills them; they stay nullable there because the previous release still inserts without them, and `contract/0002` adds NOT NULL. The `users`, Auth.js tables and legacy FK columns stay in the Drizzle schema
   until `contract/0002_contract_drop_local_principals.sql` (phase 6, Kush-applied, never by `db:push`) is applied; remove the schema definitions in that change.

## Machine credentials (phase 5, unchanged)

`api_keys` (bcrypt, `x-api-key`, `src/lib/api-auth.ts`) keep working for `POST/GET /api/v1/documents`; the actor recorded is `apikey:<id>`.
Keys are created by a session with `doculens.admin` and are accepted for the tenant of the key. Lookup is by the indexed non-secret `key_prefix` (first 11 characters; keys made before it are tried once and get the prefix on first use), then one bcrypt compare. The `scopes` column is enforced: `documents:read` for `GET`, `documents:write` for `POST`; a key never holds `doculens.admin`.

## Surfaces by code

Upload URL and `POST /api/v1/documents` need `doculens.document.review`. API keys, webhooks, audit (page, list, CSV export) need `doculens.admin`.

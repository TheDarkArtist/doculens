import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mock, test } from 'node:test'
import { calculateJwkThumbprint, createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createMemoryDpopReplayStore, createResourceServer } from '@tdacorp/identity-sdk'
import { CODES } from './authz-claim'

process.env.DATABASE_URL ??= 'postgres://u@localhost:5432/x'

const ISSUER = 'https://id.test'
const AUDIENCE = 'doculens-client'
const ORIGIN = 'https://doculens.test'
const TID = '0190a000-0000-7000-8000-000000000001'

const env = { DOCULENS_MACHINE_IDENTITY_TOKENS: 'off' as string, OIDC_ISSUER: undefined, OIDC_CLIENT_ID: undefined, APP_ORIGIN: undefined }
mock.module(new URL('./env.ts', import.meta.url).href, { namedExports: { env } })
mock.module(new URL('./auth.ts', import.meta.url).href, { namedExports: { auth: async () => null } })
let tenantFor: string | null = TID
mock.module(new URL('../db/index.ts', import.meta.url).href, {
  namedExports: { db: { query: { tenants: { findFirst: async () => (tenantFor ? { id: 'tenant-row', identityTenantId: tenantFor } : undefined) } } } },
})

// CommonJS test output has no top-level await, so keys are made once on first use.
let keys: ReturnType<typeof makeKeys> | undefined
async function makeKeys() {
  const signer = await generateKeyPair('ES256')
  const holder = await generateKeyPair('ES256')
  const holderJwk = await exportJWK(holder.publicKey)
  const jkt = await calculateJwkThumbprint(holderJwk)
  const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(signer.publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' }] })
  return { signer, holder, holderJwk, jkt, jwks }
}
const server = async () =>
  createResourceServer({ issuer: ISSUER, audience: AUDIENCE, publicOrigin: ORIGIN, replay: createMemoryDpopReplayStore(), requireConfirmation: true, refuseActorTokens: true, jwks: (await (keys ??= makeKeys())).jwks })

async function request(claims: Record<string, unknown> = {}, opts: { htu?: string; scheme?: string; proof?: boolean } = {}) {
  const { signer, holder, holderJwk, jkt } = await (keys ??= makeKeys())
  const now = Math.floor(Date.now() / 1000)
  const token = await new SignJWT({ tid: TID, kind: 'service', authz: { v: 1, res: {}, tenant: [CODES.read, CODES.review] }, cnf: { jkt }, client_id: 'svc', scope: 'openid', ...claims })
    .setProtectedHeader({ alg: 'ES256', kid: 'k1', typ: 'at+jwt' })
    .setIssuer(ISSUER).setAudience(AUDIENCE).setSubject('svc-sub').setJti(randomUUID()).setIssuedAt(now).setExpirationTime(now + 300)
    .sign(signer.privateKey)
  const headers: Record<string, string> = { authorization: `${opts.scheme ?? 'DPoP'} ${token}` }
  if (opts.proof !== false) {
    headers.dpop = await new SignJWT({ htm: 'GET', htu: opts.htu ?? `${ORIGIN}/api/v1/documents`, ath: createHash('sha256').update(token).digest('base64url') })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: holderJwk })
      .setJti(randomUUID()).setIssuedAt(now).sign(holder.privateKey)
  }
  return new Request(`${ORIGIN}/api/v1/documents`, { headers })
}

const api = () => import('./api-auth')

test('a DPoP-bound exchanged token maps to the tenant row and its codes', async () => {
  const result = await (await api()).authenticateMachineToken(await request(), await server())
  assert.equal(result?.tenantId, 'tenant-row')
  assert.equal(result?.actor.id, 'svc-sub')
  assert.equal(result?.can(CODES.review), true)
  assert.equal(result?.can(CODES.admin), false)
})

test('refuses: no proof, Bearer label, wrong htu, replayed proof, actor token', async () => {
  const s = await server()
  assert.equal(await (await api()).authenticateMachineToken(await request({}, { proof: false }), s), null)
  assert.equal(await (await api()).authenticateMachineToken(await request({}, { scheme: 'Bearer' }), s), null)
  assert.equal(await (await api()).authenticateMachineToken(await request({}, { htu: `${ORIGIN}/other` }), s), null)
  assert.equal(await (await api()).authenticateMachineToken(await request({ act: { sub: 'someone' } }), s), null)
  const replayed = await request()
  assert.notEqual(await (await api()).authenticateMachineToken(replayed.clone(), s), null)
  assert.equal(await (await api()).authenticateMachineToken(replayed, s), null)
})

test('refuses: absent or malformed authz, no tenant row for the tid, no doculens code', async () => {
  const s = await server()
  assert.equal(await (await api()).authenticateMachineToken(await request({ authz: undefined }), s), null)
  assert.equal(await (await api()).authenticateMachineToken(await request({ authz: { tenant: 'doculens.document.read' } }), s), null)
  assert.equal(await (await api()).authenticateMachineToken(await request({ authz: { v: 1, res: {}, tenant: ['other.code'] } }), s), null)
  tenantFor = null
  assert.equal(await (await api()).authenticateMachineToken(await request(), s), null)
  tenantFor = TID
})

test('off ignores identity tokens without building a verifier; identity refuses dl_ keys', async () => {
  env.DOCULENS_MACHINE_IDENTITY_TOKENS = 'off'
  assert.equal(await (await api()).authenticateRequest(await request()), null) // would throw on missing OIDC env if the verifier were built
  env.DOCULENS_MACHINE_IDENTITY_TOKENS = 'identity'
  assert.equal(await (await api()).authenticateRequest(new Request(`${ORIGIN}/x`, { headers: { 'x-api-key': 'dl_abc' } })), null)
})

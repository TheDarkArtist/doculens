import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { CODES, can, canTenant, grantedCodes, sessionCan } from './authz-claim'

// Byte-identical copy of identity's packages/sdk/src/__tests__/fixtures/authz-claim.json (an hyle-namespaced token).
const fixture = JSON.parse(readFileSync(new URL('./fixtures/authz-claim.json', import.meta.url), 'utf8')) as Record<string, unknown>
const tid = fixture.tid as string
const ref = 'hyle:workspace:0190a1b2-0000-7000-8000-00000000c001'

test('can reads a resource code in the right tenant', () => {
  assert.equal(can(fixture, 'hyle.document.write', { tid, resource: ref }), true)
  assert.equal(can(fixture, 'hyle.workspace.manage', { tid, resource: ref }), false)
  assert.equal(can(fixture, 'hyle.document.read', { tid, resource: 'hyle:workspace:other' }), false)
  assert.equal(can(fixture, 'hyle.document.read', { tid: 'another-tenant', resource: ref }), false)
})

test('canTenant reads the tenant list and denies another tid', () => {
  assert.equal(canTenant(fixture, 'hyle.workspace.create', { tid }), true)
  assert.equal(canTenant(fixture, 'hyle.workspace.create', { tid: 'another-tenant' }), false)
})

test('absent or malformed authz denies', () => {
  for (const authz of [undefined, null, 'x', [], {}, { tenant: 'doculens.admin' }, { tenant: [1] }]) {
    assert.equal(canTenant({ tid, authz }, 'doculens.admin', { tid }), false)
    assert.deepEqual(grantedCodes({ tid, authz }), [])
  }
  assert.deepEqual(grantedCodes({ authz: { tenant: [CODES.read] } }), [])
})

test('grantedCodes keeps only doculens codes', () => {
  const claims = { tid, authz: { v: 1, res: {}, tenant: [CODES.read, CODES.review, 'hyle.workspace.create'] } }
  assert.deepEqual(grantedCodes(claims), [CODES.read, CODES.review])
})

test('each former role check is driven by the stored codes and the request tenant', () => {
  const viewer = { tid, codes: [CODES.read] }
  const reviewer = { tid, codes: [CODES.read, CODES.review] }
  const admin = { tid, codes: [CODES.read, CODES.review, CODES.admin] }
  assert.deepEqual([viewer, reviewer, admin].map((s) => sessionCan(s, CODES.review, tid)), [false, true, true])
  assert.deepEqual([viewer, reviewer, admin].map((s) => sessionCan(s, CODES.admin, tid)), [false, false, true])
  assert.equal(sessionCan(admin, CODES.read, 'another-tenant'), false)
  assert.equal(sessionCan(admin, CODES.read, null), false)
})

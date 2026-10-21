import test from 'node:test'
import assert from 'node:assert/strict'
import { decideLink } from './identity-link'

const claims = { sub: 's1', email: 'a@x.com', emailVerified: true }

test('uses the row already linked to the subject', () => {
  assert.deepEqual(decideLink({ ...claims, emailVerified: false }, { id: 'u1', identitySubject: 's1' }, []), {
    action: 'use',
    userId: 'u1',
  })
})

test('links an unlinked row by verified email', () => {
  assert.deepEqual(decideLink(claims, undefined, [{ id: 'u2', identitySubject: null }]), {
    action: 'link',
    userId: 'u2',
  })
})

test('rejects unverified email, ambiguous email, and rows linked to another subject', () => {
  const free = { id: 'u2', identitySubject: null }
  assert.equal(decideLink({ ...claims, emailVerified: false }, undefined, [free]).action, 'reject')
  assert.equal(decideLink(claims, undefined, [free, { ...free, id: 'u3' }]).action, 'reject')
  assert.equal(decideLink(claims, undefined, [{ id: 'u4', identitySubject: 'other' }]).action, 'reject')
  assert.equal(decideLink(claims, undefined, []).action, 'reject')
})

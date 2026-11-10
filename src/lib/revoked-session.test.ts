import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://u@localhost:5432/x'
const load = () => import('./revoked-session')

test('a revoked sid ends the session', async () => {
  const { sessionEnded } = await load()
  assert.equal(sessionEnded({ iat: 100 }, true, null), true)
})

test('a subject logout ends sessions issued at or before it, not later ones', async () => {
  const { sessionEnded } = await load()
  assert.equal(sessionEnded({ iat: 100 }, false, 100), true)
  assert.equal(sessionEnded({ iat: 99 }, false, 100), true)
  assert.equal(sessionEnded({ iat: 101 }, false, 100), false)
  assert.equal(sessionEnded({ iat: 101 }, false, null), false)
})

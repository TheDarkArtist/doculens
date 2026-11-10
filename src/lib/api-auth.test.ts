import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://u@localhost:5432/x'

test('key prefix is the non-secret head of a dl_ key', async () => {
  const { keyPrefix } = await import('./api-auth')
  assert.equal(keyPrefix('dl_0123456789abcdef0123456789abcdef0123456789abcdef'), 'dl_01234567')
})

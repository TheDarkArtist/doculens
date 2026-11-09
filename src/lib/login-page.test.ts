import { test } from 'node:test'
import assert from 'node:assert/strict'
import LoginPage from '../app/(auth)/login/page'

test('stays put on a failed sign-in, so a refusal cannot loop', async () => {
  assert.ok(await LoginPage({ searchParams: Promise.resolve({ error: '1' }) }))
})

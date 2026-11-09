import { test } from 'node:test'
import assert from 'node:assert/strict'
import LoginPage from '../app/(auth)/login/page'

const visit = (params: Record<string, string>) => LoginPage({ searchParams: Promise.resolve(params) })

test('redirects to the sign-in route when there is nothing to show', async () => {
  await assert.rejects(visit({ returnTo: '/documents' }), (e: { digest?: string }) => !!e.digest?.includes('/api/auth/login?returnTo=%2Fdocuments'))
})

test('stays put on a failed sign-in or a sign-out, so a refusal cannot loop', async () => {
  assert.ok(await visit({ error: '1' }))
  assert.ok(await visit({ signedout: '1' }))
})

import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://u@localhost:5432/x'

const env = { SUPABASE_URL: 'https://sb.test', SUPABASE_SERVICE_KEY: 'service-secret', S3_BUCKET: 'docs' }
mock.module(new URL('./env.ts', import.meta.url).href, { namedExports: { env } })

test('a Supabase upload URL is signed server side and carries no secret to the client', async () => {
  const calls: { url: string; auth: string | null }[] = []
  mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, auth: new Headers(init.headers).get('authorization') })
    return Response.json({ url: '/object/upload/sign/docs/t1/d1/a.pdf?token=tok' })
  })
  const { getPresignedUploadUrl } = await import('./storage')
  const result = await getPresignedUploadUrl('t1/d1/a.pdf', 'application/pdf')
  assert.equal(calls[0].url, 'https://sb.test/storage/v1/object/upload/sign/docs/t1/d1/a.pdf')
  assert.equal(calls[0].auth, 'Bearer service-secret')
  assert.equal(result.url, 'https://sb.test/storage/v1/object/upload/sign/docs/t1/d1/a.pdf?token=tok')
  assert.ok(!JSON.stringify(result).includes('service-secret'))
  assert.ok(!('headers' in result))
})

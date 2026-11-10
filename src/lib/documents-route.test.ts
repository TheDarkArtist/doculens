import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

process.env.DATABASE_URL ??= 'postgres://u@localhost:5432/x'

mock.module(new URL('./api-auth.ts', import.meta.url).href, {
  namedExports: { authenticateRequest: async () => ({ actor: { id: 'a', name: 'a' }, tenantId: 't1', can: () => true }) },
})
mock.module(new URL('../features/documents/document.service.ts', import.meta.url).href, {
  namedExports: { createDocument: async () => ({ success: true, data: { id: 'doc' } }) },
})

const post = async (storageKey: string) => {
  const { POST } = await import('@/app/api/v1/documents/route')
  const body = JSON.stringify({ storageKey, filename: 'a.pdf', mimeType: 'application/pdf', fileSize: 1 })
  return POST(new Request('http://x/api/v1/documents', { method: 'POST', body }) as never)
}

test('only storage keys under the caller tenant prefix are ingested', async () => {
  assert.equal((await post('t1/d1/a.pdf')).status, 201)
  assert.equal((await post('t2/d1/a.pdf')).status, 400)
  assert.equal((await post('t1/../t2/d1/a.pdf')).status, 400)
  assert.equal((await post('t10/d1/a.pdf')).status, 400)
})

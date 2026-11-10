import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { CODES } from './authz-claim'

process.env.DATABASE_URL ??= 'postgres://u@localhost:5432/x'

let granted: string[] = []
const session = () => ({
  can: (code: string) => granted.includes(code),
  user: { id: 'sub-1', name: 'N', email: 'e@x', tenantId: 't1' },
})
const authUrl = new URL('./auth.ts', import.meta.url).href
mock.module(authUrl, { namedExports: { auth: async () => session() } })

const req = (url: string, init?: RequestInit) => new Request(`http://x${url}`, init) as never
const routes = async (p: string) => import(new URL(`../app/api/v1/${p}/route.ts`, import.meta.url).href)

test('read-only sessions are refused where review or admin is needed', async () => {
  granted = [CODES.read]
  const post = { method: 'POST', body: '{}' }
  assert.equal((await (await routes('documents/upload-url')).POST(req('/', post))).status, 403)
  assert.equal((await (await routes('documents')).POST(req('/', post))).status, 403)
  assert.equal((await (await routes('api-keys')).GET()).status, 403)
  assert.equal((await (await routes('webhooks')).GET()).status, 403)
  assert.equal((await (await routes('audit')).GET(req('/'))).status, 403)
  assert.equal((await (await routes('audit/export')).GET()).status, 403)
})

test('a reviewer without admin still cannot read admin surfaces', async () => {
  granted = [CODES.read, CODES.review]
  assert.equal((await (await routes('api-keys')).GET()).status, 403)
  assert.equal((await (await routes('audit')).GET(req('/'))).status, 403)
})

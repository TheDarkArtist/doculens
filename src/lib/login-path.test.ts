import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loginPath, signedOutCookie } from './login-path'

test('carries a same-origin relative path, query included', () => {
  assert.equal(loginPath('/documents?page=2'), '/api/auth/login?returnTo=%2Fdocuments%3Fpage%3D2')
})

test('drops an unsafe or missing return path', () => {
  for (const value of [undefined, null, '', '//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', 'documents', '/a\nb']) {
    assert.equal(loginPath(value), '/api/auth/login', String(value))
  }
})

test('signed-out marker is a 60 second cookie, Secure only on https', () => {
  assert.equal(signedOutCookie(false), 'signed_out=1; Path=/; Max-Age=60; HttpOnly; SameSite=Lax')
  assert.match(signedOutCookie(true), /; Secure$/)
})

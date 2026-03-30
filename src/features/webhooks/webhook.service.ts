import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { webhooks } from '@/db/schema/webhooks'
import { createHmac } from 'crypto'

export async function deliverWebhooks(
  tenantId: string,
  event: string,
  payload: Record<string, unknown>
) {
  const hooks = await db.query.webhooks.findMany({
    where: eq(webhooks.tenantId, tenantId),
  })

  const matching = hooks.filter(
    (h) => h.active && h.events.includes(event)
  )

  const results = await Promise.allSettled(
    matching.map((hook) => deliverSingle(hook, event, payload))
  )

  const delivered = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  if (failed > 0) {
    console.warn(
      `[webhooks] ${delivered} delivered, ${failed} failed for ${event}`
    )
  }
}

async function deliverSingle(
  hook: { url: string; secret: string | null },
  event: string,
  payload: Record<string, unknown>
) {
  const body = JSON.stringify({ event, data: payload, timestamp: Date.now() })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-DocuLens-Event': event,
  }

  if (hook.secret) {
    const sig = createHmac('sha256', hook.secret).update(body).digest('hex')
    headers['X-DocuLens-Signature'] = sig
  }

  const res = await fetch(hook.url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Webhook delivery failed: ${res.status} ${res.statusText}`)
  }
}

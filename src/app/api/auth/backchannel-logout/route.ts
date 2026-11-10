import { authRoutes } from '@/lib/identity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called by identity server to server; authenticated by the logout token's signature, verified by the SDK.
export const POST = (req: Request): Promise<Response> => authRoutes().backchannelLogout(req)

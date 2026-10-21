import { authRoutes } from '@/lib/identity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = (req: Request): Promise<Response> => authRoutes().logout(req)

import { authRoutes } from '@/lib/identity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = (req: Request): Promise<Response> => authRoutes().login(req)

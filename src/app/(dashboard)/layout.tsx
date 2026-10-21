import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { RealtimeListener } from '@/components/documents/realtime-listener'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  const { user } = session

  return (
    <div className="flex h-screen">
      <RealtimeListener tenantId={user.tenantId} />
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header role={user.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

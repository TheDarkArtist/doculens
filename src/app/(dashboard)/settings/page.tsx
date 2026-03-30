import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTenantById } from '@/features/tenants/tenant.repository'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ThresholdEditor } from '@/components/settings/threshold-editor'
import { UserManagement } from '@/components/settings/user-management'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenant = await getTenantById(session.user.tenantId)
  if (!tenant) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Organization settings and user management
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <code className="rounded bg-muted px-2 py-0.5 text-xs">{tenant.slug}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <ThresholdEditor initial={tenant.settings} />
        </div>

        <div className="space-y-6">
          <UserManagement />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SSO / SAML</CardTitle>
              <CardDescription>Enterprise single sign-on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Available on the Enterprise plan. Contact sales for setup.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Webhooks</CardTitle>
              <CardDescription>Event notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure webhook URLs and events. Coming soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

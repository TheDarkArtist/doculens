import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTenantById } from '@/features/tenants/tenant.repository'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenant = await getTenantById(session.user.tenantId)
  if (!tenant) redirect('/login')

  const settings = tenant.settings

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <code className="rounded bg-muted px-2 py-0.5 text-xs">
                {tenant.slug}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confidence Thresholds</CardTitle>
            <CardDescription>
              Controls automatic approval routing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-Approve</span>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  &ge; {(settings.auto_approve_threshold * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Review Required</span>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">
                  {(settings.review_threshold * 100).toFixed(1)}% &ndash;{' '}
                  {(settings.auto_approve_threshold * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Flagged</span>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">
                  &lt; {(settings.review_threshold * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SSO / SAML</CardTitle>
            <CardDescription>Enterprise single sign-on</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              SSO configuration is available on the Enterprise plan.
              Contact sales for setup.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhooks</CardTitle>
            <CardDescription>
              Event notifications to external systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure webhook URLs and events. Coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

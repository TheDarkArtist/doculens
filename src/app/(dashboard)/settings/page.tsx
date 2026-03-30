import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTenantById } from '@/features/tenants/tenant.repository'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThresholdEditor } from '@/components/settings/threshold-editor'
import { UserManagement } from '@/components/settings/user-management'
import { ApiKeyManagement } from '@/components/settings/api-key-management'
import { WebhookConfig } from '@/components/settings/webhook-config'
import { DataRetention } from '@/components/settings/data-retention'
import { Mail } from 'lucide-react'

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
          Organization settings and integrations
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

          <DataRetention />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">SSO / SAML</CardTitle>
                <Badge variant="secondary" className="text-[10px]">Enterprise</Badge>
              </div>
              <CardDescription>Enterprise single sign-on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span>Not configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protocol</span>
                  <span>SAML 2.0 / OIDC</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact your account manager to enable SSO for your organization.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <UserManagement />
          <ApiKeyManagement />
          <WebhookConfig />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Ingestion</CardTitle>
              <CardDescription>Process documents via email</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/email-ingestion">
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Configure Email Ingestion
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

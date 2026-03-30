import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTenantById } from '@/features/tenants/tenant.repository'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Zap, FileText, Copy, ArrowLeft, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function EmailIngestionPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const tenant = await getTenantById(session.user.tenantId)
  const slug = tenant?.slug ?? 'default'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Ingestion</h1>
          <p className="text-muted-foreground mt-1">
            Forward documents to a dedicated email address for automatic processing
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">How It Works</CardTitle>
              <Badge variant="secondary">Beta</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Mail, title: '1. Forward Email', desc: 'Send documents as attachments to your dedicated inbox' },
                { icon: Zap, title: '2. Auto-Process', desc: 'AI pipeline classifies and extracts fields automatically' },
                { icon: FileText, title: '3. Review', desc: 'Results appear in the review queue like any upload' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-medium">Your ingestion address:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-background border px-4 py-2.5 text-sm font-mono">
                  docs+{slug}@doculens.tdacorp.in
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                All emails sent to this address will be processed automatically.
                The sender's email is logged in the audit trail.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PDF</span>
                <Badge className="bg-green-100 text-green-800 text-[10px]">Supported</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PNG / JPG</span>
                <Badge className="bg-green-100 text-green-800 text-[10px]">Supported</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DOCX</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">Coming Soon</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max size</span>
                <span>10 MB per attachment</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                <span>Attachments are encrypted at rest in S3</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                <span>Email body is discarded — only attachments are kept</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <span>Subject to your data retention policy</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

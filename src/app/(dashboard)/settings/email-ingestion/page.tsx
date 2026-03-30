import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, ArrowRight, FileText, Zap } from 'lucide-react'

export default function EmailIngestionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Ingestion</h1>
        <p className="text-muted-foreground mt-1">
          Forward documents to a dedicated email address for automatic processing
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">How It Works</CardTitle>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Mail, title: 'Forward Email', desc: 'Send documents as attachments to your dedicated inbox address' },
              { icon: Zap, title: 'Auto-Process', desc: 'Attachments are extracted and sent through the AI pipeline automatically' },
              { icon: FileText, title: 'Review Results', desc: 'Extracted fields appear in the review queue like any other upload' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Your ingestion address will be:</p>
            <code className="block rounded bg-background border px-4 py-2 text-sm font-mono">
              docs-tdacorp@ingest.doculens.dev
            </code>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, PNG, JPG. Max attachment size: 10MB.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Email ingestion is available on the Business plan. Contact your account manager to enable this feature.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

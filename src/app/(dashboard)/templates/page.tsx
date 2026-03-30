import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listTemplates } from '@/features/templates/template.repository'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, Plus, Lock, Shield } from 'lucide-react'

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const templates = await listTemplates(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extraction Templates</h1>
          <p className="text-muted-foreground mt-1">
            Schema-driven extraction for any document type
          </p>
        </div>
        {session.user.role === 'admin' && (
          <Link href="/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const sensitiveCount = template.schema.fields.filter((f) => f.sensitive).length
          const requiredCount = template.schema.fields.filter((f) => f.required).length

          return (
            <Link key={template.id} href={`/templates/${template.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isSystem && (
                      <Badge variant="secondary" className="text-[10px]">System</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {template.schema.fields.length} fields
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" />
                      {requiredCount} required
                    </span>
                    {sensitiveCount > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Shield className="h-3.5 w-3.5" />
                        {sensitiveCount} PII
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listTemplates } from '@/features/templates/template.repository'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layers } from 'lucide-react'

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const templates = await listTemplates(session.user.tenantId)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Extraction Templates</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.isSystem && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>{template.schema.fields.length} fields</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

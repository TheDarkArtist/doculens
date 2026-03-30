import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getTemplateById } from '@/features/templates/template.repository'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

const typeLabels: Record<string, string> = {
  string: 'Text', number: 'Number', date: 'Date',
  currency: 'Currency', boolean: 'Boolean', array: 'List',
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const template = await getTemplateById(session.user.tenantId, id)
  if (!template) notFound()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          {template.isSystem && <Badge variant="secondary">System</Badge>}
        </div>
        <p className="text-muted-foreground mt-1">{template.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Field Schema ({template.schema.fields.length} fields)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Field Name</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium text-center">Required</th>
                  <th className="pb-3 font-medium text-center">Sensitive</th>
                </tr>
              </thead>
              <tbody>
                {template.schema.fields.map((field) => (
                  <tr key={field.name} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{field.name}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {typeLabels[field.type] ?? field.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{field.description}</td>
                    <td className="py-3 text-center">
                      {field.required && <Badge className="bg-blue-100 text-blue-800 text-[10px]">Yes</Badge>}
                    </td>
                    <td className="py-3 text-center">
                      {field.sensitive && (
                        <Shield className="mx-auto h-4 w-4 text-yellow-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {template.schema.validation_rules && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validation Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono">
              {JSON.stringify(template.schema.validation_rules, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

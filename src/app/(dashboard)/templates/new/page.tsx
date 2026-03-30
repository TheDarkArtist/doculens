import { TemplateEditor } from '@/components/templates/template-editor'

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Create Template
      </h1>
      <TemplateEditor />
    </div>
  )
}

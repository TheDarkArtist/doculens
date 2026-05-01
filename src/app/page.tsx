import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  BookOpen,
  Upload,
  Layers,
  Brain,
  ShieldCheck,
  Workflow,
  CheckCircle2,
  Search,
  FileSearch,
  ScrollText,
  Eye,
  Shield,
  ClipboardCheck,
  Zap,
} from 'lucide-react'

const PIPELINE_STAGES = [
  { name: 'Ingest', icon: Upload, blurb: 'PDF text layer + Gemini vision OCR fallback' },
  { name: 'Classify', icon: Layers, blurb: 'Auto-detect document type via LLM' },
  { name: 'Extract', icon: Brain, blurb: 'Structured output with inline confidence' },
  { name: 'Enrich', icon: Workflow, blurb: 'Embeddings + tsvector for hybrid search' },
  { name: 'Validate', icon: ShieldCheck, blurb: 'Business rules + threshold routing' },
  { name: 'Complete', icon: CheckCircle2, blurb: 'Auto-approve or queue for review' },
]

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Human-in-the-loop review',
    body: 'Side-by-side PDF viewer with editable extracted fields, click-to-highlight source mapping, and a per-field confidence badge.',
  },
  {
    icon: Search,
    title: 'Hybrid RAG search',
    body: 'pgvector semantic + PostgreSQL full-text combined with Reciprocal Rank Fusion. Natural language queries across every extracted field.',
  },
  {
    icon: ScrollText,
    title: 'Compliance-grade audit trail',
    body: 'Every classification, extraction, correction, approval and rejection is logged with before/after values. Exportable as CSV.',
  },
  {
    icon: Zap,
    title: 'Serverless durable pipeline',
    body: 'Inngest step functions on Vercel — per-step retry, no Redis, no long-lived workers, real-time status via Pusher.',
  },
]

const TECH = [
  'Next.js 16',
  'TypeScript',
  'Inngest',
  'PostgreSQL',
  'pgvector',
  'Drizzle ORM',
  'Auth.js v5',
  'Gemini 2.5 Flash',
  'OpenAI gpt-4o-mini',
  'Pusher',
  'Tailwind v4',
  'shadcn/ui',
  'Cloudflare R2',
]

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    icon: Shield,
    description: 'Templates, settings, users, full system access',
  },
  {
    role: 'Reviewer',
    icon: ClipboardCheck,
    description: 'Review queue, correct fields, approve documents',
  },
  {
    role: 'Viewer',
    icon: Eye,
    description: 'Read-only access across the platform',
  },
] as const

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              DL
            </div>
            <span className="text-base font-semibold tracking-tight">DocuLens</span>
            <span className="text-sm text-muted-foreground">AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background"
        />
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 font-mono text-xs">
              Portfolio build · TDACorp
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Document intelligence
              <br />
              <span className="text-muted-foreground">that actually ships.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Upload an invoice, an ID, a medical record. DocuLens AI classifies,
              extracts, scores confidence, and routes auto-approve vs human review —
              with a full audit trail. Built on a serverless durable pipeline, deployed at zero cost.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Try the demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#pipeline">
                <Button size="lg" variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  How it works
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No signup. Pre-seeded demo tenant with 13 documents across 3 templates.
            </p>
          </div>
        </div>
      </section>

      <section id="pipeline" className="border-b py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Six stages, one event-driven pipeline.</h2>
            <p className="mt-3 text-muted-foreground">
              Each stage is a durable Inngest step. If extraction fails, only extraction retries —
              not the whole pipeline. Real-time status streams to the dashboard via Pusher.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon
              return (
                <div
                  key={stage.name}
                  className="group relative overflow-hidden rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="absolute right-4 top-4 font-mono text-xs text-muted-foreground/60">
                    0{i + 1}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-base font-semibold">{stage.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{stage.blurb}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Built for serious document work.</h2>
            <p className="mt-3 text-muted-foreground">
              The features that distinguish a real doc-intel system from an LLM wrapper.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-xl border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-semibold">{f.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Stack.</h2>
              <p className="mt-3 text-muted-foreground">
                One Next.js monolith. No Python services, no Redis, no long-lived workers.
                Deployed on Vercel free tier with Neon, Cloudflare R2, Pusher and Inngest.
                Total cost: $0/month.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {TECH.map((t) => (
                  <Badge key={t} variant="secondary" className="font-mono text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6 font-mono text-xs">
              <div className="text-muted-foreground">// pipeline as durable steps</div>
              <pre className="mt-3 overflow-x-auto leading-relaxed text-foreground">
{`inngest.createFunction(
  { id: 'process-document' },
  { event: 'document/uploaded' },
  async ({ event, step }) => {
    const doc        = await step.run('load',     loadDoc)
    const normalized = await step.run('ingest',   () => ingest(doc))
    const classified = await step.run('classify', () => classify(normalized))
    await step.run('extract',  () => extract(classified))
    await step.run('enrich',   () => enrich(doc.id))
    const v          = await step.run('validate', () => validate(doc.id))
    await step.run('complete', () => complete(v))
  }
)`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Three demo roles. One click in.</h2>
            <p className="mt-3 text-muted-foreground">
              The login page has one-click sign-in for each role. Same tenant, same data,
              different permissions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((a) => {
              const Icon = a.icon
              return (
                <Link
                  key={a.role}
                  href="/login"
                  className="group rounded-xl border bg-card p-6 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-semibold">{a.role}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Try as {a.role}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div>
            Built by{' '}
            <Link
              href="https://tdacorp.in"
              target="_blank"
              className="font-medium text-foreground hover:underline"
            >
              TDACorp
            </Link>
            . Proprietary.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Demo
            </Link>
            <a href="#pipeline" className="hover:text-foreground">
              How it works
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

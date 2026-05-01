'use client'

import { useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Shield, ClipboardCheck, Eye } from 'lucide-react'

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@tdacorp.demo',
    password: 'demo1234',
    icon: Shield,
    description: 'Full access — templates, settings, users',
  },
  {
    role: 'Reviewer',
    email: 'reviewer@tdacorp.demo',
    password: 'demo1234',
    icon: ClipboardCheck,
    description: 'Review queue, correct fields, approve docs',
  },
  {
    role: 'Viewer',
    email: 'viewer@tdacorp.demo',
    password: 'demo1234',
    icon: Eye,
    description: 'Read-only access to all documents',
  },
] as const

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    if (emailRef.current) emailRef.current.value = account.email
    if (passwordRef.current) passwordRef.current.value = account.password
  }

  async function loginAs(account: (typeof DEMO_ACCOUNTS)[number]) {
    fillDemo(account)
    setError(null)
    setLoading(true)
    const result = await signIn('credentials', {
      email: account.email,
      password: account.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) setError('Demo account unavailable. Try the manual form.')
    else router.push('/dashboard')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          DL
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight">DocuLens</span>
          <span className="text-sm text-muted-foreground ml-1">AI</span>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-in">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                ref={emailRef}
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                autoFocus
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or try the demo
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => loginAs(account)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 rounded-lg border bg-background hover:bg-accent hover:border-primary/40 px-3 py-2.5 text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      Continue as {account.role}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {account.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Enterprise document intelligence by TDACorp
      </p>
    </div>
  )
}

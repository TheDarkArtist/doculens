import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SIGNED_OUT_COOKIE, loginPath } from '@/lib/login-path'

// Only a failed sign-in or a sign-out stays here. Anything else goes straight to identity, so a signed-in user never sees a card.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>
}) {
  const { error, returnTo } = await searchParams
  const signedOut = !error && (await cookies()).has(SIGNED_OUT_COOKIE)
  if (!error && !signedOut) redirect(loginPath(returnTo))

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
          <CardTitle className="text-xl">{error ? 'Sign-in failed' : 'Signed out'}</CardTitle>
          <CardDescription>{error ? 'Try again with your TDACorp identity.' : 'You have signed out of DocuLens.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              Sign-in failed. Your identity may not be linked to a DocuLens account.
            </div>
          )}
          <Button asChild className="w-full h-11">
            <a href={loginPath()}>{error ? 'Try again' : 'Sign in with TDACorp'}</a>
          </Button>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Enterprise document intelligence by TDACorp
      </p>
    </div>
  )
}

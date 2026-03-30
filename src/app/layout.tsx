import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DocuLens AI',
  description:
    'Enterprise document intelligence platform — extract, validate, and route structured data from any document using AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextTopLoader color="hsl(220, 70%, 50%)" height={2} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

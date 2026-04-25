import type { Metadata } from 'next'
import { DM_Sans, Fraunces, Space_Mono } from 'next/font/google'
import { Providers } from './providers'
import { TRPCProvider } from './trpc-provider'
import { CookieBanner } from '@/components/ui/CookieBanner'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'ForeverPic — Galleria Foto per Eventi',
  description: 'Condividi foto agli eventi via QR code. Galleria in tempo reale, reazioni e download facili.',
  keywords: ['condivisione foto', 'galleria eventi', 'QR code', 'foto in tempo reale'],
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://foreverpic-beta.vercel.app',
    siteName: 'ForeverPic',
    title: 'ForeverPic — Galleria Foto per Eventi',
    description: 'Condividi foto agli eventi via QR code. Galleria in tempo reale, reazioni e download facili.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForeverPic — Galleria Foto per Eventi',
    description: 'Condividi foto agli eventi via QR code. Galleria in tempo reale, reazioni e download facili.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-cream-100 font-sans antialiased" suppressHydrationWarning>
        <Providers>
          <TRPCProvider>{children}</TRPCProvider>
        </Providers>
        <CookieBanner />
      </body>
    </html>
  )
}
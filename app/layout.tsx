import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'MERC Dashboard | Liquid Mercury',
  description: 'Professional internal monitoring dashboard for MERC token metrics, markets, and staking across Ethereum and Base chains',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'MERC Dashboard',
    description: 'Professional internal monitoring dashboard for MERC token metrics, markets, and staking across Ethereum and Base chains',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MERC Dashboard',
    description: 'Professional internal monitoring dashboard for MERC token',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-body antialiased`}>
        <Sidebar />
        <main className="ml-64 min-h-screen page-background">
          {children}
        </main>
      </body>
    </html>
  )
}

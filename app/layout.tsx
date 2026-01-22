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
  description: 'Professional internal monitoring dashboard for MERC token metrics, markets, and holder analytics across Ethereum and Base chains',
  metadataBase: new URL('https://merctokendashboard.vercel.app'),
  openGraph: {
    title: 'MERC Dashboard | Liquid Mercury',
    description: 'Professional internal monitoring dashboard for MERC token metrics, markets, and holder analytics',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MERC Dashboard Preview',
      },
    ],
    type: 'website',
    siteName: 'MERC Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MERC Dashboard | Liquid Mercury',
    description: 'Professional internal monitoring dashboard for MERC token metrics, markets, and holder analytics',
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


import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat'
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
      <body className={`${montserrat.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

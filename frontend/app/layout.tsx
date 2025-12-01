import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PL Capital - Lead Generation Engine',
  description: 'Automated lead generation and outreach for Partners, HNIs, UHNIs & Mass Affluent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

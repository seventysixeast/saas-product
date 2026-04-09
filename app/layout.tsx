import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SaaS Starter — Next.js + Supabase + Stripe',
  description: 'A production-ready SaaS starter with auth, subscriptions, and billing.',
  keywords: ['SaaS', 'Next.js', 'Supabase', 'Stripe'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  )
}

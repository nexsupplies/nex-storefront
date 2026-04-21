import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import Navbar from '@/components/Navbar'

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NEX Supplies',
  description: 'Industrial supplies storefront',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pt-28 font-sans lg:pt-16">
        <Navbar />
        {children}
      </body>
    </html>
  )
}

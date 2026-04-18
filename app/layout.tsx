import Navbar from '@/components/Navbar'
import { SpeedInsights } from '@vercel/speed-insights/next';

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEX Supplies",
  description: "Industrial supplies storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body 
      className="min-h-full flex flex-col pt-28 lg:pt-16">
        <Navbar />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { getOrCreateCart } from '@/lib/cart'
import PageFrame from '@/components/PageFrame'

export default function Home() {
  useEffect(() => {
    getOrCreateCart().catch(console.error)
  }, [])

  return (
    <PageFrame
      sidebar={
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            NEX Supplies
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 lg:text-5xl">
            Industrial materials, structured for fast quoting and ordering.
          </h1>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="max-w-3xl">
          <p className="text-lg leading-8 text-gray-700">
            Browse sheet materials, build mixed-variant carts, and move from quote
            requests to checkout in one consistent purchasing flow.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/products"
            className="block rounded-[12px] bg-black px-5 py-4 text-center text-sm font-medium text-white"
          >
            Browse Materials
          </Link>
          <Link
            href="/quote-list"
            className="block rounded-[12px] border border-black/30 px-5 py-4 text-center text-sm font-medium text-gray-900"
          >
            Open Quote List
          </Link>
        </div>
      </div>
    </PageFrame>
  )
}

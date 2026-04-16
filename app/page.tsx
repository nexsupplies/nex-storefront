'use client'

import { useEffect } from 'react'
import { getOrCreateCart } from '@/lib/cart'

export default function Home() {
  useEffect(() => {
    getOrCreateCart().catch(console.error)
  }, [])

  return (
    <main className="p-10">
      <h1 className="text-5xl font-bold">NEX Supplies</h1>
    </main>
  )
}
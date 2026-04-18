'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageFrame from '@/components/PageFrame'

type QuoteItem = {
  productId: string
  productTitle: string
  productHandle: string
  variantId: string
  variantTitle: string
  quantity: number
}

export default function QuoteListPage() {
  const [quoteList, setQuoteList] = useState<QuoteItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const existing = localStorage.getItem('quote-list')
    return existing ? JSON.parse(existing) : []
  })

  function updateQuantity(variantId: string, nextQuantity: number) {
    const updated = quoteList.map((item) =>
      item.variantId === variantId
        ? { ...item, quantity: Math.max(1, nextQuantity) }
        : item
    )

    setQuoteList(updated)
    localStorage.setItem('quote-list', JSON.stringify(updated))
  }

  function removeItem(variantId: string) {
    const updated = quoteList.filter((item) => item.variantId !== variantId)
    setQuoteList(updated)
    localStorage.setItem('quote-list', JSON.stringify(updated))
  }

  return (
    <PageFrame
      sidebar={
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            Quote List
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Collect multiple products here, then submit one consolidated quote request.
          </h1>
        </div>
      }
    >
      {quoteList.length === 0 ? (
        <div className="space-y-4">
          <p>Your quote list is empty.</p>
          <Link
            href="/products"
            className="inline-block rounded-[12px] bg-black px-5 py-3 text-white"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {quoteList.map((item) => (
              <div
                key={item.variantId}
                className="flex flex-col gap-4 rounded-[12px] border border-black/30 bg-white p-5"
              >
                <div>
                  <Link
                    href={`/products/${item.productHandle}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.variantTitle}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                      className="rounded-[10px] border border-black/30 px-3 py-2"
                    >
                      -
                    </button>

                    <div className="min-w-8 text-center">{item.quantity}</div>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      className="rounded-[10px] border border-black/30 px-3 py-2"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[12px] border border-black/30 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Quote Summary</h2>

            <p className="mb-6 text-sm text-gray-600">
              You can collect multiple products here, then submit one quote request.
            </p>

            <Link
              href="/quote"
              className="block w-full rounded-[12px] bg-black py-3 text-center text-white"
            >
              Continue to Quote
            </Link>
          </aside>
        </div>
      )}
    </PageFrame>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'

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
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Quote List</h1>

      {quoteList.length === 0 ? (
        <div className="space-y-4">
          <p>Your quote list is empty.</p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-5 py-3 rounded-lg"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            {quoteList.map((item) => (
              <div
                key={item.variantId}
                className="border rounded-2xl p-5 flex flex-col gap-4"
              >
                <div>
                  <Link
                    href={`/products/${item.productHandle}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
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
                      className="border rounded-lg px-3 py-2"
                    >
                      -
                    </button>

                    <div className="min-w-8 text-center">{item.quantity}</div>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      className="border rounded-lg px-3 py-2"
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

          <aside className="border rounded-2xl p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Quote Summary</h2>

            <p className="text-sm text-gray-600 mb-6">
              You can collect multiple products here, then submit one quote request.
            </p>

            <Link
              href="/quote"
              className="block w-full text-center bg-black text-white py-3 rounded-lg"
            >
              Continue to Quote
            </Link>
          </aside>
        </div>
      )}
    </main>
  )
}

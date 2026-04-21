'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageFrame from '@/components/PageFrame'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'

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
        <PageIntro
          label="Quote List"
          title="Collect multiple products here, then submit one consolidated quote request."
        />
      }
    >
      {quoteList.length === 0 ? (
        <div className="space-y-4">
          <Text variant="bodyMd">Your quote list is empty.</Text>
          <Link
            href="/products"
            className="type-button-text inline-block rounded-[12px] bg-black px-5 py-3 text-white"
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
                    className="hover:underline"
                  >
                    <Text as="span" variant="h4CardTitle">
                      {item.productTitle}
                    </Text>
                  </Link>
                  <Text variant="caption" className="mt-1">
                    {item.variantTitle}
                  </Text>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                      className="type-button-text rounded-[10px] border border-black/30 px-3 py-2"
                    >
                      -
                    </button>

                    <Text as="div" variant="bodyMd" className="min-w-8 text-center font-semibold text-black">
                      {item.quantity}
                    </Text>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      className="type-button-text rounded-[10px] border border-black/30 px-3 py-2"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="type-button-text text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[12px] border border-black/30 bg-white p-6">
            <Text as="h2" variant="h2Section" className="mb-4">
              Quote Summary
            </Text>

            <Text variant="bodySm" className="mb-6">
              You can collect multiple products here, then submit one quote request.
            </Text>

            <Link
              href="/quote"
              className="type-button-text block w-full rounded-[12px] bg-black py-3 text-center text-white"
            >
              Continue to Quote
            </Link>
          </aside>
        </div>
      )}
    </PageFrame>
  )
}

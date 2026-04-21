'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
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
          <Button href="/products" variant="primary">
            Browse Products
          </Button>
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
                    <Button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                      variant="secondary"
                      kind="icon"
                      icon={<span aria-hidden="true">-</span>}
                      aria-label={`Decrease quantity for ${item.productTitle}`}
                      className="rounded-[10px]"
                    />

                    <Text as="div" variant="bodyMd" className="min-w-8 text-center font-semibold text-black">
                      {item.quantity}
                    </Text>

                    <Button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      variant="secondary"
                      kind="icon"
                      icon={<span aria-hidden="true">+</span>}
                      aria-label={`Increase quantity for ${item.productTitle}`}
                      className="rounded-[10px]"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    variant="tertiary"
                    className="text-red-600 hover:!text-red-600"
                  >
                    Remove
                  </Button>
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

            <Button href="/quote" variant="primary" fullWidth>
              Continue to Quote
            </Button>
          </aside>
        </div>
      )}
    </PageFrame>
  )
}

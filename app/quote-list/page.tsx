'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageFrame from '@/components/PageFrame'
import SupportSidebar from '@/components/SupportSidebar'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'

type QuoteItem = {
  productId: string
  productTitle: string
  productHandle: string
  variantId: string
  variantTitle: string
  quantity: number
}

const quoteSidebarItems = [
  {
    key: 'quotes',
    title: 'Quote Workflow',
    content:
      'Use Quote List when a project needs multiple materials, mixed quantities, or a consolidated request for internal review.',
  },
  {
    key: 'shipping',
    title: 'Shipping',
    content:
      'Freight-sensitive or oversized sheet orders can be collected here first, then reviewed before transport costs are finalized.',
  },
  {
    key: 'response',
    title: 'Response Time',
    content:
      'Quote requests are prepared after the list is submitted. Keep quantities accurate so pricing and lead-time guidance stay aligned.',
  },
] as const

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

  const totalItems = quoteList.reduce((total, item) => total + item.quantity, 0)

  return (
    <PageFrame
      mergeContent
      sidebar={<SupportSidebar title="Quote" items={[...quoteSidebarItems]} />}
    >
      {quoteList.length === 0 ? (
        <div className="space-y-10">
          <div className="max-w-2xl border-b border-black/30 pb-8">
            <Text variant="label">Quote Intake</Text>
            <Text as="h2" variant="h2Section" className="mt-3">
              Your quote list is currently empty.
            </Text>
            <Text variant="bodyLg" className="mt-4 max-w-xl text-black/68">
              Add products from the catalogue to prepare a consolidated request for
              review.
            </Text>
          </div>

          <Button href="/products" variant="primary">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <header className="grid gap-8 border-b border-black/30 pb-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:items-end">
            <div className="max-w-2xl">
              <Text variant="label">Consolidated Request</Text>
              <Text as="h2" variant="h2Section" className="mt-3">
                Collect multiple materials here, then submit one clean quote request.
              </Text>
            </div>

            <div className="grid grid-cols-2 gap-6 lg:justify-self-end">
              <div>
                <Text variant="caption">Variants Selected</Text>
                <Text as="div" variant="price" className="mt-2">
                  {quoteList.length}
                </Text>
              </div>

              <div>
                <Text variant="caption">Total Items</Text>
                <Text as="div" variant="price" className="mt-2">
                  {totalItems}
                </Text>
              </div>
            </div>
          </header>

          <div className="hidden border-b border-black/30 pb-3 lg:grid lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_128px_auto] lg:gap-6">
            <Text variant="caption">Material</Text>
            <Text variant="caption">Variant</Text>
            <Text variant="caption">Quantity</Text>
            <Text variant="caption" className="text-right">
              Actions
            </Text>
          </div>

          <div>
            {quoteList.map((item) => (
              <article
                key={item.variantId}
                className="grid gap-6 border-b border-black/30 py-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_128px_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <Link href={`/products/${item.productHandle}`} className="inline-block">
                    <Text
                      as="span"
                      variant="h4CardTitle"
                      className="transition-opacity hover:opacity-60"
                    >
                      {item.productTitle}
                    </Text>
                  </Link>
                </div>

                <div>
                  <Text variant="caption" className="lg:hidden">
                    Variant
                  </Text>
                  <Text variant="bodyMd" className="mt-1 text-black/72 lg:mt-0">
                    {item.variantTitle}
                  </Text>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    variant="secondary"
                    kind="icon"
                    icon={<span aria-hidden="true">−</span>}
                    aria-label={`Decrease quantity for ${item.productTitle}`}
                  />

                  <Text
                    as="div"
                    variant="bodyMd"
                    className="min-w-8 text-center font-semibold text-black"
                  >
                    {item.quantity}
                  </Text>

                  <Button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    variant="secondary"
                    kind="icon"
                    icon={<span aria-hidden="true">+</span>}
                    aria-label={`Increase quantity for ${item.productTitle}`}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    variant="tertiary"
                    className="text-red-600 hover:!text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <section className="grid gap-8 border-t border-black/30 pt-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-start">
            <div className="max-w-xl">
              <Text as="h3" variant="h4CardTitle">
                Quote Summary
              </Text>
              <Text variant="bodyMd" className="mt-3 text-black/68">
                Submit the current list as one consolidated request. Product
                quantities stay editable here until you continue.
              </Text>
            </div>

            <div className="space-y-4 lg:justify-self-end lg:min-w-[320px]">
              <div className="flex items-center justify-between gap-6">
                <Text as="span" variant="muted">
                  Variants
                </Text>
                <Text as="span" variant="bodyMd" className="font-semibold text-black">
                  {quoteList.length}
                </Text>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-black/30 pt-4">
                <Text as="span" variant="h4CardTitle">
                  Total Items
                </Text>
                <Text as="span" variant="bodyMd" className="font-semibold text-black">
                  {totalItems}
                </Text>
              </div>

              <Button href="/quote" variant="primary" fullWidth>
                Continue to Quote
              </Button>
            </div>
          </section>
        </div>
      )}
    </PageFrame>
  )
}

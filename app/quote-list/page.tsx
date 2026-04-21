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
        <div className="space-y-8">
          <div className="max-w-2xl pb-4">
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
        <div className="space-y-8">
          <header className="max-w-2xl pb-2">
            <Text as="h2" variant="h2Section">
              Quote Items
            </Text>
          </header>

          <div className="hidden pb-2 lg:grid lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.15fr)_128px_40px] lg:gap-6">
            <Text variant="caption">Material</Text>
            <Text variant="caption">Variant</Text>
            <Text variant="caption">Quantity</Text>
          </div>

          <div>
            {quoteList.map((item) => (
              <article
                key={item.variantId}
                className="grid gap-5 py-5 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.15fr)_128px_40px] lg:items-center"
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

                <div className="flex items-center justify-start lg:justify-end">
                  <Button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    variant="tertiary"
                    kind="icon"
                    icon={<span aria-hidden="true">×</span>}
                    aria-label={`Remove ${item.productTitle} from quote list`}
                    className="text-red-600 hover:!text-red-600"
                  />
                </div>
              </article>
            ))}
          </div>

          <section className="grid gap-8 border-t border-black/30 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-start">
            <div />
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

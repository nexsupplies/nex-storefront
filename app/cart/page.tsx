'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PageFrame from '@/components/PageFrame'
import SupportSidebar from '@/components/SupportSidebar'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import {
  deleteLineItem,
  getOrCreateCart,
  retrieveCart,
  updateLineItem,
} from '@/lib/cart'

type CartLineItem = {
  id: string
  title: string
  quantity: number
  unit_price?: number
  subtotal?: number
  thumbnail?: string | null
  variant_title?: string | null
  product_title?: string | null
  product_handle?: string | null
}

type MedusaCart = {
  id: string
  items: CartLineItem[]
  subtotal?: number
  total?: number
  currency_code?: string
}

function formatPrice(amount?: number, currencyCode = 'CAD') {
  if (amount == null) return 'Price unavailable'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function getLineTotal(item: CartLineItem) {
  if (typeof item.subtotal === 'number') return item.subtotal
  if (typeof item.unit_price === 'number') return item.unit_price * item.quantity
  return undefined
}

const cartSidebarItems = [
  {
    key: 'summary',
    title: 'Cart Summary',
    content:
      'Checkout will collect customer details, shipping information, and the final payment step. Delivery-specific charges are confirmed there.',
  },
  {
    key: 'cart-review',
    title: 'Cart Review',
    content:
      'Use this page to confirm material selection, compare line totals, and adjust quantities before moving into checkout.',
  },
  {
    key: 'shipping',
    title: 'Shipping',
    content:
      'Freight and delivery handling are finalized during checkout. Larger sheet orders may require a shipping quote before payment.',
  },
  {
    key: 'quote',
    title: 'Quote Support',
    content:
      'If this order needs mixed materials, project coordination, or custom handling, move the selection into Quote List before submitting.',
  },
] as const

export default function CartPage() {
  const [cart, setCart] = useState<MedusaCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadCart() {
    try {
      setLoading(true)
      const cartId = await getOrCreateCart()
      const data = await retrieveCart(cartId)
      setCart(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load cart.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  async function handleDecrease(item: CartLineItem) {
    if (!cart) return

    try {
      const nextQuantity = Math.max(1, item.quantity - 1)
      const updatedCart = await updateLineItem(cart.id, item.id, nextQuantity)
      setCart(updatedCart)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update item.')
    }
  }

  async function handleIncrease(item: CartLineItem) {
    if (!cart) return

    try {
      const updatedCart = await updateLineItem(cart.id, item.id, item.quantity + 1)
      setCart(updatedCart)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update item.')
    }
  }

  async function handleRemove(item: CartLineItem) {
    if (!cart) return

    try {
      const updatedCart = await deleteLineItem(cart.id, item.id)
      setCart(updatedCart)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to remove item.')
    }
  }

  const currencyCode = useMemo(() => {
    return cart?.currency_code?.toUpperCase() || 'CAD'
  }, [cart])

  const items = cart?.items || []

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  )

  if (loading) {
    return (
      <PageFrame
        mergeContent
        sidebar={
          <SupportSidebar
            title="Cart"
            items={[...cartSidebarItems]}
            defaultOpenKey="summary"
          />
        }
      >
        <Text variant="bodyMd">Loading cart...</Text>
      </PageFrame>
    )
  }

  return (
    <PageFrame
      mergeContent
      sidebar={
        <SupportSidebar
          title="Cart"
          items={[...cartSidebarItems]}
          defaultOpenKey="summary"
        />
      }
    >
      {message && (
        <div className="mb-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
          <Text variant="bodySm" className="text-red-700">
          {message}
          </Text>
        </div>
      )}

      {items.length === 0 ? (
        <div className="space-y-8">
          <div className="max-w-2xl pb-4">
            <Text as="h2" variant="h2Section" className="mt-3">
              Your cart is currently empty.
            </Text>
            <Text variant="bodyLg" className="mt-4 max-w-xl text-black/68">
              Add products from the materials catalogue to start building an order
              for checkout.
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
              Cart Items
            </Text>
          </header>

          <div className="hidden pb-2 lg:grid lg:grid-cols-[minmax(0,2.2fr)_128px_140px_140px_40px] lg:gap-6">
            <Text variant="caption">Material</Text>
            <Text variant="caption">Quantity</Text>
            <Text variant="caption">Unit Price</Text>
            <Text variant="caption">Line Total</Text>
          </div>

          <div>
            {items.map((item) => (
              <article
                key={item.id}
                className="grid gap-5 py-5 lg:grid-cols-[minmax(0,2.2fr)_128px_140px_140px_40px] lg:items-center"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#f3f3f3]">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.product_title || item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Text variant="caption" className="px-3 text-center">
                        No image
                      </Text>
                    )}
                  </div>

                  <div className="min-w-0">
                    {item.product_handle ? (
                      <Link href={`/products/${item.product_handle}`} className="inline-block">
                        <Text
                          as="span"
                          variant="h4CardTitle"
                          className="transition-opacity hover:opacity-60"
                        >
                          {item.product_title || item.title}
                        </Text>
                      </Link>
                    ) : (
                      <Text as="div" variant="h4CardTitle">
                        {item.product_title || item.title}
                      </Text>
                    )}

                    <Text variant="bodySm" className="mt-2 text-black/68">
                      {item.variant_title || 'Default variant'}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => handleDecrease(item)}
                    variant="secondary"
                    kind="icon"
                    icon={<span aria-hidden="true">−</span>}
                    aria-label={`Decrease quantity for ${item.product_title || item.title}`}
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
                    onClick={() => handleIncrease(item)}
                    variant="secondary"
                    kind="icon"
                    icon={<span aria-hidden="true">+</span>}
                    aria-label={`Increase quantity for ${item.product_title || item.title}`}
                  />
                </div>

                <div>
                  <Text variant="caption" className="lg:hidden">
                    Unit Price
                  </Text>
                  <Text variant="bodyMd" className="mt-1 font-semibold text-black lg:mt-0">
                    {formatPrice(item.unit_price, currencyCode)}
                  </Text>
                </div>

                <div>
                  <Text variant="caption" className="lg:hidden">
                    Line Total
                  </Text>
                  <Text variant="bodyMd" className="mt-1 font-semibold text-black lg:mt-0">
                    {formatPrice(getLineTotal(item), currencyCode)}
                  </Text>
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                  <Button
                    type="button"
                    onClick={() => handleRemove(item)}
                    variant="tertiary"
                    kind="icon"
                    icon={<span aria-hidden="true">×</span>}
                    aria-label={`Remove ${item.product_title || item.title} from cart`}
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
                  Items
                </Text>
                <Text as="span" variant="bodyMd" className="font-semibold text-black">
                  {itemCount}
                </Text>
              </div>

              <div className="flex items-center justify-between gap-6">
                <Text as="span" variant="muted">
                  Subtotal
                </Text>
                <Text as="span" variant="bodyMd" className="font-semibold text-black">
                  {formatPrice(cart?.subtotal, currencyCode)}
                </Text>
              </div>

              <div className="flex items-center justify-between gap-6 border-t border-black/30 pt-4">
                <Text as="span" variant="h4CardTitle">
                  Total
                </Text>
                <Text as="span" variant="bodyMd" className="font-semibold text-black">
                  {formatPrice(cart?.total, currencyCode)}
                </Text>
              </div>

              <Button href="/checkout" variant="primary" fullWidth>
                Go to Checkout
              </Button>
            </div>
          </section>
        </div>
      )}
    </PageFrame>
  )
}

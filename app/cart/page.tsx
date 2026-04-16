'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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

  if (loading) {
    return (
      <main className="p-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cart</h1>
        <p>Loading cart...</p>
      </main>
    )
  }

  const items = cart?.items || []

  return (
    <main className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Cart</h1>

      {message && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {items.length === 0 ? (
        <div className="space-y-4">
          <p>Your cart is empty.</p>
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
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-5 flex flex-col gap-4"
              >
                <div>
                  <div className="text-lg font-semibold">
                    {item.product_title || item.title}
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {item.variant_title || 'Default variant'}
                  </p>

                  <p className="mt-2 font-medium">
                    Unit Price: {formatPrice(item.unit_price, currencyCode)}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Line Total: {formatPrice(item.subtotal, currencyCode)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDecrease(item)}
                      className="border rounded-lg px-3 py-2"
                    >
                      -
                    </button>

                    <div className="min-w-8 text-center">{item.quantity}</div>

                    <button
                      type="button"
                      onClick={() => handleIncrease(item)}
                      className="border rounded-lg px-3 py-2"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="border rounded-2xl p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>

            <div className="flex items-center justify-between mb-3">
              <span>Subtotal</span>
              <span>{formatPrice(cart?.subtotal, currencyCode)}</span>
            </div>

            <div className="flex items-center justify-between mb-6 font-semibold">
              <span>Total</span>
              <span>{formatPrice(cart?.total, currencyCode)}</span>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-black text-white py-3 rounded-lg"
            >
              Go to Checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  )
}
'use client'

import { useMemo, useState } from 'react'
import { addLineItem, getOrCreateCart } from '@/lib/cart'

type Variant = {
  id: string
  title: string
  calculated_price?: {
    calculated_amount?: number
    currency_code?: string
  } | null
}

type Product = {
  id: string
  title: string
  handle: string
}

type QuoteItem = {
  productId: string
  productTitle: string
  productHandle: string
  variantId: string
  variantTitle: string
  quantity: number
}

function formatPrice(amount?: number, currencyCode?: string) {
  if (amount == null || !currencyCode) return 'Price unavailable'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

export default function ProductActions({
  product,
  variants,
}: {
  product: Product
  variants: Variant[]
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ''
  )
  const [quantity, setQuantity] = useState<number>(1)
  const [message, setMessage] = useState<string>('')

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId),
    [variants, selectedVariantId]
  )

  async function addToCart() {
    if (!selectedVariant) {
      setMessage('Please select a variant.')
      return
    }

    try {
      const cartId = await getOrCreateCart()
      await addLineItem(cartId, selectedVariant.id, quantity)
      setMessage('Added to cart.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Failed to add to cart.'
      )
    }
  }

  function addToQuoteList() {
    if (!selectedVariant) {
      setMessage('Please select a variant.')
      return
    }

    const existing = localStorage.getItem('quote-list')
    const quoteList: QuoteItem[] = existing ? JSON.parse(existing) : []

    const existingItem = quoteList.find(
      (item) => item.variantId === selectedVariant.id
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      quoteList.push({
        productId: product.id,
        productTitle: product.title,
        productHandle: product.handle,
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        quantity,
      })
    }

    localStorage.setItem('quote-list', JSON.stringify(quoteList))
    setMessage('Added to quote list.')
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="font-semibold mb-3">Select Variant</h2>
        <div className="space-y-2">
          {variants.map((variant) => {
            const isSelected = variant.id === selectedVariantId

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={`w-full border rounded-lg px-4 py-3 text-left transition ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <div className="font-medium">{variant.title}</div>
                <div
                  className={`text-sm ${
                    isSelected ? 'text-gray-200' : 'text-gray-500'
                  }`}
                >
                  {formatPrice(
                    variant.calculated_price?.calculated_amount,
                    variant.calculated_price?.currency_code
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Quantity</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="border rounded-lg px-4 py-2"
          >
            -
          </button>

          <div className="min-w-10 text-center">{quantity}</div>

          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="border rounded-lg px-4 py-2"
          >
            +
          </button>
        </div>
      </div>

      {selectedVariant && (
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Selected</div>
          <div className="font-medium">{selectedVariant.title}</div>
          <div className="text-lg font-semibold mt-1">
            {formatPrice(
              selectedVariant.calculated_price?.calculated_amount,
              selectedVariant.calculated_price?.currency_code
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={addToCart}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          Add to Cart
        </button>

        <button
          type="button"
          onClick={addToQuoteList}
          className="w-full border py-3 rounded-lg"
        >
          Add to Quote List
        </button>
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  )
}

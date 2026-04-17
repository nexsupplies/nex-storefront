'use client'

import { useMemo, useState } from 'react'
import { addLineItem, getOrCreateCart } from '@/lib/cart'
import {
  formatPrice,
  getVariantUnitAmount,
  type ProductVariant,
} from '@/lib/catalog'

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

type OrderRow = {
  variant: ProductVariant
  quantity: number
  unitAmount: number | null
  currencyCode: string
  lineTotal: number | null
}

function buildInitialQuantities(variants: ProductVariant[]) {
  return variants.reduce<Record<string, number>>((acc, variant) => {
    acc[variant.id] = 0
    return acc
  }, {})
}

export default function ProductActions({
  product,
  variants,
}: {
  product: Product
  variants: ProductVariant[]
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => buildInitialQuantities(variants)
  )
  const [message, setMessage] = useState<string>('')

  const orderRows = useMemo<OrderRow[]>(
    () =>
      variants.map((variant) => {
        const quantity = quantities[variant.id] ?? 0
        const unitAmount = getVariantUnitAmount(variant)
        const currencyCode = variant.calculated_price?.currency_code || 'CAD'

        return {
          variant,
          quantity,
          unitAmount,
          currencyCode,
          lineTotal: unitAmount != null ? unitAmount * quantity : null,
        }
      }),
    [quantities, variants]
  )

  const totalItems = useMemo(
    () => orderRows.reduce((sum, row) => sum + row.quantity, 0),
    [orderRows]
  )
  const subtotal = useMemo(
    () => orderRows.reduce((sum, row) => sum + (row.lineTotal || 0), 0),
    [orderRows]
  )
  const summaryCurrency = useMemo(
    () =>
      orderRows.find((row) => row.variant.calculated_price?.currency_code)
        ?.variant.calculated_price?.currency_code || 'CAD',
    [orderRows]
  )
  const selectedRows = useMemo(
    () => orderRows.filter((row) => row.quantity > 0),
    [orderRows]
  )

  function updateQuantity(variantId: string, nextQuantity: number) {
    setQuantities((current) => ({
      ...current,
      [variantId]: Math.max(0, nextQuantity),
    }))
  }

  function resetQuantities() {
    setQuantities(buildInitialQuantities(variants))
  }

  async function addToCart() {
    if (!selectedRows.length) {
      setMessage('Add quantity to at least one variant.')
      return
    }

    try {
      const cartId = await getOrCreateCart()

      for (const row of selectedRows) {
        await addLineItem(cartId, row.variant.id, row.quantity)
      }

      resetQuantities()
      setMessage(
        `Added ${totalItems} item${totalItems === 1 ? '' : 's'} across ${selectedRows.length} variant${selectedRows.length === 1 ? '' : 's'} to cart.`
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Failed to add to cart.'
      )
    }
  }

  function addToQuoteList() {
    if (!selectedRows.length) {
      setMessage('Add quantity to at least one variant.')
      return
    }

    const existing = localStorage.getItem('quote-list')
    const quoteList: QuoteItem[] = existing ? JSON.parse(existing) : []

    for (const row of selectedRows) {
      const existingItem = quoteList.find(
        (item) => item.variantId === row.variant.id
      )

      if (existingItem) {
        existingItem.quantity += row.quantity
      } else {
        quoteList.push({
          productId: product.id,
          productTitle: product.title,
          productHandle: product.handle,
          variantId: row.variant.id,
          variantTitle: row.variant.title,
          quantity: row.quantity,
        })
      }
    }

    localStorage.setItem('quote-list', JSON.stringify(quoteList))
    resetQuantities()
    setMessage(
      `Added ${totalItems} item${totalItems === 1 ? '' : 's'} to quote list.`
    )
  }

  return (
    <>
      <section className="min-w-0 border-l border-black/50 py-8 lg:min-h-[calc(100vh-4rem)] lg:px-8 lg:py-10">
        <div>
          <h2 className="text-2xl font-semibold">Order Matrix</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            Build a mixed order by adjusting quantities directly in the matrix.
            Each row stays visible as part of one unified materials schedule.
          </p>
        </div>

        <div className="mt-6">
          {variants.length === 0 ? (
            <div className="text-sm text-gray-600">
              No orderable variants are available for this material yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="border-b border-black/50 text-left text-xs uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    <th className="px-4 py-4 font-medium lg:px-5">Variant</th>
                    <th className="px-4 py-4 font-medium lg:px-5">Quantity</th>
                    <th className="px-4 py-4 font-medium lg:px-5">Price</th>
                    <th className="px-4 py-4 text-right font-medium lg:px-5">
                      Variant Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/50">
                  {orderRows.map((row) => (
                    <tr key={row.variant.id}>
                      <td className="px-4 py-5 lg:px-5">
                        <div className="font-medium text-gray-900">
                          {row.variant.title}
                        </div>
                      </td>
                      <td className="px-4 py-5 lg:px-5">
                        <div className="inline-flex items-center gap-3 rounded-[12px] border border-black/50 bg-white px-3 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(row.variant.id, row.quantity - 1)
                            }
                            className="rounded-md px-2 py-1 text-lg leading-none"
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-sm font-medium">
                            {row.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(row.variant.id, row.quantity + 1)
                            }
                            className="rounded-md px-2 py-1 text-lg leading-none"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm text-gray-700 lg:px-5">
                        {formatPrice(row.unitAmount, row.currencyCode)}
                      </td>
                      <td className="px-4 py-5 text-right text-sm font-medium text-gray-900 lg:px-5">
                        {row.unitAmount == null
                          ? 'Price unavailable'
                          : formatPrice(row.lineTotal, row.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 flex flex-col justify-start py-8 lg:min-h-[calc(100vh-4rem)] lg:pl-8 lg:pr-16 lg:py-10">
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Total Items</span>
                <span className="font-semibold text-gray-900">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Product Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal, summaryCurrency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={!selectedRows.length}
              className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
            >
              Add Selected Variants to Cart
            </button>

            <button
              type="button"
              onClick={addToQuoteList}
              disabled={!selectedRows.length}
              className="w-full rounded-xl border border-black/50 py-3 disabled:opacity-50"
            >
              Add Selected Variants to Quote List
            </button>

            {message && <p className="pt-2 text-sm text-green-700">{message}</p>}
          </div>
      </section>
    </>
  )
}

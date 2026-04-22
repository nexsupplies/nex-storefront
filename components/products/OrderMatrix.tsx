'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import { addLineItem, getOrCreateCart } from '@/lib/cart'
import {
  formatPrice,
  getVariantUnitAmount,
  type ProductVariant,
} from '@/lib/catalog'

type ProductContext = {
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

export default function OrderMatrix({
  product,
  variants,
  title = 'Order Matrix',
  showTitle = true,
  showQuoteAction = true,
  className = '',
  compact = false,
  onAddedToCart,
}: {
  product: ProductContext
  variants: ProductVariant[]
  title?: string
  showTitle?: boolean
  showQuoteAction?: boolean
  className?: string
  compact?: boolean
  onAddedToCart?: () => void
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => buildInitialQuantities(variants)
  )
  const [message, setMessage] = useState('')

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

  async function handleAddToCart() {
    if (!selectedRows.length) {
      setMessage('Add quantity to at least one variant.')
      return
    }

    try {
      const cartId = await getOrCreateCart()

      for (const row of selectedRows) {
        await addLineItem(cartId, row.variant.id, row.quantity)
      }

      const itemCount = totalItems
      const variantCount = selectedRows.length

      resetQuantities()
      setMessage(
        `Added ${itemCount} item${itemCount === 1 ? '' : 's'} across ${variantCount} variant${variantCount === 1 ? '' : 's'} to cart.`
      )
      onAddedToCart?.()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Failed to add to cart.'
      )
    }
  }

  function handleAddToQuoteList() {
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
    <div className={className}>
      {showTitle ? (
        <div>
          <Text as="h2" variant="h2Section">
            {title}
          </Text>
        </div>
      ) : null}

      <div className={showTitle ? 'mt-5' : ''}>
        {variants.length === 0 ? (
          <Text variant="bodySm">
            No orderable variants are available for this material yet.
          </Text>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="type-caption text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Variant</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Variant Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((row) => (
                  <tr key={row.variant.id}>
                    <td className="px-4 py-4">
                      <Text as="div" variant="h4CardTitle">
                        {row.variant.title}
                      </Text>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2 rounded-[10px] border border-black/20 bg-white px-2 py-1.5">
                        <Button
                          type="button"
                          onClick={() =>
                            updateQuantity(row.variant.id, row.quantity - 1)
                          }
                          variant="secondary"
                          kind="icon"
                          icon={<span aria-hidden="true">-</span>}
                          aria-label={`Decrease quantity for ${row.variant.title}`}
                          className="h-8 w-8 rounded-[4px]"
                        />
                        <Text
                          as="span"
                          variant="bodyMd"
                          className="min-w-8 text-center font-semibold text-black"
                        >
                          {row.quantity}
                        </Text>
                        <Button
                          type="button"
                          onClick={() =>
                            updateQuantity(row.variant.id, row.quantity + 1)
                          }
                          variant="secondary"
                          kind="icon"
                          icon={<span aria-hidden="true">+</span>}
                          aria-label={`Increase quantity for ${row.variant.title}`}
                          className="h-8 w-8 rounded-[4px]"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Text variant="bodySm">
                        {formatPrice(row.unitAmount, row.currencyCode)}
                      </Text>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Text
                        variant="bodyMd"
                        className="font-semibold text-black"
                      >
                        {row.unitAmount == null
                          ? 'Price unavailable'
                          : formatPrice(row.lineTotal, row.currencyCode)}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`${compact ? 'mt-6' : 'mt-8'} border-t border-black/30 pt-5`}>
        <div
          className={`grid gap-6 ${
            compact ? 'xl:grid-cols-[minmax(0,1fr)_280px]' : 'lg:grid-cols-[minmax(0,1fr)_320px]'
          } items-start`}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-[auto_auto] justify-start gap-x-3">
              <Text as="span" variant="muted">
                Total Items
              </Text>
              <Text
                as="span"
                variant="bodyMd"
                className="font-semibold text-black"
              >
                {totalItems}
              </Text>
            </div>
            <div className="grid grid-cols-[auto_auto] justify-start gap-x-3">
              <Text as="span" variant="muted">
                Product Subtotal
              </Text>
              <Text
                as="span"
                variant="bodyMd"
                className="font-semibold text-black"
              >
                {formatPrice(subtotal, summaryCurrency)}
              </Text>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedRows.length}
              variant="primary"
              fullWidth
            >
              Add Selected Variants to Cart
            </Button>

            {showQuoteAction ? (
              <Button
                type="button"
                onClick={handleAddToQuoteList}
                disabled={!selectedRows.length}
                variant="secondary"
                fullWidth
              >
                Add Selected Variants to Quote List
              </Button>
            ) : null}

            {message ? (
              <Text variant="bodySm" className="pt-2 text-green-700">
                {message}
              </Text>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

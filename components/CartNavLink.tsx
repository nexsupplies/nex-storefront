'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  CART_UPDATED_EVENT,
  getStoredCartId,
  retrieveCart,
} from '@/lib/cart'
import Text, { textStyles } from './ui/Typography'

type CartPreviewItem = {
  id: string
  quantity: number
  thumbnail?: string | null
  variant_title?: string | null
  product_title?: string | null
  title?: string | null
}

type CartPreview = {
  items: CartPreviewItem[]
}

export default function CartNavLink() {
  const [cart, setCart] = useState<CartPreview | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCartPreview() {
      const cartId = getStoredCartId()

      if (!cartId) {
        if (!cancelled) setCart(null)
        return
      }

      try {
        const data = await retrieveCart(cartId)
        if (!cancelled) {
          setCart({
            items: data?.items || [],
          })
        }
      } catch {
        if (!cancelled) setCart(null)
      }
    }

    loadCartPreview()

    const handleUpdate = () => {
      loadCartPreview().catch(() => {})
    }

    window.addEventListener(CART_UPDATED_EVENT, handleUpdate)

    return () => {
      cancelled = true
      window.removeEventListener(CART_UPDATED_EVENT, handleUpdate)
    }
  }, [])

  const itemCount = useMemo(
    () => (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const previewItems = (cart?.items || []).slice(0, 3)

  return (
    <div className="group relative">
      <Link href="/cart" className={textStyles.navLink}>
        {`Cart (${itemCount})`}
      </Link>

      <div className="pointer-events-none absolute right-0 top-full z-50 hidden w-80 translate-y-3 rounded-[12px] border border-black/30 bg-white p-4 opacity-0 shadow-[0_18px_50px_rgba(0,0,0,0.08)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 lg:block">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text variant="caption">Cart Preview</Text>
            <Text as="span" variant="muted">
              {`${itemCount} item${itemCount === 1 ? '' : 's'}`}
            </Text>
          </div>

          {previewItems.length === 0 ? (
            <Text variant="bodySm">Your cart is empty.</Text>
          ) : (
            <div className="space-y-3">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-t border-black/30 pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f2f2f2]">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.product_title || item.title || 'Cart item'}
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Text as="p" variant="h4CardTitle" className="truncate">
                      {item.product_title || item.title}
                    </Text>
                    <Text as="p" variant="caption" className="truncate">
                      {item.variant_title || 'Default variant'}
                    </Text>
                  </div>

                  <Text as="div" variant="bodyMd" className="font-semibold text-black">
                    x{item.quantity}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

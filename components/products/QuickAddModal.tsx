'use client'

import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import { getProductImageUrl, type StorefrontProduct } from '@/lib/catalog'
import OrderMatrix from './OrderMatrix'

export default function QuickAddModal({
  product,
  open,
  onClose,
}: {
  product: StorefrontProduct | null
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, open])

  if (!open || !product) {
    return null
  }

  const imageUrl = getProductImageUrl(product)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 px-4 py-8 backdrop-blur-[3px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[min(1180px,96vw)] overflow-hidden rounded-[28px] bg-[#efefef] shadow-[18px_18px_46px_rgba(0,0,0,0.14),-18px_-18px_46px_rgba(255,255,255,0.72)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid max-h-[min(86vh,920px)] min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
          <div className="min-h-0 border-b border-black/15 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Text variant="label">Quick Add</Text>
                <Text as="h2" variant="h2Section" className="mt-3">
                  {product.title}
                </Text>
              </div>
              <Button
                type="button"
                variant="tertiary"
                kind="icon"
                icon={<span aria-hidden="true">x</span>}
                aria-label="Close quick add"
                onClick={onClose}
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-[20px] bg-white p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.8),inset_-1px_-1px_0_rgba(0,0,0,0.03)]">
              <div className="aspect-square overflow-hidden rounded-[16px] bg-[#f2f2f2]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="h-full w-full object-contain p-6"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Text variant="bodySm">Image coming soon</Text>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button href={`/products/${product.handle}`} variant="secondary" fullWidth>
                Open Material Page
              </Button>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto bg-white p-6 lg:p-8">
            <OrderMatrix
              product={{
                id: product.id,
                title: product.title,
                handle: product.handle,
              }}
              variants={product.variants || []}
              title="Order Matrix"
              showQuoteAction={false}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  )
}

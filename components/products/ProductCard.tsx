'use client'

import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import {
  formatPrice,
  getProductCategoryLabels,
  getProductImageUrl,
  getProductLowestPrice,
  isProductInStock,
  type StorefrontProduct,
} from '@/lib/catalog'

export default function ProductCard({
  product,
  onQuickAdd,
}: {
  product: StorefrontProduct
  onQuickAdd: (product: StorefrontProduct) => void
}) {
  const imageUrl = getProductImageUrl(product)
  const category = getProductCategoryLabels(product)[0] || 'Material'
  const price = getProductLowestPrice(product)
  const currencyCode =
    product.variants?.find((variant) => variant.calculated_price?.currency_code)
      ?.calculated_price?.currency_code || 'CAD'
  const isInStock = isProductInStock(product)

  return (
    <article className="rounded-[12px] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_22px_48px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-square overflow-hidden rounded-[12px] bg-[#f2f2f2]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-contain p-4"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Text variant="bodySm">Image coming soon</Text>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <Text variant="caption">{category}</Text>
          <Text as="h2" variant="h4CardTitle" className="mt-2">
            {product.title}
          </Text>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.72rem] font-medium tracking-[0.08em] ${
            isInStock ? 'bg-[#ebf9ff] text-[#008dbd]' : 'bg-black/5 text-black/48'
          }`}
        >
          {isInStock ? 'In stock' : 'Out of stock'}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <Text variant="muted">From</Text>
          <Text as="div" variant="bodyMd" className="mt-1 font-semibold text-black">
            {formatPrice(price, currencyCode)}
          </Text>
        </div>
        <Text variant="bodySm">
          {product.variants?.length
            ? `${product.variants.length} variants`
            : 'Custom order'}
        </Text>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="primary"
          onClick={() => onQuickAdd(product)}
          disabled={!product.variants?.length}
          fullWidth
        >
          Quick Add
        </Button>
        <Button
          href={`/products/${product.handle}`}
          variant="secondary"
          fullWidth
        >
          View Material
        </Button>
      </div>
    </article>
  )
}

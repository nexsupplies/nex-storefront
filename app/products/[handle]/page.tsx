import ProductActions from './ProductActions'
import {
  formatPrice,
  getProductImageUrl,
  getVariantUnitAmount,
  normalizeMedusaAssetUrl,
  type StorefrontProduct,
} from '@/lib/catalog'

async function getProduct(handle: string): Promise<StorefrontProduct | null> {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID

  if (!baseUrl) throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing')
  if (!publishableKey) throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing')
  if (!regionId) throw new Error('NEXT_PUBLIC_MEDUSA_REGION_ID is missing')

  const params = new URLSearchParams({
    handle,
    region_id: regionId,
    fields: '*variants.calculated_price',
  })

  const res = await fetch(`${baseUrl}/store/products?${params.toString()}`, {
    cache: 'no-store',
    headers: {
      'x-publishable-api-key': publishableKey,
    },
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status} ${text}`)
  }

  const data = JSON.parse(text)
  return data.products?.[0] || null
}

function getPriceSummary(product: StorefrontProduct) {
  const variants = product.variants || []
  const pricedVariants = variants.filter(
    (variant) => getVariantUnitAmount(variant) != null
  )

  if (!pricedVariants.length) {
    return 'Price unavailable'
  }

  const amounts = pricedVariants
    .map((variant) => getVariantUnitAmount(variant))
    .filter((amount): amount is number => amount != null)
  const currencyCode =
    pricedVariants[0]?.calculated_price?.currency_code?.toUpperCase() || 'CAD'

  const minAmount = Math.min(...amounts)
  const maxAmount = Math.max(...amounts)

  if (minAmount === maxAmount) {
    return formatPrice(minAmount, currencyCode)
  }

  return `${formatPrice(minAmount, currencyCode)} - ${formatPrice(maxAmount, currencyCode)}`
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    return (
      <main className="p-10">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </main>
    )
  }

  const primaryImage = getProductImageUrl(product)
  const imageGallery = Array.from(
    new Set(
      [
        primaryImage,
        ...(product.images || []).map((image) =>
          normalizeMedusaAssetUrl(image.url)
        ),
      ].filter((imageUrl): imageUrl is string => Boolean(imageUrl))
    )
  )
  const priceSummary = getPriceSummary(product)
  const variantCount = product.variants?.length || 0

  return (
    <main className="p-10 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border bg-gray-100">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.title}
                className="h-[420px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-gray-500">
                Product image coming soon
              </div>
            )}
          </div>

          {imageGallery.length > 1 && (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {imageGallery.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="overflow-hidden rounded-2xl border bg-gray-100"
                >
                  <img
                    src={imageUrl}
                    alt={`${product.title} preview`}
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            Sign Material
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{product.title}</h1>
          <p className="mt-2 text-sm text-gray-500">{product.handle}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-3xl font-semibold">{priceSummary}</div>
            <div className="rounded-full border px-4 py-2 text-sm text-gray-600">
              {variantCount
                ? `${variantCount} orderable variant${variantCount === 1 ? '' : 's'}`
                : 'Custom ordering available'}
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-base leading-7 text-gray-700">
            {product.description ||
              'Material specifications can vary by thickness and finish. Use the order matrix below to combine multiple variants into one cart or quote request.'}
          </p>

          <ProductActions
            product={{
              id: product.id,
              title: product.title,
              handle: product.handle,
            }}
            variants={product.variants || []}
          />
        </section>
      </div>
    </main>
  )
}

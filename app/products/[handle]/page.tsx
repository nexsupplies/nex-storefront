import Link from 'next/link'
import ProductActions from './ProductActions'
import ProductDetailHero from './ProductDetailHero'
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

async function getRecommendedProducts(
  currentHandle: string
): Promise<StorefrontProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!baseUrl) throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing')
  if (!publishableKey) throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing')

  const res = await fetch(`${baseUrl}/store/products?limit=12`, {
    cache: 'no-store',
    headers: {
      'x-publishable-api-key': publishableKey,
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch recommended products')
  }

  const data = await res.json()

  return (data.products || [])
    .filter((item: StorefrontProduct) => item.handle !== currentHandle)
    .slice(0, 4)
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
  const recommendedProducts = await getRecommendedProducts(product.handle)

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <ProductDetailHero
        title={product.title}
        handle={product.handle}
        description={
          product.description ||
          'Material specifications can vary by thickness and finish. Use the order matrix below to combine multiple variants into one cart or quote request.'
        }
        priceSummary={priceSummary}
        variantCount={variantCount}
        imageGallery={imageGallery}
      />

      <section className="mt-12">
        <ProductActions
          product={{
            id: product.id,
            title: product.title,
            handle: product.handle,
          }}
          variants={product.variants || []}
        />
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
              Product Recommendations
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              Related materials
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recommendedProducts.map((item) => {
            const imageUrl = getProductImageUrl(item)

            return (
              <Link
                key={item.id}
                href={`/products/${item.handle}`}
                className="rounded-[12px] border bg-white transition hover:shadow-md"
              >
                <div className="overflow-hidden rounded-t-[12px] bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                      Image coming soon
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Material
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{item.handle}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}

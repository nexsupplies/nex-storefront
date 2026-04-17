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
  const orderMatrixId = 'order-matrix'
  const description =
    product.description ||
    'Material specifications can vary by thickness and finish. Use the order matrix below to combine multiple variants into one cart or quote request.'

  return (
    <main className="w-full">
      <section className="mx-[calc(50%-50vw)] w-screen grid grid-cols-1 lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)]">
        <aside className="px-6 py-10 lg:sticky lg:top-16 lg:row-span-2 lg:self-start lg:min-h-[calc(100vh-4rem)] lg:pl-16 lg:pr-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
                NEXPRO Material
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight lg:text-5xl">
                {product.title}
              </h1>
              <p className="mt-2 text-sm text-gray-500">{product.handle}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Starting Price
              </p>
              <p className="text-3xl font-semibold text-gray-950">{priceSummary}</p>
            </div>

            {variantCount ? (
              <a
                href={`#${orderMatrixId}`}
                className="inline-flex rounded-full border border-black/50 px-4 py-2 text-sm text-gray-700 transition hover:bg-black hover:text-white"
              >
                {`${variantCount} orderable variant${variantCount === 1 ? '' : 's'}`}
              </a>
            ) : (
              <div className="inline-flex rounded-full border border-black/50 px-4 py-2 text-sm text-gray-600">
                Custom ordering available
              </div>
            )}

            <div className="max-w-sm text-sm leading-7 text-gray-600">
              {description}
            </div>

            <div className="border-t border-black/50 pt-6">
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-gray-500">Best for</span>
                <span className="text-right font-medium text-gray-900">
                  Sign shops, fabricators, and board buyers
                </span>
              </div>
            </div>
          </div>
        </aside>

        <ProductDetailHero
          description={description}
          imageGallery={imageGallery}
        />

        <div id={orderMatrixId} className="scroll-mt-24 contents">
          <ProductActions
            product={{
              id: product.id,
              title: product.title,
              handle: product.handle,
            }}
            variants={product.variants || []}
          />
        </div>
      </section>

      <section className="mx-[calc(50%-50vw)] mt-16 w-screen px-6 lg:px-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
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
                className="rounded-[12px] border border-black/50 bg-white transition hover:shadow-md"
              >
                <div className="overflow-hidden rounded-t-[12px] bg-white">
                  {imageUrl ? (
                    <div className="relative aspect-square w-full bg-white">
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-contain p-4"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-sm text-gray-500">
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

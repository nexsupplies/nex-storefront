import Link from 'next/link'
import OrderJumpCTA from './OrderJumpCTA'
import ProductActions from './ProductActions'
import ProductDetailHero from './ProductDetailHero'
import ProductPageSnap from './ProductPageSnap'
import {
  formatPrice,
  getProductImageUrl,
  getVariantUnitAmount,
  normalizeMedusaAssetUrl,
  type StorefrontProduct,
} from '@/lib/catalog'
import Text from '@/components/ui/Typography'

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
    .slice(0, 3)
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
        <Text as="h1" variant="h2Section">
          Product not found
        </Text>
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
      <ProductPageSnap />

      <section className="mx-[calc(50%-50vw)] w-screen grid grid-cols-1 lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)]">
        <aside className="px-6 py-10 lg:sticky lg:top-16 lg:row-span-2 lg:self-start lg:min-h-[calc(100vh-4rem)] lg:pl-16 lg:pr-10">
          <div className="flex h-full flex-col">
            <div className="space-y-8">
              <div>
                <Link
                  href="/products"
                  className="type-nav-link inline-flex items-center gap-2"
                >
                  <span aria-hidden="true">←</span>
                  <span>Back to materials</span>
                </Link>

                <Text variant="label" className="mt-8">
                  NEXPRO Material
                </Text>
                <Text as="h1" variant="h1Hero" className="mt-3">
                  {product.title}
                </Text>
              </div>

              <div>
                <Text variant="label">Procurement Pricing</Text>
                <Text as="p" variant="price" className="mt-3">
                  {priceSummary}
                </Text>
                <Text variant="bodySm" className="mt-2 max-w-sm">
                  Live pricing across currently orderable variants.
                </Text>
              </div>
            </div>

            <div className="mt-auto pt-8">
              {variantCount ? (
                <OrderJumpCTA
                  sectionId={orderMatrixId}
                  variantCount={variantCount}
                />
              ) : (
                <div className="rounded-[12px] border border-black/30 px-5 py-4">
                  <Text variant="bodySm">Custom ordering available</Text>
                </div>
              )}
            </div>
          </div>
        </aside>

        <ProductDetailHero
          description={description}
          imageGallery={imageGallery}
        />

        <ProductActions
          sectionId={orderMatrixId}
          product={{
            id: product.id,
            title: product.title,
            handle: product.handle,
          }}
          variants={product.variants || []}
        />
      </section>

      <section className="mx-[calc(50%-50vw)] mt-16 grid w-screen grid-cols-1 lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)]">
        <div className="px-6 py-10 lg:pl-16 lg:pr-10">
          <Text variant="label">More Materials</Text>
          <Text as="h2" variant="h2Section" className="mt-3">
            Related materials
          </Text>
        </div>

        <div className="min-w-0 border-l border-black/50 px-6 py-10 lg:col-span-2 lg:px-8 lg:pr-16">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {recommendedProducts.map((item) => {
              const imageUrl = getProductImageUrl(item)
              const recommendationPrice = getPriceSummary(item)

              return (
                <Link
                  key={item.id}
                  href={`/products/${item.handle}`}
                  className="group rounded-[12px] border border-black/30 bg-white transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-[12px] bg-[#f2f2f2]">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-contain p-4"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Text variant="bodySm">Image coming soon</Text>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-5">
                    <Text variant="caption">Material</Text>
                    <Text as="h3" variant="h4CardTitle">
                      {item.title}
                    </Text>
                    <Text variant="bodySm">{recommendationPrice}</Text>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

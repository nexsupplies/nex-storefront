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
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border bg-gray-100">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.title}
                className="h-[420px] w-full object-cover lg:h-[560px]"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-gray-500 lg:h-[560px]">
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
                    className="h-24 w-full object-cover md:h-28"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-8">
          <section className="rounded-[2rem] border bg-white p-7 lg:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
              NEXPRO Material
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight lg:text-5xl">
              {product.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">{product.handle}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="text-3xl font-semibold">{priceSummary}</div>
              <div className="rounded-full border px-4 py-2 text-sm text-gray-600">
                {variantCount
                  ? `${variantCount} orderable variant${variantCount === 1 ? '' : 's'}`
                  : 'Custom ordering available'}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Material Overview
              </p>
              <p className="mt-3 text-base leading-7 text-gray-700">
                {product.description ||
                  'Material specifications can vary by thickness and finish. Use the order matrix below to combine multiple variants into one cart or quote request.'}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Pricing View
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  Variant-based pricing
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Each row in the matrix below has its own quantity, price, and line
                  total.
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Order Method
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  Multi-variant ordering
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Build one mixed-material order, then send it to cart or quote list
                  in a single action.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Pickup & Delivery
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Local pickup and delivery can be arranged after quote review or cart
                confirmation. Final logistics depend on sheet size, order volume, and
                destination.
              </p>
            </div>

            <div className="rounded-[1.75rem] border bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Order Support
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Use the matrix below for direct ordering. If your job needs mixed
                materials, special cutting, or freight handling, add it to Quote List
                instead.
              </p>
            </div>
          </section>
        </div>
      </section>

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

      <section className="mt-12 rounded-[2rem] border bg-white p-7 lg:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
          Product Details
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Built for sign production and material buying
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-700">
              {product.description ||
                'This material is presented for practical B2B ordering. Review available variants, compare pricing row by row, and place a mixed order through the matrix above.'}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Buying Format
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-gray-700">
              <li>Order multiple thickness or finish variants in one pass.</li>
              <li>Use cart for direct checkout-ready items.</li>
              <li>Use Quote List when the order needs freight or project review.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

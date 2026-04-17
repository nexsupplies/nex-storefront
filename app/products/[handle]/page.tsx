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

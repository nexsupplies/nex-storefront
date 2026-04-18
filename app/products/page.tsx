import Link from 'next/link'
import PageFrame from '@/components/PageFrame'
import { getProductImageUrl, type StorefrontProduct } from '@/lib/catalog'

async function getProducts(): Promise<StorefrontProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const res = await fetch(`${baseUrl}/store/products`, {
    cache: 'no-store',
    headers: {
      'x-publishable-api-key': publishableKey!,
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }

  const data = await res.json()
  return data.products || []
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <PageFrame
      sidebar={
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            Materials
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Browse the core sheet and sign materials available for quoting and checkout.
          </h1>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const imageUrl = getProductImageUrl(product)

          return (
            <div
              key={product.id}
              className="rounded-[12px] border border-black/30 bg-white p-6 transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 aspect-square overflow-hidden rounded-[12px] bg-[#f2f2f2]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="h-full w-full object-contain p-4"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Image coming soon
                  </div>
                )}
              </div>

              <h2 className="text-lg font-semibold text-gray-900">{product.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{product.handle}</p>
              <p className="mt-3 text-sm text-gray-600">
                {product.variants?.length
                  ? `${product.variants.length} ordering option${product.variants.length === 1 ? '' : 's'}`
                  : 'Custom ordering available'}
              </p>

              <Link
                href={`/products/${product.handle}`}
                className="mt-4 inline-block w-full rounded-[12px] bg-black py-3 text-center text-sm font-medium text-white"
              >
                View Material
              </Link>
            </div>
          )
        })}
      </div>
    </PageFrame>
  )
}

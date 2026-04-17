import Link from 'next/link'
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
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-8">Materials</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const imageUrl = getProductImageUrl(product)

          return (
            <div
              key={product.id}
              className="border rounded-2xl p-6 hover:shadow-lg transition"
            >
              <div className="h-40 overflow-hidden bg-gray-100 rounded-lg mb-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Image coming soon
                  </div>
                )}
              </div>

              <h2 className="font-semibold text-lg">{product.title}</h2>

              <p className="text-sm text-gray-500 mt-1">{product.handle}</p>

              <p className="mt-3 text-sm text-gray-600">
                {product.variants?.length
                  ? `${product.variants.length} ordering option${product.variants.length === 1 ? '' : 's'}`
                  : 'Custom ordering available'}
              </p>

              <Link
                href={`/products/${product.handle}`}
                className="mt-4 inline-block w-full bg-black text-white py-2 rounded-lg text-center"
              >
                View Material
              </Link>
            </div>
          )
        })}
      </div>
    </main>
  )
}

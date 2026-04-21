import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'
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
      mergeContent
      sidebar={
        <PageIntro
          label="Materials"
          title="Browse the core sheet and sign materials available for quoting and checkout."
        />
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                  <div className="flex h-full items-center justify-center">
                    <Text variant="bodySm">Image coming soon</Text>
                  </div>
                )}
              </div>

              <Text as="h2" variant="h4CardTitle">
                {product.title}
              </Text>
              <Text variant="caption" className="mt-1">
                {product.handle}
              </Text>
              <Text variant="bodySm" className="mt-3">
                {product.variants?.length
                  ? `${product.variants.length} ordering option${product.variants.length === 1 ? '' : 's'}`
                  : 'Custom ordering available'}
              </Text>

              <Button
                href={`/products/${product.handle}`}
                variant="primary"
                fullWidth
                className="mt-4"
              >
                View Material
              </Button>
            </div>
          )
        })}
      </div>
    </PageFrame>
  )
}

import ProductsCatalogShell from '@/components/products/ProductsCatalogShell'
import type { StorefrontProduct } from '@/lib/catalog'

async function getProducts(): Promise<StorefrontProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID

  if (!baseUrl) throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing')
  if (!publishableKey) throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing')
  if (!regionId) throw new Error('NEXT_PUBLIC_MEDUSA_REGION_ID is missing')

  const params = new URLSearchParams({
    limit: '100',
    region_id: regionId,
    fields:
      '*variants.calculated_price,+variants.inventory_quantity,*categories,*tags,*type,*collection',
  })

  const res = await fetch(`${baseUrl}/store/products?${params.toString()}`, {
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

  return <ProductsCatalogShell products={products} />
}

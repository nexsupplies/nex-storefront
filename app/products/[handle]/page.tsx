import ProductActions from './ProductActions'
type Variant = {
    id: string
    title: string
    calculated_price?: {
      calculated_amount?: number
      currency_code?: string
    } | null
  }
  
  type Product = {
    id: string
    title: string
    handle: string
    description?: string
    variants?: Variant[]
  }
  
  async function getProduct(handle: string): Promise<Product | null> {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
  
    if (!baseUrl) throw new Error("NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing")
    if (!publishableKey) throw new Error("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing")
    if (!regionId) throw new Error("NEXT_PUBLIC_MEDUSA_REGION_ID is missing")
  
    const params = new URLSearchParams({
      handle,
      region_id: regionId,
      fields: "*variants.calculated_price",
    })
  
    const res = await fetch(`${baseUrl}/store/products?${params.toString()}`, {
      cache: "no-store",
      headers: {
        "x-publishable-api-key": publishableKey,
      },
    })
  
    const text = await res.text()
  
    if (!res.ok) {
      throw new Error(`Failed to fetch product: ${res.status} ${text}`)
    }
  
    const data = JSON.parse(text)
    return data.products?.[0] || null
  }
  
  function formatPrice(amount?: number, currencyCode?: string) {
    if (amount == null || !currencyCode) return "Price unavailable"
  
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount)
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
  
    const firstVariant = product.variants?.[0]
    const price = formatPrice(
      firstVariant?.calculated_price?.calculated_amount,
      firstVariant?.calculated_price?.currency_code
    )
  
    return (
      <main className="p-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-gray-100 rounded-2xl" />
  
          <div>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <p className="text-gray-500 mt-2">{product.handle}</p>
            <p className="mt-4 text-2xl font-semibold">{price}</p>
  
            <p className="mt-6 text-base leading-7 text-gray-700">
              {product.description || "No description available."}
            </p>
  
            {product.variants && product.variants.length > 0 && (
              <div className="mt-8">
                <h2 className="font-semibold mb-3">Variants</h2>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg px-4 py-3">
                      <div className="font-medium">{variant.title}</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(
                          variant.calculated_price?.calculated_amount,
                          variant.calculated_price?.currency_code
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
  <ProductActions
  product={{
    id: product.id,
    title: product.title,
    handle: product.handle,
  }}
  variants={product.variants || []}
/>
          </div>
        </div>
      </main>
    )
  }

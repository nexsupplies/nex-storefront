import Link from "next/link"

type Product = {
  id: string
  title: string
  handle: string
}

async function getProducts(): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const res = await fetch(`${baseUrl}/store/products`, {
    cache: "no-store",
    headers: {
      "x-publishable-api-key": publishableKey!,
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch products")
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
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-2xl p-6 hover:shadow-lg transition"
          >
            <div className="h-40 bg-gray-100 rounded-lg mb-4" />

            <h2 className="font-semibold text-lg">{product.title}</h2>

            <p className="text-sm text-gray-500 mt-1">{product.handle}</p>

            <Link
              href={`/products/${product.handle}`}
              className="mt-4 inline-block w-full bg-black text-white py-2 rounded-lg text-center"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}

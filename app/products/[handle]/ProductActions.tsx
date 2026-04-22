import OrderMatrix from '@/components/products/OrderMatrix'
import type { ProductVariant } from '@/lib/catalog'

type Product = {
  id: string
  title: string
  handle: string
}

export default function ProductActions({
  sectionId,
  product,
  variants,
}: {
  sectionId?: string
  product: Product
  variants: ProductVariant[]
}) {
  return (
    <section
      id={sectionId}
      className="min-w-0 border-l border-black/50 py-8 lg:col-span-2 lg:min-h-[calc(100vh-4rem)] lg:snap-start lg:px-8 lg:py-10 lg:pr-16"
    >
      <OrderMatrix product={product} variants={variants} />
    </section>
  )
}

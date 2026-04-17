const MEDUSA_LOCAL_HOST_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i

export type ProductImage = {
  id?: string
  url?: string | null
}

export type ProductVariant = {
  id: string
  title: string
  calculated_price?: {
    calculated_amount?: number
    currency_code?: string
  } | null
}

export type StorefrontProduct = {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string | null
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export function formatPrice(amount?: number | null, currencyCode = 'CAD') {
  if (amount == null) return 'Price unavailable'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

export function getVariantUnitAmount(variant: ProductVariant) {
  return typeof variant.calculated_price?.calculated_amount === 'number'
    ? variant.calculated_price.calculated_amount
    : null
}

export function normalizeMedusaAssetUrl(
  url: string | null | undefined,
  backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
) {
  if (!url) {
    return null
  }

  if (!backendUrl) {
    return url
  }

  try {
    const parsedUrl = new URL(url)

    if (MEDUSA_LOCAL_HOST_RE.test(`${parsedUrl.protocol}//${parsedUrl.host}`)) {
      return new URL(
        `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
        backendUrl
      ).toString()
    }

    return parsedUrl.toString()
  } catch {
    try {
      return new URL(url, backendUrl).toString()
    } catch {
      return url
    }
  }
}

export function getProductImageUrl(
  product: Pick<StorefrontProduct, 'thumbnail' | 'images'>,
  backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
) {
  const primaryImage =
    normalizeMedusaAssetUrl(product.thumbnail, backendUrl) ||
    normalizeMedusaAssetUrl(
      product.images?.find((image) => image?.url)?.url,
      backendUrl
    )

  return primaryImage || null
}

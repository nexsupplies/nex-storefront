const MEDUSA_LOCAL_HOST_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i

export type ProductImage = {
  id?: string
  url?: string | null
}

export type ProductTag = {
  id?: string
  value: string
}

export type ProductCategory = {
  id?: string
  name: string
  handle?: string
}

export type ProductType = {
  id?: string
  value: string
}

export type ProductVariant = {
  id: string
  title: string
  allow_backorder?: boolean | null
  manage_inventory?: boolean | null
  inventory_quantity?: number | null
  thumbnail?: string | null
  images?: ProductImage[] | null
  metadata?: Record<string, unknown> | null
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
  categories?: ProductCategory[] | null
  tags?: ProductTag[] | null
  type?: ProductType | null
  metadata?: Record<string, unknown> | null
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

export function getProductLowestPrice(product: StorefrontProduct) {
  const amounts =
    product.variants
      ?.map((variant) => getVariantUnitAmount(variant))
      .filter((amount): amount is number => amount != null) || []

  return amounts.length ? Math.min(...amounts) : null
}

function getMetadataStringArray(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = metadata?.[key]

    if (Array.isArray(value)) {
      const strings = value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)

      if (strings.length) {
        return strings
      }
    }
  }

  return []
}

function uniqueLabels(values: string[]) {
  const seen = new Set<string>()
  const labels: string[] = []

  for (const value of values) {
    const normalized = value.trim()
    const key = normalized.toLowerCase()

    if (!normalized || seen.has(key)) {
      continue
    }

    seen.add(key)
    labels.push(normalized)
  }

  return labels
}

export function getProductTagValues(product: StorefrontProduct) {
  const directTags = product.tags?.map((tag) => tag.value) || []
  const metadataTags = getMetadataStringArray(product.metadata, [
    'tags',
    'tag_values',
    'use_tags',
  ])

  return uniqueLabels([...directTags, ...metadataTags])
}

export function getProductEnvironmentTags(product: StorefrontProduct) {
  const environmentAliases = new Map<string, string>([
    ['indoor', 'Indoor'],
    ['outdoor', 'Outdoor'],
    ['indoor/outdoor', 'Indoor / Outdoor'],
    ['indoor outdoor', 'Indoor / Outdoor'],
    ['interior', 'Indoor'],
    ['exterior', 'Outdoor'],
  ])

  const metadataEnvironments = getMetadataStringArray(product.metadata, [
    'environment',
    'environments',
    'use_environment',
  ])

  return uniqueLabels(
    [...getProductTagValues(product), ...metadataEnvironments]
      .map((value) => environmentAliases.get(value.toLowerCase()) || '')
      .filter(Boolean)
  )
}

export function getProductCommonUseTags(product: StorefrontProduct) {
  const environments = new Set(
    getProductEnvironmentTags(product).map((value) => value.toLowerCase())
  )
  const metadataUses = getMetadataStringArray(product.metadata, [
    'common_uses',
    'commonUses',
    'applications',
  ])

  return uniqueLabels(
    [...getProductTagValues(product), ...metadataUses].filter(
      (value) => !environments.has(value.toLowerCase())
    )
  )
}

export function getProductCategoryLabels(product: StorefrontProduct) {
  return uniqueLabels([
    ...(product.categories?.map((category) => category.name) || []),
    ...(product.type?.value ? [product.type.value] : []),
  ])
}

export function getProductPopularityScore(product: StorefrontProduct) {
  const candidates = [
    product.metadata?.sales_count,
    product.metadata?.salesCount,
    product.metadata?.popularity,
    product.metadata?.sort_rank,
    product.metadata?.sortRank,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }

    if (typeof candidate === 'string') {
      const parsed = Number(candidate)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

export function isVariantOrderable(variant: ProductVariant) {
  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity || 0) > 0
}

export function isProductInStock(product: StorefrontProduct) {
  if (!product.variants?.length) {
    return false
  }

  return product.variants.some((variant) => isVariantOrderable(variant))
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

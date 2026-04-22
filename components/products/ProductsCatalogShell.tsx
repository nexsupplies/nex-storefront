'use client'

import { useMemo, useState } from 'react'
import Text from '@/components/ui/Typography'
import {
  getProductCategoryLabels,
  getProductCommonUseTags,
  getProductEnvironmentTags,
  getProductLowestPrice,
  getProductPopularityScore,
  isProductInStock,
  type StorefrontProduct,
} from '@/lib/catalog'
import ProductCard from './ProductCard'
import QuickAddModal from './QuickAddModal'

type SortKey = 'price' | 'sales'

function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-left text-[0.8rem] font-medium tracking-[-0.01em] transition ${
        active ? 'bg-black text-white' : 'bg-black/[0.04] text-black/68 hover:bg-black/[0.08]'
      }`}
    >
      {children}
    </button>
  )
}

function FilterSection({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string
  values: string[]
  selected: Set<string>
  onToggle: (value: string) => void
}) {
  if (!values.length) {
    return null
  }

  return (
    <section className="space-y-3">
      <Text variant="label">{label}</Text>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <ToggleChip
            key={value}
            active={selected.has(value)}
            onClick={() => onToggle(value)}
          >
            {value}
          </ToggleChip>
        ))}
      </div>
    </section>
  )
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  )
}

export default function ProductsCatalogShell({
  products,
}: {
  products: StorefrontProduct[]
}) {
  const [selectedAvailability, setSelectedAvailability] = useState<Set<string>>(
    new Set()
  )
  const [selectedEnvironments, setSelectedEnvironments] = useState<Set<string>>(
    new Set()
  )
  const [selectedCommonUses, setSelectedCommonUses] = useState<Set<string>>(
    new Set()
  )
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  )
  const [sortKey, setSortKey] = useState<SortKey>('price')
  const [quickAddProduct, setQuickAddProduct] = useState<StorefrontProduct | null>(
    null
  )

  const environmentOptions = useMemo(
    () =>
      uniqueLabels(
        products.flatMap((product) => getProductEnvironmentTags(product))
      ),
    [products]
  )
  const commonUseOptions = useMemo(
    () =>
      uniqueLabels(products.flatMap((product) => getProductCommonUseTags(product))),
    [products]
  )
  const categoryOptions = useMemo(
    () =>
      uniqueLabels(products.flatMap((product) => getProductCategoryLabels(product))),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const results = products.filter((product) => {
      const isInStock = isProductInStock(product)
      const environments = new Set(getProductEnvironmentTags(product))
      const commonUses = new Set(getProductCommonUseTags(product))
      const categories = new Set(getProductCategoryLabels(product))

      if (
        selectedAvailability.size &&
        !(
          (selectedAvailability.has('In stock') && isInStock) ||
          (selectedAvailability.has('Out of stock') && !isInStock)
        )
      ) {
        return false
      }

      if (
        selectedEnvironments.size &&
        !Array.from(selectedEnvironments).every((value) => environments.has(value))
      ) {
        return false
      }

      if (
        selectedCommonUses.size &&
        !Array.from(selectedCommonUses).every((value) => commonUses.has(value))
      ) {
        return false
      }

      if (
        selectedCategories.size &&
        !Array.from(selectedCategories).every((value) => categories.has(value))
      ) {
        return false
      }

      return true
    })

    return [...results].sort((left, right) => {
      if (sortKey === 'sales') {
        return getProductPopularityScore(right) - getProductPopularityScore(left)
      }

      return (
        (getProductLowestPrice(left) ?? Number.POSITIVE_INFINITY) -
        (getProductLowestPrice(right) ?? Number.POSITIVE_INFINITY)
      )
    })
  }, [
    products,
    selectedAvailability,
    selectedCategories,
    selectedCommonUses,
    selectedEnvironments,
    sortKey,
  ])

  function toggleSetValue(
    current: Set<string>,
    nextValue: string,
    update: (value: Set<string>) => void
  ) {
    const next = new Set(current)

    if (next.has(nextValue)) {
      next.delete(nextValue)
    } else {
      next.add(nextValue)
    }

    update(next)
  }

  function resetFilters() {
    setSelectedAvailability(new Set())
    setSelectedEnvironments(new Set())
    setSelectedCommonUses(new Set())
    setSelectedCategories(new Set())
    setSortKey('price')
  }

  return (
    <>
      <main className="mx-[calc(50%-50vw)] w-screen grid grid-cols-1 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(320px,30fr)_minmax(0,35fr)_minmax(0,35fr)]">
        <aside className="px-6 py-10 lg:min-h-[calc(100dvh-4rem)] lg:pl-16 lg:pr-10">
          <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center justify-between">
              <Text variant="caption">{filteredProducts.length} materials</Text>
              <button
                type="button"
                onClick={resetFilters}
                className="type-caption text-black/54 transition hover:text-black"
              >
                Reset
              </button>
            </div>

            <FilterSection
              label="Availability"
              values={['In stock', 'Out of stock']}
              selected={selectedAvailability}
              onToggle={(value) =>
                toggleSetValue(
                  selectedAvailability,
                  value,
                  setSelectedAvailability
                )
              }
            />

            <FilterSection
              label="Indoor / Outdoor"
              values={environmentOptions}
              selected={selectedEnvironments}
              onToggle={(value) =>
                toggleSetValue(
                  selectedEnvironments,
                  value,
                  setSelectedEnvironments
                )
              }
            />

            <FilterSection
              label="Common Use"
              values={commonUseOptions}
              selected={selectedCommonUses}
              onToggle={(value) =>
                toggleSetValue(selectedCommonUses, value, setSelectedCommonUses)
              }
            />

            <FilterSection
              label="Product Category"
              values={categoryOptions}
              selected={selectedCategories}
              onToggle={(value) =>
                toggleSetValue(selectedCategories, value, setSelectedCategories)
              }
            />

            <section className="space-y-3">
              <Text variant="label">Sort</Text>
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  active={sortKey === 'price'}
                  onClick={() => setSortKey('price')}
                >
                  Price
                </ToggleChip>
                <ToggleChip
                  active={sortKey === 'sales'}
                  onClick={() => setSortKey('sales')}
                >
                  Sales
                </ToggleChip>
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 border-l border-black/50 lg:col-span-2 lg:min-h-[calc(100dvh-4rem)]">
          <div className="px-6 py-10 lg:px-8 lg:pr-16">
            {filteredProducts.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickAdd={setQuickAddProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[12px] bg-[#f2f2f2] px-6 py-10">
                <Text as="h2" variant="h4CardTitle">
                  No materials match the current filters.
                </Text>
                <Text variant="bodySm" className="mt-2">
                  Clear one or more filters to broaden the catalog view.
                </Text>
              </div>
            )}
          </div>
        </section>
      </main>

      <QuickAddModal
        product={quickAddProduct}
        open={Boolean(quickAddProduct)}
        onClose={() => setQuickAddProduct(null)}
      />
    </>
  )
}

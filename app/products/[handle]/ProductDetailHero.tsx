'use client'

import { useState } from 'react'

type ProductDetailHeroProps = {
  title: string
  handle: string
  description: string
  priceSummary: string
  variantCount: number
  imageGallery: string[]
}

type AccordionKey = 'overview' | 'delivery' | 'support'

const accordionItems: Array<{
  key: AccordionKey
  title: string
  content: string
}> = [
  {
    key: 'overview',
    title: 'Material Overview',
    content:
      'Material specifications can vary by thickness and finish. Review the variant rows below to compare pricing and build a mixed order in one pass.',
  },
  {
    key: 'delivery',
    title: 'Pickup & Delivery',
    content:
      'Local pickup and delivery can be arranged after quote review or cart confirmation. Final logistics depend on sheet size, order volume, and destination.',
  },
  {
    key: 'support',
    title: 'Order Support',
    content:
      'Use the Order Matrix below for direct purchasing. If the job requires special cutting, freight handling, or mixed-material planning, send it to Quote List instead.',
  },
]

export default function ProductDetailHero({
  title,
  handle,
  description,
  priceSummary,
  variantCount,
  imageGallery,
}: ProductDetailHeroProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [openItem, setOpenItem] = useState<AccordionKey>('overview')

  const currentImage = imageGallery[activeImage] || null

  function toggleItem(key: AccordionKey) {
    setOpenItem((current) => (current === key ? key : key))
  }

  return (
    <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start">
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)] lg:items-start">
          {imageGallery.length > 1 && (
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
              {imageGallery.map((imageUrl, index) => {
                const isActive = index === activeImage

                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`overflow-hidden rounded-2xl border bg-gray-100 transition ${
                      isActive
                        ? 'border-black shadow-[0_0_0_1px_rgba(0,0,0,0.08)]'
                        : 'border-gray-200'
                    }`}
                    aria-label={`Show image ${index + 1} for ${title}`}
                    aria-pressed={isActive}
                  >
                    <img
                      src={imageUrl}
                      alt={`${title} thumbnail ${index + 1}`}
                      className="h-20 w-20 object-cover lg:h-[88px] lg:w-[88px]"
                      loading="lazy"
                    />
                  </button>
                )
              })}
            </div>
          )}

          <div className="order-1 overflow-hidden rounded-[2rem] border bg-gray-100 lg:order-2">
            {currentImage ? (
              <img
                src={currentImage}
                alt={title}
                className="h-[420px] w-full object-cover lg:h-[620px]"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-gray-500 lg:h-[620px]">
                Product image coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-8">
        <section className="rounded-[2rem] border bg-white p-7 lg:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            NEXPRO Material
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight lg:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{handle}</p>

          <div className="mt-6 rounded-[1.75rem] border bg-gray-50 px-5 py-6">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Starting Price
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-950">
                  {priceSummary}
                </p>
              </div>

              <div className="rounded-full border bg-white px-4 py-2 text-sm text-gray-600">
                {variantCount
                  ? `${variantCount} orderable variant${variantCount === 1 ? '' : 's'}`
                  : 'Custom ordering available'}
              </div>
            </div>

            <div className="mt-5 border-t pt-5">
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-gray-500">Ordering format</span>
                <span className="text-right font-medium text-gray-900">
                  Multi-variant matrix ordering
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-gray-500">Checkout path</span>
                <span className="text-right font-medium text-gray-900">
                  Add selected rows to cart or Quote List
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="text-gray-500">Best for</span>
                <span className="text-right font-medium text-gray-900">
                  Sign shops, fabricators, and board buyers
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 divide-y rounded-[1.75rem] border">
            {accordionItems.map((item) => {
              const isOpen = openItem === item.key
              const bodyText =
                item.key === 'overview' && description ? description : item.content

              return (
                <div key={item.key}>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.key)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-medium text-gray-900">
                      {item.title}
                    </span>
                    <span className="text-xl text-gray-500">{isOpen ? '-' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm leading-7 text-gray-600">
                      {bodyText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'

type ProductDetailHeroProps = {
  description: string
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
    title: 'Product Details',
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
  description,
  imageGallery,
}: ProductDetailHeroProps) {
  const [openItem, setOpenItem] = useState<AccordionKey>('overview')

  function toggleItem(key: AccordionKey) {
    setOpenItem((current) => (current === key ? key : key))
  }

  return (
    <div className="min-w-0 lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="min-w-0 space-y-6 bg-[#f2f2f2] py-10 lg:border-l lg:border-black/50 lg:px-8 lg:py-10">
        {imageGallery.length ? (
          imageGallery.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="overflow-hidden bg-[#f2f2f2]">
              <div className="relative aspect-square w-full bg-[#f2f2f2]">
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-contain p-5 lg:p-8"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-gray-500">
            Product image coming soon
          </div>
        )}
      </section>

      <section className="min-w-0 bg-[#f2f2f2] py-10 lg:sticky lg:top-16 lg:self-start lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:border-black/50 lg:pl-8 lg:pr-16 lg:py-10">
        <div>
          {accordionItems.map((item) => {
            const isOpen = openItem === item.key
            const bodyText =
              item.key === 'overview' && description ? description : item.content

            return (
              <div key={item.key} className="border-b border-black/30">
                <button
                  type="button"
                  onClick={() => toggleItem(item.key)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-gray-900">
                    {item.title}
                  </span>
                  <span className="text-xl text-gray-500">{isOpen ? '-' : '+'}</span>
                </button>

                {isOpen && (
                  <div className="pb-5 text-sm leading-7 text-gray-600">
                    {bodyText}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

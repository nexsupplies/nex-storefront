'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'

type SidebarItem = {
  key: string
  title: string
  content: string
}

function SupportIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4.167 5.833C4.167 4.913 4.913 4.167 5.833 4.167h8.334c.92 0 1.666.746 1.666 1.666v5c0 .92-.746 1.667-1.666 1.667H9.642l-2.73 2.275a.833.833 0 0 1-1.37-.64v-1.635H5.833a1.667 1.667 0 0 1-1.666-1.667v-5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SupportSidebar({
  title,
  items,
  buttonLabel = 'Contact Support',
}: {
  title: string
  items: SidebarItem[]
  buttonLabel?: string
}) {
  const [openItem, setOpenItem] = useState(items[0]?.key ?? '')

  return (
    <div className="flex h-full flex-col lg:sticky lg:top-16 lg:min-h-[calc(100vh-4rem)]">
      <div className="space-y-10">
        <Text as="h1" variant="h1Hero">
          {title}
        </Text>

        <div>
          {items.map((item) => {
            const isOpen = openItem === item.key

            return (
              <div key={item.key} className="border-b border-black/30 first:border-t">
                <button
                  type="button"
                  onClick={() => setOpenItem(item.key)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <Text as="span" variant="h4CardTitle">
                    {item.title}
                  </Text>
                  <Text as="span" variant="bodyMd" className="text-xl text-black/45">
                    {isOpen ? '−' : '+'}
                  </Text>
                </button>

                {isOpen ? (
                  <Text variant="bodySm" className="pb-5 pr-4">
                    {item.content}
                  </Text>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-10 pt-6 lg:mt-auto">
        <Button
          type="button"
          variant="secondary"
          kind="icon-text"
          icon={<SupportIcon />}
          disabled
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}

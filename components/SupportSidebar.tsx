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
  defaultOpenKey,
}: {
  title: string
  items: SidebarItem[]
  buttonLabel?: string
  defaultOpenKey?: string
}) {
  const [openItem, setOpenItem] = useState(defaultOpenKey ?? items[0]?.key ?? '')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="shrink-0 space-y-6 lg:space-y-8">
          <Text as="h1" variant="h1Hero">
            {title}
          </Text>
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2 lg:mt-8">
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

      <div className="mt-4 shrink-0 border-t border-black/30 pt-4 lg:mt-6 lg:pt-6">
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

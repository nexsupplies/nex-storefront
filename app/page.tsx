'use client'

import { useEffect } from 'react'
import { getOrCreateCart } from '@/lib/cart'
import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'

export default function Home() {
  useEffect(() => {
    getOrCreateCart().catch(console.error)
  }, [])

  return (
    <PageFrame
      sidebar={
        <PageIntro
          label="NEX Supplies"
          title="Industrial materials, structured for fast quoting and ordering."
        />
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="max-w-3xl">
          <Text variant="bodyLg">
            Browse sheet materials, build mixed-variant carts, and move from quote
            requests to checkout in one consistent purchasing flow.
          </Text>
        </div>
        <div className="space-y-3">
          <Button href="/products" variant="primary" fullWidth>
            Browse Materials
          </Button>
          <Button href="/quote-list" variant="secondary" fullWidth>
            Open Quote List
          </Button>
        </div>
      </div>
    </PageFrame>
  )
}

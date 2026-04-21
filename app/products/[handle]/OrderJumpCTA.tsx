'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'

export default function OrderJumpCTA({
  sectionId,
  variantCount,
}: {
  sectionId: string
  variantCount: number
}) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    function updateVisibility() {
      const section = document.getElementById(sectionId)

      if (!section) {
        setHidden(false)
        return
      }

      const rect = section.getBoundingClientRect()
      setHidden(rect.top <= 96 && rect.bottom > 96)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [sectionId])

  if (!variantCount || hidden) {
    return null
  }

  return (
    <Button
      type="button"
      onClick={() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      variant="primary"
      kind="icon-text"
      icon={<span aria-hidden="true" className="text-xl transition group-hover:translate-x-1">→</span>}
      iconPosition="right"
      fullWidth
      className="justify-between text-left"
    >
      <div>
        <Text variant="caption" className="text-white/72">
          Ready to Order
        </Text>
        <Text as="p" variant="h4CardTitle" className="mt-2 text-white">
          {`${variantCount} orderable variant${variantCount === 1 ? '' : 's'}`}
        </Text>
      </div>
    </Button>
  )
}

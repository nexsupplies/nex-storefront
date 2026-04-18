'use client'

import { useEffect, useState } from 'react'

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
    <button
      type="button"
      onClick={() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      className="group flex w-full items-center justify-between rounded-[12px] bg-black px-5 py-4 text-left text-white transition hover:bg-gray-900"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">
          Ready to Order
        </p>
        <p className="mt-2 text-base font-semibold">
          {`${variantCount} orderable variant${variantCount === 1 ? '' : 's'}`}
        </p>
      </div>
      <span className="text-xl transition group-hover:translate-x-1">→</span>
    </button>
  )
}

'use client'

import { useEffect } from 'react'

export default function ProductPageSnap() {
  useEffect(() => {
    document.documentElement.classList.add('product-page-snap')

    return () => {
      document.documentElement.classList.remove('product-page-snap')
    }
  }, [])

  return null
}

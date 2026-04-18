'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageFrame from '@/components/PageFrame'

type QuoteItem = {
  productId: string
  productTitle: string
  productHandle: string
  variantId: string
  variantTitle: string
  quantity: number
}

export default function QuotePage() {
  const [quoteList, setQuoteList] = useState<QuoteItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const existing = localStorage.getItem('quote-list')
    return existing ? JSON.parse(existing) : []
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submittedQuoteId, setSubmittedQuoteId] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (quoteList.length === 0) {
      setError('Your quote list is empty.')
      return
    }

    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

    if (!backendUrl || !publishableKey) {
      setError('Storefront Medusa environment variables are missing.')
      return
    }

    const payload = {
      customer: {
        name,
        email,
        phone: phone || undefined,
        company: company || undefined,
      },
      notes: notes || undefined,
      items: quoteList.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${backendUrl}/store/quote-requests`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text()

      if (!res.ok) {
        throw new Error(text || 'Failed to submit quote request.')
      }

      const data = text ? JSON.parse(text) : {}

      localStorage.setItem('last-quote-request', JSON.stringify(data))
      localStorage.removeItem('quote-list')
      setQuoteList([])
      setSubmittedQuoteId(data.quote_request?.id || '')
      setSubmitted(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit quote request.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <PageFrame
        sidebar={
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
              Quote Submitted
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-950">
              Your quote request has been sent successfully.
            </h1>
          </div>
        }
      >
        <div className="max-w-2xl space-y-6">
          <p className="text-gray-600">
            Your quote request has been sent to Medusa successfully.
          </p>
          {submittedQuoteId && (
            <p className="text-sm text-gray-500">Quote ID: {submittedQuoteId}</p>
          )}

          <div className="flex gap-4">
            <Link href="/products" className="underline">
              Continue Browsing
            </Link>
            <Link href="/quote-list" className="underline">
              Back to Quote List
            </Link>
          </div>
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame
      sidebar={
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            Submit Quote
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Send one consolidated request for all items in your quote list.
          </h1>
        </div>
      }
    >
      {quoteList.length === 0 ? (
        <div className="space-y-4">
          <p>Your quote list is empty.</p>
          <Link
            href="/products"
            className="inline-block rounded-[12px] bg-black px-5 py-3 text-white"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Requested Products</h2>
            <div className="space-y-4">
              {quoteList.map((item) => (
                <div
                  key={item.variantId}
                  className="rounded-[12px] border border-black/30 bg-white p-5"
                >
                  <Link
                    href={`/products/${item.productHandle}`}
                    className="font-semibold hover:underline"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">{item.variantTitle}</p>
                  <p className="mt-2 text-sm">Quantity: {item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-[12px] border border-black/30 bg-white p-6"
            >
              <h2 className="text-xl font-semibold">Contact Details</h2>

              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-32 w-full rounded-[10px] border border-black/30 px-4 py-3"
                  placeholder="Tell us about cutting, custom size, pickup, delivery, or other requirements."
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[12px] bg-black py-3 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </PageFrame>
  )
}

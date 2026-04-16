'use client'

import Link from 'next/link'
import { useState } from 'react'

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
      <main className="p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Quote Request Submitted</h1>
        <p className="text-gray-600 mb-6">
          Your quote request has been sent to Medusa successfully.
        </p>
        {submittedQuoteId && (
          <p className="text-sm text-gray-500 mb-6">Quote ID: {submittedQuoteId}</p>
        )}

        <div className="flex gap-4">
          <Link href="/products" className="underline">
            Continue Browsing
          </Link>
          <Link href="/quote-list" className="underline">
            Back to Quote List
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit Quote Request</h1>

      {quoteList.length === 0 ? (
        <div className="space-y-4">
          <p>Your quote list is empty.</p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-5 py-3 rounded-lg"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div>
            <h2 className="text-xl font-semibold mb-4">Requested Products</h2>
            <div className="space-y-4">
              {quoteList.map((item) => (
                <div key={item.variantId} className="border rounded-2xl p-5">
                  <Link
                    href={`/products/${item.productHandle}`}
                    className="font-semibold hover:underline"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.variantTitle}
                  </p>
                  <p className="text-sm mt-2">Quantity: {item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <form onSubmit={handleSubmit} className="border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">Contact Details</h2>

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 min-h-32"
                  placeholder="Tell us about cutting, custom size, pickup, delivery, or other requirements."
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-3 rounded-lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </main>
  )
}

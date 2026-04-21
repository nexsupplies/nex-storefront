'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'
import { createQuoteRequest } from '@/lib/order-hub'

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
  const [submittedQuoteNumber, setSubmittedQuoteNumber] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (quoteList.length === 0) {
      setError('Your quote list is empty.')
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
      const data = await createQuoteRequest(payload)

      localStorage.setItem('last-quote-request', JSON.stringify(data))
      localStorage.removeItem('quote-list')
      setQuoteList([])
      setSubmittedQuoteId(data.quote_request?.id || '')
      setSubmittedQuoteNumber(data.quote_request?.quote_number || '')
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
        contentScroll
        sidebar={
          <PageIntro
            label="Quote Submitted"
            title="Your quote request has been sent successfully."
          />
        }
      >
        <div className="max-w-2xl space-y-6">
          <Text variant="bodyMd">
            Your quote request has been sent to Medusa successfully.
          </Text>
          {submittedQuoteNumber ? (
            <div className="rounded-[12px] border border-[#1D4DC5]/20 bg-[#1D4DC5]/6 px-5 py-5">
              <Text variant="caption">Quote Number</Text>
              <Text as="div" variant="price" className="mt-3 text-[#1D4DC5]">
                {submittedQuoteNumber}
              </Text>
            </div>
          ) : null}
          {submittedQuoteId && (
            <Text variant="bodySm">Quote ID: {submittedQuoteId}</Text>
          )}

          <div className="flex gap-4">
            <Button href="/products" variant="tertiary">
              Continue Browsing
            </Button>
            <Button
              href={
                submittedQuoteNumber
                  ? `/order-hub?quote_number=${encodeURIComponent(submittedQuoteNumber)}`
                  : '/order-hub'
              }
              variant="tertiary"
            >
              Open Quote Hub
            </Button>
          </div>
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame
      contentScroll
      sidebar={
        <PageIntro
          label="Submit Quote"
          title="Send one consolidated request for all items in your quote list."
        />
      }
    >
      {quoteList.length === 0 ? (
        <div className="space-y-4">
          <Text variant="bodyMd">Your quote list is empty.</Text>
          <Button href="/products" variant="primary">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Text as="h2" variant="h2Section" className="mb-4">
              Requested Products
            </Text>
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
                  <Text variant="caption" className="mt-1">
                    {item.variantTitle}
                  </Text>
                  <Text variant="bodySm" className="mt-2">
                    Quantity: {item.quantity}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-[12px] border border-black/30 bg-white p-6"
            >
              <Text as="h2" variant="h2Section">
                Contact Details
              </Text>

              <div>
                <Text as="label" variant="bodySm" className="mb-1 block font-semibold text-black">
                  Name
                </Text>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                  required
                />
              </div>

              <div>
                <Text as="label" variant="bodySm" className="mb-1 block font-semibold text-black">
                  Email
                </Text>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                  required
                />
              </div>

              <div>
                <Text as="label" variant="bodySm" className="mb-1 block font-semibold text-black">
                  Phone
                </Text>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                />
              </div>

              <div>
                <Text as="label" variant="bodySm" className="mb-1 block font-semibold text-black">
                  Company
                </Text>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-[10px] border border-black/30 px-4 py-3"
                />
              </div>

              <div>
                <Text as="label" variant="bodySm" className="mb-1 block font-semibold text-black">
                  Notes
                </Text>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-32 w-full rounded-[10px] border border-black/30 px-4 py-3"
                  placeholder="Tell us about cutting, custom size, pickup, delivery, or other requirements."
                />
              </div>

              {error && (
                <Text variant="bodySm" className="text-red-600">
                  {error}
                </Text>
              )}

              <Button type="submit" disabled={isSubmitting} variant="primary" fullWidth>
                {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
              </Button>
            </form>
          </aside>
        </div>
      )}
    </PageFrame>
  )
}

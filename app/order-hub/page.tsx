'use client'

import { Suspense, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import {
  accessQuoteHubAccount,
  clearRememberedQuoteHubAccess,
  fetchQuoteHubQuote,
  getRememberedQuoteHubAccess,
  rememberQuoteHubAccess,
  type QuoteHubQuote,
} from '@/lib/order-hub'

function formatPrice(amount?: number | null, currencyCode = 'CAD') {
  if (amount == null) return 'TBD'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function QuoteStatusPill({
  label,
  emphasis = 'default',
}: {
  label: string
  emphasis?: 'default' | 'accent'
}) {
  const className =
    emphasis === 'accent'
      ? 'border-[#00AFEC]/20 bg-[#00AFEC]/6 text-[#00AFEC]'
      : 'border-black/15 bg-black/[0.03] text-black/70'

  return (
    <Text
      as="span"
      variant="caption"
      className={`inline-flex rounded-full border px-3 py-1 ${className}`}
    >
      {label}
    </Text>
  )
}

function QuoteDetailCard({ quote }: { quote: QuoteHubQuote }) {
  return (
    <section className="rounded-[12px] border border-black/20 bg-white p-6 lg:p-7">
      <div className="flex flex-col gap-5 border-b border-black/12 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Text as="h2" variant="h2Section">
              {quote.quote_number || quote.reference}
            </Text>
            <QuoteStatusPill label={quote.status_label} emphasis="accent" />
          </div>

          <Text variant="bodyMd" className="max-w-2xl text-black/64">
            Review the submitted materials, current quote status, and fulfillment
            details in one place.
          </Text>
        </div>

        <div className="grid gap-3 text-left lg:min-w-[220px]">
          <div className="flex items-center justify-between gap-6">
            <Text as="span" variant="muted">
              Submitted
            </Text>
            <Text as="span" variant="bodyMd" className="font-semibold text-black">
              {formatDate(quote.created_at)}
            </Text>
          </div>
          <div className="flex items-center justify-between gap-6">
            <Text as="span" variant="muted">
              Fulfillment
            </Text>
            <Text as="span" variant="bodyMd" className="font-semibold text-black">
              {quote.fulfillment_label}
            </Text>
          </div>
          <div className="flex items-center justify-between gap-6">
            <Text as="span" variant="muted">
              Payment
            </Text>
            <Text as="span" variant="bodyMd" className="font-semibold text-black">
              {quote.payment_method
                ? quote.payment_method.replace(/_/g, ' ')
                : 'TBD'}
            </Text>
          </div>
        </div>
      </div>

      <div className="grid gap-8 border-b border-black/12 py-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div>
          <Text as="h3" variant="h4CardTitle">
            Items
          </Text>
          <div className="mt-4 divide-y divide-black/10">
            {quote.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Text variant="bodyMd" className="font-semibold text-black">
                    {item.title}
                  </Text>
                  <Text variant="bodySm" className="mt-1 text-black/62">
                    {item.variant_title || 'Default variant'}
                  </Text>
                </div>
                <Text variant="bodyMd" className="font-semibold text-black">
                  Qty {item.quantity}
                </Text>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Text as="h3" variant="h4CardTitle">
            Summary
          </Text>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-6">
              <Text as="span" variant="muted">
                Subtotal
              </Text>
              <Text as="span" variant="bodyMd" className="font-semibold text-black">
                {formatPrice(quote.subtotal, quote.currency_code || 'CAD')}
              </Text>
            </div>
            <div className="flex items-center justify-between gap-6">
              <Text as="span" variant="muted">
                Shipping
              </Text>
              <Text as="span" variant="bodyMd" className="font-semibold text-black">
                {formatPrice(quote.shipping_total, quote.currency_code || 'CAD')}
              </Text>
            </div>
            <div className="flex items-center justify-between gap-6">
              <Text as="span" variant="muted">
                Tax
              </Text>
              <Text as="span" variant="bodyMd" className="font-semibold text-black">
                {formatPrice(quote.tax_total, quote.currency_code || 'CAD')}
              </Text>
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-black/12 pt-3">
              <Text as="span" variant="h4CardTitle">
                Total
              </Text>
              <Text as="span" variant="bodyMd" className="font-semibold text-black">
                {formatPrice(quote.total, quote.currency_code || 'CAD')}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 pt-5 lg:grid-cols-2">
        <div>
          <Text as="h3" variant="h4CardTitle">
            Delivery / Pickup
          </Text>
          <div className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-6">
              <Text as="span" variant="muted">
                Method
              </Text>
              <Text as="span" variant="bodyMd" className="max-w-[240px] text-right font-semibold text-black">
                {quote.fulfillment_label}
              </Text>
            </div>
            <div className="flex items-start justify-between gap-6">
              <Text as="span" variant="muted">
                Address
              </Text>
              <Text as="span" variant="bodyMd" className="max-w-[240px] text-right font-semibold text-black">
                {quote.address_summary || quote.pickup_location || 'Pending'}
              </Text>
            </div>
          </div>
        </div>

        <div>
          <Text as="h3" variant="h4CardTitle">
            Response
          </Text>
          <Text variant="bodyMd" className="mt-4 text-black/68">
            {quote.response_note || 'No response note has been added yet.'}
          </Text>
        </div>
      </div>
    </section>
  )
}

function QuoteHubPageContent() {
  const searchParams = useSearchParams()
  const [quoteNumber, setQuoteNumber] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountQuoteNumber, setAccountQuoteNumber] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<QuoteHubQuote | null>(null)
  const [accountQuotes, setAccountQuotes] = useState<QuoteHubQuote[]>([])
  const [loadingSingle, setLoadingSingle] = useState(false)
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'single' | 'account' | null>(null)

  const loadRememberedState = useEffectEvent(async () => {
    const queryQuoteNumber = searchParams.get('quote_number')?.trim() || ''
    const rememberedAccess = getRememberedQuoteHubAccess()

    if (queryQuoteNumber) {
      setQuoteNumber(queryQuoteNumber)
      await handleLookup(queryQuoteNumber)
      return
    }

    if (rememberedAccess) {
      setAccountEmail(rememberedAccess.email)
      setAccountQuoteNumber(rememberedAccess.quoteNumber)
      await handleAccountAccess(rememberedAccess.email, rememberedAccess.quoteNumber)
    }
  })

  useEffect(() => {
    void loadRememberedState()
  }, [searchParams])

  async function handleLookup(nextQuoteNumber = quoteNumber) {
    if (!nextQuoteNumber.trim()) {
      setMessage('Enter a quote number to continue.')
      return
    }

    try {
      setLoadingSingle(true)
      setMessage('')
      const quote = await fetchQuoteHubQuote(nextQuoteNumber)
      setSelectedQuote(quote)
      setAccountQuotes([])
      setMode('single')
    } catch (error) {
      setSelectedQuote(null)
      setMode(null)
      setMessage(error instanceof Error ? error.message : 'Failed to load quote.')
    } finally {
      setLoadingSingle(false)
    }
  }

  async function handleAccountAccess(
    nextEmail = accountEmail,
    nextQuoteNumber = accountQuoteNumber
  ) {
    if (!nextEmail.trim() || !nextQuoteNumber.trim()) {
      setMessage('Enter both account email and one valid quote number.')
      return
    }

    try {
      setLoadingAccount(true)
      setMessage('')
      const data = await accessQuoteHubAccount({
        email: nextEmail,
        quoteNumber: nextQuoteNumber,
      })

      rememberQuoteHubAccess({
        email: nextEmail,
        quoteNumber: nextQuoteNumber,
      })

      setAccountQuotes(data.quotes)
      setSelectedQuote(data.quotes[0] || null)
      setMode('account')
    } catch (error) {
      setAccountQuotes([])
      setSelectedQuote(null)
      setMode(null)
      setMessage(
        error instanceof Error ? error.message : 'Failed to access quote hub.'
      )
    } finally {
      setLoadingAccount(false)
    }
  }

  function handleSignOut() {
    clearRememberedQuoteHubAccess()
    setAccountEmail('')
    setAccountQuoteNumber('')
    setAccountQuotes([])
    setSelectedQuote(null)
    setMode(null)
    setMessage('')
  }

  const contentTitle = useMemo(() => {
    if (mode === 'account') {
      return 'Account Quotes'
    }

    if (mode === 'single') {
      return 'Quote Details'
    }

    return 'Quote Access'
  }, [mode])

  return (
    <PageFrame
      mergeContent
      contentScroll
      sidebar={
        <div className="flex h-full flex-col">
          <div className="space-y-8">
            <Text as="h1" variant="h2Section">
              Quote Hub
            </Text>

            <div className="space-y-6">
              <div className="rounded-[12px] border border-black/20 bg-white p-5">
                <Text as="h2" variant="h4CardTitle">
                  Quote Access
                </Text>
                <Text variant="bodySm" className="mt-3 text-black/64">
                  Search one quote number directly, or access an account using the
                  account email and one valid quote number.
                </Text>
              </div>

              <div className="rounded-[12px] border border-black/20 bg-white p-5">
                <Text as="h3" variant="h4CardTitle">
                  Search by Quote Number
                </Text>
                <Text variant="bodySm" className="mt-3 text-black/64">
                  One quote number loads one quote record.
                </Text>

                <div className="mt-4 grid gap-3">
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value.toUpperCase())}
                    placeholder="Q20260421-0001"
                    className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                  />
                  <Button
                    type="button"
                    onClick={() => void handleLookup()}
                    disabled={loadingSingle}
                    variant="primary"
                    fullWidth
                  >
                    {loadingSingle ? 'Loading...' : 'Open Quote'}
                  </Button>
                </div>
              </div>

              <div className="rounded-[12px] border border-black/20 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Text as="h3" variant="h4CardTitle">
                    Account Access
                  </Text>
                  {mode === 'account' ? (
                    <Button type="button" variant="tertiary" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  ) : null}
                </div>

                <Text variant="bodySm" className="mt-3 text-black/64">
                  Sign in with account email plus one valid quote number to view all
                  quotes linked to that account.
                </Text>

                <div className="mt-4 grid gap-3">
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="account@email.com"
                    className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                  />
                  <input
                    type="text"
                    value={accountQuoteNumber}
                    onChange={(e) =>
                      setAccountQuoteNumber(e.target.value.toUpperCase())
                    }
                    placeholder="One valid quote number"
                    className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                  />
                  <Button
                    type="button"
                    onClick={() => void handleAccountAccess()}
                    disabled={loadingAccount}
                    variant="secondary"
                    fullWidth
                  >
                    {loadingAccount ? 'Accessing...' : 'Access Account'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {message ? (
            <div className="mt-6 rounded-[12px] border border-black/15 bg-black/[0.03] px-4 py-3">
              <Text variant="bodySm">{message}</Text>
            </div>
          ) : null}
        </div>
      }
    >
      <div className="space-y-8">
        <header className="max-w-3xl">
          <Text as="h2" variant="h2Section">
            {contentTitle}
          </Text>
        </header>

        {mode === 'account' && accountQuotes.length > 0 ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
            <div className="rounded-[12px] border border-black/20 bg-white p-4">
              <Text as="h3" variant="h4CardTitle" className="px-2 pb-3">
                Quotes
              </Text>

              <div className="divide-y divide-black/10">
                {accountQuotes.map((quote) => {
                  const isActive = selectedQuote?.id === quote.id

                  return (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => setSelectedQuote(quote)}
                      className={`grid w-full gap-2 px-2 py-4 text-left transition ${
                        isActive ? 'bg-black/[0.03]' : 'hover:bg-black/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <Text variant="bodyMd" className="font-semibold text-black">
                          {quote.quote_number || quote.reference}
                        </Text>
                        <QuoteStatusPill label={quote.status_label} />
                      </div>
                      <Text variant="bodySm" className="text-black/62">
                        {formatDate(quote.created_at)}
                      </Text>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedQuote ? <QuoteDetailCard quote={selectedQuote} /> : null}
          </section>
        ) : selectedQuote ? (
          <QuoteDetailCard quote={selectedQuote} />
        ) : (
          <div className="rounded-[12px] border border-dashed border-black/20 bg-white px-6 py-10">
            <Text variant="bodyMd" className="text-black/68">
              Search a quote number or access an account to view quote details.
            </Text>
          </div>
        )}
      </div>
    </PageFrame>
  )
}

export default function QuoteHubPage() {
  return (
    <Suspense fallback={null}>
      <QuoteHubPageContent />
    </Suspense>
  )
}

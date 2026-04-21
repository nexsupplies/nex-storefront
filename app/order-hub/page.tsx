'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useEffectEvent, useMemo, useState } from 'react'
import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'
import {
  getRememberedOrderHubEmail,
  listOrderHubOrders,
  prepareOrderPaymentCollection,
  rememberOrderHubEmail,
  type OrderHubOrder,
} from '@/lib/order-hub'

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'saved', label: 'Saved' },
  { id: 'paid', label: 'Paid' },
  { id: 'waiting_quote', label: 'Waiting Quote' },
  { id: 'pending_payment', label: 'Pending Payment' },
  { id: 'payment_failed', label: 'Payment Failed' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
  { id: 'processing', label: 'Processing' },
] as const

type TabId = (typeof tabs)[number]['id']

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

function matchesTab(order: OrderHubOrder, tab: TabId) {
  if (tab === 'all') return true
  if (tab === 'saved') {
    return (
      order.source === 'quote_request' ||
      order.status === 'awaiting_shipping_quote' ||
      order.status === 'quoted_shipping'
    )
  }
  if (tab === 'paid') return order.status === 'paid'
  if (tab === 'waiting_quote') return order.status === 'awaiting_shipping_quote'
  if (tab === 'pending_payment') {
    return order.status === 'pending_payment' || order.status === 'quoted_shipping'
  }
  if (tab === 'payment_failed') return order.status === 'payment_failed'
  if (tab === 'ready') {
    return (
      order.status === 'ready_for_pickup' || order.status === 'ready_for_delivery'
    )
  }
  if (tab === 'completed') return order.status === 'completed'
  if (tab === 'processing') return order.status === 'processing'
  return true
}

function OrderHubPageContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<OrderHubOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [payingId, setPayingId] = useState('')

  const loadInitialOrders = useEffectEvent((nextEmail: string) => {
    void handleLoad(nextEmail)
  })

  useEffect(() => {
    const emailFromQuery = searchParams.get('email')?.trim() || ''
    const initialEmail = emailFromQuery || getRememberedOrderHubEmail()
    setEmail(initialEmail)

    if (initialEmail) {
      loadInitialOrders(initialEmail)
    }
  }, [searchParams])

  async function handleLoad(nextEmail = email) {
    if (!nextEmail.trim()) {
      setMessage('Enter the customer email used at checkout.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      const normalized = nextEmail.trim().toLowerCase()
      rememberOrderHubEmail(normalized)
      const data = await listOrderHubOrders(normalized)
      setOrders(data)

      if (data.length === 0) {
        setMessage('No orders or shipping-quote requests were found for this email yet.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load Order Hub.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePreparePayment(order: OrderHubOrder) {
    try {
      setPayingId(order.id)
      setMessage('')
      await prepareOrderPaymentCollection(order.id, email.trim().toLowerCase())
      setMessage(
        'Online payment is still a placeholder. The order payment collection has been prepared so this entry can become the future payment handoff point.'
      )
      await handleLoad(email)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Failed to prepare the payment entry.'
      )
    } finally {
      setPayingId('')
    }
  }

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesTab(order, activeTab)),
    [orders, activeTab]
  )

  return (
    <PageFrame
      sidebar={
        <PageIntro
          label="Order Hub"
          title="Orders, payment follow-up, and delivery quotes in one place."
          body="Enter the checkout email to view paid orders, pending payment orders, and out-of-city delivery quote requests."
        />
      }
    >
      <div className="rounded-[12px] border border-black/30 bg-white p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@email.com"
            className="min-w-0 flex-1 rounded-xl border px-4 py-3"
          />
          <Button
            type="button"
            onClick={() => void handleLoad()}
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Loading...' : 'Load Order Hub'}
          </Button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Text variant="bodySm" className="text-blue-700">
              {message}
            </Text>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            className="rounded-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-black/30 p-8">
            <Text variant="bodyMd">No entries match this filter.</Text>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <section
              key={`${order.source}-${order.id}`}
              className="rounded-[12px] border border-black/30 bg-white p-6"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Text as="h2" variant="h2Section">
                      {order.reference}
                    </Text>
                    <Text as="span" variant="caption" className="rounded-full border px-3 py-1 text-black/72">
                      {order.status_label}
                    </Text>
                    {order.source === 'quote_request' && (
                      <Text as="span" variant="caption" className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">
                        Quote Request
                      </Text>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <Text variant="muted">Created</Text>
                      <Text variant="bodyMd" className="mt-1 font-semibold text-black">{formatDate(order.created_at)}</Text>
                    </div>
                    <div>
                      <Text variant="muted">Fulfillment</Text>
                      <Text variant="bodyMd" className="mt-1 font-semibold text-black">{order.fulfillment_label}</Text>
                    </div>
                    <div>
                      <Text variant="muted">Quote</Text>
                      <Text variant="bodyMd" className="mt-1 font-semibold text-black">
                        {order.quote_required ? order.status_label : 'Not required'}
                      </Text>
                    </div>
                    <div>
                      <Text variant="muted">Payment</Text>
                      <Text variant="bodyMd" className="mt-1 font-semibold text-black">
                        {order.payment_required ? 'Action required' : 'No action now'}
                      </Text>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <Text variant="bodyMd" className="font-semibold text-black">Items</Text>
                      <div className="mt-2 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-dashed px-4 py-3 text-sm"
                          >
                            <Text variant="bodyMd" className="font-semibold text-black">{item.title}</Text>
                            <Text variant="caption" className="mt-1">
                              {item.variant_title || 'Default variant'}
                            </Text>
                            <Text variant="bodySm" className="mt-1">Qty: {item.quantity}</Text>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-4">
                      <Text variant="bodyMd" className="font-semibold text-black">Order Snapshot</Text>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between gap-4">
                          <Text as="span" variant="muted">Subtotal</Text>
                          <Text as="span" variant="bodySm">{formatPrice(order.subtotal, order.currency_code || 'CAD')}</Text>
                        </div>
                        <div className="flex justify-between gap-4">
                          <Text as="span" variant="muted">Shipping</Text>
                          <Text as="span" variant="bodySm">
                            {order.quote_required && order.quoted_amount == null
                              ? 'TBD'
                              : formatPrice(order.shipping_total, order.currency_code || 'CAD')}
                          </Text>
                        </div>
                        <div className="flex justify-between gap-4">
                          <Text as="span" variant="muted">Tax</Text>
                          <Text as="span" variant="bodySm">{formatPrice(order.tax_total, order.currency_code || 'CAD')}</Text>
                        </div>
                        <div className="flex justify-between gap-4 border-t pt-2">
                          <Text as="span" variant="bodyMd" className="font-semibold text-black">Total</Text>
                          <Text as="span" variant="bodyMd" className="font-semibold text-black">{formatPrice(order.total, order.currency_code || 'CAD')}</Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Text variant="muted">Pickup / Delivery Info</Text>
                      <Text variant="bodyMd" className="mt-1 font-semibold text-black">
                        {order.pickup_location || order.address_summary || '-'}
                      </Text>
                      {order.pickup_date && (
                        <Text variant="bodySm" className="mt-1">
                          {order.pickup_date}
                          {order.pickup_time ? `, ${order.pickup_time}` : ''}
                        </Text>
                      )}
                    </div>

                    <div>
                      <Text variant="muted">Next Step</Text>
                      <Text variant="bodyMd" className="mt-1 font-semibold text-black">
                        {order.status === 'awaiting_shipping_quote' &&
                          'Waiting for our team to send the freight quote.'}
                        {order.status === 'quoted_shipping' &&
                          'Shipping quote is ready. Payment handoff will appear here next.'}
                        {order.status === 'pending_payment' &&
                          'Payment is still outstanding for this order.'}
                        {order.status === 'ready_for_pickup' &&
                          'This order is ready to be picked up.'}
                        {order.status === 'ready_for_delivery' &&
                          'This order is ready for delivery dispatch.'}
                        {order.status === 'processing' && 'We are preparing this order.'}
                        {order.status === 'paid' && 'Payment is completed.'}
                        {order.status === 'completed' && 'Order is completed.'}
                        {order.status === 'payment_failed' &&
                          'Payment needs attention before the order can continue.'}
                      </Text>
                      {order.response_note && (
                        <Text variant="bodySm" className="mt-2 whitespace-pre-wrap">
                          {order.response_note}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-[12px] border border-black/30 p-4">
                  <Text variant="muted" className="font-semibold">Follow-up</Text>
                  <div className="mt-4 space-y-3">
                    {order.can_prepare_payment ? (
                      <Button
                        type="button"
                        onClick={() => void handlePreparePayment(order)}
                        disabled={payingId === order.id}
                        variant="primary"
                        fullWidth
                      >
                        {payingId === order.id
                          ? 'Preparing...'
                          : 'Prepare Online Payment'}
                      </Button>
                    ) : order.source === 'quote_request' &&
                      order.status === 'quoted_shipping' ? (
                      <Button
                        type="button"
                        disabled
                        variant="secondary"
                        fullWidth
                      >
                        Payment Link Coming Soon
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled
                        variant="secondary"
                        fullWidth
                      >
                        No Action Needed
                      </Button>
                    )}

                    <Button href="/products" variant="secondary" fullWidth>
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </PageFrame>
  )
}

export default function OrderHubPage() {
  return (
    <Suspense
      fallback={
        <PageFrame
          sidebar={
            <PageIntro
              label="Order Hub"
              title="Orders, payment follow-up, and delivery quotes in one place."
            />
          }
        >
          <div className="rounded-[12px] border border-black/30 bg-white p-6">
            <Text variant="bodySm">Loading Order Hub...</Text>
          </div>
        </PageFrame>
      }
    >
      <OrderHubPageContent />
    </Suspense>
  )
}

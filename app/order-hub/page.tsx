'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
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

export default function OrderHubPage() {
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
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-gray-500">Order Hub</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Orders, payment follow-up, and delivery quotes in one place.
        </h1>
        <p className="mt-4 text-base text-gray-600">
          Enter the checkout email to view paid orders, pending payment orders, and
          out-of-city delivery quote requests.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@email.com"
            className="min-w-0 flex-1 rounded-xl border px-4 py-3"
          />
          <button
            type="button"
            onClick={() => void handleLoad()}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Load Order Hub'}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-8 text-gray-600">
            No entries match this filter.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <section key={`${order.source}-${order.id}`} className="rounded-3xl border p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">{order.reference}</h2>
                    <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] text-gray-700">
                      {order.status_label}
                    </span>
                    {order.source === 'quote_request' && (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs uppercase tracking-[0.16em] text-amber-800">
                        Quote Request
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <div className="text-gray-500">Created</div>
                      <div className="mt-1 font-medium">{formatDate(order.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Fulfillment</div>
                      <div className="mt-1 font-medium">{order.fulfillment_label}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Quote</div>
                      <div className="mt-1 font-medium">
                        {order.quote_required ? order.status_label : 'Not required'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Payment</div>
                      <div className="mt-1 font-medium">
                        {order.payment_required ? 'Action required' : 'No action now'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <div className="text-sm font-medium">Items</div>
                      <div className="mt-2 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-dashed px-4 py-3 text-sm"
                          >
                            <div className="font-medium">{item.title}</div>
                            <div className="mt-1 text-gray-500">
                              {item.variant_title || 'Default variant'}
                            </div>
                            <div className="mt-1 text-gray-600">Qty: {item.quantity}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                      <div className="font-medium">Order Snapshot</div>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between gap-4">
                          <span>Subtotal</span>
                          <span>{formatPrice(order.subtotal, order.currency_code || 'CAD')}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Shipping</span>
                          <span>
                            {order.quote_required && order.quoted_amount == null
                              ? 'TBD'
                              : formatPrice(order.shipping_total, order.currency_code || 'CAD')}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Tax</span>
                          <span>{formatPrice(order.tax_total, order.currency_code || 'CAD')}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t pt-2 font-semibold">
                          <span>Total</span>
                          <span>{formatPrice(order.total, order.currency_code || 'CAD')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                    <div>
                      <div className="text-gray-500">Pickup / Delivery Info</div>
                      <div className="mt-1 font-medium">
                        {order.pickup_location || order.address_summary || '-'}
                      </div>
                      {order.pickup_date && (
                        <div className="mt-1 text-gray-600">
                          {order.pickup_date}
                          {order.pickup_time ? `, ${order.pickup_time}` : ''}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-gray-500">Next Step</div>
                      <div className="mt-1 font-medium">
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
                      </div>
                      {order.response_note && (
                        <div className="mt-2 whitespace-pre-wrap text-gray-600">
                          {order.response_note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-2xl border p-4">
                  <div className="text-sm font-medium text-gray-500">Follow-up</div>
                  <div className="mt-4 space-y-3">
                    {order.can_prepare_payment ? (
                      <button
                        type="button"
                        onClick={() => void handlePreparePayment(order)}
                        disabled={payingId === order.id}
                        className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60"
                      >
                        {payingId === order.id
                          ? 'Preparing...'
                          : 'Prepare Online Payment'}
                      </button>
                    ) : order.source === 'quote_request' &&
                      order.status === 'quoted_shipping' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl border px-4 py-3 text-gray-500"
                      >
                        Payment Link Coming Soon
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl border px-4 py-3 text-gray-500"
                      >
                        No Action Needed
                      </button>
                    )}

                    <Link
                      href="/products"
                      className="block w-full rounded-xl border px-4 py-3 text-center text-sm"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  )
}

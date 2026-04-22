'use client'

import { useEffect, useMemo, useState } from 'react'
import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Typography'
import {
  buildOrdersPdfDocument,
  buildPickupSlipDocument,
  openPrintDocument,
} from '@/lib/account-documents'
import {
  createCustomerAddress,
  fetchCustomerDashboard,
  getCustomerDisplayName,
  getCustomerToken,
  loginCustomerAccount,
  logoutCustomerAccount,
  registerCustomerAccount,
  type CustomerDashboard,
} from '@/lib/customer-account'
import { getOrCreateCart } from '@/lib/cart'
import type { QuoteHubQuote } from '@/lib/order-hub'

type AuthMode = 'login' | 'register'

type AddressFormState = {
  first_name: string
  last_name: string
  address_1: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone: string
}

function formatPrice(amount?: number | null, currencyCode = 'CAD') {
  if (amount == null) {
    return 'TBD'
  }

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getRecordTitle(record: QuoteHubQuote) {
  return record.source === 'order' ? record.reference : record.quote_number || record.reference
}

function getOrderGroup(record: QuoteHubQuote) {
  switch (record.status) {
    case 'completed':
      return 'completed'
    case 'paid':
    case 'ready_for_pickup':
      return 'pickup'
    case 'ready_for_delivery':
      return 'shipped'
    default:
      return 'awaiting-shipment'
  }
}

function getQuoteGroup(record: QuoteHubQuote) {
  if (record.status === 'pending_payment' || record.payment_required) {
    return 'pending-payment'
  }

  if (record.status === 'quoted_shipping') {
    return 'quoted'
  }

  return 'pending-quote'
}

function StatusPill({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'accent'
}) {
  return (
    <Text
      as="span"
      variant="caption"
      className={`inline-flex rounded-full border px-3 py-1 ${
        tone === 'accent'
          ? 'border-[#1D4DC5]/20 bg-[#1D4DC5]/6 text-[#1D4DC5]'
          : 'border-black/15 bg-black/[0.03] text-black/70'
      }`}
    >
      {label}
    </Text>
  )
}

function RecordCard({
  record,
  selected,
  selectable = false,
  onToggleSelect,
  onPickupPdf,
}: {
  record: QuoteHubQuote
  selected?: boolean
  selectable?: boolean
  onToggleSelect?: (checked: boolean) => void
  onPickupPdf?: () => void
}) {
  return (
    <article className="rounded-[12px] border border-black/20 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Text as="h3" variant="h4CardTitle">
              {getRecordTitle(record)}
            </Text>
            <StatusPill
              label={record.status_label}
              tone={record.payment_required ? 'accent' : 'default'}
            />
          </div>
          {record.source === 'order' && record.quote_number ? (
            <Text variant="bodySm" className="mt-2 text-black/62">
              Quote Number {record.quote_number}
            </Text>
          ) : null}
        </div>

        {selectable ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={(event) => onToggleSelect?.(event.target.checked)}
            />
            <Text variant="caption">Select</Text>
          </label>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Text variant="muted">Submitted</Text>
          <Text variant="bodyMd" className="mt-1 font-semibold text-black">
            {formatDate(record.created_at)}
          </Text>
        </div>
        <div>
          <Text variant="muted">Fulfillment</Text>
          <Text variant="bodyMd" className="mt-1 font-semibold text-black">
            {record.fulfillment_label}
          </Text>
        </div>
        <div>
          <Text variant="muted">Payment</Text>
          <Text variant="bodyMd" className="mt-1 font-semibold text-black">
            {record.payment_method ? record.payment_method.replace(/_/g, ' ') : 'TBD'}
          </Text>
        </div>
        <div>
          <Text variant="muted">Total</Text>
          <Text variant="bodyMd" className="mt-1 font-semibold text-black">
            {formatPrice(record.total, record.currency_code || 'CAD')}
          </Text>
        </div>
      </div>

      <div className="mt-5 border-t border-black/10 pt-4">
        <Text variant="muted">Items</Text>
        <div className="mt-3 space-y-2">
          {record.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Text variant="bodyMd" className="font-semibold text-black">
                  {item.title}
                </Text>
                <Text variant="bodySm" className="text-black/62">
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {record.address_summary || record.pickup_location ? (
          <Text variant="bodySm" className="text-black/62">
            {record.address_summary || record.pickup_location}
          </Text>
        ) : null}
        {onPickupPdf ? (
          <Button type="button" variant="secondary" onClick={onPickupPdf}>
            Export Pickup PDF
          </Button>
        ) : null}
      </div>
    </article>
  )
}

export default function AccountPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [registerFirstName, setRegisterFirstName] = useState('')
  const [registerLastName, setRegisterLastName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerCompany, setRegisterCompany] = useState('')

  const [addressForm, setAddressForm] = useState<AddressFormState>({
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    province: 'AB',
    postal_code: '',
    country_code: 'CA',
    phone: '',
  })

  async function loadDashboard() {
    try {
      setLoading(true)
      setMessage('')
      const data = await fetchCustomerDashboard()
      setDashboard(data)
      setSelectedOrderIds([])
      setAddressForm((current) => ({
        ...current,
        first_name: data.account.first_name || current.first_name,
        last_name: data.account.last_name || current.last_name,
        phone: data.account.phone || current.phone,
      }))
    } catch (error) {
      setDashboard(null)
      setSelectedOrderIds([])
      setMessage(error instanceof Error ? error.message : 'Failed to load account.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!getCustomerToken()) {
      return
    }

    void loadDashboard()
  }, [])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()

    try {
      setLoading(true)
      setMessage('')
      await loginCustomerAccount({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      })
      await getOrCreateCart()
      await loadDashboard()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to sign in.')
      setLoading(false)
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()

    try {
      setLoading(true)
      setMessage('')
      await registerCustomerAccount({
        first_name: registerFirstName.trim(),
        last_name: registerLastName.trim() || undefined,
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
        phone: registerPhone.trim() || undefined,
        company_name: registerCompany.trim() || undefined,
      })
      await getOrCreateCart()
      await loadDashboard()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create account.')
      setLoading(false)
    }
  }

  async function handleAddAddress(event: React.FormEvent) {
    event.preventDefault()

    try {
      setLoading(true)
      setMessage('')
      await createCustomerAddress({
        ...addressForm,
        address_name: 'Project Address',
        is_default_shipping: true,
      })
      await loadDashboard()
      setAddressForm((current) => ({
        ...current,
        address_1: '',
        city: '',
        province: 'AB',
        postal_code: '',
        country_code: 'CA',
      }))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save address.')
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await logoutCustomerAccount()
    setDashboard(null)
    setSelectedOrderIds([])
    setMessage('')
  }

  const orders = dashboard?.orders || []
  const quotes = dashboard?.quotes || []
  const addresses = dashboard?.addresses || []

  const selectedOrders = useMemo(
    () => orders.filter((record) => selectedOrderIds.includes(record.id)),
    [orders, selectedOrderIds]
  )

  const orderGroups = useMemo(
    () => ({
      completed: orders.filter((record) => getOrderGroup(record) === 'completed'),
      pickup: orders.filter((record) => getOrderGroup(record) === 'pickup'),
      awaitingShipment: orders.filter(
        (record) => getOrderGroup(record) === 'awaiting-shipment'
      ),
      shipped: orders.filter((record) => getOrderGroup(record) === 'shipped'),
    }),
    [orders]
  )

  const quoteGroups = useMemo(
    () => ({
      pendingQuote: quotes.filter((record) => getQuoteGroup(record) === 'pending-quote'),
      quoted: quotes.filter((record) => getQuoteGroup(record) === 'quoted'),
      pendingPayment: quotes.filter(
        (record) => getQuoteGroup(record) === 'pending-payment'
      ),
    }),
    [quotes]
  )

  const stats = useMemo(
    () => [
      { label: 'Orders', value: orders.length },
      { label: 'Open Quotes', value: quotes.length },
      { label: 'Saved Addresses', value: addresses.length },
    ],
    [orders.length, quotes.length, addresses.length]
  )

  return (
    <PageFrame
      mergeContent
      contentScroll
      sidebar={
        <div className="flex h-full min-h-0 flex-col">
          <div className="space-y-8">
            <div>
              <Text as="h1" variant="h1Hero">
                Account
              </Text>
              <Text variant="bodyMd" className="mt-3 text-black/64">
                Orders, quotes, addresses, and export files stay under one customer login.
              </Text>
            </div>

            {!dashboard ? (
              <div className="rounded-[12px] border border-black/20 bg-white p-5">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={authMode === 'login' ? 'primary' : 'secondary'}
                    onClick={() => setAuthMode('login')}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === 'register' ? 'primary' : 'secondary'}
                    onClick={() => setAuthMode('register')}
                    className="flex-1"
                  >
                    Register
                  </Button>
                </div>

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="mt-5 grid gap-3">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder="account@email.com"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <Button type="submit" variant="primary" fullWidth disabled={loading}>
                      {loading ? 'Signing In...' : 'Open Account'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="mt-5 grid gap-3">
                    <input
                      type="text"
                      value={registerFirstName}
                      onChange={(event) => setRegisterFirstName(event.target.value)}
                      placeholder="First name"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <input
                      type="text"
                      value={registerLastName}
                      onChange={(event) => setRegisterLastName(event.target.value)}
                      placeholder="Last name"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                    />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                      placeholder="Email"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <input
                      type="text"
                      value={registerPhone}
                      onChange={(event) => setRegisterPhone(event.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                    />
                    <input
                      type="text"
                      value={registerCompany}
                      onChange={(event) => setRegisterCompany(event.target.value)}
                      placeholder="Company"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                    />
                    <Button type="submit" variant="primary" fullWidth disabled={loading}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <div className="rounded-[12px] border border-black/20 bg-white p-5">
                <Text as="h2" variant="h4CardTitle">
                  {getCustomerDisplayName(dashboard.account)}
                </Text>
                <Text variant="bodySm" className="mt-2 text-black/64">
                  {dashboard.account.email}
                </Text>
                {dashboard.account.company_name ? (
                  <Text variant="bodySm" className="mt-1 text-black/64">
                    {dashboard.account.company_name}
                  </Text>
                ) : null}

                <div className="mt-5 grid gap-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between gap-4">
                      <Text variant="muted">{stat.label}</Text>
                      <Text variant="bodyMd" className="font-semibold text-black">
                        {String(stat.value)}
                      </Text>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-black/10 pt-4">
                  <Button type="button" variant="tertiary" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>

          {message ? (
            <div className="mt-6 rounded-[12px] border border-black/15 bg-black/[0.03] px-4 py-3">
              <Text variant="bodySm">{message}</Text>
            </div>
          ) : null}
        </div>
      }
    >
      {!dashboard ? (
        <div className="rounded-[12px] border border-dashed border-black/20 bg-white px-6 py-10">
          <Text variant="bodyMd" className="text-black/68">
            Sign in to view order history, addresses, pending quotes, and export files.
          </Text>
        </div>
      ) : (
        <div className="space-y-10">
          <header className="grid gap-6 border-b border-black/12 pb-8 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(120px,160px))] md:items-end">
            <div>
              <Text as="h2" variant="h2Section">
                Account Overview
              </Text>
              <Text variant="bodyMd" className="mt-3 text-black/64">
                {dashboard.account.email}
              </Text>
            </div>

            {stats.map((stat) => (
              <div key={stat.label}>
                <Text variant="muted">{stat.label}</Text>
                <Text as="div" variant="price" className="mt-2 text-black">
                  {String(stat.value)}
                </Text>
              </div>
            ))}
          </header>

          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Text as="h2" variant="h2Section">
                  Orders History
                </Text>
                <Text variant="bodySm" className="mt-2 text-black/64">
                  Completed, pickup-ready, awaiting shipment, and shipped orders.
                </Text>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  openPrintDocument(
                    'Orders Export',
                    buildOrdersPdfDocument(selectedOrders, dashboard.account)
                  )
                }
                disabled={!selectedOrders.length}
              >
                Export Orders PDF
              </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {[
                { title: 'Completed', records: orderGroups.completed },
                { title: 'Ready for Pickup', records: orderGroups.pickup },
                { title: 'Awaiting Shipment', records: orderGroups.awaitingShipment },
                { title: 'Shipped', records: orderGroups.shipped },
              ].map((group) => (
                <section key={group.title} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Text as="h3" variant="h4CardTitle">
                      {group.title}
                    </Text>
                    <StatusPill label={`${group.records.length}`} />
                  </div>

                  {group.records.length > 0 ? (
                    <div className="space-y-4">
                      {group.records.map((record) => (
                        <RecordCard
                          key={record.id}
                          record={record}
                          selectable
                          selected={selectedOrderIds.includes(record.id)}
                          onToggleSelect={(checked) =>
                            setSelectedOrderIds((current) =>
                              checked
                                ? [...current, record.id]
                                : current.filter((id) => id !== record.id)
                            )
                          }
                          onPickupPdf={
                            record.fulfillment_mode === 'pickup'
                              ? () =>
                                  openPrintDocument(
                                    `${getRecordTitle(record)} Pickup Slip`,
                                    buildPickupSlipDocument(record, dashboard.account)
                                  )
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[12px] border border-dashed border-black/20 bg-white px-5 py-6">
                      <Text variant="bodySm" className="text-black/62">
                        No orders in this group yet.
                      </Text>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>

          <section className="grid gap-8 border-t border-black/12 pt-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <div>
                <Text as="h2" variant="h2Section">
                  Addresses
                </Text>
                <Text variant="bodySm" className="mt-2 text-black/64">
                  Saved delivery and pickup destinations tied to your account.
                </Text>
              </div>

              <form onSubmit={handleAddAddress} className="rounded-[12px] border border-black/20 bg-white p-5">
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={addressForm.first_name}
                    onChange={(event) =>
                      setAddressForm((current) => ({ ...current, first_name: event.target.value }))
                    }
                    placeholder="First name"
                    className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                    required
                  />
                  <input
                    type="text"
                    value={addressForm.last_name}
                    onChange={(event) =>
                      setAddressForm((current) => ({ ...current, last_name: event.target.value }))
                    }
                    placeholder="Last name"
                    className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                  />
                  <input
                    type="text"
                    value={addressForm.address_1}
                    onChange={(event) =>
                      setAddressForm((current) => ({ ...current, address_1: event.target.value }))
                    }
                    placeholder="Address"
                    className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                    required
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, city: event.target.value }))
                      }
                      placeholder="City"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <input
                      type="text"
                      value={addressForm.province}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, province: event.target.value }))
                      }
                      placeholder="Province"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, postal_code: event.target.value }))
                      }
                      placeholder="Postal code"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                      required
                    />
                    <input
                      type="text"
                      value={addressForm.phone}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      placeholder="Phone"
                      className="w-full rounded-[12px] border border-black/20 px-4 py-3 outline-none transition focus:border-black"
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={loading}>
                    {loading ? 'Saving...' : 'Add Address'}
                  </Button>
                </div>
              </form>

              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <article
                      key={address.id}
                      className="rounded-[12px] border border-black/20 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Text as="h3" variant="h4CardTitle">
                            {address.label}
                          </Text>
                          <Text variant="bodyMd" className="mt-3 text-black">
                            {address.summary}
                          </Text>
                        </div>
                        <StatusPill
                          label={
                            address.fulfillment_mode === 'pickup' ? 'Pickup' : 'Delivery'
                          }
                        />
                      </div>
                      <Text variant="bodySm" className="mt-4 text-black/62">
                        Last used {formatDate(address.last_used_at)}
                      </Text>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[12px] border border-dashed border-black/20 bg-white px-5 py-6">
                  <Text variant="bodySm" className="text-black/62">
                    No saved addresses yet.
                  </Text>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Text as="h2" variant="h2Section">
                  Quote Records
                </Text>
                <Text variant="bodySm" className="mt-2 text-black/64">
                  Pending quotes, quoted records, and payment-ready quotes stay here until payment clears.
                </Text>
              </div>

              {[
                { title: 'Pending Quote', records: quoteGroups.pendingQuote },
                { title: 'Quoted', records: quoteGroups.quoted },
                { title: 'Pending Payment', records: quoteGroups.pendingPayment },
              ].map((group) => (
                <section key={group.title} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Text as="h3" variant="h4CardTitle">
                      {group.title}
                    </Text>
                    <StatusPill label={`${group.records.length}`} />
                  </div>

                  {group.records.length > 0 ? (
                    <div className="space-y-4">
                      {group.records.map((record) => (
                        <RecordCard key={record.id} record={record} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[12px] border border-dashed border-black/20 bg-white px-5 py-6">
                      <Text variant="bodySm" className="text-black/62">
                        No quote records in this group.
                      </Text>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageFrame>
  )
}

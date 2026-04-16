'use client'

import { startTransition, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addShippingMethod,
  clearStoredCartId,
  completeCart,
  createPaymentCollection,
  getOrCreateCart,
  initiatePaymentSession,
  listPaymentProviders,
  listShippingOptions,
  retrieveCart,
  updateCart,
} from '@/lib/cart'
import { createQuoteRequest, rememberOrderHubEmail } from '@/lib/order-hub'

type CartLineItem = {
  id: string
  title: string
  quantity: number
  variant_id?: string | null
  unit_price?: number
  subtotal?: number
  thumbnail?: string | null
  variant_title?: string | null
  product_title?: string | null
  product_handle?: string | null
}

type CartShippingMethod = {
  id: string
  amount?: number
  shipping_option_id?: string | null
}

type MedusaCart = {
  id: string
  items: CartLineItem[]
  subtotal?: number
  total?: number
  shipping_total?: number
  currency_code?: string
  email?: string | null
  region_id?: string
  shipping_methods?: CartShippingMethod[]
}

type ShippingOption = {
  id: string
  name: string
  amount?: number | null
  calculated_price?: {
    calculated_amount?: number | null
  } | null
}

type PaymentProvider = {
  id: string
  is_enabled: boolean
}

type ShippingMethodDefinition = {
  id: string
  label: string
  backendName?: string
  expectedCity?: string | null
}

type ResolvedShippingMethod = ShippingMethodDefinition & {
  fee: number | null
  optionId: string | null
}

type PickupSlotId = 'morning' | 'afternoon'

type PickupSlot = {
  id: PickupSlotId
  label: string
  window: string
}

const shippingMethodDefinitions: ShippingMethodDefinition[] = [
  {
    id: 'pickup',
    label: 'Local Pickup',
    backendName: 'Local Pick-up',
    expectedCity: null,
  },
  {
    id: 'edmonton',
    label: 'Edmonton Delivery',
    backendName: 'Edmonton Delivery',
    expectedCity: 'edmonton',
  },
  {
    id: 'stalbert',
    label: 'St. Albert Delivery',
    backendName: 'St. Albert Delivery',
    expectedCity: 'st. albert',
  },
  {
    id: 'sherwood',
    label: 'Sherwood Park Delivery',
    backendName: 'Sherwood Park Delivery',
    expectedCity: 'sherwood park',
  },
  {
    id: 'leduc',
    label: 'Leduc Delivery',
    backendName: 'Leduc Delivery',
    expectedCity: 'leduc',
  },
  {
    id: 'outcity',
    label: 'Out-of-City Delivery',
    expectedCity: null,
  },
]

const pickupSlots: PickupSlot[] = [
  {
    id: 'morning',
    label: 'Morning',
    window: '9:30am - 12:00pm',
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    window: '12:30pm - 5:30pm',
  },
]

const PICKUP_LOCATION = {
  company: 'NEX Supplies',
  address1: '3575 97 St NW',
  city: 'Edmonton',
  province: 'AB',
  postalCode: 'T6E 5S7',
  countryCode: 'ca',
  hours: 'Monday - Friday 9:30am - 5:30pm',
}

const PICKUP_TIMEZONE = 'America/Edmonton'
const GST_RATE = 0.05
const MORNING_CUTOFF_MINUTES = 9 * 60 + 30
const AFTERNOON_CUTOFF_MINUTES = 12 * 60 + 30

function formatPrice(amount?: number, currencyCode = 'CAD') {
  if (amount == null) return 'Price unavailable'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}

function normalizeCity(value: string) {
  return value.trim().toLowerCase()
}

function getShippingOptionAmount(option: ShippingOption) {
  if (typeof option.amount === 'number') {
    return option.amount
  }

  if (typeof option.calculated_price?.calculated_amount === 'number') {
    return option.calculated_price.calculated_amount
  }

  return null
}

function splitName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }

  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

function padNumber(value: number) {
  return String(value).padStart(2, '0')
}

function getEdmontonDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PICKUP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value || ''

  return {
    year: Number(getPart('year')),
    month: Number(getPart('month')),
    day: Number(getPart('day')),
    hour: Number(getPart('hour')),
    minute: Number(getPart('minute')),
  }
}

function getEdmontonTodayString(date = new Date()) {
  const parts = getEdmontonDateParts(date)
  return `${parts.year}-${padNumber(parts.month)}-${padNumber(parts.day)}`
}

function getEdmontonMinutes(date = new Date()) {
  const parts = getEdmontonDateParts(date)
  return parts.hour * 60 + parts.minute
}

function isBusinessDay(dateString: string) {
  if (!dateString) {
    return false
  }

  const date = new Date(`${dateString}T12:00:00`)
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function getNextBusinessDate(dateString: string) {
  let candidate = addDays(dateString, 1)

  while (!isBusinessDay(candidate)) {
    candidate = addDays(candidate, 1)
  }

  return candidate
}

function getEarliestPickupDate(now = new Date()) {
  const today = getEdmontonTodayString(now)

  if (!isBusinessDay(today)) {
    return getNextBusinessDate(today)
  }

  return getEdmontonMinutes(now) < AFTERNOON_CUTOFF_MINUTES
    ? today
    : getNextBusinessDate(today)
}

function getAvailablePickupSlots(pickupDate: string, now = new Date()) {
  if (!pickupDate || !isBusinessDay(pickupDate)) {
    return []
  }

  const today = getEdmontonTodayString(now)

  if (pickupDate < today) {
    return []
  }

  if (pickupDate > today) {
    return pickupSlots
  }

  const currentMinutes = getEdmontonMinutes(now)

  if (currentMinutes < MORNING_CUTOFF_MINUTES) {
    return pickupSlots
  }

  if (currentMinutes < AFTERNOON_CUTOFF_MINUTES) {
    return pickupSlots.filter((slot) => slot.id === 'afternoon')
  }

  return []
}

function formatPickupSlot(slotId: PickupSlotId | '') {
  const slot = pickupSlots.find((entry) => entry.id === slotId)
  return slot ? `${slot.label} (${slot.window})` : ''
}

function formatDateLabel(dateString: string) {
  if (!dateString) {
    return ''
  }

  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateString}T12:00:00`))
}

export default function CheckoutPage() {
  const router = useRouter()

  const [cart, setCart] = useState<MedusaCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [shippingOptions, setShippingOptions] = useState<
    Record<string, { fee: number | null; optionId: string | null }>
  >({})

  const [shippingMethod, setShippingMethod] = useState('pickup')
  const [paymentMethod, setPaymentMethod] = useState('pickup-pay')

  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState<PickupSlotId | ''>('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('AB')
  const [postalCode, setPostalCode] = useState('')

  const earliestPickupDate = useMemo(() => getEarliestPickupDate(), [])

  function hydrateShippingOptions(options: ShippingOption[]) {
    const nextState = shippingMethodDefinitions.reduce<
      Record<string, { fee: number | null; optionId: string | null }>
    >((acc, definition) => {
      const option = definition.backendName
        ? options.find((entry) => entry.name === definition.backendName)
        : null

      acc[definition.id] = {
        fee: option ? getShippingOptionAmount(option) : null,
        optionId: option?.id ?? null,
      }

      return acc
    }, {})

    setShippingOptions(nextState)
  }

  async function refreshShippingOptions(cartId: string) {
    const options = (await listShippingOptions(cartId)) as ShippingOption[]
    hydrateShippingOptions(options)
  }

  const loadCart = useEffectEvent(async () => {
    try {
      setLoading(true)
      const cartId = await getOrCreateCart()
      const [data] = await Promise.all([retrieveCart(cartId), refreshShippingOptions(cartId)])
      setCart(data)

      if (data?.email) {
        setEmail(data.email)
      }
    } catch (error) {
      console.error('loadCart error:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to load cart.')
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    void loadCart()
  }, [])

  useEffect(() => {
    if (shippingMethod !== 'pickup') {
      return
    }

    if (!pickupDate) {
      setPickupDate(earliestPickupDate)
    }
  }, [shippingMethod, pickupDate, earliestPickupDate])

  useEffect(() => {
    if (shippingMethod !== 'pickup' && paymentMethod !== 'online') {
      setPaymentMethod('online')
      return
    }

    if (shippingMethod === 'pickup' && !paymentMethod) {
      setPaymentMethod('pickup-pay')
    }
  }, [shippingMethod, paymentMethod])

  const availablePickupSlots = useMemo(() => {
    return getAvailablePickupSlots(pickupDate)
  }, [pickupDate])

  useEffect(() => {
    if (shippingMethod !== 'pickup') {
      return
    }

    if (!pickupTime && availablePickupSlots.length === 1) {
      setPickupTime(availablePickupSlots[0].id)
      return
    }

    if (pickupTime && !availablePickupSlots.some((slot) => slot.id === pickupTime)) {
      setPickupTime('')
    }
  }, [shippingMethod, pickupTime, availablePickupSlots])

  const shippingMethods = useMemo<ResolvedShippingMethod[]>(() => {
    return shippingMethodDefinitions.map((definition) => ({
      ...definition,
      fee: shippingOptions[definition.id]?.fee ?? null,
      optionId: shippingOptions[definition.id]?.optionId ?? null,
    }))
  }, [shippingOptions])

  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethod)
  const shippingFee = selectedShipping?.fee
  const cartCurrency = cart?.currency_code?.toUpperCase() || 'CAD'

  const subtotal = useMemo(() => {
    return cart?.subtotal ?? 0
  }, [cart])

  const taxableBase = shippingFee == null ? subtotal : subtotal + shippingFee
  const estimatedTax = useMemo(() => Math.round(taxableBase * GST_RATE), [taxableBase])

  const total = useMemo(() => {
    if (shippingFee == null) {
      return subtotal + estimatedTax
    }
    return subtotal + shippingFee + estimatedTax
  }, [subtotal, shippingFee, estimatedTax])

  const isPickup = shippingMethod === 'pickup'
  const isOutOfCity = shippingMethod === 'outcity'
  const isDelivery = !isPickup

  const expectedCity = selectedShipping?.expectedCity ?? null
  const cityMatches =
    !expectedCity ||
    normalizeCity(city) === expectedCity ||
    (expectedCity === 'st. albert' && normalizeCity(city) === 'st albert')

  function getValidationMessage() {
    if (!cart) {
      return 'Cart not found.'
    }

    if (cart.items.length === 0) {
      return 'Your cart is empty.'
    }

    if (!fullName || !email || !phone) {
      return 'Please fill in full name, email, and phone.'
    }

    if (isPickup) {
      if (!pickupDate) {
        return 'Please select a pickup date.'
      }

      if (!isBusinessDay(pickupDate)) {
        return 'Pickup is only available Monday through Friday.'
      }

      if (availablePickupSlots.length === 0) {
        const fallbackDate = pickupDate ? getNextBusinessDate(pickupDate) : earliestPickupDate
        return `No pickup windows remain for ${formatDateLabel(pickupDate)}. Please choose ${formatDateLabel(fallbackDate)} or later.`
      }

      if (!pickupTime) {
        return 'Please select a pickup window.'
      }
    }

    if (isDelivery) {
      if (!street || !city || !province || !postalCode) {
        return 'Please complete the delivery address.'
      }

      if (expectedCity && !cityMatches) {
        return `This shipping method is intended for ${expectedCity}. Please update the city or select Out-of-City Delivery.`
      }
    }

    if (!isOutOfCity && !selectedShipping?.optionId) {
      return 'The selected shipping method is not available for this cart.'
    }

    return null
  }

  async function persistCheckoutDetails() {
    const validationMessage = getValidationMessage()

    if (validationMessage) {
      throw new Error(validationMessage)
    }

    if (!cart) {
      throw new Error('Cart not found.')
    }

    const { firstName, lastName } = splitName(fullName)
    const pickupWindow = formatPickupSlot(pickupTime)

    const address = isDelivery
      ? {
          first_name: firstName,
          last_name: lastName,
          phone,
          address_1: street,
          city,
          province,
          postal_code: postalCode,
          country_code: 'ca',
        }
      : {
          first_name: firstName,
          last_name: lastName,
          phone,
          address_1: PICKUP_LOCATION.address1,
          city: PICKUP_LOCATION.city,
          province: PICKUP_LOCATION.province,
          postal_code: PICKUP_LOCATION.postalCode,
          country_code: PICKUP_LOCATION.countryCode,
        }

    const updatedCart = await updateCart(cart.id, {
      email,
      shipping_address: address,
      billing_address: address,
      metadata: {
        fulfillment_mode: isPickup ? 'pickup' : 'delivery',
        shipping_method: shippingMethod,
        payment_method: isOutOfCity ? 'online' : paymentMethod,
        order_hub_status: isOutOfCity
          ? 'awaiting_shipping_quote'
          : paymentMethod === 'online'
          ? 'pending_payment'
          : 'processing',
        pickup_date: isPickup ? pickupDate : null,
        pickup_slot: isPickup ? pickupTime : null,
        pickup_time: isPickup ? pickupWindow : null,
        pickup_time_window: isPickup ? pickupWindow : null,
        pickup_location: isPickup
          ? `${PICKUP_LOCATION.address1}, ${PICKUP_LOCATION.city}, ${PICKUP_LOCATION.province} ${PICKUP_LOCATION.postalCode}`
          : null,
        shipping_quote_required: isOutOfCity,
        shipping_quote_status: isOutOfCity ? 'awaiting' : null,
      },
    })

    let finalCart = updatedCart

    if (selectedShipping?.optionId) {
      const existingShippingMethods = updatedCart.shipping_methods as
        | CartShippingMethod[]
        | undefined
      const hasSelectedShippingMethod = existingShippingMethods?.some(
        (method: CartShippingMethod) =>
          method.shipping_option_id === selectedShipping.optionId
      )

      if (!hasSelectedShippingMethod) {
        finalCart = await addShippingMethod(updatedCart.id, selectedShipping.optionId)
      }
    }

    await refreshShippingOptions(finalCart.id)
    setCart(finalCart)
    return finalCart
  }

  async function handleSaveCheckout() {
    try {
      setSaving(true)
      setMessage('')

      await persistCheckoutDetails()

      const successMsg = isOutOfCity
        ? 'Checkout details saved. This order will require a shipping quote before payment.'
        : 'Checkout details and shipping method saved to cart.'

      setMessage(successMsg)
    } catch (error) {
      console.error('handleSaveCheckout error:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to save checkout details.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteManualOrder() {
    try {
      if (isOutOfCity) {
        throw new Error('Use Request Shipping Quote for out-of-city delivery.')
      }

      setPlacingOrder(true)
      setMessage('')

      const preparedCart = await persistCheckoutDetails()
      const providers = (await listPaymentProviders(
        preparedCart.region_id || ''
      )) as PaymentProvider[]
      const providerId =
        providers.find((provider) => provider.id === 'pp_system_default')?.id ||
        providers[0]?.id

      if (!providerId) {
        throw new Error('No payment provider is enabled for this region.')
      }

      const paymentCollection = await createPaymentCollection(preparedCart.id)
      await initiatePaymentSession(paymentCollection.id, providerId, {
        payment_method: paymentMethod,
        is_manual_order: paymentMethod === 'pickup-pay',
        is_online_placeholder: paymentMethod === 'online',
      })

      const completion = await completeCart(preparedCart.id)

      if (completion.type === 'cart') {
        const errorMessage =
          typeof completion.error === 'string'
            ? completion.error
            : completion.error?.message

        throw new Error(errorMessage || 'Medusa could not complete this cart.')
      }

      if (!completion.order?.id) {
        throw new Error('Cart completed without an order ID.')
      }

      clearStoredCartId()
      rememberOrderHubEmail(email.trim().toLowerCase())

      const params = new URLSearchParams({
        order_id: completion.order.id,
        display_id: String(completion.order.display_id ?? ''),
        email,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        fulfillment_mode: isPickup ? 'pickup' : 'delivery',
        pickup_date: isPickup ? pickupDate : '',
        pickup_time: isPickup ? formatPickupSlot(pickupTime) : '',
      })

      startTransition(() => {
        router.push(`/checkout/success?${params.toString()}`)
      })
    } catch (error) {
      console.error('handleCompleteManualOrder error:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to create the manual order.'
      )
    } finally {
      setPlacingOrder(false)
    }
  }

  async function handleRequestShippingQuote() {
    try {
      setPlacingOrder(true)
      setMessage('')

      const preparedCart = await persistCheckoutDetails()
      const quoteItems = preparedCart.items.map((item) => {
        if (!item.variant_id) {
          throw new Error('One of the cart items is missing a variant reference.')
        }

        return {
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price:
            item.unit_price != null
              ? item.unit_price
              : item.subtotal != null
                ? Math.round(item.subtotal / item.quantity)
                : null,
        }
      })

      const response = await createQuoteRequest({
        request_type: 'out_of_city_delivery',
        customer: {
          name: fullName,
          email,
          phone,
          company: null,
        },
        checkout: {
          fulfillment_mode: 'delivery',
          shipping_method: shippingMethod,
          payment_method: 'online',
          region_id: preparedCart.region_id || null,
          currency_code: cartCurrency,
          subtotal,
          shipping_total: null,
          tax_total: estimatedTax,
          total,
          delivery_address: {
            address_1: street,
            city,
            province,
            postal_code: postalCode,
            country_code: 'ca',
          },
        },
        items: quoteItems,
      })

      clearStoredCartId()
      rememberOrderHubEmail(email.trim().toLowerCase())

      const quoteId = response?.quote_request?.id
      const params = new URLSearchParams({
        email: email.trim().toLowerCase(),
      })

      if (quoteId) {
        params.set('quote_id', quoteId)
      }

      startTransition(() => {
        router.push(`/checkout/quote-success?${params.toString()}`)
      })
    } catch (error) {
      console.error('handleRequestShippingQuote error:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to send the shipping quote request.'
      )
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <p>Loading checkout...</p>
      </main>
    )
  }

  const items = cart?.items || []
  const isBusy = saving || placingOrder
  const canCreateManualOrder = !isOutOfCity && items.length > 0

  return (
    <main className="max-w-7xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {message && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
        <div>
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

              <div className="space-y-4">
                <input
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border p-3 rounded"
                />

                <input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border p-3 rounded"
                />

                <input
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border p-3 rounded"
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Shipping Method</h2>

              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className="flex justify-between border p-4 rounded cursor-pointer"
                  >
                    <div>
                      <input
                        type="radio"
                        checked={shippingMethod === method.id}
                        onChange={() => setShippingMethod(method.id)}
                      />
                      <span className="ml-3">{method.label}</span>
                    </div>

                    <span>
                      {method.fee == null ? 'TBD' : formatPrice(method.fee, cartCurrency)}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {isPickup && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Pickup Details</h2>

                <div className="border rounded-xl p-4 bg-gray-50 mb-4">
                  <p className="font-medium">Pickup Address</p>
                  <p className="text-sm text-gray-600 mt-1">{PICKUP_LOCATION.company}</p>
                  <p className="text-sm text-gray-600">
                    {PICKUP_LOCATION.address1}, {PICKUP_LOCATION.city}, {PICKUP_LOCATION.province}{' '}
                    {PICKUP_LOCATION.postalCode}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{PICKUP_LOCATION.hours}</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="date"
                    value={pickupDate}
                    min={getEdmontonTodayString()}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full border p-3 rounded"
                  />

                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value as PickupSlotId | '')}
                    className="w-full border p-3 rounded"
                    disabled={availablePickupSlots.length === 0}
                  >
                    <option value="">Select Pickup Window</option>
                    {availablePickupSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} ({slot.window})
                      </option>
                    ))}
                  </select>
                </div>

                {!isBusinessDay(pickupDate) && pickupDate && (
                  <p className="text-sm text-red-600 mt-3">
                    Pickup is only available Monday through Friday.
                  </p>
                )}

                {isBusinessDay(pickupDate) && availablePickupSlots.length === 0 && (
                  <p className="text-sm text-amber-700 mt-3">
                    No pickup windows remain for {formatDateLabel(pickupDate)}. Please
                    choose {formatDateLabel(getNextBusinessDate(pickupDate))} or later.
                  </p>
                )}

                {availablePickupSlots.length === 1 && pickupDate === getEdmontonTodayString() && (
                  <p className="text-sm text-gray-600 mt-3">
                    Morning pickup has closed for today. Afternoon remains available.
                  </p>
                )}
              </section>
            )}

            {isDelivery && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>

                <div className="space-y-4">
                  <input
                    placeholder="Street Address"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full border p-3 rounded"
                  />

                  <input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border p-3 rounded"
                  />

                  <input
                    placeholder="Province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full border p-3 rounded"
                  />

                  <input
                    placeholder="Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full border p-3 rounded"
                  />
                </div>

                {expectedCity && city && !cityMatches && (
                  <p className="text-sm text-red-600 mt-3">
                    This shipping method is intended for {expectedCity}. Please update the
                    city or select Out-of-City Delivery.
                  </p>
                )}

                {isOutOfCity && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm text-amber-900">
                      We’ll review your delivery address and provide a shipping quote as
                      soon as possible. The shipping fee will be updated by email, and
                      you’ll also be able to review the quote and complete payment later
                      in your Order Hub.
                    </p>
                  </div>
                )}
              </section>
            )}

          </div>
        </div>

        <aside className="lg:sticky lg:top-8 self-start">
          <div className="border rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="border p-4 rounded">
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="border p-4 rounded">
                      <p className="font-medium">{item.product_title || item.title}</p>
                      <p className="text-sm text-gray-500">
                        {item.variant_title || 'Default variant'}
                      </p>
                      <p className="text-sm mt-2">Qty: {item.quantity}</p>
                      <p className="text-sm mt-1">
                        Line Total: {formatPrice(item.subtotal, cartCurrency)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t pt-6 space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, cartCurrency)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shippingFee == null ? 'TBD' : formatPrice(shippingFee, cartCurrency)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span>
                  {shippingFee == null
                    ? `${formatPrice(estimatedTax, cartCurrency)} (estimated)`
                    : formatPrice(estimatedTax, cartCurrency)}
                </span>
              </div>

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  {shippingFee == null
                    ? `${formatPrice(total, cartCurrency)} (shipping TBD)`
                    : formatPrice(total, cartCurrency)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border p-4">
                <h3 className="text-base font-semibold">Payment Method</h3>
                {isOutOfCity ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Out-of-city delivery is quoted first. Payment will happen after the
                    shipping quote is approved.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label className="block rounded-xl border p-4">
                      <input
                        type="radio"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                      />
                      <span className="ml-3">Online Payment</span>
                    </label>

                    {isPickup && (
                      <label className="block rounded-xl border p-4">
                        <input
                          type="radio"
                          checked={paymentMethod === 'pickup-pay'}
                          onChange={() => setPaymentMethod('pickup-pay')}
                        />
                        <span className="ml-3">Pay at Pickup</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={isOutOfCity ? handleRequestShippingQuote : handleCompleteManualOrder}
                disabled={isBusy}
                className="w-full bg-black text-white py-4 rounded text-lg disabled:opacity-60"
              >
                {placingOrder
                  ? isOutOfCity
                    ? 'Sending Quote Request...'
                    : 'Creating Order...'
                  : isOutOfCity
                  ? 'Request Shipping Quote'
                  : paymentMethod === 'online'
                  ? 'Place Order and Continue to Payment'
                  : 'Place Order and Pay at Pickup'}
              </button>

              {!isOutOfCity && (
                <button
                  type="button"
                  onClick={handleSaveCheckout}
                  disabled={isBusy || !canCreateManualOrder}
                  className="w-full border border-black py-4 rounded text-lg disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Checkout Details'}
                </button>
              )}

              {paymentMethod === 'online' && !isOutOfCity && (
                <p className="text-sm text-gray-600">
                  Online payment is still a placeholder. This will still create the
                  order and surface the payment follow-up in Order Hub.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

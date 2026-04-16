import Link from 'next/link'

const PICKUP_LOCATION = {
  company: 'NEX Supplies',
  address: '3575 97 St NW, Edmonton, AB T6E 5S7',
  hours: 'Monday - Friday 9:30am - 5:30pm',
}

function readParam(
  value: string | string[] | undefined,
  fallback = ''
) {
  if (Array.isArray(value)) {
    return value[0] || fallback
  }

  return value || fallback
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

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  const orderId = readParam(params.order_id)
  const displayId = readParam(params.display_id)
  const email = readParam(params.email)
  const fulfillmentMode = readParam(params.fulfillment_mode)
  const pickupDate = readParam(params.pickup_date)
  const pickupTime = readParam(params.pickup_time)
  const shippingMethod = readParam(params.shipping_method)
  const paymentMethod = readParam(params.payment_method)

  const orderLabel = displayId ? `#${displayId}` : orderId
  const isPickup = fulfillmentMode === 'pickup'
  const isPaymentPending = paymentMethod === 'online'

  return (
    <main className="max-w-4xl mx-auto px-8 py-14">
      <div className="rounded-3xl border p-8 md:p-10">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
            Order Confirmed
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {orderLabel ? `Order ${orderLabel} created successfully.` : 'Order created successfully.'}
          </h1>
          <p className="mt-4 text-base text-gray-600">
            {isPaymentPending
              ? `Your order has been created and is waiting for online payment follow-up.`
              : email
              ? `A confirmation has been prepared for ${email}.`
              : 'Your order has been created successfully in Medusa.'}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border p-6">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Order</span>
                <br />
                <span className="font-medium">{orderLabel || '-'}</span>
              </p>
              <p>
                <span className="text-gray-500">Fulfillment</span>
                <br />
                <span className="font-medium capitalize">
                  {fulfillmentMode || shippingMethod || '-'}
                </span>
              </p>
              {email && (
                <p>
                  <span className="text-gray-500">Email</span>
                  <br />
                  <span className="font-medium">{email}</span>
                </p>
              )}
              <p>
                <span className="text-gray-500">Payment</span>
                <br />
                <span className="font-medium">
                  {paymentMethod === 'online' ? 'Online payment follow-up' : 'Pay at pickup'}
                </span>
              </p>
            </div>
          </section>

          {isPickup ? (
            <section className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">Pickup Details</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  <span className="text-gray-500">Location</span>
                  <br />
                  <span className="font-medium">{PICKUP_LOCATION.company}</span>
                  <br />
                  <span>{PICKUP_LOCATION.address}</span>
                </p>
                <p>
                  <span className="text-gray-500">Hours</span>
                  <br />
                  <span className="font-medium">{PICKUP_LOCATION.hours}</span>
                </p>
                {pickupDate && (
                  <p>
                    <span className="text-gray-500">Pickup Date</span>
                    <br />
                    <span className="font-medium">{formatDateLabel(pickupDate)}</span>
                  </p>
                )}
                {pickupTime && (
                  <p>
                    <span className="text-gray-500">Pickup Window</span>
                    <br />
                    <span className="font-medium">{pickupTime}</span>
                  </p>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold">What Happens Next</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>Your order is now visible in the Medusa admin.</p>
                <p>Use the admin order details page to continue fulfillment and payment handling.</p>
              </div>
            </section>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Continue Shopping
          </Link>
          {email && (
            <Link
              href={`/order-hub?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium"
            >
              Open Order Hub
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}

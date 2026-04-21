import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'

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
    <PageFrame
      sidebar={
        <PageIntro
          label="Order Confirmed"
          title={
            orderLabel
              ? `Order ${orderLabel} created successfully.`
              : 'Order created successfully.'
          }
        />
      }
    >
      <div className="max-w-2xl">
        <Text variant="bodyMd">
          {isPaymentPending
            ? `Your order has been created and is waiting for online payment follow-up.`
            : email
            ? `A confirmation has been prepared for ${email}.`
            : 'Your order has been created successfully in Medusa.'}
        </Text>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-[12px] border border-black/30 bg-white p-6">
          <Text as="h2" variant="h2Section">
            Order Details
          </Text>
          <div className="mt-4 space-y-3">
            <p>
              <Text as="span" variant="muted">Order</Text>
              <br />
              <Text as="span" variant="bodyMd" className="font-semibold text-black">{orderLabel || '-'}</Text>
            </p>
            <p>
              <Text as="span" variant="muted">Fulfillment</Text>
              <br />
              <Text as="span" variant="bodyMd" className="font-semibold capitalize text-black">
                {fulfillmentMode || shippingMethod || '-'}
              </Text>
            </p>
            {email && (
              <p>
                <Text as="span" variant="muted">Email</Text>
                <br />
                <Text as="span" variant="bodyMd" className="font-semibold text-black">{email}</Text>
              </p>
            )}
            <p>
              <Text as="span" variant="muted">Payment</Text>
              <br />
              <Text as="span" variant="bodyMd" className="font-semibold text-black">
                {paymentMethod === 'online' ? 'Online payment follow-up' : 'Pay at pickup'}
              </Text>
            </p>
          </div>
        </section>

        {isPickup ? (
          <section className="rounded-[12px] border border-black/30 bg-white p-6">
            <Text as="h2" variant="h2Section">
              Pickup Details
            </Text>
            <div className="mt-4 space-y-3">
              <p>
                <Text as="span" variant="muted">Location</Text>
                <br />
                <Text as="span" variant="bodyMd" className="font-semibold text-black">{PICKUP_LOCATION.company}</Text>
                <br />
                <Text as="span" variant="bodySm">{PICKUP_LOCATION.address}</Text>
              </p>
              <p>
                <Text as="span" variant="muted">Hours</Text>
                <br />
                <Text as="span" variant="bodyMd" className="font-semibold text-black">{PICKUP_LOCATION.hours}</Text>
              </p>
              {pickupDate && (
                <p>
                  <Text as="span" variant="muted">Pickup Date</Text>
                  <br />
                  <Text as="span" variant="bodyMd" className="font-semibold text-black">{formatDateLabel(pickupDate)}</Text>
                </p>
              )}
              {pickupTime && (
                <p>
                  <Text as="span" variant="muted">Pickup Window</Text>
                  <br />
                  <Text as="span" variant="bodyMd" className="font-semibold text-black">{pickupTime}</Text>
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-[12px] border border-black/30 bg-white p-6">
            <Text as="h2" variant="h2Section">
              What Happens Next
            </Text>
            <div className="mt-4 space-y-3">
              <Text variant="bodySm">Your order is now visible in the Medusa admin.</Text>
              <Text variant="bodySm">
                Use the admin order details page to continue fulfillment and payment handling.
              </Text>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/products" variant="primary">
          Continue Shopping
        </Button>
        {email && (
          <Button
            href={`/order-hub?email=${encodeURIComponent(email)}`}
            variant="secondary"
          >
            Open Order Hub
          </Button>
        )}
      </div>
    </PageFrame>
  )
}

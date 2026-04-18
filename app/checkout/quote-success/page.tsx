import Link from 'next/link'
import PageFrame from '@/components/PageFrame'

function readParam(
  value: string | string[] | undefined,
  fallback = ''
) {
  if (Array.isArray(value)) {
    return value[0] || fallback
  }

  return value || fallback
}

export default async function QuoteSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const email = readParam(params.email)
  const quoteId = readParam(params.quote_id)

  return (
    <PageFrame
      sidebar={
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            Shipping Quote Requested
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Your out-of-city delivery request was submitted successfully.
          </h1>
        </div>
      }
    >
      <p className="max-w-2xl text-base text-gray-600">
        We received your delivery details and will prepare the freight quote next.
        You can return to Order Hub later to review the quote and continue payment.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-[12px] border border-black/30 bg-white p-6">
          <h2 className="text-lg font-semibold">Request Details</h2>
          <div className="mt-4 space-y-3 text-sm">
            {quoteId && (
              <p>
                <span className="text-gray-500">Quote Request</span>
                <br />
                <span className="font-medium">{quoteId}</span>
              </p>
            )}
            {email && (
              <p>
                <span className="text-gray-500">Email</span>
                <br />
                <span className="font-medium">{email}</span>
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[12px] border border-black/30 bg-white p-6">
          <h2 className="text-lg font-semibold">What Happens Next</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <p>Our team will review the route and finalize the shipping quote.</p>
            <p>The quote will appear in Order Hub and can also be sent to the customer email.</p>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={email ? `/order-hub?email=${encodeURIComponent(email)}` : '/order-hub'}
          className="inline-flex items-center justify-center rounded-[12px] bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Go to Order Hub
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-[12px] border border-black/30 px-5 py-3 text-sm font-medium"
        >
          Browse Materials
        </Link>
      </div>
    </PageFrame>
  )
}

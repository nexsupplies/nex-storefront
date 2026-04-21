import PageFrame from '@/components/PageFrame'
import Button from '@/components/ui/Button'
import PageIntro from '@/components/ui/PageIntro'
import Text from '@/components/ui/Typography'

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
        <PageIntro
          label="Shipping Quote Requested"
          title="Your out-of-city delivery request was submitted successfully."
        />
      }
    >
      <Text variant="bodyMd" className="max-w-2xl">
        We received your delivery details and will prepare the freight quote next.
        You can return to Order Hub later to review the quote and continue payment.
      </Text>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-[12px] border border-black/30 bg-white p-6">
          <Text as="h2" variant="h2Section">
            Request Details
          </Text>
          <div className="mt-4 space-y-3">
            {quoteId && (
              <p>
                <Text as="span" variant="muted">Quote Request</Text>
                <br />
                <Text as="span" variant="bodyMd" className="font-semibold text-black">{quoteId}</Text>
              </p>
            )}
            {email && (
              <p>
                <Text as="span" variant="muted">Email</Text>
                <br />
                <Text as="span" variant="bodyMd" className="font-semibold text-black">{email}</Text>
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[12px] border border-black/30 bg-white p-6">
          <Text as="h2" variant="h2Section">
            What Happens Next
          </Text>
          <div className="mt-4 space-y-3">
            <Text variant="bodySm">Our team will review the route and finalize the shipping quote.</Text>
            <Text variant="bodySm">The quote will appear in Order Hub and can also be sent to the customer email.</Text>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          href={email ? `/order-hub?email=${encodeURIComponent(email)}` : '/order-hub'}
          variant="primary"
        >
          Go to Order Hub
        </Button>
        <Button href="/products" variant="secondary">
          Browse Materials
        </Button>
      </div>
    </PageFrame>
  )
}

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
  const quoteNumber = readParam(params.quote_number)

  return (
    <PageFrame
      sidebar={
        <PageIntro
          label="Shipping Quote Submitted"
          title="Your out-of-city delivery quote was submitted successfully."
        />
      }
    >
      <Text variant="bodyMd" className="max-w-2xl">
        We received your delivery details and will prepare the freight quote next.
        You can return to Quote Hub later to review the quote and continue payment.
      </Text>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-[12px] border border-black/30 bg-white p-6">
          <Text as="h2" variant="h2Section">
            Quote Details
          </Text>
          <div className="mt-4 space-y-3">
            {quoteNumber && (
              <p>
                <Text as="span" variant="muted">Quote Number</Text>
                <br />
                <Text as="span" variant="bodyMd" className="font-semibold text-[#00AFEC]">{quoteNumber}</Text>
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
            <Text variant="bodySm">The quote will appear in Quote Hub and can also be sent to the customer email.</Text>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          href={
            quoteNumber
              ? `/order-hub?quote_number=${encodeURIComponent(quoteNumber)}`
              : '/order-hub'
          }
          variant="primary"
        >
          Go to Quote Hub
        </Button>
        <Button href="/products" variant="secondary">
          Browse Materials
        </Button>
      </div>
    </PageFrame>
  )
}

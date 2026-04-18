import PageFrame from '@/components/PageFrame'

export default function AccountPage() {
  return (
    <PageFrame
      sidebar={
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">
            Account
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Customer account tools are coming soon.
          </h1>
        </div>
      }
    >
      <div className="max-w-2xl text-base leading-8 text-gray-700">
        Saved profiles, order history, and reusable business details will be added
        here as the storefront account workflow expands.
      </div>
    </PageFrame>
  )
}

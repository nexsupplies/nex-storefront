import InventoryHubClient from '@/components/inventory-hub/InventoryHubClient'
import { getInventoryHubSnapshot } from '@/lib/inventory-hub'

export const dynamic = 'force-dynamic'

export default async function InventoryHubPage() {
  const snapshot = await getInventoryHubSnapshot()

  return <InventoryHubClient initialSnapshot={snapshot} />
}

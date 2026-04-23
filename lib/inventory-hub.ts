const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

export type InventoryHubReservation = {
  id: string
  variant_id: string
  inventory_item_id?: string | null
  location_id?: string | null
  source_type?: string | null
  source_id?: string | null
  quantity: number
  status: string
  note?: string | null
  created_by?: string | null
  released_at?: string | null
  created_at: string
}

export type InventoryHubRow = {
  row_id: string
  inventory_item_id: string
  variant_id: string
  sku: string
  material: string
  variant: string
  on_hand: number
  reserved: number
  available: number
  low_stock_threshold: number
  location_id: string
  location: string
  status: "in_stock" | "low_stock" | "out_of_stock" | "disabled"
  updated_at: string | null
  active: boolean
  medusa_reserved: number
  reservations: InventoryHubReservation[]
}

export type InventoryHubMovement = {
  id: string
  variant_id: string
  inventory_item_id?: string | null
  location_id?: string | null
  action_type: string
  quantity_change: number
  before_quantity: number
  after_quantity: number
  reason?: string | null
  source_type?: string | null
  source_id?: string | null
  operator_name?: string | null
  created_at: string
}

export type InventoryHubSnapshot = {
  inventory: InventoryHubRow[]
  movements: InventoryHubMovement[]
}

function getBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing")
  }

  return BACKEND_URL
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const parsed = JSON.parse(text)
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        message = parsed.message
      }
    } catch {}

    throw new Error(message)
  }

  return JSON.parse(text) as T
}

export async function getInventoryHubSnapshot(): Promise<InventoryHubSnapshot> {
  const response = await fetch(`${getBackendUrl()}/store/inventory-hub`, {
    cache: "no-store",
  })

  return parseResponse<InventoryHubSnapshot>(response)
}

export async function postInventoryAdjustment(input: {
  variant_id: string
  location_id: string
  quantity_change: number
  reason?: string | null
  source_type?: string | null
  source_id?: string | null
  operator_name?: string | null
}) {
  const response = await fetch(`${getBackendUrl()}/store/inventory-hub/adjust`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  return parseResponse<InventoryHubSnapshot & { ok: boolean }>(response)
}

export async function postInventoryReservation(input: {
  variant_id: string
  location_id: string
  quantity: number
  source_type?: string | null
  source_id?: string | null
  note?: string | null
  created_by?: string | null
}) {
  const response = await fetch(
    `${getBackendUrl()}/store/inventory-hub/reservations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )

  return parseResponse<
    { reservation: InventoryHubReservation } & InventoryHubSnapshot
  >(response)
}

export async function postReleaseInventoryReservation(
  reservationId: string,
  input?: {
    note?: string | null
    released_by?: string | null
  }
) {
  const response = await fetch(
    `${getBackendUrl()}/store/inventory-hub/reservations/${reservationId}/release`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input || {}),
    }
  )

  return parseResponse<
    { reservation: InventoryHubReservation } & InventoryHubSnapshot
  >(response)
}

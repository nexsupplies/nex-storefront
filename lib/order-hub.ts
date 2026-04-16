const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

const ORDER_HUB_EMAIL_KEY = "nex_order_hub_email"

function getHeaders() {
  if (!PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing")
  }

  return {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  }
}

function ensureBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing")
  }

  return BACKEND_URL
}

export type OrderHubItem = {
  id: string
  quantity: number
  title: string
  variant_title?: string | null
  product_handle?: string | null
}

export type OrderHubOrder = {
  id: string
  source: "order" | "quote_request"
  reference: string
  display_id?: string | null
  status: string
  status_label: string
  created_at?: string | null
  updated_at?: string | null
  fulfillment_mode: string
  fulfillment_label: string
  shipping_method: string
  payment_method?: string | null
  payment_status?: string | null
  payment_required: boolean
  can_prepare_payment: boolean
  quote_required: boolean
  quote_status?: string | null
  quoted_amount?: number | null
  quoted_currency_code?: string | null
  subtotal?: number | null
  shipping_total?: number | null
  tax_total?: number | null
  total?: number | null
  currency_code?: string | null
  pickup_date?: string | null
  pickup_time?: string | null
  pickup_location?: string | null
  address_summary?: string | null
  response_note?: string | null
  items: OrderHubItem[]
}

export type CreateQuoteRequestPayload = {
  request_type?: "product_quote" | "out_of_city_delivery"
  customer: {
    name: string
    email: string
    phone?: string | null
    company?: string | null
  }
  notes?: string | null
  checkout?: {
    fulfillment_mode?: string | null
    shipping_method?: string | null
    payment_method?: string | null
    region_id?: string | null
    currency_code?: string | null
    subtotal?: number | null
    shipping_total?: number | null
    tax_total?: number | null
    total?: number | null
    delivery_address?: {
      address_1: string
      city: string
      province: string
      postal_code: string
      country_code?: string | null
    } | null
    pickup?: {
      date?: string | null
      time?: string | null
      location?: string | null
    } | null
  } | null
  items: {
    variant_id: string
    quantity: number
    unit_price?: number | null
  }[]
}

export function rememberOrderHubEmail(email: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(ORDER_HUB_EMAIL_KEY, email)
}

export function getRememberedOrderHubEmail() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(ORDER_HUB_EMAIL_KEY) || ""
}

export async function createQuoteRequest(payload: CreateQuoteRequestPayload) {
  const res = await fetch(`${ensureBackendUrl()}/store/quote-requests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(text || "Failed to create quote request.")
  }

  return text ? JSON.parse(text) : {}
}

export async function listOrderHubOrders(email: string) {
  const search = new URLSearchParams({
    email,
  })

  const res = await fetch(
    `${ensureBackendUrl()}/store/order-hub/orders?${search.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    }
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(text || "Failed to load Order Hub.")
  }

  const data = text ? JSON.parse(text) : {}
  return (data.orders || []) as OrderHubOrder[]
}

export async function prepareOrderPaymentCollection(orderId: string, email: string) {
  const res = await fetch(
    `${ensureBackendUrl()}/store/order-hub/orders/${orderId}/payment-collection`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        email,
      }),
    }
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(text || "Failed to prepare payment collection.")
  }

  return text ? JSON.parse(text) : {}
}

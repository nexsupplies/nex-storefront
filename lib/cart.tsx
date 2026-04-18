const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID

const CART_KEY = 'medusa_cart_id'
export const CART_UPDATED_EVENT = 'medusa-cart-updated'

function dispatchCartUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

function ensureBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing')
  }

  return BACKEND_URL
}

function readBackendMessage(text: string) {
  if (!text.trim()) {
    return ''
  }

  try {
    const data = JSON.parse(text)
    if (typeof data?.message === 'string') {
      return data.message
    }
  } catch {}

  return text
}

function toErrorMessage(error: unknown, action: string) {
  if (error instanceof Error) {
    const message = error.message.trim()

    if (
      message === 'Failed to fetch' ||
      message.includes('fetch failed') ||
      message.includes('Load failed')
    ) {
      return `Unable to reach the Medusa backend at ${BACKEND_URL || 'the configured backend URL'}. Start the backend server and try again.`
    }

    return message
  }

  return `Failed to ${action}.`
}

function isMissingCartResponse(status: number, text: string) {
  const message = readBackendMessage(text).toLowerCase()

  if (status === 404) {
    return true
  }

  if (!message) {
    return false
  }

  return (
    message.includes('cart') &&
    (message.includes('not found') ||
      message.includes('does not exist') ||
      message.includes('no cart'))
  )
}

async function requestBackend(input: string, init: RequestInit, action: string) {
  try {
    return await fetch(input, init)
  } catch (error) {
    throw new Error(toErrorMessage(error, action))
  }
}

function getHeaders() {
  if (!PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing')
  }

  return {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
  }
}

export function getStoredCartId() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CART_KEY)
}

export function setStoredCartId(cartId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, cartId)
  dispatchCartUpdated()
}

export function clearStoredCartId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
  dispatchCartUpdated()
}

function withQuery(url: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value)
    }
  }

  const query = search.toString()
  return query ? `${url}?${query}` : url
}

async function fetchCartResponse(cartId: string, fields?: string) {
  const backendUrl = ensureBackendUrl()
  const res = await requestBackend(
    withQuery(`${backendUrl}/store/carts/${cartId}`, { fields }),
    {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    },
    'retrieve cart'
  )

  const text = await res.text()

  return {
    res,
    text,
  }
}

async function recreateStoredCart(fields?: string) {
  clearStoredCartId()
  const cart = await createCart()

  if (!fields || fields === 'id') {
    return cart
  }

  const recreated = await fetchCartResponse(cart.id, fields)

  if (!recreated.res.ok) {
    throw new Error(
      `Failed to retrieve cart: ${recreated.res.status} ${recreated.text}`
    )
  }

  return JSON.parse(recreated.text).cart
}

export async function createCart() {
  if (!REGION_ID) {
    throw new Error('NEXT_PUBLIC_MEDUSA_REGION_ID is missing')
  }

  const res = await requestBackend(`${ensureBackendUrl()}/store/carts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      region_id: REGION_ID,
    }),
  }, 'create cart')

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to create cart: ${res.status} ${text}`)
  }

  const data = JSON.parse(text)
  const cart = data.cart

  if (!cart?.id) {
    throw new Error('Cart ID missing in response')
  }

  setStoredCartId(cart.id)
  return cart
}

export async function getOrCreateCart() {
  const existingId = getStoredCartId()

  if (existingId) {
    const { res, text } = await fetchCartResponse(existingId, 'id')

    if (res.ok) {
      return existingId
    }

    if (isMissingCartResponse(res.status, text)) {
      const cart = await recreateStoredCart('id')
      return cart.id
    }

    throw new Error(`Failed to retrieve cart: ${res.status} ${text}`)
  }

  const cart = await createCart()
  return cart.id
}

export async function retrieveCart(cartId: string, fields?: string) {
  const { res, text } = await fetchCartResponse(cartId, fields)

  if (!res.ok) {
    if (isMissingCartResponse(res.status, text) && getStoredCartId() === cartId) {
      return recreateStoredCart(fields)
    }

    throw new Error(`Failed to retrieve cart: ${res.status} ${text}`)
  }

  return JSON.parse(text).cart
}

export async function listShippingOptions(cartId: string) {
  const backendUrl = ensureBackendUrl()
  const res = await requestBackend(
    withQuery(`${backendUrl}/store/shipping-options`, { cart_id: cartId }),
    {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    },
    'list shipping options'
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to list shipping options: ${res.status} ${text}`)
  }

  return JSON.parse(text).shipping_options ?? []
}

export async function addLineItem(cartId: string, variantId: string, quantity: number) {
  const res = await requestBackend(`${ensureBackendUrl()}/store/carts/${cartId}/line-items`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      variant_id: variantId,
      quantity,
    }),
  }, 'add line item')

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to add line item: ${res.status} ${text}`)
  }

  const cart = JSON.parse(text).cart
  dispatchCartUpdated()
  return cart
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number
) {
  const res = await requestBackend(
    `${ensureBackendUrl()}/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        quantity,
      }),
    },
    'update line item'
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to update line item: ${res.status} ${text}`)
  }

  const cart = JSON.parse(text).cart
  dispatchCartUpdated()
  return cart
}

export async function deleteLineItem(cartId: string, lineItemId: string) {
  const res = await requestBackend(
    `${ensureBackendUrl()}/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    },
    'delete line item'
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to delete line item: ${res.status} ${text}`)
  }

  const cart = JSON.parse(text).cart
  dispatchCartUpdated()
  return cart
}

type AddressPayload = {
  first_name?: string
  last_name?: string
  phone?: string
  address_1?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
}

type UpdateCartPayload = {
  email?: string
  shipping_address?: AddressPayload
  billing_address?: AddressPayload
  metadata?: Record<string, unknown>
}

export async function updateCart(cartId: string, payload: UpdateCartPayload) {
  const res = await requestBackend(`${ensureBackendUrl()}/store/carts/${cartId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }, 'update cart')

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to update cart: ${res.status} ${text}`)
  }

  const cart = JSON.parse(text).cart
  dispatchCartUpdated()
  return cart
}

export async function addShippingMethod(
  cartId: string,
  shippingOptionId: string
) {
  const res = await requestBackend(`${ensureBackendUrl()}/store/carts/${cartId}/shipping-methods`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      option_id: shippingOptionId,
    }),
  }, 'add shipping method')

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to add shipping method: ${res.status} ${text}`)
  }

  return JSON.parse(text).cart
}

export async function createPaymentCollection(cartId: string) {
  const res = await requestBackend(`${ensureBackendUrl()}/store/payment-collections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      cart_id: cartId,
    }),
  }, 'create payment collection')

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to create payment collection: ${res.status} ${text}`)
  }

  return JSON.parse(text).payment_collection
}

export async function initiatePaymentSession(
  paymentCollectionId: string,
  providerId: string,
  data?: Record<string, unknown>
) {
  const res = await requestBackend(
    `${ensureBackendUrl()}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        provider_id: providerId,
        data,
      }),
    },
    'initialize payment session'
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to initialize payment session: ${res.status} ${text}`)
  }

  return JSON.parse(text).payment_collection
}

export async function listPaymentProviders(regionId: string) {
  const backendUrl = ensureBackendUrl()
  const res = await requestBackend(
    withQuery(`${backendUrl}/store/payment-providers`, { region_id: regionId }),
    {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    },
    'list payment providers'
  )

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to list payment providers: ${res.status} ${text}`)
  }

  return JSON.parse(text).payment_providers ?? []
}

export async function completeCart(cartId: string) {
  const res = await requestBackend(`${ensureBackendUrl()}/store/carts/${cartId}/complete`, {
    method: 'POST',
    headers: getHeaders(),
  }, 'complete cart')

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Failed to complete cart: ${res.status} ${text}`)
  }

  return JSON.parse(text)
}

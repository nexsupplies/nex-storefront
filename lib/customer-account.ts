import type { AccountAddress, QuoteHubQuote } from './order-hub'
import {
  clearStoredCustomerToken,
  getStoredCustomerToken,
  setStoredCustomerToken,
} from './customer-session'

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

export type CustomerProfile = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  company_name?: string | null
  has_account?: boolean
  addresses?: Array<{
    id: string
    first_name?: string | null
    last_name?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    country_code?: string | null
    phone?: string | null
    is_default_shipping?: boolean | null
    is_default_billing?: boolean | null
  }> | null
  created_at?: string | null
  updated_at?: string | null
}

export type CustomerAddressInput = {
  first_name: string
  last_name?: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code?: string
  phone?: string
  address_name?: string
  is_default_shipping?: boolean
  is_default_billing?: boolean
}

export type CustomerDashboard = {
  account: CustomerProfile
  orders: QuoteHubQuote[]
  quotes: QuoteHubQuote[]
  addresses: AccountAddress[]
}

type CustomerAuthPayload = {
  email: string
  password: string
}

type CustomerRegisterPayload = CustomerAuthPayload & {
  first_name: string
  last_name?: string
  phone?: string
  company_name?: string
}

function ensureBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error('NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing')
  }

  return BACKEND_URL
}

function getStoreHeaders(token?: string | null) {
  if (!PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing')
  }

  return {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function getAuthHeaders(token?: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function parseErrorMessage(text: string, fallback: string) {
  if (!text.trim()) {
    return fallback
  }

  try {
    const parsed = JSON.parse(text)

    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
      return parsed.message
    }
  } catch {}

  return text
}

async function requestToken(
  path: string,
  payload: CustomerAuthPayload
) {
  const res = await fetch(`${ensureBackendUrl()}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(parseErrorMessage(text, 'Authentication failed.'))
  }

  const data = text ? JSON.parse(text) : {}
  const token = typeof data?.token === 'string' ? data.token : ''

  if (!token) {
    throw new Error('Authentication token missing in response.')
  }

  setStoredCustomerToken(token)
  return token
}

async function storeRequest<T>(
  path: string,
  init: RequestInit & { token?: string | null },
  fallback: string
) {
  const { token, ...requestInit } = init
  const res = await fetch(`${ensureBackendUrl()}${path}`, {
    ...requestInit,
    headers: {
      ...getStoreHeaders(token ?? getStoredCustomerToken()),
      ...(requestInit.headers || {}),
    },
  })

  const text = await res.text()

  if (res.status === 401) {
    clearStoredCustomerToken()
  }

  if (!res.ok) {
    throw new Error(parseErrorMessage(text, fallback))
  }

  return (text ? JSON.parse(text) : {}) as T
}

export function getCustomerToken() {
  return getStoredCustomerToken()
}

export async function retrieveCustomer() {
  const data = await storeRequest<{ customer: CustomerProfile }>(
    '/store/customers/me',
    {
      method: 'GET',
      cache: 'no-store',
    },
    'Failed to load customer profile.'
  )

  return data.customer
}

export async function loginCustomerAccount(payload: CustomerAuthPayload) {
  await requestToken('/auth/customer/emailpass', payload)
  return retrieveCustomer()
}

export async function registerCustomerAccount(payload: CustomerRegisterPayload) {
  const token = await requestToken('/auth/customer/emailpass/register', {
    email: payload.email,
    password: payload.password,
  })

  await storeRequest(
    '/store/customers',
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name || undefined,
        phone: payload.phone || undefined,
        company_name: payload.company_name || undefined,
      }),
    },
    'Failed to create customer account.'
  )

  await requestToken('/auth/customer/emailpass', {
    email: payload.email,
    password: payload.password,
  })

  return retrieveCustomer()
}

export async function logoutCustomerAccount() {
  clearStoredCustomerToken()
}

export async function fetchCustomerDashboard() {
  return storeRequest<CustomerDashboard>(
    '/store/customers/me/dashboard',
    {
      method: 'GET',
      cache: 'no-store',
    },
    'Failed to load account dashboard.'
  )
}

export async function createCustomerAddress(payload: CustomerAddressInput) {
  const data = await storeRequest<{ customer: CustomerProfile }>(
    '/store/customers/me/addresses',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        country_code: (payload.country_code || 'ca').toLowerCase(),
      }),
    },
    'Failed to save address.'
  )

  return data.customer
}

export function getCustomerDisplayName(customer?: CustomerProfile | null) {
  if (!customer) {
    return ''
  }

  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || customer.email
}

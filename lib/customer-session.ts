const CUSTOMER_TOKEN_KEY = 'medusa_customer_token'
export const CUSTOMER_SESSION_UPDATED_EVENT = 'medusa-customer-session-updated'

function dispatchCustomerSessionUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CUSTOMER_SESSION_UPDATED_EVENT))
}

export function getStoredCustomerToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CUSTOMER_TOKEN_KEY)
}

export function setStoredCustomerToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
  dispatchCustomerSessionUpdated()
}

export function clearStoredCustomerToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  dispatchCustomerSessionUpdated()
}

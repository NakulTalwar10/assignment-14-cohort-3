const API_BASE_URL = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`
const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Check your connection and try again.'
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.'
const REFRESH_RETRY_DELAYS_MS = [300, 1000]

let pendingRefresh = null
let getAccessToken = () => null
let onAccessTokenRefreshed = () => {}
let onSessionExpired = () => {}

export const configureApiClient = (options) => {
  getAccessToken = options.getAccessToken
  onAccessTokenRefreshed = options.onAccessTokenRefreshed
  onSessionExpired = options.onSessionExpired
}

const createApiError = (status, payload = {}) => {
  const error = new Error(payload.message || 'Something went wrong. Please try again.')
  error.status = status
  error.fieldErrors = Object.fromEntries((payload.errors || []).map(({ field, message }) => [field, message]))
  return error
}

const sendRequest = async (path, { method = 'GET', body, withAuth = false } = {}) => {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const accessToken = getAccessToken()
  if (withAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    })
  } catch {
    throw createApiError(0, { message: NETWORK_ERROR_MESSAGE })
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw createApiError(response.status, payload)
  }

  return payload
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 409 means another tab rotated the refresh cookie at the same moment; retrying sends the new cookie.
const requestRefresh = async () => {
  for (const delay of REFRESH_RETRY_DELAYS_MS) {
    try {
      return await sendRequest('/auth/refresh-token', { method: 'POST' })
    } catch (error) {
      if (error.status !== 409) throw error
      await wait(delay)
    }
  }

  return sendRequest('/auth/refresh-token', { method: 'POST' })
}

export const refreshAccessToken = () => {
  if (!pendingRefresh) {
    pendingRefresh = requestRefresh()
      .then(({ data }) => {
        onAccessTokenRefreshed(data.accessToken)
        return data.accessToken
      })
      .finally(() => {
        pendingRefresh = null
      })
  }

  return pendingRefresh
}

export const apiRequest = async (path, options = {}) => {
  if (!options.withAuth) {
    return sendRequest(path, options)
  }

  try {
    return await sendRequest(path, options)
  } catch (error) {
    if (error.status !== 401) throw error
  }

  try {
    await refreshAccessToken()
  } catch (refreshError) {
    if (refreshError.status !== 401 && refreshError.status !== 403) throw refreshError
    onSessionExpired()
    throw createApiError(401, { message: SESSION_EXPIRED_MESSAGE })
  }

  return sendRequest(path, options)
}

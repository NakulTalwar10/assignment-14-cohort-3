import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { apiRequest, configureApiClient, refreshAccessToken } from './client.js'

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const tokenResponse = (accessToken) => jsonResponse(200, { success: true, data: { accessToken } })

let accessToken
let onSessionExpired

beforeEach(() => {
  accessToken = 'old-token'
  onSessionExpired = vi.fn()
  configureApiClient({
    getAccessToken: () => accessToken,
    onAccessTokenRefreshed: (token) => {
      accessToken = token
    },
    onSessionExpired,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('refreshAccessToken', () => {
  test('retries after a 409 caused by another tab rotating the cookie', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(409, { success: false, message: 'Retry' }))
      .mockResolvedValueOnce(tokenResponse('new-token'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(refreshAccessToken()).resolves.toBe('new-token')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include')
    expect(accessToken).toBe('new-token')
  })

  test('shares one request between concurrent callers in the same tab', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse('new-token'))
    vi.stubGlobal('fetch', fetchMock)

    const tokens = await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(tokens).toEqual(['new-token', 'new-token'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('apiRequest with auth', () => {
  test('refreshes an expired access token and replays the request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Access token expired' }))
      .mockResolvedValueOnce(tokenResponse('new-token'))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { ok: true } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiRequest('/auth/me', { withAuth: true })

    expect(result.data.ok).toBe(true)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer old-token')
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-token')
  })

  test('reports an expired session when the refresh token is rejected', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Access token expired' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Refresh session is invalid' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/auth/me', { withAuth: true })).rejects.toMatchObject({ status: 401 })
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  test('maps field-level validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, { message: 'Validation failed', errors: [{ field: 'price', message: 'Price is required' }] }),
      ),
    )

    await expect(apiRequest('/products', { method: 'POST', body: {}, withAuth: true })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { price: 'Price is required' },
    })
  })
})

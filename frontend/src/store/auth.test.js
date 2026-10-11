import { afterEach, describe, expect, test, vi } from 'vitest'

import { createAppStore } from './store.js'
import { initializeSession, login, logout } from './authThunks.js'

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const user = { id: '1', name: 'Test User', email: 'test@example.com' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth state', () => {
  test('restores the session on page load from the refresh cookie', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(200, { data: { accessToken: 'access-1' } }))
        .mockResolvedValueOnce(jsonResponse(200, { data: { user } })),
    )
    const store = createAppStore()

    await store.dispatch(initializeSession())

    expect(store.getState().auth).toMatchObject({
      user,
      accessToken: 'access-1',
      isAuthenticated: true,
      isInitialized: true,
    })
  })

  test('treats a missing or invalid refresh cookie as logged out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Refresh token is required' })))
    const store = createAppStore()

    await store.dispatch(initializeSession())

    expect(store.getState().auth).toMatchObject({ user: null, accessToken: null, isAuthenticated: false, isInitialized: true })
  })

  test('keeps the access token in memory only and clears it on logout', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { user, accessToken: 'access-1' } }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true }))
    vi.stubGlobal('fetch', fetchMock)
    const store = createAppStore()

    await store.dispatch(login({ email: user.email, password: 'Str0ngPassword' }))
    expect(store.getState().auth.accessToken).toBe('access-1')
    expect(globalThis.localStorage?.length ?? 0).toBe(0)

    await store.dispatch(logout())

    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer access-1')
    expect(store.getState().auth).toMatchObject({ user: null, accessToken: null, isAuthenticated: false })
  })

  test('surfaces invalid-credential errors from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Invalid email or password' })),
    )
    const store = createAppStore()

    const result = await store.dispatch(login({ email: user.email, password: 'wrong' }))

    expect(result.payload).toMatchObject({ status: 401, message: 'Invalid email or password' })
    expect(store.getState().auth).toMatchObject({ error: 'Invalid email or password', isAuthenticated: false })
  })
})

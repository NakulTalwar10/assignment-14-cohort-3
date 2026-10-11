import { configureStore } from '@reduxjs/toolkit'

import { configureApiClient } from '../api/client.js'
import authReducer, { accessTokenRefreshed, sessionExpired } from './authSlice.js'

export const createAppStore = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
  })

  configureApiClient({
    getAccessToken: () => store.getState().auth.accessToken,
    onAccessTokenRefreshed: (accessToken) => store.dispatch(accessTokenRefreshed(accessToken)),
    onSessionExpired: () => store.dispatch(sessionExpired()),
  })

  return store
}

export const store = createAppStore()

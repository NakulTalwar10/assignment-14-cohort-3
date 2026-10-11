import { createSlice } from '@reduxjs/toolkit'

import { getCurrentUser, initializeSession, login, logout, register } from './authThunks.js'

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.'

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
}

const clearSession = (state) => {
  state.user = null
  state.accessToken = null
  state.isAuthenticated = false
  state.isLoading = false
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    accessTokenRefreshed(state, action) {
      state.accessToken = action.payload
    },
    sessionExpired(state) {
      clearSession(state)
      state.error = SESSION_EXPIRED_MESSAGE
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.isInitialized = true
      })
      .addCase(initializeSession.rejected, (state) => {
        clearSession(state)
        state.isInitialized = true
      })

      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload.message
      })

      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload.message
      })

      .addCase(logout.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logout.fulfilled, (state) => {
        clearSession(state)
        state.error = null
      })
      .addCase(logout.rejected, (state, action) => {
        if (action.payload.status === 401) {
          clearSession(state)
          state.error = null
        } else {
          state.isLoading = false
        }
      })

      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { accessTokenRefreshed, sessionExpired, clearAuthError } = authSlice.actions

export default authSlice.reducer

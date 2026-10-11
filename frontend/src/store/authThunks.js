import { createAsyncThunk } from '@reduxjs/toolkit'

import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../api/auth.js'
import { refreshAccessToken } from '../api/client.js'

const toErrorPayload = (error) => ({
  message: error.message,
  status: error.status,
  fieldErrors: error.fieldErrors || {},
})

export const initializeSession = createAsyncThunk('auth/initializeSession', async (_, { rejectWithValue }) => {
  try {
    const accessToken = await refreshAccessToken()
    const user = await fetchCurrentUser()
    return { accessToken, user }
  } catch (error) {
    return rejectWithValue(toErrorPayload(error))
  }
})

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await loginUser(credentials)
  } catch (error) {
    return rejectWithValue(toErrorPayload(error))
  }
})

export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try {
    return await registerUser(details)
  } catch (error) {
    return rejectWithValue(toErrorPayload(error))
  }
})

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutUser()
  } catch (error) {
    return rejectWithValue(toErrorPayload(error))
  }
})

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    return await fetchCurrentUser()
  } catch (error) {
    return rejectWithValue(toErrorPayload(error))
  }
})

import { apiRequest } from './client.js'

export const registerUser = async (details) => {
  const { data } = await apiRequest('/auth/register', { method: 'POST', body: details })
  return data.user
}

export const loginUser = async (credentials) => {
  const { data } = await apiRequest('/auth/login', { method: 'POST', body: credentials })
  return data
}

export const fetchCurrentUser = async () => {
  const { data } = await apiRequest('/auth/me', { withAuth: true })
  return data.user
}

export const logoutUser = async () => {
  await apiRequest('/auth/logout', { method: 'POST', withAuth: true })
}

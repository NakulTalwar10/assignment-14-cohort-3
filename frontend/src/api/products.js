import { apiRequest } from './client.js'

const productPath = (productId) => `/products/${encodeURIComponent(productId)}`

export const fetchProducts = async ({ page, limit }) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  const { data } = await apiRequest(`/products?${query}`)
  return data
}

export const fetchProduct = async (productId) => {
  const { data } = await apiRequest(productPath(productId))
  return data.product
}

export const createProduct = async (product) => {
  const { data } = await apiRequest('/products', { method: 'POST', body: product, withAuth: true })
  return data.product
}

export const updateProduct = async (productId, updates) => {
  const { data } = await apiRequest(productPath(productId), { method: 'PUT', body: updates, withAuth: true })
  return data.product
}

export const deleteProduct = async (productId) => {
  const { message } = await apiRequest(productPath(productId), { method: 'DELETE', withAuth: true })
  return message
}

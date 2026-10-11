const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
const dateFormatter = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })

const LOW_STOCK_THRESHOLD = 5

export const formatPrice = (price) => priceFormatter.format(price)

export const formatDate = (value) => dateFormatter.format(new Date(value))

export const describeStock = (stock) => {
  if (stock === 0) return { label: 'Out of stock', tone: 'bg-rose-100 text-rose-800' }
  if (stock <= LOW_STOCK_THRESHOLD) return { label: `Only ${stock} left`, tone: 'bg-amber-100 text-amber-800' }
  return { label: `${stock} in stock`, tone: 'bg-emerald-100 text-emerald-800' }
}

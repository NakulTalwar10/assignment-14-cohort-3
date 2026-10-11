const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const checkLength = (value, label, min, max) => {
  const length = value.trim().length
  if (length === 0) return `${label} is required`
  if (length < min || length > max) return `${label} must be between ${min} and ${max} characters`
  return null
}

const checkEmail = (email) => {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email'
  return null
}

const checkPassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 8 || password.length > 128) return 'Password must be 8-128 characters'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include an uppercase letter, a lowercase letter, and a number'
  }
  return null
}

const checkNumber = (value, label, max, wholeNumber) => {
  if (value.trim() === '') return `${label} is required`
  const number = Number(value)
  if (Number.isNaN(number)) return `${label} must be a number`
  if (number < 0) return `${label} cannot be negative`
  if (number > max) return `${label} cannot exceed ${max.toLocaleString()}`
  if (wholeNumber && !Number.isInteger(number)) return `${label} must be a whole number`
  return null
}

const removeEmpty = (errors) => {
  const result = {}
  for (const field in errors) {
    if (errors[field]) result[field] = errors[field]
  }
  return result
}

export const validateLoginForm = (form) => {
  return removeEmpty({
    email: checkEmail(form.email),
    password: form.password ? null : 'Password is required',
  })
}

export const validateRegisterForm = (form) => {
  let confirmPassword = null
  if (!form.confirmPassword) confirmPassword = 'Please confirm your password'
  else if (form.confirmPassword !== form.password) confirmPassword = 'Passwords do not match'

  return removeEmpty({
    name: checkLength(form.name, 'Name', 2, 100),
    email: checkEmail(form.email),
    password: checkPassword(form.password),
    confirmPassword,
  })
}

export const validateProductForm = (form) => {
  return removeEmpty({
    name: checkLength(form.name, 'Name', 2, 120),
    description: checkLength(form.description, 'Description', 10, 2000),
    price: checkNumber(form.price, 'Price', 10000000, false),
    stock: checkNumber(form.stock, 'Stock', 1000000, true),
    category: checkLength(form.category, 'Category', 2, 60),
  })
}

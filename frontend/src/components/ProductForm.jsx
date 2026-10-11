import { useState } from 'react'
import { Link } from 'react-router'

import { validateProductForm } from '../utils/validation.js'
import Alert from './Alert.jsx'
import FormField from './FormField.jsx'
import { buttonStyles } from './ui.js'

const ProductForm = ({ product, submitLabel, cancelTo, onSubmit }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    category: product?.category || '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const validationErrors = validateProductForm(form)
    setErrors(validationErrors)
    setServerError('')
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category.trim(),
      })
    } catch (error) {
      setErrors(error.fieldErrors)
      setServerError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Alert tone="error">{serverError}</Alert>
      <FormField id="name" label="Name" value={form.name} onChange={handleChange} error={errors.name} maxLength={120} />
      <FormField
        id="description"
        label="Description"
        value={form.description}
        onChange={handleChange}
        error={errors.description}
        hint="At least 10 characters."
        multiline
        rows={5}
        maxLength={2000}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="price"
          label="Price (INR)"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          error={errors.price}
        />
        <FormField
          id="stock"
          label="Stock"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={handleChange}
          error={errors.stock}
        />
      </div>
      <FormField
        id="category"
        label="Category"
        value={form.category}
        onChange={handleChange}
        error={errors.category}
        maxLength={60}
      />
      <div className="flex justify-end gap-2">
        <Link to={cancelTo} className={buttonStyles.secondary}>
          Cancel
        </Link>
        <button type="submit" className={buttonStyles.primary} disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default ProductForm

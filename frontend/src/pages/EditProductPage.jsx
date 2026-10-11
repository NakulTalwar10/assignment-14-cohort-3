import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { fetchProduct, updateProduct } from '../api/products.js'
import Alert from '../components/Alert.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ProductForm from '../components/ProductForm.jsx'
import { cardStyles } from '../components/ui.js'

const EditProductPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    fetchProduct(id)
      .then((data) => {
        if (ignore) return
        setProduct(data)
        setError('')
      })
      .catch((err) => {
        if (!ignore) setError(err.fieldErrors.id || err.message)
      })

    return () => {
      ignore = true
    }
  }, [id])

  const handleUpdate = async (updates) => {
    await updateProduct(id, updates)
    navigate(`/products/${id}`, { state: { message: 'Product updated successfully.' } })
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Alert tone="error">{error}</Alert>
        <Link to="/" className="font-medium text-indigo-600 hover:underline">
          Back to products
        </Link>
      </section>
    )
  }

  if (!product || product._id !== id) return <LoadingState label="Loading product…" />

  return (
    <section className={`${cardStyles} mx-auto max-w-2xl p-6 sm:p-8`}>
      <h1 className="text-2xl font-bold">Edit product</h1>
      <div className="mt-6">
        <ProductForm
          key={product._id}
          product={product}
          submitLabel="Save changes"
          cancelTo={`/products/${product._id}`}
          onSubmit={handleUpdate}
        />
      </div>
    </section>
  )
}

export default EditProductPage

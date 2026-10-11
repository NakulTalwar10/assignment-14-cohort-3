import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { deleteProduct, fetchProduct } from '../api/products.js'
import Alert from '../components/Alert.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { buttonStyles, cardStyles } from '../components/ui.js'
import { describeStock, formatDate, formatPrice } from '../utils/format.js'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return

    setDeleting(true)
    setDeleteError('')
    try {
      const message = await deleteProduct(product._id)
      navigate('/', { state: { message } })
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
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

  const stock = describeStock(product.stock)

  return (
    <section className="space-y-6">
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to products
      </Link>

      <Alert>{location.state?.message}</Alert>
      <Alert tone="error">{deleteError}</Alert>

      <article className={`${cardStyles} p-6 sm:p-8`}>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{product.category}</span>
          <span className={`rounded-full px-2.5 py-0.5 ${stock.tone}`}>{stock.label}</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>
        <p className="mt-3 text-2xl font-semibold">{formatPrice(product.price)}</p>
        <p className="mt-6 whitespace-pre-line text-slate-700">{product.description}</p>
        <dl className="mt-8 grid gap-4 border-t border-slate-200 pt-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Units in stock</dt>
            <dd className="font-medium">{product.stock}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Added</dt>
            <dd className="font-medium">{formatDate(product.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Last updated</dt>
            <dd className="font-medium">{formatDate(product.updatedAt)}</dd>
          </div>
        </dl>
        {isAuthenticated && (
          <div className="mt-8 flex gap-2">
            <Link to={`/products/${product._id}/edit`} className={buttonStyles.secondary}>
              Edit product
            </Link>
            <button type="button" className={buttonStyles.danger} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete product'}
            </button>
          </div>
        )}
      </article>
    </section>
  )
}

export default ProductDetailPage

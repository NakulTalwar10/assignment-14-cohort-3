import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useSearchParams } from 'react-router'

import { deleteProduct, fetchProducts } from '../api/products.js'
import Alert from '../components/Alert.jsx'
import LoadingState from '../components/LoadingState.jsx'
import Pagination from '../components/Pagination.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { buttonStyles } from '../components/ui.js'

const PAGE_SIZE = 12

const ProductsPage = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1)

  const [products, setProducts] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState(
    location.state?.message ? { tone: 'success', text: location.state.message } : null,
  )

  useEffect(() => {
    let ignore = false

    fetchProducts({ page, limit: PAGE_SIZE })
      .then((data) => {
        if (ignore) return
        setProducts(data.products)
        setTotalPages(data.pagination.totalPages)
        setError('')
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [page, reloadCount])

  const goToPage = (nextPage) => {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {})
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return

    setDeletingId(product._id)
    try {
      const message = await deleteProduct(product._id)
      setNotice({ tone: 'success', text: message })
      if (products.length === 1 && page > 1) {
        goToPage(page - 1)
      } else {
        setReloadCount((count) => count + 1)
      }
    } catch (err) {
      setNotice({ tone: 'error', text: err.message })
    }
    setDeletingId(null)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Products</h1>
        {isAuthenticated && (
          <Link to="/products/new" className={buttonStyles.primary}>
            Add product
          </Link>
        )}
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      {loading && <LoadingState label="Loading products…" />}

      {!loading && error && (
        <div className="space-y-3">
          <Alert tone="error">{error}</Alert>
          <button type="button" className={buttonStyles.secondary} onClick={() => setReloadCount((count) => count + 1)}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
          <p>No products found.</p>
          {page > 1 && (
            <Link to="/" className="mt-3 inline-block font-medium text-indigo-600 hover:underline">
              Go to the first page
            </Link>
          )}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                canManage={isAuthenticated}
                isDeleting={deletingId === product._id}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}
    </section>
  )
}

export default ProductsPage

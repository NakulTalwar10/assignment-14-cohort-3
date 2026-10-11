import { Link } from 'react-router'

import { describeStock, formatPrice } from '../utils/format.js'
import { buttonStyles, cardStyles } from './ui.js'

const ProductCard = ({ product, canManage, isDeleting, onDelete }) => {
  const stock = describeStock(product.stock)

  return (
    <article className={`${cardStyles} flex flex-col p-5`}>
      <div className="flex items-start justify-between gap-3 text-xs font-medium">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{product.category}</span>
        <span className={`rounded-full px-2.5 py-0.5 ${stock.tone}`}>{stock.label}</span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">
        <Link to={`/products/${product._id}`} className="hover:text-indigo-600">
          {product.name}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{product.description}</p>
      <p className="mt-4 text-xl font-bold">{formatPrice(product.price)}</p>
      {canManage && (
        <div className="mt-4 flex gap-2">
          <Link to={`/products/${product._id}/edit`} className={buttonStyles.secondary}>
            Edit
          </Link>
          <button
            type="button"
            className={buttonStyles.danger}
            onClick={() => onDelete(product)}
            disabled={isDeleting}
            aria-label={`Delete ${product.name}`}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}
    </article>
  )
}

export default ProductCard

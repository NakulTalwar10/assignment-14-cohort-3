import { buttonStyles } from './ui.js'

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Product pages" className="flex items-center justify-center gap-3">
      <button
        type="button"
        className={buttonStyles.secondary}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span className="text-sm text-slate-600" aria-current="page">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className={buttonStyles.secondary}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  )
}

export default Pagination

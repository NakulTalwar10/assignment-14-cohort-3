import { Link } from 'react-router'

import { buttonStyles, cardStyles } from '../components/ui.js'

const NotFoundPage = () => {
  return (
    <section className={`${cardStyles} mx-auto max-w-lg space-y-4 p-8 text-center`}>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">The page you are looking for does not exist.</p>
      <Link to="/" className={buttonStyles.primary}>
        Back to products
      </Link>
    </section>
  )
}

export default NotFoundPage

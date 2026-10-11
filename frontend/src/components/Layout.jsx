import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'

import { logout } from '../store/authThunks.js'
import Alert from './Alert.jsx'
import { buttonStyles } from './ui.js'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`

const Layout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, isInitialized, isLoading } = useSelector((state) => state.auth)
  const [logoutError, setLogoutError] = useState('')

  const handleLogout = async () => {
    setLogoutError('')
    const result = await dispatch(logout())

    if (logout.fulfilled.match(result) || result.payload.status === 401) {
      navigate('/login', { replace: true, state: { message: 'You have been logged out.' } })
    } else {
      setLogoutError(result.payload.message)
    }
  }

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-bold text-indigo-600">
            Small Ecommerce
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Products
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/products/new" className={navLinkClass}>
                  Add product
                </NavLink>
                <NavLink to="/account" className={navLinkClass}>
                  {user.name}
                </NavLink>
                <button type="button" className={buttonStyles.ghost} onClick={handleLogout} disabled={isLoading}>
                  {isLoading ? 'Logging out…' : 'Log out'}
                </button>
              </>
            )}
            {isInitialized && !isAuthenticated && (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Log in
                </NavLink>
                <Link to="/register" className={buttonStyles.primary}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Alert tone="error">{logoutError}</Alert>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router'

import LoadingState from './LoadingState.jsx'

export const ProtectedRoute = () => {
  const { isInitialized, isAuthenticated, error } = useSelector((state) => state.auth)
  const location = useLocation()

  if (!isInitialized) return <LoadingState label="Checking your session…" />

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/login" replace state={{ from, message: error }} />
  }

  return <Outlet />
}

export const GuestRoute = () => {
  const { isInitialized, isAuthenticated } = useSelector((state) => state.auth)
  const location = useLocation()

  if (!isInitialized) return <LoadingState label="Checking your session…" />
  if (isAuthenticated) return <Navigate to={location.state?.from || '/'} replace />

  return <Outlet />
}

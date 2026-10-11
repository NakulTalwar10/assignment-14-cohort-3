import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router'

import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import { buttonStyles, cardStyles } from '../components/ui.js'
import { clearAuthError } from '../store/authSlice.js'
import { login } from '../store/authThunks.js'
import { validateLoginForm } from '../utils/validation.js'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    return () => {
      dispatch(clearAuthError())
    }
  }, [dispatch])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLoading) return

    const validationErrors = validateLoginForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      dispatch(clearAuthError())
      return
    }

    const result = await dispatch(login({ email: form.email.trim(), password: form.password }))

    if (login.fulfilled.match(result)) {
      navigate(location.state?.from || '/', { replace: true })
    } else {
      setErrors(result.payload.fieldErrors)
    }
  }

  return (
    <section className={`${cardStyles} mx-auto max-w-md p-6 sm:p-8`}>
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {error ? <Alert tone="error">{error}</Alert> : <Alert>{location.state?.message}</Alert>}
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <button type="submit" className={`${buttonStyles.primary} w-full`} disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </section>
  )
}

export default LoginPage

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'

import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import { buttonStyles, cardStyles } from '../components/ui.js'
import { clearAuthError } from '../store/authSlice.js'
import { register } from '../store/authThunks.js'
import { validateRegisterForm } from '../utils/validation.js'

const RegisterPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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

    const validationErrors = validateRegisterForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      dispatch(clearAuthError())
      return
    }

    const result = await dispatch(register({ ...form, name: form.name.trim(), email: form.email.trim() }))

    if (register.fulfilled.match(result)) {
      navigate('/login', { state: { message: 'Account created. Please log in.', email: result.payload.email } })
    } else {
      setErrors(result.payload.fieldErrors)
    }
  }

  return (
    <section className={`${cardStyles} mx-auto max-w-md p-6 sm:p-8`}>
      <h1 className="text-2xl font-bold">Create an account</h1>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <Alert tone="error">{error}</Alert>
        <FormField
          id="name"
          label="Name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          maxLength={100}
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint="At least 8 characters with uppercase, lowercase, and a number."
          maxLength={128}
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          maxLength={128}
        />
        <button type="submit" className={`${buttonStyles.primary} w-full`} disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </section>
  )
}

export default RegisterPage

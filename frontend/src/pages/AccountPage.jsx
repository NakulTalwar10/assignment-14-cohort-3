import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { cardStyles } from '../components/ui.js'
import { getCurrentUser } from '../store/authThunks.js'
import { formatDate } from '../utils/format.js'

const AccountPage = () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    dispatch(getCurrentUser())
  }, [dispatch])

  return (
    <section className={`${cardStyles} mx-auto max-w-xl p-6 sm:p-8`}>
      <h1 className="text-2xl font-bold">Your account</h1>
      <dl className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-slate-500">Name</dt>
          <dd className="font-medium sm:col-span-2">{user.name}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-slate-500">Email</dt>
          <dd className="break-all font-medium sm:col-span-2">{user.email}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-slate-500">Member since</dt>
          <dd className="font-medium sm:col-span-2">{formatDate(user.createdAt)}</dd>
        </div>
      </dl>
    </section>
  )
}

export default AccountPage

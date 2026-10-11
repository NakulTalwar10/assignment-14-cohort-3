const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
}

const Alert = ({ tone = 'success', children }) => {
  if (!children) return null

  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`}>
      {children}
    </p>
  )
}

export default Alert

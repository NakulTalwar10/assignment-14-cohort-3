const inputBase =
  'block w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0'

const FormField = ({ id, label, error, hint, multiline = false, ...inputProps }) => {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  let describedBy
  if (error) describedBy = errorId
  else if (hint) describedBy = hintId
  const stateClasses = error ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-300 focus:outline-indigo-500'
  const Control = multiline ? 'textarea' : 'input'

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <Control
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${inputBase} ${stateClasses}`}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField

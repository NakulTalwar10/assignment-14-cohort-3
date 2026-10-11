const LoadingState = ({ label = 'Loading…' }) => {
  return (
    <p role="status" className="py-16 text-center text-slate-500">
      {label}
    </p>
  )
}

export default LoadingState

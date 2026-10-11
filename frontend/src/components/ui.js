const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

export const buttonStyles = {
  primary: `${buttonBase} bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600`,
  secondary: `${buttonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400`,
  danger: `${buttonBase} bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-600`,
  ghost: `${buttonBase} text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400`,
}

export const cardStyles = 'rounded-2xl border border-slate-200 bg-white shadow-sm'

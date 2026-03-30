type SpinnerSize = 'sm' | 'md' | 'lg'
type SpinnerColor = 'current' | 'blue' | 'white'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  label?: string
  centered?: boolean
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

const colorStyles: Record<SpinnerColor, string> = {
  current: 'border-current/30 border-t-current',
  blue: 'border-blue-200 border-t-blue-600',
  white: 'border-white/30 border-t-white',
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  label,
  centered = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <span className="inline-flex items-center gap-2 text-base text-slate-600" role="status" aria-live="polite">
      <span className={`animate-spin rounded-full ${sizeStyles[size]} ${colorStyles[color]}`} />
      {label ? <span>{label}</span> : null}
    </span>
  )

  if (!centered) {
    return spinner
  }

  return <div className="flex items-center justify-center py-10">{spinner}</div>
}


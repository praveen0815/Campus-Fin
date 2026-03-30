type AppStatus = 'available' | 'booked' | 'cancelled' | 'confirmed' | 'pending' | 'disabled'

interface StatusBadgeProps {
  status: AppStatus | string
  className?: string
}

const statusStyles: Record<AppStatus, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  booked: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-blue-100 text-blue-700',
  disabled: 'bg-slate-200 text-slate-700',
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = status.toLowerCase() as AppStatus
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1)
  const style = statusStyles[normalized] ?? 'bg-slate-200 text-slate-700'

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${style} ${className}`}>
      {label}
    </span>
  )
}


import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function Card({ children, hoverable = false, className = '', ...props }: CardProps) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all ${hoverable ? 'hover:scale-105 hover:shadow-lg' : ''} ${className}`}
      {...props}
    >
      {children}
    </article>
  )
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

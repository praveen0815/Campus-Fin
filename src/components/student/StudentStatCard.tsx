import type { ReactNode } from 'react'

interface StudentStatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  tone?: 'slate' | 'cyan' | 'emerald' | 'amber'
}

const toneClass: Record<NonNullable<StudentStatCardProps['tone']>, string> = {
  slate: 'bg-slate-50 text-slate-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function StudentStatCard({ label, value, icon, tone = 'slate' }: StudentStatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </article>
  )
}

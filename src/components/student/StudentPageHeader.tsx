interface StudentPageHeaderProps {
  title: string
  subtitle?: string
}

export function StudentPageHeader({ title, subtitle }: StudentPageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">{subtitle}</p> : null}
    </header>
  )
}

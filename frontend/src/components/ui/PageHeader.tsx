import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-semibold text-title">{title}</h1>
      {subtitle ? <p className="muted mt-1 max-w-3xl text-sm">{subtitle}</p> : null}
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}

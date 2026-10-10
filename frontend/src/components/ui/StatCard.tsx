interface StatCardProps {
  label: string
  value: string
  hint?: string
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="card min-w-0 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-title">{value}</p>
      {hint ? <p className="mt-1 text-xs muted">{hint}</p> : null}
    </div>
  )
}

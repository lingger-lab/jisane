export function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number | string
  unit: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface p-4 text-center shadow-sm card-hover">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold ${color}`}>
        {value}
        <span className="text-sm font-normal text-text-muted">{unit}</span>
      </p>
    </div>
  )
}

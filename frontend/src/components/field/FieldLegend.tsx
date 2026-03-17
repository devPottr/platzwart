import type { Booking } from '../../types'

interface FieldLegendProps {
  bookings: Booking[]
}

export function FieldLegend({ bookings }: FieldLegendProps) {
  const teams = new Map<string, string>()
  for (const b of bookings) {
    if (b.teamName && b.teamColor) {
      teams.set(b.teamName, b.teamColor)
    }
  }

  if (teams.size === 0) return null

  return (
    <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
      {[...teams.entries()].map(([name, color]) => (
        <div key={name} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-border-subtle" style={{ backgroundColor: color }} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  )
}
